import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { fetchAdminLanguageSetting } from "../lib/adminApi";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_META,
  SUPPORTED_LANGUAGES,
  formatWithTemplate,
  translateLabel,
} from "../i18n/translations";

const LANGUAGE_STORAGE_KEY = "pm-app-language";

const LanguageContext = createContext(null);

const textNodeOriginals = new WeakMap();
// Tracks the last value *we* wrote to a text node, so we can tell our own
// translation writes (which re-trigger the MutationObserver) apart from a
// legitimate content change made by the app (e.g. a live counter updating).
const textNodeLastTranslated = new WeakMap();

const getStoredLanguage = () => {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return SUPPORTED_LANGUAGES.includes(stored) ? stored : DEFAULT_LANGUAGE;
};

const preserveSpacing = (originalText, translatedText) => {
  const leading = originalText.match(/^\s*/)?.[0] || "";
  const trailing = originalText.match(/\s*$/)?.[0] || "";
  const coreOriginal = originalText.trim();
  if (!coreOriginal) return originalText;
  return `${leading}${translatedText}${trailing}`;
};

const translateNodeText = (node, language) => {
  const currentValue = node.nodeValue || "";
  const lastTranslated = textNodeLastTranslated.get(node);

  // If the node's current text isn't what we last wrote to it, something
  // else (React re-rendering with new content, e.g. a live count) changed
  // it since - treat that new text as the fresh source value instead of
  // clinging to whatever this node happened to show the first time we saw it.
  if (lastTranslated === undefined || lastTranslated !== currentValue) {
    textNodeOriginals.set(node, currentValue);
  }

  const originalValue = textNodeOriginals.get(node) || "";
  const trimmedOriginal = originalValue.trim();
  if (!trimmedOriginal) return;

  const translated = preserveSpacing(
    originalValue,
    translateLabel(trimmedOriginal, language)
  );

  textNodeLastTranslated.set(node, translated);
  if (node.nodeValue !== translated) {
    node.nodeValue = translated;
  }
};

const translateAttribute = (element, attribute, language) => {
  const value = element.getAttribute(attribute);
  if (!value) return;

  const originalAttrKey = `data-i18n-original-${attribute}`;
  const originalValue = element.getAttribute(originalAttrKey) || value;
  if (!element.getAttribute(originalAttrKey)) {
    element.setAttribute(originalAttrKey, originalValue);
  }

  const translated = translateLabel(originalValue, language);
  if (translated !== value) {
    element.setAttribute(attribute, translated);
  }
};

const shouldSkipElement = (element) => {
  const tagName = element.tagName?.toLowerCase();
  return (
    element.closest("[data-no-translate='true']") ||
    ["script", "style", "svg", "path", "code", "pre", "textarea"].includes(tagName)
  );
};

const translateDomTree = (rootNode, language) => {
  if (!rootNode) return;

  if (rootNode.nodeType === Node.TEXT_NODE) {
    translateNodeText(rootNode, language);
    return;
  }

  if (rootNode.nodeType !== Node.ELEMENT_NODE) return;

  const element = rootNode;
  if (shouldSkipElement(element)) return;

  translateAttribute(element, "placeholder", language);
  translateAttribute(element, "title", language);
  translateAttribute(element, "aria-label", language);

  Array.from(element.childNodes).forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      translateNodeText(child, language);
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      translateDomTree(child, language);
    }
  });
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const observerRef = useRef(null);

  const applyDocumentLanguage = useCallback((nextLanguage) => {
    const meta = LANGUAGE_META[nextLanguage] || LANGUAGE_META[DEFAULT_LANGUAGE];
    document.documentElement.lang = meta.code;
    document.documentElement.dir = meta.dir;
    document.body.setAttribute("data-app-language", nextLanguage);
  }, []);

  const setLanguage = useCallback((nextLanguage) => {
    const resolvedLanguage = SUPPORTED_LANGUAGES.includes(nextLanguage)
      ? nextLanguage
      : DEFAULT_LANGUAGE;

    setLanguageState(resolvedLanguage);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, resolvedLanguage);
    applyDocumentLanguage(resolvedLanguage);
  }, [applyDocumentLanguage]);

  const t = useCallback(
    (text, replacements = {}) => {
      const translated = translateLabel(text, language);
      return formatWithTemplate(translated, replacements);
    },
    [language]
  );

  useEffect(() => {
    const initialLanguage = getStoredLanguage();
    setLanguageState(initialLanguage);
    applyDocumentLanguage(initialLanguage);

    let mounted = true;

    const hydrateFromServer = async () => {
      try {
        const response = await fetchAdminLanguageSetting();
        const remoteLanguage = String(response?.value || "").toUpperCase();
        if (mounted && SUPPORTED_LANGUAGES.includes(remoteLanguage)) {
          setLanguageState(remoteLanguage);
          localStorage.setItem(LANGUAGE_STORAGE_KEY, remoteLanguage);
          applyDocumentLanguage(remoteLanguage);
        }
      } catch {
        // Fall back to stored preference silently.
      }
    };

    hydrateFromServer();

    return () => {
      mounted = false;
    };
  }, [applyDocumentLanguage]);

  useEffect(() => {
    translateDomTree(document.body, language);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "characterData") {
          translateDomTree(mutation.target, language);
          return;
        }

        mutation.addedNodes.forEach((node) => {
          translateDomTree(node, language);
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    observerRef.current = observer;

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      supportedLanguages: SUPPORTED_LANGUAGES,
    }),
    [language, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};


import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { LanguageProvider } from "./context/LanguageContext.jsx";

if (typeof window !== "undefined") {
  const isBrowserExtensionRejection = (reason) => {
    if (!reason || typeof reason !== "object") return false;

    const isPlainObject =
      Object.getPrototypeOf(reason) === Object.prototype ||
      Object.getPrototypeOf(reason) === null;

    const hasExtensionErrorShape =
      reason.name === "n" ||
      "httpError" in reason ||
      "httpStatus" in reason ||
      "httpStatusText" in reason ||
      "code" in reason;

    const hasAppErrorShape =
      reason instanceof Error ||
      typeof reason.stack === "string" ||
      typeof reason.message === "string";

    return !hasAppErrorShape && (hasExtensionErrorShape || isPlainObject);
  };

  window.addEventListener(
    "unhandledrejection",
    (event) => {
      const reason = event.reason;

      if (isBrowserExtensionRejection(reason)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </AuthProvider>
  </React.StrictMode>
);

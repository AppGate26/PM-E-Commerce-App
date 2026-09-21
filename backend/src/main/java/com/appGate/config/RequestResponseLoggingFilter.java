package com.appGate.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Console-logs every endpoint hit on the backend (method + path, plus the JSON request
 * body) so calls from a client (e.g. the mobile app) - and exactly what it sent - can be
 * seen without a separate proxy. Added to diagnose which payment-initialize endpoint the
 * mobile app actually calls and what payload it sends (see
 * INSTALLMENT_DOWN_PAYMENT_FLOW.md), instead of guessing from endpoint names alone.
 *
 * <p>Wraps the request in a {@link ContentCachingRequestWrapper} so the body can be read
 * here for logging AND still be read normally by the controller afterward - a plain
 * {@code request.getInputStream()} read would otherwise consume it, leaving nothing for
 * Spring's {@code @RequestBody} deserialization. The log line is emitted after the chain
 * completes, since the wrapper only has content once something downstream has actually
 * read the body.
 *
 * <p>Multipart bodies (file/image uploads) are skipped - not meaningfully loggable as
 * text, and can be large - only the endpoint line is logged for those.
 */
public class RequestResponseLoggingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger("API_CALL");

    // Console logs aren't the place for a multi-megabyte body - cut it off with a
    // clear marker rather than flooding the terminal.
    private static final int MAX_LOGGED_PAYLOAD_CHARS = 2000;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String query = request.getQueryString();
        String endpoint = request.getMethod() + " " + request.getRequestURI()
                + (query != null ? "?" + query : "");

        String contentType = request.getContentType();
        boolean cacheBody = contentType != null && !contentType.toLowerCase().startsWith("multipart/");
        HttpServletRequest requestToUse = cacheBody ? new ContentCachingRequestWrapper(request) : request;

        try {
            filterChain.doFilter(requestToUse, response);
        } finally {
            String payload = null;
            if (requestToUse instanceof ContentCachingRequestWrapper wrapper) {
                byte[] body = wrapper.getContentAsByteArray();
                if (body.length > 0) {
                    payload = new String(body, StandardCharsets.UTF_8);
                    if (payload.length() > MAX_LOGGED_PAYLOAD_CHARS) {
                        payload = payload.substring(0, MAX_LOGGED_PAYLOAD_CHARS) + "...(truncated)";
                    }
                }
            }
            if (payload != null) {
                logger.info("{} | payload={}", endpoint, payload);
            } else {
                logger.info("{}", endpoint);
            }
        }
    }
}

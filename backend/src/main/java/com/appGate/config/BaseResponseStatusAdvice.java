package com.appGate.config;

import com.appGate.rbac.response.BaseResponse;

import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

/**
 * Aligns the HTTP status code with the {@code status} carried inside every
 * {@link BaseResponse}.
 *
 * <p>Controllers across the app return {@code BaseResponse} with an embedded
 * status (e.g. 400 "Branch is required", 404 "User not found") but, by default,
 * Spring writes all of them with HTTP 200 OK — which hides failures from
 * clients. This advice promotes {@code BaseResponse.status} to the real HTTP
 * status whenever it is a recognised HTTP code, so a "failure" response is
 * delivered as a genuine 4xx/5xx and the frontend can detect it.
 *
 * <p>Only applies to returned {@code BaseResponse} bodies. Exception responses
 * (handled by the {@code GlobalExceptionHandler}s, which return other shapes)
 * are untouched.
 */
@RestControllerAdvice
public class BaseResponseStatusAdvice implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        return true;
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType,
            Class<? extends HttpMessageConverter<?>> selectedConverterType,
            ServerHttpRequest request, ServerHttpResponse response) {

        if (body instanceof BaseResponse baseResponse && baseResponse.getStatus() != null) {
            HttpStatus status = HttpStatus.resolve(baseResponse.getStatus());
            if (status != null) {
                response.setStatusCode(status);
            }
        }
        return body;
    }
}

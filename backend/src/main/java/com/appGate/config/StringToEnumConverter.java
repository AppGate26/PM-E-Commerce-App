package com.appGate.config;

import org.springframework.core.convert.converter.Converter;
import org.springframework.core.convert.converter.ConverterFactory;
import org.springframework.stereotype.Component;

/**
 * Case-insensitive enum converter
 * Allows frontend to send "Male", "MALE", "male" - all work
 */
@Component
public class StringToEnumConverter implements ConverterFactory<String, Enum> {

    @Override
    public <T extends Enum> Converter<String, T> getConverter(Class<T> targetType) {
        return new StringToEnum<>(targetType);
    }

    private static class StringToEnum<T extends Enum> implements Converter<String, T> {
        private final Class<T> enumType;

        public StringToEnum(Class<T> enumType) {
            this.enumType = enumType;
        }

        @Override
        public T convert(String source) {
            if (source == null || source.trim().isEmpty()) {
                return null;
            }

            // First, try exact match (for performance)
            try {
                return (T) Enum.valueOf(this.enumType, source.trim());
            } catch (IllegalArgumentException e) {
                // Ignore, try case-insensitive
            }

            // Try case-insensitive match
            String normalizedSource = source.trim().toUpperCase().replace(" ", "_");

            try {
                return (T) Enum.valueOf(this.enumType, normalizedSource);
            } catch (IllegalArgumentException e) {
                // Last attempt: try matching against all enum values
                for (T enumConstant : this.enumType.getEnumConstants()) {
                    if (enumConstant.name().equalsIgnoreCase(normalizedSource)) {
                        return enumConstant;
                    }
                }

                // If nothing works, throw original exception
                throw new IllegalArgumentException(
                    "Invalid value '" + source + "' for enum " + enumType.getSimpleName()
                );
            }
        }
    }
}

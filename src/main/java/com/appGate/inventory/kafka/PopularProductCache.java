package com.appGate.inventory.kafka;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

@Component
public class PopularProductCache {

    private final Map<Long, Integer> productOrderCount = new ConcurrentHashMap<>();
    private LocalDate lastResetDate = LocalDate.now();

    public synchronized void incrementProductCount(Long productId) {
        resetIfNewDay();
        productOrderCount.put(productId, productOrderCount.getOrDefault(productId, 0) + 1);
    }

    public List<Long> getTopProducts(int limit) {
        resetIfNewDay();
        return productOrderCount.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue())) // Sort by order count DESC
                .limit(limit)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    // Reset cache if a new day starts
    private void resetIfNewDay() {
        if (!LocalDate.now().equals(lastResetDate)) {
            productOrderCount.clear();
            lastResetDate = LocalDate.now();
        }
    }
}

package com.appGate.rbac.init;

import com.appGate.rbac.models.LGA;
import com.appGate.rbac.models.State;
import com.appGate.rbac.repository.LGARepository;
import com.appGate.rbac.repository.StateRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Seeds Nigerian states and their LGAs so the Branch &amp; Permission Setup
 * "Select state" / "LGA" dropdowns are populated. Without this the
 * {@code states} and {@code lgas} tables are empty and the pickers only show
 * their placeholders.
 *
 * <p>The data mirrors {@code frontend/src/lib/nigeriaLocations.js} and is read
 * from {@code resources/data/nigeria-locations.json}. State names (including
 * "FCT") are kept identical to the frontend so the values line up.</p>
 *
 * <p>Idempotent: states and LGAs are each seeded only when their table is
 * empty, so this is safe on every startup. Wards are not seeded (the source has
 * no ward data).</p>
 */
@Component
@Order(2)
@RequiredArgsConstructor
public class LocationDataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(LocationDataInitializer.class);
    private static final String DATA_PATH = "data/nigeria-locations.json";

    private final StateRepository stateRepository;
    private final LGARepository lgaRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void run(String... args) {
        boolean seedStates = stateRepository.count() == 0;
        boolean seedLgas = lgaRepository.count() == 0;

        if (!seedStates && !seedLgas) {
            logger.debug("States and LGAs already present; skipping location seed");
            return;
        }

        Map<String, List<String>> lgasByState = loadData();
        if (lgasByState.isEmpty()) {
            return;
        }

        if (seedStates) {
            List<State> states = new ArrayList<>();
            for (String name : lgasByState.keySet()) {
                State state = new State();
                state.setName(name);
                states.add(state);
            }
            stateRepository.saveAll(states);
            logger.info("Seeded {} Nigerian states", states.size());
        }

        if (seedLgas) {
            // Look up states by name (handles both freshly-seeded states and any
            // that already existed from a previous states-only seed).
            Map<String, State> stateByName = new LinkedHashMap<>();
            stateRepository.findAll().forEach(state -> stateByName.put(state.getName(), state));

            List<LGA> lgas = new ArrayList<>();
            for (Map.Entry<String, List<String>> entry : lgasByState.entrySet()) {
                State state = stateByName.get(entry.getKey());
                if (state == null) {
                    continue;
                }
                for (String lgaName : entry.getValue()) {
                    LGA lga = new LGA();
                    lga.setName(lgaName);
                    lga.setState(state);
                    lgas.add(lga);
                }
            }
            lgaRepository.saveAll(lgas);
            logger.info("Seeded {} LGAs across {} states", lgas.size(), lgasByState.size());
        }
    }

    private Map<String, List<String>> loadData() {
        try (InputStream in = new ClassPathResource(DATA_PATH).getInputStream()) {
            return objectMapper.readValue(in, new TypeReference<LinkedHashMap<String, List<String>>>() {});
        } catch (Exception e) {
            logger.error("Failed to load location seed data from {}: {}", DATA_PATH, e.getMessage());
            return new LinkedHashMap<>();
        }
    }
}

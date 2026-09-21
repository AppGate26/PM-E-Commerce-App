package com.appGate.account.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.appGate.account.dto.VerificationResponse;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Service
@ConditionalOnProperty(name = "dojah.api.mock-enabled", havingValue = "true", matchIfMissing = false)
@Slf4j
public class MockVerificationServiceImpl implements VerificationService {

    // Mock data store for testing
    private static final Map<String, VerificationResponse.PersonData> MOCK_BVN_DATA = new HashMap<>();
    private static final Map<String, VerificationResponse.PersonData> MOCK_NIN_DATA = new HashMap<>();

    static {
        // Initialize mock BVN data
        MOCK_BVN_DATA.put("22222222222", createMockPersonData(
            "22222222222",
            null,
            "John",
            "Doe",
            "Smith",
            "1990-01-15",
            "08012345678",
            "08098765432",
            "john.doe@example.com",
            "Male",
            "123 Main Street, Victoria Island, Lagos",
            "Lagos",
            "Ogun",
            "Eti-Osa",
            "Ijebu-Ode",
            "Nigerian",
            "First Bank of Nigeria",
            "Victoria Island Branch",
            "2015-03-20",
            "Single",
            "NO"
        ));

        MOCK_BVN_DATA.put("33333333333", createMockPersonData(
            "33333333333",
            null,
            "Jane",
            "Ada",
            "Williams",
            "1985-07-22",
            "08123456789",
            "07098765432",
            "jane.williams@example.com",
            "Female",
            "45 Admiralty Way, Lekki Phase 1, Lagos",
            "Lagos",
            "Lagos",
            "Lekki",
            "Lagos Island",
            "Nigerian",
            "Zenith Bank",
            "Lekki Branch",
            "2012-11-10",
            "Married",
            "NO"
        ));

        MOCK_BVN_DATA.put("44444444444", createMockPersonData(
            "44444444444",
            null,
            "Chidi",
            "Emeka",
            "Okafor",
            "1992-05-30",
            "08156789012",
            null,
            "chidi.okafor@example.com",
            "Male",
            "78 Trans-Amadi Road, Port Harcourt, Rivers State",
            "Rivers",
            "Anambra",
            "Port Harcourt",
            "Onitsha North",
            "Nigerian",
            "Access Bank",
            "Port Harcourt Branch",
            "2016-08-14",
            "Single",
            "NO"
        ));

        // Initialize mock NIN data
        MOCK_NIN_DATA.put("12345678901", createMockPersonData(
            null,
            "12345678901",
            "Amaka",
            "Blessing",
            "Eze",
            "1988-12-05",
            "08087654321",
            "07012345678",
            "amaka.eze@example.com",
            "Female",
            "12 Independence Avenue, Abuja",
            "FCT",
            "Enugu",
            "Abuja Municipal",
            "Enugu North",
            "Nigerian",
            null,
            null,
            "2018-02-28",
            "Married",
            "NO"
        ));

        MOCK_NIN_DATA.put("98765432109", createMockPersonData(
            null,
            "98765432109",
            "Ibrahim",
            "Musa",
            "Abubakar",
            "1995-03-18",
            "08134567890",
            null,
            "ibrahim.abubakar@example.com",
            "Male",
            "34 Ahmadu Bello Way, Kaduna",
            "Kaduna",
            "Kano",
            "Kaduna North",
            "Kano Municipal",
            "Nigerian",
            null,
            null,
            "2019-09-15",
            "Single",
            "NO"
        ));

        MOCK_NIN_DATA.put("11122233344", createMockPersonData(
            null,
            "11122233344",
            "Fatima",
            "Aisha",
            "Mohammed",
            "1991-08-25",
            "08098765432",
            "07087654321",
            "fatima.mohammed@example.com",
            "Female",
            "56 Airport Road, Kano",
            "Kano",
            "Katsina",
            "Kano Municipal",
            "Katsina",
            "Nigerian",
            null,
            null,
            "2017-06-12",
            "Married",
            "NO"
        ));
    }

    private static VerificationResponse.PersonData createMockPersonData(
            String bvn, String nin, String firstName, String middleName, String lastName,
            String dob, String phone1, String phone2, String email, String gender,
            String address, String state, String stateOfOrigin, String lga, String lgaOfOrigin,
            String nationality, String enrollmentBank, String enrollmentBranch,
            String regDate, String maritalStatus, String watchListed) {

        return VerificationResponse.PersonData.builder()
                .bvn(bvn)
                .nin(nin)
                .firstName(firstName)
                .middleName(middleName)
                .lastName(lastName)
                .fullName(buildFullName(firstName, middleName, lastName))
                .dateOfBirth(dob)
                .phoneNumber(phone1)
                .phoneNumber2(phone2)
                .email(email)
                .gender(gender)
                .address(address)
                .state(state)
                .stateOfOrigin(stateOfOrigin)
                .lga(lga)
                .lgaOfOrigin(lgaOfOrigin)
                .nationality(nationality)
                .image("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD...")
                .enrollmentBank(enrollmentBank)
                .enrollmentBranch(enrollmentBranch)
                .registrationDate(regDate)
                .maritalStatus(maritalStatus)
                .watchListed(watchListed)
                .build();
    }

    private static String buildFullName(String firstName, String middleName, String lastName) {
        StringBuilder fullName = new StringBuilder();
        if (firstName != null) fullName.append(firstName);
        if (middleName != null) {
            if (fullName.length() > 0) fullName.append(" ");
            fullName.append(middleName);
        }
        if (lastName != null) {
            if (fullName.length() > 0) fullName.append(" ");
            fullName.append(lastName);
        }
        return fullName.toString();
    }

    @Override
    public VerificationResponse verifyBvn(String bvn) {
        log.info("MOCK: Verifying BVN: {}", maskSensitiveData(bvn));

        // Simulate API delay
        simulateDelay(500);

        VerificationResponse.PersonData personData = MOCK_BVN_DATA.get(bvn);

        if (personData == null) {
            // Return default mock data for unknown BVNs
            personData = createDefaultBvnData(bvn);
        }

        return VerificationResponse.builder()
                .success(true)
                .message("BVN verification successful (MOCK)")
                .verificationType("BVN")
                .data(personData)
                .build();
    }

    @Override
    public VerificationResponse verifyNin(String nin) {
        log.info("MOCK: Verifying NIN: {}", maskSensitiveData(nin));

        // Simulate API delay
        simulateDelay(500);

        VerificationResponse.PersonData personData = MOCK_NIN_DATA.get(nin);

        if (personData == null) {
            // Return default mock data for unknown NINs
            personData = createDefaultNinData(nin);
        }

        return VerificationResponse.builder()
                .success(true)
                .message("NIN verification successful (MOCK)")
                .verificationType("NIN")
                .data(personData)
                .build();
    }

    private VerificationResponse.PersonData createDefaultBvnData(String bvn) {
        return VerificationResponse.PersonData.builder()
                .bvn(bvn)
                .firstName("Test")
                .middleName("User")
                .lastName("Mock")
                .fullName("Test User Mock")
                .dateOfBirth(LocalDate.now().minusYears(30).toString())
                .phoneNumber("08000000000")
                .phoneNumber2("07000000000")
                .email("test.user@example.com")
                .gender("Male")
                .address("123 Mock Street, Test Area, Lagos")
                .state("Lagos")
                .stateOfOrigin("Lagos")
                .lga("Lagos Mainland")
                .lgaOfOrigin("Lagos Mainland")
                .nationality("Nigerian")
                .image("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD...")
                .enrollmentBank("Mock Bank")
                .enrollmentBranch("Mock Branch")
                .registrationDate(LocalDate.now().minusYears(5).toString())
                .maritalStatus("Single")
                .watchListed("NO")
                .build();
    }

    private VerificationResponse.PersonData createDefaultNinData(String nin) {
        return VerificationResponse.PersonData.builder()
                .nin(nin)
                .firstName("Test")
                .middleName("User")
                .lastName("Mock")
                .fullName("Test User Mock")
                .dateOfBirth(LocalDate.now().minusYears(30).toString())
                .phoneNumber("08000000000")
                .phoneNumber2("07000000000")
                .email("test.user@example.com")
                .gender("Female")
                .address("456 Mock Avenue, Test District, Abuja")
                .state("FCT")
                .stateOfOrigin("FCT")
                .lga("Abuja Municipal")
                .lgaOfOrigin("Abuja Municipal")
                .nationality("Nigerian")
                .image("data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBD...")
                .enrollmentBank(null)
                .enrollmentBranch(null)
                .registrationDate(LocalDate.now().minusYears(3).toString())
                .maritalStatus("Single")
                .watchListed("NO")
                .build();
    }

    private void simulateDelay(int milliseconds) {
        try {
            Thread.sleep(milliseconds);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private String maskSensitiveData(String data) {
        if (data == null || data.length() < 4) {
            return "****";
        }
        return data.substring(0, 3) + "****" + data.substring(data.length() - 2);
    }
}

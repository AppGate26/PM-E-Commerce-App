package com.appGate.staffpayroll.dto;

import com.appGate.staffpayroll.enums.TitleEnum;
import lombok.Data;
import java.time.LocalDate;

@Data
public class StaffRegistrationDto {
    private TitleEnum title;
    private String fullName;
    private String gender;
    private LocalDate dateOfBirth;
    private String phoneNumber;
    private String email;
    private String homeAddress;
    private String stateOfOrigin;
    private Long userId;

    /**
     * The branch this staff member is posted to. Ignored for a branch user, who
     * always registers staff into their own branch; an admin uses it to post staff
     * to a named branch.
     */
    private Long branchId;
}

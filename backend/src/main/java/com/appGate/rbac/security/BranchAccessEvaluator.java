package com.appGate.rbac.security;

import com.appGate.rbac.enums.RoleEnum;
import com.appGate.rbac.models.Branch;
import com.appGate.rbac.models.User;
import com.appGate.rbac.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Security helper for {@code @PreAuthorize} expressions that need to ask
 * "may this caller see data across every branch?".
 *
 * <p>The answer is yes for a super admin, an admin, or a user posted to the Head
 * Office branch — and crucially a Head Office user is <em>not</em> necessarily an
 * admin. Branch visibility is a function of the user's branch posting, not their
 * role, so it cannot be expressed with {@code hasRole('ADMIN')} alone.
 *
 * <p>This mirrors exactly how {@link com.appGate.rbac.filter.BranchContextFilter}
 * decides the unrestricted path, so endpoint authorization and per-request branch
 * scoping agree on who counts as "head office". Registered as {@code branchAccess}
 * so it can be referenced as {@code @PreAuthorize("@branchAccess.canViewAllBranches()")}.
 */
@Component("branchAccess")
public class BranchAccessEvaluator {

    private final UserRepository userRepository;

    public BranchAccessEvaluator(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * True for a super admin, an admin, or a Head-Office-posted user (any role).
     * Everyone else — staff pinned to a real branch, shoppers, anonymous — is false.
     */
    public boolean canViewAllBranches() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null) {
            return false;
        }

        User user = userRepository.findByEmail(auth.getName().toLowerCase()).orElse(null);
        if (user == null) {
            return false;
        }

        RoleEnum role = user.getRole();
        if (role == RoleEnum.SUPER_ADMIN || role == RoleEnum.ADMIN) {
            return true;
        }

        Branch branch = user.getBranch();
        return branch != null && branch.isHeadOffice();
    }
}

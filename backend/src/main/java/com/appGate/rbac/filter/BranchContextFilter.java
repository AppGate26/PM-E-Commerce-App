package com.appGate.rbac.filter;

import com.appGate.rbac.context.BranchContext;
import com.appGate.rbac.context.BranchScope;
import com.appGate.rbac.enums.RoleEnum;
import com.appGate.rbac.models.Branch;
import com.appGate.rbac.models.User;
import com.appGate.rbac.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Resolves the caller's branch once per request and publishes it on
 * {@link BranchContext}.
 *
 * <p>Runs immediately after {@link AuthTokenFilter}, so the SecurityContext is
 * already populated. The user is loaded once here rather than on every scoping
 * check — the read paths consult the scope many times per request.
 *
 * <p>The branch is resolved from the database ({@code User.branch}) and not from
 * a JWT claim on purpose: an admin who moves a user to a different branch must
 * take effect on that user's next request, not whenever their token happens to
 * expire. A stale branch claim in a long-lived token would be a data-leak.
 *
 * <p><b>Head-office branch switching.</b> A caller who may see every branch
 * (admin, super admin, or a user posted to Head Office) can narrow the request to
 * one branch by sending the {@link #BRANCH_HEADER} header — this is what lets the
 * head-office branch selector "become" a branch and see only its data. The header
 * is read <em>only</em> on the unrestricted path: a user pinned to a real branch
 * can never widen their view by sending it, so switching stays fail-closed.
 */
public class BranchContextFilter extends OncePerRequestFilter {

    /**
     * Optional per-request override sent by the head-office branch selector. Holds
     * the numeric id of the branch an unrestricted caller wants to view. Absent or
     * blank means "all branches" (the caller's natural unrestricted view).
     */
    public static final String BRANCH_HEADER = "X-Branch-Id";

    private final UserRepository userRepository;

    public BranchContextFilter(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            BranchContext.set(resolve(request));
            filterChain.doFilter(request, response);
        } finally {
            // Servlet containers pool threads; a leaked scope would be inherited
            // by the next, unrelated request.
            BranchContext.clear();
        }
    }

    private BranchScope resolve(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null) {
            return BranchScope.anonymous();
        }

        User user = userRepository.findByEmailWithBranch(auth.getName().toLowerCase()).orElse(null);
        if (user == null) {
            return BranchScope.anonymous();
        }

        RoleEnum role = user.getRole();
        if (role == RoleEnum.SUPER_ADMIN || role == RoleEnum.ADMIN) {
            return unrestrictedOrSelected(user, request);
        }

        // A rider is never branch-restricted, posted to one or not: they can be
        // handed a delivery that originated from any branch, and everything their
        // app reads is already filtered by rider id rather than branch (see
        // BranchScope#rider). Checking this before the branch==null fail-closed
        // check below means a rider an admin never got around to posting isn't
        // locked out either.
        if (role == RoleEnum.RIDER) {
            return BranchScope.rider(user.getId());
        }

        Branch branch = user.getBranch();
        if (branch == null) {
            // A self-registered shopper: public sign-up assigns RoleEnum.USER and no
            // branch (UserService), and every screen they touch — cart, checkout,
            // their own orders, their own wallet — is already filtered by user id,
            // never by branch. Denying them would lock customers out of the store.
            if (role == RoleEnum.USER) {
                return BranchScope.customer(user.getId());
            }

            // Any other role with no branch is staff who has not been posted to one.
            // Fail closed: previously this returned "unrestricted", so an unposted
            // staff member could read every branch's data.
            return BranchScope.denied();
        }

        if (branch.isHeadOffice()) {
            return unrestrictedOrSelected(user, request);
        }

        return BranchScope.of(branch.getId(), user.getId());
    }

    /**
     * For a caller who may see every branch: honour the branch they selected in the
     * header, or fall back to the full, unrestricted view when none is selected.
     *
     * <p>A selected branch is treated exactly like a real branch posting
     * ({@link BranchScope#of}), so every existing read filter and write stamp
     * applies unchanged — the caller sees and writes that branch's data only. A
     * blank, missing or non-numeric header keeps them unrestricted.
     */
    private BranchScope unrestrictedOrSelected(User user, HttpServletRequest request) {
        Long selected = parseSelectedBranch(request);
        if (selected == null) {
            return BranchScope.unrestricted();
        }
        return BranchScope.of(selected, user.getId());
    }

    private Long parseSelectedBranch(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String raw = request.getHeader(BRANCH_HEADER);
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            long id = Long.parseLong(raw.trim());
            return id > 0 ? id : null;
        } catch (NumberFormatException e) {
            // A malformed header is treated as "no selection" rather than an error:
            // the worst case is the caller keeps their full view, never a wider one.
            return null;
        }
    }
}

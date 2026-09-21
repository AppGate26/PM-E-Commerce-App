package com.appGate.rbac.service;

import com.appGate.rbac.context.BranchContext;
import com.appGate.rbac.context.BranchScope;
import com.appGate.rbac.models.User;
import com.appGate.rbac.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * The single authority on which branch a request may see and write.
 *
 * <p>The scope itself is resolved once per request by
 * {@link com.appGate.rbac.filter.BranchContextFilter}; this service reads it off
 * {@link BranchContext} and turns it into the three decisions callers need:
 *
 * <ul>
 *   <li><b>Reading a list</b> — {@link #getScopedBranchId()}. Null means "show
 *       every branch"; non-null means "filter to this branch".
 *   <li><b>Reading one branch by id</b> (the {@code /branch/{branchId}/...}
 *       endpoints) — {@link #resolveReadBranchId(Long)}, which rejects a branch
 *       user asking for someone else's branch.
 *   <li><b>Writing</b> — {@link #resolveWriteBranchId(Long)}, which stamps the
 *       caller's branch on new records and stops a branch user from planting a
 *       record in another branch.
 * </ul>
 *
 * <p><b>Fail-closed.</b> A staff member with no branch posting is denied outright:
 * every method here throws {@link AccessDeniedException} for them. This is
 * deliberate — the previous behaviour treated "no branch" as "head office", so
 * any staff member an admin forgot to post to a branch could read every branch's
 * data. Self-registered shoppers are exempt (see
 * {@link com.appGate.rbac.context.BranchScope#customer(Long)}); their data is
 * scoped by user id, not by branch.
 */
@Service
public class BranchScopeService {

    private final UserRepository userRepository;

    public BranchScopeService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** The current authenticated user, or empty when unauthenticated. */
    public Optional<User> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getName() == null) {
            return Optional.empty();
        }
        return userRepository.findByEmail(auth.getName().toLowerCase());
    }

    /** The raw scope for this request. */
    public BranchScope currentScope() {
        return BranchContext.get();
    }

    /**
     * The branch id reads must be restricted to, or {@code null} when the caller
     * may see all branches.
     *
     * @throws AccessDeniedException when the caller is a non-admin with no branch.
     */
    public Long getScopedBranchId() {
        BranchScope scope = BranchContext.get();
        if (scope.isDenied()) {
            throw new AccessDeniedException(
                    "Your account is not assigned to a branch. Ask an administrator to post you to one.");
        }
        return scope.getBranchId();
    }

    /** True when the current caller is restricted to a single branch. */
    public boolean isBranchScoped() {
        return BranchContext.get().isScoped();
    }

    /** True when the caller may see every branch (admin or head office). */
    public boolean isUnrestricted() {
        return BranchContext.get().isUnrestricted();
    }

    /**
     * Validate a caller-supplied branch id from a path/query parameter.
     *
     * <p>Closes the hole where {@code /sales/branch/{branchId}} and friends took
     * the branch straight from the URL: any authenticated user could read any
     * branch simply by changing the number.
     *
     * @param requestedBranchId the branch the caller asked for; may be null
     * @return the branch to actually query, or null for "all branches"
     * @throws AccessDeniedException when a branch user asks for another branch
     */
    public Long resolveReadBranchId(Long requestedBranchId) {
        Long ownBranchId = getScopedBranchId();
        if (ownBranchId == null) {
            return requestedBranchId; // admin / head office: honour the request as-is
        }
        if (requestedBranchId != null && !ownBranchId.equals(requestedBranchId)) {
            throw new AccessDeniedException("You may only view data for your own branch.");
        }
        return ownBranchId;
    }

    /**
     * The branch id to stamp on a record being created or updated.
     *
     * <p>A branch user always writes into their own branch, whatever the request
     * body claims. An admin may write into any branch, or into none (a null
     * branch means company-wide reference data such as a shared product).
     *
     * @param requestedBranchId the branch supplied on the DTO; may be null
     * @throws AccessDeniedException when a branch user tries to write elsewhere
     */
    public Long resolveWriteBranchId(Long requestedBranchId) {
        Long ownBranchId = getScopedBranchId();
        if (ownBranchId == null) {
            return requestedBranchId;
        }
        if (requestedBranchId != null && !ownBranchId.equals(requestedBranchId)) {
            throw new AccessDeniedException("You may only create records in your own branch.");
        }
        return ownBranchId;
    }

    /**
     * Guard an existing record: a branch user may only touch rows carrying their
     * own branch id.
     *
     * @param recordBranchId the branch stamped on the row being read/updated/deleted
     */
    public void assertCanAccess(Long recordBranchId) {
        Long ownBranchId = getScopedBranchId();
        if (ownBranchId == null) {
            return;
        }
        if (recordBranchId == null || !ownBranchId.equals(recordBranchId)) {
            throw new AccessDeniedException("This record belongs to another branch.");
        }
    }

    /**
     * Guard shared reference data (products, suppliers, the account chart).
     *
     * <p>These rows follow the convention already established by {@code Stock}:
     * a null branch id means the row is company-wide and everyone may see it,
     * while a non-null branch id means it belongs to that branch alone.
     */
    public void assertCanAccessShared(Long recordBranchId) {
        Long ownBranchId = getScopedBranchId();
        if (ownBranchId == null || recordBranchId == null) {
            return;
        }
        if (!ownBranchId.equals(recordBranchId)) {
            throw new AccessDeniedException("This record belongs to another branch.");
        }
    }
}

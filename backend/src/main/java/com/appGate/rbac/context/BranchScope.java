package com.appGate.rbac.context;

/**
 * The branch visibility of the current request, resolved once per request by
 * {@link com.appGate.rbac.filter.BranchContextFilter} and held in
 * {@link BranchContext}.
 *
 * <p>Two distinct ideas are deliberately kept apart:
 * <ul>
 *   <li>{@link #unrestricted()} — the caller may see every branch (super admin,
 *       admin, or a user posted to the Head Office branch). {@code branchId} is
 *       null and no filter is applied.</li>
 *   <li>{@link #of(Long, Long)} — the caller is pinned to exactly one branch.
 *       Every read is filtered to it and every write is stamped with it.</li>
 * </ul>
 *
 * <p>{@link #denied()} is the fail-closed state: a staff member with no branch at
 * all. Such a user has no legitimate branch to be scoped to, so rather than
 * silently showing them everything (the old behaviour) they are shown nothing
 * until an admin posts them to a branch.
 *
 * <p>{@link #customer(Long)} is deliberately <em>not</em> denied. A shopper who
 * signed up through the public form has no branch either, but everything they can
 * reach is scoped by their own user id rather than by branch, so branch scoping
 * simply does not apply to them.
 */
public final class BranchScope {

    private static final BranchScope UNRESTRICTED = new BranchScope(null, null, true, false);
    private static final BranchScope DENIED = new BranchScope(null, null, false, true);
    // Not denied: an unauthenticated request can only have reached a service through
    // an endpoint SecurityConfig declares public (the storefront product list, the
    // payment webhook). Those are public by design, so they are simply unscoped.
    // Denying here would 403 the public catalogue.
    private static final BranchScope ANONYMOUS = new BranchScope(null, null, false, false);

    private final Long branchId;
    private final Long userId;
    private final boolean unrestricted;
    private final boolean denied;

    private BranchScope(Long branchId, Long userId, boolean unrestricted, boolean denied) {
        this.branchId = branchId;
        this.userId = userId;
        this.unrestricted = unrestricted;
        this.denied = denied;
    }

    /** Caller sees every branch (super admin / admin / head-office user). */
    public static BranchScope unrestricted() {
        return UNRESTRICTED;
    }

    /** Caller is pinned to a single branch. */
    public static BranchScope of(Long branchId, Long userId) {
        return new BranchScope(branchId, userId, false, false);
    }

    /** Staff with no branch posting: sees nothing (fail-closed). */
    public static BranchScope denied() {
        return DENIED;
    }

    /**
     * A self-registered shopper. Unscoped by branch, because everything they can
     * reach (cart, checkout, their own orders and wallet) is filtered by user id.
     */
    public static BranchScope customer(Long userId) {
        return new BranchScope(null, userId, false, false);
    }

    /**
     * A rider. Unscoped by branch, whether or not an admin has posted them to
     * one - a rider can be handed a delivery that originated from any branch,
     * and every screen their app reads (pending deliveries, delivery history,
     * a delivery's detail/confirmation) is already filtered by rider id, not
     * branch. See {@code DeliveryOperationsService.boxInScope}.
     */
    public static BranchScope rider(Long userId) {
        return new BranchScope(null, userId, false, false);
    }

    /**
     * No authenticated user on the request — a public endpoint. Unscoped, not
     * denied; see the field comment above.
     */
    public static BranchScope anonymous() {
        return ANONYMOUS;
    }

    /** The branch to filter/stamp with, or null when unrestricted or denied. */
    public Long getBranchId() {
        return branchId;
    }

    public Long getUserId() {
        return userId;
    }

    public boolean isUnrestricted() {
        return unrestricted;
    }

    public boolean isDenied() {
        return denied;
    }

    /** True when reads must be filtered to {@link #getBranchId()}. */
    public boolean isScoped() {
        return branchId != null;
    }
}

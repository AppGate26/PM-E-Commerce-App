package com.appGate.rbac.context;

/**
 * Request-scoped holder for the caller's {@link BranchScope}.
 *
 * <p>Populated once per request by
 * {@link com.appGate.rbac.filter.BranchContextFilter} (which runs after
 * authentication) and cleared in that filter's {@code finally} block. Holding it
 * here means scoping checks are free: without it every
 * {@code getScopedBranchId()} call costs a {@code findByEmail} round-trip, and
 * the read paths call it repeatedly.
 *
 * <p>The value is a {@link ThreadLocal}, so it is only valid on the request
 * thread. Code that hands work to another thread (an {@code @Async} method, a
 * scheduled job, a parallel stream) will see {@link BranchScope#anonymous()} and
 * must pass the branch explicitly instead of relying on this.
 */
public final class BranchContext {

    private static final ThreadLocal<BranchScope> CURRENT =
            ThreadLocal.withInitial(BranchScope::anonymous);

    private BranchContext() {
    }

    public static BranchScope get() {
        return CURRENT.get();
    }

    public static void set(BranchScope scope) {
        CURRENT.set(scope == null ? BranchScope.anonymous() : scope);
    }

    public static void clear() {
        CURRENT.remove();
    }
}

package com.appGate.rbac.context;

import org.springframework.data.jpa.domain.Specification;

/**
 * Reusable branch predicates for repositories that extend
 * {@code JpaSpecificationExecutor}.
 *
 * <p>Composing one of these into an existing search specification pushes the
 * branch filter into the SQL, which is both correct and cheap — the alternative
 * used elsewhere in this codebase (load every row, then
 * {@code .stream().filter(...)}) is O(all rows in the company) and is silently
 * wrong the moment someone adds pagination on top of it.
 *
 * <p>Both helpers no-op when {@code branchId} is null, so a call site can pass
 * {@code BranchScopeService.getScopedBranchId()} straight through: an admin or
 * head-office user gets an unfiltered query.
 */
public final class BranchSpecs {

    private BranchSpecs() {
    }

    /**
     * Transactional data: rows belong to exactly one branch and are visible only
     * to it. Use for orders, stock, journal entries, payroll, customers.
     */
    public static <T> Specification<T> ownedBy(Long branchId) {
        return (root, query, cb) ->
                branchId == null ? cb.conjunction() : cb.equal(root.get("branchId"), branchId);
    }

    /**
     * Shared reference data: a null branch id means company-wide and everyone can
     * see it, while a branch additionally sees rows it created for itself. Use for
     * products, suppliers, the chart of accounts.
     */
    public static <T> Specification<T> visibleTo(Long branchId) {
        return (root, query, cb) -> branchId == null
                ? cb.conjunction()
                : cb.or(cb.isNull(root.get("branchId")), cb.equal(root.get("branchId"), branchId));
    }
}

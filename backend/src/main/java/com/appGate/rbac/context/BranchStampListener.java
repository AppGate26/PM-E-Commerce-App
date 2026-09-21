package com.appGate.rbac.context;

import jakarta.persistence.PrePersist;

/**
 * Stamps the caller's branch onto any {@link BranchOwned} entity as it is
 * inserted.
 *
 * <p>Attached once to each module's {@code BaseEntity} mapped superclass, so it
 * covers every entity in the app; it is a no-op for entities that are not
 * {@link BranchOwned}.
 *
 * <p>Only ever fills in a branch that is <em>absent</em>. A service that has
 * already set one — an admin explicitly creating a record for a named branch,
 * or a row deliberately left company-wide — is left alone. Those paths are
 * expected to have gone through
 * {@link com.appGate.rbac.service.BranchScopeService#resolveWriteBranchId(Long)},
 * which is what stops a branch user from writing into someone else's branch.
 *
 * <p>Deliberately does not fire on update: re-stamping on every save would let a
 * branch user silently steal a head-office row simply by editing it.
 */
public class BranchStampListener {

    @PrePersist
    public void stampBranch(Object entity) {
        if (!(entity instanceof BranchOwned owned)) {
            return;
        }
        if (owned.getBranchId() != null) {
            return;
        }

        BranchScope scope = BranchContext.get();
        if (scope.isScoped()) {
            owned.setBranchId(scope.getBranchId());
        }
        // Unrestricted (admin/head office) and anonymous callers leave the branch
        // null: the row is company-wide unless the service said otherwise.
    }
}

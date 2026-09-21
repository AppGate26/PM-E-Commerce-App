package com.appGate.rbac.context;

/**
 * Marks an entity that belongs to a branch.
 *
 * <p>Implementing this is all an entity needs to do to be stamped automatically:
 * {@link BranchStampListener} fills {@code branchId} in from the caller's
 * {@link BranchContext} on insert, so no service has to remember to do it. (The
 * old approach — hand-setting the column in each service — is exactly why
 * {@code Account.branchId} and {@code JournalEntry.branchId} existed for months
 * without ever being written, leaving branch users with empty reports.)
 *
 * <p>A null {@code branchId} means the row is company-wide: shared reference
 * data every branch can see. That convention comes from {@code Stock}, where a
 * null branch already means central/head-office stock.
 */
public interface BranchOwned {

    Long getBranchId();

    void setBranchId(Long branchId);
}

import React, { useEffect, useState } from "react";
import { FiMapPin } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import { fetchBranches } from "../../lib/branchApi";
import { resolveBackendBranchId } from "../../lib/branchAccess";
import BranchBadge from "./BranchBadge";
import "./BranchSwitcher.css";

/**
 * The branch control shown in every page header.
 *
 * <p>Two audiences, deliberately different affordances:
 * <ul>
 *   <li>A user pinned to one real branch sees the read-only {@link BranchBadge}:
 *       every figure on the page is already filtered to their branch and they
 *       cannot change it.</li>
 *   <li>An admin or head-office user sees a dropdown of every branch, plus "All
 *       Branches". Picking one sends its id as the X-Branch-Id header on every
 *       subsequent request, so the whole app narrows to that branch; picking "All
 *       Branches" clears it and restores the company-wide view.</li>
 * </ul>
 *
 * Changing the selection reloads the page (see AuthContext.setActiveBranch), which
 * is what makes every already-rendered screen refetch under the new scope.
 */
const BranchSwitcher = () => {
  const { isAuthenticated, canSelectBranch, activeBranchId, setActiveBranch } = useAuth();
  const [branches, setBranches] = useState([]);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !canSelectBranch) return;

    let cancelled = false;
    fetchBranches()
      .then((list) => {
        if (cancelled) return;
        // Map to { value, label } using each branch's real numeric backend id.
        // The Head Office option carries its id as `backendId`; real branches use
        // `id`. Drop any option without a usable numeric id.
        const options = list
          .map((branch) => {
            const value = resolveBackendBranchId(branch);
            if (value == null) return null;
            const label =
              [branch.branchCode, branch.branchName].filter(Boolean).join(" · ") ||
              branch.branchName ||
              "Branch";
            return { value: String(value), label };
          })
          .filter(Boolean);
        setBranches(options);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, canSelectBranch]);

  if (!isAuthenticated) return null;

  // Pinned branch user (or anyone who can't switch): keep the read-only badge.
  if (!canSelectBranch) return <BranchBadge />;

  // If the branch directory couldn't load, fall back to the badge rather than an
  // empty, unusable control.
  if (loadFailed) return <BranchBadge />;

  const handleChange = (event) => {
    setActiveBranch(event.target.value);
  };

  const viewingAll = !activeBranchId;

  return (
    <label
      className={`branch-switcher${viewingAll ? "" : " branch-switcher--scoped"}`}
      title={
        viewingAll
          ? "Viewing data across all branches — pick one to focus on it"
          : "Viewing a single branch — switch back to All Branches to see everything"
      }
    >
      <FiMapPin aria-hidden="true" />
      <span className="branch-switcher-label">Branch</span>
      <select
        className="branch-switcher-select"
        value={activeBranchId || ""}
        onChange={handleChange}
        aria-label="Select branch to view"
      >
        <option value="">All Branches</option>
        {branches.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};

export default BranchSwitcher;

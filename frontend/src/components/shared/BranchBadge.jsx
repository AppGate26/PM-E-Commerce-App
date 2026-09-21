import React from "react";
import { FiMapPin } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";
import "./BranchBadge.css";

/**
 * Shows which branch the data on this page belongs to.
 *
 * Reads the branch straight off the auth context, so it can be dropped into any
 * page header without threading props through. It is rendered by ModuleUserChip
 * (every operational module page) and AdminNav (every admin page), which is what
 * makes the branch visible everywhere without touching all 122 routes.
 *
 * A branch user sees their own branch, emphasised, because every figure on the
 * page is filtered to it. An admin or head-office user sees "All Branches", since
 * for them nothing is filtered.
 */
const BranchBadge = () => {
  const { isAuthenticated, branch, isBranchUser, isAdmin } = useAuth();

  if (!isAuthenticated) return null;

  const label = isBranchUser
    ? [branch?.branchCode, branch?.branchName].filter(Boolean).join(" · ") || "Branch"
    : isAdmin || !branch
    ? "All Branches"
    : branch.branchName || "Head Office";

  return (
    <span
      className={`branch-badge${isBranchUser ? " branch-badge--scoped" : ""}`}
      title={
        isBranchUser
          ? `You are viewing ${label} only`
          : "You are viewing data across all branches"
      }
    >
      <FiMapPin aria-hidden="true" />
      <span className="branch-badge-text">{label}</span>
    </span>
  );
};

export default BranchBadge;

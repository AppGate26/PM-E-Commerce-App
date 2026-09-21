import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FiMapPin } from "react-icons/fi";
import {
  getRegisteredDisplayName,
  REGISTERED_USERS_CHANGED_EVENT,
} from "../../lib/registeredUsers";
import { resolveUserBranch } from "../../lib/branchAccess";
import { useAuth } from "../../context/AuthContext";
import BranchSwitcher from "./BranchSwitcher";
import BranchBadge from "./BranchBadge";
import "./BranchBadge.css";

const getInitials = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
};

const ModuleUserChip = ({ user, lockBranchToHeadOffice = false }) => {
  const [, forceRefresh] = useState(0);
  const { canSelectBranch } = useAuth();

  useEffect(() => {
    const handleRegisteredUsersChanged = () => {
      forceRefresh((value) => value + 1);
    };

    window.addEventListener(REGISTERED_USERS_CHANGED_EVENT, handleRegisteredUsersChanged);
    window.addEventListener("storage", handleRegisteredUsersChanged);

    return () => {
      window.removeEventListener(REGISTERED_USERS_CHANGED_EVENT, handleRegisteredUsersChanged);
      window.removeEventListener("storage", handleRegisteredUsersChanged);
    };
  }, []);

  const displayName = getRegisteredDisplayName(user);
  const branchName = resolveUserBranch(user)?.branchName || "";

  // The badge sits beside the chip rather than inside it: this component is
  // rendered in the heading band of every operational module page, so putting the
  // badge here is what makes "which branch am I looking at" visible everywhere.
  return (
    <div className="module-user-chip-group">
      {/* When a module locks branch selection to Head Office, only users who can
          actually cross branches (admin or a head-office user — not necessarily an
          admin) get the static Head Office badge. A branch-pinned user keeps their
          own branch badge, since they are scoped to that branch, not Head Office. */}
      {lockBranchToHeadOffice ? (
        canSelectBranch ? (
          <span
            className="branch-badge"
            title="This module operates at Head Office — pick a branch inside each report to view its data"
          >
            <FiMapPin aria-hidden="true" />
            <span className="branch-badge-text">Head Office</span>
          </span>
        ) : (
          <BranchBadge />
        )
      ) : (
        <BranchSwitcher />
      )}
      <div
        className="module-user-chip"
        title={branchName ? `${displayName} - ${branchName}` : user?.email || displayName}
      >
        <span className="module-user-avatar">{getInitials(displayName)}</span>
        <span className="module-user-copy">
          <strong>{displayName}</strong>
          {branchName ? <small>{branchName}</small> : null}
        </span>
      </div>
    </div>
  );
};

ModuleUserChip.propTypes = {
  lockBranchToHeadOffice: PropTypes.bool,
  user: PropTypes.shape({
    email: PropTypes.string,
    firstName: PropTypes.string,
    fullName: PropTypes.string,
    lastName: PropTypes.string,
    name: PropTypes.string,
    branchName: PropTypes.string,
    role: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    userType: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    username: PropTypes.string,
  }),
};

ModuleUserChip.defaultProps = {
  lockBranchToHeadOffice: false,
  user: null,
};

export default ModuleUserChip;

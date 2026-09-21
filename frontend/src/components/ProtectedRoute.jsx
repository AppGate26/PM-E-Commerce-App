import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isPathDenied } from "../lib/featureAccess";

const ProtectedRoute = ({ children, requireAdmin = false, requiredModule = null }) => {
  const { isAuthenticated, isAdmin, allowedModules, deniedFeatures, authReady } = useAuth();
  const location = useLocation();

  if (!authReady) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/auth/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/adminDashboard" replace />;
  }

  if (requiredModule && !isAdmin && !(Array.isArray(allowedModules) && allowedModules.includes(requiredModule))) {
    return <Navigate to="/adminDashboard" replace />;
  }

  // Sub-feature denial: even with the parent module granted, a denied screen
  // (e.g. Staff Payroll under Accounting) is blocked for this user.
  if (!isAdmin && isPathDenied(location.pathname, deniedFeatures)) {
    return <Navigate to="/adminDashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;

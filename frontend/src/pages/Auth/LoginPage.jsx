import React from "react";
import { Navigate } from "react-router-dom";
import Login from "../../components/Home/Login/Login";
import "../../components/Home/Login/Login.css";
import { useAuth } from "../../context/AuthContext";

const LoginPage = () => {
  const { isAuthenticated, isAdmin, allowedModules, authReady } = useAuth();

  if (!authReady) {
    return null;
  }

  if (isAuthenticated) {
    if (isAdmin) {
      return <Navigate to="/admin/dashboard" replace />;
    }

    const defaultModuleRoute = Array.isArray(allowedModules)
      ? {
          inventory: "/inventory",
          client: "/client",
          ordering_sales: "/orderTab",
          accounting: "/Accounting",
          payment: "/payment",
          care: "/care",
          recovery: "/recovery",
          delivery: "/delivery",
          cashier_stand: "/cashier",
          warehouse: "/warehouse",
          branch: "/branch",
          mail_messenger: "/messenger",
        }[allowedModules[0]]
      : null;

    return <Navigate to={defaultModuleRoute || "/adminDashboard"} replace />;
  }

  return <Login />;
};

export default LoginPage;

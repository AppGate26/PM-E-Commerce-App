import React from "react";
import "./Admin.css";
import "./AdminQuery.css";
import img from "../../assets/images/adminLogo.png";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getModuleLabel } from "../../lib/moduleAccess";

const AdminDashboard = () => {
  const { isAdmin, allowedModules } = useAuth();

  const modules = [
    { key: "inventory", label: "INVENTORY", path: "/inventory" },
    { key: "client", label: "CLIENT", path: "/client" },
    { key: "ordering_sales", label: "ORDERING & SALES", path: "/orderTab" },
    { key: "accounting", label: "ACCOUNTING", path: "/Accounting" },
    { key: "warehouse", label: "WAREHOUSE", path: "/warehouse" },
    { key: "branch", label: "BRANCH", path: "/branch" },
    { key: "payment", label: "PAYMENT", path: "/payment" },
    { key: "care", label: "CARE", path: "/care" },
    { key: "recovery", label: "RECOVERY", path: "/recovery" },
    { key: "delivery", label: "DELIVERY", path: "/delivery" },
    { key: "cashier_stand", label: "CASHIER STAND", path: "/cashier" },
  ];

  const visibleModules = isAdmin
    ? modules
    : modules.filter((module) => allowedModules?.includes(module.key));

  const visibleModuleLabels = visibleModules.map((module) => getModuleLabel(module.key));

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-md-4 col-lg-4  box-logo d-flex align-items-center justify-content-center">
          <Link to="/">
            <img src={img} alt="logo" className="a-logo " />
          </Link>
        </div>
        <div className="col-md-8  col-sm-12 ">
          <div className=" dashboard-section ">
            <div className="management-row ">
              {visibleModules.length === 0 ? (
                <div className="management-box px-3">
                  <p style={{ fontSize: "0.95rem" }}>NO MODULE ACCESS ASSIGNED FOR THIS USER</p>
                </div>
              ) : (
                <>
                  {visibleModules.map((module) => (
                    <Link key={module.key} to={module.path} className="text-decoration-none">
                      <div className="management-box px-2">
                        <p>{module.label}</p>
                      </div>
                    </Link>
                  ))}
                  <Link to="/change-password" className="text-decoration-none">
                    <div className="management-box px-2">
                      <p>CHANGE PASSWORD</p>
                    </div>
                  </Link>
                </>
              )}
            </div>
            {!isAdmin && visibleModules.length > 0 ? (
              <div style={{ marginTop: "18px", color: "#5f748d", fontWeight: 600 }}>
                Assigned modules: {visibleModuleLabels.join(", ")}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

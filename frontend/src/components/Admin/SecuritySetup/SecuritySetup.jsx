import React from "react";
import { Link } from "react-router-dom";
import {
  FiArchive,
  FiDatabase,
  FiLock,
  FiMapPin,
  FiPower,
  FiRotateCw,
  FiShield,
  FiSliders,
  FiUsers,
} from "react-icons/fi";
import AdminNav from "../Navigation/AdminNav";
import "./shared/SecurityStandard.css";

const sections = [
  {
    title: "View User",
    description: "See all created users, their department, and current assigned role.",
    path: "/admin/security-setup/view-user",
    icon: FiUsers,
    badge: "Directory",
  },
  {
    title: "Users Log-Out",
    description: "Review active sessions, select users, warn before action, and force logout where supported.",
    path: "/admin/security-setup/users-logout",
    icon: FiPower,
    badge: "Session",
  },
  {
    title: "Users Log Trial",
    description: "Track login and logout history by user with timestamps and audit visibility.",
    path: "/admin/security-setup/users-log-trial",
    icon: FiShield,
    badge: "Audit",
  },
  {
    title: "Merge User Role",
    description: "Assign or update a user role from the available security roles exposed by the backend.",
    path: "/admin/security-setup/merge-user-role",
    icon: FiRotateCw,
    badge: "RBAC",
  },
  {
    title: "Database Backup",
    description: "Run a backup operation and keep a visible activity log of the backup request.",
    path: "/admin/security-setup/database-backup",
    icon: FiDatabase,
    badge: "Backup",
  },
  {
    title: "Create And Modify User",
    description: "Create a new user or load an existing user by email and update the account details.",
    path: "/admin/security-setup/create-modify-user",
    icon: FiLock,
    badge: "Account",
  },
  {
    title: "Branch Setup",
    description: "Create branches, assign users to head office or branches, and set role permissions.",
    path: "/admin/security-setup/branch-permissions",
    icon: FiMapPin,
    badge: "Branch",
  },
  {
    title: "Permission",
    description: "Deny a user access to specific sub-modules (e.g. Staff Payroll under Account) even when the parent module is granted.",
    path: "/admin/security-setup/feature-permissions",
    icon: FiSliders,
    badge: "Access",
  },
  {
    title: "Warehouse Management",
    description: "Create branch warehouses, set capacity, manager details, address, contact, and active status.",
    path: "/admin/security-setup/warehouse-management",
    icon: FiArchive,
    badge: "Super Admin",
    featured: true,
  },
];

const SecuritySetup = () => {
  return (
    <div className="security-page">
      <AdminNav />
      <main className="security-page-main">
        <section className="security-hero">
          <div>
            <p className="security-hero-kicker">Security Setup</p>
            <h1>Security Administration</h1>
            <p>
              Manage users, sessions, roles, audit history, backups, and account
              setup from one standard workspace. Open any section below to work on
              a specific security task.
            </p>
          </div>
          <div className="security-hero-stat">
            <span>Available Tools</span>
            <strong>{sections.length}</strong>
          </div>
        </section>

        <section className="security-layout security-grid-3">
          {sections.map((section) => {
            const Icon = section.icon;

            return (
              <Link
                key={section.path}
                to={section.path}
                className={`security-tool-card ${section.featured ? "featured" : ""}`}
              >
                <div className="security-tool-card-top">
                  <span className="security-tool-icon">
                    <Icon />
                  </span>
                  <span className="security-tool-badge">{section.badge}</span>
                </div>
                <div className="security-tool-copy">
                  <h2>{section.title}</h2>
                  <p>{section.description}</p>
                </div>
                <div className="security-tool-footer">
                  <span>Open workspace</span>
                  <strong>View</strong>
                </div>
              </Link>
            );
          })}
        </section>
      </main>
    </div>
  );
};

export default SecuritySetup;

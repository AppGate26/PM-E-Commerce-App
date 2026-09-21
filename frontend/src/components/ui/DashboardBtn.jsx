import React from "react";
import { Link } from "react-router-dom";

const DashboardBtn = ({ style }) => {
  return (
    <div style={style}>
      <button className="btn btn-primary fw-bold">
        <Link to="/adminDashboard" className="text-white">
          Dashboard
        </Link>
      </button>
    </div>
  );
};

export default DashboardBtn;

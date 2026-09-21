import React, { useState } from "react";
import AccDashboard from "../../../AccDashboard";
import ReuseableNav from "./ReuseableNav";
import { Link } from "react-router-dom";
import AccountNavSm from "../../../AccountNavSm";

const DiscountSetup = () => {
  // Initialize state with one row as an example
  const [rows, setRows] = useState([
    { id: Date.now() }, // Each row should have a unique id
  ]);

  // Function to add a new row
  const addRow = () => {
    const newRow = { id: Date.now() }; // Create a new row object
    setRows((prevRows) => [...prevRows, newRow]); // Append new row to state
  };

  // Optional: Function to remove a row
  const removeRow = (id) => {
    setRows((prevRows) => prevRows.filter((row) => row.id !== id));
  };
  return (
    <div>
      <div className="AccountNavSm">
        <AccountNavSm title="discount set-up" />
      </div>
      <div className="rm-acc-Nav-sm">
        <ReuseableNav title="discount set-up" />
      </div>
      <div className="d-flex loan-percentage-box">
        <div className="rm-acc-dashboard">
          <AccDashboard />
        </div>
        <div className="loan-percentage-table-box">
          <table className="loan-percentage-table-width">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Sup-category</th>
                <th>discount</th>

                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input type="text" />
                  </td>
                  <td>
                    <select name="" id="">
                      <option value="">select sub-category</option>
                      <option value=""></option>
                      <option value=""></option>
                    </select>
                  </td>
                  <td>
                    <input type="text" />
                  </td>

                  <td>
                    <button
                      className="btn btn-primary py-2 px-4 fw-bold"
                      onClick={() => removeRow(row.id)}
                    >
                      DELETE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="d-flex align-items-center justify-content-between loan-effect-bnt-box">
        <div>
          {/* Attach the click event to call addRow */}
          <div className="add-to-table-loanPercentage-btn" onClick={addRow}>
            <span className="add-loan-btn-1">+</span>
            <span className="add-loan-btn-2">ADD</span>
          </div>
        </div>
      </div>
      <div className="d-flex align-items-center justify-content-between loan-effect-bnt-box">
        <button className="loan-effect-bnt">EFFECT CHANGE</button>
        <Link to="/Accounting/Setup">
          <button className="loan-effect-bnt">EXIT</button>
        </Link>
      </div>
    </div>
  );
};

export default DiscountSetup;

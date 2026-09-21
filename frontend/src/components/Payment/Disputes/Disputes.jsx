import React from "react";
import { Link } from "react-router-dom";
import { IoCloseCircle } from "react-icons/io5";
import logo from "../../../assets/images/adminLogo.png";
import "../../Accounting/Account.css";

const Disputes = () => {
  return (
    <div className="bg-white vh-100 d-flex flex-column">
      <div className="px-5 py-3 d-flex justify-content-between align-items-center mb-5">
         <Link to="/payment">
             <img src={logo} alt="pm logo" className="logo-acc" />
        </Link>
        <h2 className="text-primary fw-bold text-uppercase m-0">DISPUTES</h2>
        <Link to="/payment">
             <IoCloseCircle size={40} className="text-primary" />
        </Link>
      </div>

      <div className="container px-5">
          <div className="row g-5 mb-5">
              <div className="col-md-6">
                  <label className="fw-bold text-primary fs-5 mb-2">STATUS</label>
                  <select className="form-select form-select-lg border-primary-subtle text-secondary">
                      <option>Select</option>
                  </select>
              </div>
              <div className="col-md-6">
                  <label className="fw-bold text-primary fs-5 mb-2">RESOLUTION</label>
                  <select className="form-select form-select-lg border-primary-subtle text-secondary">
                      <option>Select</option>
                  </select>
              </div>
              <div className="col-md-6">
                  <label className="fw-bold text-primary fs-5 mb-2 text-uppercase">Categogy</label>
                   <select className="form-select form-select-lg border-primary-subtle text-secondary">
                      <option>Select</option>
                  </select>
              </div>
               <div className="col-md-6">
                  <label className="fw-bold text-primary fs-5 mb-2">DATE PERIOD</label>
                   <select className="form-select form-select-lg border-primary-subtle text-secondary">
                      <option>Select</option>
                  </select>
              </div>
          </div>

          <div className="d-flex justify-content-end mt-5 pt-5">
              <button className="btn btn-primary px-5 py-3 fs-5 fw-bold text-uppercase w-25">SEND</button>
          </div>
      </div>
    </div>
  );
};

export default Disputes;

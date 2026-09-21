import React from "react";
import "./EditCus.css";
import { Link } from "react-router-dom";

const EditCus = ({toggleEditCus}) => {
   //CANCEL MODAL
   const closeModal = () => {
    toggleEditCus();
  };
  return (
    <div>
      <div className=" client-container">
        <div className="">
          <button
            className="btn btn-primary fw-bold"
            style={{ position: "relative",  top: "6em" }}
          >
            <Link to="/adminDashboard" className="text-white">
              Dashboard
            </Link>
          </button>

          <h1 className="pt-5 text-center bg-red-600">edit online customer form </h1>

          <span
            className="adjust-cancel-btn editCus-cancel"
            onClick={closeModal}
          >
            X
          </span>
        </div>
        <div className="product-box">
          <div className="edit-cus-box_grid">
            <div className="">
              <div className="d-flex justify-content-between ">
                <div className="">
                  <label>account number</label> <br />
                  <input
                    type="search"
                    className="half-client-edit-input "
                    name=""
                  />
                  <br />
                  <label>surname</label>
                  <br />
                  <input
                    type="text"
                    name=""
                    className="half-client-edit-input"
                  />
                </div>
                <div className=" w-100">
                  <label htmlFor="" className="passport-walkin">
                    Passport
                  </label>
                  <div className="walkin-passport-box align-item-center d-flex justify-content-center ">
                    <input type="file" className="p-0 w-100 fs-5" />
                  </div>
                </div>
              </div>
              <label> contact address</label> <br />
              <input
                type="text"
                className="client-edit-input span_box-input client-address-hv"
                name=""
              />
              <label>office address</label> <br />
              <input
                type="text"
                className="client-edit-input span_box-input client-address-hv"
                name=""
              />
              <div className="d-flex justify-content-between ">
                <div className="">
                  <label>gender</label> <br />
                  <select name="" className="half-client-edit-input">
                    <option value="">select</option>
                    <option value="">male</option>
                    <option value="">female</option>
                  </select>
                </div>
                <div className="">
                  <label>dob</label>
                  <br />
                  <input
                    type="type"
                    name=""
                    disabled
                    className="half-client-edit-input"
                  />
                </div>
              </div>
              <div className="d-flex justify-content-between ">
                <div className="">
                  <label>phone number</label> <br />
                  <input
                    type="tel"
                    className="half-client-edit-input"
                    name=""
                    placeholder="+234"
                  />
                </div>
                <div className="">
                  <label>occupation</label>
                  <br />
                  <input
                    type="text"
                    name=""
                    className="half-client-edit-input"
                  />
                </div>
              </div>
              <div className="gap-5 mb-5 d-flex justify-content-between">
                <div className="">
                  <label>nin</label> <br />
                  <input
                    type="number"
                    className="mb-2 half-client-edit-input"
                    name=""
                  />
                  <button className="verify-btn">Verify NIN</button>
                </div>
                <div className="">
                  <label>bvn</label>
                  <br />
                  <input
                    type="number"
                    name=""
                    className="mb-2 half-client-edit-input"
                  />
                  <button className="verify-btn">Verify BVN</button>
                </div>
              </div>
            </div>

            <div className="">
              <label>last name</label>
              <br />
              <input type="text" name="" className="client-edit-input" />

              <label>scan in signature</label>
              <br />
              <input type="file" className="client-edit-input cus-upload" />

              <label>nationality</label>
              <br />
              <input type="text" name="" className="client-edit-input" />
            </div>
          </div>
          <div className="d-flex justify-content-center">
            <form action="">
              <input
                type="submit"
                value="REGISTER CUSTOMER DATA"
                className="cus-edit-save"
              />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCus;

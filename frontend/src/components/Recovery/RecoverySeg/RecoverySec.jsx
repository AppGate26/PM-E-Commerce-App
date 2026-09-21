import React from "react";
import img from "../../../assets/images/delivery.png";
import "../../../Styles/Recovery/Recovery.css";

const RecoverySec = () => {
  return (
    <div className="client-box">
      <div className="row client-box-row">
        <div className="col-sm-12 col-lg-6  mb-5">
          <img
            src={img}
            alt="recovery image"
            className="recovery-image animate__animated animate__pulse"
          />
        </div>
        <div className="col-sm-12 col-lg-6 justify-content-center d-flex align-items-center justify-content-center">
          <div className=" content__box  p-1 order_sales-content">
            <h1 className="hub-h1 recovery-h1 animate__animated animate__pulse ">
              RECOVERY
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecoverySec;






















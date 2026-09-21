import React from "react";
import img from "../../../assets/images/delivery.png";
import "../../../Styles/Delivery/Delivery.css";

const DeliverySec = () => {
  return (
    <div className="client-box">
      <div className="row client-box-row">
        <div className="col-sm-12 col-lg-6  mb-5">
          <img
            src={img}
            alt="delivery image"
            className="delivery-image animate__animated animate__pulse"
          />
        </div>
        <div className="col-sm-12 col-lg-6 justify-content-center d-flex align-items-center justify-content-center">
          <div className=" content__box  p-1 order_sales-content">
            <h2 className="hub-h2 delivery-h2 animate__animated animate__pulse">
              DELIVERING EXCELLENCE,
            </h2>
            <h1 className="hub-h1 delivery-h1 animate__animated animate__pulse ">
              EVERY MILE
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliverySec;

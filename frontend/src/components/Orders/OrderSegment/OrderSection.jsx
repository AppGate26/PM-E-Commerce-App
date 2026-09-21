import React from "react";
import img from "../../../assets/images/order.png";

const OrderSection = ({ onRequestReturn, onRequestRestore }) => {
  return (
    <div className="order-container  ">
      <div className="row ">
        <div className="col-sm-12 col-lg-6  mb-5">
          <img
            src={img}
            alt="hub image"
            className="hub-image orderTab-image animate__animated animate__swing"
          />
        </div>
        <div className="col-sm-12 col-lg-6 justify-content-center d-flex align-items-center justify-content-center">
          <div className=" content__box   p-1 order_sales-content">
            <h2 className="hub-h2 order-h2">ORDERING & </h2>
            <h1 className="hub-h1 order-h1 animate__animated animate__rubberBand">
              SALES
            </h1>
            <p className="hub-txt order-txt">
              Where admins manage products, inventory, and  transaction
              for smooth operations.
            </p>
            <button type="button" className="order-return-cta" onClick={onRequestReturn}>
              Request Return
            </button>
            <button type="button" className="order-restore-cta" onClick={onRequestRestore}>
              Restore Item
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSection;

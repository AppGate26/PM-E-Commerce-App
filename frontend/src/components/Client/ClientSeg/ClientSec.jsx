import React from "react";
import img from "../../../assets/images/client.png";

const ClientSec = () => {
  return (
    <div className="client-box   ">
      <div className="row ">
        <div className="col-sm-12 col-lg-6  mb-5 sm-client-remove-mb">
          <img
            src={img}
            alt="client image"
            className="client-image animate__animated animate__pulse"
          />
        </div>
        <div className="col-sm-12 md-m-client col-lg-6 justify-content-center d-flex align-items-center justify-content-center">
          <div className=" content__box  p-1 order_sales-content">
            <h2 className="hub-h1  client-h2 animate__animated animate__pulse ">
              CLIENT
            </h2>

            <p className="hub-txt order-txt ">
              Welcome to Client Profile Management, empowering you with tools to
              optimize customer relationship and deliver personalized service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSec;

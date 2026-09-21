import React from "react";
import hub from "../../assets/images/rafiki.png";
import "./styles/Hub.css";

const Hub = () => {
  return (
    <div className="container  hub-container ">
      <div className="row">
        <div className="col-sm-12 col-lg-6  ">
          <img
            src={hub}
            alt="hub image"
            className="hub-image animate__animated animate__swing"
          />
        </div>
        <div className="col-sm-12 col-lg-6 justify-content-center d-flex align-items-center justify-content-center">
          <div className=" content__box  p-1">
          
            <h2 className="hub-h2">INVENTORY </h2>
            <h1 className="hub-h1 animate__animated animate__rubberBand">
              HUB
            </h1>
            <p className="hub-txt">
              Explore everything inventory, from products <br /> to sales,
              suppliers and inventory report
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hub;

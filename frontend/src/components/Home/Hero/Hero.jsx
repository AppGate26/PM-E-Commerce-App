import React, { useState } from "react";
import hero from "../../../assets/images/hero.png";
import "../HomeQuery.css";

const Hero = () => {
  const [registerModal, setRegisterModal] = useState(false);
  const toggleRegModal = () => {
    setRegisterModal(!registerModal);
  };
  return (
    <div className="bg-hero">
      <div className="container hero-py">
        <div className="row d-flex align-items-center ">
          <div className="col-lg-7  h-sm-width">
            <div className="header-content " style={{display:'flex', flexDirection:'column', justifyContent:'start', gap:'10px',alignItems:'start'}}>
              <h4 className="hero_text-h4">Taking E-commerce to</h4>
              <h1 className="hero_text-h1">Next Level</h1>
              <p className="hero_text-p">
                Welcome to PM, your ultimate destination for all things
                e-commerce! At PM, we're not just another online store - we're a
                community driven by passion, innovation, and a shared love for
                shopping.
              </p>

              {/* <button className="register-btn" onClick={toggleRegModal}>
                Register
                <span className="bg-arrow">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    fill="#fff"
                    className="bi bi-arrow-right-short arrow-left"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8"
                    />
                  </svg>
                </span>
              </button> */}
            </div>
          </div>

          <div className="col-lg-5  w-sm-img text-center">
            <img
              src={hero}
              alt="hero image"
              className="hero-img  animate__animated animate__fadeInDown"
            />
          </div>
        </div>
      </div>

      {/* Include the RegisterModal component */}
      {/* <RegisterModal isOpen={registerModal} toggleRegModal={toggleRegModal} /> */}
    </div>
  );
};

export default Hero;

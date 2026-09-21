import React from "react";
import logo from "../assets/images/PMlogo.png";
import { Link } from "react-router-dom";
const Footer = () => {
  return (
    <footer className="footers-container ">
      <div className="container ">
        <div className="row">
          <div className="col-sm-12 col-md-6">
            <Link to="/">
              <img src={logo} alt="Logo" className="footer-logo" />
            </Link>
            <div className="subs-box">
              <label className="subscribe">
                Subscribe to our notifications
              </label>
              <br />
              <input
                type="text"
                placeholder="Enter your email here"
                className="input-email"
              />
            </div>
          </div>
          <div className="col-sm-12 col-md-6 footer-links_box">
            <div className="container">
              <div className="row">
                <div className="col-sm-6  mb-5">
                  <div className=" ">
                    <a href="" className="footer-links ">
                      About Us
                    </a>
                  </div>

                  <br />
                  <br />
                  <br />
                  <br />
                  <br />
                  <br />

                  <div className="">
                    <a href="" className="footer-links">
                      Contact Us
                    </a>
                  </div>
                </div>
                <div className="col-sm-6 ">
                  <div>
                    <a href="" className="footer-links">
                      Help & Support
                    </a>
                  </div>

                  <br />
                  <br />
                  <br />
                  <br />
                  <br />
                  <br />

                  <div className="">
                    <a href="" className="footer-links">
                      Terms & Policy
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <hr className="long-hr" />
        <div className="d-flex align-items-center justify-content-between my-5">
          <p className="copy-right">
            <span className="copy">&copy; </span>2024 Peace of Mind
          </p>
          <div className="socials-icon d-flex align-items-center justify-content-between gap-5">
            <div className="">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                className="icon-facebook"
              >
                <path d="M20 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h8.615v-6.96h-2.338v-2.725h2.338v-2c0-2.325 1.42-3.592 3.5-3.592.699-.002 1.399.034 2.095.107v2.42h-1.435c-1.128 0-1.348.538-1.348 1.325v1.735h2.697l-.35 2.725h-2.348V21H20a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1z"></path>
              </svg>
            </div>

            <div className="">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                fill="#fff"
                className="bi bi-twitter-x"
                viewBox="0 0 16 16"
              >
                <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
              </svg>
            </div>
            <div className="">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                fill="#fff"
                className="bi bi-instagram"
                viewBox="0 0 16 16"
              >
                <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
export default Footer;

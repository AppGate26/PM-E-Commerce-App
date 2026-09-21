import React from "react";
import { Link } from "react-router-dom";
import PMlogo from "../../../assets/images/PMlogo.png";
import "./queues.css"

const NavQueues = () => {
  return (
    <div>
      <nav className="nav-bar-que ">
        <div className="">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <Link to="/">
                <img src={PMlogo} alt="logo" className="care-logo" />
              </Link>
            </div>

            <h1 className="text-white fw-bold">WAITING</h1>
            <div>
              <button className="Login-btn logout-btn-size">Log Out</button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default NavQueues;

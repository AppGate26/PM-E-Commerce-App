import React from "react";
import PMlogo from "../assets/images/PMlogo.png";
import "../components/Home/Home.css";
import { Link, useNavigate } from "react-router-dom";
import Login from "./Home/Login/Login.jsx";
import { useAuth } from "../context/AuthContext";

const NavBar = () => {
  const [modal, setModal] = React.useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const toggleModal = () => {
    setModal(!modal);
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (modal) {
    document.body.classList.add("new_active-modal");
  } else {
    document.body.classList.remove("new_active-modal");
  }

  return (
    <nav className="nav-bar ">
      <div className="container">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <Link to="/">
              <img src={PMlogo} alt="logo" id="PMlogo" />
            </Link>
          </div>

          <div>
            {isAuthenticated ? (
              <button className="home-login-btn" onClick={handleLogout}>
                Log Out
              </button>
            ) : (
              <button className="home-login-btn" onClick={toggleModal}>
                Log In
              </button>
            )}

            {modal && (
              <div className="home-login-modal">
                <div className="home-login-modal-overlay" onClick={toggleModal}></div>
                <div className="home-login-modal-content">
                  <Login onSuccess={toggleModal} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;

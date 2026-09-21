import React from "react";
import PMlogo from "../../../assets/images/PMlogo.png";
import "./DownloadApp.css";

const DownloadApp = () => {
  return (
    <section className="download-app-section">
      <div className="container">
        <div className="download-app-content">
          <div className="download-app-left">
            <div className="download-app-image-wrapper">
              <div className="phone-mockup">
                <div className="phone-screen">
                  <div className="app-icon-large">
                    <img src={PMlogo} alt="PM Logo" className="phone-app-icon" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="download-app-right">
            <h2 className="download-app-title">WHAT ARE YOU WAITING FOR?</h2>
            <div className="download-icons">
              <a href="#" className="download-icon-link play-store-icon" aria-label="Download on Google Play">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Google Play Store Icon - Blue triangle with white play button */}
                  <path
                    d="M8 4L48 30L8 56V4Z"
                    fill="#0867db"
                  />
                  <path
                    d="M22 30L30 25L30 35L22 30Z"
                    fill="white"
                  />
                </svg>
              </a>
              <a href="#" className="download-icon-link" aria-label="Download PM App">
                <img src={PMlogo} alt="PM Logo" className="pm-logo-icon" />
              </a>
            </div>
            <p className="download-app-text">DOWNLOAD THE PM APP ON PLAYSTORE</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DownloadApp;


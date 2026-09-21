import React, { useState, useEffect } from "react";
import PMlogo from "../../../assets/images/PMlogo.png";
import "./Footer.css";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [socialLinks, setSocialLinks] = useState({
    facebook: "#",
    twitter: "#",
    instagram: "#"
  });

  useEffect(() => {
    setSocialLinks({ facebook: "#", twitter: "#", instagram: "#" });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle email submission
    console.log("Email submitted:", email);
    setEmail("");
  };

  return (
    <footer className="home-footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-left">
            <img src={PMlogo} alt="PM Logo" className="footer-logo" />
            <h3 className="footer-subscribe-title">Subscribe to our notifications</h3>
            <form onSubmit={handleSubmit} className="footer-subscribe-form">
              <input
                type="email"
                placeholder="Enter your email here"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="footer-email-input"
                required
              />
              <button type="submit" className="footer-subscribe-btn">
                Subscribe
              </button>
            </form>
            <p className="footer-copyright">© 2024 Peace of Mind</p>
          </div>
          <div className="footer-right">
            <div className="footer-links">
              <a href="#" className="footer-link">
                About Us
              </a>
              <a href="#" className="footer-link">
                Help & Support
              </a>
              <a href="#" className="footer-link">
                Contact Us
              </a>
              <a href="#" className="footer-link">
                Terms & Policies
              </a>
            </div>
            <div className="footer-social">
              <a
                href={socialLinks.facebook}
                className="social-icon"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (socialLinks.facebook === "#") {
                    e.preventDefault();
                  }
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a
                href={socialLinks.twitter}
                className="social-icon"
                aria-label="Twitter"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (socialLinks.twitter === "#") {
                    e.preventDefault();
                  }
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a
                href={socialLinks.instagram}
                className="social-icon"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (socialLinks.instagram === "#") {
                    e.preventDefault();
                  }
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect
                    x="2"
                    y="2"
                    width="20"
                    height="20"
                    rx="5"
                    ry="5"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <path
                    d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zM17.5 6.5h.01"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;








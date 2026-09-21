import React from "react";
import { useNavigate } from "react-router-dom";
import AdminNav from "../../Navigation/AdminNav";
import "../MailMessenger.css";
import "./MailDisplayOption.css";

const MailDisplayOption = () => {
  const navigate = useNavigate();

  const handleOptionClick = (option) => {
    if (option === "STANDARD MAIL") {
      navigate("/admin/mail-messenger/standard-mail");
    } else if (option === "INTERNAL MAIL") {
      // TODO: Navigate to internal mail when implemented
      console.log("Internal Mail clicked");
    } else if (option === "OFFICE MAIL") {
      // TODO: Navigate to office mail when implemented
      console.log("Office Mail clicked");
    }
  };

  const options = ["INTERNAL MAIL", "STANDARD MAIL", "OFFICE MAIL"];

  return (
    <div className="admin-container">
      <AdminNav />
      <div className="mail-display-parent">
        <div className="mail-display-card-full">
          <div className="mail-display-header-blue">
            <span>MAIL DISPLAY OPTION</span>
          </div>
          <div className="mail-display-options-container">
            {options.map((option, index) => (
              <div
                key={index}
                className="mail-display-option-card"
                onClick={() => handleOptionClick(option)}
              >
                {option}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MailDisplayOption;

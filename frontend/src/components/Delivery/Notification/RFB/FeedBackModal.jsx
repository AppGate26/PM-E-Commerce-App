import React from "react";
import FeedBack from "./FeedBack";

const FeedBackModal = ({ isOpen, toggleFeedBackModal }) => {
  const closeModal = () => {
    toggleFeedBackModal();
  };

  if (!isOpen) return null;

  return (
    <div className="Csh_modal">
      <div className="Csh_modal-overlay " onClick={closeModal}></div>
      <div className="Csh_modal-content">
        <FeedBack toggleFeedBackModal={toggleFeedBackModal}/>
      </div>
    </div>
  );
};

export default FeedBackModal;

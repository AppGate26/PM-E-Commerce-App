import React from "react";
import EditSubcat from "./EditSubcat.jsx";

const EditSubCatModal = ({ isOpen, toggleEditSubCat }) => {
 const closeModal = () => {
   toggleEditSubCat(); // Call toggleModal function to close the modal
 };


  const handleSave = () => {
    toggleEditSubCat(); // Toggle modal visibility
  };

  if (!isOpen) return null;

  return (
    <div className="EditSubCat_modal">
      <div
        className="EditSubCat_modal-overlay "
        onClick={toggleEditSubCat}
      ></div>
      <div className="EditSubCat_modal-content">
        <EditSubcat handleSave={handleSave} toggleEditSubCat={toggleEditSubCat}/>
      </div>
    </div>
  );
};

export default EditSubCatModal;

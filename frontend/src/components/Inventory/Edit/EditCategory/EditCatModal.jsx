import React from "react";
import EditCategory from "./EditCategory.jsx";

const EditCatModal = ({ isOpen, toggleEditCat }) => {
 const closeModal = () => {
   toggleEditCat(); // Call toggleModal function to close the modal
 };


  const handleSave = () => {
    toggleEditCat();
  };
  if (!isOpen) return null;

  return (
    <div className="EditCat_modal">
      <div className="EditCat_modal-overlay " onClick={toggleEditCat}></div>
      <div className="EditCat_modal-content">
        <EditCategory handleSave={handleSave}  toggleEditCat={toggleEditCat}/>
      </div>
    </div>
  );
};

export default EditCatModal;

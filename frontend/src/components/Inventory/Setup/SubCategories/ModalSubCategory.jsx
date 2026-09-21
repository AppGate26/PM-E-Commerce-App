import React from "react";
import SubCategory from "./SubCategory.jsx";

const ModalSubCategory = ({ isOpen, toggleModalSubCategory }) => {

  const closeModal = () => {
    toggleModalSubCategory(); // Call toggleModal function to close the modal
  };
  if (!isOpen) return null;

  return (
    <div className="subcategory_modal">
      <div
        className="subcategory_modal-overlay setup-li-dropdown"
        onClick={toggleModalSubCategory}
      ></div>
      <div className="subcategory_modal-content">
        <SubCategory toggleModalSubCategory={toggleModalSubCategory}/>
      </div>
    </div>
  );
};

export default ModalSubCategory;

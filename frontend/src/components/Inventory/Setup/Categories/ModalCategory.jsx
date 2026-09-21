import React from "react";
import Categories from "./Categories.jsx";

const ModalCategory = ({ isOpen, toggleModalCategory }) => {
 const closeModal = () => {
   toggleModalCategory(); // Call toggleModal function to close the modal
 };

  if (!isOpen) return null;

  return (
    <div className="category_modal">
      <div
        className="category_modal-overlay setup-li-dropdown"
        onClick={toggleModalCategory}
      ></div>
      <div className="category_modal-content">
        <Categories toggleModalCategory={toggleModalCategory} />
      </div>
    </div>
  );
};

export default ModalCategory;

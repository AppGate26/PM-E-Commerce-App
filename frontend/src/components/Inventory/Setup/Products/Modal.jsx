import React from "react";
import Products from "./Products.jsx";

const Modal = ({
  isOpen,
  toggleModal,
  openCategoryFromProductModal,
  openSubCategoryFromProductModal,
}) => {
  const closeModal = () => {
    toggleModal(); // Call toggleModal function to close the modal
  };

  if (!isOpen) return null;

  return (
    <div className="product_modal">
      <div
        className="product_modal-overlay setup-li-dropdown"
        onClick={closeModal}
      ></div>
      <div className="product_modal-content">
        <Products
          toggleModal={toggleModal}
          openCategoryFromProductModal={openCategoryFromProductModal}
          openSubCategoryFromProductModal={openSubCategoryFromProductModal}
        />
      </div>
    </div>
  );
};

export default Modal;

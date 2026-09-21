import React, { useState } from "react";
import logo from "../../../../assets/images/adminLogo.png";
import "./EditProduct.css";
import "./EditProductQuery.css";
import { Link } from "react-router-dom";
import SelectForm from "./SelectForm";

const EditProducts = () => {
  const [modal, setModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const toggleModal = () => {
    setModal((prev) => !prev);
  };

  const handleImageChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    setSelectedImage(selectedFile);
  };

  if (modal) {
    document.body.classList.add("new_active-modal");
  } else {
    document.body.classList.remove("new_active-modal");
  }

  return (
    <div className="edit-products-page">
      <nav className="edit-nav edit-nav--standard">
        <div className="edit-products-brand">
          <Link to="/adminDashboard">
            <img src={logo} alt="logo" className="logo-product" />
          </Link>
          <div>
            <p className="edit-products-eyebrow">Inventory Editor</p>
            <h1 className="edit-txt">edit products</h1>
          </div>
        </div>
        <Link to="/inventory">
          <button className="Log_Out-btn edit-products-back-btn">
            Back to Inventory
          </button>
        </Link>
      </nav>

      <section className="edit-products-hero-wrap">
        <div className="edit-products-hero">
          <div className="edit-products-hero-copy">
            <p className="edit-products-hero-badge">Product Maintenance</p>
            <h2>Find a product and prepare its edits</h2>
            <p>
              Search the catalogue below, review the important fields, and work
              through product updates from a cleaner standard workspace.
            </p>
          </div>
          <div className="edit-products-image-card">
            <div className="edit-products-image-preview">
              {selectedImage ? (
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Selected Product"
                  className="selected-image"
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="70"
                  height="70"
                  fill="#0867db"
                  className="bi bi-image"
                  viewBox="0 0 16 16"
                >
                  <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" />
                  <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1z" />
                </svg>
              )}
            </div>
            <div className="edit-products-image-meta">
              <span>Product image</span>
              <button className="change-image-btn" onClick={toggleModal}>
                change
              </button>
            </div>
          </div>
        </div>
      </section>

      {modal && (
        <div className="img_modal">
          <div className="img_modal-overlay" onClick={toggleModal}></div>
          <div className="img_modal-content">
            <div className="close-modal" onClick={toggleModal}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="36"
                height="36"
                fill="#fff"
                className="bi bi-x cancel-bg"
                viewBox="0 0 16 16"
              >
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
              </svg>
            </div>

            <div className="col-sm-12 col-md-6 inputs-box">
              <label>upload product image</label>
              <div className="uploader-file_box">
                <input
                  type="file"
                  id="upload-file-input"
                  onChange={handleImageChange}
                />
                <div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="26"
                    height="26"
                    fill="#0867db"
                    className="bi bi-upload icon_upload"
                    viewBox="0 0 16 16"
                  >
                    <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5" />
                    <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="edit-products-selection-shell">
        <SelectForm />
      </div>
    </div>
  );
};

export default EditProducts;

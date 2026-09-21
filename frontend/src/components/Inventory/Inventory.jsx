import React, { useEffect, useRef, useState } from "react";
import "./styles/Inventory.css";
import "./styles/InventoryQuery.css";
import logo from "../../assets/images/PMlogo.png";
import { Link, useNavigate } from "react-router-dom";
import Hub from "./Hub";
import Modal from "./Setup/Products/Modal.jsx";
import ModalCategory from "./Setup/Categories/ModalCategory.jsx";
import ModalSubCategory from "./Setup/SubCategories/ModalSubCategory.jsx";
import EditCatModal from "./Edit/EditCategory/EditCatModal.jsx";
import EditSubCatModal from "./Edit/EditSubcategory/EditSubCatModal.jsx";
import RegModal from "./Supplier/Reg/RegModal.jsx";
import PaymentModal from "./Supplier/Payment/PaymentModal.jsx";
import ProformaModal from "./Supplier/Proforma/ProformaModal.jsx";
import GoodsModal from "./Supplier/GoodSupplied/GoodsModal.jsx";
import SupplierLedgerModal from "./Supplier/Ledger/SupplierLedgerModal.jsx";
import PaySupplierModal from "./Supplier/PaySupplier/PaySupplierModal.jsx";
import ModalStockSetup from "./Stock/StockSetup/OpeningStock/ModalStockSetup.jsx";
import StockAddModal from "./Stock/StockSetup/AddStock/StockAddModal.jsx";
import StockEditModal from "./Stock/Edit/StockEditModal.jsx";
import { TfiMenu } from "react-icons/tfi";
import { IoIosCloseCircleOutline } from "react-icons/io";
import "../../Styles/ModuleStandard.css";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import ModuleUserChip from "../shared/ModuleUserChip";

const Inventory = () => {
  const { t } = useLanguage();
  const { allowedModules, isAdmin, user, logout, activeBranchId, setActiveBranch } = useAuth();
  const navigate = useNavigate();

  // Inventory always operates at Head Office; branch selection happens inside each
  // report instead of the global switcher. If a stale branch scope is lingering
  // from another module, drop it so stock/setup actions here file under Head
  // Office. setActiveBranch reloads once when it actually clears something.
  useEffect(() => {
    if (activeBranchId) setActiveBranch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const canAccessMessenger = isAdmin || allowedModules?.includes("mail_messenger");
  const navRef = useRef(null);
  const [modal, setModal] = useState(false);
  const [modalCategory, setModalCategory] = useState(false);
  const [modalSubCategory, setModalSubCategory] = useState(false);
  const [modalEditCat, setModalEditCat] = useState(false);
  const [modalEditSubCat, setModalEditSubCat] = useState(false);
  const [modalReg, setModalReg] = useState(false);
  const [modalPayment, setModalPayment] = useState(false);
  const [modalProforma, setModalProforma] = useState(false);
  const [modalGoods, setModalGoods] = useState(false);
  const [modalStockSetup, setModalStockSetup] = useState(false);
  const [modalStockAdd, setModalStockAdd] = useState(false);
  const [modalStockEdit, setModalStockEdit] = useState(false);
  const [modalSupplierLedger, setModalSupplierLedger] = useState(false);
  const [modalPaySupplier, setModalPaySupplier] = useState(false);
  const [isProductDropdownOpen, setProductDropdownOpen] = useState(false);
  const [isSupplierDropdownOpen, setSupplierDropdownOpen] = useState(false);
  const [isStockDropdownOpen, setStockDropdownOpen] = useState(false);
  const [isSetupDropdownOpen, setSetupDropdownOpen] = useState(false);
  const [isEditDropdownOpen, setEditDropdownOpen] = useState(false);
  const [isStockSetupDropdownOpen, setStockSetupDropdownOpen] = useState(false);
  const [isReportDropdownOpen, setReportDropdownOpen] = useState(false);

  const closeAllDropdowns = () => {
    setProductDropdownOpen(false);
    setSupplierDropdownOpen(false);
    setStockDropdownOpen(false);
    setSetupDropdownOpen(false);
    setEditDropdownOpen(false);
    setStockSetupDropdownOpen(false);
    setReportDropdownOpen(false);
  };

  // Toggle functions
  const toggleProductDropdown = () =>
    setProductDropdownOpen((prev) => {
      const next = !prev;
      if (next) {
        setSupplierDropdownOpen(false);
        setStockDropdownOpen(false);
        setReportDropdownOpen(false);
      }
      return next;
    });
  const toggleSupplierDropdown = () =>
    setSupplierDropdownOpen((prev) => {
      const next = !prev;
      if (next) {
        setProductDropdownOpen(false);
        setStockDropdownOpen(false);
        setReportDropdownOpen(false);
      }
      return next;
    });
  const toggleStockDropdown = () =>
    setStockDropdownOpen((prev) => {
      const next = !prev;
      if (next) {
        setProductDropdownOpen(false);
        setSupplierDropdownOpen(false);
        setReportDropdownOpen(false);
      }
      return next;
    });
  const toggleReportDropdown = () =>
    setReportDropdownOpen((prev) => {
      const next = !prev;
      if (next) {
        setProductDropdownOpen(false);
        setSupplierDropdownOpen(false);
        setStockDropdownOpen(false);
        setSetupDropdownOpen(false);
        setEditDropdownOpen(false);
        setStockSetupDropdownOpen(false);
      }
      return next;
    });

  const toggleSetupDropdown = (event) => {
    event?.stopPropagation?.();
    setSetupDropdownOpen((prev) => {
      const next = !prev;
      if (next) {
        setEditDropdownOpen(false);
      }
      return next;
    });
  };
  const toggleEditDropdown = (event) => {
    event?.stopPropagation?.();
    setEditDropdownOpen((prev) => {
      const next = !prev;
      if (next) {
        setSetupDropdownOpen(false);
      }
      return next;
    });
  };
  const toggleStockSetupDropdown = (event) =>
    setStockSetupDropdownOpen((prev) => {
      event?.stopPropagation?.();
      return !prev;
    });

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        closeAllDropdowns();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Modal toggles
  const toggleModal = () => {
    closeAllDropdowns();
    setModal(!modal);
  };
  const toggleModalCategory = () => {
    closeAllDropdowns();
    setModalCategory(!modalCategory);
  };
  const toggleModalSubCategory = () => {
    closeAllDropdowns();
    setModalSubCategory(!modalSubCategory);
  };
  const toggleEditCat = () => {
    closeAllDropdowns();
    setModalEditCat(!modalEditCat);
  };
  const toggleEditSubCat = () => {
    closeAllDropdowns();
    setModalEditSubCat(!modalEditSubCat);
  };
  const toggleRegModal = () => {
    closeAllDropdowns();
    setModalReg(!modalReg);
  };
  const togglePayment = () => {
    closeAllDropdowns();
    setModalPayment(!modalPayment);
  };
  const toggleProforma = () => {
    closeAllDropdowns();
    setModalProforma(!modalProforma);
  };
  const toggleGoods = () => {
    closeAllDropdowns();
    setModalGoods(!modalGoods);
  };
  const toggleSupplierLedger = () => {
    closeAllDropdowns();
    setModalSupplierLedger(!modalSupplierLedger);
  };
  const togglePaySupplier = () => {
    closeAllDropdowns();
    setModalPaySupplier(!modalPaySupplier);
  };
  const toggleStockSetup = () => {
    closeAllDropdowns();
    setModalStockSetup(!modalStockSetup);
  };
  const toggleStockAdd = () => {
    closeAllDropdowns();
    setModalStockAdd(!modalStockAdd);
  };
  const toggleStockEdit = () => {
    closeAllDropdowns();
    setModalStockEdit(!modalStockEdit);
  };
  const openCategoryFromProductModal = () => {
    setModal(false);
    setModalCategory(true);
  };
  const openSubCategoryFromProductModal = () => {
    setModal(false);
    setModalSubCategory(true);
  };
  if (modal) {
    document.body.classList.add("product_active-modal");
  } else {
    document.body.classList.remove("product_active-modal");
  }
  const openProductModal = (event) => {
    event?.stopPropagation?.();
    closeAllDropdowns();
    setModal(true);
  };
  const openCategoryModal = (event) => {
    event?.stopPropagation?.();
    closeAllDropdowns();
    setModalCategory(true);
  };
  const openSubCategoryModal = (event) => {
    event?.stopPropagation?.();
    closeAllDropdowns();
    setModalSubCategory(true);
  };
  const openStockSetupModal = (event) => {
    event?.stopPropagation?.();
    closeAllDropdowns();
    setModalStockSetup(true);
  };
  const openStockAddModal = (event) => {
    event?.stopPropagation?.();
    closeAllDropdowns();
    setModalStockAdd(true);
  };
  const openStockEditModal = (event) => {
    event?.stopPropagation?.();
    closeAllDropdowns();
    setModalStockEdit(true);
  };

  const closeOffcanvas = () => {
    const offcanvasElement = document.getElementById("offcanvasResponsive");
    const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasElement);
    if (offcanvasInstance) {
      offcanvasInstance.hide();
    }
  };

  const handleClick = (action) => {
    action(); // Execute the original action (e.g., `toggleStockSetup`, etc.)
    closeOffcanvas(); // Close the offcanvas
  };

  const handleLogout = () => {
    sessionStorage.removeItem("isAdmin");
    sessionStorage.removeItem("adminEmail");
    logout();
    navigate("/auth/login", { replace: true });
  };

  return (
    <div className='module-page-shell'>
      <div className='module-mobile-bar d-md-none d-flex justify-content-between align-items-center'>
        <Link to='/adminDashboard'>
          <img src={logo} alt='logo' className='hub-logo module-brand-logo' />
        </Link>

        <button
          className='btn btn-primary d-md-none  '
          id='menu-bar-sm'
          type='button'
          data-bs-toggle='offcanvas'
          data-bs-target='#offcanvasResponsive'
          aria-controls='offcanvasResponsive'
        >
          <TfiMenu size='28px' />
        </button>
      </div>

      <div>
        <nav ref={navRef} className='navbar navbar-expand-md inventory-nav d-none d-md-block module-desktop-nav'>
          <div className='container-fluid'>
            <Link to='/adminDashboard' className='module-brand-link'>
              <img src={logo} alt='logo' className='hub-logo module-brand-logo' />
              <div className='module-brand-copy'>
                <span className='module-brand-title'>Inventory Module</span>
                <span className='module-brand-subtitle'>Products, suppliers, stock, and reports</span>
              </div>
            </Link>

            <ul className='navbar-nav ms-auto mb-2 mb-lg-0 invent-ul-link align-items-center gap-5 module-nav-links'>
              {canAccessMessenger ? (
                <li className='nav-item'>
                  <Link to='/messenger' className='module-nav-pill module-quick-link'>
                    {t("Mail / Messenger")}
                  </Link>
                </li>
              ) : null}
              <li
                className={`nav-item dropdown module-nav-pill ${
                  isProductDropdownOpen ? "show" : ""
                }`}
                id='product-drop'
              >
                <button
                  type='button'
                  className='nav-link dropdown-toggle active invent_links text-white '
                  id='product'
                  aria-current='page'
                  role='button'
                  aria-expanded={isProductDropdownOpen}
                  onClick={(event) => {
                    event.preventDefault();
                    toggleProductDropdown();
                  }}
                >
                  {t("Product")}
                </button>

                <ul
                  className={`product-ul_dropdown dropdown-menu ${
                    isProductDropdownOpen ? "show" : ""
                  }`}
                >
                  {/* Setup Sub-Menu */}
                  <li id='setup-drop'>
                    <div
                      className='dropdown-item product_dropdown '
                      onClick={toggleSetupDropdown}
                    >
                      {t("Set ups")}
                      <ul
                        className={`setup-ul-dropdown ${
                          isSetupDropdownOpen ? "show" : ""
                        }`}
                      >
                        <li className='setup-li-dropdown' onClick={openProductModal}>
                          {t("Add product")}
                        </li>
                        <li className='setup-li-dropdown'>
                          <Link
                            to='/allProducts'
                            className='text-decoration-none text-secondary'
                          >
                            {t("All products")}
                          </Link>
                        </li>
                        <li
                          className='setup-li-dropdown'
                          onClick={openCategoryModal}
                        >
                          {t("Categories")}
                        </li>
                        <li
                          className='setup-li-dropdown'
                          onClick={openSubCategoryModal}
                        >
                          {t("Sub categories")}
                        </li>
                      </ul>
                    </div>
                  </li>
                  <hr />
                  {/* Edit Sub-Menu */}
                  <li id='Edit-drop'>
                    <div
                      className='dropdown-item product_dropdown '
                      onClick={toggleEditDropdown}
                    >
                      {t("Edit")}
                    </div>
                    <ul
                      className={`Edit-ul-dropdown ${
                        isEditDropdownOpen ? "show" : ""
                      }`}
                    >
                      <li className='Edit-li-dropdown'>
                        <Link
                          to='/allProducts'
                          className='text-decoration-none text-secondary'
                        >
                          {t("Edit products")}
                        </Link>
                      </li>
                      <li className='Edit-li-dropdown'>
                        <Link
                          to='/categories'
                          className='text-decoration-none text-secondary'
                        >
                          {t("Categories")}
                        </Link>
                      </li>
                      <li className='Edit-li-dropdown'>
                        <Link
                          to='/editCategories'
                          className='text-decoration-none text-secondary'
                        >
                          {t("Edit categories")}
                        </Link>
                      </li>
                      <li className='Edit-li-dropdown'>
                        <Link
                          to='/subcategories'
                          className='text-decoration-none text-secondary'
                        >
                          {t("Sub categories")}
                        </Link>
                      </li>
                      <li className='Edit-li-dropdown'>
                        <Link
                          to='/editSubcategories'
                          className='text-decoration-none text-secondary'
                        >
                          {t("Edit sub categories")}
                        </Link>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>

              {/* SUPPLIER LINKS */}
              <li
                className={`nav-item module-nav-pill ${isSupplierDropdownOpen ? "show" : ""}`}
                id='supplier-drop'
              >
                <Link
                  className='nav-link dropdown-toggle active invent_links text-white  align-items-center d-flex '
                  id='supplier'
                  aria-current='page'
                  href='#'
                  role='button'
                  onClick={toggleSupplierDropdown}
                  aria-expanded={isSupplierDropdownOpen}
                >
                  {t("Supplier")}
                </Link>

                <ul
                  className={`supplier-ul-dropdown dropdown-menu ${
                    isSupplierDropdownOpen ? "show" : ""
                  }`}
                >
                  <li onClick={toggleRegModal}>{t("Supplier registration")}</li>
                  <hr />
                  <li>
                    <Link
                      to="/inventory/suppliers"
                      className="text-decoration-none text-secondary"
                    >
                      {t("View suppliers")}
                    </Link>
                  </li>
                  <hr />
                  <li onClick={toggleGoods}>{t("Goods supplied")}</li>
                  <hr />
                  <li onClick={togglePayment}>{t("Payment terms")}</li>
                  <hr />
                  <li onClick={toggleProforma}>{t("Generate proforma")}</li>
                  <hr />
                  <li onClick={toggleSupplierLedger}>{t("Supplier ledger")}</li>
                  <hr />
                  <li onClick={togglePaySupplier}>{t("Pay supplier")}</li>
                </ul>
              </li>

              {/* STOCK LINKS */}
              <li
                className={`nav-item module-nav-pill ${isStockDropdownOpen ? "show" : ""}`}
                id='stock-drop'
              >
                <Link
                  id='stock'
                  className='nav-link dropdown-toggle  invent_links text-white text-white '
                  aria-current='page'
                  role='button'
                  onClick={toggleStockDropdown}
                  aria-expanded={isStockDropdownOpen}
                >
                  {t("Stock")}
                </Link>

                <ul
                  className={`stock-ul-dropdown dropdown-menu ${
                    isStockDropdownOpen ? "show" : ""
                  }`}
                >
                  <li id='stock_setup-drop'>
                    <div
                      className='dropdown-item stock_dropdown'
                      onClick={toggleStockSetupDropdown}
                    >
                      {t("Setup")}
                      <ul
                        className={`stock_setup-ul-dropdown ${
                          isStockSetupDropdownOpen ? "show" : ""
                        }`}
                      >
                        <li
                          className='stock_setup-li-dropdown'
                          onClick={openStockSetupModal}
                        >
                          {t("Opening stock")}
                        </li>
                        <li
                          className='stock_setup-li-dropdown'
                          onClick={openStockAddModal}
                        >
                          {t("Add stock")}
                        </li>
                      </ul>
                    </div>
                  </li>
                  <hr />
                  <li>
                    <div
                      className='dropdown-item stock_dropdown'
                      onClick={openStockEditModal}
                    >
                      {t("Edit setup")}
                    </div>
                  </li>
                </ul>
              </li>

              <li className={`nav-item module-nav-pill ${isReportDropdownOpen ? "show" : ""}`} id='report-drop'>
                <Link
                  id='report'
                  className='nav-link dropdown-toggle  invent_links text-white text-white'
                  aria-current='page'
                  role='button'
                  aria-expanded={isReportDropdownOpen}
                  onClick={toggleReportDropdown}
                >
                  {t("Report")}
                </Link>
                <ul className={`report-ul-dropdown ${isReportDropdownOpen ? "show" : ""}`}>
                  <li className='report-li-dropdown'>
                    <Link
                      to="/inventory/reports/product"
                      className="text-decoration-none text-secondary"
                      onClick={closeAllDropdowns}
                    >
                      {t("Product")}
                    </Link>
                  </li>
                  <li className='report-li-dropdown'>
                    <Link
                      to="/inventory/reports/product/sub-category"
                      className="text-decoration-none text-secondary"
                      onClick={closeAllDropdowns}
                    >
                      {t("Sub category")}
                    </Link>
                  </li>
                  <li className='report-li-dropdown'>
                    <Link
                      to="/inventory/reports/product/category"
                      className="text-decoration-none text-secondary"
                      onClick={closeAllDropdowns}
                    >
                      {t("Category")}
                    </Link>
                  </li>
                  <li className='report-li-dropdown'>
                    <Link
                      to="/inventory/reports/supplier-info"
                      className="text-decoration-none text-secondary"
                      onClick={closeAllDropdowns}
                    >
                      {t("Supplier info")}
                    </Link>
                  </li>
                  <li className='report-li-dropdown'>
                    <Link
                      to="/inventory/reports/goods-supplied"
                      className="text-decoration-none text-secondary"
                      onClick={closeAllDropdowns}
                    >
                      {t("Goods supplied")}
                    </Link>
                  </li>
                  <li className='report-li-dropdown'>
                    <Link
                      to="/inventory/reports/payment-terms"
                      className="text-decoration-none text-secondary"
                      onClick={closeAllDropdowns}
                    >
                      {t("Payment terms")}
                    </Link>
                  </li>
                  <li className='report-li-dropdown'>
                    <Link
                      to="/inventory/reports/opening-stock"
                      className="text-decoration-none text-secondary"
                      onClick={closeAllDropdowns}
                    >
                      {t("Opening stock")}
                    </Link>
                  </li>
                  <li className='report-li-dropdown'>
                    <Link
                      to="/inventory/reports/stock"
                      className="text-decoration-none text-secondary"
                      onClick={closeAllDropdowns}
                    >
                      {t("Stock")}
                    </Link>
                  </li>
                  <li className='report-li-dropdown'>
                    <Link
                      to="/inventory/reports/product/movement"
                      className="text-decoration-none text-secondary"
                      onClick={closeAllDropdowns}
                    >
                      {t("Product Movement")}
                    </Link>
                  </li>
                </ul>
              </li>
              <li className='nav-item'>
                <button
                  type='button'
                  className='Log_Out-btn module-logout-btn'
                  id='Log_Out-btn-sm'
                  onClick={handleLogout}
                >
                  {t("Log out")}
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div
        className='offcanvas offcanvas-end'
        tabIndex='-1'
        id='offcanvasResponsive'
        aria-labelledby='offcanvasResponsiveLabel'
      >
        <div className='offcanvas-header d-flex justify-content-between bg-primary'>
          <div className=''>
            <IoIosCloseCircleOutline
              size='40px'
              color='#ffffffde'
              data-bs-dismiss='offcanvas'
              data-bs-target='#offcanvasResponsive'
              aria-label='Close'
            />
          </div>
          <Link to='/adminDashboard'>
            <img
              src={logo}
              alt='logo'
              style={{ width: "40px", height: "40px" }}
            />
          </Link>
        </div>
        <div className='offcanvas-body offcanvas-body-inventory'>
          <div className='accordion accordion-flush' id='accordionFlushExample'>
            <div className='accordion-item'>
              <h2 className='accordion-header'>
                <button
                  className='accordion-button  collapsed '
                  type='button'
                  data-bs-toggle='collapse'
                  data-bs-target='#flush-collapseOne'
                  aria-expanded='false'
                  aria-controls='flush-collapseOne'
                >
                  <div className='me-5'>{t("Product")}</div>
                </button>
              </h2>
              <div
                id='flush-collapseOne'
                className='accordion-collapse collapse'
                data-bs-parent='#accordionFlushExample'
              >
                <div className='accordion-body bg-white'>
                  {/* <!-- Default dropend button --> */}
                  <div className='btn-group dropend'>
                    <button
                      type='button'
                      className='btn btn-white dropdown-toggle'
                      data-bs-toggle='dropdown'
                      aria-expanded='false'
                    >
                      <span className='me-5'>{t("Setup").toUpperCase()}</span>
                    </button>
                    <ul className='dropdown-menu dropdown-menu-inventory'>
                      <h5 onClick={() => handleClick(toggleModal)}>
                        {t("Add product").toUpperCase()}
                      </h5>
                      <h5>
                        <Link
                          to='/allProducts'
                          className='text-decoration-none text-secondary'
                        >
                          {t("All products").toUpperCase()}
                        </Link>
                      </h5>
                      <h5 onClick={() => handleClick(toggleModalCategory)}>
                        {t("Categories").toUpperCase()}
                      </h5>
                      <h5 onClick={() => handleClick(toggleModalSubCategory)}>
                        {t("Sub categories").toUpperCase()}
                      </h5>
                    </ul>
                  </div>{" "}
                  <br />
                  <div className='btn-group dropend'>
                    <button
                      type='button'
                      className='btn btn-white dropdown-toggle'
                      data-bs-toggle='dropdown'
                      aria-expanded='false'
                    >
                      <span className='me-5'>{t("Edit").toUpperCase()}</span>
                    </button>
                    <ul className='dropdown-menu dropdown-menu-inventory'>
                      <h5>
                        <Link
                          to='/allProducts'
                          className='text-decoration-none text-secondary'
                          onClick={closeOffcanvas}
                        >
                          {t("Edit product").toUpperCase()}
                        </Link>
                      </h5>
                      <h5>
                        <Link
                          to='/categories'
                          className='text-decoration-none text-secondary'
                        >
                          {t("Categories").toUpperCase()}
                        </Link>
                      </h5>
                      <h5>
                        <Link
                          to='/editCategories'
                          className='text-decoration-none text-secondary'
                        >
                          {t("Edit categories").toUpperCase()}
                        </Link>
                      </h5>
                      <h5>
                        <Link
                          to='/subcategories'
                          className='text-decoration-none text-secondary'
                        >
                          {t("Sub categories").toUpperCase()}
                        </Link>
                      </h5>
                      <h5>
                        <Link
                          to='/editSubcategories'
                          className='text-decoration-none text-secondary'
                        >
                          {t("Edit sub categories").toUpperCase()}
                        </Link>
                      </h5>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className='accordion-item'>
              <h2 className='accordion-header'>
                <button
                  className='accordion-button collapsed'
                  type='button'
                  data-bs-toggle='collapse'
                  data-bs-target='#flush-collapseTwo'
                  aria-expanded='false'
                  aria-controls='flush-collapseTwo'
                >
                  <span className='me-5'>{t("Supplier")}</span>
                </button>
              </h2>
              <div
                id='flush-collapseTwo'
                className='accordion-collapse collapse'
                data-bs-parent='#accordionFlushExample'
              >
                <div className='accordion-body bg-white '>
                  <h5
                    onClick={() => handleClick(toggleRegModal)}
                    className='accordion-body-H5'
                  >
                    {t("Supplier registration").toUpperCase()}
                  </h5>
                  <h5
                    onClick={() => handleClick(toggleGoods)}
                    className='accordion-body-H5'
                  >
                    {t("Goods supplied").toUpperCase()}
                  </h5>
                  <h5
                    onClick={() => handleClick(togglePayment)}
                    className='accordion-body-H5'
                  >
                    {t("Payment terms").toUpperCase()}
                  </h5>
                  <h5
                    onClick={() => handleClick(toggleProforma)}
                    className='accordion-body-H5'
                  >
                    {t("Generate proforma").toUpperCase()}
                  </h5>
                  <h5
                    onClick={() => handleClick(toggleSupplierLedger)}
                    className='accordion-body-H5'
                  >
                    {t("Supplier ledger").toUpperCase()}
                  </h5>
                  <h5
                    onClick={() => handleClick(togglePaySupplier)}
                    className='accordion-body-H5'
                  >
                    {t("Pay supplier").toUpperCase()}
                  </h5>
                </div>
              </div>
            </div>
            <div className='accordion-item'>
              <h2 className='accordion-header'>
                <button
                  className='accordion-button collapsed'
                  type='button'
                  data-bs-toggle='collapse'
                  data-bs-target='#flush-collapseThree'
                  aria-expanded='false'
                  aria-controls='flush-collapseThree'
                >
                  <span className='me-5'>{t("Stock")}</span>
                </button>
              </h2>
              <div
                id='flush-collapseThree'
                className='accordion-collapse collapse'
                data-bs-parent='#accordionFlushExample'
              >
                <div className='accordion-body bg-white'>
                  <div className='btn-group dropend'>
                    <button
                      type='button'
                      className='btn btn-white dropdown-toggle'
                      data-bs-toggle='dropdown'
                      aria-expanded='false'
                    >
                      <span className='me-5'>{t("Setup").toUpperCase()}</span>
                    </button>
                    <ul className='dropdown-menu dropdown-menu-inventory'>
                      <h5 onClick={() => handleClick(toggleStockSetup)}>
                        {t("Opening stock").toUpperCase()}
                      </h5>
                      <h5 onClick={() => handleClick(toggleStockAdd)}>
                        {t("Add stock").toUpperCase()}
                      </h5>
                    </ul>
                  </div>

                  <h5
                    onClick={() => handleClick(toggleStockEdit)}
                    className='accordion-body-H5 '
                  >
                    {t("Edit setup").toUpperCase()}
                  </h5>
                </div>
              </div>
            </div>
            <div className='accordion-item'>
              <h2 className='accordion-header'>
                <button
                  className='accordion-button collapsed'
                  type='button'
                  data-bs-toggle='collapse'
                  data-bs-target='#flush-collapseFour'
                  aria-expanded='false'
                  aria-controls='flush-collapseFour'
                >
                  <span className='me-5'>{t("Report")}</span>
                </button>
              </h2>
              <div
                id='flush-collapseFour'
                className='accordion-collapse collapse'
                data-bs-parent='#accordionFlushExample'
              >
                <div className='accordion-body bg-white'>
                  <h5 className='accordion-body-H5'>{t("Product").toUpperCase()}</h5>
                  <h5 className='accordion-body-H5'>
                    <Link
                      to="/inventory/reports/product/sub-category"
                      className="text-decoration-none text-dark"
                    >
                      {t("Sub category").toUpperCase()}
                    </Link>
                  </h5>
                  <h5 className='accordion-body-H5'>
                    <Link
                      to="/inventory/reports/product/category"
                      className="text-decoration-none text-dark"
                    >
                      {t("Category").toUpperCase()}
                    </Link>
                  </h5>
                  <h5 className='accordion-body-H5'>
                    <Link
                      to="/inventory/reports/supplier-info"
                      className="text-decoration-none text-dark"
                    >
                      {t("Supplier info").toUpperCase()}
                    </Link>
                  </h5>
                  <h5 className='accordion-body-H5'>
                    <Link
                      to="/inventory/reports/goods-supplied"
                      className="text-decoration-none text-dark"
                    >
                      {t("Goods supplied").toUpperCase()}
                    </Link>
                  </h5>
                  <h5 className='accordion-body-H5'>
                    <Link
                      to="/inventory/reports/payment-terms"
                      className="text-decoration-none text-dark"
                    >
                      {t("Payment terms").toUpperCase()}
                    </Link>
                  </h5>
                  <h5 className='accordion-body-H5'>
                    <Link
                      to="/inventory/reports/opening-stock"
                      className="text-decoration-none text-dark"
                    >
                      {t("Opening stock").toUpperCase()}
                    </Link>
                  </h5>
                  <h5 className='accordion-body-H5'>
                    <Link
                      to="/inventory/reports/stock"
                      className="text-decoration-none text-dark"
                    >
                      {t("Stock").toUpperCase()}
                    </Link>
                  </h5>
                  <h5 className='accordion-body-H5'>
                    <Link
                      to="/inventory/reports/product/movement"
                      className="text-decoration-none text-dark"
                    >
                      {t("Product Movement").toUpperCase()}
                    </Link>
                  </h5>
                </div>
              </div>
            </div>
          </div>
          {/* <!-- Default dropend button --> */}
          <button
            type='button'
            className='btn btn-primary fs-3 px-4 fw-semibold mt-5'
            onClick={handleLogout}
          >
            {t("Log out")}
          </button>
        </div>
      </div>

      <div className='module-content-shell module-surface'>
        <div className='module-heading-band'>
          <div className='module-heading-copy'>
            <h1>{t("Inventory Operations")}</h1>
            <p>{t("Set up products, manage suppliers, handle stock processes, and open inventory reports.")}</p>
          </div>
          <div className='module-heading-actions'>
            <ModuleUserChip user={user} lockBranchToHeadOffice />
            <div className='module-heading-badge'>{t("Inventory")}</div>
          </div>
        </div>
        <Hub />
      </div>

      {/* MODAL CONTENT DISPLAY FOR PRODUCTS*/}
      <Modal
        isOpen={modal}
        toggleModal={toggleModal}
        openCategoryFromProductModal={openCategoryFromProductModal}
        openSubCategoryFromProductModal={openSubCategoryFromProductModal}
      />
      <ModalCategory
        isOpen={modalCategory}
        toggleModalCategory={toggleModalCategory}
      />
      <ModalSubCategory
        isOpen={modalSubCategory}
        toggleModalSubCategory={toggleModalSubCategory}
      />
      <EditCatModal isOpen={modalEditCat} toggleEditCat={toggleEditCat} />
      <EditSubCatModal
        isOpen={modalEditSubCat}
        toggleEditSubCat={toggleEditSubCat}
      />

      {/* MODAL CONTENT DISPLAY FOR SUPPLIER*/}
      <RegModal isOpen={modalReg} toggleRegModal={toggleRegModal} />
      <GoodsModal isOpen={modalGoods} toggleGoods={toggleGoods} />
      <PaymentModal isOpen={modalPayment} togglePayment={togglePayment} />
      <ProformaModal isOpen={modalProforma} toggleProforma={toggleProforma} />
      <SupplierLedgerModal isOpen={modalSupplierLedger} toggleSupplierLedger={toggleSupplierLedger} />
      <PaySupplierModal isOpen={modalPaySupplier} togglePaySupplier={togglePaySupplier} />

      {/* MODAL CONTENT DISPLAY FOR STOCK*/}
      <ModalStockSetup
        isOpen={modalStockSetup}
        toggleStockSetup={toggleStockSetup}
      />
      <StockAddModal isOpen={modalStockAdd} toggleStockAdd={toggleStockAdd} />
      <StockEditModal
        isOpen={modalStockEdit}
        toggleStockEdit={toggleStockEdit}
      />
    </div>
  );
};

export default Inventory;

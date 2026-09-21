import React, { useEffect, useRef, useState } from "react";
import "./OrderTab.css";
import "./OrderTabQuery.css";
import logo from "../../../assets/images/adminLogo.png";
import { Link } from "react-router-dom";
import OrderSection from "./OrderSection";
import CshModal from "../Sales/WalkIn/CashSales/ChsModal";
import CdsModal from "../Sales/WalkIn/CreditSales/CdsModal";
import OcsModal from "../Sales/OnlineSales/OnCredit/OcsModal";
import OnOnesModal from "../Sales/OnlineSales/OnOneSales/OnOnesModal";
import CompletedPaymentsModal from "../Sales/CompletedPayments/CompletedPaymentsModal";
import DebugOrdersModal from "../Sales/DebugOrders/DebugOrdersModal";
import ReportsModal from "../Report/ReportSales/ReportsModal";
import ReportOrderModal from "../Report/ReportOrder/ReportOrderModal";
import RefundReturnReportModal from "../Report/RefundReturnReport/RefundReturnReportModal";
import CancelledReportModal from "../Report/CancelledReport/CancelledReportModal";
import MrkPaidModal from "../Order/Action/MarkAsPaid/MrkPaidModal";
import OneOfOrdModal from "../Order/Action/OneOfOrder/OneOfOrdModal";
import OrdListPaidModal from "../Order/Action/OrderListPaid/OrdListPaidModal";
import RefundModal from "../Order/Action/RefundOrder/RefundModal";
import ReturnOrderModal from "../Order/Action/ReturnOrder/ReturnOrderModal";
import RestoreOrderModal from "../Order/Action/RestoreOrder/RestoreOrderModal";
import CancelModal from "../Order/Action/CancelledOrder/CancelModal";
import OrdListModal from "../Order/Notification/OrderList/OrdListModal";
import CancelledModal from "../Order/Notification/Cancelled/CancelledModal";
import RefundNtfModal from "../Order/Notification/Refund/RefundNtfModal.jsx";
import { TfiMenu } from "react-icons/tfi";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { apiRequest } from "../../../lib/config";
import "../../../Styles/ModuleStandard.css";
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import ModuleUserChip from "../../shared/ModuleUserChip";

const OrderTab = () => {
  const { t } = useLanguage();
  const { allowedModules, isAdmin, user } = useAuth();
  const canAccessMessenger = isAdmin || allowedModules?.includes("mail_messenger");
  const navRef = useRef(null);
  const [modalCashSales, setModalCashSales] = useState(false);
  const [modalCreditSales, setModalCreditSales] = useState(false);
  const [modalOnlineCredit, setModalOnlineCredit] = useState(false);
  const [modalOnSales, setModalOnSales] = useState(false);
  const [modalCompletedPayments, setModalCompletedPayments] = useState(false);
  const [modalDebugOrders, setModalDebugOrders] = useState(false);
  const [modalSaleReport, setModalSaleReport] = useState(false);
  const [modalOrderReport, setModalOrderReport] = useState(false);
  const [modalRefundReturnReport, setModalRefundReturnReport] = useState(false);
  const [modalCancelledReport, setModalCancelledReport] = useState(false);
  const [modalMrkPaid, setModalMrkPaid] = useState(false);
  const [modalOneOfOrder, setModalOneOfOrder] = useState(false);
  const [modalOlp, setModalOlp] = useState(false);
  const [modalRefund, setModalRefund] = useState(false);
  const [modalReturnOrder, setModalReturnOrder] = useState(false);
  const [modalRestoreOrder, setModalRestoreOrder] = useState(false);
  const [modalCancel, setModalCancel] = useState(false);
  const [modalList, setModalList] = useState(false);
  const [modalNotCancel, setModalNotCancel] = useState(false);
  const [modalNtfRefund, setModalNtfRefund] = useState(false);
  // New state variables for dropdowns on medium screens
  // Parent dropdown states (Sales, Ordering, Report)
  const [isSalesDropdownOpen, setIsSalesDropdownOpen] = useState(false);
  const [isOrderDropdownOpen, setIsOrderDropdownOpen] = useState(false);
  const [isReportDropdownOpen, setIsReportDropdownOpen] = useState(false);

  // Sub‑dropdown states (for items inside the parent dropdowns)
  const [isOrderActionOpen, setIsOrderActionOpen] = useState(false);
  const [isOnlineSalesOpen, setIsOnlineSalesOpen] = useState(false);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] =
    useState(false);
  const [isOrderNotificationOpen, setIsOrderNotificationOpen] = useState(false);
  const [notificationCounts, setNotificationCounts] = useState({
    orderList: 0,
    cancelled: 0,
    refund: 0,
    total: 0,
  });

  // Toggle functions for parent dropdowns
  const toggleSalesDropdown = () => {
    setIsSalesDropdownOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsOrderDropdownOpen(false);
        setIsReportDropdownOpen(false);
      }
      return next;
    });
  };
  const toggleOrderDropdown = () => {
    setIsOrderDropdownOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsSalesDropdownOpen(false);
        setIsReportDropdownOpen(false);
      }
      return next;
    });
  };
  const toggleReportDropdown = () => {
    setIsReportDropdownOpen((prev) => {
      const next = !prev;
      if (next) {
        setIsSalesDropdownOpen(false);
        setIsOrderDropdownOpen(false);
      }
      return next;
    });
  };

  // Sales / Ordering / Report open on hover via CSS (":hover" on the trigger
  // shows its dropdown) independent of the click-driven "show" state used above.
  // Without this, hovering one tab while another is still open from an earlier
  // click leaves both dropdowns on screen at once. Closing the other tabs'
  // click state - and their nested sub-menus - as soon as a tab is hovered keeps
  // only one tab's menu visible at a time, matching the click behavior above.
  const closeOtherTopLevelDropdowns = (except) => {
    if (except !== "sales") {
      setIsSalesDropdownOpen(false);
      setIsWalkInOpen(false);
      setIsOnlineSalesOpen(false);
    }
    if (except !== "order") {
      setIsOrderDropdownOpen(false);
      setIsOrderActionOpen(false);
      setIsOrderNotificationOpen(false);
    }
    if (except !== "report") {
      setIsReportDropdownOpen(false);
    }
  };

  const closeAllDropdowns = () => {
    setIsSalesDropdownOpen(false);
    setIsOrderDropdownOpen(false);
    setIsReportDropdownOpen(false);
    setIsOrderActionOpen(false);
    setIsOnlineSalesOpen(false);
    setIsWalkInOpen(false);
    setIsNotificationDropdownOpen(false);
    setIsOrderNotificationOpen(false);
  };

  // Toggle functions for sub‑dropdowns on click. Order action and Order
  // notification are siblings inside the same Ordering dropdown - opening one
  // must close the other, otherwise both flyouts stay mounted with the
  // "show" class at once and render on top of each other.
  const toggleOrderAction = () => {
    setIsOrderActionOpen((prev) => !prev);
    setIsOrderNotificationOpen(false);
  };

  // Walk in and Online sales are the same kind of sibling pair inside the
  // Sales dropdown - keep them mutually exclusive for the same reason.
  const toggleOnlineSales = () => {
    setIsOnlineSalesOpen((prev) => !prev);
    setIsWalkInOpen(false);
  };

  const toggleWalkIn = () => {
    setIsWalkInOpen((prev) => !prev);
    setIsOnlineSalesOpen(false);
  };

  const toggleOrderNotification = () => {
    setIsOrderNotificationOpen((prev) => !prev);
    setIsOrderActionOpen(false);
  };

  const getItemsCount = (response) => {
    if (Array.isArray(response)) return response.length;
    if (Array.isArray(response?.data)) return response.data.length;
    if (Array.isArray(response?.response)) return response.response.length;
    if (Array.isArray(response?.data?.content)) return response.data.content.length;
    if (typeof response?.data?.totalElements === "number") return response.data.totalElements;
    return 0;
  };

  const fetchNotificationCounts = async () => {
    try {
      const [orderListRes, cancelledRes, refundRes] = await Promise.all([
        apiRequest("/sales/notifications/orderlist", "GET"),
        apiRequest("/sales/notifications/cancelled", "GET"),
        apiRequest("/sales/notifications/refund", "GET"),
      ]);

      const nextCounts = {
        orderList: getItemsCount(orderListRes),
        cancelled: getItemsCount(cancelledRes),
        refund: getItemsCount(refundRes),
      };
      nextCounts.total =
        nextCounts.orderList + nextCounts.cancelled + nextCounts.refund;

      setNotificationCounts(nextCounts);
    } catch (err) {
      console.error("OrderTab: failed to fetch notification counts", err);
      setNotificationCounts({ orderList: 0, cancelled: 0, refund: 0, total: 0 });
    }
  };

  useEffect(() => {
    fetchNotificationCounts();
    const timer = setInterval(fetchNotificationCounts, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        closeAllDropdowns();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Modal toggle functions (example for cash sales, add the rest as needed)

  const toggleCshModal = () => {
    setModalCashSales(!modalCashSales);
  };
  const toggleCdsModal = () => {
    setModalCreditSales(!modalCreditSales);
    setCreditSalePaymentNotice(null);
  };
  const toggleOcsModal = () => {
    setModalOnlineCredit(!modalOnlineCredit);
  };
  const toggleOosModal = () => {
    setModalOnSales(!modalOnSales);
  };
  const toggleCompletedPaymentsModal = () => {
    setModalCompletedPayments(!modalCompletedPayments);
  };
  const toggleDebugOrdersModal = () => {
    setModalDebugOrders(!modalDebugOrders);
  };
  const toggleReportModal = () => {
    setModalSaleReport(!modalSaleReport);
  };
  const toggleReportOrModal = () => {
    setModalOrderReport(!modalOrderReport);
  };
  const toggleRefundReturnReportModal = () => {
    setModalRefundReturnReport(!modalRefundReturnReport);
  };
  const toggleCancelledReportModal = () => {
    setModalCancelledReport(!modalCancelledReport);
  };
  const toggleMrkPaidModal = () => {
    setModalMrkPaid(!modalMrkPaid);
  };
  const toggleOneOfOrdModal = () => {
    setModalOneOfOrder(!modalOneOfOrder);
  };
  const toggleOlpModal = () => {
    setModalOlp(!modalOlp);
  };
  const toggleRefundModal = () => {
    setModalRefund(!modalRefund);
  };
  const toggleRestoreOrderModal = () => {
    setModalRestoreOrder(!modalRestoreOrder);
  };

  const toggleReturnOrderModal = () => {
    setModalReturnOrder(!modalReturnOrder);
  };
  const toggleCancelModal = () => {
    setModalCancel(!modalCancel);
  };
  const toggleOrdListModal = () => {
    setModalList(!modalList);
    setIsNotificationDropdownOpen(false);
  };
  const toggleNotCancelModal = () => {
    setModalNotCancel(!modalNotCancel);
    setIsNotificationDropdownOpen(false);
  };
  const toggleNtfRefundModal = () => {
    setModalNtfRefund(!modalNtfRefund);
    setIsNotificationDropdownOpen(false);
  };
  const toggleNotificationDropdown = () => {
    fetchNotificationCounts();
    setIsNotificationDropdownOpen((prev) => !prev);
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

      <nav ref={navRef} className='navbar navbar-expand-md inventory-nav d-none d-md-block module-desktop-nav'>
        <div className='container-fluid'>
          <Link to='/adminDashboard' className='module-brand-link'>
            <img src={logo} alt='logo' className='hub-logo module-brand-logo' />
            <div className='module-brand-copy'>
              <span className='module-brand-title'>Orders and Sales</span>
              <span className='module-brand-subtitle'>Sales, ordering, notifications, and reports</span>
            </div>
          </Link>

          <div className='collapse navbar-collapse'>
            <ul className='navbar-nav ms-auto mb-2 mb-lg-0 invent-ul-link align-items-center gap-5 module-nav-links'>
              {canAccessMessenger ? (
                <li className='nav-item'>
                  <Link to='/messenger' className='module-nav-pill module-quick-link'>
                    {t("Mail / Messenger")}
                  </Link>
                </li>
              ) : null}
              <li
                className='order_links module-nav-pill'
                id='sales-drop'
                onClick={toggleSalesDropdown}
                onMouseEnter={() => closeOtherTopLevelDropdowns("sales")}
              >
                {t("Sales")}
                <span className='text-center  mx-1 '>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 512 512'
                    className='arrow-down pb-2'
                  >
                    <path d='M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z' />
                  </svg>
                </span>
                <ul
                  className={`sales-ul-dropdown  ${
                    isSalesDropdownOpen ? "show" : ""
                  }`}
                  id='sales-ul'
                >
                  <li
                    className='sales-li-dropdown'
                    id='walk-drop'
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWalkIn();
                    }}
                  >
                    {t("Walk in")}
                    <ul className={`walk-ul-dropdown ${isWalkInOpen ? "show" : ""}`}>
                      <li className='walk-li-dropdown' onClick={toggleCshModal}>
                        {t("Cash sales")}
                      </li>

                      <li className='walk-li-dropdown' onClick={toggleCdsModal}>
                        {t("Credit sales")}
                      </li>
                    </ul>
                  </li>

                  {/* Online sales temporarily disabled
                  <li
                    className='sales-li-dropdown'
                    id='online-drop'
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOnlineSales();
                    }}
                  >
                    {t("Online sales")}
                    <ul
                      className={`online-ul-dropdown ${
                        isOnlineSalesOpen ? "show" : ""
                      }`}
                    >
                      <li
                        className='online-li-dropdown'
                        onClick={toggleOcsModal}
                      >
                        {t("Online credit sales")}
                      </li>

                      <li
                        className='online-li-dropdown'
                        onClick={toggleOosModal}
                      >
                        {t("Online-one-of sales")}
                      </li>
                    </ul>
                  </li>
                  */}

                  <li
                    className='sales-li-dropdown'
                    id='completed-payments-drop'
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompletedPaymentsModal();
                    }}
                  >
                    {t("Completed payments")}
                  </li>

                  {/* Debug: User orders temporarily disabled
                  <li
                    className='sales-li-dropdown'
                    id='debug-orders-drop'
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDebugOrdersModal();
                    }}
                  >
                    {t("Debug: User orders")}
                  </li>
                  */}
                </ul>
              </li>

              <li
                className='order_links module-nav-pill'
                id='order_drop'
                onClick={toggleOrderDropdown}
                onMouseEnter={() => closeOtherTopLevelDropdowns("order")}
              >
                {t("Ordering")}
                <span className='text-center  mx-1 '>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 512 512'
                    className='arrow-down pb-2'
                  >
                    <path d='M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z' />
                  </svg>
                </span>
                <ul
                  className={`order_ul-dropdown ${
                    isOrderDropdownOpen ? "show" : ""
                  }`}
                  id='order_ul'
                >
                  <li
                    className='order_li-dropdown'
                    id='order-action'
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOrderAction();
                    }}
                  >
                    {t("Order action")}
                    <ul
                      className={`order-ul-dropdown ${
                        isOrderActionOpen ? "show" : ""
                      }`}
                      id='order-action-ul'
                    >
                      <li
                        className='order-li-dropdown'
                        onClick={toggleMrkPaidModal}
                      >
                        {t("Marking as paid")}
                      </li>
                      <li
                        className='order-li-dropdown'
                        onClick={toggleOneOfOrdModal}
                      >
                        {t("One of order")}
                      </li>
                      <li
                        className='order-li-dropdown'
                        onClick={toggleOlpModal}
                      >
                        {t("Order list as paid")}
                      </li>
                      <li
                        className='order-li-dropdown'
                        onClick={toggleRefundModal}
                      >
                        {t("Refund order")}
                      </li>
                      <li
                        className='order-li-dropdown'
                        onClick={toggleReturnOrderModal}
                      >
                        {t("Return Item")}
                      </li>
                      <li
                        className='order-li-dropdown'
                        onClick={toggleRestoreOrderModal}
                      >
                        {t("Restore Item")}
                      </li>
                      <li
                        className='order-li-dropdown'
                        onClick={toggleCancelModal}
                      >
                        {t("Cancelled order")}
                      </li>
                    </ul>
                  </li>
                  <li
                    className='order_li-dropdown'
                    id='order-not'
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOrderNotification();
                    }}
                  >
                    <span className='order-not-label'>
                      {t("Order notification")}
                      <span className='order-not-badge-total'>
                        {notificationCounts.total}
                      </span>
                    </span>
                    <ul className={`order-ul-dropdown ${isOrderNotificationOpen ? "show" : ""}`} id='order-not-ul'>
                      <li
                        className='order-li-dropdown'
                        onClick={toggleOrdListModal}
                      >
                        <span>{t("Order list")}</span>
                        <span className='order-li-count'>
                          {notificationCounts.orderList}
                        </span>
                      </li>
                      <li
                        className='order-li-dropdown'
                        onClick={toggleNotCancelModal}
                      >
                        <span>{t("Cancelled")}</span>
                        <span className='order-li-count'>
                          {notificationCounts.cancelled}
                        </span>
                      </li>
                      <li
                        className='order-li-dropdown'
                        onClick={toggleNtfRefundModal}
                      >
                        <span>{t("Refund")}</span>
                        <span className='order-li-count'>
                          {notificationCounts.refund}
                        </span>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>

              <li
                className='order_links module-nav-pill'
                id='report_drop'
                onClick={toggleReportDropdown}
                onMouseEnter={() => closeOtherTopLevelDropdowns("report")}
              >
                {t("Report")}
                <span className='text-center  mx-1 '>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 512 512'
                    className='arrow-down pb-2'
                  >
                    <path d='M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z' />
                  </svg>
                </span>
                <ul
                  className={`report_ul-dropdown ${
                    isReportDropdownOpen ? "show" : ""
                  }`}
                >
                  <li
                    className='report_li-dropdown'
                    onClick={toggleReportModal}
                  >
                    {t("Sales report")}
                  </li>
                  <li
                    className='report_li-dropdown'
                    id='order-report'
                    onClick={toggleReportOrModal}
                  >
                    {t("Order report")}
                  </li>
                  <li
                    className='report_li-dropdown'
                    onClick={toggleRefundReturnReportModal}
                  >
                    {t("Refund & Return report")}
                  </li>
                  <li
                    className='report_li-dropdown'
                    onClick={toggleCancelledReportModal}
                  >
                    {t("Cancelled report")}
                  </li>
                </ul>
              </li>
              <li className='order-notification-wrapper'>
                <button
                  type='button'
                  className='order-bell-btn'
                  onClick={toggleNotificationDropdown}
                  aria-label='Order notifications'
                >
                  <i className='bi bi-bell-fill text-white '></i>
                  <span className='order-bell-badge'>{notificationCounts.total}</span>
                </button>
                <div
                  className={`order-notification-dropdown ${
                    isNotificationDropdownOpen ? "show" : ""
                  }`}
                >
                  <button
                    type='button'
                    className='order-notification-item'
                    onClick={toggleOrdListModal}
                  >
                    <span>{t("Order list")}</span>
                    <span className='order-notification-item-count'>
                      {notificationCounts.orderList}
                    </span>
                  </button>
                  <button
                    type='button'
                    className='order-notification-item'
                    onClick={toggleNotCancelModal}
                  >
                    <span>{t("Cancelled")}</span>
                    <span className='order-notification-item-count'>
                      {notificationCounts.cancelled}
                    </span>
                  </button>
                  <button
                    type='button'
                    className='order-notification-item'
                    onClick={toggleNtfRefundModal}
                  >
                    <span>{t("Refund")}</span>
                    <span className='order-notification-item-count'>
                      {notificationCounts.refund}
                    </span>
                  </button>
                </div>
              </li>
              <li className='nav-item'>
                <Link to='/'>
                  <button className='Log_Out-btn order-log-out module-logout-btn'>{t("Log out")}</button>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

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
              <div className='me-5'>{t("Sales")}</div>
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
                      <span className='me-5'>{t("Walk in").toUpperCase()}</span>
                    </button>
                    <ul className='dropdown-menu dropdown-menu-inventory'>
                      <h5 onClick={() => handleClick(toggleCshModal)}>
                        {t("Cash sales").toUpperCase()}
                      </h5>
                      <h5 onClick={() => handleClick(toggleCdsModal)}>
                        {t("Credit sales").toUpperCase()}
                      </h5>
                    </ul>
                  </div>{" "}
                  <br />
                  {/* Online sales temporarily disabled
                  <div className='btn-group dropend'>
                    <button
                      type='button'
                      className='btn btn-white dropdown-toggle'
                      data-bs-toggle='dropdown'
                      aria-expanded='false'
                    >
                      <span className='me-5'>{t("Online sales").toUpperCase()}</span>
                    </button>
                    <ul className='dropdown-menu dropdown-menu-inventory'>
                      <h5 onClick={() => handleClick(toggleOcsModal)}>
                        {t("Online credit sales").toUpperCase()}
                      </h5>
                      <h5 onClick={() => handleClick(toggleOosModal)}>
                        {t("Online-one-of sales").toUpperCase()}
                      </h5>
                    </ul>
                  </div>{" "}
                  <br />
                  */}
                  <h5
                    className='accordion-body-H5 text-uppercase'
                    onClick={() => handleClick(toggleCompletedPaymentsModal)}
                  >
                    {t("Completed payments")}
                  </h5>
                  {/* Debug: User orders temporarily disabled
                  <h5
                    className='accordion-body-H5 text-uppercase'
                    onClick={() => handleClick(toggleDebugOrdersModal)}
                  >
                    {t("Debug: User orders")}
                  </h5>
                  */}
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
                  <span className='me-5'>{t("Ordering")}</span>
                </button>
              </h2>
              <div
                id='flush-collapseTwo'
                className='accordion-collapse collapse'
                data-bs-parent='#accordionFlushExample'
              >
                <div className='accordion-body bg-white '>
                  <div className='btn-group dropend'>
                    <button
                      type='button'
                      className='btn btn-white dropdown-toggle'
                      data-bs-toggle='dropdown'
                      aria-expanded='false'
                    >
                      <span className='me-5'>{t("Online action").toUpperCase()}</span>
                    </button>
                    <ul className='dropdown-menu dropdown-menu-inventory'>
                      <h5 onClick={() => handleClick(toggleMrkPaidModal)}>
                        {t("Making as paid").toUpperCase()}
                      </h5>
                      <h5 onClick={() => handleClick(toggleOneOfOrdModal)}>
                        {t("One of order").toUpperCase()}
                      </h5>
                      <h5 onClick={() => handleClick(toggleOlpModal)}>
                        {t("Order list as paid").toUpperCase()}
                      </h5>
                      <h5 onClick={() => handleClick(toggleRefundModal)}>
                        {t("Refund order").toUpperCase()}
                      </h5>
                      <h5 onClick={() => handleClick(toggleReturnOrderModal)}>
                        {t("Return Item").toUpperCase()}
                      </h5>
                      <h5 onClick={() => handleClick(toggleRestoreOrderModal)}>
                        {t("Restore Item").toUpperCase()}
                      </h5>
                      <h5 onClick={() => handleClick(toggleCancelModal)}>
                        {t("Cancelled order").toUpperCase()}
                      </h5>
                    </ul>
                  </div>
                  <br />
                  <div className='btn-group dropend'>
                    <button
                      type='button'
                      className='btn btn-white dropdown-toggle'
                      data-bs-toggle='dropdown'
                      aria-expanded='false'
                    >
                      <span className='me-5'>
                        {t("Order notification").toUpperCase()}
                        <span className='order-not-badge-total ms-2'>
                          {notificationCounts.total}
                        </span>
                      </span>
                    </button>
                    <ul className='dropdown-menu dropdown-menu-inventory'>
                      <h5
                        className='order-not-mobile-item'
                        onClick={() => handleClick(toggleOrdListModal)}
                      >
                        <span>{t("Order list").toUpperCase()}</span>
                        <span className='order-li-count'>
                          {notificationCounts.orderList}
                        </span>
                      </h5>
                      <h5
                        className='order-not-mobile-item'
                        onClick={() => handleClick(toggleNotCancelModal)}
                      >
                        <span>{t("Cancelled").toUpperCase()}</span>
                        <span className='order-li-count'>
                          {notificationCounts.cancelled}
                        </span>
                      </h5>
                      <h5
                        className='order-not-mobile-item'
                        onClick={() => handleClick(toggleNtfRefundModal)}
                      >
                        <span>{t("Refund").toUpperCase()}</span>
                        <span className='order-li-count'>
                          {notificationCounts.refund}
                        </span>
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
                  <h5
                    className='accordion-body-H5 text-uppercase'
                    onClick={() => handleClick(toggleReportModal)}
                  >
                    {t("Sales report")}
                  </h5>
                  <h5
                    className='accordion-body-H5 text-uppercase'
                    onClick={() => handleClick(toggleReportOrModal)}
                  >
                    {t("Order report")}
                  </h5>
                  <h5
                    className='accordion-body-H5 text-uppercase'
                    onClick={() => handleClick(toggleRefundReturnReportModal)}
                  >
                    {t("Refund & Return report")}
                  </h5>
                  <h5
                    className='accordion-body-H5 text-uppercase'
                    onClick={() => handleClick(toggleCancelledReportModal)}
                  >
                    {t("Cancelled report")}
                  </h5>
                </div>
              </div>
            </div>

            <div className='bi-bell-fill-box order-mobile-notification-wrap'>
              <button
                type='button'
                className='order-bell-btn order-bell-btn-mobile'
                onClick={toggleNotificationDropdown}
                aria-label='Order notifications'
              >
                <i className='bi bi-bell-fill text-white '></i>
                <span className='order-bell-badge'>{notificationCounts.total}</span>
              </button>
              <div
                className={`order-notification-dropdown order-notification-dropdown-mobile ${
                  isNotificationDropdownOpen ? "show" : ""
                }`}
              >
                <button
                  type='button'
                  className='order-notification-item'
                  onClick={() => handleClick(toggleOrdListModal)}
                >
                  <span>{t("Order list")}</span>
                  <span className='order-notification-item-count'>
                    {notificationCounts.orderList}
                  </span>
                </button>
                <button
                  type='button'
                  className='order-notification-item'
                  onClick={() => handleClick(toggleNotCancelModal)}
                >
                  <span>{t("Cancelled")}</span>
                  <span className='order-notification-item-count'>
                    {notificationCounts.cancelled}
                  </span>
                </button>
                <button
                  type='button'
                  className='order-notification-item'
                  onClick={() => handleClick(toggleNtfRefundModal)}
                >
                  <span>{t("Refund")}</span>
                  <span className='order-notification-item-count'>
                    {notificationCounts.refund}
                  </span>
                </button>
              </div>
            </div>
          </div>
          {/* <!-- Default dropend button --> */}
          <Link to='/'>
            <button className='btn btn-primary fs-3 px-4 fw-semibold mt-5'>
              {t("Log out")}
            </button>
          </Link>
        </div>
      </div>

      <div className='module-content-shell module-surface'>
        <div className='module-heading-band'>
          <div className='module-heading-copy'>
            <h1>{t("Orders and Sales")}</h1>
            <p>{t("Handle sales channels, online ordering workflows, notifications, and operational reports.")}</p>
          </div>
          <div className='module-heading-actions'>
            <ModuleUserChip user={user} />
            <div className='module-heading-badge'>{t("Orders")}</div>
          </div>
        </div>
        <OrderSection onRequestReturn={toggleReturnOrderModal} onRequestRestore={toggleRestoreOrderModal} />
      </div>
      {/* MODAL CONTENT DISPLAY FOR SALES */}
      <CshModal isOpen={modalCashSales} toggleCshModal={toggleCshModal} />
      <CdsModal isOpen={modalCreditSales} toggleCdsModal={toggleCdsModal} />
      <OcsModal isOpen={modalOnlineCredit} toggleOcsModal={toggleOcsModal} />
      <OnOnesModal isOpen={modalOnSales} toggleOosModal={toggleOosModal} />
      <CompletedPaymentsModal
        isOpen={modalCompletedPayments}
        toggleCompletedPaymentsModal={toggleCompletedPaymentsModal}
      />
      <DebugOrdersModal
        isOpen={modalDebugOrders}
        toggleDebugOrdersModal={toggleDebugOrdersModal}
      />

      {/* ACTION MODALS */}
      <MrkPaidModal
        isOpen={modalMrkPaid}
        toggleMrkPaidModal={toggleMrkPaidModal}
      />
      <OneOfOrdModal
        isOpen={modalOneOfOrder}
        toggleOneOfOrdModal={toggleOneOfOrdModal}
      />
      <OrdListPaidModal isOpen={modalOlp} toggleOlpModal={toggleOlpModal} />
      <RefundModal isOpen={modalRefund} toggleRefundModal={toggleRefundModal} />
      <ReturnOrderModal
        isOpen={modalReturnOrder}
        toggleReturnOrderModal={toggleReturnOrderModal}
      />
      <RestoreOrderModal
        isOpen={modalRestoreOrder}
        toggleRestoreOrderModal={toggleRestoreOrderModal}
      />
      <CancelModal isOpen={modalCancel} toggleCancelModal={toggleCancelModal} />

      {/* NOTIFICATION MODALS */}
      <OrdListModal
        isOpen={modalList}
        toggleOrdListModal={toggleOrdListModal}
      />
      <CancelledModal
        isOpen={modalNotCancel}
        toggleNotCancelModal={toggleNotCancelModal}
      />
      <RefundNtfModal
        isOpen={modalNtfRefund}
        toggleNtfRefundModal={toggleNtfRefundModal}
      />
      {/* MODAL CONTENT DISPLAY FOR REPORT */}
      <ReportsModal
        isOpen={modalSaleReport}
        toggleReportModal={toggleReportModal}
      />
      <ReportOrderModal
        isOpen={modalOrderReport}
        toggleReportOrModal={toggleReportOrModal}
      />
      <RefundReturnReportModal
        isOpen={modalRefundReturnReport}
        toggleRefundReturnReportModal={toggleRefundReturnReportModal}
      />
      <CancelledReportModal
        isOpen={modalCancelledReport}
        toggleCancelledReportModal={toggleCancelledReportModal}
      />
    </div>
  );
};

export default OrderTab;

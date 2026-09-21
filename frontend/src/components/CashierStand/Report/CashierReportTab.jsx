import React from "react";
import logo from "../../../assets/images/adminLogo.png";
import "../../../Styles/CashierStand/Report/CashierReport.css";
import { Link } from "react-router-dom";
import CashierReportSeg from "./CashierReportSeg";
import { TfiMenu } from "react-icons/tfi";
import CashierBackButton from "../CashierBackButton";

const CashierReportTab = () => {
  return (
    <>
      <div className='d-md-none d-flex justify-content-between align-items-center p-2 bg-white'>
        <CashierBackButton to='/cashier' />
        <Link to='/adminDashboard'>
          <img src={logo} alt='logo' className='hub-logo' />
        </Link>

        <button
          className='btn btn-primary d-md-none'
          id='menu-bar-sm'
          type='button'
          data-bs-toggle='offcanvas'
          data-bs-target='#offcanvasResponsive'
          aria-controls='offcanvasResponsive'
        >
          <TfiMenu size='24px' />
        </button>
      </div>
      <nav className='navbar navbar-expand inventory-nav d-none d-md-block'>
        <div className='container-fluid'>
          <Link to='/'>
            <img src={logo} alt='logo' className='hub-logo' />
          </Link>

          <div className='collapse navbar-collapse' id='navbarSupportedContent'>
            <CashierBackButton to='/cashier' />
            <h1 className='d-flex justify-content-center h1-cash-header text-light'>
              CASHIER REPORT
            </h1>
            <ul className='navbar-nav ms-auto mb-2 mb-lg-0 invent-ul-link align-items-center'>
              <li className='nav-item'>
                <Link to='/'>
                  <button className='Log_Out-btn cashier-log-out'>Log Out</button>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <CashierReportSeg />
    </>
  );
};

export default CashierReportTab;


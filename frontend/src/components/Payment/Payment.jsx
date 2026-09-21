import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoArrowBack } from "react-icons/io5";
import { IoChevronDown } from "react-icons/io5";
import logo from "../../assets/images/adminLogo.png";
import "../../Styles/ModuleStandard.css";
import { useAuth } from "../../context/AuthContext";
import ModuleUserChip from "../shared/ModuleUserChip";

const Payment = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleBalanceOption = (option) => {
    setShowDropdown(false);
    if (option === 'customer') {
      navigate('/payment/balances');
    } else if (option === 'main') {
      navigate('/payment/main-balance');
    }
  };

  return (
    <div style={{ height: '100vh', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{ 
        backgroundColor: '#0867db', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '1rem 2.5rem' 
      }}>
        <Link to="/adminDashboard">
          <img src={logo} alt="pm logo" style={{ height: '40px' }} />
        </Link>
        
        <div style={{ display: 'flex', color: 'white', gap: '2rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
          {/* Balance with Dropdown */}
          <div style={{ position: 'relative' }}>
            <div 
              onClick={() => setShowDropdown(!showDropdown)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                cursor: 'pointer',
                color: 'white'
              }}
            >
              <span>Balances</span>
              <IoChevronDown size={16} />
            </div>
            
            {/* Dropdown Menu */}
            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                minWidth: '180px',
                marginTop: '0.5rem',
                zIndex: 1000,
                overflow: 'hidden'
              }}>
                <div 
                  onClick={() => handleBalanceOption('customer')}
                  style={{
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    color: '#333',
                    borderBottom: '1px solid #e0e0e0',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                >
                  Customer Balance
                </div>
                <div 
                  onClick={() => handleBalanceOption('main')}
                  style={{
                    padding: '0.75rem 1rem',
                    cursor: 'pointer',
                    color: '#333',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                >
                  Main Balance
                </div>
              </div>
            )}
          </div>
          
          <Link to="/payment/disputes" style={{ color: 'white', textDecoration: 'none' }}>Disputes</Link>
          <Link to="/payment/notifications" style={{ color: 'white', textDecoration: 'none' }}>Notification</Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ModuleUserChip user={user} />
          <Link to="/adminDashboard" style={{ color: 'white' }}>
            <IoArrowBack size={30} />
          </Link>
          <Link to="/">
            <button style={{
              backgroundColor: 'transparent',
              color: 'white',
              border: '2px solid white',
              padding: '0.375rem 0.75rem',
              borderRadius: '0.25rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}>
              Log Out
            </button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 50%', maxWidth: '50%' }}>
              {/* Payment Illustration */}
              <div style={{ padding: '3rem' }}>
                <div style={{
                  backgroundColor: '#e6f2ff',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  display: 'inline-block',
                  position: 'relative',
                  maxWidth: '400px'
                }}>
                  <div style={{
                    backgroundColor: 'white',
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <small style={{ fontWeight: 'bold' }}>PAYMENTS</small>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <input 
                        type="text" 
                        value="myemail@email.com" 
                        readOnly 
                        style={{
                          width: '100%',
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.875rem',
                          border: '1px solid #ced4da',
                          borderRadius: '0.25rem',
                          marginBottom: '0.5rem'
                        }}
                      />
                      <input 
                        type="password" 
                        value="********" 
                        readOnly 
                        style={{
                          width: '100%',
                          padding: '0.375rem 0.75rem',
                          fontSize: '0.875rem',
                          border: '1px solid #ced4da',
                          borderRadius: '0.25rem'
                        }}
                      />
                    </div>
                    <button style={{
                      backgroundColor: '#0867db',
                      color: 'white',
                      border: 'none',
                      padding: '0.375rem 0.75rem',
                      fontSize: '0.875rem',
                      width: '100%',
                      borderRadius: '50px',
                      cursor: 'pointer'
                    }}>
                      Pay $120
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ flex: '0 0 50%', maxWidth: '50%', textAlign: 'center' }}>
              <h1 style={{ 
                color: '#0867db', 
                fontWeight: 'bold', 
                fontSize: '6rem',
                margin: 0
              }}>
                PAYMENT
              </h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;

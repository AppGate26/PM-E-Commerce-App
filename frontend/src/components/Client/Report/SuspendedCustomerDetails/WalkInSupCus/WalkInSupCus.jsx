import React, { useState, useEffect } from "react";
import "./WalkInSupCus.css";
import { FaTimes, FaChevronLeft, FaChevronRight, FaFileExcel, FaCheck } from "react-icons/fa";
import { IoGridOutline } from "react-icons/io5";
import { apiRequest } from "../../../../../lib/config"; // Adjust path as needed

const WalkInSupCus = ({ closeModal }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20); // Changed to match API default
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [apiError, setApiError] = useState("");

  // Date filter states (optional)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDateFilters, setShowDateFilters] = useState(false);

  // Fetch suspended walk-in customers from API
  const fetchSuspendedWalkInCustomers = async (page = 0) => {
    try {
      setLoading(true);
      setApiError("");
      
      console.log("═══════════════════════════════════════════════════════════");
      console.log("🚫 SUSPENDED WALK-IN CUSTOMER REPORT: FETCHING DATA");
      console.log("═══════════════════════════════════════════════════════════");
      console.log("API Endpoint: /admin/customers/walk-in/suspended/report");
      console.log("Page:", page);
      console.log("Page Size:", pageSize);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page,
        size: pageSize,
      });
      
      // Add optional date filters if provided
      if (startDate) {
        params.append("startDate", startDate);
        console.log("📅 Start Date filter:", startDate);
      }
      if (endDate) {
        params.append("endDate", endDate);
        console.log("📅 End Date filter:", endDate);
      }
      
      const endpoint = `/admin/customers/walk-in/suspended/report?${params.toString()}`;
      console.log("📡 Full API Request:", endpoint);
      
      const response = await apiRequest(endpoint, "GET");
      console.log("📦 API Response received:", response);
      
      let customersList = [];
      let totalCount = 0;
      
      // Debug: Log the full response structure
      console.log("🔍 Response structure analysis:");
      console.log("- Type of response:", typeof response);
      console.log("- Is array?", Array.isArray(response));
      console.log("- Response keys:", Object.keys(response || {}));
      
      // Handle your API response format (same as other reports)
      if (response && response.response && response.response.content && Array.isArray(response.response.content)) {
        console.log("✅ Found customers in response.response.content");
        customersList = response.response.content;
        totalCount = response.response.totalElements || customersList.length;
        console.log("📊 Pagination info - totalElements:", response.response.totalElements);
        console.log("📊 Pagination info - totalPages:", response.response.totalPages);
        console.log("📊 Pagination info - number of customers:", customersList.length);
      } 
      // Alternative structure: direct content property
      else if (response && response.content && Array.isArray(response.content)) {
        console.log("✅ Found customers in response.content");
        customersList = response.content;
        totalCount = response.totalElements || customersList.length;
      }
      // Alternative structure: direct array response
      else if (Array.isArray(response)) {
        console.log("✅ Direct array response");
        customersList = response;
        totalCount = response.length;
      }
      // Alternative structure: data property
      else if (response && response.data && Array.isArray(response.data)) {
        console.log("✅ Found customers in response.data");
        customersList = response.data;
        totalCount = response.total || customersList.length;
      }
      // Check if response is empty or has no customers
      else if (response && typeof response === 'object') {
        console.log("🔍 Checking for empty response...");
        
        // Check if response indicates empty data
        if (response.message && response.message.toLowerCase().includes("no customer") || 
            response.status === "SUCCESS" && (!response.response || !response.response.content)) {
          console.log("✅ Empty response - no suspended walk-in customers found");
          customersList = [];
          totalCount = 0;
        } else {
          console.log("⚠️ Unknown response format but appears to be an object");
          console.log("Response details:", JSON.stringify(response, null, 2));
          customersList = [];
          totalCount = 0;
        }
      }
      else {
        console.log("⚠️ Unknown or empty response");
        customersList = [];
        totalCount = 0;
      }
      
      console.log("✅ Total suspended walk-in customers loaded:", customersList.length);
      console.log("✅ Total count from API:", totalCount);
      
      if (customersList.length > 0) {
        console.log("📋 Sample suspended walk-in customer data (first item):");
        const sample = customersList[0];
        console.log("- ID:", sample.id);
        console.log("- First Name:", sample.firstName);
        console.log("- Surname:", sample.surname);
        console.log("- Email:", sample.email);
        console.log("- Account Number:", sample.accountNumber);
        console.log("- Gender:", sample.gender);
        console.log("- Suspended:", sample.suspended);
        console.log("- Reason for Suspension:", sample.reasonForSuspension);
        console.log("- Customer Type:", sample.customerType);
        console.log("- Full object keys:", Object.keys(sample));
      } else {
        console.log("📭 No suspended walk-in customers found in the response");
      }
      
      // Format the data for consistent display
      const formattedCustomers = customersList.map((customer, index) => ({
        id: customer.id || customer.customerId || `temp-${index}`,
        sn: index + 1,
        firstName: customer.firstName || customer.firstname || '',
        surname: customer.surname || customer.lastName || customer.lastname || '',
        email: customer.email || customer.emailAddress || '',
        gender: customer.gender || '',
        accountNumber: customer.accountNumber || customer.accountNo || customer.account || '',
        reason: customer.reasonForSuspension || customer.suspensionReason || customer.reason || 'Suspended',
        suspended: customer.suspended || true,
        customerType: customer.customerType || 'WALK_IN',
        dateCreated: customer.createdAt || customer.createdDate || '',
        dateSuspended: customer.updatedAt || customer.suspendedDate || customer.dateCreated || '',
        phoneNumber: customer.phoneNumber || '',
        dob: customer.dob || ''
      }));
      
      setCustomers(formattedCustomers);
      setTotalItems(totalCount);
      setTotalPages(Math.ceil(totalCount / pageSize) || 1);
      setCurrentPage(page);
      setLoading(false);
      
      console.log("✅ Final state updated:");
      console.log("   - Customers count:", formattedCustomers.length);
      console.log("   - Total items:", totalCount);
      console.log("   - Total pages:", Math.ceil(totalCount / pageSize) || 1);
      console.log("   - Current page:", page);
      
    } catch (error) {
      console.error("═══════════════════════════════════════════════════════════");
      console.error("❌ ERROR FETCHING SUSPENDED WALK-IN CUSTOMER REPORT");
      console.error("═══════════════════════════════════════════════════════════");
      console.error("Error:", error);
      console.error("Message:", error?.message);
      console.error("Stack:", error?.stack);
      
      // User-friendly error messages
      if (error.message && error.message.includes("Network Error")) {
        setApiError("Network error. Please check your internet connection.");
      } else if (error.message && error.message.includes("401")) {
        setApiError("Authentication failed. Please log in again.");
      } else if (error.message && error.message.includes("403")) {
        setApiError("You don't have permission to access suspended customer data.");
      } else if (error.message && error.message.includes("404")) {
        setApiError("Suspended walk-in customer report endpoint not found.");
      } else if (error.message && error.message.includes("500")) {
        setApiError("Server error. Please try again later.");
      } else {
        setApiError("Failed to load suspended walk-in customers report. Please try again.");
      }
      
      setCustomers([]);
      setTotalItems(0);
      setTotalPages(1);
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSuspendedWalkInCustomers(0);
  }, []);

  // Handle date filter changes
  const handleDateFilterApply = () => {
    console.log("📅 Applying date filters:");
    console.log("- Start Date:", startDate);
    console.log("- End Date:", endDate);
    fetchSuspendedWalkInCustomers(0);
  };

  // Handle clear date filters
  const handleClearDateFilters = () => {
    setStartDate("");
    setEndDate("");
    console.log("🧹 Date filters cleared");
    fetchSuspendedWalkInCustomers(0);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
      fetchSuspendedWalkInCustomers(newPage);
    }
  };

  // Handle export to Excel
  const handleExportExcel = async () => {
    try {
      console.log("═══════════════════════════════════════════════════════════");
      console.log("📊 EXPORT TO EXCEL: INITIATING");
      console.log("═══════════════════════════════════════════════════════════");
      
      // Build export URL with current filters
      const params = new URLSearchParams({
        page: currentPage,
        size: pageSize,
      });
      
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      
      // Note: You would need to implement the Excel export endpoint
      // This is a placeholder - adjust to your actual export endpoint
      const exportUrl = `/admin/customers/walk-in/suspended/export?${params.toString()}`;
      console.log("📤 Export URL:", exportUrl);
      
      // For now, simulate export
      if (customers.length === 0) {
        alert("No suspended walk-in customers to export.");
        return;
      }
      
      alert(`Excel export would download ${customers.length} suspended walk-in customers.\n\nExport URL: ${exportUrl}`);
      
      // In production, you would do:
      // const response = await apiRequest(exportUrl, "GET");
      // if (response && response.url) {
      //   window.open(response.url, '_blank');
      // }
      
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      alert("Failed to export to Excel. Please try again.");
    }
  };

  // Calculate display page (0-based to 1-based)
  const displayPage = currentPage + 1;

  // Calculate displayed customers based on pagination
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, customers.length);
  const displayedCustomers = customers.slice(startIndex, endIndex);

  // Function to format date for display
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      // Format as DD/MM/YYYY
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  return (
    <div className="walkin-suspended-report-standard">
      <div className="heading">
        <div></div>
        <div style={{ textAlign: 'center' }}>
          <h1 className="heading1">PM MARKET HUB</h1>
          <p className="p1">64-00U1 ROAD.BNJOU-STATE</p>
          <p className="p1">TEL: 0800XXXX</p>
        </div>
        <div className="icon-div">
          <IoGridOutline className="icon1" style={{ fontSize: '2.2rem' }} />
          <FaTimes className="icon2" onClick={closeModal} />
        </div>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '25px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        {/* Date filters toggle and buttons */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowDateFilters(!showDateFilters)}
            style={{
              backgroundColor: 'transparent',
              color: '#0867db',
              border: '1px solid #0867db',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '1.2rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#0867db';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#0867db';
            }}
          >
            {showDateFilters ? 'Hide Date Filters' : 'Show Date Filters'}
          </button>
          
          {showDateFilters && (
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              alignItems: 'center', 
              flexWrap: 'wrap',
              backgroundColor: '#f8f9fa',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #dee2e6'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <label style={{ fontSize: '1.2rem', color: '#495057', fontWeight: '500' }}>
                  From:
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    fontSize: '1.2rem',
                    minWidth: '150px'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <label style={{ fontSize: '1.2rem', color: '#495057', fontWeight: '500' }}>
                  To:
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    padding: '8px',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    fontSize: '1.2rem',
                    minWidth: '150px'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '5px' }}>
                <button
                  onClick={handleDateFilterApply}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '1.2rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
                >
                  Apply
                </button>
                <button
                  onClick={handleClearDateFilters}
                  style={{
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '1.2rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Export to Excel button */}
        <div>
          <button
            onClick={handleExportExcel}
            disabled={loading || customers.length === 0}
            style={{
              backgroundColor: customers.length === 0 ? '#e9ecef' : 'transparent',
              color: customers.length === 0 ? '#999' : '#28a745',
              border: `2px solid ${customers.length === 0 ? '#ced4da' : '#28a745'}`,
              padding: '10px 20px',
              borderRadius: '6px',
              fontSize: '1.3rem',
              fontWeight: '600',
              cursor: customers.length === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              height: '44px',
              whiteSpace: 'nowrap'
            }}
            onMouseEnter={(e) => {
              if (customers.length > 0) {
                e.target.style.backgroundColor = '#28a745';
                e.target.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (customers.length > 0) {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#28a745';
              }
            }}
          >
            <FaFileExcel size={18} />
            Export to Excel
            {customers.length > 0 && ` (${customers.length})`}
          </button>
        </div>
      </div>

      {/* Error message */}
      {apiError && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          marginBottom: '15px',
          borderRadius: '4px',
          border: '1px solid #f5c6cb',
          textAlign: 'center',
          fontSize: '1.3rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <span>{apiError}</span>
          <button
            onClick={() => {
              setApiError("");
              fetchSuspendedWalkInCustomers(0);
            }}
            style={{
              backgroundColor: 'transparent',
              color: '#721c24',
              border: '1px solid #721c24',
              padding: '4px 12px',
              borderRadius: '4px',
              fontSize: '1.1rem',
              cursor: 'pointer',
              marginLeft: '10px'
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* table */}
      <div className="table-div">
        <div>
          <p className="heading2">SUSPENDED WALK-IN CUSTOMER REPORT</p>
        </div>

        {/* table header */}
        <div style={{ width: '100%' }}>
          <div className="tr1">
            <div style={{ width: '10%', textAlign: 'center' }}>S/N</div>
            <div style={{ width: '15%', textAlign: 'center' }}>DATE</div>
            <div style={{ width: '25%', textAlign: 'center' }}>FULL-NAME</div>
            <div style={{ width: '10%', textAlign: 'center' }}>GENDER</div>
            <div style={{ width: '20%', textAlign: 'center' }}>ACCOUNT NUMBER</div>
            <div style={{ width: '20%', textAlign: 'center' }}>REASON</div>
          </div>

          {/* table body */}
          {loading ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#666',
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #dee2e6',
              fontSize: '1.4rem'
            }}>
              Loading suspended walk-in customers report...
            </div>
          ) : customers.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#666',
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #dee2e6',
              fontSize: '1.4rem'
            }}>
              No suspended walk-in customers found in the system
            </div>
          ) : (
            <>
              {displayedCustomers.map((customer, index) => {
                const fullName = `${customer.firstName || ''} ${customer.surname || ''}`.trim();
                const displayIndex = startIndex + index + 1;
                // Use dateSuspended if available, otherwise use dateCreated
                const displayDate = formatDateForDisplay(customer.dateSuspended || customer.dateCreated);

                return (
                  <div
                    key={customer.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      width: '100%',
                      padding: '12px 10px',
                      borderBottom: '1px solid #dee2e6',
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa',
                      fontSize: '1.3rem',
                      minHeight: '55px'
                    }}
                  >
                    {/* S/N */}
                    <div style={{
                      width: '10%',
                      textAlign: 'center',
                      fontWeight: '500',
                      color: '#0867db'
                    }}>
                      {displayIndex}
                    </div>

                    {/* DATE - Use suspended date or creation date */}
                    <div style={{
                      width: '15%',
                      fontWeight: '500',
                      color: '#0867db',
                      textAlign: 'center'
                    }}>
                      {displayDate}
                    </div>

                    {/* FULL-NAME */}
                    <div style={{
                      width: '25%',
                      fontWeight: '500',
                      color: '#0867db',
                      textAlign: 'center'
                    }}>
                      {fullName || 'N/A'}
                    </div>

                    {/* GENDER */}
                    <div style={{
                      width: '10%',
                      textAlign: 'center',
                      fontWeight: '500',
                      color: '#0867db'
                    }}>
                      {customer.gender ? 
                        (customer.gender === "MALE" ? "M" : 
                         customer.gender === "FEMALE" ? "F" : 
                         customer.gender.charAt(0).toUpperCase()) : 
                        'N/A'}
                    </div>

                    {/* ACCOUNT NUMBER */}
                    <div style={{
                      width: '20%',
                      fontFamily: 'monospace',
                      fontWeight: '500',
                      textAlign: 'center',
                      color: '#0867db',
                      letterSpacing: '0.5px',
                      fontSize: '1.25rem'
                    }}>
                      {customer.accountNumber || 'N/A'}
                    </div>

                    {/* REASON */}
                    <div style={{
                      width: '20%',
                      textAlign: 'center'
                    }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          borderRadius: '12px',
                          fontSize: '1.2rem',
                          fontWeight: '500',
                          backgroundColor: '#f8d7da',
                          color: '#721c24',
                          maxWidth: '200px',
                          textAlign: 'center',
                          wordBreak: 'break-word'
                        }}
                      >
                        {customer.reason || 'Suspended'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* Pagination Controls */}
          {!loading && customers.length > 0 && totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '15px 20px',
              backgroundColor: '#f8f9fa',
              borderTop: '2px solid #dee2e6',
              marginTop: '5px',
              flexWrap: 'wrap',
              gap: '15px'
            }}>
              <div style={{ fontSize: '1.3rem', color: '#0867db' }}>
                Showing {startIndex + 1} to {Math.min((currentPage + 1) * pageSize, totalItems)} of {totalItems} customers
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 0}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: currentPage === 0 ? '#e9ecef' : '#0867db',
                    color: currentPage === 0 ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '1.3rem',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <FaChevronLeft size={12} />
                  Previous
                </button>

                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i;
                    } else if (currentPage <= 2) {
                      pageNum = i;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 5 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    if (pageNum < 0 || pageNum >= totalPages) return null;

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: currentPage === pageNum ? '#0867db' : '#e9ecef',
                          color: currentPage === pageNum ? 'white' : '#495057',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          minWidth: '40px',
                          fontWeight: currentPage === pageNum ? 'bold' : 'normal',
                          fontSize: '1.3rem',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        {pageNum + 1}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages - 1}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: currentPage === totalPages - 1 ? '#e9ecef' : '#0867db',
                    color: currentPage === totalPages - 1 ? '#999' : 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: currentPage === totalPages - 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '1.3rem',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                >
                  Next
                  <FaChevronRight size={12} />
                </button>
              </div>

              <div style={{ fontSize: '1.2rem', color: '#666', fontWeight: '500' }}>
                Page {displayPage} of {totalPages}
              </div>
            </div>
          )}

          {/* Summary footer */}
          {!loading && (
            <div style={{
              padding: '15px 20px',
              backgroundColor: '#e9ecef',
              borderTop: totalPages <= 1 ? '2px solid #dee2e6' : 'none',
              textAlign: 'center',
              fontSize: '1.3rem',
              color: '#495057',
              fontWeight: '500'
            }}>
              {customers.length === 0 ? (
                <>No suspended walk-in customers found in the system</>
              ) : (
                <>
                  Total: {totalItems} suspended walk-in customer{totalItems !== 1 ? 's' : ''}
                  {totalPages > 1 && ` • Page ${displayPage} of ${totalPages}`}
                  {startDate && ` • Filtered from ${startDate}`}
                  {endDate && ` to ${endDate}`}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalkInSupCus;

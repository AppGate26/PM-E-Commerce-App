import React, { useState, useEffect } from "react";
import { apiRequest } from "../../../lib/config";
import img from '../../../assets/images/dLogo.png'

const RecoveryReport = ({ toggleRecoveryReportModal }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState("all");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 4;
  const asArray = (response) => {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.data)) return response.data;
    if (Array.isArray(response?.content)) return response.content;
    if (Array.isArray(response?.data?.content)) return response.data.content;
    if (Array.isArray(response?.result)) return response.result;
    if (Array.isArray(response?.result?.content)) return response.result.content;
    return [];
  };

  // Summary stats state
  const [summaryStats, setSummaryStats] = useState({
    partiallyRecovered: 0,
    recoveredBoxes: 0,
    successRate: "0.00%",
    notYetRecovered: 0,
    totalRecoveries: 0,
    totalBoxes: 0,
    pendingBoxes: 0,
    fullyRecovered: 0,
    acceptedBoxes: 0,
    failedBoxes: 0
  });

  useEffect(() => {
    fetchRecoveryReport();
  }, [currentPage, filterStatus]);

  const fetchRecoveryReport = async () => {
    console.log("🔍 API CALL: GET /api/admin/reports/recovery");
    setLoading(true);
    setError("");
    
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      
      if (filterStatus !== "all") {
        queryParams.append("status", filterStatus);
      }
      
      const response = await apiRequest(`/admin/reports/recovery?${queryParams}`, "GET");
      console.log("✅ API RESPONSE - Recovery Report:", response);
      
      let reportList = [];
      let pagination = { 
        totalPages: 1, 
        currentPage: 1,
        totalItems: 0
      };
      
      // Handle the API response structure
      if (response?.data?.allRecoveries && Array.isArray(response.data.allRecoveries)) {
        // Extract recovery data from allRecoveries array
        reportList = response.data.allRecoveries;
        
        // Extract summary statistics
        if (response.data) {
          setSummaryStats({
            partiallyRecovered: response.data.partiallyRecovered || 0,
            recoveredBoxes: response.data.recoveredBoxes || 0,
            successRate: response.data.successRate || "0.00%",
            notYetRecovered: response.data.notYetRecovered || 0,
            totalRecoveries: response.data.totalRecoveries || 0,
            totalBoxes: response.data.totalBoxes || 0,
            pendingBoxes: response.data.pendingBoxes || 0,
            fullyRecovered: response.data.fullyRecovered || 0,
            acceptedBoxes: response.data.acceptedBoxes || 0,
            failedBoxes: response.data.failedBoxes || 0
          });
        }
      } 
      // Fallback to other response formats
      else {
        reportList = asArray(response);
        pagination.totalPages = response?.totalPages || response?.data?.totalPages || 1;
        pagination.totalItems = response?.totalElements || response?.data?.totalElements || reportList.length;
      }
      
      // Map API response to your expected format
      const reportWithSn = reportList.map((item, index) => {
        return {
          id: item.id || item.recoveryId || index,
          sn: (currentPage - 1) * itemsPerPage + index + 1,
          customerName: item.customerName || item.customer?.name || item.recipientName || "N/A",
          productId: item.productId || item.boxId || item.referenceNumber || "N/A",
          officerName: item.officerName || item.agentName || item.recoveryAgent?.name || "N/A",
          status: item.status || item.recoveryStatus || "N/A",
          // Additional fields
          recoveryDate: item.recoveryDate || item.createdDate,
          amountRecovered: item.amountRecovered || 0,
          totalAmount: item.totalAmount || 0
        };
      });
      
      setReportData(reportWithSn);
      setTotalPages(pagination.totalPages || 1);
      setTotalItems(pagination.totalItems || reportList.length);
      
      console.log("✅ UI UPDATED: Loaded", reportWithSn.length, "recovery report items");
      
    } catch (err) {
      console.error("❌ API ERROR - fetchRecoveryReport:", err);
      setError(err.message || "Failed to load recovery report.");
      setTimeout(() => setError(""), 5000);
      
      setReportData([]);
      setTotalPages(1);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  const displayData = reportData;
  const emptyRowsCount = Math.max(0, itemsPerPage - displayData.length);

  const handlePrev = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    console.log("🔄 Refreshing recovery report...");
    setCurrentPage(1);
    fetchRecoveryReport();
  };

  // Stats Summary Component
  const StatsSummary = () => (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '12px',
      margin: '0 40px 20px 40px',
      padding: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '1px solid #e9ecef'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>TOTAL RECOVERIES</div>
        <div style={{ fontSize: '16px', fontWeight: '700', color: '#0867db' }}>
          {summaryStats.totalRecoveries}
        </div>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>SUCCESS RATE</div>
        <div style={{ fontSize: '16px', fontWeight: '700', color: '#28a745' }}>
          {summaryStats.successRate}
        </div>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>RECOVERED BOXES</div>
        <div style={{ fontSize: '16px', fontWeight: '700', color: '#17a2b8' }}>
          {summaryStats.recoveredBoxes}
        </div>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>PENDING BOXES</div>
        <div style={{ fontSize: '16px', fontWeight: '700', color: '#ffc107' }}>
          {summaryStats.pendingBoxes}
        </div>
      </div>
      
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>FAILED BOXES</div>
        <div style={{ fontSize: '16px', fontWeight: '700', color: '#dc3545' }}>
          {summaryStats.failedBoxes}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      backgroundColor: '#fff',
      borderRadius: '12px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '25px 40px',
        borderBottom: '2px solid #e9ecef'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flex: 1, justifyContent: 'space-between' }}>
          <div style={{
            width: '45px',
            height: '45px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <img src={img} alt="pmlogo" style={{height:'5vh'}}/>
          </div>
          
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#0867db',
            margin: 0,
          }}>
            RECOVERY REPORT
          </h2>

          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              style={{
                background: 'none',
                border: 'none',
                color: loading ? '#ccc' : '#0867db',
                fontSize: '14px',
                cursor: loading ? 'not-allowed' : 'pointer',
                padding: '8px 12px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s',
                fontWeight: '600'
              }}
              onMouseOver={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#f0f0f0'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {loading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M12 2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M12 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M4.93 4.93L7.76 7.76" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M16.24 16.24L19.07 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M2 12H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M18 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M4.93 19.07L7.76 16.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path d="M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C14.1974 3 16.1951 3.86091 17.6569 5.34315M21 3V7M21 7H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Refresh
                </>
              )}
            </button>
            
            {/* Filter Dropdown */}
            <div style={{ position: 'relative' }}>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  appearance: 'none',
                  backgroundColor: 'white',
                  border: '2px solid #0867db',
                  borderRadius: '6px',
                  padding: '8px 35px 8px 15px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#0867db',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="all">All</option>
                <option value="Recovered">Recovered</option>
                <option value="To be Recovered">To be Recovered</option>
                <option value="Partially Recovered">Partially Recovered</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </select>
              <svg
                width="12"
                height="8"
                viewBox="0 0 12 8"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  fill: '#0867db'
                }}
              >
                <path d="M1 1L6 6L11 1" stroke="#0867db" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            
            {/* Close Button */}
            <button
              onClick={toggleRecoveryReportModal}
              style={{
                background: 'none',
                border: 'none',
                color: '#0867db',
                fontSize: '32px',
                cursor: 'pointer',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f0f0f0'; }}
              onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* Alert */}
      {error && (
        <div style={{
          backgroundColor: '#fee',
          color: '#c33',
          padding: '12px 40px',
          borderLeft: '4px solid #c33',
          margin: '20px 40px',
          borderRadius: '4px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            style={{
              background: 'none',
              border: 'none',
              color: '#c33',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0 8px'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Stats Summary */}
      <StatsSummary />

      {/* Table */}
      <div style={{ padding: '0 40px 30px 40px' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0
          }}>
            <thead>
              <tr style={{ backgroundColor: '#0867db' }}>
                <th style={{
                  padding: '16px 20px',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '700',
                  textAlign: 'left',
                  borderTopLeftRadius: '8px'
                }}>S/N</th>
                <th style={{
                  padding: '16px 20px',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '700',
                  textAlign: 'left'
                }}>Customer's Name</th>
                <th style={{
                  padding: '16px 20px',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '700',
                  textAlign: 'left'
                }}>Product ID</th>
                <th style={{
                  padding: '16px 20px',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '700',
                  textAlign: 'left'
                }}>Officer's Name</th>
                <th style={{
                  padding: '16px 20px',
                  color: 'white',
                  fontSize: '15px',
                  fontWeight: '700',
                  textAlign: 'left',
                  borderTopRightRadius: '8px'
                }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && reportData.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{
                    padding: '60px',
                    textAlign: 'center',
                    color: '#0867db',
                    fontSize: '16px'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <div style={{ 
                        width: '40px', 
                        height: '40px', 
                        border: '3px solid #f3f3f3',
                        borderTop: '3px solid #0867db',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      <div>Loading recovery report data...</div>
                    </div>
                  </td>
                </tr>
              ) : displayData.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{
                    padding: '60px',
                    textAlign: 'center',
                    color: '#999',
                    fontSize: '16px'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#999">
                        <path d="M9 12H15M9 16H15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <div>No recovery data available</div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {summaryStats.totalRecoveries > 0 
                          ? `${summaryStats.totalRecoveries} recoveries found, but no detailed records` 
                          : 'No recovery data found for the current period'}
                      </div>
                      <button
                        onClick={fetchRecoveryReport}
                        style={{
                          background: '#0867db',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: '600',
                          marginTop: '10px'
                        }}
                      >
                        Try Again
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {displayData.map((item, index) => (
                    <tr key={item.id || index} style={{
                      backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eef5ff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#fff' : '#f8f9fa'; }}
                    >
                      <td style={{
                        padding: '18px 20px',
                        fontSize: '15px',
                        color: '#333',
                        borderBottom: '1px solid #e9ecef'
                      }}>{item.sn}</td>
                      <td style={{
                        padding: '18px 20px',
                        fontSize: '15px',
                        color: '#333',
                        borderBottom: '1px solid #e9ecef'
                      }}>{item.customerName}</td>
                      <td style={{
                        padding: '18px 20px',
                        fontSize: '15px',
                        color: '#333',
                        borderBottom: '1px solid #e9ecef'
                      }}>{item.productId}</td>
                      <td style={{
                        padding: '18px 20px',
                        fontSize: '15px',
                        color: '#333',
                        borderBottom: '1px solid #e9ecef'
                      }}>{item.officerName}</td>
                      <td style={{
                        padding: '18px 20px',
                        fontSize: '15px',
                        color: '#333',
                        borderBottom: '1px solid #e9ecef'
                      }}>{item.status}</td>
                    </tr>
                  ))}
                  {Array.from({ length: emptyRowsCount }).map((_, index) => (
                    <tr key={`empty-${index}`} style={{
                      backgroundColor: (displayData.length + index) % 2 === 0 ? '#fff' : '#f8f9fa',
                      height: '56px'
                    }}>
                      <td colSpan="5" style={{ borderBottom: '1px solid #e9ecef' }}></td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        borderTop: '1px solid #e9ecef',
        backgroundColor: '#f8f9fa',
        borderBottomLeftRadius: '12px',
        borderBottomRightRadius: '12px'
      }}>
        <div style={{ color: '#666', fontSize: '14px' }}>
          Showing {displayData.length} of {totalItems} items
          {summaryStats.totalRecoveries > 0 && (
            <span style={{ marginLeft: '10px', color: '#0867db', fontWeight: '600' }}>
              • Total Recoveries: {summaryStats.totalRecoveries}
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            onClick={handlePrev}
            disabled={currentPage === 1 || loading}
            style={{
              background: currentPage === 1 || loading ? '#f0f0f0' : '#0867db',
              border: 'none',
              color: currentPage === 1 || loading ? '#999' : 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: currentPage === 1 || loading ? 'not-allowed' : 'pointer',
              padding: '8px 20px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              if (currentPage !== 1 && !loading) {
                e.currentTarget.style.backgroundColor = '#0867db';
                e.currentTarget.style.transform = 'translateX(-2px)';
              }
            }}
            onMouseOut={(e) => {
              if (currentPage !== 1 && !loading) {
                e.currentTarget.style.backgroundColor = '#0867db';
                e.currentTarget.style.transform = 'translateX(0)';
              }
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Prev
          </button>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px',
            color: '#666'
          }}>
            <span style={{
              color: '#0867db',
              fontWeight: '700',
              backgroundColor: '#eef5ff',
              padding: '4px 12px',
              borderRadius: '4px'
            }}>
              {currentPage}
            </span>
            <span>of</span>
            <span>{totalPages}</span>
          </div>
          
          <button
            onClick={handleNext}
            disabled={currentPage >= totalPages || loading}
            style={{
              background: currentPage >= totalPages || loading ? '#f0f0f0' : '#0867db',
              border: 'none',
              color: currentPage >= totalPages || loading ? '#999' : 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: currentPage >= totalPages || loading ? 'not-allowed' : 'pointer',
              padding: '8px 20px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              if (currentPage < totalPages && !loading) {
                e.currentTarget.style.backgroundColor = '#0867db';
                e.currentTarget.style.transform = 'translateX(2px)';
              }
            }}
            onMouseOut={(e) => {
              if (currentPage < totalPages && !loading) {
                e.currentTarget.style.backgroundColor = '#0867db';
                e.currentTarget.style.transform = 'translateX(0)';
              }
            }}
          >
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        
        <div style={{ fontSize: '12px', color: '#999' }}>
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Add CSS for spinner animation */}
      <style jsx="true">{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RecoveryReport;



import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { deliveryApi } from "../../../lib/deliveryApi";
import { useAuth } from "../../../context/AuthContext";
import RiderDetailView from "./RiderDetailView";
import RiderInfo from "./RiderInfo";

const ManageRiders = ({ toggleManageRidersModal }) => {
  const { isAdmin } = useAuth();

  const closeModal = () => {
    toggleManageRidersModal();
  };

  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [selectedRiderId, setSelectedRiderId] = useState(null);
  // null | "view" | "edit" - which full-screen panel replaces the table below.
  const [activePanel, setActivePanel] = useState(null);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      setRiders([]);
      setError("Managing riders is restricted for this account.");
      return;
    }

    fetchRiders();
  }, [isAdmin]);

  const fetchRiders = async () => {
    if (!isAdmin) {
      setLoading(false);
      setRiders([]);
      setError("Managing riders is restricted for this account.");
      return;
    }

    try {
      setLoading(true);
      const ridersList = await deliveryApi.getRiders();
      setRiders(ridersList || []);
    } catch (err) {
      console.error("Error fetching riders:", err);
      setError("Failed to load riders. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (riderId) => {
    if (!isAdmin) {
      setError("Deleting riders is restricted for this account.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this rider?")) {
      return;
    }

    try {
      setLoading(true);
      await deliveryApi.deleteRider(riderId);
      await fetchRiders();
      setError("");
    } catch (err) {
      console.error("Error deleting rider:", err);
      setError("Failed to delete rider. Please try again.");
      setLoading(false);
    }
  };

  const handleView = (rider) => {
    const riderId = rider.riderId || rider.id;
    if (!riderId) {
      setError("Rider ID is missing or invalid.");
      return;
    }
    setSelectedRiderId(riderId);
    setActivePanel("view");
  };

  const handleEdit = (riderOrId) => {
    const riderId = riderOrId?.riderId || riderOrId?.id || riderOrId;
    if (!riderId) {
      setError("Rider ID is missing or invalid.");
      return;
    }
    setSelectedRiderId(riderId);
    setActivePanel("edit");
  };

  const handleCloseDetail = () => {
    setActivePanel(null);
    setSelectedRiderId(null);
  };

  const handleRiderSaved = () => {
    setActivePanel(null);
    setSelectedRiderId(null);
    fetchRiders();
  };

  const filteredRiders = riders.filter((rider) => {
    const fullName = `${rider.surName || ""} ${rider.otherName || ""}`.toLowerCase();
    const phone = (rider.phoneNumber || "").toLowerCase();
    const email = (rider.email || "").toLowerCase();
    const term = searchTerm.toLowerCase();

    return fullName.includes(term) || phone.includes(term) || email.includes(term);
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRiders = filteredRiders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.max(1, Math.ceil(filteredRiders.length / itemsPerPage));

  const getFullName = (rider) => {
    return `${rider.surName || ""} ${rider.otherName || ""}`.trim() || "N/A";
  };

  const getGender = (rider) => {
    return rider.gender ? rider.gender.charAt(0).toUpperCase() : "N/A";
  };

  if (activePanel === "view") {
    return (
      <RiderDetailView
        riderId={selectedRiderId}
        onClose={handleCloseDetail}
        onEdit={() => setActivePanel("edit")}
      />
    );
  }

  if (activePanel === "edit") {
    return (
      <RiderInfo
        riderId={selectedRiderId}
        toggleInfoModal={handleCloseDetail}
        onSaved={handleRiderSaved}
      />
    );
  }

  return (
    <div className="manage-riders-card">
      <div className="manage-riders-header">
        <h1 className="manage-riders-page-title">Manage Riders</h1>
        <div className="manage-riders-header-actions">
          <Link to="/admin/delivery" className="manage-riders-btn manage-riders-btn-primary">
            Back to Delivery
          </Link>
          <button onClick={closeModal} className="manage-riders-btn-icon" aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <div className="manage-riders-toolbar">
        <div className="manage-riders-search-wrap">
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="manage-riders-search-input"
          />
          <svg
            className="manage-riders-search-icon"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </div>

        <div className="manage-riders-total-count">
          Total: <strong>{filteredRiders.length}</strong> riders
        </div>
      </div>

      {error && <div className="manage-riders-alert">{error}</div>}

      {loading && <div className="manage-riders-loading">Loading riders...</div>}

      {!loading && (
        <>
          <div className="manage-riders-table-shell">
            <table className="manage-riders-table manage-riders-table-standard">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Name</th>
                  <th>Phone Number</th>
                  <th>Email</th>
                  <th className="manage-riders-col-center">Gender</th>
                  <th className="manage-riders-col-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentRiders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="manage-riders-empty-row">
                      {searchTerm ? "No riders match your search" : "No riders found"}
                    </td>
                  </tr>
                ) : (
                  currentRiders.map((rider, index) => (
                    <tr
                      key={rider.riderId || rider.id || index}
                      className={index % 2 === 0 ? "manage-riders-row-even" : "manage-riders-row-odd"}
                    >
                      <td>{indexOfFirstItem + index + 1}</td>
                      <td className="manage-riders-name-cell">{getFullName(rider)}</td>
                      <td>{rider.phoneNumber || "N/A"}</td>
                      <td>{rider.email || "N/A"}</td>
                      <td className="manage-riders-col-center">{getGender(rider)}</td>
                      <td className="manage-riders-col-center">
                        <div className="manage-riders-row-actions">
                          <button
                            onClick={() => handleView(rider)}
                            className="manage-riders-btn manage-riders-btn-small manage-riders-btn-primary"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleEdit(rider)}
                            className="manage-riders-btn manage-riders-btn-small manage-riders-btn-secondary"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(rider.riderId || rider.id)}
                            className="manage-riders-btn manage-riders-btn-small manage-riders-btn-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredRiders.length > 0 && (
            <div className="manage-riders-pagination-wrap">
              <div className="manage-riders-pagination-summary">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRiders.length)} of {filteredRiders.length} entries
              </div>

              <div className="manage-riders-pagination-controls">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="manage-riders-btn manage-riders-btn-page"
                >
                  Prev
                </button>
                <span className="manage-riders-page-pill">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="manage-riders-btn manage-riders-btn-page"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManageRiders;

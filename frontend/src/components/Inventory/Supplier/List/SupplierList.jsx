import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchInventorySuppliers } from "../../../../lib/inventoryApi";
import PMlogo from "../../../../assets/images/PMlogo.png";
import "./SupplierList.css";

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        setLoading(true);
        setError("");
        const suppliersList = await fetchInventorySuppliers();
        setSuppliers(suppliersList);
        setFilteredSuppliers(suppliersList);
      } catch (err) {
        setError(err?.message || "Failed to load suppliers. Please refresh the page.");
        setSuppliers([]);
        setFilteredSuppliers([]);
      } finally {
        setLoading(false);
      }
    };

    loadSuppliers();
  }, []);

  useEffect(() => {
    let filtered = [...suppliers];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (supplier) =>
          supplier.supplierId?.toLowerCase().includes(query) ||
          supplier.customerName?.toLowerCase().includes(query) ||
          supplier.contactName?.toLowerCase().includes(query) ||
          supplier.contactEmail?.toLowerCase().includes(query) ||
          supplier.contactPhoneNo?.toLowerCase().includes(query) ||
          supplier.taxId?.toLowerCase().includes(query) ||
          supplier.address?.toLowerCase().includes(query)
      );
    }

    setFilteredSuppliers(filtered);
  }, [searchQuery, suppliers]);

  const handleViewSupplier = (supplier) => {
    const id = supplier.id || supplier.supplierId;
    navigate(`/inventory/suppliers/${id}`, { state: { supplier } });
  };

  const visibleCount = filteredSuppliers.length;
  const withEmailCount = filteredSuppliers.filter((supplier) => supplier.contactEmail).length;
  const withPhoneCount = filteredSuppliers.filter((supplier) => supplier.contactPhoneNo).length;

  const renderNav = () => (
    <nav className="supplier-nav">
      <div className="supplier-nav-shell">
        <div className="supplier-nav-brand">
          <div className="cart-icon-nav">
            <img src={PMlogo} alt="Peace of Mind logo" className="supplier-nav-logo" />
          </div>
          <div className="supplier-nav-copy">
            <p className="supplier-nav-eyebrow">Inventory Module</p>
            <h1 className="supplier-nav-title">Supplier Directory</h1>
            <p className="supplier-nav-subtitle">Search, review, and manage supplier records from one standard page.</p>
          </div>
        </div>

        <div className="nav-buttons">
          <Link to="/adminDashboard" className="supplier-nav-link">
            <button className="nav-dashboard-btn">Dashboard</button>
          </Link>
          <Link to="/inventory" className="supplier-nav-link">
            <button className="Log_Out-btn">Back to Inventory</button>
          </Link>
        </div>
      </div>
    </nav>
  );

  if (loading) {
    return (
      <div className="supplier-list-container">
        {renderNav()}
        <div className="supplier-content">
          <section className="supplier-panel">
            <div className="loading-message">Loading suppliers...</div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="supplier-list-container">
      {renderNav()}

      <div className="supplier-content">
        <section className="supplier-hero">
          <div className="supplier-hero-copy">
            <h2 className="supplier-title">Suppliers</h2>
            <p className="supplier-description">
              This workspace gives you a cleaner supplier register with faster search, better visibility into contact coverage, and quick access to each supplier profile.
            </p>
          </div>
        </section>

        <section className="supplier-summary">
          <article className="supplier-summary-card">
            <span>Total Suppliers</span>
            <strong>{visibleCount}</strong>
            <p>Visible records in the current directory view.</p>
          </article>
          <article className="supplier-summary-card">
            <span>With Email</span>
            <strong>{withEmailCount}</strong>
            <p>Suppliers that already have an email contact saved.</p>
          </article>
          <article className="supplier-summary-card">
            <span>With Phone</span>
            <strong>{withPhoneCount}</strong>
            <p>Suppliers that already have a phone number on file.</p>
          </article>
        </section>

        <section className="supplier-panel">
          <div className="supplier-toolbar">
            <div className="supplier-toolbar-copy">
              <h3>Supplier Register</h3>
              <p>Use the search field to filter by company, supplier ID, contact details, tax ID, or address.</p>
            </div>

            <div className="search-section">
              <span className="search-icon">⌕</span>
              <input
                type="search"
                className="search-input"
                placeholder="Search supplier, email, ID, phone, tax ID, or address"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="supplier-table-wrap">
            {filteredSuppliers.length === 0 && !loading ? (
              <div className="supplier-empty">
                {searchQuery ? "No suppliers found matching your search." : "No suppliers available."}
              </div>
            ) : (
              <table className="supplier-table">
                <thead>
                  <tr>
                    <th>S/N</th>
                    <th>Supplier ID</th>
                    <th>Company</th>
                    <th>Contact Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Tax ID</th>
                    <th>Address</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((supplier, index) => {
                    const supplierId = supplier.supplierId || "N/A";
                    const numericId = supplier.id || supplier.supplierId;
                    const companyName = supplier.customerName || "N/A";
                    const contactName = supplier.contactName || "N/A";
                    const contactEmail = supplier.contactEmail || "N/A";
                    const contactPhone = supplier.contactPhoneNo || "N/A";
                    const taxId = supplier.taxId || "N/A";
                    const address = supplier.address || "N/A";

                    return (
                      <tr key={numericId || index} className="supplier-row">
                        <td>{index + 1}</td>
                        <td className="supplier-id-cell">{supplierId}</td>
                        <td className="supplier-company">
                          <strong>{companyName}</strong>
                          <span>{contactName !== "N/A" ? `Contact: ${contactName}` : "No contact person saved"}</span>
                        </td>
                        <td>{contactName}</td>
                        <td className="supplier-email">{contactEmail}</td>
                        <td>{contactPhone}</td>
                        <td>
                          <span className="supplier-badge">{taxId}</span>
                        </td>
                        <td className="address-cell">{address}</td>
                        <td>
                          <button className="view-supplier-btn" onClick={() => handleViewSupplier(supplier)}>
                            Open Profile
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SupplierList;

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchInventoryStocks } from "../../../../lib/inventoryApi";
import "./StockList.css";

const StockList = () => {
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const fetchStocks = async () => {
    try {
      setLoading(true);
      setError("");
      const stocksList = await fetchInventoryStocks();
      setStocks(stocksList);
      setFilteredStocks(stocksList);
    } catch (err) {
      setError(err?.message || "Failed to load stocks. Please refresh the page.");
      setStocks([]);
      setFilteredStocks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  useEffect(() => {
    let filtered = [...stocks];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (stock) =>
          (stock.productName && stock.productName.toLowerCase().includes(query)) ||
          (stock.description && stock.description.toLowerCase().includes(query)) ||
          (stock.categoryName && stock.categoryName.toLowerCase().includes(query)) ||
          (stock.subCategoryName && stock.subCategoryName.toLowerCase().includes(query)) ||
          (stock.id && stock.id.toString().includes(query)) ||
          (stock.quantity && stock.quantity.toString().includes(query))
      );
    }

    setFilteredStocks(filtered);
  }, [searchQuery, stocks]);

  const handleViewEdit = (stockId) => {
    navigate(`/inventory/stocks/${stockId}`);
  };

  if (loading) {
    return (
      <div className="stock-list-container">
        <div className="stock-list-header">
          <h1>All Stocks</h1>
          <Link to="/inventory">
            <button className="Log_Out-btn">Back to Inventory</button>
          </Link>
        </div>
        <div className="stock-list-content">
          <div className="loading-message">Loading stocks...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="stock-list-container">
        <div className="stock-list-header">
          <h1>All Stocks</h1>
          <Link to="/inventory">
            <button className="Log_Out-btn">Back to Inventory</button>
          </Link>
        </div>
        <div className="stock-list-content">
          <div className="error-message">{error}</div>
          <button onClick={fetchStocks} className="btn btn-primary mt-3">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stock-list-container">
      <div className="stock-list-header">
        <h1>All Stocks</h1>
        <Link to="/inventory">
          <button className="Log_Out-btn">Back to Inventory</button>
        </Link>
      </div>

      <div className="stock-list-content">
        <div className="search-container mb-4">
          <input
            type="text"
            placeholder="Search stocks by product, description, category, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        {filteredStocks.length === 0 ? (
          <div className="no-stocks-message">
            {searchQuery.trim() ? "No stocks found matching your search." : "No stocks found."}
          </div>
        ) : (
          <div className="table-container">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Sub-Category</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Cost Price</th>
                  <th>Selling Price</th>
                  <th>Reorder Level</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock, index) => (
                  <tr key={stock.id || index}>
                    <td>{index + 1}</td>
                    <td>{stock.productName || stock.product?.productName || "N/A"}</td>
                    <td>{stock.categoryName || stock.category?.categoryName || "N/A"}</td>
                    <td>{stock.subCategoryName || stock.subCategory?.subCategoryName || "N/A"}</td>
                    <td>{stock.description || "N/A"}</td>
                    <td>{stock.quantity || 0}</td>
                    <td>{stock.costPrice || "N/A"}</td>
                    <td>{stock.sellingPrice || stock.unitPrice || "N/A"}</td>
                    <td>{stock.reorderLevel || 0}</td>
                    <td>
                      <button onClick={() => handleViewEdit(stock.id)} className="btn btn-sm btn-primary">
                        View/Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockList;

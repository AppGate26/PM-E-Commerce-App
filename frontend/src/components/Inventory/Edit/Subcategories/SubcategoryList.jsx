import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../../../lib/config";
import "./SubcategoryList.css";

const SubcategoryList = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    console.log("SubcategoryList: Component mounted, fetching subcategories...");
    fetchSubcategories();
  }, []);

  useEffect(() => {
    console.log("SubcategoryList: Filtering subcategories...", {
      searchQuery,
      totalSubcategories: subcategories.length,
    });
    filterSubcategories();
  }, [searchQuery, subcategories]);

  const fetchSubcategories = async () => {
    try {
      setLoading(true);
      setError("");
      
      console.log("SubcategoryList: Starting to fetch subcategories from API...");
      
      const response = await apiRequest("/admin/sub-categories", "GET");
      console.log("SubcategoryList: Subcategories response received:", response);
      console.log("SubcategoryList: Response type:", typeof response);
      console.log("SubcategoryList: Is array?", Array.isArray(response));
      
      let subcategoriesList = [];
      if (Array.isArray(response)) {
        subcategoriesList = response;
        console.log("SubcategoryList: Subcategories list is direct array, count:", subcategoriesList.length);
      } else if (response?.data && Array.isArray(response.data)) {
        subcategoriesList = response.data;
        console.log("SubcategoryList: Subcategories list from response.data, count:", subcategoriesList.length);
      } else if (response?.response?.data && Array.isArray(response.response.data)) {
        subcategoriesList = response.response.data;
        console.log("SubcategoryList: Subcategories list from response.response.data, count:", subcategoriesList.length);
      } else if (response?.response && Array.isArray(response.response)) {
        subcategoriesList = response.response;
        console.log("SubcategoryList: Subcategories list from response.response, count:", subcategoriesList.length);
      } else {
        console.warn("SubcategoryList: Unexpected response format:", response);
      }

      console.log("SubcategoryList: Final subcategories list count:", subcategoriesList.length);
      console.log("SubcategoryList: Has subcategories?", subcategoriesList.length > 0);
      if (subcategoriesList.length > 0) {
        console.log("SubcategoryList: Sample subcategory:", subcategoriesList[0]);
      } else {
        console.error("SubcategoryList: NO SUBCATEGORIES FOUND! Response was:", response);
      }

      setSubcategories(subcategoriesList);
      setFilteredSubcategories(subcategoriesList);
    } catch (err) {
      console.error("SubcategoryList: Error fetching subcategories:", err);
      const errorMsg = err?.message || "Failed to load subcategories. Please refresh the page.";
      setError(errorMsg);
      setSubcategories([]);
      setFilteredSubcategories([]);
    } finally {
      setLoading(false);
      console.log("SubcategoryList: Finished fetching subcategories, loading set to false");
    }
  };

  const filterSubcategories = () => {
    console.log("SubcategoryList: Starting filter operation...");
    let filtered = [...subcategories];
    const initialCount = filtered.length;
    console.log("SubcategoryList: Initial filtered count:", initialCount);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const beforeSearch = filtered.length;
      filtered = filtered.filter(
        (subcategory) =>
          subcategory.name?.toLowerCase().includes(query) ||
          subcategory.description?.toLowerCase().includes(query) ||
          subcategory.id?.toString().includes(query) ||
          subcategory.category?.name?.toLowerCase().includes(query)
      );
      console.log("SubcategoryList: After search filter:", {
        before: beforeSearch,
        after: filtered.length,
        query: searchQuery,
      });
    }

    console.log("SubcategoryList: Final filtered count:", filtered.length);
    setFilteredSubcategories(filtered);
  };

  if (loading) {
    return (
      <div className="subcategory-list-container">
        <nav className="subcategory-nav">
          <div className="d-flex align-items-center justify-content-between gap-5">
            <div className="d-flex align-items-center gap-3">
              <div className="cart-icon-nav">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="white"
                  viewBox="0 0 24 24"
                >
                  <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                </svg>
              </div>
              <h1 className="subcategory-nav-title">INVENTERY HUB</h1>
            </div>
            <div>
              <Link to="/inventory">
                <button className="Log_Out-btn">Log Out</button>
              </Link>
            </div>
          </div>
        </nav>
        <div className="subcategory-content">
          <div className="loading-message">Loading subcategories...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="subcategory-list-container">
      <nav className="subcategory-nav">
        <div className="d-flex align-items-center justify-content-between gap-5">
          <div className="d-flex align-items-center gap-3">
            <div className="cart-icon-nav">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="white"
                viewBox="0 0 24 24"
              >
                <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </div>
            <h1 className="subcategory-nav-title">INVENTERY HUB</h1>
          </div>
          <div>
            <Link to="/inventory">
              <button className="Log_Out-btn">Log Out</button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="subcategory-content">
        <h2 className="subcategory-title">SUBCATEGORY</h2>

        <div className="search-section">
          <input
            type="search"
            className="search-input"
            placeholder="SEARCH"
            value={searchQuery}
            onChange={(e) => {
              console.log("SubcategoryList: Search query changed:", e.target.value);
              setSearchQuery(e.target.value);
            }}
          />
        </div>

        <div className="subcategory-table-container">
          {error && (
            <div className="error-message" style={{ color: "red", marginTop: "10px" }}>
              {error}
            </div>
          )}

          {filteredSubcategories.length === 0 && !loading ? (
            <div className="no-subcategories-message">
              {error 
                ? error
                : searchQuery
                ? "No subcategories found matching your search."
                : "No subcategories available."}
            </div>
          ) : (
            <table className="subcategory-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>SUBCATEGORY</th>
                  <th>CATEGORY</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubcategories.map((subcategory, index) => {
                  console.log("SubcategoryList: Rendering subcategory row:", {
                    index: index + 1,
                    id: subcategory.id,
                    name: subcategory.name,
                    category: subcategory.category?.name,
                  });

                  return (
                    <tr key={subcategory.id} className="subcategory-row">
                      <td>{index + 1}</td>
                      <td>{subcategory.name || "N/A"}</td>
                      <td>{subcategory.category?.name || subcategory.categoryId || "N/A"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubcategoryList;


































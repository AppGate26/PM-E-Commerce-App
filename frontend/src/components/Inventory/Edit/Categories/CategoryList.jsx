import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../../../../lib/config";
import "./CategoryList.css";

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    console.log("CategoryList: Component mounted, fetching categories...");
    fetchCategories();
  }, []);

  useEffect(() => {
    console.log("CategoryList: Filtering categories...", {
      searchQuery,
      totalCategories: categories.length,
    });
    filterCategories();
  }, [searchQuery, categories]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");
      
      console.log("CategoryList: Starting to fetch categories from API...");
      
      const response = await apiRequest("/admin/categories", "GET");
      console.log("CategoryList: Categories response received:", response);
      console.log("CategoryList: Response type:", typeof response);
      console.log("CategoryList: Is array?", Array.isArray(response));
      
      let categoriesList = [];
      if (Array.isArray(response)) {
        categoriesList = response;
        console.log("CategoryList: Categories list is direct array, count:", categoriesList.length);
      } else if (response?.data && Array.isArray(response.data)) {
        categoriesList = response.data;
        console.log("CategoryList: Categories list from response.data, count:", categoriesList.length);
      } else if (response?.response?.data && Array.isArray(response.response.data)) {
        categoriesList = response.response.data;
        console.log("CategoryList: Categories list from response.response.data, count:", categoriesList.length);
      } else if (response?.response && Array.isArray(response.response)) {
        categoriesList = response.response;
        console.log("CategoryList: Categories list from response.response, count:", categoriesList.length);
      } else {
        console.warn("CategoryList: Unexpected response format:", response);
      }

      console.log("CategoryList: Final categories list count:", categoriesList.length);
      console.log("CategoryList: Has categories?", categoriesList.length > 0);
      if (categoriesList.length > 0) {
        console.log("CategoryList: Sample category:", categoriesList[0]);
      } else {
        console.error("CategoryList: NO CATEGORIES FOUND! Response was:", response);
      }

      setCategories(categoriesList);
      setFilteredCategories(categoriesList);
    } catch (err) {
      console.error("CategoryList: Error fetching categories:", err);
      const errorMsg = err?.message || "Failed to load categories. Please refresh the page.";
      setError(errorMsg);
      setCategories([]);
      setFilteredCategories([]);
    } finally {
      setLoading(false);
      console.log("CategoryList: Finished fetching categories, loading set to false");
    }
  };

  const filterCategories = () => {
    console.log("CategoryList: Starting filter operation...");
    let filtered = [...categories];
    const initialCount = filtered.length;
    console.log("CategoryList: Initial filtered count:", initialCount);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const beforeSearch = filtered.length;
      filtered = filtered.filter(
        (category) =>
          category.name?.toLowerCase().includes(query) ||
          category.description?.toLowerCase().includes(query) ||
          category.id?.toString().includes(query)
      );
      console.log("CategoryList: After search filter:", {
        before: beforeSearch,
        after: filtered.length,
        query: searchQuery,
      });
    }

    console.log("CategoryList: Final filtered count:", filtered.length);
    setFilteredCategories(filtered);
  };

  if (loading) {
    return (
      <div className="category-list-container">
        <nav className="category-nav">
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
              <h1 className="category-nav-title">INVENTERY HUB</h1>
            </div>
            <div>
              <Link to="/inventory">
                <button className="Log_Out-btn">Log Out</button>
              </Link>
            </div>
          </div>
        </nav>
        <div className="category-content">
          <div className="loading-message">Loading categories...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="category-list-container">
      <nav className="category-nav">
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
            <h1 className="category-nav-title">INVENTERY HUB</h1>
          </div>
          <div>
            <Link to="/inventory">
              <button className="Log_Out-btn">Log Out</button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="category-content">
        <h2 className="category-title">CATEGORY</h2>

        <div className="search-section">
          <input
            type="search"
            className="search-input"
            placeholder="SEARCH"
            value={searchQuery}
            onChange={(e) => {
              console.log("CategoryList: Search query changed:", e.target.value);
              setSearchQuery(e.target.value);
            }}
          />
        </div>

        <div className="category-table-container">
          {error && (
            <div className="error-message" style={{ color: "red", marginTop: "10px" }}>
              {error}
            </div>
          )}

          {filteredCategories.length === 0 && !loading ? (
            <div className="no-categories-message">
              {error 
                ? error
                : searchQuery
                ? "No categories found matching your search."
                : "No categories available."}
            </div>
          ) : (
            <table className="category-table">
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>CATEGORY</th>
                  <th>DESCRIPTON</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category, index) => {
                  console.log("CategoryList: Rendering category row:", {
                    index: index + 1,
                    id: category.id,
                    name: category.name,
                  });

                  return (
                    <tr key={category.id} className="category-row">
                      <td>{index + 1}</td>
                      <td>{category.name || "N/A"}</td>
                      <td>{category.description || "N/A"}</td>
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

export default CategoryList;


































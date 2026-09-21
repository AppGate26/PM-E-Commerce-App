import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../../../../lib/config";
import "./CategoryList.css";
import DeleteConfirmModalSimple from "../shared/DeleteConfirmModalSimple";

const EditCategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("EditCategoryList: Component mounted, fetching categories...");
    fetchCategories();
  }, []);

  useEffect(() => {
    console.log("EditCategoryList: Filtering categories...", {
      searchQuery,
      totalCategories: categories.length,
    });
    filterCategories();
  }, [searchQuery, categories]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");
      
      console.log("EditCategoryList: Starting to fetch categories from API...");
      
      const response = await apiRequest("/admin/categories", "GET");
      console.log("EditCategoryList: Categories response received:", response);
      
      let categoriesList = [];
      if (Array.isArray(response)) {
        categoriesList = response;
        console.log("EditCategoryList: Categories list is direct array, count:", categoriesList.length);
      } else if (response?.data && Array.isArray(response.data)) {
        categoriesList = response.data;
        console.log("EditCategoryList: Categories list from response.data, count:", categoriesList.length);
      } else if (response?.response?.data && Array.isArray(response.response.data)) {
        categoriesList = response.response.data;
        console.log("EditCategoryList: Categories list from response.response.data, count:", categoriesList.length);
      } else if (response?.response && Array.isArray(response.response)) {
        categoriesList = response.response;
        console.log("EditCategoryList: Categories list from response.response, count:", categoriesList.length);
      } else {
        console.warn("EditCategoryList: Unexpected response format:", response);
      }

      console.log("EditCategoryList: Final categories list count:", categoriesList.length);
      setCategories(categoriesList);
      setFilteredCategories(categoriesList);
    } catch (err) {
      console.error("EditCategoryList: Error fetching categories:", err);
      const errorMsg = err?.message || "Failed to load categories. Please refresh the page.";
      setError(errorMsg);
      setCategories([]);
      setFilteredCategories([]);
    } finally {
      setLoading(false);
      console.log("EditCategoryList: Finished fetching categories, loading set to false");
    }
  };

  const filterCategories = () => {
    console.log("EditCategoryList: Starting filter operation...");
    let filtered = [...categories];
    const initialCount = filtered.length;
    console.log("EditCategoryList: Initial filtered count:", initialCount);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const beforeSearch = filtered.length;
      filtered = filtered.filter(
        (category) =>
          category.name?.toLowerCase().includes(query) ||
          category.description?.toLowerCase().includes(query) ||
          category.id?.toString().includes(query)
      );
      console.log("EditCategoryList: After search filter:", {
        before: beforeSearch,
        after: filtered.length,
        query: searchQuery,
      });
    }

    console.log("EditCategoryList: Final filtered count:", filtered.length);
    setFilteredCategories(filtered);
  };

  const handleDelete = async (categoryId) => {
    if (!categoryId) {
      console.error("EditCategoryList: Delete attempted without category ID");
      setError("Category ID is missing. Cannot delete category.");
      return;
    }

    console.log(
      "EditCategoryList: Delete confirmation requested for category ID:",
      categoryId
    );

    // Open custom confirm modal
    setConfirmDeleteId(categoryId);
  };

  const confirmDelete = async () => {
    const categoryId = confirmDeleteId;
    if (!categoryId) return;

    try {
      setError("");
      setDeletingId(categoryId);
      const deleteId = categoryId.toString();
      console.log(
        "EditCategoryList: Deleting category with ID:",
        deleteId
      );

      await apiRequest(`/admin/categories/${deleteId}`, "DELETE");
      console.log("EditCategoryList: Category deleted successfully:", deleteId);
      
      // Refresh categories list
      console.log("EditCategoryList: Refreshing categories list after delete...");
      await fetchCategories();
      setDeletingId(null);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("EditCategoryList: Error deleting category:", err);
      setError(
        err?.message ||
          `Failed to delete category with ID ${categoryId}. Please try again.`
      );
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
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
        <h2 className="category-title">EDIT CATEGORY</h2>

        <div className="search-section">
          <input
            type="search"
            className="search-input"
            placeholder="SEARCH"
            value={searchQuery}
            onChange={(e) => {
              console.log(
                "EditCategoryList: Search query changed:",
                e.target.value
              );
              setSearchQuery(e.target.value);
            }}
          />
        </div>

        <div className="category-table-container">
          {error && (
            <div
              className="error-message"
              style={{ color: "red", marginTop: "10px" }}
            >
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
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((category, index) => {
                  console.log("EditCategoryList: Rendering category row:", {
                    index: index + 1,
                    id: category.id,
                    name: category.name,
                  });

                  return (
                    <tr
                      key={category.id}
                      className="category-row"
                      onClick={() => {
                        console.log(
                          "EditCategoryList: row clicked, navigating to detail",
                          category.id
                        );
                        navigate(`/editCategories/${category.id}`);
                      }}
                    >
                      <td>{index + 1}</td>
                      <td>{category.name || "N/A"}</td>
                      <td>{category.description || "N/A"}</td>
                      <td>
                        <button
                          className="delete-category-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log(
                              "EditCategoryList: Delete button clicked for category:",
                              category.id
                            );
                            handleDelete(category.id);
                          }}
                          disabled={deletingId === category.id}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            viewBox="0 0 448 512"
                          >
                            <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64s14.3 32 32 32h384c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32l21.2 339c1.6 25.3 22.6 45 47.9 45h213.8c25.3 0 46.3-19.7 47.9-45L416 128z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <DeleteConfirmModalSimple
        isOpen={!!confirmDeleteId}
        title="DELETE CATEGORY?"
        onClose={() => {
          console.log("EditCategoryList: delete modal closed");
          setConfirmDeleteId(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default EditCategoryList;


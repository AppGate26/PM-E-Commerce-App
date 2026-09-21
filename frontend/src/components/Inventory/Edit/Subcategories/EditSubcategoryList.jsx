import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest } from "../../../../lib/config";
import "./SubcategoryList.css";
import DeleteConfirmModalSimple from "../shared/DeleteConfirmModalSimple";

const EditSubcategoryList = () => {
  const [subcategories, setSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("EditSubcategoryList: Component mounted, fetching subcategories...");
    fetchSubcategories();
  }, []);

  useEffect(() => {
    console.log("EditSubcategoryList: Filtering subcategories...", {
      searchQuery,
      totalSubcategories: subcategories.length,
    });
    filterSubcategories();
  }, [searchQuery, subcategories]);

  const fetchSubcategories = async () => {
    try {
      setLoading(true);
      setError("");
      
      console.log("EditSubcategoryList: Starting to fetch subcategories from API...");
      
      const response = await apiRequest("/admin/sub-categories", "GET");
      console.log("EditSubcategoryList: Subcategories response received:", response);
      
      let subcategoriesList = [];
      if (Array.isArray(response)) {
        subcategoriesList = response;
        console.log("EditSubcategoryList: Subcategories list is direct array, count:", subcategoriesList.length);
      } else if (response?.data && Array.isArray(response.data)) {
        subcategoriesList = response.data;
        console.log("EditSubcategoryList: Subcategories list from response.data, count:", subcategoriesList.length);
      } else if (response?.response?.data && Array.isArray(response.response.data)) {
        subcategoriesList = response.response.data;
        console.log("EditSubcategoryList: Subcategories list from response.response.data, count:", subcategoriesList.length);
      } else if (response?.response && Array.isArray(response.response)) {
        subcategoriesList = response.response;
        console.log("EditSubcategoryList: Subcategories list from response.response, count:", subcategoriesList.length);
      } else {
        console.warn("EditSubcategoryList: Unexpected response format:", response);
      }

      console.log("EditSubcategoryList: Final subcategories list count:", subcategoriesList.length);
      setSubcategories(subcategoriesList);
      setFilteredSubcategories(subcategoriesList);
    } catch (err) {
      console.error("EditSubcategoryList: Error fetching subcategories:", err);
      const errorMsg = err?.message || "Failed to load subcategories. Please refresh the page.";
      setError(errorMsg);
      setSubcategories([]);
      setFilteredSubcategories([]);
    } finally {
      setLoading(false);
      console.log("EditSubcategoryList: Finished fetching subcategories, loading set to false");
    }
  };

  const filterSubcategories = () => {
    console.log("EditSubcategoryList: Starting filter operation...");
    let filtered = [...subcategories];
    const initialCount = filtered.length;
    console.log("EditSubcategoryList: Initial filtered count:", initialCount);

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
      console.log("EditSubcategoryList: After search filter:", {
        before: beforeSearch,
        after: filtered.length,
        query: searchQuery,
      });
    }

    console.log("EditSubcategoryList: Final filtered count:", filtered.length);
    setFilteredSubcategories(filtered);
  };

  const handleDelete = async (subcategoryId) => {
    if (!subcategoryId) {
      console.error("EditSubcategoryList: Delete attempted without subcategory ID");
      setError("Subcategory ID is missing. Cannot delete subcategory.");
      return;
    }

    console.log(
      "EditSubcategoryList: Delete confirmation requested for subcategory ID:",
      subcategoryId
    );

    // Open custom confirm modal
    setConfirmDeleteId(subcategoryId);
  };

  const confirmDelete = async () => {
    const subcategoryId = confirmDeleteId;
    if (!subcategoryId) return;

    try {
      setError("");
      setDeletingId(subcategoryId);
      const deleteId = subcategoryId.toString();
      console.log(
        "EditSubcategoryList: Deleting subcategory with ID:",
        deleteId
      );

      await apiRequest(`/admin/sub-categories/${deleteId}`, "DELETE");
      console.log("EditSubcategoryList: Subcategory deleted successfully:", deleteId);
      
      // Refresh subcategories list
      console.log("EditSubcategoryList: Refreshing subcategories list after delete...");
      await fetchSubcategories();     
      setDeletingId(null);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("EditSubcategoryList: Error deleting subcategory:", err);
      setError(
        err?.message ||
          `Failed to delete subcategory with ID ${subcategoryId}. Please try again.`
      );
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
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
        <h2 className="subcategory-title">EDIT SUBCATEGORY</h2>

        <div className="search-section">
          <input
            type="search"
            className="search-input"
            placeholder="SEARCH"
            value={searchQuery}
            onChange={(e) => {
              console.log(
                "EditSubcategoryList: Search query changed:",
                e.target.value
              );
              setSearchQuery(e.target.value);
            }}
          />
        </div>

        <div className="subcategory-table-container">
          {error && (
            <div
              className="error-message"
              style={{ color: "red", marginTop: "10px" }}
            >
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
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubcategories.map((subcategory, index) => {
                  console.log(
                    "EditSubcategoryList: Rendering subcategory row:",
                    {
                      index: index + 1,
                      id: subcategory.id,
                      name: subcategory.name,
                      category: subcategory.category?.name,
                    }
                  );

                  return (
                    <tr
                      key={subcategory.id}
                      className="subcategory-row"
                      onClick={() => {
                        console.log(
                          "EditSubcategoryList: row clicked, navigating to detail",
                          subcategory.id
                        );
                        navigate(`/editSubcategories/${subcategory.id}`);
                      }}
                    >
                      <td>{index + 1}</td>
                      <td>{subcategory.name || "N/A"}</td>
                      <td>
                        {subcategory.category?.name ||
                          subcategory.categoryId ||
                          "N/A"}
                      </td>
                      <td>
                        <button
                          className="delete-subcategory-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log(
                              "EditSubcategoryList: Delete button clicked for subcategory:",
                              subcategory.id
                            );
                            handleDelete(subcategory.id);
                          }}
                          disabled={deletingId === subcategory.id}
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
        title="DELETE SUBCATEGORY?"
        onClose={() => {
          console.log("EditSubcategoryList: delete modal closed");
          setConfirmDeleteId(null);
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default EditSubcategoryList;


import { useEffect, useMemo, useState } from "react";
import logo from "../../../../assets/images/adminLogo.png";
import "./AllProducts.css";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchInventoryCategories,
  fetchInventoryProducts,
  fetchInventorySuppliers,
} from "../../../../lib/inventoryApi";

const pageSize = 20;

const toText = (value, fallback = "N/A") => {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.length ? toText(value[0], fallback) : fallback;
  if (typeof value === "object") {
    return (
      value.name ||
      value.companyName ||
      value.productName ||
      value.description ||
      value.label ||
      fallback
    );
  }
  return fallback;
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeSupplier = (supplier) => ({
  id: String(supplier?.id ?? ""),
  name: toText(supplier?.companyName || supplier?.name, "N/A"),
});

const normalizeProduct = (product, supplierMap) => {
  const productId = product?.id ?? product?.productId ?? "";
  const supplierId = product?.supplierId ?? product?.supplier?.id ?? "";
  const supplierFromMap = supplierMap.get(String(supplierId));
  const suppliedAmount = toNumber(
    product?.totalSupplied ||
      product?.suppliedAmount ||
      product?.openingQuantity ||
      product?.quantitySupplied ||
      product?.quantity,
    0
  );
  const availableQuantity = toNumber(
    product?.quantityInStore ||
      product?.stockQuantity ||
      product?.availableQuantity ||
      product?.quantityAvailable ||
      product?.quantity,
    0
  );
  const soldQuantityRaw = toNumber(
    product?.quantitySold ||
      product?.soldQuantity ||
      product?.totalSold ||
      product?.amountSold,
    0
  );
  const soldQuantity =
    soldQuantityRaw > 0
      ? soldQuantityRaw
      : Math.max(suppliedAmount - availableQuantity, 0);
  const isSoldOut = availableQuantity <= 0;

  return {
    id: String(productId || ""),
    // Prefer the backend-generated product code; fall back to a consistent
    // client-side format only when the code is absent.
    formattedId:
      product?.productCode ||
      (productId ? `PM-PD-${String(productId).padStart(4, "0")}` : "N/A"),
    name: toText(product?.productName || product?.name, "Unnamed Product"),
    description: toText(product?.productDescription || product?.description, "No description"),
    supplier: toText(
      product?.supplier?.companyName ||
        product?.supplier?.name ||
        supplierFromMap?.name,
      "N/A"
    ),
    category: toText(product?.category?.name || product?.categoryName, "N/A"),
    subCategory: toText(
      product?.subCategory?.name || product?.subCategoryName,
      "N/A"
    ),
    suppliedAmount,
    availableQuantity,
    soldQuantity,
    registerStatus: isSoldOut ? "Sold Out" : "Unsold / In Stock",
    registerStatusClass: isSoldOut ? "sold" : "unsold",
    price: toNumber(
      product?.sellingPrice ||
        product?.productSellingPrice ||
        product?.costPrice ||
        product?.productCostPrice,
      0
    ),
    raw: product,
  };
};

const AllProducts = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriceMin, setFilterPriceMin] = useState("");
  const [filterPriceMax, setFilterPriceMax] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [productsList, categoriesList, suppliersList] = await Promise.all([
          fetchInventoryProducts(500),
          fetchInventoryCategories(),
          fetchInventorySuppliers().catch(() => []),
        ]);

        if (!active) return;

        const supplierMap = new Map(
          suppliersList.map((supplier) => {
            const normalized = normalizeSupplier(supplier);
            return [normalized.id, normalized];
          })
        );

        const normalizedProducts = Array.isArray(productsList)
          ? productsList.map((product) => normalizeProduct(product, supplierMap))
          : [];

        setProducts(normalizedProducts);
        setCategories(Array.isArray(categoriesList) ? categoriesList : []);
      } catch (err) {
        if (!active) return;
        setError(err?.message || "Failed to load products. Please refresh the page.");
        setProducts([]);
        setCategories([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    let next = [...products];

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      next = next.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.formattedId.toLowerCase().includes(query) ||
          product.id.toLowerCase().includes(query)
      );
    }

    if (filterCategory) {
      const categoryId = String(filterCategory);
      next = next.filter((product) => {
        const category = categories.find(
          (item) => String(item.id) === categoryId
        );
        return (
          String(product.raw?.categoryId || product.raw?.category?.id || "") === categoryId ||
          product.category === toText(category?.name, "N/A")
        );
      });
    }

    if (filterPriceMin || filterPriceMax) {
      const min = filterPriceMin ? Number(filterPriceMin) : 0;
      const max = filterPriceMax ? Number(filterPriceMax) : Number.POSITIVE_INFINITY;
      next = next.filter((product) => product.price >= min && product.price <= max);
    }

    return next;
  }, [categories, filterCategory, filterPriceMax, filterPriceMin, products, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterPriceMin, filterPriceMax]);

  const isFiltered =
    Boolean(searchQuery.trim()) ||
    Boolean(filterCategory) ||
    Boolean(filterPriceMin) ||
    Boolean(filterPriceMax);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageProducts = isFiltered
    ? filteredProducts
    : filteredProducts.slice(startIndex, startIndex + pageSize);

  const totalSuppliedAmount = filteredProducts.reduce(
    (sum, product) => sum + product.suppliedAmount,
    0
  );
  const soldOutCount = filteredProducts.filter(
    (product) => product.registerStatusClass === "sold"
  ).length;
  const unsoldCount = filteredProducts.filter(
    (product) => product.registerStatusClass === "unsold"
  ).length;

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilterCategory("");
    setFilterPriceMin("");
    setFilterPriceMax("");
  };

  const handleEdit = (product) => {
    if (!product.id) {
      setError("Unable to open product. Product ID is missing.");
      return;
    }

    navigate(`/editProducts/${product.id}`, { state: { product: product.raw } });
  };

  return (
    <div className="all-products-container">
      <nav className="all-products-nav all-products-nav--standard">
        <div className="all-products-brand">
          <Link to="/adminDashboard">
            <img src={logo} alt="logo" className="logo-product" />
          </Link>
          <div>
            <p className="all-products-eyebrow">Inventory Directory</p>
            <h1 className="all-products-title">all products</h1>
          </div>
        </div>
        <Link to="/inventory">
          <button className="Log_Out-btn all-products-back-btn">Back to Inventory</button>
        </Link>
      </nav>

      <section className="all-products-hero-wrap">
        <div className="container">
          <div className="all-products-hero">
            <div>
              <p className="all-products-hero-badge">
                {loading ? "Loading Register" : "Product Register"}
              </p>
              <h2>
                {loading ? "Preparing product records" : "Browse the full all product register"}
              </h2>
              <p>
                View every registered product and quickly distinguish items that are
                still unsold in stock from products that are already sold out.
              </p>
            </div>
            <div className="all-products-stats">
              <div className="all-products-stat-card">
                <span>Total Products</span>
                <strong>{products.length}</strong>
              </div>
              <div className="all-products-stat-card">
                <span>Unsold / In Stock</span>
                <strong>{unsoldCount}</strong>
              </div>
              <div className="all-products-stat-card">
                <span>Sold Out</span>
                <strong>{soldOutCount}</strong>
              </div>
              <div className="all-products-stat-card">
                <span>Units Registered</span>
                <strong>{totalSuppliedAmount.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="products-filter-section">
        <div className="container">
          <div className="row g-3 all-products-filter-grid">
            <div className="col-md-4">
              <label className="label-product">search product</label>
              <input
                type="search"
                className="products-form search-input"
                placeholder="search by name, description, or product id"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <label className="label-product">filter by category</label>
              <select
                className="products-form"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {toText(category.name, "Unnamed Category")}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label className="label-product">min price</label>
              <input
                type="number"
                className="products-form search-input"
                placeholder="Min price"
                value={filterPriceMin}
                onChange={(e) => setFilterPriceMin(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="label-product">max price</label>
              <input
                type="number"
                className="products-form search-input"
                placeholder="Max price"
                value={filterPriceMax}
                onChange={(e) => setFilterPriceMax(e.target.value)}
              />
            </div>
            <div className="col-md-1 d-flex align-items-end">
              <button className="clear-filter-btn" onClick={handleClearFilters}>
                Clear
              </button>
            </div>
          </div>
          {error && <div className="error-message">{error}</div>}
        </div>
      </div>

      <div className="products-list-section">
        <div className="container">
          <div className="products-header-info">
            <h3 className="products-count">
              {loading
                ? "Loading products..."
                : `Showing ${pageProducts.length} of ${filteredProducts.length} registered products`}
            </h3>
          </div>

          {loading ? (
            <div className="loading-message">Loading products...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="no-products-message">
              {error
                ? error
                : isFiltered
                ? "No products found matching your criteria."
                : "No products available. Create your first product using the Add Product option."}
            </div>
          ) : (
            <div className="all-products-table-container">
                <table className="all-products-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>PRODUCT</th>
                    <th>DESCRIPTION</th>
                    <th>SUPPLIER</th>
                      <th>CATEGORY</th>
                      <th>SUB-CATEGORY</th>
                      <th>AMOUNT SUPPLIED</th>
                      <th>AVAILABLE</th>
                      <th>SOLD</th>
                      <th>STATUS</th>
                      <th>PRICE(#)</th>
                    </tr>
                  </thead>
                <tbody>
                  {pageProducts.map((product, index) => (
                    <tr
                      key={`${product.id || product.formattedId}-${index}`}
                      className="all-products-row"
                      onClick={() => handleEdit(product)}
                      style={{ cursor: "pointer" }}
                    >
                      <td>{product.formattedId}</td>
                      <td>{product.name}</td>
                      <td className="all-products-description-cell">{product.description}</td>
                      <td>{product.supplier}</td>
                      <td>{product.category}</td>
                      <td>{product.subCategory}</td>
                      <td>{product.suppliedAmount.toLocaleString()}</td>
                      <td>{product.availableQuantity.toLocaleString()}</td>
                      <td>{product.soldQuantity.toLocaleString()}</td>
                      <td>
                        <span
                          className={`all-products-status-pill ${product.registerStatusClass}`}
                        >
                          {product.registerStatus}
                        </span>
                      </td>
                      <td>{product.price.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !isFiltered && totalPages > 1 && (
            <div className="products-pagination">
              <button
                className="pagination-btn"
                disabled={safePage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {safePage} of {totalPages}
              </span>
              <button
                className="pagination-btn"
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllProducts;

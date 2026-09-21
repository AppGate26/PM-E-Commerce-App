import { apiRequest } from "./config";

const DEFAULT_CATEGORIES = [
  { id: 1, name: "ELECTRONICS", description: "Electronic products" },
  { id: 2, name: "FURNITURE", description: "Home and office furniture" },
  { id: 3, name: "GROCERIES", description: "Daily consumables" },
  { id: 4, name: "FASHION", description: "Clothing and accessories" },
  { id: 5, name: "AUTOMOTIVE", description: "Vehicle parts and accessories" },
];

const DEFAULT_SUB_CATEGORIES = [
  { id: 101, categoryId: 1, name: "PHONES", description: "Mobile phones" },
  { id: 102, categoryId: 1, name: "LAPTOPS", description: "Laptop computers" },
  { id: 103, categoryId: 1, name: "ACCESSORIES", description: "Electronic accessories" },
  { id: 201, categoryId: 2, name: "CHAIRS", description: "All chair types" },
  { id: 202, categoryId: 2, name: "TABLES", description: "Tables and desks" },
  { id: 203, categoryId: 2, name: "CABINETS", description: "Storage cabinets" },
  { id: 301, categoryId: 3, name: "BEVERAGES", description: "Drinks and beverages" },
  { id: 302, categoryId: 3, name: "SNACKS", description: "Snacks and light foods" },
  { id: 303, categoryId: 3, name: "HOUSEHOLD", description: "Household groceries" },
  { id: 401, categoryId: 4, name: "MEN", description: "Men fashion items" },
  { id: 402, categoryId: 4, name: "WOMEN", description: "Women fashion items" },
  { id: 403, categoryId: 4, name: "KIDS", description: "Kids fashion items" },
  { id: 501, categoryId: 5, name: "TYRES", description: "Tyres and tubes" },
  { id: 502, categoryId: 5, name: "BATTERIES", description: "Vehicle batteries" },
  { id: 503, categoryId: 5, name: "SPARE PARTS", description: "General spare parts" },
];

export const extractApiArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.response)) return payload.response;
  if (Array.isArray(payload?.response?.data)) return payload.response.data;
  if (Array.isArray(payload?.response?.items)) return payload.response.items;
  if (Array.isArray(payload?.response?.content)) return payload.response.content;
  return [];
};

export const fetchInventoryCategories = async () => {
  const response = await apiRequest("/admin/categories", "GET");
  const rows = extractApiArray(response);
  return rows.length > 0 ? rows : DEFAULT_CATEGORIES;
};

export const fetchInventorySubCategories = async (categoryId) => {
  const endpoint = categoryId
    ? `/categories/${categoryId}/sub-categories`
    : "/admin/sub-categories";
  const response = await apiRequest(endpoint, "GET");
  const rows = extractApiArray(response);
  if (rows.length > 0) return rows;

  if (!categoryId) return DEFAULT_SUB_CATEGORIES;
  return DEFAULT_SUB_CATEGORIES.filter(
    (item) => String(item.categoryId) === String(categoryId)
  );
};

export const fetchInventoryProducts = async (size = 500) => {
  const endpoints = [
    `/products?size=${size}`,
    `/admin/products?size=${size}`,
  ];
  let lastRows = [];

  for (const endpoint of endpoints) {
    try {
      const response = await apiRequest(endpoint, "GET");
      const rows = extractApiArray(response);
      if (rows.length > 0) {
        return rows;
      }
      lastRows = rows;
    } catch {
      // Try the next known product endpoint.
    }
  }

  return lastRows;
};

export const fetchInventorySuppliers = async () => {
  const endpoints = [
    "/users/suppliers",
    "/admin/approvals/suppliers",
    "/admin/inventory/reports/suppliers",
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await apiRequest(endpoint, "GET");
      const rows = extractApiArray(response);
      if (rows.length > 0) return rows.map(mapInventorySupplier);
    } catch {
      // Try the next supplier endpoint.
    }
  }

  return [];
};

export const mapInventorySupplier = (supplier = {}) => {
  const id =
    supplier.id ||
    supplier.supplierId ||
    supplier.supplier_id ||
    supplier.customerId ||
    supplier.customer_id;

  const companyName =
    supplier.companyName ||
    supplier.customerName ||
    supplier.name ||
    supplier.supplierName ||
    "";

  return {
    ...supplier,
    id,
    supplierId: supplier.supplierId || id,
    companyName,
    customerName: supplier.customerName || companyName,
    contactName:
      supplier.contactName ||
      supplier.contactPersonName ||
      supplier.contact_person_name ||
      "",
    contactPhoneNo:
      supplier.contactPhoneNo ||
      supplier.contactPhoneNumber ||
      supplier.contact_phone_number ||
      "",
  };
};

export const fetchInventoryStocks = async () => {
  const response = await apiRequest("/admin/stocks?size=500", "GET");
  return extractApiArray(response);
};

// Map a backend Stock row (which embeds its Product) into the product-shaped
// object the sales screens expect. Sales must sell from stock — not the product
// register — so the price and available quantity come from the stock record.
export const mapStockToSellableProduct = (stock = {}) => {
  const product = stock.product || {};
  const stockPrice = stock.unitPrice ?? stock.sellingPrice;
  const sellingPrice =
    stockPrice != null && stockPrice !== "" ? stockPrice : product.sellingPrice;

  return {
    // Orders reference the underlying product id; keep the stock id alongside it.
    id: product.id ?? stock.productId ?? stock.id,
    productId: product.id ?? stock.productId ?? stock.id,
    stockId: stock.id,
    productName: product.productName || product.name || stock.description || "",
    name: product.productName || product.name || stock.description || "",
    category: stock.category?.name || product.category?.name || product.category || "",
    subCategory:
      stock.subCategory?.name || product.subCategory?.name || product.subCategory || "",
    productDescription: stock.description || product.productDescription || product.description || "",
    description: stock.description || product.productDescription || product.description || "",
    sellingPrice,
    price: sellingPrice,
    unitPrice: stock.unitPrice ?? sellingPrice,
    availableQuantity: stock.quantity ?? 0,
    quantity: stock.quantity ?? 0,
    supplierId: stock.supplierId ?? product.supplierId ?? null,
    branchId: stock.branchId ?? null,
  };
};

// Returns only products that currently have stock on hand, shaped for sales screens.
export const fetchSellableProducts = async () => {
  const stocks = await fetchInventoryStocks();
  return stocks
    .map(mapStockToSellableProduct)
    .filter((item) => item.id != null && Number(item.availableQuantity) > 0);
};

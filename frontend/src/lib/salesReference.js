import { apiRequest } from "./config";

// Sales reference for the order-action modals (one-off order, orderlist as paid,
// refund order). The reference is generated AND persisted by the backend
// (POST /sales/orders/{orderId}/sales-reference, idempotent) so it is stable and
// auditable — nothing is generated on the client.

const extractOrder = (payload) =>
  payload?.response?.data ??
  payload?.response ??
  payload?.data ??
  payload ??
  {};

// Ask the backend to mint (or return the existing) sales reference for an order.
// Returns the persisted reference string.
export const fetchSalesReference = async (orderId) => {
  if (!orderId) throw new Error("An order must be selected first.");
  const payload = await apiRequest(
    `/sales/orders/${orderId}/sales-reference`,
    "POST"
  );
  const order = extractOrder(payload);
  const reference = order?.salesReference || order?.sales_reference || "";
  if (!reference) {
    throw new Error("Sales reference was not returned by the server.");
  }
  return reference;
};

// Open a minimal printable window for a sales reference.
export const printSalesReference = (salesReference, details = {}) => {
  const rows = Object.entries(details)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px;color:#555;">${label}</td><td style="padding:6px 12px;font-weight:600;">${value}</td></tr>`
    )
    .join("");

  const win = window.open("", "_blank", "width=520,height=640");
  if (!win) return;
  win.document.write(`
    <html>
      <head>
        <title>Sales Reference ${salesReference}</title>
      </head>
      <body style="font-family: Arial, sans-serif; padding: 24px; color:#111;">
        <h2 style="color:#0867db; margin-bottom:4px;">Sales Reference</h2>
        <div style="font-size:1.4rem; font-weight:700; letter-spacing:1px; margin-bottom:16px;">
          ${salesReference}
        </div>
        <table style="border-collapse:collapse; width:100%; border:1px solid #eee;">
          ${rows}
        </table>
        <p style="margin-top:24px; color:#888; font-size:0.85rem;">
          Printed ${new Date().toLocaleString()}
        </p>
        <script>window.onload = function(){ window.print(); };</script>
      </body>
    </html>
  `);
  win.document.close();
};

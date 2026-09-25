import React, { useEffect, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import PMlogo from "../../../assets/images/PMlogo.png";
import { deliveryApi } from "../../../lib/deliveryApi";

const TransitDeliveryDetail = ({ delivery, onClose, onDelivered }) => {
  const [marking, setMarking] = useState(false);
  const [markError, setMarkError] = useState("");

  // Prevent body scrolling when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Extract data from delivery prop. These used to fall back to sample values
  // ("Adelani Yakubu", "ITEL", ...), which made a missing field look like real data.
  const detailData = {
    orderId: delivery?.salesReference || delivery?.orderNumber || delivery?.orderId || "-",
    productId: delivery?.productId ?? "-",
    productName: delivery?.productName || "-",
    productDescription: delivery?.productDescription || "-",
    customerName: delivery?.customerName || "-",
    customerAddress: delivery?.customerAddress || delivery?.deliveryAddress || "-",
    customerPhone: delivery?.customerPhone || "-",
    riderName: delivery?.riderName || "-",
    riderPhone: delivery?.riderPhone || "-",
    startedAt: delivery?.shippedAt ? new Date(delivery.shippedAt).toLocaleString() : "-",
    riderImage: delivery?.riderImage || "",
    productImage: delivery?.productImage || "",
  };

  const handleMarkDelivered = async () => {
    try {
      setMarking(true);
      setMarkError("");
      await deliveryApi.markTransitDelivered(delivery);
      onDelivered?.();
      onClose?.();
    } catch (err) {
      setMarkError(err?.message || "Failed to mark as delivered.");
    } finally {
      setMarking(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1060] overflow-hidden"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-[10px] border border-blue-100 max-w-[1200px] w-[95%] max-h-[90vh] py-10 px-12 font-sans shadow-[0_10px_30px_rgba(0,0,0,0.15)] overflow-hidden relative box-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <img
            src={PMlogo}
            alt="PM Logo"
            className="w-[55px] h-[55px] object-contain"
          />

          <h1 className="text-[3rem] font-bold text-primary uppercase m-0 font-sans">
            VIEW DETAILS
          </h1>

          <IoArrowBack
            className="text-[2.4rem] text-primary cursor-pointer"
            onClick={onClose}
          />
        </div>

        {/* Order ID */}
        <div className="mb-[2.2rem] flex items-center justify-between gap-6">
          <h2 className="text-[2.1rem] font-bold text-primary m-0 font-sans">
            {detailData.orderId}
          </h2>
          <div className="flex items-center gap-4">
            {markError && <span className="text-[1.2rem] text-red-600 font-sans">{markError}</span>}
            <button
              type="button"
              onClick={handleMarkDelivered}
              disabled={marking}
              className="text-[1.3rem] font-semibold text-white bg-primary border-none rounded-md py-3 px-6 cursor-pointer disabled:opacity-60 font-sans"
            >
              {marking ? "Updating..." : "Mark as Delivered"}
            </button>
          </div>
        </div>

        {/* Main 3‑column layout */}
        <div className="grid grid-cols-[1.1fr_1.1fr_0.9fr] gap-10 w-full box-border overflow-hidden">
          {/* LEFT: Product / Customer */}
          <div>
            <div className="mb-[1.8rem]">
              <label className="text-[1.4rem] font-semibold text-gray-dark mb-[0.8rem] block font-sans">
                Product ID:
              </label>
              <input
                type="text"
                value={detailData.productId}
                readOnly
                className="w-full text-[1.3rem] py-4 px-0 border-0 border-b border-gray-300 outline-none bg-transparent font-sans"
              />
            </div>

            <div className="mb-[1.8rem]">
              <label className="text-[1.4rem] font-semibold text-gray-dark mb-[0.8rem] block font-sans">
                Product Name:
              </label>
              <input
                type="text"
                value={detailData.productName}
                readOnly
                className="w-full text-[1.3rem] py-4 px-0 border-0 border-b border-gray-300 outline-none bg-transparent font-sans"
              />
            </div>

            <div className="mb-[1.8rem]">
              <label className="text-[1.4rem] font-semibold text-gray-dark mb-[0.8rem] block font-sans">
                Product Description
              </label>
              <textarea
                value={detailData.productDescription}
                readOnly
                className="w-full text-[1.3rem] py-4 px-0 border-0 border-b border-gray-300 outline-none resize-none min-h-[70px] bg-transparent font-sans"
              />
            </div>

            <div className="mb-[1.8rem]">
              <label className="text-[1.4rem] font-semibold text-gray-dark mb-[0.8rem] block font-sans">
                Customer&apos;s name
              </label>
              <input
                type="text"
                value={detailData.customerName}
                readOnly
                className="w-full text-[1.3rem] py-4 px-0 border-0 border-b border-gray-300 outline-none bg-transparent font-sans"
              />
            </div>

            <div className="mb-[1.8rem]">
              <label className="text-[1.4rem] font-semibold text-gray-dark mb-[0.8rem] block font-sans">
                Customer&apos;s phone No
              </label>
              <input
                type="text"
                value={detailData.customerPhone}
                readOnly
                className="w-full text-[1.3rem] py-4 px-0 border-0 border-b border-gray-300 outline-none bg-transparent font-sans"
              />
            </div>

            <div>
              <label className="text-[1.4rem] font-semibold text-gray-dark mb-[0.8rem] block font-sans">
                Customer Address
              </label>
              <textarea
                value={detailData.customerAddress}
                readOnly
                className="w-full text-[1.3rem] py-4 px-0 border-0 border-b border-gray-300 outline-none resize-none min-h-[80px] bg-transparent font-sans"
              />
            </div>
          </div>

          {/* MIDDLE: Rider / Delivery */}
          <div>
            <div className="mb-[1.8rem]">
              <label className="text-[1.4rem] font-semibold text-gray-dark mb-[0.8rem] block font-sans">
                Rider&apos;s name
              </label>
              <input
                type="text"
                value={detailData.riderName}
                readOnly
                className="w-full text-[1.3rem] py-4 px-0 border-0 border-b border-gray-300 outline-none bg-transparent font-sans"
              />
            </div>

            <div className="mb-[1.8rem]">
              <label className="text-[1.4rem] font-semibold text-gray-dark mb-[0.8rem] block font-sans">
                Rider&apos;s phone No
              </label>
              <input
                type="text"
                value={detailData.riderPhone}
                readOnly
                className="w-full text-[1.3rem] py-4 px-0 border-0 border-b border-gray-300 outline-none bg-transparent font-sans"
              />
            </div>

            <div>
              <label className="text-[1.4rem] font-semibold text-gray-dark mb-[0.8rem] block font-sans">
                Left for delivery:
              </label>
              <input
                type="text"
                value={detailData.startedAt}
                readOnly
                className="w-full text-[1.3rem] py-4 px-0 border-0 border-b border-gray-300 outline-none bg-transparent font-sans"
              />
            </div>
          </div>

          {/* RIGHT: Images stacked with equal total height */}
          <div className="flex flex-col justify-between">
            <div className="text-center mb-8">
              <label className="text-[1.4rem] font-semibold text-gray-dark mb-[0.8rem] block font-sans">
                Rider&apos;s Image
              </label>
              <div className="h-[180px] border-2 border-dashed border-gray-400 rounded-md flex items-center justify-center bg-gray-100 mb-3 overflow-hidden">
                {detailData.riderImage ? (
                  <img src={detailData.riderImage} alt="Rider" className="h-full w-full object-contain" />
                ) : (
                  <div className="text-gray-500 text-[1.2rem] font-sans">No image</div>
                )}
              </div>
              <button className="text-[1.2rem] text-primary bg-transparent border-none cursor-pointer underline font-sans">
                View Bigger
              </button>
            </div>

            <div className="text-center">
              <label className="text-[1.4rem] font-semibold text-gray-dark mb-[0.8rem] block font-sans">
                Product Image
              </label>
              <div className="h-[180px] border-2 border-dashed border-gray-400 rounded-md flex items-center justify-center bg-gray-100 mb-3 overflow-hidden">
                {detailData.productImage ? (
                  <img src={detailData.productImage} alt="Product" className="h-full w-full object-contain" />
                ) : (
                  <div className="text-gray-500 text-[1.2rem] font-sans">No image</div>
                )}
              </div>
              <button className="text-[1.2rem] text-primary bg-transparent border-none cursor-pointer underline font-sans">
                View Bigger
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransitDeliveryDetail;






















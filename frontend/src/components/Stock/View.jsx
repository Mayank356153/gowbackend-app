import React from "react";

export default function TransferDetail({ data, onClose }) {
    console.log("Transfer Detail Data:", data);
  // Destructure relevant fields for easier use
  const {
    createdAt,
    createdBy,
    details,
    fromWarehouse,
    toWarehouse,
    transferDate,
    updatedAt,
    note,
    items,
  } = data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative overflow-auto max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute text-gray-600 top-3 right-3 hover:text-gray-900 focus:outline-none"
          aria-label="Close"
        >
          ✕
        </button>

        <h2 className="mb-4 text-xl font-semibold text-center">Transfer Details</h2>

        <div className="space-y-2 text-sm text-gray-700">
          <div>
            <span className="font-semibold">Transfer Date:</span>{" "}
            {new Date(createdAt).toLocaleString()}
          </div>
          <div>
            <span className="font-semibold">Created By:</span> {createdBy}
          </div>
          {details && (
            <div>
              <span className="font-semibold">Details:</span> {details}
            </div>
          )}
          <div>
            <span className="font-semibold">From Warehouse:</span>{" "}
            {fromWarehouse?.warehouseName}
          </div>
          <div>
            <span className="font-semibold">To Warehouse:</span>{" "}
            {toWarehouse?.warehouseName}
          </div>
         
          {note && (
            <div>
              <span className="font-semibold">Note:</span> {note}
            </div>
          )}
        </div>

        <h3 className="pb-1 mt-6 mb-2 font-semibold border-b">Items</h3>
        <ul className="overflow-auto max-h-48">
          {items?.length ? (
            items.map(({ _id, item, quantity }) => (
              <li
                key={_id}
                className="flex items-center justify-between p-3 mb-2 border rounded bg-gray-50"
              >
                <div>
                  <div className="font-semibold">{item?.itemName}</div>
                  <div className="text-xs text-gray-500">
                    Sales Price: ₹{item?.salesPrice}
                  </div>
                </div>
                <div className="text-sm font-semibold">Qty: {quantity}</div>
              </li>
            ))
          ) : (
            <li className="text-center text-gray-500">No items available</li>
          )}
        </ul>
      </div>
    </div>
  );
}

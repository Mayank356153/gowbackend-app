import React, { useState } from 'react';

// --- ICONS (Placeholders) ---
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);
const BarcodeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-gray-500">
    <path d="M3 6h18v2H3zM3 12h18v2H3zM3 18h18v2H3zM5 3v18M9 3v18M13 3v18M17 3v18"></path>
  </svg>
);


// --- Item Details Popup Component ---
const ItemDetailsPopup = ({ item, onClose }) => {
  if (!item) return null;

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent bg-opacity-60 backdrop-blur-sm">
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-bold text-gray-800">{item.item.itemName}</h3>
            <p className="text-sm text-gray-500">{item.item.itemCode}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-500 rounded-full hover:bg-gray-100 hover:text-gray-800"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Barcodes List */}
        <div className="p-4 space-y-3 overflow-y-auto max-h-80">
          <h4 className="text-sm font-semibold text-gray-600">Associated Barcodes:</h4>
          {item.item.barcodes && item.item.barcodes.length > 0 ? (
            <ul className="space-y-2">
              {item.item.barcodes.map((barcode, index) => (
                <li key={index} className="flex items-center p-2 text-gray-800 rounded-md bg-gray-50">
                  <BarcodeIcon />
                  <span className="ml-3 font-mono tracking-wider">{barcode}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No barcodes found for this item.</p>
          )}
        </div>

        {/* Footer with other details */}
        <div className="flex items-center justify-between p-4 rounded-b-lg bg-gray-50">
          <div>
            <span className="text-sm font-bold text-gray-800">MRP</span>
            <span className="block text-lg font-bold text-blue-600">
              ₹{item.item.mrp?.toFixed(2)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-gray-800">Current Stock</span>
            <span className="block text-lg font-bold text-gray-900">
              {item.item.openingStock || 0} {item.item.unit?.unitName || 'pcs'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsPopup;  
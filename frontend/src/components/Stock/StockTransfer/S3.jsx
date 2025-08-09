import React, { useState, useEffect, useRef } from 'react';
import dayjs from 'dayjs';
import { FaChevronLeft, FaPlus, FaBox,FaEdit, FaBoxOpen, FaTrash, FaMinus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { App } from '@capacitor/app';
import {Keyboard} from '@capacitor/keyboard';
// Main Component
export default function S3({
    formData,
    setActiveTab,
    selectedItems,
    setSelectedItems,
    warehouses,
    id,
    allItems
}) {
    const navigate = useNavigate();
    const [detailedItem, setDetailedItem] = useState(null);
     const [selectedItem, setSelectedItem] = useState(null);
    
    // Back button handling
    useEffect(() => {
        const backHandler = App.addListener('backButton', () => {
            if (detailedItem) {
                setDetailedItem(null);
            } else {
                setActiveTab('s2');
            }
        });
        return () => backHandler.remove();
    }, [setActiveTab, detailedItem]);

    // Quantity and delete logic
   const handleItemQuantity = (e, itemId, type) => {
    if (type === "delete") {
      setSelectedItems(prev => prev.filter(it => it.item !== itemId));
    return;
  }

  const updatedItems = selectedItems.map(item => {
     
    if (item.item === itemId) {
      console.log(item.itemName)
      const stockLimit = allItems.find(i => i._id === item.item)?.currentStock || 0;
      let newQuantity = item.quantity;
      
     
     
     
      if (type === "plus") {
        if (newQuantity < stockLimit) {
          newQuantity += 1;
        }
      } 
      else if (type === "minus") {
        if (newQuantity > 1) {
          newQuantity -= 1;
        }
      }
       else if (type === "change") {
        const inputValue = Number(e.target.value);
          console.log("aaaa")
          newQuantity = Math.min(inputValue, stockLimit);
        
      }

      return { ...item, quantity: newQuantity };
    }

    return item;
  });

  setSelectedItems(updatedItems);
};


    return (
        <div className="min-h-screen bg-gray-50">
            {detailedItem && <ItemInfoPage selectedItem={detailedItem} onClose={() => setDetailedItem(null)} />}

            
            {/* Main content with padding for the sticky footer */}
            <main className="p-3 space-y-4 pb-28">
                {/* Transfer Details Card */}
                <section className="p-4 bg-white shadow-sm rounded-xl">
                    <div className="grid grid-cols-2 text-sm gap-x-4 gap-y-3">
                        <InfoField label="Date" value={dayjs(formData.transferDate).format("DD MMM YYYY")} />
                        <InfoField label="From Warehouse" value={warehouses.find(w => w._id === formData.fromWarehouse)?.warehouseName} />
                        <InfoField label="To Warehouse" value={warehouses.find(w => w._id === formData.toWarehouse)?.warehouseName} />
                        <InfoField label="Details" value={formData.details} />
                    </div>
                    <div className="pt-3 mt-3 border-t">
                        <button className='flex items-center justify-center w-full gap-2 px-3 py-2 text-sm font-semibold text-white rounded-lg bg-cyan-600 hover:bg-cyan-700' onClick={() => setActiveTab("s2")} type="button">
                            <FaPlus className="mr-1" /> Add More Items
                        </button>
                    </div>
                </section>
                <SummaryCard items={selectedItems} /> 
                {/* Items List with POS Style */}
                <ItemsList
                    items={selectedItems}
                    allItems={allItems}
                    updateItem={handleItemQuantity}
                    setSelectedItem={setSelectedItem}
                />
                
            </main>

            {/* Sticky Footer */}
            <footer className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t">
                <div className="flex space-x-3">
                    <button type="button" onClick={() => navigate("/transfer-list")} className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200">
                        Cancel
                    </button>
                    <button type="submit" className="flex-1 px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700">
                        {id ? "Update Transfer" : "Save Transfer"}
                    </button>
                </div>
            </footer>
            
      {selectedItem && (
        <ItemDetailModal selectedItem={selectedItem} allItems={allItems} onClose={() => setSelectedItem(null)} />
      )}
        </div>
    );
}

// --- CHILD COMPONENTS ---
// NEW: Summary Card Component
const SummaryCard = ({ items }) => {
    // Calculate total quantity by summing up the quantity of each item
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueItems = items.length;

    return (
       <section className="pt-2 bg-white shadow-sm rounded-xl">
            <div className="flex items-center justify-around text-center">
                {/* Total Unique Items Stat */}
                <div>
                    <p className="text-sm ">Unique Items:{uniqueItems}</p>
                   
                </div>

                {/* Vertical Divider */}

                {/* Total Quantity Stat */}
                <div>
                    <p className="text-sm ">Total Quantity:{totalQuantity}</p>
                </div>
            </div>
        </section>
    );
};

const Info = ({ label, value }) => (
    <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-semibold text-gray-800 truncate">{value || 'N/A'}</p>
    </div>
);

const InfoField = ({ label, value }) => (
    <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-semibold text-gray-800 truncate">{value || 'N/A'}</p>
    </div>
);


// --- COMPONENT REFACTORED FOR BETTER MOBILE UX ---
const ItemDetailModal = ({ selectedItem, allItems, onClose }) => {
  const item = allItems.find(it => it._id === selectedItem.item);
  console.log(item);
  if (!item) return null;

  return (
    // CHANGED: Full-screen modal with flex-col layout for sticky footer
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex items-center justify-between flex-shrink-0 p-4 border-b">
        <button onClick={onClose} className="p-2 -ml-2 text-gray-600" type="button">
          <FaChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold">Item Details</h2>
        <div className="w-6" /> {/* Spacer */}
      </header>

      {/* CHANGED: Scrollable content area */}
      <main className="flex-grow p-4 overflow-y-auto ">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg">
              {item.image ? (
                <img src={item.image} alt="item" className="object-cover w-full h-full rounded-lg" />
              ) : (
                <FaBox size={32} className="text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-xl font-bold">{item.itemName}</p>
              <p className="text-sm text-gray-500">SKU: {item.sku || 'N/A'}</p>
              <p className="text-lg font-semibold text-cyan-600">₹{item.salesPrice}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Info label="Category" value={item.category?.name || 'N/A'} />
            <Info label="Brand" value={item.brand?.brandName || 'N/A'} />
            <Info label="Stock" value={item.currentStock || 0} />
            <Info label="Barcode" value={item.barcode || item.barcodes?.[0] || 'N/A'} />
          </div>
          {item.description && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Description</p>
              <p className="mt-1 text-sm text-gray-700">{item.description}</p>
            </div>
          )}
        </div>
      </main>

      {/* CHANGED: Sticky footer */}
      <footer className="flex-shrink-0 p-4 bg-white border-t">
        <button onClick={onClose} className="w-full py-3 font-semibold text-white rounded-lg bg-cyan-600 hover:bg-cyan-700" type="button">
          Close
        </button>
      </footer>
    </div>
  );
};

// --- COMPONENT REFACTORED FOR BETTER MOBILE UX ---
const ItemsList = ({ items, updateItem, removeItem, setSelectedItem }) => (
  <section className="w-full overflow-y-auto bg-white shadow rounded-xl ">
    <div className="divide-y divide-gray-200">
      {items.length === 0 ? (
        <div className="p-10 text-center">
          <FaBoxOpen size={40} className="mx-auto text-gray-400" />
          <h3 className="mt-4 text-base font-semibold text-gray-800">Your Cart is Empty</h3>
          <p className="mt-1 text-sm text-gray-500">Add items to get started.</p>
        </div>
      ) : (
        items.map((item, idx) => (
          <div key={item.id || idx} className="flex items-center gap-4 p-3">
            {/* Item Name & Details */}
            <div className="flex-grow cursor-pointer" onClick={() => setSelectedItem(item)}>
              <p className="font-semibold leading-tight text-gray-800" title={item.itemName}>
                {item.itemName}
              </p>
              <p className="text-xs text-gray-500">
                @ ₹{item.salesPrice.toFixed(2)}
              </p>
            </div>

            {/* Quantity Stepper & Price */}
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center bg-gray-100 rounded-lg">
                <button type="button"
                  onClick={() =>updateItem(null, item.item, "minus")}
                  className="px-3 py-1 rounded-l-lg text-cyan-600 hover:bg-gray-200"
                  aria-label="Decrease quantity"
                >
                  <FaMinus size={12} />
                </button>
                            <input           onFocus={(e) => {
    e.target.focus(); // ensure input is focused
    setTimeout(() => {
      Keyboard.show(); // explicitly show the keyboard
    }, 100); // short delay helps trigger keyboard on some Androids
  }}
  type="text"
  value={item.quantity}
  onChange={(e) => {
    const val = (Number(e.target.value));
    updateItem(e,item.item,"change");
  }}
  className="w-12 text-sm font-medium text-center text-gray-800 bg-transparent border-none focus:ring-0 focus:outline-none"
/>
                <button type="button"
                  onClick={() => updateItem(null, item.item, "plus")}
                  className="px-3 py-1 rounded-r-lg text-cyan-600 hover:bg-gray-200"
                  aria-label="Increase quantity"
                >
                  <FaPlus size={12} />
                </button>
              </div>
              <p className="text-base font-bold text-gray-900">
                ₹{(item.salesPrice * item.quantity).toFixed(2)}
              </p>
            </div>

            {/* Remove Button */}
            <button type="button"
              onClick={() => updateItem(null, item.item, "delete")}
              className="p-2 text-gray-400 rounded-full hover:bg-red-50 hover:text-red-500"
              aria-label="Remove item"
            >
              <FaTrash size={16} />
            </button>
          </div>
        ))
      )}
    </div>
  </section>
);



// Item Details Modal (No design changes needed, it's already good)
const ItemInfoPage = ({ selectedItem, onClose }) => (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-50">
        <header className="flex items-center justify-between flex-shrink-0 p-4 bg-white border-b">
            <button type="button" onClick={onClose} className="p-2 -ml-2 text-gray-600"><FaChevronLeft size={20} /></button>
            <h2 className="text-lg font-semibold">Item Details</h2>
            <div className="w-6" />
        </header>
        <main className="flex-grow p-3 space-y-3 overflow-y-auto">
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl">
                <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-lg">
                    {selectedItem.image ? <img src={selectedItem.image} alt={selectedItem.itemName} className="object-cover w-full h-full rounded-lg" /> : <FaBox className="text-2xl text-gray-400" />}
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{selectedItem.itemName}</h3>
                    <p className="text-sm text-gray-500">SKU: {selectedItem.sku || 'N/A'}</p>
                </div>
            </div>
            <div className="p-4 bg-white rounded-xl">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <InfoField label="Category" value={selectedItem.category?.name} />
                    <InfoField label="Brand" value={selectedItem.brand?.brandName} />
                    <InfoField label="Current Stock" value={selectedItem.openingStock || '0'} />
                    <InfoField label="Barcode" value={selectedItem.barcode || selectedItem.barcodes?.[0]} />
                </div>
            </div>
        </main>
        <footer className="flex-shrink-0 p-3 bg-white border-t">
            <button onClick={onClose} type="button" className="w-full py-3 font-semibold text-white rounded-xl bg-cyan-600 hover:bg-cyan-700">
                Close
            </button>
        </footer>
    </div>
);
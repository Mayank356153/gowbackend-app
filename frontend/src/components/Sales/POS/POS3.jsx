import React from 'react'
import { useState,useRef,useEffect } from 'react'
import {App} from '@capacitor/app'
import { FaBarcode,FaHandPaper,FaLayerGroup,FaMoneyBill,FaCreditCard ,FaPlus,FaMinus,FaTrash,FaBoxOpen} from 'react-icons/fa'
import { CameraIcon } from '@heroicons/react/outline'
import { FaUser,FaWarehouse,FaFileInvoice,FaEdit,FaMoneyBillWave,FaTimes} from 'react-icons/fa'
import { FaBox,FaInfoCircle,FaChevronLeft } from 'react-icons/fa'
import { useLocation,useNavigate } from 'react-router-dom'
export default function POS3({
    showHoldList,
    heldInvoices,selectedCustomer,selectedWarehouse,setSelectedWarehouse,setSelectedCustomer,handleDeleteInvoice,handleEditInvoice,
    allItems,filteredItems,warehouses,invoiceCode,customers,searchItemCode,setSearchItemCode,addItem,startScanner,scanning,videoRef,codeReaderRef,
    setScanning,orderPaymentMode,items,updateItem,removeItem,onHold,previousBalance,buttonStyles,onOpenModal,quantity,totalAmount,totalDiscount,couponCode,setCouponCode,
    isPaymentModalOpen,setIsPaymentModalOpen,PaymentModal,paymentMode,paymentTypes,accounts,terminals,buildPayload,selectedAccount,advancePaymentAmount,paymentSummary,sendOrder,
    currentOrderId,setAdvancePaymentAmount,setSelectedAccount,setActiveTab,setAdjustAdvancePayment
}) {
  const location=useLocation()
  const navigate=useNavigate()
    const initialLocationRef = useRef(location);

  // Hardware back
  useEffect(() => {
    const backHandler = App.addListener('backButton', () => {
      setActiveTab('pos2');
    });

    return () => backHandler.remove();
  }, []);

  // Intercept swipe back or browser back
  useEffect(() => {
    const unblock = navigate((_, action) => {
      if (action === 'POP') {
        setActiveTab('pos2');
        return false; // Prevent actual navigation
      }
    });

    return unblock;
  }, [navigate]);
    const [selectedItem,setSelectedItem]=React.useState(null)

    
    
 return (
    <div className="min-h-screen ">
      {/* Held Invoices Drawer for Mobile */}
    {showHoldList && (
  <div className="fixed inset-0 z-50 flex items-end bg-black bg-opacity-50 md:items-center md:justify-end">
    {/* Slide-up panel for mobile, right-panel for tablet/desktop */}
    <div className="w-full md:w-96 bg-white rounded-t-2xl md:rounded-xl shadow-2xl p-4 max-h-[80vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-800">Held Invoices</h3>
        <button
          className="text-xl text-gray-500 hover:text-gray-700"
          // onClick={() => setShowHoldList(false)}
        >
          &times;
        </button>
      </div>

      {/* Invoice List */}
      {heldInvoices.length ? (
        heldInvoices.map((inv) => (
          <div
            key={inv._id}
            className="p-3 mb-3 bg-white border-l-4 shadow-sm border-cyan-500 rounded-xl"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-sm">
                <p className="font-semibold text-gray-800">
                  {inv.saleCode || inv.items?.[0]?.itemName || inv._id.slice(0, 6)}
                </p>
                {inv.items?.length > 1 && (
                  <p className="mt-1 text-xs text-gray-500">
                    +{inv.items.length - 1} more item{inv.items.length - 1 > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-1 text-sm">
                <button
                  onClick={() => handleEditInvoice(inv._id)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteInvoice(inv._id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="mt-6 text-sm text-center text-gray-500">No held invoices</p>
      )}
    </div>
  </div>
)}


      {/* Back Button */}
      <button onClick={() => setActiveTab('pos2')} className="fixed z-40 p-2 top-15 left-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
      </button>

      <div className="flex flex-col gap-6 p-4">
        {/* Invoice Info */}
        <div className="p-4 space-y-4 bg-white ">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoBlock label="Warehouse" value={warehouses.find(w => w._id === selectedWarehouse)?.warehouseName || 'NA'} />
            <InfoBlock label="Invoice #" value={invoiceCode} />
            <InfoBlock label="Customer" value={customers.find(c => c._id === selectedCustomer)?.customerName || 'NA'} />
            <InfoBlock label="Payment" value={orderPaymentMode ? orderPaymentMode[0].toUpperCase() + orderPaymentMode.slice(1) : 'None'} />
          </div>

          <div className='flex justify-end'>
            <button className='flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg bg-cyan-600 hover:bg-cyan-700' onClick={()=>setActiveTab("pos2")}>
              <FaPlus /> Add Item
            </button>
          </div>

          <ItemsTable items={items} updateItem={updateItem} removeItem={removeItem} setSelectedItem={setSelectedItem} />
          {selectedItem && (
  <ItemInfoPage 
  allItems={allItems}
    selectedItem={selectedItem}
    onClose={() => setSelectedItem(null)}
    onAddToInvoice={(item) => {
      // Your logic to add item to invoice
      setSelectedItem(null);
    }}
  />
)}
        </div>

        {/* Payment Buttons */}
        <div className="flex flex-wrap justify-between gap-4 p-4 bg-white">
          <ActionButton icon={<FaHandPaper />} label="Hold" className="bg-red-600 hover:bg-red-700" onClick={onHold} />
          <ActionButton icon={<FaLayerGroup />} label="Multiple" className="bg-blue-600 hover:bg-blue-700" onClick={() => onOpenModal('multiple')} />
          <ActionButton icon={<FaMoneyBill />} label="Cash" className="bg-green-600 hover:bg-green-700" onClick={() => onOpenModal('cash')} />
          <ActionButton icon={<FaCreditCard />} label="Bank" className="bg-purple-600 hover:bg-purple-700" onClick={() => onOpenModal('bank')} />
        </div>

        {/* Summary */}
        <div className="p-4 bg-white ">
          {[['Quantity:', quantity], ['Total Amount (₹):', totalAmount.toFixed(2)], ['Total Discount (₹):', totalDiscount.toFixed(2)], ['Grand Total (₹):', (totalAmount - totalDiscount).toFixed(2)]].map(([label, value]) => (
            <div key={label} className="flex justify-between mb-3 text-base text-gray-700">
              <span className="font-semibold">{label}</span>
              <span>{value}</span>
            </div>
          ))}

          <div className="mt-4">
            <label className="block mb-1 text-sm font-medium text-gray-700">Coupon Code</label>
            <input
              type="text"
              placeholder="Enter Coupon Code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="w-full p-3 border rounded-lg outline-none bg-gray-50 focus:ring-2 focus:ring-cyan-400"
            />
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && (
        <PaymentModal
          onClose={() => setIsPaymentModalOpen(false)}
          paymentMode={paymentMode}
          paymentTypes={paymentTypes}
          accounts={accounts}
          terminals={terminals}
          initialAdvance={advancePaymentAmount}
          initialAccount={selectedAccount}
          initialSummary={paymentSummary}
          selectedWarehouse={selectedWarehouse}
          onSubmit={({ paymentRows, couponCode, adjustAdvancePayment, advance, selectedAccount }) => {
            sendOrder(buildPayload({ status: 'Completed', payments: paymentRows, paymentMode }), currentOrderId ? 'put' : 'post', currentOrderId);
            setCouponCode(couponCode || '');
            setAdjustAdvancePayment(adjustAdvancePayment);
            setAdvancePaymentAmount(advance);
            setSelectedAccount(selectedAccount);
          }}
        />
      )}
    </div>
);
}


const InfoBlock = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-semibold text-gray-800 truncate">{value}</p>
  </div>
);

const ActionButton = ({ icon, label, className, onClick }) => (
  <button
    onClick={onClick}
    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-lg ${className}`}
  >
    {icon} {label}
  </button>
);


const ItemsTable = ({ items, updateItem, removeItem, setSelectedItem }) => (
  <div className="relative space-y-3 overflow-y-auto max-h-56">
    {items.length > 0 ? (
      <div className="overflow-hidden border border-gray-200 divide-y divide-gray-200 rounded-lg">
        {items.map((item, index) => (
          <div key={index} className="p-3 transition-colors bg-white hover:bg-gray-50">
            <div className="flex items-start justify-between">
              {/* Item Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 mr-3 bg-gray-100 rounded-md">
                    <FaBox className="text-lg text-gray-400" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.itemName}</p>
                    {item.sku && (
                      <p className="text-xs text-gray-500 truncate">SKU: {item.sku}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quantity Control */}
              <div className="flex-shrink-0 ml-2">
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    className="block w-20 px-3 py-1 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-cyan-500 focus:border-cyan-500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <span className="text-xs text-gray-500">Qty</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end mt-2 space-x-2">
              <button 
                onClick={() => setSelectedItem(item)}
                className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-cyan-700 bg-cyan-50 rounded hover:bg-cyan-100"
              >
                <FaInfoCircle className="mr-1" /> Details
              </button>
              <button
                onClick={() => removeItem(index)}
                className="p-2 text-gray-400 rounded-full hover:text-red-500 hover:bg-red-50"
                aria-label="Remove item"
              >
                <FaTrash className="text-sm" />
              </button>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="p-6 text-center border-2 border-gray-300 border-dashed rounded-lg">
        <FaBoxOpen className="w-12 h-12 mx-auto text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No items</h3>
        <p className="mt-1 text-sm text-gray-500">Add items to create an invoice</p>
      </div>
    )}

    {items.length > 0 && (
      <div className="px-3 py-2 text-center rounded-lg bg-gray-50">
        <p className="text-sm text-gray-700">
          {items.length} item{items.length !== 1 ? 's' : ''} in this invoice
        </p>
      </div>
    )}
  </div>
);

const ItemInfoPage = ({ selectedItem, onClose, onAddToInvoice ,allItems}) => {
  const itemexist=allItems.find(it=>it._id===selectedItem.item)
  console.log(itemexist)
  if (!selectedItem) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
        <button 
          onClick={onClose}
          className="p-1 text-gray-500 rounded-full hover:bg-gray-100"
        >
          <FaChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800">Item Details</h2>
        <div className="w-5"></div> {/* Spacer for alignment */}
      </div>

      {/* Item Content */}
      <div className="p-4 space-y-6">
        {/* Item Header */}
        <div className="flex items-start gap-4 p-4 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-center flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg">
            {itemexist.image ? (
              <img 
                src={selectedItem.image} 
                alt={selectedItem.itemName}
                className="object-contain w-full h-full rounded-lg"
              />
            ) : (
              <FaBox className="text-2xl text-gray-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{itemexist.itemName}</h3>
            <p className="text-sm text-gray-500">SKU: {itemexist.sku || 'N/A'}</p>
            <p className="mt-1 text-sm font-semibold text-cyan-600">
              ₹{itemexist.salesPrice?.toFixed(2) || '0.00'}
            </p>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-4 bg-white rounded-lg shadow-sm">
          <h3 className="mb-3 text-base font-semibold text-gray-800">Details</h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow label="Category" value={itemexist.category?.name || 'N/A'} />
            <InfoRow label="Brand" value={itemexist.brand?.brandName || 'N/A'} />
            <InfoRow label="Barcode" value={itemexist.barcode || 'N/A'} />
            <InfoRow label="Stock" value={itemexist.openingStock || '0'} />
          </div>

          {selectedItem.description && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-500">Description</h4>
              <p className="mt-1 text-sm text-gray-700">{selectedItem.description}</p>
            </div>
          )}
        </div>

        {/* Variants (if any) */}
        {selectedItem.variants?.length > 0 && (
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <h3 className="mb-3 text-base font-semibold text-gray-800">Variants</h3>
            <div className="space-y-2">
              {selectedItem.variants.map((variant, index) => (
                <div key={index} className="p-2 border rounded-lg">
                  <p className="font-medium">{variant.name}</p>
                  <p className="text-sm text-gray-500">Price: ₹{variant.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-500">Stock: {variant.stock}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Action Button */}
      <div className="sticky bottom-0 p-4 bg-white border-t border-gray-200">
        <button
          onClick={() => onAddToInvoice(selectedItem)}
          className="flex items-center justify-center w-full gap-2 px-4 py-3 text-white rounded-lg bg-cyan-600 hover:bg-cyan-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

// Helper component for info rows
const InfoRow = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-medium text-gray-800">{value}</p>
  </div>
);
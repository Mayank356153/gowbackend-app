import React,{useState,useEffect,useRef} from 'react'
import dayjs from 'dayjs';
import { Select } from 'antd';
import { FaTrashAlt,FaBoxOpen,FaInfoCircle } from 'react-icons/fa';
import { FaChevronLeft,FaPlus,FaTrash,FaMinus,FaTimes ,FaBox} from 'react-icons/fa';
import { useLocation,useNavigate } from 'react-router-dom'
import {App} from '@capacitor/app'
export default function Purchase3({setActiveTab,allItems,
    options,formData,handleItemFieldChange,setFormData,handleRemoveItem,handleChange,setOtherCharges,discount,setDiscount,setDiscountType,discountType,subtotal,discountMoney,
    grandtotal,handlePayment,handlePaymentSelect,isCash,cashAccounts,isBank,id,navigate,items,updateItem,removeItem
}) {

 const location=useLocation()
    const initialLocationRef = useRef(location);

  // Hardware back
  useEffect(() => {
    const backHandler = App.addListener('backButton', () => {
      setActiveTab('p2');
    });

    return () => backHandler.remove();
  }, []);

  // Intercept swipe back or browser back
  useEffect(() => {
    const unblock = navigate((_, action) => {
      if (action === 'POP') {
        setActiveTab('p2');
        return false; // Prevent actual navigation
      }
    });

    return unblock;
  }, [navigate]);
  
    const [selectedItem, setSelectedItem] = useState(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    
    const handleViewInfo = (item) => {
      setSelectedItem(item);
      setShowInfoModal(true);
    };
    console.log(formData)
                          console.log(options.warehouse.find(opt => opt.value === formData.warehouse))

  return (
   <div className="min-h-screen bg-gray-50">
  {/* Header */}
  <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
    <div className="flex items-center justify-between">
      <button type="button"
        onClick={() => navigate(-1)}
        className="p-1 text-gray-600 rounded-full hover:bg-gray-100"
      >
        <FaChevronLeft className="w-5 h-5" />
      </button>
      <h1 className="text-lg font-bold text-gray-800">
        {id ? "Edit Purchase" : "New Purchase"}
      </h1>
      <div className="w-6"></div> {/* Spacer */}
    </div>
  </div>

  <div className="p-4 space-y-6">
    {/* Summary Card */}
   

       <div className="p-4 space-y-4 bg-white ">
              <div className="grid grid-cols-2 gap-4 text-sm">
               <InfoField label="Warehouse" value={options.warehouse.find(opt => opt.value === formData.warehouse)?.label} required />
        <InfoField label="Supplier" value={options.suppliers.find(opt => opt.value === formData.supplier)?.label} required />
        <InfoField label="Reference No." value={formData.referenceNo} />
        <InfoField label="Purchase Date" value={formData.purchaseDate ? dayjs(formData.purchaseDate).format("DD/MM/YYYY") : ""} />
              </div>
    
              <div className='flex justify-end'>
                <button className='flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg bg-cyan-600 hover:bg-cyan-700' onClick={()=>setActiveTab("p2")} type="button">
                  <FaPlus /> Add Item
                </button>
              </div>
    
              <ItemsTable items={items} updateItem={updateItem} removeItem={removeItem} setSelectedItem={setSelectedItem} />
              {selectedItem && (
      <ItemInfoPage 
      allItems={options.items}
        selectedItem={selectedItem}
        onClose={() => setSelectedItem(null)}
        onAddToInvoice={(item) => {
          // Your logic to add item to invoice
          setSelectedItem(null);
        }}
      />
    )}
            </div>

 

    {/* Charges & Totals */}
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-gray-800">Pricing</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Subtotal</span>
          <span className="text-sm font-medium">₹{subtotal?.toFixed(2)}</span>
        </div>
        
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-gray-600">Other Charges</label>
          <input
            type="number"
            min="0"
            name="otherCharges"
            value={formData.otherCharges}
            onChange={(e) => { handleChange(e); setOtherCharges(e.target.value); }}
            className="w-full p-2 text-sm border border-gray-300 rounded-md"
            placeholder="Enter other charges"
          />
        </div>
        
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-gray-600">Discount</label>
          <div className="flex space-x-2">
            <input
              type="number"
              min="0"
              name="discountOnAll"
              value={discount}
              onChange={(e) => { handleChange(e); setDiscount(e.target.value); }}
              className="flex-1 p-2 text-sm border border-gray-300 rounded-md"
              placeholder="Enter discount"
            />
            <select
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="w-24 p-2 text-sm border border-gray-300 rounded-md"
            >
              <option value="percent">%</option>
              <option value="amount">₹</option>
            </select>
          </div>
        </div>
        
        <div className="pt-2 mt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-800">Grand Total</span>
            <span className="text-lg font-bold text-purple-600">₹{grandtotal?.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>

    {/* Notes */}
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h2 className="mb-2 text-base font-semibold text-gray-800">Notes</h2>
      <textarea
        value={formData.note}
        name="note"
        onChange={handleChange}
        className="w-full p-3 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
        rows="3"
        placeholder="Add any additional notes..."
      />
    </div>

    {/* Payment Section */}
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h2 className="mb-3 text-base font-semibold text-gray-800">Payment</h2>
      
      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-gray-600">Amount <span className="text-red-500">*</span></label>
          <input
            type="number"
            min="0"
            value={formData.payments[0]?.amount}
            name="amount"
            onChange={handlePayment}
            className="w-full p-2 text-sm border border-gray-300 rounded-md"
            placeholder="Enter amount"
          />
        </div>
        
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-gray-600">Payment Type <span className="text-red-500">*</span></label>
          <Select
            options={options.paymentType}
            onChange={(o) => {
              handlePaymentSelect("paymentType")(o);
              setFormData((prev) => ({
                ...prev,
                payments: [{
                  ...prev.payments[0],
                  account: null,
                  terminal: null,
                }],
              }));
            }}
            value={options.paymentType.find(opt => opt.value === (formData.payments[0]?.paymentType?._id || formData.payments[0]?.paymentType)) || null}
            placeholder="Select payment type"
            className="basic-select"
            classNamePrefix="select"
          />
        </div>
        
        {true && (
          <div className="flex flex-col space-y-2">
            <label className="text-sm text-gray-600">Account</label>
            <Select
              options={cashAccounts}
              onChange={handlePaymentSelect("account")}
              value={cashAccounts.find(opt => opt.value === formData.payments[0]?.account) || null}
              placeholder="Select account"
              className="basic-select"
              classNamePrefix="select"
            />
          </div>
        )}
        
        {true && (
          <div className="flex flex-col space-y-2">
            <label className="text-sm text-gray-600">Terminal</label>
            <Select
              options={options.terminals.filter(t => t.warehouse === formData.warehouse)}
              onChange={handlePaymentSelect("terminal")}
              value={options.terminals.find(opt => opt.value === formData.payments[0]?.terminal) || null}
              placeholder="Select terminal"
              className="basic-select"
              classNamePrefix="select"
            />
          </div>
        )}
        
        <div className="flex flex-col space-y-2">
          <label className="text-sm text-gray-600">Payment Note</label>
          <textarea
            name="paymentNote"
            value={formData.payments[0]?.paymentNote}
            onChange={handlePayment}
            className="w-full p-2 text-sm border border-gray-300 rounded-md"
            rows="2"
            placeholder="Add payment note"
          />
        </div>
      </div>
    </div>

    {/* Action Buttons */}
    <div className="sticky bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 shadow-lg">
      <div className="flex space-x-3">
        <button
          onClick={() => navigate("/purchase-list")}
          className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-3 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
        >
          {id ? "Update Purchase" : "Submit Purchase"}
        </button>
      </div>
    </div>
  </div>

  {/* Item Info Modal */}
  {showInfoModal && selectedItem && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-40">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">Item Details</h2>
          <button 
            onClick={() => setShowInfoModal(false)} type="button"
            className="p-1 text-gray-400 rounded-full hover:bg-gray-100"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-3 text-sm">
          <InfoRow label="Name" value={selectedItem.itemName} />
          <InfoRow label="Code" value={selectedItem.itemCode || "N/A"} />
          <InfoRow label="MRP" value={`₹${selectedItem.mrp}`} />
          <InfoRow label="Sales Price" value={`₹${selectedItem.salesPrice}`} />
          <InfoRow label="Current Stock" value={selectedItem.currentStock || selectedItem.openingStock || "N/A"} />
        </div>
      </div>
    </div>
  )}
</div>

  )
}

// Helper Components
const InfoField = ({ label, value, required = false }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-semibold text-gray-800 truncate">{value}</p>
  </div>
);

const InfoRow = ({ label, value }) => (
 <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-medium text-gray-800">{value}</p>
  </div>
);

const ItemInfoPage = ({ selectedItem, onClose, onAddToInvoice ,allItems}) => {
  const itemexist=allItems.find(it=>it._id===selectedItem.item)
  console.log("kjh")
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
            <InfoRow label="Barcode" value={itemexist.barcode || itemexist.barcodes[0] || 'N/A'} />
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
          onClick={() => onAddToInvoice(selectedItem)} type="button"
          className="flex items-center justify-center w-full gap-2 px-4 py-3 text-white rounded-lg bg-cyan-600 hover:bg-cyan-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};



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
                onClick={() => setSelectedItem(item)} type="button"
                className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-cyan-700 bg-cyan-50 rounded hover:bg-cyan-100"
              >
                <FaInfoCircle className="mr-1" /> Details
              </button>
              <button
                onClick={() => removeItem(index)} type="button"
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

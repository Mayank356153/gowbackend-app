import React,{useState,useEffect,useRef} from 'react'
import { FaChevronLeft,FaPlus,FaBox,FaBoxOpen,FaTrash,FaInfoCircle } from 'react-icons/fa';
import { useLocation,useNavigate } from 'react-router-dom'
import {App} from '@capacitor/app'
export default function S3({
     formData,
     setActiveTab,
  setFormData,
  selectedItems,
  setSelectedItems,
  handleItemChange,
  handleRemoveItem,
  warehouses,
  id,
  navigate,allItems
}) {
   const location=useLocation()
      const initialLocationRef = useRef(location);
  
    // Hardware back
    useEffect(() => {
      const backHandler = App.addListener('backButton', () => {
        setActiveTab('s2');
      });
  
      return () => backHandler.remove();
    }, []);
  
    // Intercept swipe back or browser back
    useEffect(() => {
      const unblock = navigate((_, action) => {
        if (action === 'POP') {
          setActiveTab('s2');
          return false; // Prevent actual navigation
        }
      });
  
      return unblock;
    }, [navigate]);
    const [selectedItem, setSelectedItem] = useState(null);
        const [showInfoModal, setShowInfoModal] = useState(false);
        
        const handleViewInfo = (item) => {
            console.log(item)
            
          setSelectedItem(allItems.find(it=> it._id===item.itemId));
          setShowInfoModal(true);
        };
        
         const handleQuanity=(id,type)=>{
    const itemformat=selectedItems.map(item=>
      (item.itemId===id)?{
        ...item,
        quantity:type==="plus"?item.quantity+1:item.quantity-1
      }:item
    )
    // setItems(itemformat)
    setSelectedItems(itemformat.filter(it=>it.quantity!==0))
  }
  return (
 <div>
  
  <div className="sticky top-0 z-10 bg-white">
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
  

<div className="p-4 space-y-4 bg-white ">
              <div className="grid grid-cols-2 gap-4 text-sm">
               <InfoField label="Transfer Date" value={formData.transferDate}  />
        <InfoField label="From Warehouse" value={warehouses.find(wr => wr._id === formData.fromWarehouse)?.warehouseName || "Not Selected"} required />
        <InfoField label="To Warehouse" value={warehouses.find(wr => wr._id === formData.toWarehouse)?.warehouseName || "Not Selected"} />
        <InfoField label="Details" value={formData.details || "—"} />
        <InfoField label="Note" value={formData.note || "—"} />
              </div>
    
              <div className='flex justify-end'>
                <button className='flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg bg-cyan-600 hover:bg-cyan-700' onClick={()=>setActiveTab("s2")} type="button">
                  <FaPlus /> Add Item
                </button>
              </div>
    
              <ItemsTable items={selectedItems} updateItem={handleQuanity} removeItem={handleRemoveItem} setSelectedItem={setSelectedItem} />
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
  {/* Info Modal */}
  {showInfoModal && selectedItem && (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black bg-opacity-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">Item Information</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li><strong>Name:</strong> {selectedItem.itemName}</li>
          <li><strong>Code:</strong> {selectedItem.itemCode || "N/A"}</li>
          <li><strong>MRP:</strong> ₹{selectedItem.mrp}</li>
          <li><strong>Sales Price:</strong> ₹{selectedItem.salesPrice}</li>
          <li><strong>Stock:</strong> {selectedItem.currentStock || selectedItem.openingStock || "N/A"}</li>
        </ul>
        <div className="mt-6 text-right">
          <button
            onClick={() => setShowInfoModal(false)}
            className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Submit + Cancel Buttons */}
  <div className="flex flex-col justify-center gap-3 mt-8 sm:flex-row sm:justify-end">
    <button
      type="submit"
      className="px-6 py-2 text-white rounded shadow bg-cyan-500 hover:bg-cyan-600"
    >
      {id ? "Update" : "Save"}
    </button>
    <button
      type="button"
      onClick={() => navigate("/transfer-list")}
      className="px-6 py-2 text-white bg-gray-400 rounded shadow hover:bg-gray-500"
    >
      Cancel
    </button>
  </div>
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
  console.log(selectedItem)
  const itemexist=allItems.find(it=>it._id===selectedItem.itemId)
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

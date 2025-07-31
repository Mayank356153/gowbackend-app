import React ,{useState,useEffect,useRef}from 'react'
import { FaBarcode } from 'react-icons/fa';
import { CameraIcon } from '@heroicons/react/solid';
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  FaArrowLeft,
  FaSearch,
  FaPlus,
  FaQrcode,
  FaChevronDown,
  FaEllipsisV,FaMinus
} from "react-icons/fa";
import PurchaseScanner from './PurchaseScanner';
import dayjs from 'dayjs';
import { FaTrashAlt} from 'react-icons/fa';
import { App } from "@capacitor/app";
import { useLocation,useNavigate } from 'react-router-dom'
import Swal from "sweetalert2"
export default function Purchase2({
    filteredItems,stopScanner,addItemsInBatch,
    allItems,matchedItems,setMatchedItems,setActiveTab,removeItem,updateItem,
    startScanner,result,setResult,formData,setFormData,addItem,handleAddItem,handleItemFieldChange,handleRemoveItem,scanning,setScanning,videoRef,codeReaderRef,options,items,selectedWarehouse
}) {
  
     const confirmBack = async () => {
        const result = await Swal.fire({
          title: "Go Back?",
          text: "Going back will remove all added items. Do you want to proceed?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Yes, go back",
          cancelButtonText: "Cancel",
          reverseButtons: true,
          focusCancel: true,
        });
    
        if (result.isConfirmed) {
        setFormData((prev)=>({...prev,items:[]}))
          setActiveTab("p1");
        } else {
          navigate(0);
        }
      };
       const location=useLocation()
          const navigate=useNavigate()
            const initialLocationRef = useRef(location);
        
          // Hardware back
          useEffect(() => {
            const backHandler = App.addListener('backButton', () => {
              confirmBack()
            });
        
            return () => backHandler.remove();
          }, []);
        
          // Intercept swipe back or browser back
          useEffect(() => {
            const unblock = navigate((_, action) => {
              if (action === 'POP') {
      confirmBack();
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

     const[itemScan,setItemScan]=useState(false)
     
  const handleQuanity=(id,type)=>{
    const itemformat=items.map(item=>
      (item.item===id)?{
        ...item,
        quantity:type==="plus"?item.quantity+1:item.quantity-1
      }:item
    )
    // setItems(itemformat)
    setFormData((prev)=>({...prev,items:itemformat.filter(it=>it.quantity!==0)}))
  }
  if(itemScan) return <PurchaseScanner addItemsInBatch={addItemsInBatch} startScanner={startScanner} matchedItems={matchedItems} setMatchedItems={setMatchedItems} stopScanner={stopScanner} allItems={allItems} handleQuanity={handleQuanity}  videoRef={videoRef}  addItem={addItem} setItemScan={setItemScan}/>
  return (
    
<div className="min-h-screen pb-24 bg-gray-50">
  {/* Header with Search */}
  <div className="sticky top-0 z-10 ">
    <div className="flex items-center pt-2 space-x-3">
      <button 
        onClick={() => setActiveTab("p1")}
        className="p-2 text-gray-600 rounded-full hover:bg-gray-100"
      >
        <FaArrowLeft className="w-5 h-5" />
      </button>
      
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <FaSearch className="text-gray-400" />
        </div>
        <input
          type="text"
          value={result}
          onChange={(e) => {
            const val = e.target.value;
            setResult(val);
            const hit = allItems.find((i) => i.barcodes?.includes(val));
            if (hit) {
              addItem(hit);
              setResult("");
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && filteredItems[0]) {
              addItem(filteredItems[0]);
              setResult("");
            }
          }}
          className="w-full py-2.5 pl-10 pr-4 text-sm text-gray-900 bg-white border-0 rounded-full focus:ring-2 focus:ring-purple-500 focus:bg-white focus:outline-none transition-all"
          placeholder="Search items..."
        />
        <button 
          onClick={() => setItemScan(true)}
          className="absolute inset-y-0 right-0 flex items-center pr-3"
        >
          <FaQrcode className="text-purple-600" />
        </button>
      </div>
    </div>
  </div>

  {/* Search Results Dropdown */}
  
{result && filteredItems.length > 0 && (
  <div className="absolute z-40 w-[calc(100%-32px)] mx-4 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
    
    {/* Scrollable List */}
    <div className="max-h-[60vh] overflow-y-auto scroll-smooth custom-scrollbar">
      {filteredItems.map((it) => (
        <div
          key={it._id}
          className="flex items-center gap-3 px-4 py-3 transition-colors border-b border-gray-100 hover:bg-purple-50 active:bg-purple-100"
          onClick={() => addItem(it)}
        >
          {/* Icon */}
          <div className="flex items-center justify-center font-bold text-white shadow-sm w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500">
            {it.itemName?.charAt(0)?.toUpperCase()}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 truncate">{it.itemName}</h4>
              <span className="text-sm font-bold text-purple-600 whitespace-nowrap">₹{it.salesPrice}</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span className="px-2 py-0.5 text-purple-700 bg-purple-50 rounded-full font-mono">
                {it.itemCode}
              </span>
              <span
                className={`font-medium ${
                  it.currentStock > 10
                    ? "text-green-600"
                    : it.currentStock > 0
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {it.currentStock || 0} in stock
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Footer */}
    <div className="px-4 py-2.5 text-xs text-center text-gray-500 bg-gray-50 border-t border-gray-100">
      {filteredItems.length} item{filteredItems.length !== 1 && 's'} found
    </div>
  </div>
)}



  {/* Main Content */}
  <div className="p-4">

    {/* Items List */}
    <div className="space-y-3">
      {formData.items?.filter(item => item.quantity > 0).map((item, index) => {
        const it = allItems.find(i => i._id === item.item);
        if (!it) return null;

        return (
  <div
            key={it._id}
            className="relative p-4 transition-all bg-white border shadow-xs rounded-2xl border-gray-200/70 hover:shadow-sm"
          >
            {/* Floating Action Menu (Contextual) */}
            <div className="absolute flex gap-1 top-3 ">
              <button  type="button"
                onClick={() => handleQuanity(it._id, "remove")}
                className="p-1.5  text-gray-400 hover:text-red-500 rounded-full transition-colors"
              >
                <FaTrashAlt className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex gap-3">
              {/* Item Visual with Gradient */}
              <div className="relative flex-shrink-0">
                <div className="flex items-center justify-center w-12 h-12 text-lg font-bold text-white shadow-xs bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl">
                  {it.itemName?.charAt(0)?.toUpperCase() || "?"}
                </div>
                {it.currentStock <= 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    Out
                  </div>
                )}
              </div>

              {/* Item Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{it.itemName}</h3>
                  <span className="ml-1 text-sm font-bold text-purple-600 whitespace-nowrap">
                    ₹{(it.salesPrice * item.quantity).toFixed(2)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                  {it.description || "No description available"}
                </p>

                {/* Interactive Quantity Controls */}
                <div className="flex items-center justify-between mt-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${
                    it.currentStock > 10 ? "bg-green-50 text-green-700" :
                    it.currentStock > 0 ? "bg-yellow-50 text-yellow-700" :
                    "bg-red-50 text-red-700"
                  }`}>
                    {it.currentStock || 0} available
                  </span>

                  <div className="flex items-center gap-2 bg-gray-100/70 rounded-full p-0.5">
                    <button type='button'
                      onClick={() => handleQuanity(it._id, "minus")}
                      className="p-1.5 text-gray-600 hover:text-purple-600 rounded-full active:bg-gray-200 transition-colors"
                      disabled={item.quantity <= 0}
                    >
                      <FaMinus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-medium text-gray-800 min-w-[20px] text-center">
                      {item.quantity}
                    </span>
                    <button type='button'
                      onClick={() => handleQuanity(it._id, "plus")}
                      className="p-1.5 text-gray-600 hover:text-purple-600 rounded-full active:bg-gray-200 transition-colors"
                     
                    >
                      <FaPlus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Breakdown (Subtle) */}
            <div className="flex justify-end pt-2 mt-2 text-xs text-gray-500 border-t border-gray-100/70">
              <span>₹{it.salesPrice} × {item.quantity}</span>
            </div>
          </div>        );
      })}
    </div>
  </div>

  {/* Fixed Save Button */}
  <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg">
    <button
      onClick={() => setActiveTab("p3")}
      className="w-full py-3.5 text-base font-semibold text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors shadow-md"
    >
      Save Items
    </button>
  </div>
</div>





  )
}

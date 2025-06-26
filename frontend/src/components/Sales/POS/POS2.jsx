import {
  FaArrowLeft,
  FaSearch,
  FaPlus,
  FaQrcode,
  FaChevronDown,FaTimes,FaTrashAlt,
  FaEllipsisV,FaMinus
} from "react-icons/fa";
import Swal from "sweetalert2"
import POSScanner from "./POSScanner";
import { useState,useRef,useEffect } from "react";
import { App } from "@capacitor/app";
import { useLocation,useNavigate } from 'react-router-dom'
export default function POS2({
  searchItemCode,
  setSearchItemCode,
  allItems,
  filteredItems,
  addItem,
  items,
  setItems,
  setActiveTab,
  startScanner,
  videoRef,codeRedaerRef,
  matchedItems,setMatchedItems,
  stopScanner,canvasRef
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
    setItems([])
      setActiveTab("pos1");
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
    
  const[itemScan,setItemScan]=useState(false)
  const handleQuanity=(id,type)=>{
    if(type==="remove"){
      setItems(prev=> prev.filter(it => it.item!==id))
      return
    }
    const itemformat=items.map(item=>
      (item.item===id)?{
        ...item,
        quantity:type==="plus"?item.quantity+1:item.quantity-1
      }:item
    )
    setItems(itemformat)
  }
  if(itemScan) return <POSScanner canvasRef={canvasRef} startScanner={startScanner} matchedItems={matchedItems} setMatchedItems={setMatchedItems} stopScanner={stopScanner} allItems={allItems} handleQuanity={handleQuanity}  videoRef={videoRef} codeRedaerRef={codeRedaerRef} addItem={addItem} setItemScan={setItemScan}/>
  return (

    
<div className="relative min-h-screen bg-gray-50/50 pb-28">
  {/* Modern App Header with Glass Morphism */}
  <header className="sticky top-0 z-30 p-4 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
    <div className="flex items-center gap-3">
      <button 
        onClick={() => setActiveTab("pos1")}
        className="p-2 transition-all rounded-xl active:bg-gray-100 active:scale-95"
      >
        <FaArrowLeft className="text-xl text-gray-700" />
      </button>
      
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4">
          <FaSearch className="text-purple-500/80" />
        </div>
        <input
          type="text"
          value={searchItemCode}
           onChange={(e) => {
          const val = e.target.value.trim();
          setSearchItemCode(val);
          const hit = allItems.find((i) => i.barcodes?.includes(val));
          if (hit) {
            addItem(hit);
            setSearchItemCode("");
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && filteredItems[0]) {
            addItem(filteredItems[0]);
            setSearchItemCode("");
          }
        }}
          className="w-full py-3.5 pl-12 pr-11 text-sm bg-white rounded-xl shadow-xs border border-gray-200/80 focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-transparent placeholder:text-gray-400"
          placeholder="Search or scan items..."
        />
        <button 
          onClick={() => setItemScan(true)}
          className="absolute inset-y-0 right-0 flex items-center pr-4 active:scale-95"
        >
          <FaQrcode className="text-purple-500" />
        </button>
      </div>
    </div>
  </header>

  {/* Floating Search Results (Neumorphism Style) */}
  {searchItemCode && filteredItems.length > 0 && (
    <div className="absolute z-30 w-[calc(100%-32px)] mx-4 mt-2 bg-white rounded-2xl shadow-lg border border-gray-100/80 overflow-hidden">
      <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
        {filteredItems.map((it) => (
          <div
            key={it._id}
            className="p-3 transition-colors border-b border-gray-100 active:bg-purple-50/50 last:border-0"
            onClick={() => addItem(it)}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center flex-shrink-0 text-lg font-bold text-white shadow-xs w-11 h-11 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl">
                {it.itemName.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">{it.itemName}</h4>
                  <span className="ml-2 text-sm font-bold text-purple-600 whitespace-nowrap">
                    ₹{it.salesPrice}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                    {it.itemCode}
                  </span>
                  <span className={`text-xs ${
                    it.currentStock > 10 ? "text-green-500" : 
                    it.currentStock > 0 ? "text-yellow-500" : "text-red-500"
                  }`}>
                    {it.currentStock || 0} in stock
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 py-2.5 text-xs text-center text-gray-500 bg-gray-50/50 border-t border-gray-100">
        {filteredItems.length} item{filteredItems.length !== 1 && 's'} found
      </div>
    </div>
  )}

  {/* Main Content Area */}
  <main className="p-4">
    {/* Section Header with Micro-interactions */}
   

    {/* Modern Card Design with Hover Effects */}
    <div className="grid gap-3">
      {items.filter(i => i.quantity > 0).map((item) => {
        const it = allItems.find(i => i._id === item.item);
        if (!it) return null;

        return (
          <div
            key={it._id}
            className="relative p-4 transition-all bg-white border shadow-xs rounded-2xl border-gray-200/70 hover:shadow-sm"
          >
            {/* Floating Action Menu (Contextual) */}
            <div className="absolute flex gap-1 top-3 ">
              <button 
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
                    <button
                      onClick={() => handleQuanity(it._id, "minus")}
                      className="p-1.5 text-gray-600 hover:text-purple-600 rounded-full active:bg-gray-200 transition-colors"
                      disabled={item.quantity <= 0}
                    >
                      <FaMinus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-sm font-medium text-gray-800 min-w-[20px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuanity(it._id, "plus")}
                      className="p-1.5 text-gray-600 hover:text-purple-600 rounded-full active:bg-gray-200 transition-colors"
                      disabled={it.currentStock <= item.quantity}
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
          </div>
        );
      })}
    </div>
  </main>

  {/* Modern Floating Action Button (Sticky) */}
  <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white/90 to-transparent backdrop-blur-sm">
    <button
      onClick={() => setActiveTab("pos3")}
      disabled={items.filter(i => i.quantity > 0).length === 0}
      className={`w-full py-4 px-6 text-sm font-bold text-white rounded-xl shadow-lg transition-all ${
        items.filter(i => i.quantity > 0).length === 0 
          ? "bg-gray-300 cursor-not-allowed" 
          : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-md active:scale-[0.98]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span>Proceed to Payment</span>
        <span className="bg-white/20 px-2.5 py-1 rounded-lg text-xs">
          {items.reduce((sum, item) => sum + (item.quantity || 0), 0)} items
        </span>
      </div>
    </button>
  </div>
</div>


  );
}

import { BrowserMultiFormatReader } from '@zxing/browser';
import { useRef, useEffect,useState } from 'react';
import { FaPlus,FaMinus,FaEllipsisV ,FaSave} from 'react-icons/fa';
const PurchaseScanner = ({
  startScanner,videoRef,codeReaderRef,allItems,addItem,setItemScan,matchedItems,setMatchedItems,stopScanner
}) => {
 
const handleQuanity=(id,type)=>{
    const itemformat=matchedItems.map(item=>
      (item.item===id)?{
        ...item,
        quantity:type==="plus"?item.quantity+1:item.quantity-1
      }:item
    )
    setMatchedItems(itemformat)
  }

const handleSave=()=>{
  if(matchedItems.length<=0){
    alert("At least one item is required")
    return
  }
  matchedItems.forEach(item=>
    addItem(item)
  )
  setItemScan(false)
}
 
 useEffect(() => {
  startScanner();

  // Cleanup on unmount
  return () => {
    stopScanner();
  };
}, []);

  return (
 <>
  <div className="relative p-4 bg-black">
    <div className="relative overflow-hidden rounded-xl">
      
       <button 
      onClick={()=>setItemScan(false)} // Your back handler function
      className="absolute z-10 p-2 text-white transition-all rounded-full top-3 left-3 bg-black/80 hover:bg-black/90 backdrop-blur-sm"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
      </svg>
    </button>
      {/* Camera Feed */}
      <video
        ref={videoRef}
        className="w-full h-[300px] bg-black object-cover"
        autoPlay
        muted
        playsInline
      />
      
      {/* Scan Line with Gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-full h-[3px] bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-lg shadow-green-400/30 animate-scan"></div>
      </div>
      
      {/* Scanning Indicator */}
     
    </div>
  </div>

  {/* Scanned Items List */}
  <div className="px-4 mt-4 space-y-3">
    {matchedItems.filter(item => item.quantity > 0).map((item, index) => {
      const it = allItems.find(i => i._id === item.item);
      
      return (
        <div
          key={`${it._id}-${index}`}
          className="relative p-4 transition-all duration-200 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-purple-100 group"
        >
          {/* Floating Menu Button */}
          <button 
            className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              // Add menu functionality here
            }}
          >
            <FaEllipsisV className="w-3.5 h-3.5" />
          </button>
          
          <div className="flex items-start gap-3">
            {/* Avatar with subtle shadow */}
            <div className="flex items-center justify-center flex-shrink-0 font-bold text-white rounded-lg shadow-sm w-11 h-11 bg-gradient-to-br from-purple-500 to-indigo-600">
              {it.itemName?.charAt(0)?.toUpperCase() || "?"}
            </div>
            
            {/* Item Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-base font-semibold text-gray-900 truncate">
                  {it.itemName}
                </h3>
                <span className="text-sm font-bold text-purple-600 whitespace-nowrap">
                  ₹{it.salesPrice}
                </span>
              </div>
              
              {it.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                  {it.description}
                </p>
              )}
              
              {/* Stock and Quantity Controls */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    it.currentStock > 10 
                      ? "bg-green-50 text-green-700 border border-green-100" 
                      : it.currentStock > 0 
                        ? "bg-yellow-50 text-yellow-700 border border-yellow-100" 
                        : "bg-red-50 text-red-700 border border-red-100"
                  }`}>
                    {it.currentStock || "0"} in stock
                  </span>
                  <span className="text-xs text-gray-400">
                    {it.unit || "unit"}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 bg-gray-50 rounded-full p-0.5">
                  <button 
                    className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-100 rounded-full transition-colors disabled:opacity-40"
                    onClick={() => handleQuanity(it._id, "minus")}
                    disabled={item.quantity <= 1}
                  >
                    <FaMinus className="w-3 h-3" />
                  </button>
                  <span className="px-2 text-sm font-medium text-gray-700 min-w-[20px] text-center">
                    {item.quantity}
                  </span>
                  <button 
                    className="p-1.5 text-gray-500 hover:text-purple-600 hover:bg-purple-100 rounded-full transition-colors"
                    onClick={() => handleQuanity(it._id, "plus")}
                  >
                    <FaPlus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    })}
     <div className="fixed bottom-0 left-0 right-0 p-4 bg-opacity-90">
    <button 
      className="flex items-center justify-center w-full py-3 font-medium text-white transition-colors duration-200 bg-green-500 rounded-lg hover:bg-green-600" type="button"
      onClick={() => {
        // Handle save action here
        handleSave()
        console.log("Saving scanned items");
      }}
    >
      <FaSave className="mr-2" />
      Save Scanned Items
    </button>
  </div>
  </div>
  
  </>
 


  );
};

export default PurchaseScanner;

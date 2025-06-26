import { BrowserMultiFormatReader } from '@zxing/browser';
import { useRef, useEffect,useState } from 'react';
import { FaPlus,FaMinus,FaEllipsisV ,FaSave,FaArrowLeft} from 'react-icons/fa';
const POSScanner = ({canvasRef,
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
  {/* 🔲 Scanner Section */}
  <div className="relative bg-black">
    {/* Back Button */}
    <button
      onClick={() => setItemScan(false)}
      className="absolute z-20 p-2 text-white transition rounded-full shadow-md top-4 left-4 bg-black/60 backdrop-blur-sm hover:bg-black/80"
    >
      <FaArrowLeft className="w-5 h-5" />
    </button>

    {/* 📷 Video Feed */}
    <div className="relative overflow-hidden rounded-b-3x ">
     <div id="camera-container" className="absolute top-0 left-0 z-0 w-full h-full" />
      <canvas ref={canvasRef} className="hidden" width={300} height={200} />
      {/* 🟩 Scan Line */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 w-full h-[3px] bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-md animate-scan" />
      </div>
    </div>
  </div>

  {/* 📝 Scanned Items */}
  <div className="px-4 py-5 space-y-4 bg-gradient-to-b from-white to-purple-50 min-h-[calc(100vh-280px-80px)]">
    {matchedItems.filter(item => item.quantity > 0).map((item, index) => {
      const it = allItems.find(i => i._id === item.item);

      return (
        <div
          key={`${it._id}-${index}`}
          className="relative p-4 transition-all bg-white border border-gray-100 shadow rounded-xl group"
        >
          {/* ⋮ Menu (optional) */}
          <button
            onClick={(e) => e.stopPropagation()}
            className="absolute p-2 text-gray-400 transition rounded-full opacity-0 top-3 right-3 hover:text-purple-600 hover:bg-purple-50 group-hover:opacity-100"
          >
            <FaEllipsisV className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            {/* 🟪 Icon */}
            <div className="flex items-center justify-center w-12 h-12 text-lg font-semibold text-white rounded-lg shadow-sm bg-gradient-to-br from-purple-500 to-indigo-600">
              {it.itemName?.[0]?.toUpperCase() || "?"}
            </div>

            {/* 📦 Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-semibold text-gray-900 truncate">
                  {it.itemName}
                </p>
                <span className="text-sm font-bold text-purple-600 whitespace-nowrap">
                  ₹{it.salesPrice}
                </span>
              </div>
              {it.description && (
                <p className="mt-1 text-sm text-gray-500 truncate">
                  {it.description}
                </p>
              )}

              {/* 📊 Stock & Quantity Controls */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className={`px-2 py-1 rounded-full font-medium border ${
                    it.currentStock > 10
                      ? "bg-green-50 text-green-700 border-green-200"
                      : it.currentStock > 0
                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                        : "bg-red-50 text-red-700 border-red-200"
                  }`}>
                    {it.currentStock || "0"} in stock
                  </span>
                  <span className="text-gray-400">{it.unit || "unit"}</span>
                </div>

                {/* ➖➕ Quantity */}
                <div className="flex items-center gap-1 px-1 py-1 rounded-full shadow-sm bg-gray-50">
                  <button
                    disabled={item.quantity <= 1}
                    onClick={() => handleQuanity(it._id, "minus")}
                    className="p-1.5 rounded-full text-gray-500 hover:bg-purple-100 hover:text-purple-600 transition disabled:opacity-40"
                  >
                    <FaMinus className="w-3 h-3" />
                  </button>
                  <span className="text-sm font-medium text-gray-800 min-w-[24px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => handleQuanity(it._id, "plus")}
                    className="p-1.5 rounded-full text-gray-500 hover:bg-purple-100 hover:text-purple-600 transition"
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
  </div>

  {/* ✅ Save Button (Floating) */}
  <div className="fixed z-50 bottom-4 left-4 right-4">
    <button
      onClick={handleSave}
      className="flex items-center justify-center w-full py-3 font-semibold text-white bg-green-500 rounded-full shadow-md hover:bg-green-600"
    >
      <FaSave className="mr-2" />
      Save Scanned Items
    </button>
  </div>
</>

 


  );
};

export default POSScanner;

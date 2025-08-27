import React,{useState,useEffect,useRef} from 'react'
import { App } from "@capacitor/app";
import { useLocation,useNavigate } from 'react-router-dom'
import { set } from 'date-fns';
export default function S1({
    formData,setFormData,warehouses,setActiveTab,setSecondWarehouseName
}) {
   const location=useLocation()
      const navigate=useNavigate()
        const initialLocationRef = useRef(location);
    
      // Hardware back
      useEffect(() => {
        const backHandler = App.addListener('backButton', () => {
          navigate("/dashboard")
        });
    
        return () => backHandler.remove();
      }, []);
    
      // Intercept swipe back or browser back
      useEffect(() => {
      const handlePopState = () => {
        // Whenever browser back is triggered
        navigate("/dashboard");
      };
  
      window.addEventListener("popstate", handlePopState);
  
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }, [navigate]);
  return (
   
 <>
  <div className="px-4 py-4 space-y-6 bg-white shadow-sm rounded-xl">

    {/* Header */}
    <div className="pb-2 text-lg font-semibold text-gray-800 border-b">Warehouse Transfer</div>

    {/* Transfer Date */}
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">Transfer Date</label>
      <input
        type="date"
        value={formData.transferDate}
        onChange={(e) => setFormData({ ...formData, transferDate: e.target.value })}
        className="w-full px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
        required
      />
    </div>

    {/* From & To Warehouses */}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">From Warehouse</label>
        <select
          value={formData.fromWarehouse}
          onChange={(e) => setFormData({ ...formData, fromWarehouse: e.target.value })}
          className="w-full px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select Warehouse</option>
          {warehouses.map((w) => (
            <option key={w._id} value={w._id}>{w.warehouseName}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">To Warehouse</label>
        <select
          value={formData.toWarehouse}
        
          onChange={(e)=>{
                setFormData({ ...formData, toWarehouse: e.target.value })
                setSecondWarehouseName(warehouses.find(w => w._id === e.target.value)?.warehouseName || "")
          }}
          className="w-full px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Select Warehouse</option>
          {warehouses.map((w) => (
            <option key={w._id} value={w._id}>{w.warehouseName}</option>
          ))}
        </select>
      </div>
    </div>

    {/* Details & Note */}
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Details</label>
        <input
          type="text"
          value={formData.details}
          onChange={(e) => setFormData({ ...formData, details: e.target.value })}
          className="w-full px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">Note</label>
        <input
          type="text"
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          className="w-full px-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    {/* Next Button */}
    <div className="flex justify-end">
      <button  type='button'
        onClick={() => setActiveTab("s2")}
        className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
      >
        Next
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </button>
    </div>

  </div>
</>

  )
}

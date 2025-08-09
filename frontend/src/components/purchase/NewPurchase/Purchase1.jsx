import React ,{useState,useEffect,useRef}from 'react'
import { Select } from 'antd'
import dayjs from 'dayjs'
import { FaFileInvoice } from 'react-icons/fa';
import { App } from "@capacitor/app";
import { useLocation,useNavigate } from 'react-router-dom'
import { FaPlus,FaChevronRight,FaCalendarAlt } from 'react-icons/fa';
export default function Purchase1({
    options,handleSelectChange,setActiveTab,sWarehouse,setSWarehouse
,formData,setShowSupplierPop,handleChange}) {

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
  
   React.useEffect(() => {
  // Auto-select if only one supplier
  if (options.suppliers.length === 1 && !formData.supplier) {
    const onlySupplier = options.suppliers[0];
    handleSelectChange(onlySupplier, "supplier");
  }

  // Auto-select if only one warehouse
  if (options.warehouse.length === 1 && !formData.warehouse) {
    const onlyWarehouse = options.warehouse[0];
    handleSelectChange(onlyWarehouse, "warehouse");
  }
}, [options.suppliers, options.warehouse, formData.supplier, formData.warehouse]);


  return (
    
 <div className="p-4 bg-white rounded-lg shadow-sm">
  {/* Header Section */}
  <div className="border-b border-gray-200 ">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-gray-800">New Purchase Order</h2>
        <p className="text-sm text-gray-500">Create a new inventory purchase</p>
      </div>
      <div className="flex items-center space-x-2">
        <span className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
          Draft
        </span>
      </div>
    </div>
  </div>

  {/* Form Section */}
  <div className="mt-6 space-y-6">
    {/* Warehouse Selection */}
    <div className="grid md:grid-cols-12">
      <div className="md:col-span-3">
        <label className="block text-sm font-medium text-gray-700">
          Warehouse <span className="text-red-500">*</span>
        </label>
        
      </div>
      <div className="md:col-span-9">
        <Select
          className="w-full max-w-md"
          options={options.warehouse}
          onChange={(option) => {
            setSWarehouse(option)
            handleSelectChange(option, "warehouse")
          }
        }
          value={options.warehouse.find(opt => opt.value === sWarehouse) || null}
          placeholder="Select Warehouse"
          styles={{
            control: (base) => ({
              ...base,
              minHeight: '42px',
              borderColor: '#d1d5db',
              '&:hover': {
                borderColor: '#9ca3af'
              }
            })
          }}
        />
      </div>
    </div>

    {/* Supplier Selection */}
    <div className="grid md:grid-cols-12">
      <div className="md:col-span-3">
        <label className="block text-sm font-medium text-gray-700">
          Supplier <span className="text-red-500">*</span>
        </label>
      </div>
      <div className="md:col-span-9">
        <div className="flex max-w-md space-x-2">
          <Select
            className="flex-1"
            options={options.suppliers}
            onChange={(o) => handleSelectChange(o, "supplier")}
            value={options.suppliers.find(opt => opt.value === formData.supplier) || null}
            placeholder="Select Supplier"
            styles={{
              control: (base) => ({
                ...base,
                minHeight: '42px',
                borderColor: '#d1d5db',
                '&:hover': {
                  borderColor: '#9ca3af'
                }
              })
            }}
          />
          <button
            onClick={() => setShowSupplierPop(true)}
            className="flex items-center justify-center w-10 h-10 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            title="Add new supplier"
          >
            <FaPlus />
          </button>
        </div>
      </div>
    </div>

    {/* Reference Number */}
    <div className="grid md:grid-cols-12">
      <div className="md:col-span-3">
        <label className="block text-sm font-medium text-gray-700">
          Reference No.
        </label>
      </div>
      <div className="md:col-span-9">
        <input
          type="text"
          name="referenceNo"
          value={formData.referenceNo}
          readOnly
          className="w-full max-w-md px-3 py-2 bg-gray-100 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="Auto-generated"
        />
      </div>
    </div>

    {/* Purchase Date */}
    <div className="grid md:grid-cols-12">
      <div className="md:col-span-3">
        <label className="block text-sm font-medium text-gray-700">
          Purchase Date
        </label>
        <p className="mt-1 text-xs text-gray-500">When the order was placed</p>
      </div>
      <div className="md:col-span-9">
       <div className="relative max-w-md">
  <input
    type="date"
    name="purchaseDate"
    onChange={handleChange}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
    required
    value={formData.purchaseDate ? dayjs(formData.purchaseDate).format("YYYY-MM-DD") : ""}
  />
  <FaCalendarAlt className="absolute right-3 top-2.5 text-gray-400" />
</div>

      </div>
    </div>
  </div>

  {/* Footer with Next Button */}
  <div className="flex justify-end pt-6 mt-6 border-t border-gray-200">
    <button
      onClick={() => setActiveTab("p2")}
      disabled={!formData.warehouse || !formData.supplier}
      className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm ${
        !formData.warehouse || !formData.supplier
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700'
      }`}
    >
      Next
      <FaChevronRight className="w-4 h-4 ml-2" />
    </button>
  </div>
</div>
  )
}

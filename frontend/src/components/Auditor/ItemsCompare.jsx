import React, { useState } from 'react';
import axios from "axios"
export default function ItemsCompare({ audit, onClose, sidebarOpen = true }) {
  const [items, setUpdateItems] = useState(audit.finalUnit);
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = (e, id) => {
    const { name, value } = e.target;
    const numericValue = Number(value);

    const updated = items.map((item) => {
      if (item.itemId === id) {
        const updatedItem = {
          ...item,
          [name]: numericValue,
        };
        updatedItem.difference=updatedItem.expectedQty-updatedItem.scannedQty
        return updatedItem;
      }
      return item;
    });

    setUpdateItems(updated);
    setIsDirty(true);
  };

  const handleSave =async () => {
             try {
                console.log(items)
            const response = await axios.put('http://localhost:5000/api/audit/update-quantity-db',{
                auditId:audit.auditId,
                finalUnit:items
            },{
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                  }});
            console.log(response);
           alert("Changes Save")
           onClose();
        } catch (error) {
            console.error("Error fetching warehouses:", error);
        }   
  };

  const handleClose = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Are you sure you want to close?')) {
      return;
    }
    onClose();
  };

  return (
    // <div className={`fixed inset-0 w-full h-full overflow-y-auto ${sidebarOpen && "pl-10"}`}>
    //   <div className="relative w-3/4 p-5 mx-auto bg-gray-300 border rounded-md shadow-lg top-20">
    //     <div className="flex items-center justify-between mb-4">
    //       <h3 className="text-lg font-medium leading-6 text-gray-900">Audit Items Comparison</h3>
    //       <button
    //         onClick={handleClose}
    //         className="text-gray-400 hover:text-gray-500"
    //       >
    //         <span className="sr-only">Close</span>
    //         <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    //           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    //         </svg>
    //       </button>
    //     </div>

    //     <div className="mb-4 overflow-x-auto">
    //       <table className="min-w-full divide-y divide-gray-200">
    //         <thead className="bg-gray-50">
    //           <tr>
    //             <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
    //               Item ID
    //             </th>
    //             <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
    //               Name
    //             </th>
    //             <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
    //               Scanned Qty
    //             </th>
    //             <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
    //               Expected Qty
    //             </th>
    //             <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
    //               Difference
    //             </th>
    //           </tr>
    //         </thead>
    //         <tbody className="bg-white divide-y divide-gray-200">
    //           {items.map((item) => (
    //             <tr key={item.itemId}>
    //               <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
    //                 {item.itemId}
    //               </td>
    //               <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
    //                 {item.itemName}
    //               </td>
    //               <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
    //                 {item.scannedQty}
    //               </td>
    //               <td className="px-6 py-4 text-sm whitespace-nowrap">
    //                 <input 
    //                   type="number" 
    //                   value={item.expectedQty}  
    //                   className='w-20 pl-2 border-2 rounded-md' 
    //                   onChange={(e) => handleChange(e, item.itemId)} 
    //                   name="expectedQty"
    //                   min="0"
    //                 />
    //               </td>
    //               <td className={`px-6 py-4 whitespace-nowrap text-sm ${
    //                 item.scannedQty >= item.expectedQty 
    //                   ? 'text-green-600' 
    //                   : 'text-red-600'
    //               }`}>
    //                 {item.scannedQty - item.expectedQty}
    //               </td>
    //             </tr>
    //           ))}
    //         </tbody>
    //       </table>
    //     </div>

    //     <div className="flex justify-end pt-4 space-x-4 border-t border-gray-200">
    //       <button
    //         onClick={handleClose}
    //         className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
    //       >
    //         Close
    //       </button>
    //       <button
    //         onClick={handleSave}
    //         disabled={!isDirty}
    //         className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    //           isDirty ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400 cursor-not-allowed'
    //         }`}
    //       >
    //         Save Changes
    //       </button>
    //     </div>
    //   </div>
    // </div>
    <div className={`fixed inset-0 w-full h-full overflow-y-auto ${sidebarOpen ? "pl-0 lg:pl-10" : ""}`}>
  <div className="relative w-full p-4 mx-auto bg-gray-300 border rounded-md shadow-lg lg:w-3/4 lg:p-5 top-4 lg:top-20">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium leading-6 text-gray-900">Audit Items Comparison</h3>
      <button
        onClick={handleClose}
        className="text-gray-400 hover:text-gray-500"
      >
        <span className="sr-only">Close</span>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    {/* Mobile View (Cards) */}
    <div className="mb-4 space-y-3 lg:hidden">
      {items.map((item) => (
        <div key={item.itemId} className="p-3 bg-white rounded-lg shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-gray-900">{item.itemName}</p>
              <p className="text-xs text-gray-500">ID: {item.itemId}</p>
            </div>
            <span className={`text-sm ${
              item.scannedQty >= item.expectedQty 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              Diff: {item.scannedQty - item.expectedQty}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block mb-1 text-xs text-gray-500">Scanned Qty</label>
              <div className="p-2 text-sm rounded bg-gray-50">
                {item.scannedQty}
              </div>
            </div>
            <div>
              <label className="block mb-1 text-xs text-gray-500">Expected Qty</label>
              <input 
                type="number" 
                value={item.expectedQty}  
                className="w-full p-2 text-sm border rounded-md" 
                onChange={(e) => handleChange(e, item.itemId)} 
                name="expectedQty"
                min="0"
              />
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Desktop View (Table) */}
    <div className="hidden mb-4 overflow-x-auto lg:block">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
              Item ID
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
              Name
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
              Scanned Qty
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
              Expected Qty
            </th>
            <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
              Difference
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.itemId}>
              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                {item.itemId}
              </td>
              <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                {item.itemName}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                {item.scannedQty}
              </td>
              <td className="px-6 py-4 text-sm whitespace-nowrap">
                <input 
                  type="number" 
                  value={item.expectedQty}  
                  className='w-20 pl-2 border-2 rounded-md' 
                  onChange={(e) => handleChange(e, item.itemId)} 
                  name="expectedQty"
                  min="0"
                />
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                item.scannedQty >= item.expectedQty 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {item.scannedQty - item.expectedQty}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {/* Action Buttons */}
    <div className="flex flex-col-reverse justify-end pt-4 space-y-3 space-y-reverse border-t border-gray-200 sm:flex-row sm:space-y-0 sm:space-x-4">
      <button
        onClick={handleClose}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
      >
        Close
      </button>
      <button
        onClick={handleSave}
        disabled={!isDirty}
        className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isDirty ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-400 cursor-not-allowed'
        }`}
      >
        Save Changes
      </button>
    </div>
  </div>
</div>
  );
}
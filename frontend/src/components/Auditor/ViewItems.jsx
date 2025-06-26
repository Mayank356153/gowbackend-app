import React, { useState } from 'react';
import axios from "axios"
export default function ViewItems({ audit, onClose, sidebarOpen = true }) {

  



 
  return (
    // <div className={`fixed inset-0 w-full h-full overflow-y-auto ${sidebarOpen && "pl-10"}`}>
    //   <div className="relative w-3/4 p-5 mx-auto bg-gray-300 border rounded-md shadow-lg top-20">
    //     <div className="flex items-center justify-between mb-4">
    //       <h3 className="text-lg font-medium leading-6 text-gray-900">Audit Items View</h3>
    //       <button
    //         onClick={onClose}
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
    //           {audit.finalUnit.map((item) => (
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
    //                  {item.expectedQty}  
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
    //   </div>
    // </div>
    <div className={`fixed inset-0 w-full h-full overflow-y-auto ${sidebarOpen && "lg:pl-10"}`}>
  <div className="relative w-full p-4 mx-auto bg-gray-300 border rounded-md shadow-lg lg:w-3/4 lg:p-5 top-4 lg:top-20">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium leading-6 text-gray-900">Audit Items View</h3>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-500"
      >
        <span className="sr-only">Close</span>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    {/* Mobile View (Cards) - Shows on small screens */}
    <div className="mb-4 space-y-3 lg:hidden">
      {audit.finalUnit.map((item) => (
        <div key={item.itemId} className="p-4 bg-white rounded-lg shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-gray-900">{item.itemName}</p>
              <p className="text-sm text-gray-500">ID: {item.itemId}</p>
            </div>
            <span className={`text-sm ${
              item.scannedQty >= item.expectedQty 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              Diff: {item.scannedQty - item.expectedQty}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <p className="text-xs text-gray-500">Scanned</p>
              <p className="text-sm">{item.scannedQty}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Expected</p>
              <p className="text-sm">{item.expectedQty}</p>
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Desktop View (Table) - Shows on larger screens */}
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
          {audit.finalUnit.map((item) => (
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
                {item.expectedQty}  
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
  </div>
</div>
  );
}
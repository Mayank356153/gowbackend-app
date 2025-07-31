import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import Select from 'react-select'; // Removed to fix build error
import axios, { all } from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // Removed to fix build error
import * as XLSX from 'xlsx';
import { BrowserMultiFormatReader } from '@zxing/library';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';
import autoTable from 'jspdf-autotable';
import { FixedSizeList as List } from 'react-window';
import ItemDetailsPopup from './ItemsView';
import { set } from 'date-fns';
import ClubStockView from './ClubStockView';
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const CameraIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path><circle cx="12" cy="13" r="3"></circle></svg>;
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;
const DownloadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;
const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
const ExcelIcon = () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const PdfIcon = () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
const CustomerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-500"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-500"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const CategoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-500"><path d="M2 16.1A5 5 0 0 1 5.9 20M2 12.05A9 9 0 0 1 9.95 20M2 8V2l6 .05"></path><path d="M22 8h-6"></path><path d="M16 2v6"></path><path d="M12.55 8.5A2.5 2.5 0 0 1 15.05 6"></path><path d="M12.55 13.5A2.5 2.5 0 0 1 15.05 11"></path><path d="M12.55 18.5A2.5 2.5 0 0 1 15.05 16"></path></svg>;

// --- Custom Hook for Debouncing input ---
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}


// --- Main Page Component ---
const ClubReportPage = () => {
    const link = "https://pos.inspiredgrow.in/vps";

    // State Management
    const [loading, setLoading] = useState(true);
    const [sales, setSales] = useState([]);
    const [returns, setReturns] = useState([]);
    const [stock,setStock]=useState([]);
    const [total, setTotal] = useState(0);
    const [pop,setPop]=useState(false);
    const[view,setView]=useState(false);
    
    // Filter States
    const [options, setOptions] = useState({ warehouses: [], categories: [], items: [] });
    const [selectedWarehouse, setSelectedWarehouse] = useState("all");
    const[selectedWarehouseName,setSelectedWarehouseName]=useState("All");
    const [category, setCategory] = useState("all");
    const [searchItem, setSearchItem] = useState("all");
    const [searchItemName, setSearchItemName] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [saleItems,setSaleItems] = useState([]); 
    const[report,setReport]=useState([]);
    const[finalReport,setFinalReport]=useState([]);  
    const[allItems,setAllItems]=useState([]);
    // UI States
    const [result, setResult] = useState(""); // For item search dropdown
    const [scanning, setScanning] = useState(false);
    const [showExportDropdown, setShowExportDropdown] = useState(false);
    const [filtersVisible, setFiltersVisible] = useState(false); // Filters collapsed by default on mobile
    const debouncedSearchTerm = useDebounce(searchItemName, 500); // 500ms delay
const [filteredTransfers, setFilteredTransfers] = useState([]);
const [selectedItem, setSelectedItem] = useState(null);
    // Refs
    const videoRef = useRef(null);
    const codeReaderRef = useRef(null);

/**
 * Calculates a daily stock report for a specific warehouse.
 * @param {object} data - An object containing arrays of transactions.
 * @param {string} currentWarehouseId - The ID of the warehouse to generate the report for.
 * @param {Map} itemDetailsMap - A map containing details for each item.
 * @returns {object} An object with the warehouse's daily stock movements.
 */
function generateFlatReport({ sales = [], saleReturns = [], stockTransfers = [] }, itemDetailsMap, warehouses) {

  const tempReport = {};
  const warehouseMap = new Map(warehouses.map(w => [w.value, w.label]));

  // Helper function to create a unique key for each item on a specific day in a specific warehouse.
  const getKey = (warehouseId, date, itemId) => `${warehouseId}-${date}-${itemId}`;

  // Process Sales
  sales.forEach(sale => {
    if (!sale.warehouse?._id) return;
    const day = sale.saleDate.substring(0, 10);
    const warehouseId = sale.warehouse._id;

    for (const lineItem of sale.items) {
      if (lineItem.item?._id) {
        const itemId = lineItem.item._id;
        const key = getKey(warehouseId, day, itemId);

        if (!tempReport[key]) {
          const details = itemDetailsMap.get(itemId) || {};
          tempReport[key] = {
            warehouseId,
            warehouseName: warehouseMap.get(warehouseId) || 'Unknown Warehouse',
            date: day,
            itemCode:details.itemCode,
            itemId,
            itemName: details.itemName || 'Unknown Item',
            categoryId: details.categoryId,
            categoryName: details.categoryName,
            mrp: details.mrp || 0,
            salesPrice: details.salesPrice,
            sale: 0, saleReturn: 0, stockTransferIn: 0, stockTransferOut: 0
          };
        }
        tempReport[key].sale += lineItem.quantity;
      }
    }
  });

  // Process Sale Returns
  saleReturns.forEach(saleReturn => {
    if (!saleReturn.warehouse) return;
    const day = saleReturn.returnDate.substring(0, 10);
    const warehouseId = saleReturn.warehouse._id;

    for (const lineItem of saleReturn.items) {
        if (lineItem.item) {
            const itemId = (lineItem.item._id || lineItem.item).toString();
            const key = getKey(warehouseId, day, itemId);
            if (!tempReport[key]) { /* This case is rare but possible if an item is only ever returned */ continue; }
            tempReport[key].saleReturn += lineItem.quantity;
        }
    }
  });

  // Process Stock Transfers
  stockTransfers.forEach(transfer => {
    const day = transfer.transferDate.substring(0, 10);
    for (const lineItem of transfer.items) {
        if (lineItem.item?._id) {
            const itemId = lineItem.item._id;
            // Process IN-transfer
            if (transfer.toWarehouse?._id) {
                const keyIn = getKey(transfer.toWarehouse._id, day, itemId);
                if (!tempReport[keyIn]) { continue; }
                tempReport[keyIn].stockTransferIn += lineItem.quantity;
            }
            // Process OUT-transfer
            if (transfer.fromWarehouse?._id) {
                const keyOut = getKey(transfer.fromWarehouse._id, day, itemId);
                if (!tempReport[keyOut]) { continue; }
                tempReport[keyOut].stockTransferOut += lineItem.quantity;
            }
        }
    }
  });

  // Convert the aggregated object into a flat array
  return Object.values(tempReport);
}



    // Initial data fetching
    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem("token");
                const headers = { Authorization: `Bearer ${token}` };

                const [warehousesRes, categoriesRes,  salesRes,stockRes,salesReturnRes] = await Promise.all([
                    axios.get(`${link}/api/warehouses`, { headers }),
                    axios.get(`${link}/api/categories`, { headers }),
                    axios.get(`${link}/api/pos/invoices`, { headers }),
                    axios.get(`${link}/api/stock-transfers`, { headers }),
                    axios.get(`${link}/api/sales-return`, { headers }),
                    // axios.get(`${link}/api/items`, { headers })
                ]);
                // setAllItems(itemRes.data.data);
                const warehouses = warehousesRes.data.data.map(w => ({ label: w.warehouseName, value: w._id ,restricted:w.isRestricted}));
                const categories = categoriesRes.data.data.map(c => ({ label: c.name, value: c._id }));
               
                setOptions({
                    warehouses: [{ label: "All", value: "all" }, ...warehouses],
                    categories: [{ label: "All", value: "all" }, ...categories],
                    
                });
                 setStock(stockRes.data.data);
                setSales(salesRes.data);
                setReturns(salesReturnRes.data.returns);
                setFilteredTransfers(salesRes.data);
              
            } catch (err) {
                console.error("Failed to fetch initial data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);


    useEffect(() => {
  
            // Step 1: Create a map of item details, now including category
            const itemDetailsMap = new Map();
          sales.forEach(sale => {
                sale.items.forEach(lineItem => {
                  if(lineItem.item===null) return;
                    if (lineItem.item && !itemDetailsMap.has(lineItem.item._id)) {
                        itemDetailsMap.set(lineItem.item._id, {
                          itemCode: lineItem.item.itemCode,
                            itemName: lineItem.item.itemName,
                            mrp: lineItem.item.mrp || 0,
                            categoryId: lineItem.item.category?._id,
                            categoryName: lineItem.item.category?.name,
                            salesPrice: lineItem.item.salesPrice,
                        });
                    }
                });
            });

            // Step 2: Call the new function to get the flat report
            const flatReport = generateFlatReport(
                { sales: sales, saleReturns: returns, stockTransfers: stock },
                itemDetailsMap,
                options.warehouses
            );

            
            setReport(flatReport);
            setFinalReport(flatReport);
           
    },[options, sales, returns,stock]);

    // Barcode Scanning Logic
              // useEffect(() => {
              //   if (!scanning) return;
            
              //   const startScanner = async () => {
              //     if (!videoRef.current) return;
            
              //     const codeReader = new BrowserMultiFormatReader();
              //     codeReaderRef.current = codeReader;
            
              //     const tryDecode = async (facingMode) => {
              //       const constraints = {
              //         video: {
              //           facingMode,
              //           advanced: [
              //             { width: 1920 },
              //             { height: 1080 },
              //             { zoom: 2 }, // not all devices support this
              //           ],
              //         },
              //       };
            
              //       return codeReader.decodeFromConstraints(
              //         constraints,
              //         videoRef.current,
              //         (result, error) => {
              //           if (result) {
              //             const text = result.getText();
              //             alert(text);
              //             setSearchItem(text)  
              //             window.navigator.vibrate?.(200);
              //             const beep = new Audio("/beep.mp3");
              //             beep.play();
            
              //             const stream = videoRef.current?.srcObject;
              //             stream?.getTracks().forEach((track) => track.stop());
            
              //             if (codeReaderRef.current?.reset && typeof codeReaderRef.current.reset === "function") {
              //               codeReaderRef.current.reset();
              //             }
            
              //             setScanning(false);
              //           }
            
              //           if (error && error.name !== "NotFoundException") {
              //             console.error("Scan error:", error);
              //           }
              //         }
              //       );
              //     };
            
              //     try {
              //       await tryDecode({ exact: "environment" });
              //     } catch (error) {
              //       if (error.name === "OverconstrainedError" || error.name === "NotFoundError") {
              //         console.warn("Back camera not found. Trying front camera...");
              //         try {
              //           await tryDecode("user");
              //         } catch (fallbackError) {
              //           console.error("Front camera also failed:", fallbackError);
              //           alert("No camera found or accessible.");
              //           setScanning(false);
              //         }
              //       } else {
              //         console.error("Camera access error:", error);
              //         alert("Camera access error: " + error.message);
              //         setScanning(false);
              //       }
              //     }
              //   };
            
              //   startScanner();
            
              //   return () => {
              //     const stream = videoRef.current?.srcObject;
              //     stream?.getTracks().forEach((track) => track.stop());
            
              //     if (codeReaderRef.current?.reset && typeof codeReaderRef.current.reset === "function") {
              //       codeReaderRef.current.reset();
              //     }
              //   };
              // }, [scanning]);

   const applyfilter = () => {
  const filterreport = report.filter((transfer) => {
    const warehouseMatch = selectedWarehouse === "all" || transfer.warehouseId === selectedWarehouse;
    const categoryMatch = category === "all" || transfer.categoryId === category;

    const dateObj = new Date(transfer.date);
    const fromDateObj = dateFrom ? new Date(dateFrom) : null;
    const toDateObj = dateTo ? new Date(dateTo) : null;

    const dateInRange =
      (!fromDateObj || dateObj >= fromDateObj) &&
      (!toDateObj || dateObj <= toDateObj);

    return warehouseMatch && categoryMatch && dateInRange;
  });

  // const filterSale = sales.filter((transfer) => {
  //   const warehouseMatch = selectedWarehouse === "all" || transfer.warehouse?._id === selectedWarehouse;

  //   const dateObj = new Date(transfer.saleDate);
  //   const fromDateObj = dateFrom ? new Date(dateFrom) : null;
  //   const toDateObj = dateTo ? new Date(dateTo) : null;

  //   const dateInRange =
  //     (!fromDateObj || dateObj >= fromDateObj) &&
  //     (!toDateObj || dateObj <= toDateObj);

  //   return warehouseMatch && dateInRange;
  // });

  // setFilteredTransfers(filterSale);
  setFinalReport(filterreport);
};

//    useEffect(() => {
//   const updatedItems = [];
   
//   filteredTransfers.forEach((sale) => {
//     sale.items.forEach((item) => {
//       if(!item.item) return; // Skip if item is null or undefined
//       const id = item.item?._id;
//       const existingIndex = updatedItems.findIndex((bi) => bi.id === id);

//       if (existingIndex !== -1) {
//         updatedItems[existingIndex].quantity += item.quantity;
//       } else {
//         updatedItems.push({
//           customerName: sale.customer?.customerName || 'NA',
//           saleCode: sale.saleCode,
//           saleDate: sale.saleDate,
//           id: id,
//           itemName: item.item?.itemName,
//           quantity: item.quantity,
//           ...item, // include any other relevant fields
//         });
//       }
//     });
//   });


//   const total= updatedItems.reduce((acc, item) => acc + (item.subtotal), 0);
//   setTotal(total);
  
//   setSaleItems(updatedItems);
// }, [filteredTransfers]);



              // Export to PDF function
             
const downloadAsPDF = () => {
  const doc = new jsPDF();
  doc.text("Pending Item Report", 14, 15);

  const headers = [["#", "Item Name", "Pending Qty", "MRP"]];

  const rows = finalReport.map((item, index) => [
    index + 1,
    item.itemName,
    (item.sale || 0) - (item.saleReturn || 0) + (item.stockTransferIn || 0) - (item.stockTransferOut || 0),
    item.salesPrice || 0
  ]);

  autoTable(doc, {
    head: headers,
    body: rows,
    startY: 20
  });

  doc.save("PendingItems.pdf");
};
              
              // Export to Excel function
              const exportToExcel = () => {
                // Prepare data for Excel
                const excelData = finalReport.map((item, index) => ({
                   "#": index + 1,
              "Item Name": item.itemName,
              "Pending Qty": (item.sale || 0) - (item.saleReturn || 0) + (item.stockTransferIn || 0) - (item.stockTransferOut || 0),
              "MRP": item.salesPrice || 0,
                }));
              
                // Create worksheet
                const worksheet = XLSX.utils.json_to_sheet(excelData);
                
                // Create workbook
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'penddingItems');
                
                // Export to Excel file
                XLSX.writeFile(workbook, 'pendingItems.xlsx');
              };


    return (
        <div className="flex flex-col flex-1 overflow-y-auto">
            <main className="flex-grow p-4 space-y-6 bg-gray-100 sm:p-6">
                
                {/* Page Header */}
                <header className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">Club Item Report</h1>
                        <nav className="flex items-center mt-1 text-sm text-gray-500" aria-label="Breadcrumb">
                            <NavLink to="/dashboard" className="flex items-center hover:text-blue-600"><HomeIcon className="w-4 h-4" /> <span className="hidden ml-1 sm:inline">Home</span></NavLink>
                            <ChevronRightIcon /><span>Reports</span><ChevronRightIcon />
                            <span className="font-medium text-gray-600">Club Item Report</span>
                        </nav>
                    </div>
                </header>
                {
                  pop  && (
                    <ItemDetailsPopup item={selectedItem} onClose={() => setPop(false)} />
                  )
                }
               { view && (
                    <ClubStockView item={selectedItem} setView={setView} warehouses={options.warehouses} items={allItems} />
                )}
                {/* Filter Section (Collapsible) */}
                <div className="bg-white border-t-4 rounded-lg shadow-sm border-cyan-600">
    <button onClick={() => setFiltersVisible(!filtersVisible)} className="flex items-center justify-between w-full p-4 font-semibold text-left text-gray-700">
        <div className="flex items-center gap-2">
            <FilterIcon className="w-5 h-5" />
            <span>Filter Report</span>
        </div>
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${filtersVisible ? 'rotate-180' : ''}`} />
    </button>
    {filtersVisible && (
        <div className="p-4 border-t border-gray-200">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">Warehouse</label>
                    <Select className='w-full' options={options.warehouses} onChange={(option) => {setSelectedWarehouse(option.value);setSelectedWarehouseName(option.label)}} value={options.warehouses.find(option => option.value === selectedWarehouse)} />
                </div>
                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">Item Type</label>
                    <Select className='w-full' options={[{ label: "Item", value: "item" }, { label: "Services", value: "services" }]} />
                </div>
                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">Category</label>
                    <Select className='w-full' options={options.categories} onChange={(option) => setCategory(option.value)} value={options.categories.find(option => option.value === category) || null} />
                </div>
                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">From Date</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label className="block mb-1 text-sm font-medium text-gray-600">To Date</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            </div>
            
            {/* --- Button Added Here --- */}
            <div className="flex justify-end mt-6">
                <button 
                    onClick={() => { /* Add your filter logic here */ applyfilter() }} 
                    className="px-5 py-2 font-semibold text-white transition-colors duration-200 rounded-md bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                >
                    Apply Filter
                </button>
            </div>
        </div>
    )}
</div>

                {/* Records Section */}
              <div className="bg-white rounded-lg shadow-sm">
    {/* Main Header with Export Button */}
    <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-700">Records</h3>
        <div className="relative">
            <button onClick={() => setShowExportDropdown(!showExportDropdown)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">
                <DownloadIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDownIcon className="hidden w-4 h-4 sm:inline" />
            </button>
            {showExportDropdown && (
                <div className="absolute right-0 z-10 w-40 mt-2 bg-white rounded-md shadow-lg" onMouseLeave={() => setShowExportDropdown(false)}>
                    <button onClick={exportToExcel} className="flex items-center w-full gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><ExcelIcon /> Excel</button>
                    <button onClick={downloadAsPDF} className="flex items-center w-full gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"><PdfIcon /> PDF</button>
                </div>
            )}
        </div>
    </div>

    {/* --- Table 1: Pending Quantity Report --- */}
    <div className="border-t border-gray-200">
        <div className="p-4">
            <h4 className="font-semibold text-gray-700">Pending Quantity Report</h4>
            <p className="text-xs text-gray-500">
                {`Warehouse: ${selectedWarehouseName}, Date: ${!dateFrom ? new Date().toLocaleDateString() : dateFrom} ${dateTo ? `to ${dateTo}` : ''}`}
            </p>
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">#</th>
                        <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Item Name</th>
                        <th className="px-4 py-3 text-xs font-medium tracking-wider text-center text-gray-500 uppercase">Pending Qty</th>
                        <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">MRP</th>
                        {/* <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Van Stock</th> */}
                        {/* <th className="px-4 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Store Stock</th> */}
                        
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {!loading && finalReport.length > 0 && finalReport.map((item, index) =>
                      (
                        <tr key={`${item.saleId}-${index}`} className="hover:bg-gray-50" onClick={()=>{
                          
                        setView(true);
                        setSelectedItem(item);
                        }}>
                            <td className="px-4 py-3 text-sm font-medium text-gray-700">{index + 1}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-800 break-words">{item.itemName}</td>
                            <td className="px-4 py-3 text-sm font-medium text-center text-gray-800">
                                {(item.sale || 0) - (item.saleReturn || 0) + (item.stockTransferIn || 0) - (item.stockTransferOut || 0)}
                            </td>
                            <td className="px-4 py-3 text-lg font-bold text-blue-600">₹{item.salesPrice || 0}</td>
                           {/* <td className="px-4 py-3 text-lg font-bold text-blue-600">
  {(() => {
    const stocks = openStockModal(false,item); // Must be synchronous
    if (selectedWarehouseName === "All") {
      console.log("Stocks:", stocks);
      return stocks.reduce((acc, wh) => acc + (wh.stock || 0), 0);
    } else {
      return stocks.find(s => s.id === selectedWarehouse)?.stock || 0;
    }
  })()}
</td> */}
  {/* <td className="px-4 py-3 text-lg font-bold text-blue-600">
  {(() => {
    const stocks = openStockModal(true,item); // Must be synchronous
    if (selectedWarehouseName === "All") {
      console.log("Stocks:", stocks);
      return stocks.reduce((acc, wh) => acc + (wh.stock || 0), 0);
    } else {
      return stocks.find(s => s.id === selectedWarehouse)?.stock || 0;
    }
  })()}
</td> */}

                        </tr>
                    ))}
                    {loading && (
                        <tr><td colSpan="4" className="p-4 text-center text-gray-500">Loading...</td></tr>
                    )}
                    {!loading && finalReport.length === 0 && (
                        <tr><td colSpan="4" className="p-4 text-center text-gray-500">No records found</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>

    {/* --- Table 2: Detailed Report --- */}
   

    {/* Total Sales Footer */}
    {/* <div className="p-4 font-bold text-right text-gray-800 border-t rounded-b-lg bg-gray-50">Total Sales: ₹{total.toFixed(2)}</div> */}
</div>
                
            
            </main>
            {/* Barcode Scanner Modal */}
           
        </div>
    );
};

export default function ClubBillReport() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (window.innerWidth >= 1024) {
            setSidebarOpen(true);
        } else {
            setSidebarOpen(false);
        }
    }, [])

    return (
 <div className="flex flex-col h-screen">
        <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex flex-grow">
          <Sidebar isSidebarOpen={isSidebarOpen} />
                <ClubReportPage />
                {/* Add padding to the bottom of the content to avoid overlap with the sticky footer */}
                <div className="h-16 mb-16 bg-black md:hidden shrink-0"></div>
            </div>
             {isSidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"></div>}
        </div>
    );
}

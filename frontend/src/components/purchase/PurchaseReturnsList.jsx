import React, {useEffect, useState} from 'react';
import { ShoppingBagIcon, CashIcon} from "@heroicons/react/outline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoneyBill } from "@fortawesome/free-solid-svg-icons";
import {FaDollarSign ,FaTrash} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { FaTachometerAlt } from "react-icons/fa";
import { faBuilding } from "@fortawesome/free-regular-svg-icons";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import axios from 'axios';
import Select from 'react-select'
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../../Loading.jsx';
import BluetoothDevicesPage from '../../pages/BluetoothDevicesPage.jsx';  
const PurchaseOverview = () => {
  const [device, setDevice] = useState(false);
  const link="https://pos.inspiredgrow.in/vps"
  const[loading,setLoading]=useState(false)
  const[warehouse,setWarehouse]=useState([])
  const[show,setShow]=useState(null)
  const [isSidebarOpen, setSidebarOpen] = useState(true);
 const [searchTerm, setSearchTerm] = useState("");
 const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
const[purchaseReturn,setPurchaseReturn]=useState([])
const[invoiceNumber,setInvoiceNumber]=useState(0)
const[totalInvoice,setTotalInvoice]=useState(0)
const[totalPaid,setTotalPaid]=useState(0)
// … inside PurchaseOverview component
const [localPermissions, setLocalPermissions] = useState([]);
useEffect(() => {
  const stored = localStorage.getItem("permissions");
  if (stored) setLocalPermissions(JSON.parse(stored));
}, []);
function hasPermissionFor(module, action) {
  const role = (localStorage.getItem("role") || "guest").toLowerCase();
  if (role === "admin") return true;
  return localPermissions.some(p =>
    p.module.toLowerCase() === module.toLowerCase() &&
    p.actions.map(a => a.toLowerCase()).includes(action.toLowerCase())
  );
}

const navigate=useNavigate();
const[dropdownIndex,setDropdownIndex]=useState(null)
 useEffect(()=>{
    if(window.innerWidth < 768){
      setSidebarOpen(false)
    }
  },[])
//Fetch Purchase
const fetchPurchaseReturnList = async ()=>{
  setLoading(true)
  const token=localStorage.getItem("token")
  if(!token){
    console.log ("No token found redirecting...")
    navigate("/")
    return ;
  }
  try {
    const response = await axios.get(`${link}/api/purchases/purchase-returns`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("Purchase List")
    console.log(response.data)
   if(response.data.data) setPurchaseReturn(response.data.data)
  } catch (error) {
    alert(error.message)
  }
  finally{
    setLoading(false)
  }
}


//Fetch Warehouse
const fetchWarehouses=async ()=>{
  setLoading(true)
  const token=localStorage.getItem("token")
  if(!token){
    console.log ("No token found redirecting...")
    navigate("/")
    return ;
  }
  try {
    const response = await axios.get(`${link}/api/warehouses`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("Warehouse")
    console.log(response.data);
    if (response.data.data) {
    // Extract suppliers from API response
    const newwarehouse = response.data.data.map((warehouse) => ({
      label: warehouse.warehouseName,
      value: warehouse._id,
    }));
    
    setWarehouse(newwarehouse)
  }
  } catch (error) {
    alert(error.message)
  }finally{
    setLoading(false)
  }}
  
  
  //calculate Total Invoice
  const calculateTotalInvoice = () => {
    const filteredList = show === "all" || !show 
      ? purchaseReturn 
      : purchaseReturn.filter(item => item.warehouse?._id === show);
  
    const totalGrandTotal = filteredList.reduce((sum, item) => sum + (item.grandTotal || 0), 0);
  
    setTotalInvoice(totalGrandTotal);
    console.log(totalGrandTotal)
  };

  //Total Paid Payment
  const calculateTotalPaid = () => {
    if (!purchaseReturn || purchaseReturn.length === 0) {
      setTotalPaid(0);
      return;
    }
  
    const filteredList = show === "all" || !show 
      ? purchaseReturn 
      : purchaseReturn.filter(item => item.warehouse?._id === show);
  
    const totalPaid = filteredList.reduce((sum, item) => {
      // Ensure `payments` array exists and has at least one element before accessing [0]
      const paidAmount = item.payments?.length > 0 ? item.payments[0].amount || 0 : 0;
      return sum + paidAmount;
    }, 0);
  
    setTotalPaid(totalPaid);
    console.log(totalPaid);
  };


  //calculate total invoices
  const calculateTotalInvoiceNumber = () => {
    const filteredList = show === "all" || !show 
      ? purchaseReturn 
      : purchaseReturn.filter(item => item.warehouse?._id === show);
  
  
    setInvoiceNumber(filteredList.length);
  };
  
  //Delete return Purchase
  
const handledelete = async (id) => {
  const conf = window.confirm("Do you want to delete this supplier?");
  if (!conf) return;
 setLoading(true)
  try {
      const response = await fetch(`${link}/api/purchases/${id}`, {
          method: "DELETE",
          headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
      });

      if (!response.ok) {
          throw new Error("Failed to delete supplier");
      }

      console.log("Purchase deleted successfully!");
       fetchPurchaseReturnList();
      // // Update state without fetching again
      // setUsers((prevUsers) => prevUsers.filter(user => user._id !== id));

  } catch (error) {
      console.error("Error deleting purchase:", error.message);
  }
  finally{
    setLoading(false)
  }
};




  

  

useEffect(()=>{
  fetchPurchaseReturnList();
  fetchWarehouses();
},[])
useEffect(()=>{
  calculateTotalInvoice();
  calculateTotalPaid();
  calculateTotalInvoiceNumber();
},[purchaseReturn,show])


const filteredData = 
purchaseReturn.filter(item => 
  item.purchaseCode?.toLowerCase().includes(searchTerm.toLowerCase()) || 
  item.referenceNo.toLowerCase().includes(searchTerm.toLowerCase())
);

const indexOfLastEntry = currentPage * entriesPerPage;
const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
const currentEntries = filteredData.slice(indexOfFirstEntry, indexOfLastEntry);

const totalPages = Math.ceil(filteredData.length / entriesPerPage);

const handlePageChange = (pageNumber) => {
  setCurrentPage(pageNumber);
};


const generatePlainTextReceipt = (data) => {
   
  const store={
      logo:        "/logo/inspiredgrow.jpg",                       //  40-50 px square looks right
  storeName:   "Grocery on Wheels",                                //  already in state
  tagline:     "GROCERY ON WHEELS",
  address:     "Basement 210-211 new Rishi Nagar near\nShree Shyam Baba Mandir Gali No. 9, Hisar – 125001",
  gst:         "06AAGCI0630K1ZR",
  phone:       "9050092092",
  email:       "INSPIREDGROW@GMAIL.COM",
  }
  
  const lineWidth = 42; // Standard for 3-inch (80mm) Epson P80 printers
  const line = '-'.repeat(lineWidth) + '\n';

  // --- Helper Functions ---
  const pad = (str, len, char = ' ') => (str + char.repeat(len)).substring(0, len);
  const padRight = (str, len, char = ' ') => (String(str) + char.repeat(len)).substring(0, len);
  const padLeft = (str, len, char = ' ') => (char.repeat(len) + String(str)).slice(-len);
  
   const wrapText = (txt, width) => {
    if (!txt || width <= 0) return [""];
    const words = txt.split(" ");
    const out   = [];
    let row = "";
    words.forEach(w => {
      if ((row + " " + w).trim().length <= width) {
        row = (row ? row + " " : "") + w;
      } else {
        if (row) out.push(row);
        row = w;
      }
    });
    if (row) out.push(row);
    return out;
  };

  const centerText = (txt) => {
    const space = Math.max(0, Math.floor((lineWidth - txt.length) / 2));
    return " ".repeat(space) + txt;
  };

  const twoColumn = (left, right) =>
    left + " ".repeat(Math.max(0, lineWidth - left.length - right.length)) + right;

  
 
  
  // Adjusted total to fit, let's recalculate: 3+18+4+7+7 = 39. Left for total = 3. Too small.
  // Let's use the previous stable widths.
const col = { sno: 3, item: 13, qty: 4, mrp: 7, rate: 7, total: 8 }; // still 42
  
  const finalColWidths = {
    sno: 3,
    item: 15,
    qty: 4,
    mrp: 7,
    rate: 7,
    total: 6,
  };

  
  // =================================================================
  // THIS IS THE NEW, SIMPLER, AND CORRECTED ITEM ROW FORMATTER
  // =================================================================
  /* ---------- row formatter ---------- */
  
const formatItemRow = (item, idx) => {
  const lines = wrapText(item.item.itemName, col.item).slice(0, 4); // up to 4 lines
  let txt = '';
  console.log(item)
  lines.forEach((ln, i) => {
  
    if (i === 0) {
      txt += padRight(idx + 1, col.sno) +
             padRight(ln,        col.item) +
             padLeft (item.quantity,               col.qty)   +
             padLeft (Number(item.purchasePrice).toFixed(2),  col.mrp)  +
             padLeft (Number(item.purchasePrice).toFixed(2),     col.rate) +
             padLeft ((item.quantity * item.purchasePrice).toFixed(2), col.total) + '\n';
    } else {
      txt += padRight('', col.sno) +
             padRight(ln, col.item) +
             padLeft('', col.qty)  +
             padLeft('', col.mrp)  +
             padLeft('', col.rate) +
             padLeft('', col.total) + '\n';
    }
  });
  return txt;
};

  
  let text = '';

  // --- Header ---
  text += centerText(data.warehouse.warehouseName) + '\n';
  // wrapText(store.address, lineWidth).forEach(wrappedLine => {
  //     text += centerText(wrappedLine) + '\n';
  // });
  text += centerText(" Basement 210-211 new Rishi Nagar near \n Shree Shyam Baba Mandir Gali No. 9,Hisar-125001") + '\n';
  text += line;
  
  // --- Order Info ---
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN');
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  text += twoColumn(`Date: ${data.purchaseDate.substring(0,10)}`, `Time: ${data.purchaseDate.substring(11,16)}`) + '\n';
   text+=`Supplier: ${data.supplier.supplierName || "" }`+'\n';
  text += line;

  text += padRight("#", col.sno) +
          padRight("Item", col.item) +
          padLeft ("Qty",  col.qty)  +
          padLeft ("MRP",  col.mrp)  +
          padLeft ("Rate", col.rate) +
          padLeft ("Total",col.total) + "\n";

          
  // --- Items Table Body ---
  data.items.forEach((item, index) => {
    text += formatItemRow(item, index);
  });
  text += line;

  // --- Full Summary Section ---
 

   const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
                

        const rawTotal = data.items.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
                
            // a
        const disc = data.totalDiscount || 0;
        const taxAmt = data.taxAmount || 0;
                

        const netBeforeTax = rawTotal - disc;
        
const totalM=data.items.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
const totalSales=data.items.reduce((sum, item) => sum + (item.quantity * item.item.salesPrice), 0);
 console.log("Total Sales:", totalSales);
      console.log("Total M:", totalM);

const paid = data.payments.reduce((sum, p) => sum + p.amount, 0);
      // a
const prevDue = data.previousBalance  || 0;

const totalDue = prevDue + netBeforeTax + taxAmt - paid;

    text += `${pad('Total Quantity:', 34)} ${padLeft(totalQuantity||0, 6)}\n`;
    text += `${pad('Other Charges:', 34)} ${padLeft(data.otherCharges||0, 6)}\n`;
    text += `${pad('Before Tax:', 34)} ${padLeft(`${(totalM)?.toFixed(2)||0}`, 6)}\n`;
    text += `${pad('Total Discount:', 34)} ${padLeft(`-${(totalM-totalSales)?.toFixed(2)||0}`, 6)}\n`;


    text += `${pad('Net Before Tax:', 34)} ${padLeft(totalSales?.toFixed(2)||0, 6)}\n`;

    text += `${pad('Tax Amount:', 34)} ${padLeft(taxAmt?.toFixed(2)||0, 6)}\n`;
    text += `${pad('SubTotal:', 34)} ${padLeft(((taxAmt || 0)+ totalSales)?.toFixed(2)||0, 6)}\n`;
    text += `${pad('Other Charges:', 34)} ${padLeft(data.otherCharges?.toFixed(2)||0, 6)}\n`;
    text += `${pad('Total:', 34)} ${padLeft(((taxAmt || 0)+ totalSales + (data.otherCharges || 0))?.toFixed(2)||0, 6)}\n`;
    text += `${pad('Paid Payment:', 34)} ${padLeft(paid?.toFixed(2)||0, 6)}\n`;
    text += `${pad('Previous Due:', 34)} ${padLeft(prevDue?.toFixed(2)||0, 6)}\n`;
    text += `${pad('Total Due:', 34)} ${padLeft((((taxAmt || 0)+ totalSales + (data.otherCharges || 0))-paid)?.toFixed(2)||0, 6)}\n`;
    text += line;

    // Payment type
    data.payments.forEach((p, i) => {
        text += `Payment Type: ${p.paymentNote} ₹${p.amount?.toFixed(2)||0}\n`;
    });

    text+=line;
  
  // --- Footer ---
  text += centerText('------Thank You & Visit Again!------') + '\n\n\n';
  console.log(text)
  return text;
};



    // --- Action Handlers ---
   const handleBluetoothPrint = (sale) => {
  try {
    setLoading(true);
    const printinfo = generatePlainTextReceipt(sale);

    if (!window.bluetoothSerial) {
      alert("Bluetooth plugin not found. Please run on a real Android device.");
      return;
    }

    window.bluetoothSerial.isConnected(
      () => {
        // ✅ If connected, proceed to write
        window.bluetoothSerial.write(
          printinfo,
          () => alert("✅ Print success"),
          (failure) => alert(`❌ Print failed: ${failure}`)
        );
      },
      () => {
        // ❌ Not connected
         setDevice(true);
      }
    );
  } catch (error) {
    console.error("Bluetooth print error:", error);
    alert("An unexpected error occurred while printing.");
  } finally {
    setLoading(false);
  }
};





if(loading) <LoadingScreen />
  
  return (
<div className="flex flex-col h-screen">
          {/* Navbar */}
          <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
              {/* Main Content */}
              <div className="flex flex-grow">
                {/* Sidebar */}
            
              {/* Sidebar component with open state */}
              <div className="w-auto">
                
              <Sidebar isSidebarOpen={isSidebarOpen} />
              </div>
              {
                device && <BluetoothDevicesPage setDevice={setDevice} />
              }
              
                 {/* Content */}
         <div className={`overflow-x-auto  flex flex-col p-2 md:p-2 min-h-screen w-full`}>
          {/* ----------------header----------------------------------- */}
        <header className="flex flex-col items-center justify-between p-4 mb-6 bg-gray-100 rounded-lg md:flex-row">
          <div className='flex items-baseline'>
                <h1 className="text-2xl font-semibold">Purchase Returns List </h1>
                <span className="text-gray-500 text-sm/6">View/Search Purchase</span>
          </div>
                <div className="flex items-center space-x-2 text-blue-600">
                    <Link to="/dashboard" className="flex items-center text-gray-500 no-underline hover:text-cyan-600 text-sm/6">
                    <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600"/> Home
                    </Link>
                    <span className="text-gray-400">{">"}</span>
                    <Link to="/purchasereturn-list" className="text-gray-500 no-underline hover:text-cyan-600 text-sm/6">Purchase Returns List</Link>
                </div>
</header>  
    
<div className="flex flex-col gap-4">
{/* Cards Container */}
<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
  {/* Total Invoices Card */}
  <div className="flex items-center text-black bg-white rounded-lg shadow-md ">
    <ShoppingBagIcon className="w-16 text-white rounded bg-cyan-500" />
   <div className="flex flex-col justify-center ml-4">
    <h2 className="text-xl">{invoiceNumber}</h2>
    <p>Total Invoices</p>
    </div>
  </div>
  {/* Total Paid Amount Card */}
  <div className="flex items-center text-black bg-white rounded-lg shadow-md">
    < FaDollarSign className='w-16 h-16 text-white rounded bg-cyan-500'/>
    <div className="flex flex-col justify-center ml-4">
    <h2 className="text-xl">₹{totalPaid}</h2>
    <p>Total Paid Amount</p>
    </div>
  </div>
  {/* Total Invoices Amount Card */}
  <div className="flex items-center text-black bg-white rounded-lg shadow-md">
    <FontAwesomeIcon icon={faMoneyBill} className="w-16 h-16 text-white rounded bg-cyan-500" />
    <div className="flex flex-col justify-center ml-4">
    <h2 className="text-xl">₹{totalInvoice}</h2>
    <p>Total Invoices Amount</p>
    </div>
  </div>
  {/* Total Purchase Due Card */}
  <div className="flex items-center text-black bg-white rounded-lg shadow-md">
  <CashIcon className="h-16 text-white rounded bg-cyan-500 w-18" />
    <div className="flex flex-col justify-center ml-4">
    <h2 className="text-xl">₹{totalInvoice-totalPaid}</h2>
    <p>Total Purchase Due</p>
    </div>
  </div>
</div>
</div>

 {/* ------------------------------------------- */}
<div className="flex flex-col items-center justify-between w-full gap-4 mt-3 md:flex-row md:gap-28">
  {/* Left Section (Dropdown + Icon) */}
  <div className="flex w-full px-4 py-2 bg-white border border-gray-300 rounded-md md:w-64">
    <div className="flex items-center w-full gap-4">
      <FontAwesomeIcon icon={faBuilding} className="w-5 h-5 text-red-500" />
      {/* <select
        className="flex-grow text-gray-700 bg-transparent outline-none cursor-pointer"
        value={selectedWarehouse}
        onChange={(e) => setSelectedWarehouse(e.target.value)}
      >
        {warehouses.map((warehouse, index) => (
          <option key={index} value={warehouse}>
            {warehouse}
          </option>
        ))}
      </select> */}
       <select
        className="flex-grow text-gray-700 bg-transparent outline-none cursor-pointer"
        
        onChange={(e)=> setShow(e.target.value)}
      > <option value="all">All Warehouse</option>
        {warehouse.map((warehouse, index) => (
          <option key={index} value={warehouse.value}>
            {warehouse.label}
          </option>
        ))}
      </select>
    </div>
  </div>

  {/* Right Section (Create Button) */}
  {hasPermissionFor("Purchases","Add") && (
  <button className="w-full px-2 py-2 text-white transition rounded-md md:w-auto bg-cyan-300 hover:bg-cyan-500" onClick={()=> navigate("/purchase-return")}>
    <span className='text-xl font-'>+ </span>Create Purchase
  </button>
  )}
</div>
{/* ------------------------------------------------------------------ */}
<div className="flex flex-col justify-between mt-4 mb-4 space-y-2 md:flex-row md:space-y-0 md:items-center">
              <div className="flex items-center px-2 space-x-2">
                <span className="text-sm">Show</span>
                <select className="p-2 text-sm border border-gray-300 rounded-md" value={entriesPerPage} onChange={(e)=>setEntriesPerPage(e.target.value)}>
                  <option value='10'>10</option>
                  <option value='20'>20</option>
                  <option value='50'>50</option>
                </select>
                <span className="text-sm">Entries</span>
              </div>
              <div className="flex flex-col gap-2 md:flex-row">
                <div className='flex items-center justify-between flex-1 gap-2 px-2'>
                <button 
                // onClick={handleCopy}
                 className="px-3 py-2 text-sm text-white bg-cyan-500">Copy</button>
                <button 
                // onClick={handleExcelDownload}
                 className="px-3 py-2 text-sm text-white bg-cyan-500">Excel</button>
                <button
                //  onClick={handlePdfDownload}
                  className="px-3 py-2 text-sm text-white bg-cyan-500">PDF</button>
                <button 
                // onClick={handlePrint}
                 className="px-3 py-2 text-sm text-white bg-cyan-500">Print</button>
                <button 
                // onClick={handleCsvDownload}
                 className="px-3 py-2 text-sm text-white bg-cyan-500">CSV</button>
                </div>
                <input type="text" placeholder="Search" className="w-full p-2 text-sm border border-gray-300 rounded-sm " onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
{/* ------------------------------------------------------------------- */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 shadow-sm">
          <thead className="bg-gray-200">
            <tr>
              {[
                'Date', 'Purchase Code', 'Return Status', 'Reference No.',
                'Supplier Name', 'Total', 'Paid Payment', 'Payment Status', 'Created by', 'Action'
              ].map((header) => (
                <th key={header} className="px-4 py-2 font-medium text-left border">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
             { (show === "all" || !show ? currentEntries : currentEntries.filter(item => item.warehouse?._id === show)).length > 0 
    ? (show === "all" || !show ? currentEntries : currentEntries.filter(item => item.warehouse?._id === show))
      .map((item) => (
        <tr className="font-bold bg-gray-100" key={item._id}>
          <td className="px-4 py-2 font-medium text-left border">{new Date(item.purchaseDate).toLocaleDateString()}</td>
          <td className="px-4 py-2 font-medium text-left border">{item.purchaseCode || "No purchaseCode found"}</td>
          <td className="px-4 py-2 font-medium text-left border">{item.status}</td>
          <td className="px-4 py-2 font-medium text-left border">{item.referenceNo}</td>
          <td className="px-4 py-2 font-medium text-left border">
  {item.supplier?.email ? item.supplier.email : "No supplier"}
</td>
          <td className="px-4 py-2 font-medium text-left border">{item.grandTotal}</td>
          <td className="px-4 py-2 font-medium text-left border">
            {item.payments?.length > 0 ? `${item.payments[0].amount.toFixed(2)}` : 0}
          </td>
          <td className="px-4 py-2 font-medium text-left border">
            {item.payments?.length > 0 ? `${item.payments[0].paymentNote}` : "No Status"}
          </td>
          <td className="px-4 py-2 font-medium text-left border">{item.creatorName || item.createdByModel}</td>
          <td className="relative px-4 py-2 border">
  <button
    onClick={() => {
      setDropdownIndex(dropdownIndex === item._id ? null : item._id);
    }}
    className="px-3 py-1 text-white transition rounded bg-cyan-600 hover:bg-cyan-700"
  >
    Action ▼
  </button>

  {dropdownIndex === item._id && (
    <div
      className="absolute right-0 z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg w-36 animate-fade-in"
    >
       {hasPermissionFor("Purchases","Delete") && (
        <button
        className="flex items-center w-full px-3 py-2 text-red-600 hover:bg-gray-100"
        onClick={() => {
          handledelete(item._id);
          setDropdownIndex(null);
        }}
      >
        <FaTrash className="mr-2" /> Delete
      </button>
      )}
         <button
                                className="w-full px-2 py-1 text-left text-blue-500 hover:bg-gray-100"
                                onClick={() => {
handleBluetoothPrint(item);
setDropdownIndex(null);
                                } }
                              >
                                📄 Print
                              </button>
    </div>
  )}
</td>

        </tr>
      ))
    : (
      <tr>
        <td colSpan="10" className="py-4 font-semibold text-center border">No Data Available</td>
      </tr>
    )
  }

          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6 text-gray-700">
        <span>Showing 1 to {currentEntries.length} of {entriesPerPage} entries</span>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"   onClick={() => handlePageChange(currentPage - 1)} 
        disabled={currentPage === 1}>Previous</button>
         {[...Array(totalPages)].map((_, index) => (
        <button 
          key={index} 
          onClick={() => handlePageChange(index + 1)}
          className={currentPage === index + 1 ? "active" : ""}
        >
          {index + 1}
        </button>
      ))}
          <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"  onClick={() => handlePageChange(currentPage + 1)} 
        disabled={currentPage === totalPages}>Next</button>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
};

export default PurchaseOverview;

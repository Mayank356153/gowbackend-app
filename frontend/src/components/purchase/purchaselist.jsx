import React, {useEffect, useState} from 'react';
import { ShoppingBagIcon, CashIcon} from "@heroicons/react/outline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoneyBill } from "@fortawesome/free-solid-svg-icons";
import {FaDollarSign} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { FaTachometerAlt } from "react-icons/fa";
import { faBuilding } from "@fortawesome/free-regular-svg-icons";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingScreen from '../../Loading.jsx';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
const PurchaseOverview = () => {
    const link="https://pos.inspiredgrow.in/vps"
  const navigate=useNavigate();
  const [warehouse,setWarehouse]=useState([])
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const[searchTerm,setSearchTerm]=useState("")
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const[purchaseList,setPurchaseList]=useState([])
 const[show,setShow]=useState(null)
  const[total,setTotal]=useState(0)
  const[paid,setpaid]=useState(0)
  const[loading,setLoading]=useState(false)
  const[actionMenu,setActionMenu]=useState(null)
  const [localPermissions, setLocalPermissions] = useState([]);
useEffect(() => {
  const stored = localStorage.getItem("permissions");
  if (stored) {
    try { setLocalPermissions(JSON.parse(stored)); }
    catch {}
  }
}, []);

function hasPermissionFor(module, action) {
  const role = (localStorage.getItem("role") || "guest").toLowerCase();
  if (role === "admin") return true;
  return localPermissions.some(p =>
    p.module.toLowerCase() === module.toLowerCase() &&
    p.actions.map(a => a.toLowerCase()).includes(action.toLowerCase())
  );
}

   useEffect(()=>{
      if(window.innerWidth < 768){
        setSidebarOpen(false)
      }
    },[window.innerWidth])
//Fetch Purchase
const fetchPurchaseList = async ()=>{
  const token=localStorage.getItem("token")
  setLoading(true)
  if(!token){
    console.log ("No token found redirecting...")
    navigate("/")
    return ;
  }
  try {
    const response = await axios.get(`${link}/api/purchases`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("Purchase List")
    console.log(response.data)
   if(response.data.data) setPurchaseList(response.data.data)
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
  }
 finally{
  setLoading(false)
 }
}
  
  const calculate = () => {
    const filteredList = show === "all" || !show 
      ? purchaseList 
      : purchaseList.filter(item => item.warehouse?._id === show);
  
    const totalAmount = filteredList.reduce((sum, item) => sum + item.grandTotal, 0);
  
    const totalPaid = filteredList.reduce((sum, item) => 
      sum + (item.payments?.length > 0 ? parseFloat(item.payments[0].amount) : 0), 
      0
    );
  
    setTotal(totalAmount);
    setpaid(totalPaid);
  };
  
  
  useEffect(()=>{
  setTotal(0)
  calculate()
},[show,purchaseList])




useEffect(()=>{
  fetchPurchaseList();
  fetchWarehouses();
  calculate();
},[])
  

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
       fetchPurchaseList();
      // // Update state without fetching again
      // setUsers((prevUsers) => prevUsers.filter(user => user._id !== id));

  } catch (error) {
      console.error("Error deleting purchase:", error.message);
  }
  finally{
    setLoading(false)
  }
};


  if(loading)  <LoadingScreen />
  return (
    <div className="flex flex-col h-screen">
    {/* Navbar */}
    <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
        {/* Main Content */}
        <div className="box-border flex">
          {/* Sidebar */}
          
        {/* Sidebar component with open state */}
        <div className="w-auto">
          
        <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>
          
           {/* Content */}
   <div className={`overflow-x-auto  flex flex-col p-2 md:p-2 min-h-screen w-full`}>
{/* ----------------header----------------------------------- */}
<header className="flex flex-col items-center justify-between p-4 mb-6 bg-gray-100 rounded-lg md:flex-row">
                <h1 className="text-2xl font-semibold">Purchase List <span className="text-gray-500 text-sm/6">View/Search Purchase</span></h1>
                <div className="flex items-center space-x-2 text-blue-600">
                    <Link to="/" className="flex items-center text-gray-500 no-underline hover:text-cyan-600 text-sm/6">
                    <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600"/> Home
                    </Link>
                    <span className="text-gray-400">{">"}</span>
                    <Link to="/brands" className="text-gray-500 no-underline hover:text-cyan-600 text-sm/6">Purchase List</Link>
                </div>
</header>  
    
<div className="flex flex-col gap-4">
{/* Cards Container */}
<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
  {/* Total Invoices Card */}
  <div className="flex items-center text-black bg-white rounded-lg shadow-md ">
    <ShoppingBagIcon className="w-16 text-white rounded bg-cyan-500" />
   <div className="flex flex-col justify-center ml-4">
    <h2 className="text-2xl">{(show === "all" || !show ? purchaseList : purchaseList.filter(item => item.warehouse?._id === show)).length}</h2>
    <p>Total Invoices</p>
    </div>
  </div>
  {/* Total Paid Amount Card */}
  <div className="flex items-center text-black bg-white rounded-lg shadow-md">
    < FaDollarSign className='w-16 h-16 text-white rounded bg-cyan-500'/>
    <div className="flex flex-col justify-center ml-4">
    <h2 className="text-2xl">₹{paid}</h2>
    <p>Total Paid Amount</p>
    </div>
  </div>
  {/* Total Invoices Amount Card */}
  <div className="flex items-center text-black bg-white rounded-lg shadow-md">
    <FontAwesomeIcon icon={faMoneyBill} className="w-16 h-16 text-white rounded bg-cyan-500" />
    <div className="flex flex-col justify-center ml-4">
    <h2 className="text-2xl">₹{total}</h2>
    <p>Total Invoices Amount</p>
    </div>
  </div>
  {/* Total Purchase Due Card */}
  <div className="flex items-center text-black bg-white rounded-lg shadow-md">
  <CashIcon className="h-16 text-white rounded bg-cyan-500 w-18" />
    <div className="flex flex-col justify-center ml-4">
    <h2 className="text-2xl font-medium">₹{total-paid}</h2>
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
  {hasPermissionFor("Purchases", "Add") && (
  <button className="w-full px-2 py-2 text-white transition rounded-md md:w-auto bg-cyan-300 hover:bg-cyan-500" onClick={()=> navigate("/new-purchase")}>
    <span className='font-bold'>+ </span>Create Purchase
  </button>
  )}
</div>
{/* ------------------------------------------------------------------ */}
<div className="flex flex-col justify-between mt-4 mb-4 space-y-2 md:flex-row md:space-y-0 md:items-center">
              <div className="flex items-center space-x-2">
                <span className="text-sm">Show</span>
                <select className="p-2 text-sm border border-gray-300 rounded-md" value={entriesPerPage} >
                  <option>10</option>
                  <option>20</option>
                  <option>50</option>
                </select>
                <span className="text-sm">Entries</span>
              </div>
              <div className="flex flex-col gap-2 md:flex-row">
                <div className='flex items-center justify-between flex-1 gap-2'>
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
                <input type="text" placeholder="Search" className="w-full p-2 text-sm border border-gray-300 " onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
{/* ------------------------------------------------------------------- */}
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 shadow-sm">
          <thead className="bg-gray-200">
            <tr>
              {[
                'Purchase Date', 'Purchase Code', 'Purchase Status', 'Reference No.',
                'Supplier Name', 'Total', 'Paid Payment', 'Payment Status', 'Created by', 'Action'
              ].map((header) => (
                <th key={header} className="px-4 py-2 font-medium text-left border">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
  { (show === "all" || !show ? purchaseList : purchaseList.filter(item => item.warehouse?._id === show)).length > 0 
    ? (show === "all" || !show ? purchaseList : purchaseList.filter(item => item.warehouse?._id === show))
      .map((item) => (
        <tr className="font-bold bg-gray-100" key={item._id}>
          <td className="px-4 py-2 font-medium text-left border">{new Date(item.purchaseDate).toLocaleDateString()}</td>
          <td className="px-4 py-2 font-medium text-left border">{item.purchaseCode}</td>
          <td className="px-4 py-2 font-medium text-left border">{item.status}</td>
          <td className="px-4 py-2 font-medium text-left border">{item.referenceNo}</td>
          <td className="px-4 py-2 font-medium text-left border">
  {item.supplier?.email ? item.supplier.email : "No supplier"}
</td>
          <td className="px-4 py-2 font-medium text-left border">{item.grandTotal}</td>
          <td className="px-4 py-2 font-medium text-left border">
            {item.payments?.length > 0 ? `${item.payments[0].amount.toFixed(2)}` : "No Payment"}
          </td>
          <td className="px-4 py-2 font-medium text-left border">
            {item.payments?.length > 0 ? `${item.payments[0].paymentNote}` : "No Status"}
          </td>
          <td className="px-4 py-2 font-medium text-left border">{item.createdByModel}</td>
          <td className="relative px-4 py-2 font-medium text-center border">
          <button
className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-cyan-600 rounded-full shadow-sm 
            hover:bg-cyan-700 active:scale-95 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-400`}
onClick={() => {
  if (actionMenu) setActionMenu(null);
  else setActionMenu(item._id);
}}
>
<span>Action</span>
<svg
  className={`w-4 h-4 transition-transform duration-200 ${
    actionMenu === item._id ? "rotate-180" : ""
  }`}
  fill="none"
  stroke="currentColor"
  strokeWidth={2}
  viewBox="0 0 24 24"
>
  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
</svg>
</button>    
{actionMenu === item._id && (
                        <div className="absolute right-0 z-40 mt-2 bg-white border shadow-lg w-28">
                          {hasPermissionFor("Purchases","Edit") && (
                          <button 
                          className="w-full px-1 py-0 text-left text-green-500 hover:bg-gray-100"
                           onClick={()=>navigate(`/new-purchase?id=${item._id}`)}
                           > 
                            
                            ✏️ Edit
                          </button>)}
                          {hasPermissionFor("Purchases","Delete") && (
                          <button
                            className="w-full px-1 py-0 text-left text-red-500 hover:bg-gray-100"
                            onClick={() => handledelete(item._id)}
                          >
                            🗑️ Delete
                          </button>
                          )}
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

  {/* Total Row - Only show if there is data */}
  {(show === "all" || !show ? purchaseList : purchaseList.filter(item => item.warehouse?._id === show)).length > 0 && (
    <tr className="font-bold bg-gray-100">
      <td colSpan="5" className="text-center border">Total</td>
      <td className="text-center border">{total}</td>
      <td className="text-center border">{paid}</td>
      <td className="text-center border"></td>
      <td className="text-center border"></td>
      <td className="text-center border"></td>
    </tr>
  )}
</tbody>


        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col items-start justify-between gap-2 p-2 md:justify-between md:flex-row">
              {/* <span>                    <span>Showing {entriesPerPage * (currentPage - 1) + 1} to {Math.min(entriesPerPage * currentPage, filteredData.length)} of {filteredData.length} entries</span>              </span> */}
              <div className='flex justify-between w-full md:w-auto md:gap-2'>
              <button
  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 shadow-md`} 
    // ${currentPage === 1 
      // ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
      // : "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"}`}
  // onClick={() => handlePageChange(currentPage - 1)}
  // disabled={currentPage === 1}
>
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
  Previous
</button>

<button
  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 shadow-md`} 
    // ${currentPage === totalPages 
    //   ? "bg-gray-300 text-gray-500 cursor-not-allowed" 
    //   : "bg-blue-500 hover:bg-blue-600 text-white cursor-pointer"}`}
  // onClick={() => handlePageChange(currentPage + 1)}
  // disabled={currentPage === totalPages}
>
  Next
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
</button>

              </div>
            </div>
    </div>
    </div>
    </div>
  );
};

export default PurchaseOverview;

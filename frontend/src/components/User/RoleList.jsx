// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import Navbar from "../Navbar";
// import Sidebar from "../Sidebar";
// import axios from "axios";
// import { jsPDF } from "jspdf";
// import autoTable from 'jspdf-autotable';
// import * as XLSX from 'xlsx';
// import { BiChevronRight } from 'react-icons/bi';
// import { FaTachometerAlt } from 'react-icons/fa';
// import { Link} from "react-router-dom";
// import LoadingScreen from "../../Loading";
// const RoleList = () => {
//   const navigate = useNavigate();
//   const [roles, setRoles] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage, setItemsPerPage] = useState(10);
//   const [isSidebarOpen, setSidebarOpen] = useState(false);
//   const [permissions, setPermissions] = useState([]);
//  const [actionMenu,setActionMenu]=useState(null)
//  const[loading,setLoading]=useState(false)
//   // Load permissions from localStorage
//   useEffect(() => {
//     const storedPermissions = localStorage.getItem("permissions");
//     if (storedPermissions) {
//       try {
//         setPermissions(JSON.parse(storedPermissions));
//       } catch (error) {
//         console.error("Error parsing permissions:", error);
//         setPermissions([]);
//       }
//     } else {
//       setPermissions([]);
//     }
//   }, []);

//   // Helper function: check if user has a specific permission for a module.
//   const hasPermissionFor = (module, action) => {
//     const userRole = (localStorage.getItem("role") || "guest").toLowerCase();
//     // Admin bypass: admin gets full access
//     if (userRole === "admin") return true;
//     return permissions.some(
//       (perm) =>
//         perm.module.toLowerCase() === module.toLowerCase() &&
//         perm.actions.map((a) => a.toLowerCase()).includes(action.toLowerCase())
//     );
//   };

//   // Compute permission flags once
//   const canViewRoles = hasPermissionFor("roles", "view");
//   const canAddRole = hasPermissionFor("roles", "add");
  
//   const fetchRoles = async () => {
//     const token = localStorage.getItem("token");
//     if (!token) {
//       console.error("No token found. Redirecting to login...");
//       navigate("/");
//       return;
//     }
//     setLoading(true)
//     try {
//       const response = await axios.get(
//         "https://mybackend-l7om.onrender.com/admincreatingrole/api/roles",
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       console.log("API Response:", response.data);
//       if (response.data && Array.isArray(response.data.roles)) {
//         setRoles(response.data.roles);
//       } else {
//         console.error("Unexpected API response:", response.data);
//         setRoles([]);
//       }
//     } catch (error) {
//       console.error(
//         "Error fetching roles:",
//         error.response?.data || error.message
//       );
//       if (error.response?.status === 401) {
//         console.error("Unauthorized. Redirecting to login...");
//         localStorage.clear();
//         navigate("/");
//       }
//       setRoles([]);
//     }
//     finally{
//       setLoading(false)
//     }
//   };
  
//   // Fetch roles on component mount
//   useEffect(() => {
//     fetchRoles();
//   }, [navigate]);

//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentRoles = roles.slice(indexOfFirstItem, indexOfLastItem);
//   const totalPages = Math.ceil(roles.length / itemsPerPage);

//   const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
//   const deleteRole=async(id)=>{
//     const conf=window.confirm("Are U sure")
//     if(!conf){
//       return;
//     }
//        const token = localStorage.getItem("token");
//     if (!token) {
//       console.error("No token found. Redirecting to login...");
//       navigate("/");
//       return;
//     }
//   setLoading(true)
//     try {
//       const response = await axios.delete(
//         `https://mybackend-l7om.onrender.com/admincreatingrole/${id}`,
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//      fetchRoles();
//     } catch (error) {
//       alert("Unable to delete")
//     }
//     finally{
//       setLoading(false)
//     }
//   }
//   if(loading) return(<LoadingScreen />)
//   return (
//     <div className="flex flex-col h-screen">
//       <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
//       <div className="flex flex-grow mt-20">
//         <div className="w-64">
//           <Sidebar isSidebarOpen={isSidebarOpen} />
//         </div>
//         <div className="container p-10 py-10 mx-auto">
//           {!canViewRoles ? (
//             <div>Insufficient permissions to view this page.</div>
//           ) : (
//             <>
//               <div className="flex items-center justify-between mb-4">
//                 <h1 className="text-2xl font-bold">Role List</h1>
//                 {canAddRole && (
//                   <button
//                     className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
//                     onClick={() => navigate("/admin/create/list")}
//                   >
//                     + Create Role
//                   </button>
//                 )}
//               </div>
//               <table className="w-full border border-collapse border-black">
//                 <thead>
//                   <tr className="bg-gray-200 border border-black">
//                     <th className="px-4 py-2 border border-black">#</th>
//                     <th className="px-4 py-2 border border-black">Store Name</th>
//                     <th className="px-4 py-2 border border-black">Role Name</th>
//                     <th className="px-4 py-2 border border-black">Description</th>
//                     <th className="px-4 py-2 border border-black">Permissions</th>
//                     <th className="px-4 py-2 border border-black">Action</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {currentRoles.length > 0 ? (
//                     currentRoles.map((role, index) => (
//                       <tr key={role._id} className="border-b">
//                         <td className="px-4 py-2 border border-black">
//                           {(currentPage - 1) * itemsPerPage + index + 1}
//                         </td>
//                         <td className="px-4 py-2 border border-black">
//                           {role.storeName || "N/A"}
//                         </td>
//                         <td className="px-4 py-2 border border-black">
//                           {role.roleName || "N/A"}
//                         </td>
//                         <td className="px-4 py-2 border border-black">
//                           {role.description || "No description"}
//                         </td>
//                         <td className="px-4 py-2 border border-black">
//                           {role.permissions && role.permissions.length > 0 ? (
//                             role.permissions.map((perm, permIndex) => (
//                               <div key={permIndex}>
//                                 <strong>{perm.module}:</strong> {perm.actions.join(", ")}
//                               </div>
//                             ))
//                           ) : (
//                             <span>No Permissions</span>
//                           )}
//                         </td>
//                         <td className="px-4 py-2 border border-black">
//                           <button
//                                                    className="px-2 py-1 text-sm text-white bg-cyan-500"
//                                                    onClick={() => setActionMenu(role._id)}
//                                                  >
//                                                    Action ▼
//                                                  </button>
//                                                  {actionMenu===role._id &&(
//                                                    <div className="absolute z-40 bg-white border shadow-lg w-28">
//                                                    <Link to={`/admin/create/list?id=${role._id}`} className="w-full px-2 py-0 text-left no-underline hover:bg-gray-100">
//                                                      ✏️ Edit
//                                                    </Link>
//                                                    <button
//                                                      className="w-full px-1 py-0 text-left text-red-500 hover:bg-gray-100"
//                                                      onClick={() => deleteRole(role._id)}
//                                                    >
//                                                      🗑️ Delete
//                                                    </button>
//                                                  </div>
//                                                  )}
                                                   
//                         </td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan={6} className="px-4 py-2 text-center">
//                         No roles available
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//               <div className="flex justify-center mt-4">
//                 {Array.from({ length: totalPages }, (_, index) => index + 1).map(
//                   (pageNumber) => (
//                     <button
//                       key={pageNumber}
//                       className={`mx-2 px-4 py-2 rounded ${
//                         currentPage === pageNumber
//                           ? "bg-blue-500 text-white"
//                           : "bg-gray-200 text-gray-700"
//                       }`}
//                       onClick={() => handlePageChange(pageNumber)}
//                     >
//                       {pageNumber}
//                     </button>
//                   )
//                 )}
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RoleList;

import React, { useEffect, useState } from 'react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { BiChevronRight } from 'react-icons/bi';
import { FaTachometerAlt } from 'react-icons/fa';
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import { Link, useNavigate, NavLink } from 'react-router-dom';
import axios from 'axios';
import LoadingScreen from '../../Loading.jsx';
const RoleList = () => {
  const navigate=useNavigate();  
  const [entries, setEntries] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const[status,setStatus]=useState([])
    const[loading,setLoading]=useState(false)
    const [expenses, setExpenses] = useState([]);
    const[searchTerm,setSearchTerm]=useState("")
     useEffect(()=>{
        if(window.innerWidth < 768){
          setSidebarOpen(false)
        }
      },[])
const fetchRoles=async ()=> {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No token found. Redirecting to login...");
    navigate("/");
    return;
  }
setLoading(true)
  try {
    const response = await axios.get(
      "https://mybackend-l7om.onrender.com/admincreatingrole/api/roles",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("API Response:", response.data);
   setExpenses(response.data.roles)
   
  } catch (error) {
    console.error("Error fetching roles:", error.response?.data || error.message);
  } finally {
    setLoading(false);
  }
}
useEffect(()=>{
  fetchRoles();
  console.log(expenses)
},[])
const filteredData = expenses.filter(item => {
  const searchTermLower = searchTerm.toLowerCase().trim(); // Ensure no spaces cause issues

  // Make sure these fields exist before calling toLowerCase()
  const userNameMatch = item.roleName.toLowerCase().includes(searchTermLower) ?? false;
  
  // Return true if any match
  return searchTermLower === "" || userNameMatch
});

   
    const [showActions, setShowActions] = useState(null);

    const totalPages = Math.ceil(filteredData.length / entries);

    const handleCopy = () => {
        const data = filteredData.map(exp => `${exp.roleName}, ${exp.description}, ${status.find((item)=>item===exp._id)? 'Active' : 'InActive'}`).join('\n');
        navigator.clipboard.writeText(data);
        alert("Data copied to clipboard!");
    };

    const handleExcelDownload = () => {
        const ws = XLSX.utils.json_to_sheet(filteredData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "roles");
        XLSX.writeFile(wb, "roleslist.xlsx");
    };

    const handlePdfDownload = () => {
        const doc = new jsPDF();
        doc.text("Roles List", 20, 20);
        const tableData = filteredData.map(exp => [exp.roleName, exp.description, status.find((item)=>item ===exp._id) ? 'InActive' : 'Active']);
        autoTable(doc, {
            head: [['Role Name', 'Description', 'Status']],
            body: tableData,
        });
        doc.save('roles.pdf');
    };

    const handlePrint = () => {
        window.print();
    };

    const handleCsvDownload = () => {
        const csvContent = "data:text/csv;charset=utf-8," + filteredData.map(exp => Object.values(exp).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "roleList.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const handleDeleteClick =async (id) => {
      const conf= window.confirm("Do u want to delete ")
      if(!conf){
        return ;
      }
      setLoading(true)
      try {
        const response = await axios.delete(`https://mybackend-l7om.onrender.com/admincreatingrole/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
      
       alert("Deleted Successfully")
      fetchRoles();
      } catch (error) {
        console.error( error.message);
      }
      finally{
        setLoading(false)
      }
    };

    const toggleShowActions = (id) => {
        setShowActions(showActions === id ? null : id);
    };

    if(loading) return(<LoadingScreen />)
    return (
        <div className="flex flex-col h-screen">
            <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
            <div className="flex flex-grow">
                <Sidebar isSidebarOpen={isSidebarOpen} />
                <main className={`flex-grow  flex flex-col p-2 md:p-2 min-h-screen overflow-x-hidden`}>
                    <header className="flex flex-col items-center justify-between p-4 mb-2 bg-gray-100 rounded-md shadow md:flex-row">
                     <div className="flex items-center gap-1 text-center sm:flex-row sm:text-left">
                     <h1 className="text-lg font-semibold truncate sm:text-xl">Roles List</h1>
                     <span className="text-xs text-gray-600 sm:text-sm">View/Search Items Category</span>
               </div>
                        <nav className="flex items-center justify-start text-xs text-gray-500 sm:text-sm">
                        <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-gray-800">
                <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
              </NavLink>
                            <BiChevronRight className="inline mx-1 sm:mx-2" />
                          <NavLink className="text-gray-500 no-underline hover:text-gray-800" to="/admin/role/list">
                            Role List
                          </NavLink>
                        </nav>
                    </header>
                    <section className="p-1 bg-white border-t-4 rounded-lg shadow-md border-cyan-500">
                    <header className="flex items-center justify-between mb-4">
                <div></div>
                 <Link to='/admin/create/list'>
                <button className="px-4 py-2 mt-2 text-white rounded bg-cyan-500">+ Create Role</button>
              </Link>
            </header>
                        <div className="flex flex-col justify-between mb-2 space-y-1 md:flex-row md:space-y-0 md:items-center">
                            <div className="flex items-center space-x-2">
                                <span className="text-sm">Show</span>
                                <select className="p-2 text-sm border border-gray-300" value={entries} onChange={(e) => setEntries(Number(e.target.value))}>
                                    <option>10</option>
                                    <option>20</option>
                                    <option>50</option>
                                </select>
                                <span className="text-sm">Entries</span>
                            </div>
                            <div className="flex justify-end flex-1 gap-1 mt-2 mb-2 ">
                            <button onClick={handleCopy} className="w-full px-3 py-2 text-sm text-white bg-cyan-500 lg:w-auto">Copy</button>
                <button onClick={handleExcelDownload} className="w-full px-3 py-2 text-sm text-white bg-cyan-500 lg:w-auto">Excel</button>
                <button onClick={handlePdfDownload} className="w-full px-3 py-2 text-sm text-white bg-cyan-500 lg:w-auto">PDF</button>
                <button onClick={handlePrint} className="w-full px-3 py-2 text-sm text-white bg-cyan-500 lg:w-auto">Print</button>
                <button onClick={handleCsvDownload} className="w-full px-3 py-2 text-sm text-white bg-cyan-500 lg:w-auto">CSV</button>
                                <input type="text" placeholder="Search" className="w-full p-2 text-sm border border-gray-300 " onChange={(e)=>setSearchTerm(e.target.value)}/>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-300">
                                <thead className="bg-gray-200">
                                    <tr>
                                        <th className="px-3 py-2 text-sm text-center border">#</th>
                                        <th className="px-3 py-2 text-sm text-center border">Role Name</th>
                                        <th className="px-3 py-2 text-sm text-center border">Description</th>
                                        <th className="px-3 py-2 text-sm text-center border">Status</th>
                                        <th className="py-2 text-sm text-center border ">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredData.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-4 text-center">No data available in table</td>
                                        </tr>
                                    ) : (
                                        filteredData.slice((currentPage - 1) * entries, currentPage * entries).map((expense, index) => (
                                            <tr key={expense._id} className="hover:bg-gray-100">
                                                <td className="text-sm text-center border ">{index+1}</td>
                                                <td className="text-sm text-center border ">{expense.roleName}</td>
                                                <td className="text-sm text-center border ">{expense.description}</td>
                                                <td
                                                               className="text-center border cursor-pointer sm:px-4 sm:py-2"
                                                               onClick={() =>
                                                     setStatus((prev) =>
                                                    prev.includes(expense._id)
                                                    ? prev.filter((id) => id !== expense._id) // Remove if already present
                                                 : [...prev, expense._id] // Add if not present
                                                   )
                                                      }
                                                                >
                                                             {status.includes(expense._id) ? (
                                                                <span className="p-1 text-white bg-red-700 rounded-md">Inactive</span>
                                                                  ) : (
                                                        <span className="p-1 text-white bg-green-400 rounded-md">Active</span>
                                                        )}
                                                  </td>

                                                  <td className="relative flex items-center justify-center py-2 text-sm text-center border">
  {/* Action Button */}
  <button
    className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-white transition-all duration-200 ease-in-out rounded-full shadow bg-cyan-600 hover:bg-cyan-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-400"
    onClick={() => toggleShowActions(expense._id)}
  >
    Actions
    <svg
      className={`w-4 h-4 transition-transform duration-200 ${
        showActions === expense._id ? "rotate-180" : ""
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  {/* Dropdown */}
  {showActions === expense._id && (
    <div className="absolute right-0 z-50 mt-2 overflow-hidden bg-white border border-gray-200 rounded-md shadow-lg top-full w-36 animate-fade-in">
      <Link
        to={`/admin/create/list?id=${expense._id}`}
        className="block w-full px-4 py-2 text-sm text-left text-gray-700 no-underline transition hover:bg-gray-100 hover:text-cyan-600"
      >
        ✏️ Edit
      </Link>
      <button
        onClick={() => handleDeleteClick(expense._id)}
        className="block w-full px-4 py-2 text-sm text-left text-red-600 transition hover:bg-gray-100"
      >
        🗑️ Delete
      </button>
    </div>
  )}
</td>



                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-col items-center justify-between mt-4 md:flex-row">
                            <span>Showing {entries * (currentPage - 1) + 1} to {Math.min(entries * currentPage, expenses.length)} of {expenses.length} entries</span>
                            <div>
                                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} className="px-4 py-2 mr-2 text-gray-600 bg-gray-300 disabled:opacity-50" disabled={currentPage === 1}>
                                    Previous
                                </button>
                                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} className="px-4 py-2 text-gray-600 bg-gray-300 disabled:opacity-50" disabled={currentPage === totalPages}>
                                    Next
                                </button>
                            </div>
                        </div>
                       
                    </section>
                </main>
            </div>
        </div>
    );
};

export default RoleList;

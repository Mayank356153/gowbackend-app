import React from 'react'
import Select from 'react-select'
import { useState,useEffect } from 'react'
import axios, { all } from 'axios'
import { useNavigate } from 'react-router-dom'
import Navbar from "../Navbar.jsx";
import Sidebar from '../Sidebar.jsx'
import Button from '../contact/Button.jsx'
import { NavLink } from 'react-router-dom'
import { FaTachometerAlt } from 'react-icons/fa'
import { FiEdit, FiTrash2 } from 'react-icons/fi'
import ItemsCompare from './ItemsCompare.jsx'

const  OpenAuditList=()=> {
  const link="https://pos.inspiredgrow.in/vps"
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [comparison,setComparison]=useState(false)
    const[items,setItems]=useState([])
    const [audits,setAudits]=useState([])
     useEffect(()=>{
        if(window.innerWidth < 768){
          setSidebarOpen(false)
        }
      },[window.innerWidth])

      const  navigate=useNavigate();
      
    useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${link}/api/audit/compare-items`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        console.log(response.data.data);
        setAudits(response.data.data);
      } catch (err) {
        console.error("Fetch audit error:", err.message);
      }
    };

    fetchData();
  }, []);
 
   const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${link}/api/audit/compare-items`, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        console.log(response.data.data);
        setAudits(response.data.data);
      } catch (err) {
        console.error("Fetch audit error:", err.message);
      }
    };
    
  const handleDelete = async (id) => {
    const conf= window.confirm("Do u want to delete customer")
    if(!conf){
      return ;
    }
  
   
    try {
     const response = await axios.delete(`${link}/api/audit/delete/${id}`,{
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    
     alert("Deleted Successfully")
    
    } catch (error) {
      console.error( error.message);
    }
    finally{

      fetchData()
    }
  };

  const handleAuditEnd=async(id)=>{
    try {
        const token = localStorage.getItem("token");
        const response = await axios.put(`${link}/api/audit/end`,{
            auditId:id
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });
        console.log(response)
            
            alert("Audit End sucessfully")
            fetchData();
            return;
        
      } catch (err) {
        console.error("error in  audit  end :", err.message);
      }
  }

  const handleDeleteAudit=async(id)=>{
     const conf= window.confirm("Do u want to delete audit")
    if(!conf){
      return ;
    }
  
   
    try {
      const response = await axios.delete(`${link}/api/audit/delete`, {
        id:id
      },{
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
 console.log(response)
     alert("Deleted Successfully")
    
    } catch (error) {
      console.error( error.message);
    }
    finally{

      fetchData()
    }
  }



    
     
     
  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex ">

        <Sidebar isSidebarOpen={isSidebarOpen} />
          
           {/* Content */}
         <div className={`w-full flex flex-col p-2 md:p-2  `}>
          <header className="flex flex-col items-center justify-between p-4 rounded-md shadow sm:flex-row">
            <div className="flex items-center gap-1 text-center sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">Open Audit List</h1>
              {/* <span className="text-xs text-gray-600 sm:text-sm">Add/Update Banner</span> */}
            </div>

            <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
   <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                            <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
                          </NavLink>     
                          <NavLink to="/banners/view" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                           &gt; Start Audit
                          </NavLink>    
                          <NavLink to="/banners/add" className="text-gray-700 no-underline hover:text-cyan-600">
                           &gt; Open Audit List
                          </NavLink>
              
            </nav>
          </header>
           {
            comparison && <ItemsCompare  audit={items} onClose={()=>{setComparison(false);fetchData()}} sidebarOpen={isSidebarOpen}/>
            // <AuditComparison auditItems={items} onClose={()=>setComparison(false)}/>
          } 

          <div className="p-4 mt-1 bg-white border-t-4 rounded-lg shadow-md border-cyan-500">
            
          {/* <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className=" bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Audit ID
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Total Items
                </th>
                <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
           <tbody className="bg-white divide-y divide-gray-200">
  {audits.map((audit) => (
    <tr key={audit.auditId}>
      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
        {audit.auditId}
      </td>
      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
        {audit.finalUnit?.length || 0} items
      </td>
      <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
        <button 
          className="mr-4 text-indigo-600 hover:text-indigo-900"
          onClick={() => {
            setItems(audit)
            setComparison(true)
          }}
        >
          View Comparison
        </button>
         <button 
    className="mr-4 text-green-600 hover:text-green-900"
    onClick={() => handleAuditEnd(audit.auditId)}  // <-- Add handler
  >
    End Audit
  </button>

        <button 
          className="text-red-600 hover:text-red-900"
        //   onClick={() => handleDeleteAudit(audit.id)}
        >
          Delete
        </button>
      </td>
    </tr>
  ))}
</tbody>
          </table>
          
        
         
        </div> */}
        
       <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
  {/* Desktop Table */}
  <table className="min-w-full divide-y divide-gray-200 ">
    <thead className="bg-gray-50">
      <tr>
        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Audit ID</th>
        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Total Items</th>
        <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Actions</th>
      </tr>
    </thead>
    <tbody className="hidden bg-white divide-y divide-gray-200 md:table">
      {audits.map((audit) => (
        <tr key={audit.auditId}>
          <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{audit.auditId}</td>
          <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{audit.finalUnit?.length || 0} items</td>
          <td className="px-6 py-4 space-x-4 text-sm font-medium whitespace-nowrap">
            <button 
              className="text-indigo-600 hover:text-indigo-900"
              onClick={() => {
                setItems(audit)
                setComparison(true)
              }}
            >
              View
            </button>
            <button 
              className="text-green-600 hover:text-green-900"
              onClick={() => handleAuditEnd(audit.auditId)}
            >
              End
            </button>
            <button 
              className="text-red-600 hover:text-red-900"
              onClick={() => handleDeleteAudit(audit.auditId)}
            >
              Delete
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>

  {/* Mobile Cards */}

    {audits.map((audit) => (
      <div key={audit.auditId} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="mb-2 text-sm font-medium text-gray-700">Audit ID:</div>
        <div className="mb-1 text-base font-semibold text-gray-900 break-all">{audit.auditId}</div>

        <div className="mb-3 text-sm text-gray-600">
          Total Items: {audit.finalUnit?.length || 0}
        </div>

        <div className="flex justify-start space-x-4">
          <button 
            className="text-sm text-indigo-600 hover:text-indigo-900"
            onClick={() => {
              setItems(audit)
              setComparison(true)
            }}
          >
            View
          </button>
          <button 
            className="text-sm text-green-600 hover:text-green-900"
            onClick={() => handleAuditEnd(audit.auditId)}
          >
            End
          </button>
          <button 
            className="text-sm text-red-600 hover:text-red-900"
            onClick={() => handleDeleteAudit(audit.auditId)}
          >
            Delete
          </button>
        </div>
      </div>
    ))}
    
</div>

 

                       
         
                
                 
            </div>
            
          </div>
        </div>
      </div>
  )
}

export default OpenAuditList

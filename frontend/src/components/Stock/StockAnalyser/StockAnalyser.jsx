import React from 'react'
import Select from 'react-select'
import { useState,useEffect } from 'react'
import axios, { all } from 'axios'
import Navbar from "../../Navbar.jsx";
import Sidebar from "../../Sidebar.jsx";
import Button from '../../contact/Button.jsx'
import { NavLink } from 'react-router-dom'
import { FaTachometerAlt } from 'react-icons/fa'



const  StockAnalyser=()=> {
      const link="https://pos.inspiredgrow.in/vps"
      // const link="http://localhost:5000"
      const authHeaders = () => {
        const token = localStorage.getItem("token");
        return {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };
      };
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [selectedMonth,setSelectedMonth]=useState(0)
    const [options,setOptions]=useState({
      warehouses:[],
    })
     useEffect(()=>{
        if(window.innerWidth < 768){
          setSidebarOpen(false)
        }
      },[window.innerWidth])



      async function fetchData(){
         try {
          
      const { data } = await axios.get(
        `${link}/api/warehouses?scope=mine`,
        authHeaders()
        );
           const warehouseFormat = data.data.map(wh =>({
            label:wh.warehouseName,
            value:wh._id
           }))
           setOptions(prev=>({
            ...prev,
            warehouses:[{
              label:"All",
              value:"all"
            },...warehouseFormat]
           }))
        console.log("✅ warehouses loaded", data);
       } catch (err) {
        console.error("❌ failed to load warehouses", err);
       }

        try {
      const { data } = await axios.get(
        `${link}/api/pos/club`,
        authHeaders()
        );
        console.log("✅ pos clubs loaded", data);
       } catch (err) {
        console.error("❌ failed to load pos clubs", err);
       }

       try {
      const { data } = await axios.get(
        `${link}/api/stock-transfers`,
        authHeaders()
        );
        console.log("✅ stock transfers loaded", data);
       } catch (err) {
        console.error("❌ failed to load stock transfers", err);
       }

      }

      useEffect(()=>{
        fetchData();
      },[])



  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow ">

        <Sidebar isSidebarOpen={isSidebarOpen} />
          
           {/* Content */}
         <div className={`w-full flex flex-col p-2 md:p-2  `}>
          <header className="flex flex-col items-center justify-between sm:flex-row">
            <div className="flex items-center gap-1 text-center sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">Stock Analyser</h1>
            </div>

            <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
                          <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                            <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
                          </NavLink>     
                          <NavLink to="/stock-analyser" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                           &gt; Stock Analyser
                          </NavLink>    
            </nav>
          </header>

          <div className='flex flex-col w-full h-full gap-4 p-2 bg-gray-100'>
              
          
                <div className='w-1/2'>
                <label htmlFor="warehouse-select" className="block text-sm font-medium text-gray-700">
                  Select Warehouse
                </label>
                <Select options={options.warehouses} />
                </div>

              <div className="w-1/2 mt-2">
  <label htmlFor="month-select" className="block text-sm font-medium text-gray-700">
    Month
  </label>

  {/* Quick Select Buttons + Input */}
  <div className="flex items-center gap-2 mt-2">
    <button
      className={`px-3 py-1 text-sm   rounded-lg ${selectedMonth===1 ? 'hover:bg-blue-600 bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`} 
      onClick={() => setSelectedMonth(1)}
    >
      1 Month
    </button>
    <button
      className={`px-3 py-1 text-sm   rounded-lg ${selectedMonth===2 ? 'hover:bg-blue-600 bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`} 
      onClick={() => setSelectedMonth(2)}
    >
      2 Months
    </button>
    <button
            className={`px-3 py-1 text-sm   rounded-lg ${selectedMonth===3 ? 'hover:bg-blue-600 bg-blue-500 text-white' : 'bg-white hover:bg-gray-100'}`} 
      onClick={() => setSelectedMonth(3)}
    >
      3 Months
    </button>

    {/* Custom Input Field */}
    <input
      type="number"
      min="1"
      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      placeholder="Custom"
      onChange={(e) => setSelectedMonth(Number(e.target.value))}
    />
  </div>
</div>

                
          
            
          </div>

          
          </div>
        </div>
      </div>
  )
}

export default StockAnalyser

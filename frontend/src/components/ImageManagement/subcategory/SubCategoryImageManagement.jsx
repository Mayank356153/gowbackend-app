import React from 'react'
import Select from 'react-select'
import { useState,useEffect ,useRef} from 'react'
import axios, { all } from 'axios'
import { useNavigate } from 'react-router-dom'
// import Navbar from "../Navbar.jsx";
import Navbar from "../../Navbar.jsx"
import { NavLink } from 'react-router-dom'
import { FaTachometerAlt } from 'react-icons/fa'
import { CameraIcon } from '@heroicons/react/solid'
import { BrowserMultiFormatReader } from "@zxing/library";
import Sidebar from '../../Sidebar.jsx'
import SubCategoryMasterImage from './SubCategoryMasterImage.jsx'
import OneSubCategoryMaster from './OneSubCategoryMaster.jsx'
const  SubCategoryImageManagement=()=> {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const[allCategory,setAllCategory]=useState([])
   const[category,setCategory]=useState({})
    const [master,setMaster]=useState(false)
    const [onemaster,setOneMaster]=useState(false)
    const[categoryid,setCategoryId]=useState(null)
    const[selectedItem,setSelectedItem]=useState({})
     useEffect(()=>{
        if(window.innerWidth < 768){
          setSidebarOpen(false)
        }
      },[window.innerWidth])
    
    
     


     const fetchItems = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/items/getWithsubCategory',{
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                  }});

                  
            // console.log(response.data);
            
setAllCategory(Object.keys(response.data.data));
setCategory(response.data.data)

} catch (error) {
            console.error("Error fetching stores:", error);
        }
     }


     const fetchCats = async () => {
        try {
            console.log("asd")
            const response = await axios.get('http://localhost:5000/api/items/getImageBySubCategory',{
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                  }});

                  
                  console.log(("Items"))
            console.log(response.data);
  

} catch (error) {
            console.error("Error fetching stores:", error);
        }
     }
     
     useEffect(()=>{
      fetchItems();
      fetchCats();
     },[])


     const handleGenreateMAsterImage=async(e)=>{
      e.preventDefault();
       try {
            console.log("asd")
            const response = await axios.get('http://localhost:5000/api/items/getImageBySubCategory',{
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                  }});
            console.log(response.data);
  

} catch (error) {
            console.error("Error fetching stores:", error);
        }
     }
     

   
           

           
             

            
           















  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow ">
         <div>
          
        <Sidebar isSidebarOpen={isSidebarOpen} />
         </div>
          
           {/* Content */}
         <div className={` flex flex-col p-2 md:p-2  w-full`}>
          <header className="flex flex-col items-center justify-between p-4 rounded-md shadow sm:flex-row">
            <div className="flex items-center gap-1 text-center sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">SubCategory Master Image</h1>
          
            </div>

            <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
   <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                            <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
                          </NavLink>     
                          <NavLink to="/banners/view" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                           &gt; SubCategory Master Image
                          </NavLink>    
                         
              
            </nav>
          </header>

         

          <div className="p-4 mt-1 bg-white border-t-4 rounded-lg shadow-md border-cyan-500">
 
               
                 <div className="flex gap-5">

                    
                  <div className="relative flex flex-col w-full py-2">
                                    <button
              onClick={() => {
setMaster(true)
setSidebarOpen(false)
              }}
              className='px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700'
            >
              Generate Master Image
            </button>
                                   {
            master && <SubCategoryMasterImage    onClose={() => 
              {
               setSidebarOpen(true)
               setMaster(false) 
              }
            } />
          }
 {
            onemaster && <OneSubCategoryMaster                 subcategoryId={categoryid}
   onClose={() => 
              {
                               setSidebarOpen(true)

               setOneMaster(false) 
              }
            } />
          }
          
                
                 
                                     </div>


                  
                 </div>
  
    

                    

                        
                    <div className='w-full mt-4 overflow-x-auto min-h-16'>
  <table className='min-w-full border-2 divide-y divide-gray-200 min-h-48'>
    <thead className='sticky top-0 bg-gray-200'>
      <tr>
        <th className='py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>SubCategory Id</th>
        <th className='py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase'>Actions</th>
      </tr>
    </thead>
    <tbody className='bg-white divide-y divide-gray-200'>
      {allCategory.map((categoryId, index) => (
        <tr key={index}>
          <td className='py-4 text-sm text-gray-500 whitespace-nowrap'>{categoryId}</td>
          <td className='py-4 text-sm text-gray-500 whitespace-nowrap'>
            <button
              onClick={() =>{
                setSidebarOpen(false)
                setCategoryId(categoryId)
                setOneMaster(true)
              }}
              className='px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700'
            >
              Generate Master Image
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


                
                 
            </div>
          </div>
        </div>
      </div>
  )
}

export default SubCategoryImageManagement

// src/components/CreateUser.jsx
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import LoadingScreen from "../../Loading";
import { FaTachometerAlt } from "react-icons/fa";
import { BiChevronRight } from "react-icons/bi";
import DocumentView from "./DocumentView";
const CreateRider = () => {
              const link="https://pos.inspiredgrow.in/vps"
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");      // for editing existing user
  const role = localStorage.getItem("role");  // "admin" or "storeAdmin"
  const assignedStore = localStorage.getItem("storeId"); // set at login for store‑admins

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);
  const[view,setView]=useState(false)
   const[show,setShow]=useState("")
//   // master data
  const [roles, setRoles] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stores, setStores] = useState([]);

//   // tag‑group picks
  const [warehouseGroup, setWarehouseGroup] = useState([]);
  const [defaultWarehouse, setDefaultWarehouse] = useState("");
  const [storeGroup, setStoreGroup] = useState(
    role === "storeAdmin" && assignedStore ? [assignedStore] : []
  );

  const [password, setPassword] = useState("");
  const [confPassword, setConfPassword] = useState("");


  // const submit = async e => {
  //   e.preventDefault();
  //   setLoading(true);
   
  //   try {
    
  //     if (editId) {
  //       await axios.put(`https://mybackend-l7om.onrender.com/admiaddinguser/${editId}`, formData ,
  //         {
  //           headers: {
  //             Authorization: `Bearer ${localStorage.getItem("token")}`,
  //              'Content-Type': 'multipart/form-data',
  //           },
  //         }
  //       );
  //       alert("User updated");
  //     } else {
  //      const res= await axios.post("http://localhost:5000/api/rider/create", formData, {
  //         headers: {
  //             Authorization: `Bearer ${localStorage.getItem("token")}`,
  //                'Content-Type': 'multipart/form-data',
  //           },
  //      });
  //       alert("User created");
  //       console.log(res)
  //     }
      
      
  //   } catch (err) {
  //     console.log(err)
  //     alert(err.response?.data?.message || err.message);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

// const submit = async (e) => {
//   e.preventDefault();
//   setLoading(true);

  
//   try {
//     if (editId) {
//       await axios.put(`https://mybackend-l7om.onrender.com/admiaddinguser/${editId}`, formData, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       });
//       alert("User updated");
//     } else {
//       console.log(formData)
//       const res = await axios.post("http://localhost:5000/api/rider/create", formData, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       });
//       alert("User created");
//       console.log(res);
//     }
//   } catch (err) {
//     console.log(err);
//     alert(err.response?.data?.message || err.message);
//   } finally {
//     setLoading(false);
//   }
// };

const submit = async (e) => {
  e.preventDefault();
  setLoading(true);
  if(editId){
    alert("Updated")
    setLoading(false)
    return;
  }

  try {
    // Construct FormData
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((file) => {
          data.append(key, file);  // send all files with same name
        });
      } else {
        data.append(key, value);
      }
    });

    const url = editId
      ? `${link}/admiaddinguser/${editId}`
      : `${link}/api/rider/create`;

    const method = editId ? "put" : "post";

    const response = await axios({
      method,
      url,
      data,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        "Content-Type": "multipart/form-data", // Important!
      },
    });

    alert(editId ? "User updated" : "User created");
    console.log(response.data);
  } catch (err) {
    console.error(err);
    alert(err.response?.data?.message || err.message);
  } finally {
    setLoading(false);
  }
};

  useEffect(()=>{
  if(password===confPassword){
    setFormData((prev)=>({
      ...prev,
      password:password
    }))
    return;
  }
   setFormData((prev)=>({
      ...prev,
      password:""
    }))
},[password,confPassword])


 const[isSidebarOpen,setSidebarOpen]=useState(true)
 const[loading,setLoading]=useState(false)
  const[formData,setFormData]=useState({
    profileImage:[],
    store:"",
    username:"",
    firstname:"",
    lastname:"",
    mobile:"",
    email:"",
    role:"68246746fe2677457bad4246",
    password:"",
    status:"Active",
    bankAccountNumber:"",
    ifscCode:"",
    bankName:"",
    addharCardImage:[],
    addharCardNumber:"",
    panCardImage:[],
    panCardNumber:"",
    drivingLicenseImage:[],
    drivingLicenseNumber:"",
    riderAccountNumber:"",
    riderAccountOpeningBalance:0
  })

  const handleChange=(e)=>{
    const{name,value}=e.target
    setFormData((prev)=>({
        ...prev,
        [name]:value
    }))
  }

const handleFile = (e) => {
  const { name, files } = e.target;
  setFormData((prev) => ({
    ...prev,
    [name]: [...(prev[name] || []), files[0]], // Append file
  }));
};


function generateNextCode(currentCode) {
  const parts = currentCode.split('-');
  
  if (parts.length !== 3) {
    throw new Error("Invalid code format. Expected format: PREFIX-YEAR-NUMBER");
  }

  const [prefix, year, number] = parts;
  const newNumber = String(parseInt(number) + 1).padStart(number.length, '0');

  return `${prefix}-${year}-${newNumber}`;
}


useEffect(()=>{


  const fetchrider=async ()=>{
 try {
    const res=await axios.get(`${link}/api/rider/all`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    
    const last=res.data.data[res.data.data.length-1]
    console.log(last)
    setFormData((prev)=>({
      ...prev,
      riderAccountNumber:"RIDER-2025-004"
    }))
  } catch (error) {
    console.log("Error in fetching Rider",error.message)
  }
  }
 fetchrider();
},[])

  

  
  // fetch lookups
  useEffect(() => {
    setLoading(true)
    const token = localStorage.getItem("token");
    if (!token) return navigate("/");

    const headers = { Authorization: `Bearer ${token}` };

    axios.get(`${link}/admincreatingrole/api/roles`, { headers })
      .then(r => setRoles(r.data.roles || []))
      .catch(() => { /* handle auth redirect if 401 */ });

    axios.get(`${link}/api/warehouses`, { headers })
      .then(r => setWarehouses(r.data.data || []))
      .catch(console.error);

    axios.get(`${link}/admin/store/add/store`, { headers })
      .then(r => setStores(r.data.result || []))
      .catch(console.error);
      setLoading(false)
  }, [navigate]);

  // if editing, load user
  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    axios.get(`${link}/api/rider/all`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
    .then(res => {
      console.log(res)
      const u = res.data.data.find(x => x._id === editId);
      if (!u) return;
     setFormData(u)
     console.log(u)
      setWarehouseGroup((u.WarehouseGroup || "").split(",").filter(x=>x));
      setDefaultWarehouse(u.Defaultwarehouse || "");
      setStoreGroup(u.Store || []);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [editId]);

  useEffect(()=>console.log(formData),[formData])
  
  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <div>
          
        <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>
        {
          view && <DocumentView formData={formData} setView={setView} setFormData={setFormData} show={show}/>
        }
        <form onSubmit={submit} className="flex-grow p-6 overflow-auto bg-gray-100">
          <header className="flex flex-col items-center justify-between mb-4 md:flex-row">
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl font-bold">
                {editId ? "Edit Rider" : "Create Rider"}
              </h1>
              <p className="text-gray-600">{editId ? "Modify details" : "Fill in details"}</p>
            </div>
            <nav className="flex items-center text-gray-500">
              <NavLink to="/dashboard" className="flex items-center text-gray-500 no-underline hover:text-gray-800">
                <FaTachometerAlt className="mr-1"/> Home
              </NavLink>
              <BiChevronRight className="mx-2"/>
              <NavLink to="/rider/list" className="text-gray-500 no-underline hover:text-gray-800">Rider List</NavLink>
            </nav>
          </header>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Left */}
            <div className="space-y-4">
              {[
                { label:"Username", name:"username", req:true },
                { label:"First Name", name:"firstname", req:true },
                { label:"Last Name", name:"lastname", req:true },
                { label:"Mobile", name:"mobile" },
                { label:"Email", name:"email", type:"email", req:true },
                { label:"Bank Account Number", name:"bankAccountNumber", type:"text", req:true },
                { label:"IFSC Code", name:"ifscCode", type:"text", req:true },
                { label:"Bank Name", name:"bankName", type:"text", req:true },
                {label:"Rider Account Number",name:"riderAccountNumber",type:"text",req:true}
              ].map(({ label,name,type="text",req })=>(
                <div key={name}>
                  <label className="block font-semibold">
                    {label}{req && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                  
                    className="w-full p-2 border rounded"
                  />
                </div>
              ))}

              <div>
                <label className="block font-semibold">
                  Role <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value="Delivery rider"
                    readOnly
                    
                    className="w-full p-2 border rounded"
                  />
              </div>

             
            </div>
     
            {/* Right */}
            <div className="space-y-4">
              {/* Warehouse group */}
             
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold">Password<span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    value={password}
                    onChange={e=>setPassword(e.target.value)}
                    
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold">Confirm<span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    value={confPassword}
                    onChange={e=>setConfPassword(e.target.value)}
                    
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold">Default Warehouse</label>
                <select
                  value={formData.store}
                  onChange={e=>setFormData((prev)=>({...prev,store:e.target.value}))}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select</option>
                  {stores.map(w=>(
                    <option key={w._id} value={w._id}>{w.StoreName}</option>
                  ))}
                </select>
              </div>

             

              {/* Profile pic */}
              <div>
  <label className="block mb-2 font-semibold">Profile Picture</label>
  <div className="flex items-center gap-2">
    <input
      type="file"
     name="profileImage"
     onChange={handleFile}
      className="flex-1 p-2 border rounded"
    />
    
    <button  type="button"
      // onClick={() => setView(v => ({...v, profileImage: !v.profileImage}))}
      onClick={()=>{
        setView(true);
        setShow("profileImage");
      }}
      className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 whitespace-nowrap"
    >
      {view.profileImage ? "Hide" : "View"}
    </button>
  </div>
  
 
</div>
              <div>
                  <label className="block font-semibold">Addhar Card Number<span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.addharCardNumber}
                    onChange={handleChange}
                    name="addharCardNumber"
                    
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
  <label className="block font-semibold">Aadhar Card Image<span className="text-red-500">*</span></label>
  <div className="flex items-center gap-2">
    <input
      type="file"
      name="addharCardImage"
      onChange={handleFile}
      
      className="flex-1 p-2 border rounded"
    />
    
    <button 
      // onClick={() => setView(v => ({...v, addharCardImage: !v.addharCardImage}))}
      onClick={()=>{
        setView(true);
        setShow("addharCardImage");
      }}
      className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 whitespace-nowrap"
      type="button"
    >
      {view.addharCardImage ? "Hide" : "View"}
    </button>
  </div>
</div>


            <div>
                  <label className="block font-semibold">PanCard Number<span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.panCardNumber}
                    onChange={handleChange}
                   
                    name="panCardNumber"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
  <label className="block font-semibold">PanCard Image<span className="text-red-500">*</span></label>
  <div className="flex items-center gap-2">
    <input
      type="file"
      name="panCardImage"
      onChange={handleFile}
    
      className="flex-1 p-2 border rounded"
    />
    
    <button 
      // onClick={() => setView(v => ({...v, panCardImage: !v.panCardImage}))}
      onClick={()=>{
        setView(true);
        setShow("panCardImage");
      }}
      className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 whitespace-nowrap"
      type="button"
    >
      {view.panCardImage ? "Hide" : "View"}
    </button>
  </div>
  
  
</div>



            
            <div>
                  <label className="block font-semibold">Driving License Number<span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.drivingLicenseNumber}
                    onChange={handleChange}
                    
                    name="drivingLicenseNumber"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
  <label className="block font-semibold">Driving License Image<span className="text-red-500">*</span></label>
  <div className="flex items-center gap-2">
    <input
      type="file"
      name="drivingLicenseImage"
      onChange={handleFile}
      
      className="flex-1 p-2 border rounded"
    />
    
    <button 
      // onClick={() => setView(v => ({...v, drivingLicenseImage: !v.drivingLicenseImage}))}
      onClick={()=>{
        setView(true);
        setShow("drivingLicenseImage");
      }}
      className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 whitespace-nowrap"
      type="button"
    >
      {view.drivingLicenseImage ? "Hide" : "View"}
    </button>
  </div>
  
</div>


 <div>
                  <label className="block font-semibold">Rider Account OpeningBalance</label>
                  <input
                    type="Number"
                    value={formData.riderAccountOpeningBalance}
                    onChange={handleChange}
                    min='0'
                    name="riderAccountOpeningBalance"
                    className="w-full p-2 border rounded"
                  />
                </div>
          </div>
         </div>
          {/* buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <button className="px-8 py-2 text-white bg-green-600 rounded">
              {editId ? "Update" : "Save"}
            </button>
            <button
              type="button"
              onClick={()=>navigate("/admin/user/list")}
              className="px-8 py-2 text-white bg-orange-500 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
    
  );
};

export default CreateRider;

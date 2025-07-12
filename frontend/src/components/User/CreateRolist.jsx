import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import { useSearchParams } from "react-router-dom";
import LoadingScreen from "../../Loading";
const CreateRolelist = () => {
          const link="https://pos.inspiredgrow.in/vps"
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState({});
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [localPermissions, setLocalPermissions] = useState([]);
  const[loading,setLoading]=useState(false)
  const navigate = useNavigate();
   const [searchParams] = useSearchParams();
  const id=searchParams.get("id")
  const[send,setSend]=useState(false)
  const[update,setUpdate]=useState(false)
  useEffect(()=>{
     if(window.innerWidth < 768){
       setSidebarOpen(false)
     }
   },[])
  useEffect(() => {
    const fetchRoles = async () => {
      setLoading(true);
      
      if (!id){
        setLoading(false)
        return; // Ensure the function runs but exits early if there's no id
      } 
  
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Redirecting to login...");
        navigate("/");
        return;
      }
  
      try {
        const response = await axios.get(
          `${link}/admincreatingrole/api/roles`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
  
        console.log("API Response:", response.data);
        const current = response.data.roles.find((role) => role._id === id);
        if (current) {
          setDescription(current.description || "");
          setRoleName(current.roleName || "");
          
          const newPermissions = current.permissions.reduce((acc, item) => {
            acc[item.module] = [...item.actions];
            return acc;
          }, {});
          
          console.log("Fetched permissions:", newPermissions);
          setPermissions(newPermissions);
        } else {
          setPermissions({});
        }
        
        }
       catch (error) {
        console.error("Error fetching roles:", error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };
  
    fetchRoles(); // Always call the function
  }, [id, navigate]); // `id` and `navigate` should be in the dependency array
  
  useEffect(() => {
    const stored = localStorage.getItem("permissions");
    if (stored) {
      try {
        setLocalPermissions(JSON.parse(stored));
      } catch (error) {
        console.error("Error parsing permissions:", error);
        setLocalPermissions([]);
      }
    } else {
      setLocalPermissions([]);
    }
  }, []);

  // Helper function: check if user has a specific action for a module.
  const hasPermissionFor = (module, action) => {
    const userRole = (localStorage.getItem("role") || "guest").toLowerCase();
    if (userRole === "admin") return true;
    return localPermissions.some(
      (perm) =>
        perm.module.toLowerCase() === module.toLowerCase() &&
        perm.actions.map((a) => a.toLowerCase()).includes(action.toLowerCase())
    );
  };

  // If the user doesn't have the "Add" permission for roles, do not render the form.
  if (!hasPermissionFor("roles", "add")) {
    return <div>Insufficient permissions to create roles.</div>;
  }

  // Modules array with all module names from your backend routes
  const modules = [
    { id: 1, name: "AdvancePayment" },
    { id: 2, name: "Brands" },
    { id: 3, name: "Categories" },
    { id: 4, name: "CustomerCoupons" },
    { id: 5, name: "Customers" },
    { id: 6, name: "Coupons" },
    { id: 7, name: "Expenses" },
    { id: 8, name: "Items" },
    { id: 9, name: "PaymentTypes" },
    { id: 10, name: "POSOrders" },
    { id: 11, name: "Purchases" },
    { id: 12, name: "Quotations" },
    { id: 13, name: "Roles" },
    { id: 14, name: "SalesReturn" },
    { id: 15, name: "Sales" },
    { id: 16, name: "Services" },
    { id: 17, name: "StockAdjustments" },
    { id: 18, name: "StockTransfers" },
    { id: 19, name: "Stores" },
    { id: 20, name: "Suppliers" },
    { id: 21, name: "Taxes" },
    { id: 22, name: "TaxGroups" },
    { id: 23, name: "Units" },
    { id: 24, name: "Users" },
    { id: 25, name: "Variants" },
    {id:26,name:"Banners"},
    {id:27,name:"Marketing_Items"},
    {id:28,name:"Product"},
    {id:29,name:"Order"},
    {id:30,name:"Rider"},
    {id:31,name:"Product"}
  ];

  const permissionTypes = ["Add", "Edit", "Delete", "View"];

  const togglePermission = (module, action) => {
    setPermissions((prevPermissions) => {
      const currentModulePermissions = prevPermissions[module.toLowerCase()] || [];
      let newModulePermissions;
      if (currentModulePermissions.includes(action)) {
        newModulePermissions = currentModulePermissions.filter(
          (perm) => perm !== action
        );
      } else {
        newModulePermissions = [...currentModulePermissions, action];
      }
      console.log(`Module ${module.toLowerCase()} now has permissions:`, newModulePermissions);
      return { ...prevPermissions, [module.toLowerCase()]: newModulePermissions };
    });
  };

  const handleSelectAll = (module) => {
    setPermissions((prevPermissions) => {
      const allSelected =
        prevPermissions[module.toLowerCase()]?.length === permissionTypes.length;
      const updatedPermissions = { ...prevPermissions };
      if (allSelected) {
        delete updatedPermissions[module.toLowerCase()];
      } else {
        updatedPermissions[module.toLowerCase()] = [...permissionTypes];
      }
      return updatedPermissions;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login first");
      navigate("/login");
      return;
    }
    if (!roleName.trim()) {
      alert("Role Name is required!");
      return;
    }
    const formattedPermissions = Object.keys(permissions).map((module) => ({
      module: module.toLowerCase().replace(" ", "_"),
      actions: permissions[module],
    }));
    const payload = {
      roleName: roleName.trim(),
      description,
      permissions: formattedPermissions,
    };
    console.log("🚀 Submitting Payload:", payload);
    setLoading(true);
    try {
      if (id) {
        setLoading(true)
        const response = await axios.put(
          `${link}/admincreatingrole/${id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log("✅ Role Updated:", response.data);
        alert("Role updated successfully!");
        setRoleName("");
        setDescription("");
        setPermissions({});
        navigate("/admin/role/list");
      } else {
        const response = await axios.post(
          `${link}/admincreatingrole/api/roles`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log( response.data);
        alert("Role added successfully!");
        setRoleName("");
        setDescription("");
        setPermissions({});
      }
    } catch (error) {
      console.error("❌ Error creating/updating role:", error.response?.data || error.message);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;
  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <div>
          <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>
        <div className="w-full mx-auto">
          <div className="p-8 bg-white rounded-lg shadow-md">
            <h1 className="mb-6 text-2xl font-bold">New Role</h1>
            <form onSubmit={handleSubmit}>
              {/* Role Name */}
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Role Name</label>
                <input
                  type="text"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Enter role name"
                />
              </div>

             

              {/* Description */}
              <div className="mb-4">
                <label className="block mb-2 font-semibold">Description</label>
                <textarea
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter description"
                ></textarea>
              </div>

              {/* Permissions Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full bg-gray-50">
                  <thead>
                    <tr className="bg-gray-300">
                      <th className="px-4 py-2 border">#</th>
                      <th className="px-4 py-2 border">Modules</th>
                      <th className="px-4 py-2 text-center border">Permissions</th>
                      <th className="px-4 py-2 text-center border">Select All</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modules.map((module, index) => (
                      <tr key={module.id}>
                        <td className="px-4 py-2 border">{index + 1}</td>
                        <td className="px-4 py-2 border">{module.name}</td>
                        <td className="px-4 py-2 border">
                          <div className="flex flex-wrap gap-2">
                            {permissionTypes.map((permission) => (
                              <label
                                key={`${module.name}-${permission}`}
                                className="flex items-center space-x-2"
                              >
                                <input
                                  type="checkbox"
                                  checked={
                                    permissions[module.name.toLowerCase()]?.includes(permission) || false
                                  }
                                  onChange={() => togglePermission(module.name, permission)}
                                />
                                <span>{permission}</span>
                              </label>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-center border">
                          <input
                            type="checkbox"
                            checked={
                              permissions[module.name.toLowerCase()]?.length === permissionTypes.length || false
                            }
                            onChange={() => handleSelectAll(module.name)}
                          />
                        </td>
                      </tr>
                    ))}
               

                  </tbody>
                </table>
              </div>

              {/* Submit & Clear Buttons */}
              <div className="flex justify-center gap-10 mt-6">
                <button
                  type="submit"
                  className="bg-green-500 w-[150px] text-white px-4 py-2 rounded-md"
                >
                {send
  ? (update && id ? "Updating" : "Saving")
  : (update && id ? "Update" : "Save")
}

                </button>
                <button
                  type="button"
                  className="bg-orange-500 w-[150px] text-white px-4 py-2 rounded-md"
                  onClick={() => {
                    setRoleName("");
                    setDescription("");
                    setPermissions({});
                  }}
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRolelist;

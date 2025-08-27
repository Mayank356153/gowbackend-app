import React,{useState,useEffect} from 'react';
import { FaArrowLeft } from 'react-icons/fa'; // Make sure to import the icon
import { useNavigate } from 'react-router-dom';
const AccountList2 = ({ accountList, setActive, setSelectedAccount }) => {
  console.log("AccountList2 Rendered with accountList:", accountList);
  const navigate = useNavigate();
  
    const [localPermissions, setLocalPermissions] = useState([]);
  
     
    const userRole = (localStorage.getItem("role") || "guest").toLowerCase();
    const isAdmin = userRole === "admin";
  
  
  
  
     useEffect(() => {
      const storedPermissions = localStorage.getItem("permissions");
      if (storedPermissions) {
        try {
          setLocalPermissions(JSON.parse(storedPermissions));
        } catch (error) {
          console.error("Error parsing permissions:", error);
          setLocalPermissions([]);
        }
      } else {
        setLocalPermissions([]);
      }
    }, []);
  
   const hasPermissionFor = (module, action) => {
      if (isAdmin) return true;
      return localPermissions.some(
        (perm) =>
          perm.module.toLowerCase() === module.toLowerCase() &&
          perm.actions.map((a) => a.toLowerCase()).includes(action.toLowerCase())
      );
    };
  
  return (
    <div className="w-full min-h-screen p-4 bg-gray-100">
      <div className="w-full mx-auto ">
        
        {/* Updated Header with Back Button */}
        <div className="relative flex items-center justify-center mb-6">
         
          
          <h1 className="text-2xl font-bold text-center text-gray-800 sm:text-3xl">
            Account List 🧾
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-8 sm:flex sm:flex-row sm:justify-center">
          <button className="w-full px-4 py-2 font-semibold text-white transition-colors duration-300 bg-green-500 rounded-lg shadow-md hover:bg-green-600" onClick={()=>navigate("/add-account")}>
            + Create Account
          </button>
          <button className="w-full px-4 py-2 font-semibold text-white transition-colors duration-300 bg-green-500 rounded-lg shadow-md hover:bg-green-600" onClick={()=>navigate("/ledger/van-cash/new")}>
            + Van Cash
          </button>
          <button className="w-full px-4 py-2 font-semibold text-white transition-colors duration-300 bg-blue-500 rounded-lg shadow-md hover:bg-blue-600" onClick={()=>navigate("/add-deposit")}>
            Add Deposit
          </button>
          <button className="w-full px-4 py-2 font-semibold text-white transition-colors duration-300 bg-red-500 rounded-lg shadow-md hover:bg-red-600" onClick={()=>navigate("/add-money-transfer")}>
            + Add Money Transfer
          </button>
        </div>

        {/* Account List for Mobile */}
        <div className="block space-y-4 sm:hidden">
          {accountList.map((account, index) => (
            <div 
              key={index} 
              className="p-4 bg-white rounded-lg shadow-lg" 
              onClick={() => {
                setSelectedAccount(account);
                setActive("account3");
              }}
            >
              <p className="text-lg font-bold text-gray-800">{account.accountName || 'N/A'}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default AccountList2;
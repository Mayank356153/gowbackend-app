import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Preferences } from '@capacitor/preferences';

const storeToken = async (name,token) => {
  await Preferences.set({
    key: name,
    value: token,
  });
};



const AdminLogin = () => {
  const [admin, setAdmin] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const[loading,setLoading]=useState(false)

   useEffect(() => {
  const checkToken = async () => {
    const { value: token } = await Preferences.get({ key: "token" });
    const { value: role } = await Preferences.get({ key: "role" });
    const { value: permissions } = await Preferences.get({ key: "permissions" });
    const { value: printerAddress } = await Preferences.get({ key: "printerAddress" });
    const { value: printerAddressName } = await Preferences.get({ key: "printerAddressName" });
    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("permissions", permissions);
      localStorage.setItem("printerAddress", printerAddress);
      localStorage.setItem("printerAddressName", printerAddressName);
      navigate("/dashboard");
    }
  };
  checkToken();
}, []);

  const handleChange = (e) => {
    setAdmin({ ...admin, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { setLoading(true)
      // Make sure withCredentials is set to true
      const res = await axios.post(
        "https://pos.inspiredgrow.in/vps/auth/login",
        admin,
        // { withCredentials: true }
      );
      console.log(res)
      // Store token, role, and permissions in localStorage
      // Store token, role, and permissions in localStorage
localStorage.setItem("token", res.data.token);
localStorage.setItem("role", res.data.role);
await storeToken("token",res.data.token)
await storeToken("role",res.data.role)

// Ensure admin gets full permissions if backend doesn't send them
const defaultAdminPermissions = [
  "manageUsers",
  "viewStores",
  "viewReports",
  "sendMessages",
  "addStore",
  "editStore",
  "VIEW_ROLES" // Add this permission
];

localStorage.setItem(
  "permissions",
  JSON.stringify(res.data.permissions || (res.data.role === "admin" ? defaultAdminPermissions : []))
);

await storeToken("permissions",JSON.stringify(res.data.permissions || (res.data.role === "admin" ? defaultAdminPermissions : [])))

      alert("Login successful!");
      navigate("/dashboard");
    } catch (err) {
      alert("Login failed. Check your credentials.");
    }
    finally{
      setLoading(false)
    }
  };

  return (
   <div className="flex items-center justify-center min-h-screen px-4 bg-gray-100 sm:px-6">
  <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-md sm:max-w-md sm:p-8">
    <h2 className="mb-6 text-xl font-semibold text-center text-gray-700 sm:text-2xl">
      Admin Login
    </h2>
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
          required
          className="w-full p-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base"
        />
      </div>
      <div className="mb-6">
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
          className="w-full p-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 text-sm font-semibold text-white bg-blue-500 rounded-md sm:text-base hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        {loading ? "Logging..." : "Login"}
      </button>
    </form>

  
  </div>
</div>

  );
};

export default AdminLogin;

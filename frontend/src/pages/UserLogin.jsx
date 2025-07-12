import { useState,useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Preferences } from '@capacitor/preferences';

const storeToken = async (name,token) => {
  await Preferences.set({
    key: name,
    value: token,
  });
};

const UserLogin = () => {
  const [user, setUser] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
  const checkToken = async () => {
    const { value: token } = await Preferences.get({ key: "token" });
    const { value: role } = await Preferences.get({ key: "role" });
    const { value: permissions } = await Preferences.get({ key: "permissions" });
    const { value: userId } = await Preferences.get({ key: "userId" });
    const { value: roleId } = await Preferences.get({ key: "roleId" });
    const { value: stores } = await Preferences.get({ key: "stores" });
    const { value: storeId } = await Preferences.get({ key: "storeId" });

    if (token) {
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("permissions", permissions);
       localStorage.setItem("userId", userId);
      localStorage.setItem("roleId", roleId);
      localStorage.setItem("storeId", storeId);
      localStorage.setItem("stores", stores || []);
      navigate("/dashboard");
    }
  };
  checkToken();
}, []);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };


  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(
        "https://pos.inspiredgrow.in/vps/admiaddinguser/userlogin",
        {
          email:user.email,
          password:user.password
        }
      );
      const { token, user: userInfo, permissions } = res.data;

      // 1) Save JWT
      localStorage.setItem("token", token);
     await storeToken("token", token)
     
      // 2) Decode token to pull out id, role id, and stores[]
      const decoded = JSON.parse(window.atob(token.split(".")[1]));
      localStorage.setItem("role", decoded.role.toLowerCase());
      localStorage.setItem("userId", decoded.id);
      localStorage.setItem("roleId", decoded.role);
      localStorage.setItem("stores", JSON.stringify(decoded.stores || []));
      // If exactly one store, save a convenience storeId
      if (decoded.stores?.length === 1) {
        localStorage.setItem("storeId", decoded.stores[0]);
        await storeToken("storeId", decoded.stores[0])
      }

      // 3) Save permissions array
      localStorage.setItem("permissions", JSON.stringify(permissions || []));
      await storeToken("permissions", JSON.stringify(permissions || []))

      // store for long login
      await storeToken("role", decoded.role.toLowerCase());
      await storeToken("userId", decoded.id)
      await storeToken("roleId", decoded.role)
      await storeToken("stores", JSON.stringify(decoded.stores || []))
      alert("User logged in successfully!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
        const message =
        err.response?.data?.message || err.message || "Login failed";
      alert(message); // ✅ No more 'undefined'

    } finally {
      setLoading(false);
    }
  };

  return (
   <div className="flex items-center justify-center min-h-screen px-4 bg-gray-100 sm:px-6">
  <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-md sm:max-w-md sm:p-8">
    <h2 className="mb-6 text-xl font-semibold text-center text-gray-700 sm:text-2xl">
      User Login
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
        {loading ? "Logging in..." : "Login"}
      </button>
    </form>
  </div>
</div>

  );
};

export default UserLogin;

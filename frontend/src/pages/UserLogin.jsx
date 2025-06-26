import { useState,useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const UserLogin = () => {
  const [user, setUser] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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

      // 2) Decode token to pull out id, role id, and stores[]
      const decoded = JSON.parse(window.atob(token.split(".")[1]));
      localStorage.setItem("role", decoded.role.toLowerCase());
      localStorage.setItem("userId", decoded.id);
      localStorage.setItem("roleId", decoded.role);
      localStorage.setItem("stores", JSON.stringify(decoded.stores || []));
      // If exactly one store, save a convenience storeId
      if (decoded.stores?.length === 1) {
        localStorage.setItem("storeId", decoded.stores[0]);
      }

      // 3) Save permissions array
      localStorage.setItem("permissions", JSON.stringify(permissions || []));

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

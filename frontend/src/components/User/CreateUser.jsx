// src/components/CreateUser.jsx
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import LoadingScreen from "../../Loading";
import { FaTachometerAlt } from "react-icons/fa";
import { BiChevronRight } from "react-icons/bi";

const CreateUser = () => {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const navigate = useNavigate();

  // ── 1) Decode token to detect admin ─────────────────────────────
  const token = localStorage.getItem("token") || "";
  let isAdminUser = false;
  if (token) {
    try {
      const payload = JSON.parse(window.atob(token.split(".")[1]));
      isAdminUser = payload.role === "admin";
    } catch (e) {
      console.error("Failed to parse token:", e);
    }
  }

  // ── 2) Sidebar toggling ────────────────────────────────────────
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  // ── 3) Lookup data ─────────────────────────────────────────────
  const [roles, setRoles] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stores, setStores] = useState([]);

  // ── 4) Form state ──────────────────────────────────────────────
  const [formData, setFormData] = useState({
    userName: "",
    FirstName: "",
    LastName: "",
    Mobile: "",
    Email: "",
    Role: "",
    Store: isAdminUser ? [] : [],     // admins pick; non-admins get forced later
  });
  const [warehouseGroup, setWarehouseGroup] = useState([]);
  const [defaultWarehouse, setDefaultWarehouse] = useState("");
  const [password, setPassword] = useState("");
  const [confPassword, setConfPassword] = useState("");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  // ── 5) Fetch roles, warehouses, stores ─────────────────────────
  useEffect(() => {
    if (!token) return navigate("/");
    axios
      .get("admincreatingrole/api/roles", { headers })
      .then(r => setRoles(r.data.roles || []))
      .catch(console.error);

    axios
      .get("api/warehouses", { headers })
      .then(r => setWarehouses(r.data.data || []))
      .catch(console.error);

    axios
      .get("admin/store/add/store", { headers })
      .then(r => setStores(r.data.result || []))
      .catch(console.error);
  }, [navigate, token]);

  // ── 6) If editing, preload existing user ────────────────────────
  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    axios
      .get("admiaddinguser/userlist", { headers })
      .then(res => {
        const u = res.data.find(x => x._id === editId);
        if (!u) return;
        setFormData({
          userName: u.userName || "",
          FirstName: u.FirstName || "",
          LastName: u.LastName || "",
          Mobile: u.Mobile || "",
          Email: u.Email || "",
          Role: u.Role || "",
          Store: u.Store.map(s => s._id) || [],
        });
        setWarehouseGroup(u.WarehouseGroup || []);
        setDefaultWarehouse(u.Defaultwarehouse || "");
        setStatus(u.status || "active");
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [editId, token]);

  // ── 7) Handlers ────────────────────────────────────────────────
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };

  const addWarehouse = id => {
    if (id && !warehouseGroup.includes(id)) {
      setWarehouseGroup(w => [...w, id]);
    }
  };
  const removeWarehouse = id => {
    setWarehouseGroup(w => w.filter(x => x !== id));
    if (defaultWarehouse === id) setDefaultWarehouse("");
  };

  const addStore = id => {
    if (id && !formData.Store.includes(id)) {
      setFormData(f => ({ ...f, Store: [...f.Store, id] }));
    }
  };
  const removeStore = id => {
    setFormData(f => ({ ...f, Store: f.Store.filter(s => s !== id) }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (password !== confPassword) {
      return alert("Passwords do not match");
    }
    setLoading(true);
    const payload = {
      ...formData,
      Password: password,
      WarehouseGroup: warehouseGroup,
      Defaultwarehouse: defaultWarehouse,
      status,
    };
    try {
      if (editId) {
        await axios.put(
          `admiaddinguser/${editId}`,
          payload,
          { headers }
        );
        alert("User updated");
      } else {
        await axios.post(
          "http://localhost:5000/admiaddinguser/adduserbyadmin",
          payload,
          { headers }
        );
        alert("User created");
      }
      navigate("/admin/user/list");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error saving user");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  // ── 8) Render ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />

        <form
          onSubmit={handleSubmit}
          className="flex-grow p-6 overflow-auto bg-gray-100"
        >
          {/* Header & Breadcrumb */}
          <header className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">
                {editId ? "Edit User" : "Create User"}
              </h1>
              <p className="text-gray-600">
                {editId ? "Modify user details" : "Fill in user details"}
              </p>
            </div>
            <nav className="flex items-center text-gray-500">
              <NavLink to="/dashboard" className="flex items-center">
                <FaTachometerAlt className="mr-1" /> Home
              </NavLink>
              <BiChevronRight className="mx-2" />
              <NavLink to="/admin/user/list">User List</NavLink>
            </nav>
          </header>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* ── Left column ───────────────────────────────────────── */}
            <div className="space-y-4">
              {[
                { label: "Username", name: "userName", req: true },
                { label: "First Name", name: "FirstName", req: true },
                { label: "Last Name", name: "LastName", req: true },
                { label: "Mobile", name: "Mobile" },
                { label: "Email", name: "Email", type: "email", req: true },
              ].map(({ label, name, type = "text", req }) => (
                <div key={name}>
                  <label className="block font-semibold">
                    {label}
                    {req && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={type}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    required={req}
                    className="w-full p-2 border rounded"
                  />
                </div>
              ))}

              {/* Role */}
              <div>
                <label className="block font-semibold">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="Role"
                  value={formData.Role}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Role</option>
                  {roles.map(r => (
                    <option key={r._id} value={r._id}>
                      {r.roleName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block font-semibold">
                    Confirm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={confPassword}
                    onChange={e => setConfPassword(e.target.value)}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>

            {/* ── Right column ──────────────────────────────────────── */}
            <div className="space-y-4">
              {/* Warehouse Group */}
              <div>
                <label className="block font-semibold">Warehouse Group</label>
                <select
                  onChange={e => addWarehouse(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map(w => (
                    <option key={w._id} value={w._id}>
                      {w.warehouseName}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {warehouseGroup.map(id => {
                    const name =
                      warehouses.find(w => w._id === id)?.warehouseName || id;
                    return (
                      <span
                        key={id}
                        className="flex items-center px-2 py-1 bg-gray-200 rounded"
                      >
                        {name}
                        <button
                          type="button"
                          onClick={() => removeWarehouse(id)}
                          className="ml-1 text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Default Warehouse */}
              <div>
                <label className="block font-semibold">
                  Default Warehouse
                </label>
                <select
                  value={defaultWarehouse}
                  onChange={e => setDefaultWarehouse(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Default</option>
                  {warehouseGroup.map(id => {
                    const name =
                      warehouses.find(w => w._id === id)?.warehouseName || id;
                    return (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Store Assignment (only for admins) */}
              {isAdminUser ? (
                <div>
                  <label className="block font-semibold">Store</label>
                  <select
                    onChange={e => addStore(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Select Store</option>
                    {stores.map(s => (
                      <option key={s._id} value={s._id}>
                        {s.StoreName}
                      </option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.Store.map(id => {
                      const name = stores.find(s => s._id === id)?.StoreName || id;
                      return (
                        <span
                          key={id}
                          className="flex items-center px-2 py-1 bg-gray-200 rounded"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => removeStore(id)}
                            className="ml-1 text-red-500"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold">Store</label>
                  <div className="px-3 py-2 bg-gray-200 rounded">
                    {stores.find(s => s._id === formData.Store[0])?.StoreName ||
                      "—"}
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block font-semibold">Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Buttons ─────────────────────────────────────────────── */}
          <div className="flex justify-center gap-4 mt-6">
            <button
              type="submit"
              className="px-8 py-2 text-white bg-green-600 rounded"
            >
              {editId ? "Update" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/user/list")}
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

export default CreateUser;

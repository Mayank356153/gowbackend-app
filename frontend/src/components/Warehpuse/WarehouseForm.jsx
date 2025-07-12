// src/components/Warehouse/WarehouseForm.jsx
import React, { useState, useEffect } from "react";
import axios           from "axios";
import { BiChevronRight }   from "react-icons/bi";
import { FaTachometerAlt }  from "react-icons/fa";
import { useGeolocated }    from "react-geolocated";
import { useNavigate,
         useSearchParams }  from "react-router-dom";

import Navbar   from "../Navbar.jsx";
import Sidebar  from "../Sidebar.jsx";
import Loading  from "../../Loading.jsx";

/* ───────────────────────────────────────────────────────────── */

const WarehouseForm = () => {
    const link="https://pos.inspiredgrow.in/vps"

  /* routing */
  const navigate            = useNavigate();
  const [params]            = useSearchParams();
  const warehouseId         = params.get("id");

  /* auth helpers */
  const role         = (localStorage.getItem("role") || "").toLowerCase();
  const assignedStore= localStorage.getItem("storeId");
  const token        = localStorage.getItem("token");
  const headers      = { Authorization:`Bearer ${token}` };

  /* ui state */
  const [sidebarOpen,setSidebarOpen] = useState(window.innerWidth >= 768);
  const [loading,    setLoading]     = useState(false);

  /* look-ups */
  const [stores,    setStores]      = useState([]); // every store
  const [accounts,  setAccounts]    = useState([]); // every account
  const [terminals, setTerminals]   = useState([]);
  const [storeParent,setStoreParent]= useState(null); // id of store’s main acct

  /* form */
  const [form, setForm] = useState({
    warehouseName : "",
    mobile        : "",
    email         : "",
    status        : "Active",
    store         : role === "admin" ? "" : assignedStore,
    cashAccount   : "",     // "" === Auto-create
    terminalId    : "",
    tid           : ""
  });
  const [qrFile, setQrFile] = useState(null);

  /* geolocation (unchanged) */
  const {
    coords, isGeolocationAvailable, isGeolocationEnabled, positionError
  } = useGeolocated({ userDecisionTimeout:5000, watchPosition:false });
  const [latitude,  setLatitude ] = useState(null);
  const [longitude, setLongitude] = useState(null);
  useEffect(() => { if (coords){ setLatitude(coords.latitude); setLongitude(coords.longitude);} }, [coords]);

  /* ────────────────── fetch stores (one request – no /:id) */
  useEffect(() => {
    axios.get(`${link}/admin/store/add/store`, { headers })
      .then(res => {
        const all = res.data.result ?? [];
        setStores(all);

        /* for a store-user, discover parent-account of *their* store */
        if (role !== "admin"){
          const me  = all.find(s => s._id === assignedStore);
          const pid = typeof me?.storeAccount === "string"
                      ? me.storeAccount
                      : me?.storeAccount?._id;
          setStoreParent(pid || null);
        }
      })
      .catch(console.error);
  }, [role, assignedStore]);

  /* ────────────────── accounts & terminals */
  useEffect(() => {
    axios.get(`${link}/api/accounts`, { headers })
      .then(r => setAccounts(r.data.data ?? []))
      .catch(console.error);

    axios.get(`${link}/api/terminals`, { headers })
      .then(r => setTerminals(r.data.data ?? []))
      .catch(console.error);
  }, []);

  /* ────────────────── edit-mode: fetch this warehouse */
  useEffect(() => {
    if (!warehouseId) return;
    setLoading(true);
    axios.get(`${link}/api/warehouses/${warehouseId}`, { headers })
      .then(res => {
        const d = res.data.data;
        if (!d) return;
        setForm({
          warehouseName : d.warehouseName || "",
          mobile        : d.mobile || "",
          email         : d.email || "",
          status        : d.status || "Active",
          store         : d.store?._id || form.store,
          cashAccount   : d.cashAccount?._id || "",
          terminalId    : d.terminal?._id || "",
          tid           : d.tid || ""
        });
        if (d.Latitude  != null) setLatitude(d.Latitude);
        if (d.Longitude != null) setLongitude(d.Longitude);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [warehouseId]);

  /* ────────────────── helpers */
  const onChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
  const onFile   = e => setQrFile(e.target.files[0] || null);

  /* ────────────────── save */
  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.terminalId && !form.tid.trim()){
      return alert("Either choose a Terminal or enter a new TID");
    }
    setLoading(true);
    try{
      const payload = new FormData();
      Object.entries(form).forEach(([k,v]) => v!==null && payload.append(k,v));
      if (latitude  != null) payload.append("Latitude",  latitude);
      if (longitude != null) payload.append("Longitude", longitude);
      if (qrFile)            payload.append("qrCode",    qrFile);

      if (warehouseId){
        await axios.put(`${link}/api/warehouses/${warehouseId}`, payload, { headers });
        alert("Warehouse updated!");
      }else{
        await axios.post(`${link}/api/warehouses`, payload, { headers });
        alert("Warehouse created!");
      }
      navigate("/warehouse-list");
    }catch(err){
      console.error(err);
      alert(err.response?.data?.message || err.message);
    }finally{ setLoading(false); }
  };

  /* list of selectable cash-accounts */
  const accountOptions = role === "admin"
    ? accounts
    : accounts.filter(a =>
        (typeof a.parentAccount === "string"
          ? a.parentAccount
          : a.parentAccount?._id) === storeParent
      );

  /* ────────────────── render */
  if (loading) return <Loading/>;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Navbar isSidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={sidebarOpen}/>
        <main className="flex-grow p-6 overflow-auto">
          {/* breadcrumb / title */}
          <header className="flex items-center justify-between p-4 mb-6 bg-white rounded shadow">
            <div>
              <h1 className="text-2xl font-bold">
                {warehouseId ? "Edit Warehouse" : "Add Warehouse"}
              </h1>
              <p className="text-gray-600">
                {warehouseId ? "Update details" : "Fill in details"}
              </p>
            </div>
            <nav className="text-sm text-gray-500">
              <a href="/dashboard" className="flex items-center">
                <FaTachometerAlt className="mr-1"/> Home
              </a>
              <BiChevronRight className="mx-2"/>
              <a href="/warehouse-list">Warehouse List</a>
            </nav>
          </header>

          {/* form */}
          <form onSubmit={handleSubmit}
                className="p-6 space-y-4 bg-white rounded shadow">

            {/* simple text fields */}
            {[
              { label:"Name*",  name:"warehouseName", req:true },
              { label:"Mobile", name:"mobile" },
              { label:"Email",  name:"email", type:"email" }
            ].map(f=>(
              <div key={f.name} className="flex items-center">
                <label className="w-40 font-semibold">{f.label}</label>
                <input
                  className="flex-grow p-2 border rounded"
                  name={f.name}
                  type={f.type || "text"}
                  required={f.req}
                  value={form[f.name]}
                  onChange={onChange}
                />
              </div>
            ))}

            {/* status */}
            <div className="flex items-center">
              <label className="w-40 font-semibold">Status</label>
              <select name="status" value={form.status}
                      onChange={onChange}
                      className="flex-grow p-2 border rounded">
                <option>Active</option><option>Restricted</option><option>Inactive</option>
              </select>
            </div>

            {/* store (admin only) */}
            {role==="admin" && (
              <div className="flex items-center">
                <label className="w-40 font-semibold">Store</label>
                <select name="store" required
                        value={form.store}
                        onChange={onChange}
                        className="flex-grow p-2 border rounded">
                  <option value="">Select Store</option>
                  {stores.map(s=>(
                    <option key={s._id} value={s._id}>{s.StoreName}</option>
                  ))}
                </select>
              </div>
            )}

            {/* cash-account */}
            <div className="flex items-center">
              <label className="w-40 font-semibold">Cash Account</label>
              <select name="cashAccount"
                      value={form.cashAccount}
                      onChange={onChange}
                      className="flex-grow p-2 border rounded">
                <option value="">Auto-create (recommended)</option>
                {accountOptions.map(a=>(
                  <option key={a._id}
                          value={a._id}>
                    {a.accountNumber} – {a.accountName}
                  </option>
                ))}
              </select>
            </div>

            {/* terminal */}
            <div className="flex items-center">
              <label className="w-40 font-semibold">Terminal</label>
              <select name="terminalId"
                      value={form.terminalId}
                      onChange={onChange}
                      className="flex-grow p-2 border rounded">
                <option value="">Create New</option>
                {terminals.map(t=>(
                  <option key={t._id} value={t._id}>{t.tid}</option>
                ))}
              </select>
            </div>

            {/* new tid (only if “create new”) */}
            {!form.terminalId && (
              <div className="flex items-center">
                <label className="w-40 font-semibold">New TID*</label>
                <input
                  name="tid"
                  required
                  value={form.tid}
                  onChange={onChange}
                  className="flex-grow p-2 border rounded"
                  placeholder="e.g. TID-12345"
                />
              </div>
            )}

            {/* QR code */}
            <div className="flex items-center">
              <label className="w-40 font-semibold">QR Code</label>
              <input type="file" accept="image/*"
                     onChange={onFile}
                     className="flex-grow p-2 border rounded"/>
            </div>

            {/* location */}
            <div className="flex items-center">
              <label className="w-40 font-semibold">Location</label>
              <button type="button"
                      onClick={()=>alert(isGeolocationAvailable
                        ? "Fetching location..."
                        : "Geolocation unavailable")}
                      className="px-4 py-2 text-white bg-blue-500 rounded">
                Get Current
              </button>
            </div>

            {/* actions */}
            <div className="pt-6 space-x-4 text-center">
              <button className="px-8 py-2 text-white bg-green-600 rounded hover:bg-green-700">
                {warehouseId ? "Update" : "Save"}
              </button>
              <button type="button"
                      onClick={()=>navigate("/warehouse-list")}
                      className="px-8 py-2 text-white bg-gray-500 rounded hover:bg-gray-600">
                Cancel
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default WarehouseForm;

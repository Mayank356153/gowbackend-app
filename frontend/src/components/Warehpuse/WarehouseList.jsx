// src/components/Warehouse/WarehouseListPage.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { useGeolocated } from "react-geolocated";

import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import Loading from "../../Loading.jsx";

const WarehouseListPage = () => {
  const navigate = useNavigate();
  const link="https://pos.inspiredgrow.in/vps"

  /* ── UI state ───────────────────────── */
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [loading, setLoading] = useState(false);

  /* ── Data state ─────────────────────── */
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [warehouseInfo, setWarehouseInfo] = useState({}); // totals per WH

  /* ── Table helpers ──────────────────── */
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  /* ── Permissions ────────────────────── */
  const [localPermissions, setLocalPermissions] = useState([]);
  useEffect(() => {
    const stored = localStorage.getItem("permissions");
    if (stored) {
      try {
        setLocalPermissions(JSON.parse(stored));
      } catch {}
    }
  }, []);
  const hasPermissionFor = (module, action) => {
    const role = (localStorage.getItem("role") || "guest").toLowerCase();
    if (role === "admin") return true;
    return localPermissions.some(
      (p) =>
        p.module.toLowerCase() === module.toLowerCase() &&
        p.actions.map((a) => a.toLowerCase()).includes(action.toLowerCase())
    );
  };

  /* ── Responsive sidebar ─────────────── */
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  /* ═══════════════════════════════════════════════════════
        LIVE‐GEO HOOK
  ═══════════════════════════════════════════════════════ */
  const { coords, isGeolocationAvailable, positionError } = useGeolocated({
    userDecisionTimeout: 5000,
    watchPosition: true,
  });

  /* ── Reporting state ────────────────── */
  const [reportingId, setReportingId] = useState(null);
  const [reportInterval, setReportInterval] = useState(null);

  /* ═══════════════════════════════════════════════════════
        FETCHING
  ═══════════════════════════════════════════════════════ */
  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${link}/api/warehouses`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setWarehouses(data.data || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const { data } = await axios.get(
        `${link}/api/items/summary`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setItems(data.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchWarehouses();
    fetchItems();
  }, []);

  /* ═══════════════════════════════════════════════════════
        COMPUTE TOTALS PER WAREHOUSE
  ═══════════════════════════════════════════════════════ */
  useEffect(() => {
    const map = {};
    items.forEach((it) => {
      const wid = it.warehouse?._id;
      if (!wid) return;
      if (!map[wid]) map[wid] = { totalItems: 0, totalQuantity: 0, totalWorth: 0 };
      map[wid].totalItems += 1;
      map[wid].totalQuantity += it.openingStock;
      map[wid].totalWorth += it.openingStock * it.mrp;
    });
    setWarehouseInfo(map);
  }, [items]);

  /* ═══════════════════════════════════════════════════════
        FILTER + PAGINATION
  ═══════════════════════════════════════════════════════ */
  const filtered = warehouses.filter(
    (w) =>
      w.warehouseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.mobile || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / entriesPerPage);
  const currentRows = filtered.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  /* ═══════════════════════════════════════════════════════
        EXPORT HELPERS
  ═══════════════════════════════════════════════════════ */
  const handleCopy = () => { /* … */ };
  const handleExcelDownload = () => { /* … */ };
  const handlePdfDownload = () => { /* … */ };
  const handleCsvDownload = () => { /* … */ };
  const handlePrint = () => window.print();

  /* ═══════════════════════════════════════════════════════
        DELETE & STATUS TOGGLE
  ═══════════════════════════════════════════════════════ */
  const [dropdownIndex, setDropdownIndex] = useState(null);
  const role = (localStorage.getItem("role") || "guest").toLowerCase();

  async function confirmAndDelete(id) {
    if (!window.confirm("Permanently delete this warehouse?")) return;
    setLoading(true);
    try {
      await axios.delete(`${link}/api/warehouses/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchWarehouses();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteClick = (id) => {
    if (role === "admin") confirmAndDelete(id);
    else {
      const reason = window.prompt("Reason for deletion:");
      if (!reason) return;
      axios
        .post(
          `${link}/api/deletion-requests`,
          { itemType: "Warehouse", itemId: id, reason },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        )
        .then(() => alert("Request sent"))
        .catch((err) => alert(err.message));
    }
  };

  const handleStatus = async (id, current) => {
    setLoading(true);
    try {
      await axios.put(
        `${link}/api/warehouses/${id}`,
        { status: current === "Active" ? "Inactive" : "Active" },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      fetchWarehouses();
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ═══════════════════════════════════════════════════════
        REPORT LIVE LOCATION
  ═══════════════════════════════════════════════════════ */
  const handleReportClick = (warehouseId) => {
    if (reportingId === warehouseId) {
      clearInterval(reportInterval);
      setReportingId(null);
      setReportInterval(null);
      return;
    }
    if (!coords) {
      alert("Waiting for geolocation…");
      return;
    }
    setReportingId(warehouseId);
    const doPost = () => {
      axios
        .post(
          `${link}/api/warehouse-location`,
          { lat: coords.latitude, lng: coords.longitude, warehouseId },
          { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
        )
        .catch(console.error);
    };
    doPost();
    const id = setInterval(doPost, 10000);
    setReportInterval(id);
  };

  /* ═══════════════════════════════════════════════════════
        TRACK ON MAP
  ═══════════════════════════════════════════════════════ */
  const handleTrackClick = (warehouseId) => {
    navigate(`/warehouse-tracker?id=${warehouseId}`);
  };

  /* ═══════════════════════════════════════════════════════
        RENDER
  ═══════════════════════════════════════════════════════ */
  if (loading) return <Loading />;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={sidebarOpen} />
        <main className="flex-grow p-2 overflow-x-auto">
          {/* header */}
          <header className="flex justify-between p-3 bg-white rounded shadow">
            <div>
              <h1 className="text-lg font-bold">Warehouse List</h1>
              <p className="text-xs text-gray-600">Manage Warehouses</p>
            </div>
            <nav className="flex items-center text-sm text-gray-500">
              <a href="/dashboard" className="flex items-center">
                <FaTachometerAlt className="mr-1" /> Home
              </a>
              <BiChevronRight className="mx-2" />
              <span>Warehouse List</span>
            </nav>
          </header>

          {/* toolbar */}
          <div className="flex flex-col gap-2 my-4 lg:flex-row lg:items-center">
            {hasPermissionFor("Warehouses", "Add") && (
              <Link to="/warehouse-form" className="ml-auto">
                <button className="flex items-center gap-1 px-3 py-2 text-white rounded bg-cyan-500 hover:bg-cyan-600">
                  <FaPlus /> Add Warehouse
                </button>
              </Link>
            )}
          </div>

          {/* table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="text-xs font-semibold bg-gray-100">
                <tr>
                  <th className="px-3 py-2">Report</th>
                  <th className="px-3 py-2">Track</th>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Warehouse</th>
                  <th className="px-3 py-2">Mobile</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Cash A/c No.</th>
                  <th className="px-3 py-2">TID</th>
                  <th className="px-3 py-2">Details</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-200">
                {currentRows.map((w, idx) => {
                  const isRestricted = w.isRestricted;
                  return (
                    <tr key={w._id}>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleReportClick(w._id)}
                          className={`px-2 py-1 rounded text-white ${
                            reportingId === w._id ? "bg-red-500" : "bg-green-500"
                          }`}
                        >
                          {reportingId === w._id ? "Stop" : "Report"}
                        </button>
                        {!isGeolocationAvailable && (
                          <div className="text-xs text-red-500">Geo unavailable</div>
                        )}
                        {positionError && (
                          <div className="text-xs text-red-500">{positionError.message}</div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleTrackClick(w._id)}
                          className="px-2 py-1 text-xs text-white bg-blue-500 rounded"
                        >
                          Track
                        </button>
                      </td>
                      <td className="px-3 py-2">{(currentPage - 1) * entriesPerPage + idx + 1}</td>
                      <td className="px-3 py-2">{w.warehouseName}</td>
                      <td className="px-3 py-2">{w.mobile}</td>
                      <td className="px-3 py-2">{w.email}</td>
                      <td className="px-3 py-2">{w.cashAccount?.accountNumber || "—"}</td>
                      <td className="px-3 py-2">{w.terminal?.tid || w.tid || "—"}</td>
                      <td className="px-3 py-2">
                        <div>Total Items: {warehouseInfo[w._id]?.totalItems || 0}</div>
                        <div>Quantity: {warehouseInfo[w._id]?.totalQuantity || 0}</div>
                        <div>Worth ₹: {warehouseInfo[w._id]?.totalWorth || 0}</div>
                      </td>
                      <td className="px-3 py-2">
                        {isRestricted ? (
                          <span className="px-2 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">
                            Restricted
                          </span>
                        ) : (
                          <span
                            onClick={() => handleStatus(w._id, w.status)}
                            className={`cursor-pointer px-2 py-1 rounded-full text-xs font-semibold ${
                              w.status === "Active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {w.status}
                          </span>
                        )}
                      </td>
                      <td className="relative px-3 py-2 text-right">
                        <button
                          className="px-3 py-1 border rounded"
                          onClick={() => setDropdownIndex(dropdownIndex === w._id ? null : w._id)}
                        >
                          Action ▼
                        </button>
                        {dropdownIndex === w._id && (
                          <div className="absolute right-0 z-10 flex flex-col gap-1 p-2 mt-1 bg-white border rounded shadow">
                            {!isRestricted && hasPermissionFor("Warehouses", "Edit") && (
                              <button
                                onClick={() => navigate(`/warehouse-form?id=${w._id}`)}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-white bg-blue-500 rounded hover:bg-blue-600"
                              >
                                <FaEdit size={14} /> Edit
                              </button>
                            )}
                            {!isRestricted && hasPermissionFor("Warehouses", "Delete") && (
                              <button
                                onClick={() => handleDeleteClick(w._id)}
                                className="flex items-center gap-1 px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                              >
                                <FaTrash size={14} /> Delete
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {currentRows.length === 0 && (
                  <tr>
                    <td colSpan={12} className="p-4 text-center">No data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          <div className="flex flex-col items-center justify-between gap-2 mt-4 md:flex-row">
            <span className="text-sm">
              Showing {(currentPage - 1) * entriesPerPage + 1}-{" "}
              {Math.min(entriesPerPage * currentPage, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default WarehouseListPage;
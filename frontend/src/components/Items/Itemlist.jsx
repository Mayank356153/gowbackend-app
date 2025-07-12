
import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "../Sidebar";
import Navbar  from "../Navbar";
import {
  BiChevronRight
}                     from "react-icons/bi";
import {
  FaTachometerAlt,
  FaEdit,
  FaTrash
}                     from "react-icons/fa";
import { Link, NavLink, useNavigate } from "react-router-dom";
import axios  from "axios";
import Select from "react-select";
import * as XLSX from "xlsx";
import LoadingScreen from "../../Loading";

const FILES_BASE = "/vps/uploads/qr/items";

/* ───────── client-side export helpers ───────── */
const downloadCSV = (rows, filename = "items_export.csv") => {
  const ws  = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

const downloadXLSX = (rows, filename = "items_export.xlsx") => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Items");
  XLSX.writeFile(wb, filename);
};

export default function ItemList() {
  const link="https://pos.inspiredgrow.in/vps";
  const navigate = useNavigate();

  /* ───────── UI state ───────── */
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading]           = useState(false);
  const [error,   setError]             = useState(null);

  /* ───────── Data & lookups ───────── */
  const [items, setItems]                 = useState([]);
  const [unitOptions, setUnitOptions]     = useState([]);
  const [warehouseOptions, setWarehouseOptions] = useState([]);
  const [categoryOptions, setCategoryOptions]   = useState([]);

  /* ───────── Filters, search, sort ───────── */
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [unitFilter,      setUnitFilter]      = useState("all");
  const [categoryFilter,  setCategoryFilter]  = useState("all");
  const [searchTerm,      setSearchTerm]      = useState("");
  const [sortField,       setSortField]       = useState("itemCode");
  const [sortDir,         setSortDir]         = useState("asc"); // asc|desc

  /* ───────── Pagination ───────── */
  const [currentPage, setCurrentPage] = useState(1);
  const entriesPerPage = 10;

  /* ───────── Dropdown / preview / image removal ───────── */
  const [dropdownOpenFor, setDropdownOpenFor] = useState(null);
  const [previewItem,     setPreviewItem]     = useState(null);
  const [popupImage,      setPopupImage]      = useState(null);
  const [popupIndex,      setPopupIndex]      = useState(null);

  /* ───────── Axios helper ───────── */
  const auth = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  /* ───────── Fetch helpers ───────── */
  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${link}/api/items`, auth());
      setItems(Array.isArray(data.data) ? data.data : []);
    } catch {
      setError("Failed to fetch items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnits = async () => {
    try {
      const { data } = await axios.get(`${link}/api/units`, auth());
      setUnitOptions([
        { label: "All Units", value: "all" },
        ...data.data.map((u) => ({ label: u.unitName, value: u._id })),
      ]);
    } catch {/* ignore */}
  };

  const fetchWarehouses = async () => {
    try {
      const { data } = await axios.get(`${link}/api/warehouses`, auth());
      setWarehouseOptions([
        { label: "All Warehouses", value: "all" },
        ...data.data.map((w) => ({ label: w.warehouseName, value: w._id })),
      ]);
    } catch {/* ignore */}
  };

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(`${link}/api/categories`, auth());
      setCategoryOptions([
        { label: "All Categories", value: "all" },
        ...data.data.map((c) => ({ label: c.name, value: c._id })),
      ]);
    } catch {/* ignore */}
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Do you really want to delete this item?")) return;
    setLoading(true);
    try {
      await axios.delete(`${link}/api/items/${id}`, auth());
      await fetchItems();
    } catch {
      setError("Failed to delete. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ───────── initial load ───────── */
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
    fetchItems();
    fetchUnits();
    fetchWarehouses();
    fetchCategories();
  }, []);

  /* ───────── filtered & sorted list ───────── */
  const filtered = useMemo(() => {
    let data = [...items];

    if (searchTerm.trim()) {
      const re = new RegExp(searchTerm.trim(), "i");
      data = data.filter(
        (it) =>
          re.test(it.itemName) ||
          re.test(it.itemCode) ||
          (it.barcodes || []).some((b) => re.test(b))
      );
    }

    if (warehouseFilter !== "all")
      data = data.filter((it) => it.warehouse?._id === warehouseFilter);
    if (unitFilter !== "all")
      data = data.filter((it) => it.unit?._id === unitFilter);
    if (categoryFilter !== "all")
      data = data.filter((it) => it.category?._id === categoryFilter);

    data.sort((a, b) => {
      const v1 = a[sortField] ?? "";
      const v2 = b[sortField] ?? "";
      if (v1 < v2) return sortDir === "asc" ? -1 : 1;
      if (v1 > v2) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [
    items,
    searchTerm,
    warehouseFilter,
    unitFilter,
    categoryFilter,
    sortField,
    sortDir,
  ]);

  /* pagination slice */
  const totalPages = Math.ceil(filtered.length / entriesPerPage);
  const pageStart  = (currentPage - 1) * entriesPerPage;
  const pageSlice  = filtered.slice(pageStart, pageStart + entriesPerPage);

  /* ───────── image helpers ───────── */
  const onThumbnailClick = (filename, idx) => {
    setPopupImage(filename);
    setPopupIndex(idx);
  };

  const handleRemoveImage = async (index) => {
    if (!previewItem) return;

    const updated = [...previewItem.itemImages];
    const removed = updated.splice(index, 1)[0];

    setPreviewItem({ ...previewItem, itemImages: updated });
    setItems((old) =>
      old.map((it) =>
        it._id === previewItem._id ? { ...it, itemImages: updated } : it
      )
    );

    try {
      await axios.delete(
        `api/items/${previewItem._id}/images/${removed}`,
        auth()
      );
    } catch {
      setError("Failed to remove image from server. Please reload.");
    }
  };

  /* ───────── render loading/error ───────── */
  if (loading) return <LoadingScreen />;
  if (error)   return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />
        <div className="flex-grow p-4 mt-20">
          {/* header / breadcrumbs */}
          <header className="flex flex-col justify-between mb-6 md:flex-row">
            <h2 className="text-2xl font-bold">Items List</h2>
            <nav className="flex gap-2 mt-2 text-gray-600 md:mt-0">
              <NavLink to="/dashboard" className="flex items-center">
                <FaTachometerAlt /> Home
              </NavLink>
              <BiChevronRight />
              <NavLink to="/item-list">Items List</NavLink>
            </nav>
          </header>

          {/* filter + actions bar */}
          <div className="flex flex-wrap items-end gap-4 p-4 mb-4 bg-white rounded shadow">
            <div className="w-48">
              <label className="block mb-1">Warehouse</label>
              <Select
                options={warehouseOptions}
                value={warehouseOptions.find((o) => o.value === warehouseFilter)}
                onChange={(o) => { setWarehouseFilter(o.value); setCurrentPage(1);} }
              />
            </div>
           
            <div className="w-48">
              <label className="block mb-1">Category</label>
              <Select
                options={categoryOptions}
                value={categoryOptions.find((o) => o.value === categoryFilter)}
                onChange={(o) => { setCategoryFilter(o.value); setCurrentPage(1);} }
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block mb-1">Search</label>
              <input
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1);} }
                placeholder="Code / name / barcode"
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div className="w-44">
              <label className="block mb-1">Sort by</label>
              <Select
                options={[
                  { label: "Item Code ↑",      value: "itemCode|asc" },
                  { label: "Item Code ↓",      value: "itemCode|desc" },
                  { label: "Stock Low→High",   value: "openingStock|asc" },
                  { label: "Stock High→Low",   value: "openingStock|desc" },
                ]}
                onChange={(o) => {
                  const [f, d] = o.value.split("|");
                  setSortField(f); setSortDir(d);
                }}
              />
            </div>

            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => downloadCSV(filtered)}
                className="px-4 py-2 text-white bg-gray-500 rounded"
              >
                Export CSV
              </button>
              <button
                onClick={() => downloadXLSX(filtered)}
                className="px-4 py-2 text-white bg-gray-700 rounded"
              >
                Export XLSX
              </button>
              <Link to="/items/add">
                <button className="px-4 py-2 text-white rounded bg-cyan-500">
                  + Create Item
                </button>
              </Link>
            </div>
          </div>

          {/* table */}
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  {[
                    "Image",
                    "Code",
                    "Name",
                    "Brand",
                    "Category",
                    "Unit",
                    "Stock",
                    "Alert Qty",
                    "Sales Price",
                    "Tax",
                    "Visibility",
                    "Action",
                  ].map((h) => (
                    <th key={h} className="px-2 py-1 border">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageSlice.length ? (
                  pageSlice.map((item) => {
                    const fn  = item.itemImages?.[0];
                    const img = fn ? `${FILES_BASE}/${fn}` : null;

                    return (
                      <tr key={item._id}>
                        <td className="px-2 py-1 text-center border">
                          {img ? (
                            <img
                              src={img}
                              alt={item.itemName}
                              className="object-cover w-10 h-10 mx-auto cursor-pointer hover:opacity-80"
                              onClick={() => setPreviewItem(item)}
                            />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-2 py-1 border">{item.itemCode}</td>
                        <td className="px-2 py-1 border">{item.itemName}</td>
                        <td className="px-2 py-1 border">{item.brand?.brandName || "—"}</td>
                        <td className="px-2 py-1 border">{item.category?.name   || "—"}</td>
                        <td className="px-2 py-1 border">{item.unit?.unitName   || "—"}</td>
                        <td className="px-2 py-1 text-center border">{item.openingStock}</td>
                        <td className="px-2 py-1 text-center border">{item.alertQuantity}</td>
                        <td className="px-2 py-1 text-right border">{item.salesPrice}</td>
                        <td className="px-2 py-1 border">{item.tax?.taxName || "—"}</td>
                        <td className="px-2 py-1 text-center border">
                          {item.isOnline ? (
                            <span className="px-2 py-1 text-xs text-white bg-green-600 rounded">
                              Online
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs text-white bg-red-500 rounded">
                              Offline
                            </span>
                          )}
                        </td>
                        <td className="relative px-2 py-1 border">
                          <button
                            onClick={() =>
                              setDropdownOpenFor(dropdownOpenFor === item._id ? null : item._id)
                            }
                            className="px-2 py-1 text-white rounded bg-cyan-600"
                          >
                            Action ▼
                          </button>
                          {dropdownOpenFor === item._id && (
                            <div className="absolute right-0 z-50 mt-1 bg-white border rounded shadow">
                              <button
                                className="flex items-center w-full px-3 py-2 hover:bg-gray-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/items/add?id=${item.parentItemId || item._id}`);
                                }}
                              >
                                <FaEdit className="mr-2" /> Edit
                              </button>
                              <button
                                className="flex items-center w-full px-3 py-2 text-red-600 hover:bg-gray-100"
                                onClick={() => handleDelete(item._id)}
                              >
                                <FaTrash className="mr-2" /> Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="12" className="py-4 text-center">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          <div className="flex items-center justify-between px-2 mt-4">
            <span>
              Showing {pageStart + 1} –{" "}
              {Math.min(pageStart + entriesPerPage, filtered.length)} of {filtered.length}
            </span>
            <div className="space-x-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ───────── image preview + removal modal ───────── */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => {
            setPreviewItem(null);
            setPopupImage(null);
          }}
        >
          <div
            className="bg-white rounded shadow-lg max-w-4xl w-full max-h-[90vh] p-4 overflow-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {previewItem.itemName} – images
              </h3>
              <button
                className="text-2xl font-bold text-red-600"
                onClick={() => {
                  setPreviewItem(null);
                  setPopupImage(null);
                }}
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {previewItem.itemImages.map((fn, idx) => {
                const url = fn.startsWith("http") ? fn : `${FILES_BASE}/${fn}`;
                return (
                  <div key={idx} className="relative group">
                    <img
                      src={url}
                      alt={`${previewItem.itemName} ${idx + 1}`}
                      className="object-cover w-full h-64 rounded cursor-pointer"
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/150";
                      }}
                      onClick={() => onThumbnailClick(fn, idx)}
                    />
                  </div>
                );
              })}
            </div>

            {/* confirm delete popup */}
            {popupImage && (
              <div
                className="fixed inset-0 flex items-center justify-center z-60 bg-black/50"
                onClick={() => setPopupImage(null)}
              >
                <div
                  className="w-full max-w-sm p-6 bg-white rounded-lg shadow-lg"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h4 className="mb-4 text-lg font-semibold">
                    Remove this image?
                  </h4>
                  <p className="mb-6 text-sm text-gray-700">
                    Are you sure you want to remove{" "}
                    <span className="font-medium">{popupImage}</span>?
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                      onClick={() => setPopupImage(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
                      onClick={() => {
                        handleRemoveImage(popupIndex);
                        setPopupImage(null);
                      }}
                    >
                      Yes, Remove
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
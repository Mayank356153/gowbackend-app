// src/components/SubSubCategoryList.jsx
import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import Sidebar from "../Sidebar";
import Navbar from "../Navbar";
import LoadingScreen from "../../Loading";
import axios from "axios";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt, FaEdit, FaTrash } from "react-icons/fa";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function SubSubCategoryList() {
  const [isSidebarOpen, setSidebarOpen]       = useState(true);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [loading, setLoading]                 = useState(false);
  const [dropdownIndex, setDropdownIndex]     = useState(null);
  const [searchTerm, setSearchTerm]           = useState("");
  const [entriesPerPage, setEntriesPerPage]   = useState(10);
  const [currentPage, setCurrentPage]         = useState(1);
  const navigate                              = useNavigate();
  const BASE_URL = ''; 
  const [modalImage, setModalImage] = useState(null);


  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
    fetchSubSubCategories();
  }, []);

  const fetchSubSubCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        "/api/sub-subcategories",
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      const arr = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data.data)
          ? res.data.data
          : [];
      setSubSubCategories(arr);
    } catch (err) {
      console.error("Error fetching sub-subcategories:", err);
    } finally {
      setLoading(false);
    }
  };

  // filter & paginate
  const filtered = subSubCategories.filter(ssc =>
    ssc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / entriesPerPage);
  const displayed = filtered.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  // exports
  const handleCopy = () => {
    const txt = displayed
      .map(i => [i.name, i.description, i.status].join(","))
      .join("\n");
    navigator.clipboard.writeText(txt);
    alert("Copied to clipboard!");
  };
  const handleExcelDownload = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SubSubCategories");
    XLSX.writeFile(wb, "subsubcategories_list.xlsx");
  };
  const handlePdfDownload = () => {
    const doc = new jsPDF();
    doc.text("Sub‑SubCategory List", 20, 20);
    autoTable(doc, {
      head: [["Name", "Description", "Status"]],
      body: filtered.map(i => [i.name, i.description, i.status])
    });
    doc.save("subsubcategories_list.pdf");
  };
  const handlePrint = () => window.print();
  const handleCsvDownload = () => {
    const csv =
      "data:text/csv;charset=utf-8," +
      filtered.map(i => [i.name, i.description, i.status].join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "subsubcategories_list.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // actions
  const toggleDropdown = idx =>
    setDropdownIndex(dropdownIndex === idx ? null : idx);
  const toggleStatus = async id => {
    const ssc = subSubCategories.find(s => s._id === id);
    if (!ssc) return;
    const upd = { ...ssc, status: ssc.status === "Active" ? "Inactive" : "Active" };
    setLoading(true);
    try {
      await axios.put(
        `/api/sub-subcategories/${id}`,
        upd,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      fetchSubSubCategories();
    } catch (err) {
      console.error("Error toggling status:", err);
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async id => {
    if (!window.confirm("Delete this sub‑subcategory?")) return;
    setLoading(true);
    try {
      await axios.delete(
        `/api/sub-subcategories/${id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      fetchSubSubCategories();
    } catch (err) {
      console.error("Error deleting sub‑subcategory:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen}/>
      <div className="flex ">
        <div className="w-auto">
        <Sidebar isSidebarOpen={isSidebarOpen}/>
        </div>

        <div className="w-full min-h-screen p-6 bg-gray-100 ">
          {/* Header */}
          <header className="flex flex-col items-center justify-between gap-2 mb-6 md:flex-row">
            <div>
              <h1 className="text-2xl font-semibold">Sub‑SubCategory List</h1>
              <nav className="flex mt-1 text-sm text-gray-600">
                <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline">
                  <FaTachometerAlt />
                  <span className="ml-1">Home</span>
                </NavLink>
                <span> &gt; Sub‑SubCategory List</span>
              </nav>
            </div>
            <div className="flex flex-col w-full gap-2 md:w-auto md:flex-row">
              <button
                onClick={() => navigate("/categories-list")}
                className="w-full px-4 py-2 text-white bg-indigo-600 rounded md:w-auto"
              >
                Category List
              </button>
              <button
                onClick={() => navigate("/subcategories-list")}
                className="w-full px-4 py-2 text-white bg-indigo-600 rounded md:w-auto"
              >
                SubCategory List
              </button>
              <NavLink to="/sub-subcategories/import">
                <button className="w-full px-4 py-2 text-white bg-green-600 rounded md:w-auto">
                  Import Sub‑SubCategories
                </button>
              </NavLink>
              
            </div>
          </header>

          {/* Controls */}
          <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <label>Show</label>
              <select
                className="px-2 py-1 border"
                value={entriesPerPage}
                onChange={e => setEntriesPerPage(+e.target.value)}
              >
                {[10,25,50,100].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <label>Entries</label>
            </div>
            <div className="flex gap-1">
              
            <div className="flex flex-1 gap-1 text-sm">
              <button onClick={handleCopy} className="px-2 bg-teal-300">Copy</button>
              <button onClick={handleExcelDownload} className="px-2 bg-teal-300">Excel</button>
              <button onClick={handlePdfDownload} className="px-2 bg-teal-300">PDF</button>
              <button onClick={handlePrint} className="px-2 bg-teal-300">Print</button>
              <button onClick={handleCsvDownload} className="px-2 bg-teal-300">CSV</button>
            </div>
            <input
              type="text"
              placeholder="Search"
              className="w-full px-2 py-1 border"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            </div>
          </div>

          

          {/* Table */}
          <div className="overflow-visible overflow-x-auto">
            <table className="w-full bg-white border">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 border">#</th>
                  <th className="p-2 border">Image</th>                {/* ← added */}
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Description</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Action</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((ssc, idx) => (
                  <tr key={ssc._id} className="text-center border">
                    <td className="p-2 border">{idx + 1}</td>
                    <td className="p-2 border">
                      {ssc.images && ssc.images.length > 0
                        ? <img
                        src={`/vps/uploads/sub-subcategories/${ssc.images[0]}`}
                        alt={ssc.name}
                        className="inline-block object-cover w-12 h-12 rounded"
                        onClick={() => setModalImage(`/vps/uploads/sub-subcategories/${ssc.images[0]}`)}
                      />
                        : <span className="text-gray-400">No image</span>
                      }
                    </td>
                    <td className="p-2 border">{ssc.name}</td>
                    <td className="p-2 border">{ssc.description}</td>
                    <td
                      className="p-2 border cursor-pointer"
                      onClick={() => toggleStatus(ssc._id)}
                    >
                      {ssc.status === "Active"
                        ? <span className="px-2 py-1 text-white bg-green-600 rounded">Active</span>
                        : <span className="px-2 py-1 text-white bg-red-600 rounded">Inactive</span>
                      }
                    </td>
                    <td className="relative p-2 border">
                      <button
                        onClick={() => toggleDropdown(idx)}
                        className="px-2 py-1 text-white rounded bg-cyan-600"
                      >
                        Action
                      </button>
                      {dropdownIndex === idx && (
                        <div className="absolute right-0 z-20 w-32 mt-1 bg-white border rounded shadow">
                          <button
                            className="flex items-center w-full gap-1 px-3 py-2 hover:bg-gray-100"
                            onClick={() => navigate(`/sub-subcategories-form?id=${ssc._id}`)}
                          >
                            <FaEdit /> Edit
                          </button>
                          <button
                            className="flex items-center w-full gap-1 px-3 py-2 text-red-600 hover:bg-gray-100"
                            onClick={() => handleDelete(ssc._id)}
                          >
                            <FaTrash /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <span>
              Showing {(currentPage - 1) * entriesPerPage + 1} to{" "}
              {Math.min(currentPage * entriesPerPage, filtered.length)} of{" "}
              {filtered.length} entries
            </span>
            <div className="flex gap-2">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
          {modalImage && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
    onClick={() => setModalImage(null)}
  >
    <div className="relative">
      <button
        className="absolute top-0 right-0 m-2 text-2xl text-white"
        onClick={() => setModalImage(null)}
      >
        &times;
      </button>
      <img src={modalImage} className="max-w-full max-h-full rounded" />
    </div>
  </div>
)}

        </div>
      </div>
    </div>
  );
}

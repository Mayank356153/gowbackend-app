import React, { useEffect, useState } from 'react';
import { ShoppingBagIcon, CashIcon } from "@heroicons/react/outline";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoneyBill } from "@fortawesome/free-solid-svg-icons";
import { FaDollarSign, FaTachometerAlt } from 'react-icons/fa';
import { NavLink, useNavigate } from 'react-router-dom';
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import Select from 'react-select';
import axios from 'axios';
import LoadingScreen from '../../Loading.jsx';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { jsPDF } from "jspdf";
import BluetoothDevicesPage from '../../pages/BluetoothDevicesPage.jsx';  
import { Bluetooth } from 'lucide-react';
const SalesReturnList = () => {
  const[device, setDevice] = useState(false);
      const link="https://pos.inspiredgrow.in/vps"
  const navigate = useNavigate();
  const [warehouses, setWarehouses] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [warehouse, setWarehouse] = useState("all");
  const [salesReturns, setSalesReturns] = useState([]);
  const [summary, setSummary] = useState({ totalCount: 0, totalRefunded: 0 });
  const [total, setTotal] = useState(0);
  const [paid, setPaid] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionMenu, setActionMenu] = useState(null);
  const [localPermissions, setLocalPermissions] = useState([]);

  // Permissions
  useEffect(() => {
    const stored = localStorage.getItem("permissions");
    if (stored) setLocalPermissions(JSON.parse(stored));
  }, []);
  const hasPermissionFor = (module, action) => {
    const role = (localStorage.getItem("role") || "guest").toLowerCase();
    if (role === "admin") return true;
    return localPermissions.some(p =>
      p.module.toLowerCase() === module.toLowerCase() &&
      p.actions.map(a => a.toLowerCase()).includes(action.toLowerCase())
    );
  };

  // Sidebar responsiveness
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  // Auth headers
  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  // Fetch Sales Returns
  const fetchSalesReturnList = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, redirecting...");
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${link}/api/sales-return`, authHeaders());
      setSalesReturns(response.data.returns || []);
      setSummary(response.data.summary || { totalCount: 0, totalRefunded: 0 });
    } catch (error) {
      alert("Failed to fetch sales returns: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Warehouses
  const fetchWarehouses = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, redirecting...");
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${link}/api/warehouses`, authHeaders());
      const newWarehouses = [
        { label: "All Warehouses", value: "all" },
        ...response.data.data.map(wh => ({
          label: wh.warehouseName,
          value: wh._id,
        })),
      ];
      setWarehouses(newWarehouses);
    } catch (error) {
      alert("Failed to fetch warehouses: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesReturnList();
    fetchWarehouses();
  }, []);

  // Filter data
  const filteredData = salesReturns.filter(item => {
    const warehouseCondition = warehouse === "all" || item.warehouse?._id === warehouse;
    const searchCondition =
      item.customer?.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.returnCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sale?.saleCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sale?.referenceNo?.toLowerCase().includes(searchTerm.toLowerCase());
    return warehouseCondition && searchCondition;
  });

  // Delete handler
  const handleDelete = async (id) => {
    if (!hasPermissionFor("SalesReturn", "Delete")) {
      alert("You don’t have permission to delete sales returns.");
      return;
    }
    const confirmDelete = window.confirm("Are you sure you want to delete this return?");
    if (!confirmDelete) return;
    setLoading(true);
    try {
      await axios.delete(`${link}/api/sales-return/${id}`, authHeaders());
      fetchSalesReturnList();
    } catch (error) {
      alert("Failed to delete return: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Export handlers
  const handleCopy = () => {
    const data = filteredData.map(sale => {
      const transactionCode = sale.saleModel === "PosOrder" ? sale.sale?.saleCode : sale.sale?.referenceNo || "N/A";
      return `${new Date(sale.returnDate).toDateString()},${sale.returnCode},${transactionCode},${sale.status},${sale.customer?.customerName || "N/A"},${sale.totalRefund || 0},${sale.payments?.[0]?.amount || 0},${sale.payments?.[0]?.paymentNote || "N/A"},${sale.creatorName || "N/A"}`;
    }).join('\n');
    navigator.clipboard.writeText(data);
    alert("Data copied to clipboard!");
  };

  const handleExcelDownload = () => {
    const data = filteredData.map(sale => ({
      "Return Date": new Date(sale.returnDate).toDateString(),
      "Return Code": sale.returnCode,
      "Transaction Code": sale.saleModel === "PosOrder" ? sale.sale?.saleCode : sale.sale?.referenceNo || "N/A",
      "Status": sale.status,
      "Customer Name": sale.customer?.customerName || "N/A",
      "Total Refund": sale.totalRefund || 0,
      "Paid Amount": sale.payments?.[0]?.amount || 0,
      "Payment Note": sale.payments?.[0]?.paymentNote || "N/A",
      "Created By": sale.creatorName || "N/A",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SalesReturns");
    XLSX.writeFile(wb, "sales_returns.xlsx");
  };

  const handlePdfDownload = () => {
    const doc = new jsPDF();
    doc.text("Sales Returns List", 20, 20);
    const tableData = filteredData.map(sale => [
      new Date(sale.returnDate).toDateString(),
      sale.returnCode,
      sale.saleModel === "PosOrder" ? sale.sale?.saleCode : sale.sale?.referenceNo || "N/A",
      sale.status,
      sale.customer?.customerName || "N/A",
      sale.totalRefund || 0,
      sale.payments?.[0]?.amount || 0,
      sale.payments?.[0]?.paymentNote || "N/A",
      sale.creatorName || "N/A",
    ]);
    autoTable(doc, {
      head: [
        ["Return Date", "Return Code", "Transaction Code", "Status", "Customer Name", "Total Refund", "Paid Amount", "Payment Note", "Created By"]
      ],
      body: tableData,
    });
    doc.save("sales_returns.pdf");
  };

  const handleCsvDownload = () => {
    const headers = ["Return Date,Return Code,Transaction Code,Status,Customer Name,Total Refund,Paid Amount,Payment Note,Created By"];
    const data = filteredData.map(sale => [
      new Date(sale.returnDate).toDateString(),
      sale.returnCode,
      sale.saleModel === "PosOrder" ? sale.sale?.saleCode : sale.sale?.referenceNo || "N/A",
      sale.status,
      sale.customer?.customerName || "N/A",
      sale.totalRefund || 0,
      sale.payments?.[0]?.amount || 0,
      sale.payments?.[0]?.paymentNote || "N/A",
      sale.creatorName || "N/A",
    ].join(","));
    const csvContent = "data:text/csv;charset=utf-8," + [...headers, ...data].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sales_returns.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Pagination
  const totalPages = Math.ceil(filteredData.length / entriesPerPage);
  const currentItems = filteredData.slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  // Calculate totals
  const calculate = () => {
    const totalRefund = currentItems.reduce((sum, item) => sum + (Number(item.totalRefund) || 0), 0);
    const paidAmount = currentItems.reduce((sum, item) => sum + (Number(item.payments?.[0]?.amount) || 0), 0);
    setTotal(totalRefund);
    setPaid(paidAmount);
  };

  useEffect(() => {
    calculate();
  }, [currentItems]);


  
const generatePlainTextReceipt = (data) => {
   console.log(data)
  const store={
      logo:        "/logo/inspiredgrow.jpg",                       //  40-50 px square looks right
  storeName:   "Grocery on Wheels",                                //  already in state
  tagline:     "GROCERY ON WHEELS",
  address:     "Basement 210-211 new Rishi Nagar near\nShree Shyam Baba Mandir Gali No. 9, Hisar – 125001",
  gst:         "06AAGCI0630K1ZR",
  phone:       "9050092092",
  email:       "INSPIREDGROW@GMAIL.COM",
  }
  
  const lineWidth = 42; // Standard for 3-inch (80mm) Epson P80 printers
  const line = '-'.repeat(lineWidth) + '\n';

  // --- Helper Functions ---
  const pad = (str, len, char = ' ') => (str + char.repeat(len)).substring(0, len);
  const padRight = (str, len, char = ' ') => (String(str) + char.repeat(len)).substring(0, len);
  const padLeft = (str, len, char = ' ') => (char.repeat(len) + String(str)).slice(-len);
  
  const wrapText = (text, width) => {
    if (!text || width <= 0) return [];
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    words.forEach(word => {
      if ((currentLine + ' ' + word).trim().length <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    if (currentLine) lines.push(currentLine);
    return lines.length > 0 ? lines : [''];
  };

  const centerText = (text) => {
    if (!text) return '\n';
    const space = Math.max(0, Math.floor((lineWidth - text.length) / 2));
    return ' '.repeat(space) + text;
  };

  const twoColumn = (left, right) => {
    const space = lineWidth - left.length - right.length;
    return left + ' '.repeat(Math.max(0, space)) + right;
  };
  
 
  
  // Adjusted total to fit, let's recalculate: 3+18+4+7+7 = 39. Left for total = 3. Too small.
  // Let's use the previous stable widths.
  const finalColWidths = {
    sno: 3,
    item: 15,
    qty: 4,
    mrp: 7,
    rate: 7,
    total: 6,
  };

  
  // =================================================================
  // THIS IS THE NEW, SIMPLER, AND CORRECTED ITEM ROW FORMATTER
  // =================================================================
  const formatItemRow = (item, index) => {
    const snoStr = `${index + 1}.`;
    
    // 1. Wrap the entire item name into lines first.
    const nameLines = wrapText(item.item?.itemName, finalColWidths.item);
    
    let rowText = '';

    // 2. Loop through each line of the wrapped name.
    nameLines.forEach((line, i) => {
      if (i === 0) {
        // For the FIRST line, print the name part AND all the numbers.
        rowText += padRight(snoStr, finalColWidths.sno) +
                   padRight(line, finalColWidths.item) +
                   padLeft(item.quantity, finalColWidths.qty) +
                   padLeft(item.item?.mrp?.toFixed(2) ||0, finalColWidths.mrp) +
                   padLeft(item.item?.salesPrice?.toFixed(2)||0, finalColWidths.rate) +
                   padLeft((item.quantity * item.item.salesPrice).toFixed(2), finalColWidths.total) + '\n';
      } else {
        // For ALL OTHER wrapped lines, print only the name part.
        // The rest of the line will be blank, ensuring left alignment.
        rowText += padRight('', finalColWidths.sno) +
                   padRight(line, finalColWidths.item) + '\n';
      }
    });
    
    return rowText;
  };

  
  let text = '';

  // --- Header ---
  text += centerText(data.warehouse.warehouseName) + '\n';
  // wrapText(store.address, lineWidth).forEach(wrappedLine => {
  //     text += centerText(wrappedLine) + '\n';
  // });
  text += centerText(" Basement 210-211 new Rishi Nagar near \n Shree Shyam Baba Mandir Gali No. 9,Hisar-125001") + '\n';
  text += line;
  
  // --- Order Info ---
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN');
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  text += twoColumn(`Date: ${data.returnDate.substring(0,10)}`, `Time: ${data.returnDate.substring(11,16)}`) + '\n';
   text+=`Customer: ${data.customer.customerName || 'walk-in customer'}`+'\n';
  text += line;

  // --- Items Table Header ---
  text += padRight('#', finalColWidths.sno) + 
          padRight('Item', finalColWidths.item) + 
          padLeft('Qty', finalColWidths.qty) +
          padLeft('MRP', finalColWidths.mrp) +
          padLeft('Rate', finalColWidths.rate) +
          padLeft('Total', finalColWidths.total) + '\n';
  
  // --- Items Table Body ---
  data.items.forEach((item, index) => {
    console.log(`Formatting item ${index + 1}:`, item);
    text += formatItemRow(item, index);
  });
  text += line;

  // --- Full Summary Section ---
 

   const totalQuantity = data.items.reduce((sum, item) => sum + item.quantity, 0);
                

        const rawTotal = data.items.reduce((sum, item) => sum + (item.quantity * item.item?.salesPrice || 0), 0);
                
            // a
        const disc = data.totalDiscount || 0;
        const taxAmt = data.taxAmount || 0;
                

        const netBeforeTax = rawTotal - disc;
        
const totalM=data.items.reduce((sum, item) => sum + (item.quantity * item.item?.mrp), 0);
const totalSales=data.items.reduce((sum, item) => sum + (item.quantity * item.item?.salesPrice), 0);


const paid = data.payments.reduce((sum, p) => sum + p.amount, 0);
      // a
const prevDue = data.previousBalance  || 0;

const totalDue = prevDue + netBeforeTax + taxAmt - paid;

    text += `${pad('Total Quantity:', 34)} ${padLeft(totalQuantity||0, 6)}\n`;
    text += `${pad('Other Charges:', 34)} ${padLeft(data.otherCharges||0, 6)}\n`;
    text += `${pad('Before Tax:', 34)} ${padLeft(`${(totalM)?.toFixed(2)||0}`, 6)}\n`;
    text += `${pad('Total Discount:', 34)} ${padLeft(`-${(totalM-totalSales)?.toFixed(2)||0}`, 6)}\n`;


    text += `${pad('Net Before Tax:', 34)} ${padLeft(totalSales?.toFixed(2)||0, 6)}\n`;

    text += `${pad('Tax Amount:', 34)} ${padLeft(taxAmt?.toFixed(2)||0, 6)}\n`;
    text += `${pad('SubTotal:', 34)} ${padLeft(((taxAmt || 0)+ totalSales)?.toFixed(2)||0, 6)}\n`;
    text += `${pad('Other Charges:', 34)} ${padLeft(data.otherCharges?.toFixed(2)||0, 6)}\n`;
    text += `${pad('Total:', 34)} ${padLeft(((taxAmt || 0)+ totalSales + (data.otherCharges || 0))?.toFixed(2)||0, 6)}\n`;
    text += `${pad('Paid Payment:', 34)} ${padLeft(paid?.toFixed(2)||0, 6)}\n`;
    text += `${pad('Previous Due:', 34)} ${padLeft(prevDue?.toFixed(2)||0, 6)}\n`;
    text += `${pad('Total Due:', 34)} ${padLeft((((taxAmt || 0)+ totalSales + (data.otherCharges || 0))-paid)?.toFixed(2)||0, 6)}\n`;
    text += line;

    // Payment type
    data.payments.forEach((p, i) => {
        text += `Payment Type: ${p.paymentNote} ₹${p.amount?.toFixed(2)||0}\n`;
    });

    text+=line;
  
  // --- Footer ---
  text += centerText('------Thank You & Visit Again!------') + '\n\n\n';
  console.log(text)
  return text;
};



    // --- Action Handlers ---
    const handleBluetoothPrint = (sale) => {
  try {
    setLoading(true);
    const printinfo = generatePlainTextReceipt(sale);
    console.log(printinfo);

    // Check if a device is connected before printing
    window.bluetoothSerial.isConnected(
      () => {
        // ✅ Device is connected, proceed with printing
        window.bluetoothSerial.write(
          printinfo,
          () => alert('✅ Print success'),
          (failure) => alert(`❌ Print failed: ${failure}`)
        );
      },
      () => {
        // ❌ Not connected
setDevice(true);
      }
    );
  } catch (error) {
    console.error("Bluetooth print error:", error);
    alert("❌ Unexpected error occurred.");
  } finally {
    setLoading(false);
  }
};




  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      {/* Navbar */}
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar isSidebarOpen={isSidebarOpen} />
        {/* Content */}
        {
          device && <BluetoothDevicesPage setDevice={setDevice} />
        }
        <div className="flex-1 p-4 overflow-x-auto">
          {/* Header */}
          <header className="flex flex-col items-center justify-between w-full px-2 py-2 mb-4 bg-gray-100 rounded-md shadow md:flex-row">
            <div className="flex items-baseline gap-2">
              <h1 className="text-lg font-semibold truncate sm:text-xl">Sales Returns List</h1>
              <span className="text-xs text-gray-600 sm:text-sm">View/Search Returns</span>
            </div>
            <nav className="flex items-center gap-2 text-xs text-gray-500 sm:text-sm">
              <NavLink to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                <FaTachometerAlt className="mr-1" /> Home
              </NavLink>
              <span>  </span>
              <NavLink to="/sales-payment-list" className="text-gray-700 no-underline hover:text-cyan-600">
                Sales Returns List
              </NavLink>
            </nav>
          </header>

          {/* Cards */}
          <div className="grid grid-cols-1 gap-4 mb-4 lg:grid-cols-2">
            <div className="flex items-center p-4 bg-white rounded-lg shadow">
              <ShoppingBagIcon className="w-12 h-12 text-white rounded bg-cyan-500" />
              <div className="ml-4">
                <h2 className="text-xl font-bold">{summary.totalCount}</h2>
                <p className="font-semibold">Total Returns</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-white rounded-lg shadow">
              <FaDollarSign className="w-12 h-12 text-white rounded bg-cyan-500" />
              <div className="ml-4">
                <h2 className="text-xl font-bold">₹{summary.totalRefunded.toFixed(2)}</h2>
                <p className="font-semibold">Total Refunded Amount</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-white rounded-lg shadow">
              <FontAwesomeIcon icon={faMoneyBill} className="w-12 h-12 text-white rounded bg-cyan-500" />
              <div className="ml-4">
                <h2 className="text-xl font-bold">₹{paid.toFixed(2)}</h2>
                <p className="font-semibold">Total Paid Amount</p>
              </div>
            </div>
            <div className="flex items-center p-4 bg-white rounded-lg shadow">
              <CashIcon className="w-12 h-12 text-white rounded bg-cyan-500" />
              <div className="ml-4">
                <h2 className="text-xl font-bold">₹{(total - paid).toFixed(2)}</h2>
                <p className="font-semibold">Total Return Due</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col items-center justify-between gap-4 mb-4 md:flex-row">
            <div className="w-full md:w-64">
              <label className="block font-semibold text-gray-700">Warehouse</label>
              <Select
                options={warehouses}
                value={warehouses.find(w => w.value === warehouse)}
                onChange={(option) => setWarehouse(option.value)}
              />
            </div>
            <button
              className="px-4 py-2 text-white rounded bg-cyan-500 hover:bg-cyan-600"
              onClick={() => navigate('/sales-return/add')}
            >
              + Create Return
            </button>
          </div>

          {/* Controls */}
          <div className="flex flex-col justify-between mb-4 space-y-2 md:flex-row md:space-y-0 md:items-center">
            <div className="flex items-center space-x-2">
              <span className="text-sm">Show</span>
              <select
                className="p-2 text-sm border rounded"
                value={entriesPerPage}
                onChange={handleEntriesChange}
              >
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
              <span className="text-sm">Entries</span>
            </div>
            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="flex gap-2">
                <button onClick={handleCopy} className="px-3 py-2 text-sm text-white rounded bg-cyan-500">Copy</button>
                <button onClick={handleExcelDownload} className="px-3 py-2 text-sm text-white rounded bg-cyan-500">Excel</button>
                <button onClick={handlePdfDownload} className="px-3 py-2 text-sm text-white rounded bg-cyan-500">PDF</button>
                <button onClick={handlePrint} className="px-3 py-2 text-sm text-white rounded bg-cyan-500">Print</button>
                <button onClick={handleCsvDownload} className="px-3 py-2 text-sm text-white rounded bg-cyan-500">CSV</button>
              </div>
              <input
                type="text"
                placeholder="Search by Customer or Return Code"
                className="p-2 text-sm border rounded"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full bg-gray-100 border">
              <thead className="bg-gray-300">
                <tr>
                  <th className="px-4 py-2 text-sm font-bold text-left border">Return Date</th>
                  <th className="px-4 py-2 text-sm font-bold text-left border">Return Code</th>
                  <th className="px-4 py-2 text-sm font-bold text-left border">Transaction Code</th>
                  <th className="px-4 py-2 text-sm font-bold text-left border">Status</th>
                  <th className="px-4 py-2 text-sm font-bold text-left border">Customer Name</th>
                  <th className="px-4 py-2 text-sm font-bold text-left border">Total Refund</th>
                  <th className="px-4 py-2 text-sm font-bold text-left border">Paid Amount</th>
                  <th className="px-4 py-2 text-sm font-bold text-left border">Payment Note</th>
                  <th className="px-4 py-2 text-sm font-bold text-left border">Created By</th>
                  <th className="px-4 py-2 text-sm font-bold text-left border">Action</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-4 text-center text-gray-500 border">
                      No returns available
                    </td>
                  </tr>
                ) : (
                  currentItems.map((sale) => {
                    const returnDate = sale.returnDate ? new Date(sale.returnDate).toDateString() : "N/A";
                    const transactionCode = sale.saleModel === "PosOrder" ? sale.sale?.saleCode : sale.sale?.referenceNo || "N/A";
                    const status = sale.status || "N/A";
                    const customerName = sale.customer?.customerName || "N/A";
                    const totalRefund = Number(sale.totalRefund) || 0;
                    const paidAmount = Number(sale.payments?.[0]?.amount) || 0;
                    const paymentNote = sale.payments?.[0]?.paymentNote || "N/A";
                    const creator = sale.creatorName || "N/A";

                    return (
                      <tr key={sale._id} className="bg-white">
                        <td className="px-4 py-2 border">{returnDate}</td>
                        <td className="px-4 py-2 border">{sale.returnCode}</td>
                        <td className="px-4 py-2 border">{transactionCode}</td>
                        <td className="px-4 py-2 border">{status}</td>
                        <td className="px-4 py-2 border">{customerName}</td>
                        <td className="px-4 py-2 border">₹{totalRefund.toFixed(2)}</td>
                        <td className="px-4 py-2 border">₹{paidAmount.toFixed(2)}</td>
                        <td className="px-4 py-2 border">{paymentNote}</td>
                        <td className="px-4 py-2 border">{creator}</td>
                        <td className="relative px-4 py-2 border">
                          <button
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-full bg-cyan-600 hover:bg-cyan-700"
                            onClick={() => setActionMenu(actionMenu === sale._id ? null : sale._id)}
                          >
                            Action
                            <svg
                              className={`w-4 h-4 transition-transform ${actionMenu === sale._id ? "rotate-180" : ""}`}
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2}
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {actionMenu === sale._id && (
                            <div className="absolute right-0 z-10 w-32 mt-2 bg-white border rounded shadow-lg">
                              
                              {hasPermissionFor("SalesReturn", "Edit") && (
                                <button
                                  className="w-full px-4 py-2 text-left text-green-500 hover:bg-gray-100"
                                  onClick={() => {
                                    navigate(`/sales-return/edit/${sale._id}`);
                                    setActionMenu(null);
                                  }}
                                >
                                  ✏️ Edit
                                </button>
                              )}
                                 <button
                                className="w-full px-2 py-1 text-left text-blue-500 hover:bg-gray-100"
                                onClick={() =>  {
                                  handleBluetoothPrint(sale);
                                  setActionMenu(null);
                                }}
                              >
                                📄 Print
                              </button>
                              {hasPermissionFor("SalesReturn", "Delete") && (
                                <button
                                  className="w-full px-4 py-2 text-left text-red-500 hover:bg-gray-100"
                                  onClick={() => {
handleDelete(sale._id);
                                    setActionMenu(null);
                                  }}
                                >
                                  🗑️ Delete
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
                {currentItems.length > 0 && (
                  <tr className="font-bold bg-gray-100">
                    <td colSpan={5} className="px-4 py-2 text-right border">Total:</td>
                    <td className="px-4 py-2 border">₹{total.toFixed(2)}</td>
                    <td className="px-4 py-2 border">₹{paid.toFixed(2)}</td>
                    <td colSpan={3} className="px-4 py-2 border"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-start justify-between gap-2 p-2 md:flex-row md:items-center">
            <span>
              Showing {(currentPage - 1) * entriesPerPage + 1} to {Math.min(currentPage * entriesPerPage, filteredData.length)} of {filteredData.length} entries
            </span>
            <div className="flex gap-2">
              <button
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg ${
                  currentPage === 1 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <button
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg ${
                  currentPage === totalPages ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReturnList;
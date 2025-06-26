// src/pages/AddMoneyTransfer.jsx
import React, { useState, useEffect } from "react";
import Select from "react-select";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../Navbar";
import Sidebar from "../Sidebar";
import LoadingScreen from "../../Loading";
import axios from "axios";

export default function AddMoneyTransfer() {
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");

  // 1) Global loading & form state
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [debitOptions, setDebitOptions] = useState([]);
  const [storeParent, setStoreParent] = useState(null);

  const [formData, setFormData] = useState({
    transferDate: new Date().toLocaleDateString('en-CA'),
    transferCode: "",
    debitAccount: "",
    creditAccount: "",
    amount: "",
    referenceNo: "",
    note: "",
  });

  // Bearer header
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // Collapse sidebar on small screens
  useEffect(() => {
    const handleResize = () => setSidebarOpen(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 2) Fetch ALL accounts once
  useEffect(() => {
    axios
      .get("api/accounts", { headers })
      .then(res => setAccounts(res.data.data || []))
      .catch(console.error);
  }, []);

  // 3) Load store’s parentAccount → seed storeParent + creditAccount
  useEffect(() => {
    const storeId = localStorage.getItem("storeId");
    if (!storeId) return;

    // If you only have the "get all stores" endpoint:
    axios
      .get("admin/store/add/store", { headers })
      .then(res => {
        const allStores = res.data.result || [];
        const store = allStores.find(s => s._id === storeId);
        if (!store) return;
        const pid =
          typeof store.storeAccount === "string"
            ? store.storeAccount
            : store.storeAccount?._id;
        setStoreParent(pid);
        setFormData(f => ({ ...f, creditAccount: pid }));
      })
      .catch(console.error);

    // — Or, if you have GET /api/stores/:id:
    // axios.get(`api/stores/${storeId}`, { headers })
    //   .then(res => {
    //     const store = res.data.data;
    //     const pid = typeof store.storeAccount === "string"
    //       ? store.storeAccount
    //       : store.storeAccount?._id;
    //     setStoreParent(pid);
    //     setFormData(f => ({ ...f, creditAccount: pid }));
    //   })
    //   .catch(console.error);
  }, []);

  // 4) Filter debitOptions whenever accounts or storeParent change
  useEffect(() => {
    if (!storeParent || accounts.length === 0) return;
  
    const mine = accounts.filter(a => {
      // normalize whatever shape parentAccount is
      const pid = typeof a.parentAccount === "string"
        ? a.parentAccount
        : a.parentAccount?._id;
      return pid === storeParent;
    });
  
    setDebitOptions(
      mine.map(a => ({
        label: `${a.accountNumber} – ${a.accountName}`,
        value: a._id
      }))
    );
  }, [storeParent, accounts]);
  

  // 5) If editing, load existing transfer
  useEffect(() => {
    if (!editId) return;
    setLoading(true);
    axios
      .get("api/money-transfers", { headers })
      .then(res => {
        const found = res.data.data.find(t => t._id === editId);
        if (found) {
          setFormData({
            transferDate: new Date(found.transferDate)
              .toISOString()
              .split("T")[0],
            transferCode: found.transferCode,
            debitAccount: found.debitAccount._id,
            creditAccount: found.creditAccount._id,
            amount: found.amount,
            referenceNo: found.referenceNo || "",
            note: found.note || "",
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [editId]);

  // 6) Derive credit account label
  const creditAcct = accounts.find(a => a._id === formData.creditAccount);
  const creditLabel = creditAcct
    ? `${creditAcct.accountNumber} – ${creditAcct.accountName}`
    : "Loading…";

  // 7) Handlers
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
  };
  const handleSelect = (field, sel) => {
    setFormData(f => ({ ...f, [field]: sel ? sel.value : "" }));
  };
  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!token) throw new Error("Not logged in");
      const url = editId
        ? `api/money-transfers/${editId}`
        : "api/money-transfers";
      const method = editId ? "put" : "post";
      await axios[method](url, formData, { headers: { ...headers, "Content-Type": "application/json" } });
      alert(editId ? "Updated!" : "Created!");
      navigate("/money-transfer-list");
    } catch (err) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleClose = () => navigate("/dashboard");

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />

        <div className="flex-1 p-4 overflow-auto bg-gray-100">
          <div className="p-6 bg-white rounded shadow">
            <h1 className="mb-4 text-2xl font-semibold">
              {editId ? "Edit" : "New"} Money Transfer
            </h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block font-medium">Transfer Date</label>
                  <input
                    type="date"
                    name="transferDate"
                    value={formData.transferDate}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium">Transfer Code</label>
                  <input
                    type="text"
                    name="transferCode"
                    value={formData.transferCode}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    placeholder="e.g. MT1001"
                    required
                  />
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block font-medium">Debit Account</label>
                  <Select
                    options={debitOptions}
                    value={debitOptions.find(o => o.value === formData.debitAccount) || null}
                    onChange={sel => handleSelect("debitAccount", sel)}
                    placeholder="— choose debit account —"
                    isClearable={false}
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium">Credit Account</label>
                  <div className="p-2 bg-gray-100 border rounded">
                    {creditLabel}
                  </div>
                </div>
              </div>

              {/* Row 3 */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="block font-medium">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    min="0"
                    value={formData.amount}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block font-medium">Reference No</label>
                  <input
                    type="text"
                    name="referenceNo"
                    value={formData.referenceNo}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Row 4 */}
              <div>
                <label className="block font-medium">Note</label>
                <textarea
                  name="note"
                  rows={2}
                  value={formData.note}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="Optional"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="px-6 py-2 text-white bg-green-600 rounded hover:bg-green-700"
                >
                  {editId ? "Update" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2 text-white bg-orange-500 rounded hover:bg-orange-600"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// src/pages/AddAccount.jsx
import React, { useEffect, useState } from "react";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import Select from "react-select";
import axios from "axios";

import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import Loading from "../../Loading.jsx";

const AddAccount = () => {
        const link="https://pos.inspiredgrow.in/vps"
  /* ────────────── basics */
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const accountId = params.get("id");

  const role = (localStorage.getItem("role") || "").toLowerCase();
  const assignedStore = localStorage.getItem("storeId");

  /* ────────────── ui state */
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [loading, setLoading] = useState(false);

  /* ────────────── data state */
  const [accounts, setAccounts] = useState([]);
  const [stores, setStores] = useState([]);
  const [storeParent, setStoreParent] = useState(null);

  const [form, setForm] = useState({
    accountNumber: "",
    accountName: "",
    openingBalance: 0,
    note: "",
    parentAccount: null
  });

  /* ────────────── helpers */
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const nextCode = (last) => {
    const [p, n] =
      typeof last === "string" && last.includes("-") ? last.split("-") : ["ACC", "099"];
    return `${p}-${String(+n + 1).padStart(3, "0")}`;
  };

  /* ────────────── fetch all accounts */
  useEffect(() => {
    let alive = true;
    axios
      .get(`${link}/api/accounts`, { headers })
      .then((res) => {
        if (!alive) return;
        const all = res.data.data ?? [];
        setAccounts(
          all.map((a) => ({
            label: `${a.accountNumber} – ${a.accountName}`,
            value: a._id
          }))
        );

        if (!accountId) {
          const lastAcc = all.at(-1)?.accountNumber;
          setForm((f) => ({ ...f, accountNumber: nextCode(lastAcc) }));
        }
      })
      .catch(console.error);
    return () => {
      alive = false;
    };
  }, [accountId]);

  /* ────────────── fetch all stores (only for non-admin) */
  useEffect(() => {
    if (role === "admin") return;
    let alive = true;
    axios
      .get(`${link}/admin/store/add/store`, { headers })
      .then((res) => alive && setStores(res.data.result ?? []))
      .catch(console.error);
    return () => {
      alive = false;
    };
  }, [role]);

  /* ────────────── fetch account when editing */
  useEffect(() => {
    if (!accountId) return;
    setLoading(true);

    axios
      .get(`${link}/api/accounts/${accountId}`, { headers })
      .then((res) => {
        const a = res.data.data;
        if (!a) return;

        setForm({
          accountNumber: a.accountNumber,
          accountName: a.accountName,
          openingBalance: a.openingBalance || 0,
          note: a.note || "",
          parentAccount:
            typeof a.parentAccount === "string" ? a.parentAccount : a.parentAccount?._id
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [accountId]);

  /* ────────────── derive parentAccount for store-user */
  useEffect(() => {
    if (role === "admin" || accountId) return;
    if (!accounts.length || !stores.length) return;

    const storeDoc = stores.find((s) => s._id === assignedStore);
    if (!storeDoc) return;

    const acctId =
      typeof storeDoc.storeAccount === "string"
        ? storeDoc.storeAccount
        : storeDoc.storeAccount?._id;

    if (!acctId) return;

    setStoreParent(acctId);
    setForm((f) => ({ ...f, parentAccount: acctId }));
  }, [accounts, stores, role, accountId, assignedStore]);

  /* ────────────── handlers */
  const onChange = (e) => {
    const { name, value, type } = e.target;
    setForm((f) => ({ ...f, [name]: type === "number" ? Number(value) : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };

      if (role !== "admin") {
        delete payload.parentAccount; // store-user
      } else if (!payload.parentAccount) {
        delete payload.parentAccount; // admin creating root
      }

      if (accountId) {
        await axios.put(
          `${link}/api/accounts/${accountId}`,
          payload,
          { headers }
        );
        alert("Account updated!");
      } else {
        await axios.post(`${link}/api/accounts`, payload, {
          headers
        });
        alert("Account created!");
      }
      navigate("/account-list1");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message || "Failed to save account");
    } finally {
      setLoading(false);
    }
  };

  /* ────────────── render */
  if (loading) return <Loading />;

  const parentLabel =
    accounts.find((o) => o.value === (form.parentAccount ?? storeParent))?.label ||
    form.parentAccount ||
    "Loading…";

  /* enable/disable save button */
  const saveDisabled =
    role !== "admin"
      ? !form.parentAccount || !form.accountNumber
      : !form.accountNumber;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={sidebarOpen} />
        <main className="flex-grow p-4 overflow-auto bg-gray-100">
          {/* breadcrumb */}
          <header className="flex justify-between p-4 mb-4 bg-white rounded shadow">
            <h1 className="text-xl font-bold">{accountId ? "Edit Account" : "Add Account"}</h1>
            <nav className="flex items-center text-gray-500">
              <a href="/dashboard" className="flex items-center">
                <FaTachometerAlt className="mr-1" /> Home
              </a>
              <BiChevronRight className="mx-2" />
              <a href="/account-list1">Accounts List</a>
            </nav>
          </header>

          {/* form */}
          <form onSubmit={onSubmit} className="p-6 space-y-4 bg-white rounded shadow">
            {/* parent account */}
            <div>
              <label className="block mb-1 font-semibold">
                Parent Account {role !== "admin" && <span className="text-red-500">*</span>}
              </label>

              {role === "admin" ? (
                <Select
                  options={accounts}
                  value={accounts.find((o) => o.value === form.parentAccount) || null}
                  onChange={(sel) =>
                    setForm((f) => ({ ...f, parentAccount: sel ? sel.value : null }))
                  }
                  placeholder="(leave blank to create a root account)"
                  isClearable
                />
              ) : (
                <div className="p-2 bg-gray-100 border rounded">{parentLabel}</div>
              )}
            </div>

            {/* account number */}
            <div>
              <label className="block mb-1 font-semibold">Account Number</label>
              <input
                className="w-full p-2 bg-gray-200 border rounded"
                name="accountNumber"
                value={form.accountNumber}
                readOnly
              />
            </div>

            {/* account name */}
            <div>
              <label className="block mb-1 font-semibold">Account Name</label>
              <input
                className="w-full p-2 border rounded"
                name="accountName"
                value={form.accountName}
                onChange={onChange}
                required
              />
            </div>

            {/* opening balance */}
            <div>
              <label className="block mb-1 font-semibold">Opening Balance</label>
              <input
                className="w-full p-2 border rounded"
                type="number"
                min={0}
                name="openingBalance"
                value={form.openingBalance}
                onChange={onChange}
              />
            </div>

            {/* note */}
            <div>
              <label className="block mb-1 font-semibold">Note</label>
              <textarea
                className="w-full p-2 border rounded"
                name="note"
                value={form.note}
                onChange={onChange}
              />
            </div>

            {/* actions */}
            <div className="flex justify-center gap-4 pt-4">
              <button
                type="submit"
                disabled={saveDisabled}
                className={`px-6 py-2 rounded text-white ${
                  saveDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {accountId ? "Update" : "Save"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/account-list")}
                className="px-6 py-2 text-white bg-gray-500 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default AddAccount;

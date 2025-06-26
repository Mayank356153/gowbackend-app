// src/pages/AddDeposit.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Select from 'react-select';
import Navbar from '../Navbar';
import Sidebar from '../Sidebar';
import LoadingScreen from '../../Loading';
import axios from 'axios';

export default function AddDeposit() {
  const [searchParams]  = useSearchParams();
  const editId          = searchParams.get('id');
  const navigate        = useNavigate();
  const token           = localStorage.getItem('token');
  const headers         = { Authorization: `Bearer ${token}` };

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [loading,    setLoading]      = useState(true);
  const [saving,     setSaving]       = useState(false);

  // Data lists
  const [stores,     setStores]       = useState([]);
  const [accounts,   setAccounts]     = useState([]);

  // Derived
  const [storeParent, setStoreParent] = useState(null);
  const [creditOpts,  setCreditOpts]  = useState([]);

  // Form
  const [form, setForm] = useState({
    depositDate:   new Date().toLocaleDateString('en-CA'),
    referenceNo:   '',
    debitAccount:  '',
    creditAccount: '',
    amount:        '',
    note:          ''
  });

  // handle sidebar collapse
  useEffect(() => {
    const onResize = () => setSidebarOpen(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // 1️⃣ Fetch stores, accounts, and (if editing) deposit
  useEffect(() => {
    if (!token) return navigate('/');
    const storeFetch = axios
      .get('/admin/store/add/store', { headers })
      .then(res => setStores(res.data.result || []))
      .catch(console.error);

    const acctFetch = axios
      .get('/api/accounts', { headers })
      .then(res => setAccounts(res.data.data || []))
      .catch(console.error);

    let depositFetch = Promise.resolve();
    if (editId) {
      depositFetch = axios
        .get(`/api/deposits/${editId}`, { headers })
        .then(res => {
          const d = res.data.data;
          setForm({
            depositDate:  new Date(d.depositDate).toISOString().slice(0,10),
            referenceNo:  d.referenceNo || '',
            debitAccount: d.debitAccount?._id || '',
            creditAccount:d.creditAccount?._id || '',
            amount:       d.amount || '',
            note:         d.note || ''
          });
        })
        .catch(console.error);
    }

    Promise.all([storeFetch, acctFetch, depositFetch])
      .finally(() => setLoading(false));
  }, [editId, navigate, token]);

  // 2️⃣ Once stores are loaded, determine this store’s parentAccount (fixed debit)
  useEffect(() => {
    if (!stores.length) return;
    const storeId = localStorage.getItem('storeId');
    const st = stores.find(s => s._id === storeId);
    if (!st) return;
    const pid = typeof st.storeAccount === 'string'
      ? st.storeAccount
      : st.storeAccount?._id;
    setStoreParent(pid);
    setForm(f => ({ ...f, debitAccount: pid }));
  }, [stores]);

  // 3️⃣ Build creditOpts = all accounts whose parentAccount === storeParent
  useEffect(() => {
    if (!storeParent || !accounts.length) return;
    const kids = accounts
      .filter(a => {
        const pid = typeof a.parentAccount === 'string'
          ? a.parentAccount
          : a.parentAccount?._id;
        return pid === storeParent;
      })
      .map(a => ({ value: a._id, label: `${a.accountNumber} – ${a.accountName}` }));
    setCreditOpts(kids);
  }, [accounts, storeParent]);

  // form handlers
  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };
  const handleSelect = (field, sel) => {
    setForm(f => ({ ...f, [field]: sel ? sel.value : '' }));
  };

  // submit
  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const url    = editId
        ? `/api/deposits/${editId}`
        : `/api/deposits`;
      const method = editId ? 'put' : 'post';
      await axios[method](url, form, { headers:{ 'Content-Type':'application/json', ...headers }});

      // ✅ re-fetch your cash summary here if you display it on the same page
      // const summary = await axios.get(
      //   `api/cash-summary?warehouseId=${localStorage.getItem('storeId')}`,
      //   { headers }
      // );
      // console.log('updated cash summary', summary.data);

      alert(editId ? 'Deposit updated!' : 'Deposit created!');
      navigate('/deposit-list');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  // find debit label to display
  const debitAcc = accounts.find(a => a._id === storeParent);
  const debitLabel = debitAcc
    ? `${debitAcc.accountNumber} – ${debitAcc.accountName}`
    : 'Loading…';

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}/>
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={sidebarOpen}/>
        <main className="flex-1 p-6 overflow-auto bg-gray-100">
          <div className="p-6 bg-white rounded shadow-lg">
            <h1 className="mb-4 text-2xl font-bold">
              {editId ? 'Edit Deposit' : 'Add Deposit'}
            </h1>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date & Ref */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 font-semibold">Deposit Date</label>
                  <input
                    type="date"
                    name="depositDate"
                    value={form.depositDate}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Reference No</label>
                  <input
                    type="text"
                    name="referenceNo"
                    value={form.referenceNo}
                    onChange={handleChange}
                    placeholder="Optional"
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              {/* Debit (fixed) */}
              <div>
                <label className="block mb-1 font-semibold">Out</label>
                <div className="p-2 bg-gray-100 border rounded">{debitLabel}</div>
              </div>

              {/* Credit dropdown */}
              <div>
                <label className="block mb-1 font-semibold">In</label>
                <Select
                  options={creditOpts}
                  value={creditOpts.find(o => o.value === form.creditAccount) || null}
                  onChange={sel => handleSelect('creditAccount', sel)}
                  placeholder="— Select credit account —"
                  required
                />
              </div>

              {/* Amount & Note */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block mb-1 font-semibold">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    min="0"
                    step="0.01"
                    value={form.amount}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Note</label>
                  <textarea
                    name="note"
                    rows={2}
                    value={form.note}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-6 py-2 rounded text-white ${
                    saving ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {saving ? 'Saving…' : editId ? 'Update' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/deposit-list')}
                  className="px-6 py-2 text-white bg-gray-500 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

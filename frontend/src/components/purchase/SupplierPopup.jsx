/* ──────────────────────────────────────────────────────────────
   SupplierPopup.jsx     –  full-screen modal to create a Supplier
   Covers *all* fields that exist in your standalone Add-Supplier page
   (supplierName, email, mobile, phone, address, city, state, country,
    gstNumber, taxNumber, postcode, openingBalance, previousBalance,
    purchaseDue, purchaseReturnDue, status)
   ────────────────────────────────────────────────────────────── */
import { useEffect, useState } from "react";
import Select  from "react-select";
import axios   from "axios";

/* utility to map API list → react-select options */
const toOpt = (label) => (o) => ({
  label: o[label],
  value: o._id ?? o[label],
});

export default function SupplierPopup({ open, onClose, onCreated }) {
  const link="https://pos.inspiredgrow.in/vps"
  /* ────── 1. Hooks (always defined) ────── */
  const empty = {
    supplierName: "",
    email: "",
    mobile: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postcode: "",
    gstNumber: "",
    taxNumber: "",
    openingBalance: 0,
    previousBalance: 0,
    purchaseDue: 0,
    purchaseReturnDue: 0,
    status: "Active",
  };

  const [form,       setForm]       = useState(empty);
  const [countries,  setCountries]  = useState([]);
  const [states,     setStates]     = useState([]);
  const [saving,     setSaving]     = useState(false);
  const [errorMsg,   setErrorMsg]   = useState("");

  /* load look-ups & reset form whenever the popup opens */
  useEffect(() => {
    if (!open) return;
    setForm(empty);
    setErrorMsg("");

    const token = localStorage.getItem("token");
    const hdr   = { headers:{ Authorization:`Bearer ${token}` } };

    Promise.all([
      axios.get(`${link}/api/countries`, hdr),
      axios.get(`${link}/api/states`,    hdr),
    ])
      .then(([cRes, sRes]) => {
        setCountries(
          (cRes.data.data || []).filter(c=>c.status==="active").map(toOpt("countryName"))
        );
        setStates(
          (sRes.data.data || []).filter(s=>s.status==="active").map(toOpt("stateName"))
        );
      })
      .catch((e) => setErrorMsg("Failed to load country/state lists"));
  }, [open]);

  /* esc-key closes dialog */
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  /* ────── 2. early-return when hidden ────── */
  if (!open) return null;

  /* ────── 3. helpers ────── */
  const change = (e) =>
    setForm({ ...form, [e.target.name]: e.target.type === "number" ? Number(e.target.value) : e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setErrorMsg("");
    try {
      const { data } = await axios.post(
        `${link}/api/suppliers`,
        form,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      onCreated?.(data.data || data);
      onClose();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  /* ────── 4. UI ────── */
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={save}
        className="max-h-[95vh] w-full max-w-3xl overflow-y-auto
                   rounded-lg bg-white p-6 shadow-lg"
      >
        <h2 className="mb-4 text-xl font-semibold text-center">Add Supplier</h2>

        {/* --- 1st row --- */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 text-sm font-medium">
              Supplier Name *
            </label>
            <input
              required
              name="supplierName"
              value={form.supplierName}
              onChange={change}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={change}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>

        {/* --- 2nd row --- */}
        <div className="grid gap-4 mt-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 text-sm">Mobile</label>
            <input
              name="mobile"
              value={form.mobile}
              onChange={change}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Phone</label>
            <input
              name="phone"
              value={form.phone}
              onChange={change}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>

        {/* --- address block --- */}
        <div className="mt-4">
          <label className="block mb-1 text-sm">Address</label>
          <textarea
            name="address"
            rows="2"
            value={form.address}
            onChange={change}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        {/* city / postcode */}
        <div className="grid gap-4 mt-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 text-sm">City</label>
            <input
              name="city"
              value={form.city}
              onChange={change}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Postcode</label>
            <input
              name="postcode"
              value={form.postcode}
              onChange={change}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>

        {/* country / state selects */}
        <div className="grid gap-4 mt-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 text-sm">Country</label>
            <Select
              options={countries}
              value={countries.find((o) => o.value === form.country) || null}
              onChange={(o) => setForm({ ...form, country: o?.value || "" })}
              placeholder="Select country"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">State</label>
            <Select
              options={states}
              value={states.find((o) => o.value === form.state) || null}
              onChange={(o) => setForm({ ...form, state: o?.value || "" })}
              placeholder="Select state"
            />
          </div>
        </div>

        {/* GST / TAX numbers */}
        <div className="grid gap-4 mt-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 text-sm">GST Number</label>
            <input
              name="gstNumber"
              value={form.gstNumber}
              onChange={change}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Tax Number</label>
            <input
              name="taxNumber"
              value={form.taxNumber}
              onChange={change}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>

        {/* money fields */}
        <div className="grid gap-4 mt-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 text-sm">Opening Balance</label>
            <input
              type="number"
              min="0"
              name="openingBalance"
              value={form.openingBalance}
              onChange={change}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Previous Balance</label>
            <input
              type="number"
              min="0"
              name="previousBalance"
              value={form.previousBalance}
              onChange={change}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>

        <div className="grid gap-4 mt-4 md:grid-cols-2">
          <div>
            <label className="block mb-1 text-sm">Purchase Due</label>
            <input
              type="number"
              min="0"
              name="purchaseDue"
              value={form.purchaseDue}
              onChange={change}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm">Purchase Return Due</label>
            <input
              type="number"
              min="0"
              name="purchaseReturnDue"
              value={form.purchaseReturnDue}
              onChange={change}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>

        {/* status */}
        <div className="mt-4">
          <label className="block mb-1 text-sm">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={change}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* error msg */}
        {errorMsg && (
          <p className="px-3 py-2 mt-4 text-sm text-red-700 bg-red-100 border border-red-300 rounded">
            {errorMsg}
          </p>
        )}

        {/* buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            className="px-6 py-2 text-white rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

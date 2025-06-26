import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import LoadingScreen from "../../Loading";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";

/* Change this if your base URL differs */
const API = "";

function AddStockTransfer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id"); // editing?

  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  // Collapse sidebar on small screens
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  const [warehouses, setWarehouses] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [filteredItemsByWarehouse, setFilteredItemsByWarehouse] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState([]);

  const [formData, setFormData] = useState({
    transferDate: new Date().toLocaleDateString("en-CA"), // YYYY-MM-DD for IST
    fromWarehouse: "", // ⬅️ will default to restricted if not editing
    toWarehouse: "",
    details: "",
    note: "",
  });

  // ─── FETCH WAREHOUSES ───────────────────────────────────────────────────
  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`http://localhost:5000/api/warehouses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const list = data.data || [];

      setWarehouses(list);

      // ⬅️ If we are NOT editing (id is falsey) and there are warehouses,
      // pick the restricted warehouse as default fromWarehouse:
      if (!id && list.length > 0) {
        const restricted = list.find((w) => w.isRestricted && w.status === "Active");
        const defaultFrom = restricted
          ? restricted._id
          : list.find((w) => w.status === "Active")?._id || "";
        setFormData((prev) => ({ ...prev, fromWarehouse: defaultFrom }));
      }
    } catch (err) {
      console.error("warehouses:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── FETCH ITEMS WHEN fromWarehouse CHANGES ─────────────────────────────
  const fetchItems = async (warehouseId = formData.fromWarehouse) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = warehouseId ? { warehouse: warehouseId } : {};
      const { data } = await axios.get(`http://localhost:5000/api/items`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      const items = data.data || [];
      const flattenedItems = items
        .map((item) => {
          const isVariant = Boolean(item.parentItemId);
          return {
            ...item,
            parentId: isVariant ? item.parentItemId : item._id,
            variantId: isVariant ? item._id : null,
            displayName: isVariant
              ? `${item.itemName} / ${item.variantName || "Variant"}`
              : item.itemName,
            itemCode: item.itemCode || "",
            barcode: item.barcodes?.[0] || "",
            barcodes: item.barcodes || [],
            isVariant,
            currentStock: item.currentStock || 0,
            warehouse: item.warehouse, // keep warehouse reference
          };
        })
        .filter((item) => item.currentStock > 0); // Only include items that have stock > 0

      setAllItems(flattenedItems);
      setFilteredItemsByWarehouse(flattenedItems);
    } catch (err) {
      console.error("items:", err.message);
      setAllItems([]);
      setFilteredItemsByWarehouse([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── LOAD EXISTING TRANSFER FOR EDIT ─────────────────────────────────────
  const loadStockTransfer = async (transferId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`http://localhost:5000/api/stock-transfers/${transferId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const tr = data.data;
      setFormData({
        transferDate: tr.transferDate?.split("T")[0] || "",
        fromWarehouse: tr.fromWarehouse?._id || "",
        toWarehouse: tr.toWarehouse?._id || "",
        details: tr.details || "",
        note: tr.note || "",
      });

      // Once we've set fromWarehouse from the fetched data, re-fetch items:
      if (tr.fromWarehouse?._id) {
        await fetchItems(tr.fromWarehouse._id);
      }

      // Map the existing items in this transfer into selectedItems
      const mapped = (tr.items || []).map((it) => {
        const itemDoc = allItems.find(
          (i) => i._id === (it.item?._id || it.item)
        ) || {};
        return {
          itemId: it.item?._id || it.item,
          itemName: itemDoc.displayName || it.item?.itemName || "Unknown Item",
          quantity: it.quantity || 1,
          isVariant: itemDoc.isVariant || false,
          variantName: itemDoc.variantName || "",
        };
      });
      setSelectedItems(mapped);
    } catch (err) {
      console.error("load transfer:", err.message);
      alert("Error loading stock transfer");
    } finally {
      setLoading(false);
    }
  };

  // ─── EFFECT: When fromWarehouse changes, re-fetch items ───────────────
  useEffect(() => {
    fetchWarehouses();
  }, []); // only once on mount

  useEffect(() => {
    // If fromWarehouse is set (either via default or by user action), fetch items
    if (formData.fromWarehouse) {
      fetchItems(formData.fromWarehouse);
    } else {
      setAllItems([]);
      setFilteredItemsByWarehouse([]);
    }
  }, [formData.fromWarehouse]);

  // ─── EFFECT: If we are editing, load the existing transfer ──────────────
  useEffect(() => {
    if (id) {
      loadStockTransfer(id);
    }
  }, [id, allItems]);

  // ─── FILTER allItems TO filteredItemsByWarehouse ───────────────────────
  useEffect(() => {
    if (formData.fromWarehouse) {
      const filtered = allItems.filter(
        (item) => item.warehouse?._id === formData.fromWarehouse
      );
      setFilteredItemsByWarehouse(filtered);

      // Only clear selectedItems if we are NOT editing:
      if (!id) {
        setSelectedItems([]);
      }
    } else {
      setFilteredItemsByWarehouse([]);
      if (!id) {
        setSelectedItems([]);
      }
    }
  }, [formData.fromWarehouse, allItems, id]);

  // ─── SEARCH LOGIC FOR AUTOCOMPLETE DROPDOWN ────────────────────────────
  const filteredItems = searchQuery
    ? filteredItemsByWarehouse.filter((it) => {
        const q = searchQuery.toLowerCase();
        return (
          it.displayName?.toLowerCase().includes(q) ||
          it.itemCode?.toLowerCase().includes(q) ||
          (it.barcode && it.barcode.toLowerCase().includes(q))
        );
      })
    : [];

  // ─── ADD ITEM TO SELECTED LIST ────────────────────────────────────────
  const handleAddItem = (targetItem) => {
    if (!targetItem) return;
    if (selectedItems.some((it) => it.itemId === targetItem._id)) {
      alert("This item is already added.");
      setSearchQuery("");
      return;
    }
    setSelectedItems([
      ...selectedItems,
      {
        itemId: targetItem._id,
        itemName: targetItem.displayName,
        quantity: 1,
        isVariant: targetItem.isVariant,
        variantName: targetItem.variantName,
      },
    ]);
    setSearchQuery("");
  };

  // ─── REMOVE ITEM FROM SELECTED ────────────────────────────────────────
  const handleRemoveItem = (id) => {
    setSelectedItems(selectedItems.filter((it) => it.itemId !== id));
  };

  // ─── UPDATE QUANTITY IN SELECTED ──────────────────────────────────────
  const handleItemChange = (id, val) => {
    setSelectedItems(
      selectedItems.map((it) =>
        it.itemId === id ? { ...it, quantity: parseInt(val, 10) || 1 } : it
      )
    );
  };

  // ─── SUBMIT TRANSFER ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.transferDate ||
      !formData.fromWarehouse ||
      !formData.toWarehouse
    ) {
      return alert("Fill date, From & To warehouse.");
    }
    if (formData.fromWarehouse === formData.toWarehouse) {
      return alert("Cannot transfer to the same warehouse.");
    }
    if (selectedItems.length === 0) {
      return alert("Add at least one item.");
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        items: selectedItems.map((it) => ({
          item: it.itemId,
          quantity: parseInt(it.quantity, 10) || 1,
        })),
      };
      const token = localStorage.getItem("token");
      if (id) {
        await axios.put(
          `http://localhost:5000/api/stock-transfers/${id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Stock transfer updated!");
      } else {
        await axios.post(
          `http://localhost:5000/api/stock-transfers`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Stock transfer created!");
      }
      navigate("/transfer-list");
    } catch (err) {
      console.error("submit:", err);
      alert(err.response?.data?.message || "Submit failed.");
    } finally {
      setLoading(false);
    }
  };

  // ─── RENDER ────────────────────────────────────────────────────────────
  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />

        <div className="flex-grow p-4">
          {/* Header */}
          <header className="flex flex-col items-center justify-between p-4 mb-2 bg-white rounded shadow md:flex-row">
            <div className="flex items-baseline gap-2">
              <h1 className="text-xl font-semibold">
                {id ? "Edit Stock Transfer" : "Add Stock Transfer"}
              </h1>
              <span className="text-sm text-gray-600">
                {id ? "Update existing transfer" : "Create new transfer"}
              </span>
            </div>
            <nav className="flex items-center text-sm text-gray-500">
              <a href="/dashboard" className="flex items-center hover:text-cyan-600">
                <FaTachometerAlt className="mr-2" /> Home
              </a>
              <BiChevronRight className="mx-2" />
              <a href="/transfer-list" className="hover:text-cyan-600">
                Stock Transfer List
              </a>
            </nav>
          </header>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="p-4 bg-white border-t-4 rounded shadow border-cyan-500"
          >
            {/* ─── Row 1: Date / From / To ───────────────────────────────── */}
            <div className="grid gap-4 mb-4 md:grid-cols-3">
              <div>
                <label className="block mb-1 font-semibold">Transfer Date</label>
                <input
                  type="date"
                  value={formData.transferDate}
                  onChange={(e) =>
                    setFormData({ ...formData, transferDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold">From Warehouse</label>
                <select
                  value={formData.fromWarehouse}
                  onChange={(e) =>
                    setFormData({ ...formData, fromWarehouse: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                  required
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.warehouseName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold">To Warehouse</label>
                <select
                  value={formData.toWarehouse}
                  onChange={(e) =>
                    setFormData({ ...formData, toWarehouse: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                  required
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.warehouseName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ─── Row 2: Details / Note ─────────────────────────────────────── */}
            <div className="grid gap-4 mb-4 md:grid-cols-2">
              <div>
                <label className="block mb-1 font-semibold">Details</label>
                <input
                  type="text"
                  value={formData.details}
                  onChange={(e) =>
                    setFormData({ ...formData, details: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold">Note</label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>

            {/* ─── SEARCH BOX WITH AUTOCOMPLETE & AUTO‐ADD ───────────────────── */}
            <div className="relative mb-4">
              <label className="block mb-1 font-semibold">Search Item</label>
              <input
                type="text"
                placeholder="Name / Code / Barcode"
                value={searchQuery}
                onChange={(e) => {
                  const val = e.target.value.trim();
                  setSearchQuery(val);

                  // ⬅️ If the user typed an exact barcode or itemCode, auto‐add:
                  const hit = allItems.find(
                    (i) =>
                      i.barcodes?.includes(val) ||
                      i.itemCode === val
                  );
                  if (hit) {
                    handleAddItem(hit);
                    setSearchQuery("");
                  }
                }}
                className="w-full px-4 py-2 border rounded"
                disabled={!formData.fromWarehouse} // only allow search once a warehouse is chosen
              />
              {searchQuery && filteredItems.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 overflow-y-auto bg-white border rounded shadow max-h-60">
                  {filteredItems.map((it) => (
                    <li
                      key={it._id}
                      className="p-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleAddItem(it)}
                    >
                      <strong>{it.itemCode}</strong> – {it.displayName}{" "}
                      {it.isVariant ? `(${it.variantName})` : ""}
                      {it.barcode && (
                        <span className="text-gray-500"> – {it.barcode}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ─── SELECTED ITEMS LIST ───────────────────────────────────────── */}
            <div className="p-4 mb-4 overflow-x-auto bg-white rounded shadow">
              <div className="flex px-2 py-2 text-sm font-semibold text-white bg-cyan-600">
                <div className="w-2/3">Item Name</div>
                <div className="w-1/3 text-center">Qty</div>
                <div className="w-1/3 text-center">Action</div>
              </div>

              {selectedItems.length === 0 && (
                <div className="p-4 text-center text-gray-500">No items added.</div>
              )}

              {selectedItems.map((sel) => (
                <div
                  key={sel.itemId}
                  className="flex items-center px-2 py-2 border-t"
                >
                  <div className="w-2/3">{sel.itemName}</div>

                  <div className="w-1/3 text-center">
                    <input
                      type="number"
                      min="1"
                      value={sel.quantity}
                      onChange={(e) =>
                        handleItemChange(sel.itemId, e.target.value)
                      }
                      className="w-16 text-center border rounded"
                    />
                  </div>

                  <div className="w-1/3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(sel.itemId)}
                      className="px-2 py-1 text-white bg-red-500 rounded"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ─── BUTTONS ──────────────────────────────────────────────────── */}
            <div className="flex justify-end gap-2">
              <button
                type="submit"
                className="px-6 py-2 text-white rounded shadow bg-cyan-500 hover:bg-cyan-600"
              >
                {id ? "Update" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/transfer-list")}
                className="px-6 py-2 text-white bg-gray-400 rounded shadow hover:bg-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddStockTransfer;

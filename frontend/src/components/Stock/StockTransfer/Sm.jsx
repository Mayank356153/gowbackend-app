import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Navbar from "../../Navbar.jsx";
import Sidebar from "../../Sidebar.jsx";
import LoadingScreen from "../../../Loading";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";
import S1 from "./S1.jsx";
import S2 from "./S2.jsx";
import S3 from "./S3.jsx";
import { BrowserMultiFormatReader } from '@zxing/browser';
import { useRef } from "react";
import { Camera } from "@capacitor/camera";
/* Change this if your base URL differs */
const API = "";

function Sm() {
  const link="https://pos.inspiredgrow.in/vps"
   useEffect(() => {
    const request = async () => {
      await Camera.requestPermissions({
            permissions: ['camera', 'photos']
      }); // Ask Android to show prompt
    };
    request();
  }, []);
    
const codeReaderRef = useRef(null);
const videoRef = useRef(null);
const [scanning, setScanning] = useState(false);
const[matchedItems,setMatchedItems]=useState([])
    const [activeTab,setActiveTab]=useState("s1")
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
      const { data } = await axios.get(`${link}/api/warehouses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("da")
      console.log(data)
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
      const { data } = await axios.get(`${link}/api/items`, {
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
      const { data } = await axios.get(`${link}/api/stock-transfers/${transferId}`, {
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


  
const startScanner = async () => {
  console.log("Starting scanner");

  if (!formData.fromWarehouse) {
    alert("Please select a warehouse before scanning");
    return;
  }

  if (!videoRef.current) return;

  const codeReader = new BrowserMultiFormatReader();
  codeReaderRef.current = codeReader;

  // List available cameras
  const devices = await codeReader.listVideoInputDevices();
  const backCamera = devices.find((d) =>
    d.label.toLowerCase().includes("back")
  ) || devices[0]; // fallback to any camera

  if (!backCamera) {
    alert("No camera found.");
    return;
  }

  const scannedRecently = new Set(); // optional: avoid spam scanning

  codeReader.decodeFromVideoDevice(backCamera.deviceId, videoRef.current, (result, error) => {
    if (result) {
      const text = result.getText();
      console.log("Scanned barcode:", text);

      if (scannedRecently.has(text)) return; // prevent duplicate in short time
      scannedRecently.add(text);
      setTimeout(() => scannedRecently.delete(text), 3000); // reset after 3s

      const match = filteredItems.find(
        (i) =>
          i.itemCode === text ||
          i.barcodes?.includes(text) ||
          i.itemName.toLowerCase() === text.toLowerCase()
      );

      console.log("Matched item:", match);

      if (match) {
        setMatchedItems((prev) => {
          const existingIndex = prev.findIndex((item) => item._id === match._id);
          if (existingIndex !== -1) {
            const updated = [...prev];
            updated[existingIndex].quantity += 1;
            return updated;
          } else {
            return [...prev, { ...match, quantity: 1 }];
          }
        });
        setSearchQuery("");
        navigator.vibrate?.(100);
        try {
          new Audio("/beep.mp3").play();
        } catch {}
      } else {
        alert("No item found for scanned code: " + text);
      }
    }

    if (error && error.name !== "NotFoundException") {
      console.error("Scan error:", error);
    }
  });
};




 const stopScanner = () => {
  const reader = codeReaderRef.current;
  if (reader?.reset) reader.reset();

  if (videoRef.current?.srcObject) {
    videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    videoRef.current.srcObject = null;
  }

  setScanning(false);
  setMatchedItems([]);
};

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
          `${link}/api/stock-transfers/${id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Stock transfer updated!");
      } else {
        await axios.post(
          `${link}/api/stock-transfers`,
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
  

  return (
    <div className="flex flex-col h-screen ">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen} />

        <div className="w-full p-4 ">
          {/* Header */}
          

          {/* Form */}
          <form
            onSubmit={handleSubmit}
        
          >
            {/* ─── Row 1: Date / From / To ───────────────────────────────── */}
           {activeTab==="s1" && <S1 formData={formData} setActiveTab={setActiveTab} setFormData={setFormData} warehouses={warehouses}/>}
           {activeTab==="s2" && <S2  searchQuery={searchQuery}
  setSearchQuery={setSearchQuery}
  allItems={allItems} scanning={scanning} stopScanner={stopScanner} startScanner={startScanner}
  handleAddItem={handleAddItem}  matchedItems={matchedItems}
  formData={formData} videoRef={videoRef} codeReaderRef={codeReaderRef} setMatchedItems={setMatchedItems} setScanning={setScanning}
  filteredItems={filteredItems} setSelectedItems={setSelectedItems}
  selectedItems={selectedItems} setActiveTab={setActiveTab}
  handleItemChange={handleItemChange} addItem={handleAddItem}
  handleRemoveItem={handleRemoveItem}/>}

  {activeTab==="s3" && <S3  formData={formData}
  setActiveTab={setActiveTab}
  setFormData={setFormData}
  selectedItems={selectedItems}
  handleItemChange={handleItemChange}
  setSelectedItems={setSelectedItems}
  handleRemoveItem={handleRemoveItem}
  
  allItems={allItems}
  warehouses={warehouses}
  id={id}
  navigate={navigate}/>}

  
            
          </form>
        </div>
      </div>
    </div>
  );
}

export default Sm;

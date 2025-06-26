import React, { useEffect, useState, useRef } from "react";
import {
  FaHandPaper,
  FaLayerGroup,
  FaMoneyBill,
  FaCreditCard,
  FaBarcode,
  FaList,
  FaUsers,
  FaBox,
  FaFileInvoice,
  FaBars,
  FaWindowMaximize,
} from "react-icons/fa";
import { Capacitor } from "@capacitor/core";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { MdOutlineDashboard } from "react-icons/md";
import { CameraIcon } from "@heroicons/react/outline";
import axios, { all } from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import PaymentModal from "../PaymentModal";
import LoadingScreen from "../../../Loading";
import POS1 from "./POS1";
import POS2 from "./POS2";
import POS3 from "./POS3";
import { Camera } from "@capacitor/camera";
import Swal from 'sweetalert2';
import { CameraPreview, CameraPreviewOptions } from '@capacitor-community/camera-preview';
export default function POSM() {
   const canvasRef = useRef(null);
  const reader = useRef(new BrowserMultiFormatReader());
  const scan = useRef(true);
  const link="https://pos.inspiredgrow.in/vps"
   useEffect(() => {
      const request = async () => {
        await Camera.requestPermissions({
              permissions: ['camera', 'photos']

        }); // Ask Android to show prompt
      };
      request();
    }, []);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get("id");
 const[activeTab,setActiveTab]=useState("pos1")
 const [matchedItems, setMatchedItems] = React.useState([]);
  // ─── STATE ─────────────────────────────────────────────────────────
  const [user, setUser] = useState({ name: "Guest", role: "Guest" });
  const [loadingUser, setLoadingUser] = useState(false);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");

  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [terminals, setTerminals] = useState([]);

  const [paymentTypes, setPaymentTypes] = useState([]);

  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchItemCode, setSearchItemCode] = useState("");
  const [scanning, setScanning] = useState(false);

  const [items, setItems] = useState([]);

  const [quantity, setQuantity] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalDiscount, setTotalDiscount] = useState(0);

  const [invoiceCode, setInvoiceCode] = useState(
    `SL/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, "0")}/`
  );
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [previousBalance, setPreviousBalance] = useState(0);

  const [couponCode, setCouponCode] = useState("");
  const [adjustAdvancePayment, setAdjustAdvancePayment] = useState(false);
  const [advancePaymentAmount, setAdvancePaymentAmount] = useState(0);

  const [heldInvoices, setHeldInvoices] = useState([]);
  const [showHoldList, setShowHoldList] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState("");

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState(""); // "cash" | "bank" | "multiple" | "hold"
  const [orderPaymentMode, setOrderPaymentMode] = useState(""); // Tracks payment mode of loaded order

  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const [storeName, setStoreName] = useState("");
  const [orderToEdit, setOrderToEdit] = useState(null);
  const [defaultWarehouse, setDefaultWarehouse]   = useState("");
  const prevWarehouseRef = useRef();    
  const isScanning=useRef(true)
  // ─── HELPERS ────────────────────────────────────────────────────────
  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const getPaymentTypeId = (name) =>
    paymentTypes.find((pt) => pt.paymentTypeName?.toLowerCase() === name.toLowerCase())?._id;

  const esc = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

  useEffect(() => {
  // skip the very first render (prevWarehouseRef === undefined)
  if (
    prevWarehouseRef.current &&                     // we already had one before
    prevWarehouseRef.current !== selectedWarehouse  // AND it actually changed
  ) {
    if (items.length > 0) {
      // 👉 optional safety prompt; remove if you don’t want it
      const ok = window.confirm(
        "Changing the warehouse will clear the current cart. Continue?"
      );
      if (!ok) {
        // user aborted → roll back the <select>
        setSelectedWarehouse(prevWarehouseRef.current);
        return;
      }
    }

    // 🚿 flush everything that belongs to the old warehouse
    setItems([]);
    setSearchItemCode("");
  }

  // finally, remember this value for the next tick
  prevWarehouseRef.current = selectedWarehouse;
}, [selectedWarehouse, items.length]);

  // ─── FETCHERS ───────────────────────────────────────────────────────
  useEffect(() => {
    fetchProfile();
    fetchLookups();
    fetchHeld();
    if (editId) {
      setIsLoadingEdit(true);
      fetchPosById(editId)
  .then(async (inv) => {
    if (!inv) return;
    // 1️⃣ set the warehouse so that fetchItems kicks off for that warehouse
    setSelectedWarehouse(inv.warehouse._id);

    // 2️⃣ wait for the items to come back
    await fetchItems(inv.warehouse._id);

    // 3️⃣ only then remember the order to edit
    setOrderToEdit(inv);
  })

        .catch(console.error)
        .finally(() => setIsLoadingEdit(false));
    } else {
      loadNextInvoiceCode();
    }
  }, [editId]);
  useEffect(() => {
  fetchItems();
}, [selectedWarehouse])

  async function fetchProfile() {
    setLoadingUser(true);
    try {
      const role = localStorage.getItem("role");
      const url =
        role === "admin"
          ? `${link}/auth/profile`
          : `${link}/admiaddinguser/profile`;
      const { data } = await axios.get(url, authHeaders());
      setUser(data);
      setStoreName(data.storeName || "Grocery on Wheels");
      setDefaultWarehouse(data.defaultWarehouse || "");
    } catch {
      setUser({ name: "Guest", role: "Guest" });
    } finally {
      setLoadingUser(false);
    }
  }
async function fetchLookups() {
    // ── 1) Warehouses ─────────────────────────────────────
    try {
      const { data } = await axios.get(
        `${link}/api/warehouses`,
        authHeaders()
      );
      const list = data.data || data.warehouses || [];
      if (Array.isArray(list)) {
  setWarehouses(list);
} else {
  setWarehouses([]);
}

    } catch (err) {
      console.error("❌ failed to load warehouses", err);
      setWarehouses([]);
    }

  // ── 2) Customers ──────────────────────────────────────
  try {
    const { data } = await axios.get(
      `${link}/api/customer-data/all`,
      authHeaders()
    );
    const cust = data.data || data || [];
    if (Array.isArray(cust)) {
      setCustomers(cust);
      if (!editId && cust.length) {
        // find or default to the first customer
        const walkIn = cust.find(c => c.customerName.toLowerCase() === "walk-in customer");
        setSelectedCustomer((walkIn?._id) || cust[0]._id);
      }
    } else {
      setCustomers([]);
    }
  } catch (err) {
    console.error("❌ failed to load customers", err);
    setCustomers([]);
  }

  // ── 3) Accounts ───────────────────────────────────────
  try {
    const { data } = await axios.get(
      `${link}/api/accounts`,
      authHeaders()
    );
    const accts = data.data || data || [];
    if (Array.isArray(accts)) {
      setAccounts(accts);
      if (!editId && accts.length) {
        setSelectedAccount(accts[0]._id);
      }
    } else {
      setAccounts([]);
    }
  } catch (err) {
    console.error("❌ failed to load accounts", err);
    setAccounts([]);
  }

  // ── 4) Payment Types ───────────────────────────────────
  try {
    const { data } = await axios.get(
      `${link}/api/payment-types`,
      authHeaders()
    );
    setPaymentTypes(data.data || data || []);
  } catch (err) {
    console.error("❌ failed to load payment types", err);
    setPaymentTypes([]);
  }

  // ── 5) Terminals ──────────────────────────────────────
  try {
    const { data } = await axios.get(
      `${link}/api/terminals`,
      authHeaders()
    );
    setTerminals(data.data || data || []);
  } catch (err) {
    console.error("❌ failed to load terminals", err);
    setTerminals([]);
  }
}


  async function loadNextInvoiceCode() {
    try {
      const year = new Date().getFullYear();
      const [saleRes, posRes] = await Promise.all([
        axios.get(`${link}/api/sales`, authHeaders()),
        axios.get(`${link}/api/pos`, authHeaders()),
      ]);
      const sales = saleRes.data.sales || saleRes.data;
      const poses = posRes.data.data || posRes.data;

      const allCodes = [
        ...sales.map((s) => s.saleCode),
        ...poses.map((p) => p.saleCode),
      ].filter(Boolean);

      let maxSeq = 0;
      allCodes.forEach((code) => {
        const parts = code.split("/");
        if (parts[1] == year) {
          const seq = parseInt(parts[2], 10);
          if (seq > maxSeq) maxSeq = seq;
        }
      });

      const next = maxSeq + 1;
      const padded = String(next).padStart(7, "0");
      const nextCode = `SL/${year}/${padded}`;

      setInvoiceCode(nextCode);
    } catch (err) {
      console.error("Could not compute next code:", err);
      const year = new Date().getFullYear();
      setInvoiceCode(`SL/${year}/${String(new Date().getMonth() + 1).padStart(2, "0")}/`);
    }
  }

  async function fetchHeld() {
    try {
      const { data } = await axios.get(`${link}/api/pos`, authHeaders());
      setHeldInvoices((data.data || data).filter((o) => o.status === "OnHold"));
    } catch (err) {
      console.error("Fetch held invoices error:", err.message);
    }
  }

  async function fetchPosById(id) {
    try {
      const { data } = await axios.get(`${link}/api/pos/${id}`, authHeaders());
      console.log("Fetched POS order:", data);
      return data.order || data;
    } catch (err) {
      console.error("Fetch POS by ID error:", err.message);
      alert(`Failed to load POS order: ${err.message}`);
      return null;
    }
  }

  async function deletePosTransaction(id) {
    try {
      await axios.delete(`${link}/api/pos/${id}`, authHeaders());
      setHeldInvoices((prev) => prev.filter((inv) => inv._id !== id));
      navigate("/sale-list");
    } catch (err) {
      console.error("Delete POS transaction error:", err.message);
      alert(`Failed to delete POS order: ${err.message}`);
    }
  }

  async function fetchItems() {
  if (!selectedWarehouse) {
    setAllItems([]);
    return;
  }

  try {
    const { data } = await axios.get(
      `${link}/api/items`,
      {
        headers: authHeaders().headers,
        params:  { warehouse: selectedWarehouse }
      }
    );
    console.log("item")
    console.log(data)
    const rawItems = data.data || [];

      const flatItems = rawItems
        .filter((it) => it._id && it.warehouse?._id)
        .map((it) => {
          const isVariant = Boolean(it.parentItemId);
          return {
            ...it,
            parentId: isVariant ? it.parentItemId : it._id,
            variantId: isVariant ? it._id : null,
            itemName: isVariant ? `${it.itemName} / ${it.variantName || "Variant"}` : it.itemName,
            barcode: it.barcode || "",
            barcodes: it.barcodes || [],
            itemCode: it.itemCode || "",
          };
        });

      console.log(
        "Flattened items:",
        flatItems.map((i) => ({
          _id: i._id,
          parentId: i.parentId,
          variantId: i.variantId,
          itemName: i.itemName,
          itemCode: i.itemCode,
          barcode: i.barcode,
          barcodes: i.barcodes,
          isVariant: !!i.variantId,
          warehouseId: i.warehouse?._id,
        }))
      );
      setAllItems(flatItems);
    } catch (err) {
      console.error("Fetch items error:", err.message);
    }
  }

  

  // ─── EDIT HYDRATION ─────────────────────────────────────────────────
  function hydrateForEdit(inv) {
    console.log("Hydrating POS order:", inv);

    let detectedPaymentMode = inv.paymentMode || "";
    if (!detectedPaymentMode) {
      if (inv.status === "OnHold") {
        detectedPaymentMode = "hold";
      } else if (inv.status === "Completed") {
        if (inv.payments?.length > 1) {
          detectedPaymentMode = "multiple";
        } else if (inv.payments?.length === 1) {
          const payment = inv.payments[0];
          const paymentType = paymentTypes.find((pt) => pt._id === payment.paymentType);
          if (paymentType?.paymentTypeName?.toLowerCase() === "cash") {
            detectedPaymentMode = "cash";
          } else if (paymentType?.paymentTypeName?.toLowerCase() === "bank" || payment.terminal) {
            detectedPaymentMode = "bank";
          } else {
            detectedPaymentMode = "multiple";
          }
        }
      }
    }

    const items = inv.items
      .map((i) => {
        const itemDoc = allItems.find(
          (ai) =>
            ai.parentId === i.item._id &&
            (!i.variant || ai._id === i.variant || ai.variantId === i.variant) &&
            ai.warehouse?._id === inv.warehouse?._id
        );
        if (!itemDoc) {
          console.warn("Invalid item in POS order:", {
            itemId: i.item._id,
            variantId: i.variant,
            itemName: i.item.itemName,
            warehouseId: inv.warehouse?._id,
          });
          return null;
        }
        return {
          item: i.item._id,
          variant: i.variant || null,
          itemName: itemDoc.itemName,
          itemCode: itemDoc.itemCode || "",
          openingStock: itemDoc.openingStock || 0,
          salesPrice: i.price || itemDoc.salesPrice || 0,
          quantity: i.quantity || 1,
          discount: i.discount || 0,
          tax: i.tax?._id || itemDoc.tax?._id || null,
          taxRate: i.tax?.taxPercentage || itemDoc.tax?.taxPercentage || 0,
          unit: i.unit || itemDoc.unit || null,
          mrp: itemDoc.mrp || 0,
          expiryDate: itemDoc.expiryDate || null,
          subtotal:
            i.subtotal || (i.price || itemDoc.salesPrice || 0) * (i.quantity || 1) - (i.discount || 0),
        };
      })
      .filter((i) => i !== null);

    setItems(items);
    setInvoiceCode(inv.saleCode || "");
    setInvoiceCount(inv.invoiceCount || 0);
    setPreviousBalance(inv.previousBalance || 0);
    setCouponCode(inv.couponCode || "");
    setAdjustAdvancePayment(inv.advanceUsed > 0);
    setAdvancePaymentAmount(inv.advanceUsed || 0);

    // Validate and set customer
    const customerId = inv.customer?._id;
    if (!customerId || !customers.find((c) => c._id === customerId)) {
      console.warn("Invalid or missing customer ID:", customerId);
      const walkIn = customers.find((c) => c.customerName.toLowerCase() === "walk-in customer");
      setSelectedCustomer(walkIn?._id || "");
    } else {
      setSelectedCustomer(customerId);
    }

    // Validate and set warehouse
    const warehouseId = inv.warehouse?._id;
    if (!warehouseId || !warehouses.find((w) => w._id === warehouseId)) {
      console.warn("Invalid or missing warehouse ID:", warehouseId);
      setSelectedWarehouse(warehouses[0]?._id || "");
    } else {
      setSelectedWarehouse(warehouseId);
    }

    // Validate and set account
    const accountId = inv.account?._id;
    if (!accountId || !accounts.find((a) => a._id === accountId)) {
      console.warn("Invalid or missing account ID:", accountId);
      const warehouse = warehouses.find((w) => w._id === warehouseId);
      setSelectedAccount(warehouse?.cashAccount?._id || accounts[0]?._id || "");
    } else {
      setSelectedAccount(accountId);
    }

    setCurrentOrderId(inv._id);
    setOrderPaymentMode(detectedPaymentMode);
  }

  // ─── EFFECTS ────────────────────────────────────────────────────────
  useEffect(() => {
    let qty = 0,
      amt = 0,
      disc = 0;
    items.forEach((i) => {
      qty += i.quantity;
      amt += i.quantity * i.salesPrice;
      disc += i.discount || 0;
    });
    setQuantity(qty);
    setTotalAmount(amt);
    setTotalDiscount(disc);
  }, [items]);

  useEffect(() => {
    const q = searchItemCode.trim();
    if (!q || !selectedWarehouse) return setFilteredItems([]);
    const rx = new RegExp(esc(q), "i");
    const filtered = allItems
      .filter(
        (it) =>
          it.warehouse?._id === selectedWarehouse &&
          (rx.test(it.itemName) || rx.test(it.itemCode) || rx.test(it.barcodes?.join(" ") || ""))
      )
      .slice(0, 15);
    setFilteredItems(filtered);
    console.log("Filtered items:", filtered);
  }, [searchItemCode, selectedWarehouse, allItems]);

  useEffect(() => {
    return () => {
      const reader = codeReaderRef.current;
      if (reader) {
        try {
          if (typeof reader.reset === "function") {
            reader.reset();
          } else if (typeof reader.stopStreams === "function") {
            reader.stopStreams();
          }
        } catch (e) {
          console.error("Error during scanner cleanup:", e);
        }
      }
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    const c = customers.find((c) => c._id === selectedCustomer);
    setPreviousBalance(c?.previousDue || 0);
  }, [selectedCustomer, customers]);

  useEffect(() => {
    const w = warehouses.find((w) => w._id === selectedWarehouse);
    if (w?.cashAccount?._id) setSelectedAccount(w.cashAccount._id);
    else if (accounts.length) setSelectedAccount(accounts[0]?._id);
  }, [selectedWarehouse, warehouses, accounts]);

 useEffect(() => {
  const ready = 
    orderToEdit &&
    customers.length > 0 &&
    warehouses.length > 0 &&
    accounts.length > 0 &&
    paymentTypes.length > 0 &&
    allItems.length > 0;

  console.log("🔍 hydrate ready?", {
    order: !!orderToEdit,
    cust: customers.length,
    wh: warehouses.length,
    accts: accounts.length,
    ptypes: paymentTypes.length,
    items: allItems.length
  });

  if (!ready) return;

  hydrateForEdit(orderToEdit);
  setOrderToEdit(null);
}, [orderToEdit, customers, warehouses, accounts, paymentTypes, allItems]);

useEffect(() => {
  if (editId) return;                  // skip if we’re editing an existing order
  if (!warehouses.length) return;      // need the list loaded
  if (defaultWarehouse) {
    // user has a default → honor it
    setSelectedWarehouse(defaultWarehouse);
  } else {
    // fallback to restricted / first active
    const restricted = warehouses.find(
      (w) => w.isRestricted && w.status === "Active"
    );
    setSelectedWarehouse(
      restricted?._id ||
        warehouses.find((w) => w.status === "Active")?._id ||
        ""
    );
  }
}, [warehouses, defaultWarehouse, editId]);


  // ─── SCANNER LOGIC ─────────────────────────────────────────────────
//   const startScanner = () => {
//     console.log("Starting scanner...");
//     if (!selectedWarehouse) {
//       alert("Please select a warehouse before scanning.");
//       return;
//     }
//     setScanning(true);
//     const codeReader = new BrowserMultiFormatReader();


//     try {
//       codeReader.decodeFromConstraints(
//         { video: { facingMode: "environment"  } },
//         videoRef.current,
//         (result, err) => {
//           if (result) {
//             const text = result.getText();
//             console.log("Scanned barcode:", text);
//             const hit = filteredItems.find(
//               (i) =>
//                 i.itemCode === text ||
//                 i.barcodes?.includes(text) ||
//                 i.itemName.toLowerCase() === text.toLowerCase()
//             );
//             console.log("Matched item:", hit);
//             if (hit) {
//               addItem(hit);
//               setSearchItemCode("");
//             } else {
//               alert("No item found for scanned code: " + text);
//             }
//             codeReader.reset();
//             setScanning(false);
//           }
//           if (err && err.name !== "NotFoundException") {
//             console.error("Scanner error:", err);
//             alert("Scanning failed: " + err.message);
//             codeReader.reset();
//             setScanning(false);
//           }
//         }
//       );
//     } catch (e) {
//       console.error("Scanner initialization failed:", e);
//       alert("Failed to start scanner: " + (e.message || "Unknown error"));
//       codeReader.reset();
//       setScanning(false);
//     }
//   };

// const startScanner = async () => {
//   console.log("Starting scanner");

//   if (!selectedWarehouse) {
//     alert("Please select a warehouse before scanning");
//     return;
//   }

//   try {
//     const codeReader = new BrowserMultiFormatReader();
//     codeReaderRef.current = codeReader;

//     // Request camera permission explicitly (important on mobile)
//     const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//     stream.getTracks().forEach(track => track.stop()); // release it early

//     // Get camera devices
//     const videoInputDevices = await codeReader.listVideoInputDevices();
//     const backCam = videoInputDevices.find((device) =>
//       device.label.toLowerCase().includes("back")
//     ) || videoInputDevices[0]; // fallback if no label

//     if (!backCam) {
//       alert("No camera found");
//       return;
//     }

//     // Continuous decoding from back camera
//     codeReader.decodeFromVideoDevice(backCam.deviceId, videoRef.current, (result, err) => {
//       if (result) {
//         const text = result.getText();
//         console.log("Scanned barcode:", text);

//         const match = filteredItems.find(
//           (i) =>
//             i.itemCode === text ||
//             i.barcodes?.includes(text) ||
//             i.itemName.toLowerCase() === text.toLowerCase()
//         );

//         if (match) {
//           setMatchedItems((prev) => {
//             const existingIndex = prev.findIndex((item) => item.item === match._id);
//             if (existingIndex !== -1) {
//               const updated = [...prev];
//               updated[existingIndex].quantity += 1;
//               return updated;
//             } else {
//               return [...prev, { item: match._id, quantity: 1 }];
//             }
//           });

//           setSearchItemCode("");
//           navigator.vibrate?.(100);
//           try {
//             new Audio("/beep.mp3").play();
//           } catch (e) {
//             console.warn("Beep failed", e);
//           }
//         } else {
//           console.warn("No match found for:", text);
//         }
//       }

//       if (err && err.name !== "NotFoundException") {
//         console.error("Scan error:", err);
//       }
//     });

//   } catch (error) {
//     console.error("Camera start error:", error);
//     alert("Camera access failed. Please check permission.");
//     alert(error)
//   }
// };
const startScanner = async () => {
  try {
      const { BarcodeScanner } = Capacitor.Plugins ;
    const result = await BarcodeScanner.scanBarcode();
    if (result.hasContent) {
      console.log('Barcode content:', result.content);
      alert(`Scanned: ${result.content}`);
    } else {
      alert("No barcode detected.");
    }
  } catch (error) {
    console.error('Scan error:', error);
    alert('Scan failed.');
    alert(error)
  }
};
   
const stopScanner = () => {
  const reader = codeReaderRef.current;
  if (reader?.reset) reader.reset();

  if (videoRef.current?.srcObject) {
    videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    videoRef.current.srcObject = null;
  }

  setScanning(false);
};


  // ─── ITEM HANDLERS ─────────────────────────────────────────────────
function addItem(it) {
  if (!it || !it.parentId) {
    console.error("Invalid item, missing parentId:", it);
    return;
  }

  const parentExists = allItems.some((ai) => ai._id === it.parentId && !ai.variantId);
  if (!parentExists && !it.variantId) {
    console.error(`Parent item not found for parentId: ${it.parentId}`, it);
    return;
  }

  if (it.variantId) {
    const variantValid = allItems.some((ai) => ai._id === it.variantId && ai.parentId === it.parentId);
    if (!variantValid) {
      console.error(`Invalid variantId: ${it.variantId} for parentId: ${it.parentId}`, it);
      return;
    }
  }

  const quantityToAdd = it.quantity || 1;

  const existingIdx = items.findIndex(
    (r) => r.item === it.parentId && r.variant === (it.variantId || null)
  );

  if (existingIdx !== -1) {
    // Item already exists → update quantity by quantityToAdd
    const updated = [...items];
    const existing = updated[existingIdx];
    const newQty = existing.quantity + quantityToAdd;

    updated[existingIdx] = {
      ...existing,
      quantity: newQty,
      subtotal: newQty * existing.salesPrice - (existing.discount || 0),
    };

    setItems(updated);
  } else {
    // New item → add it to the list
    const newItem = {
      item: it.parentId,
      variant: it.variantId || null,
      itemName: it.itemName,
      itemCode: it.itemCode || "",
      openingStock: it.openingStock || 0,
      currentStock: it.currentStock != null ? it.currentStock : (it.openingStock || 0),
      salesPrice: it.salesPrice || 0,
      quantity: quantityToAdd,
      discount: it.discount || 0,
      tax: it.tax?._id || null,
      taxRate: it.tax?.taxPercentage || 0,
      unit: it.unit || null,
      mrp: it.mrp || 0,
      expiryDate: it.expiryDate || null,
      subtotal: quantityToAdd * (it.salesPrice || 0) - (it.discount || 0),
    };

    if (newItem.salesPrice <= 0) {
      alert("Item sales price must be greater than zero.");
      return;
    }

    setItems((prev) => [...prev, newItem]);
  }

  setSearchItemCode("");
}



  function updateItem(idx, field, val) {
  const numericVal = Number(val);
  const row = items[idx];

  // ❗ Block salesPrice from ever exceeding MRP
  if (field === "salesPrice" && numericVal > row.mrp) {
    alert(`❗ Sales Price (${numericVal}) cannot exceed the MRP (${row.mrp})`);
    return;
  }

  // your existing non-zero check
  if ((field === "quantity" || field === "salesPrice") && numericVal <= 0) {
    alert(`${field.charAt(0).toUpperCase() + field.slice(1)} must be greater than zero.`);
    return;
  }

  setItems((prev) =>
    prev.map((r, i) =>
      i === idx
        ? {
            ...r,
            [field]: numericVal || 0,
            subtotal:
              (field === "salesPrice" ? numericVal : r.salesPrice) *
                (field === "quantity" ? numericVal : r.quantity) -
              (field === "discount" ? numericVal : r.discount || 0),
          }
        : r
    )
  );
}


  function removeItem(idx) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  // ─── PDF GENERATION ────────────────────────────────────────────────
  const generateInvoicePDF = (order, payments) => {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text("Invoice", 14, 20);
    doc.setFontSize(12);
    doc.text(`Invoice #: ${order.saleCode || "N/A"}`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 38);
    doc.text(`Source: POS`, 14, 46);

    // Customer Information
    const customer = customers.find((c) => c._id === selectedCustomer);
    doc.setFontSize(14);
    doc.text("Customer Information", 14, 60);
    doc.setFontSize(12);
    doc.text(`Name: ${customer?.customerName || "N/A"}`, 14, 70);
    doc.text(`Mobile: ${customer?.mobile || "N/A"}`, 14, 78);
    const addrObj = customer?.address || {};
    const addrStr = [
      addrObj.street,
      addrObj.city,
      addrObj.state,
      addrObj.zip,
      addrObj.country,
    ]
      .filter((part) => typeof part === "string" && part.trim() !== "")
      .join(", ");
    doc.text(`Address: ${addrStr || "N/A"}`, 14, 86);

    // Items Table
    doc.setFontSize(14);
    doc.text("Items", 14, 100);
    const itemRows = items.map((item) => [
      item.itemName || "N/A",
      item.quantity || 0,
      `Rs. ${(item.salesPrice || 0).toFixed(2)}`,
      `Rs. ${(item.discount || 0).toFixed(2)}`,
      `Rs. ${(item.subtotal || 0).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 106,
      head: [["Item Name", "Quantity", "Unit Price", "Discount", "Subtotal"]],
      body: itemRows,
      theme: "striped",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [0, 123, 255] },
    });

    // Totals
    let finalY = doc.lastAutoTable.finalY || 106;
    doc.setFontSize(12);
    doc.text(`Subtotal: Rs. ${(totalAmount || 0).toFixed(2)}`, 14, finalY + 10);
    doc.text(`Discount: Rs. ${(totalDiscount || 0).toFixed(2)}`, 14, finalY + 18);
    doc.text(`Grand Total: Rs. ${(totalAmount - totalDiscount).toFixed(2)}`, 14, finalY + 26);

    // Payments (if any)
    if (payments && payments.length > 0) {
      finalY = finalY + 34;
      doc.setFontSize(14);
      doc.text("Payments", 14, finalY);
      const paymentRows = payments.map((payment) => {
        const paymentType = paymentTypes.find((pt) => pt._id === payment.paymentType);
        return [
          new Date().toLocaleDateString(),
          paymentType?.paymentTypeName || "N/A",
          `Rs. ${(payment.amount || 0).toFixed(2)}`,
          payment.paymentNote || "-",
        ];
      });

      autoTable(doc, {
        startY: finalY + 6,
        head: [["Date", "Payment Type", "Amount", "Note"]],
        body: paymentRows,
        theme: "striped",
        styles: { fontSize: 10 },
        headStyles: { fillColor: [0, 123, 255] },
      });

      finalY = doc.lastAutoTable.finalY;
      const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      doc.setFontSize(12);
      doc.text(`Total Paid: Rs. ${totalPaid.toFixed(2)}`, 14, finalY + 10);
      const dueAmount = totalAmount - totalDiscount - totalPaid;
      doc.text(`Due Amount: Rs. ${dueAmount.toFixed(2)}`, 14, finalY + 18);
    }

    // Footer
    finalY = payments && payments.length > 0 ? finalY + 26 : finalY + 34;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text("Thank you for your business!", 14, finalY + 10);
    doc.text(`Generated by ${storeName || "Grocery on Wheels"}`, 14, finalY + 16);

    // Open PDF in a new tab
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");
  };

  // ─── PAYMENT / ORDER LOGIC ──────────────────────────────────────────
  function buildPayload({ status, payments, paymentMode }) {
    console.log("Building payload with:", {
      selectedWarehouse,
      selectedCustomer,
      selectedAccount,
      items,
      status,
      paymentMode,
    });

    if (!selectedWarehouse) {
      throw new Error("Warehouse is required");
    }
    if (!selectedCustomer) {
      throw new Error("Customer is required");
    }
    if (!selectedAccount) {
      throw new Error("Account is required");
    }

    const validItems = items
      .map((it) => {
        const isValid = allItems.some(
          (ai) =>
            ai.parentId === it.item &&
            (!it.variant || ai._id === it.variant || ai.variantId === it.variant)
        );
        if (!isValid) {
          console.error("Invalid item in payload:", {
            itemId: it.item,
            variantId: it.variant,
            itemName: it.itemName,
            itemCode: it.itemCode,
          });
          return null;
        }
        if (it.quantity <= 0 || it.salesPrice <= 0) {
          console.error("Invalid quantity or price for item:", {
            itemId: it.item,
            itemName: it.itemName,
            quantity: it.quantity,
            price: it.salesPrice,
          });
          return null;
        }
        return {
          item: it.item,
          variant: it.variant,
          quantity: it.quantity,
          price: it.salesPrice,
          discount: it.discount || 0,
          unit: it.unit,
          tax: it.tax,
          subtotal: it.subtotal,
        };
      })
      .filter((it) => it !== null);

    if (validItems.length === 0) {
      throw new Error("No valid items to save. Please add valid items to the order.");
    }

    const payload = {
      warehouse: selectedWarehouse,
      customer: selectedCustomer,
      account: selectedAccount,
      items: validItems,
      totalAmount: totalAmount - totalDiscount,
      totalDiscount,
      couponCode: couponCode || undefined,
      payments,
      status,
      paymentMode,
      invoiceCount,
      previousBalance,
      adjustAdvancePayment,
      advancePaymentAmount,
    };
    console.log("Generated payload:", payload);
    return payload;
  }

  async function sendOrder(payload, method = "post", id) {
    try {
      const url = id ? `${link}/api/pos/${id}` : `${link}/api/pos`;
      const { data } = await axios[method](url, payload, authHeaders());
      const generated = data.order.saleCode;
      setInvoiceCode(generated);

      generateInvoicePDF(data.order, payload.payments);

      alert(`✔️ Saved! Your Invoice Code is ${generated}`);
      fetchHeld();
      navigate("/sale-list");
    } catch (err) {
      console.error("Send order error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        payload: payload,
      });
      alert(
        `Failed to save order: ${err.message}${err.response?.data?.message ? ` - ${err.response.data.message}` : ""}`
      );
    }
  }

  function resetForm() {
    setItems([]);
    setQuantity(0);
    setTotalAmount(0);
    setTotalDiscount(0);
    loadNextInvoiceCode();
    setInvoiceCount(0);
    setPreviousBalance(0);
    setCouponCode("");
    setAdjustAdvancePayment(false);
    setAdvancePaymentAmount(0);
    setCurrentOrderId("");
    setSelectedCustomer(customers[0]?._id || "");
    setSelectedWarehouse(warehouses[0]?._id || "");
    setSelectedAccount(accounts[0]?._id || "");
    setOrderPaymentMode("");
  }

 async function onHold() {
  // 0️⃣  Fancy confirm dialog -----------------------
  const { isConfirmed } = await Swal.fire({
    title: "Put order on hold?",
    text: "Are you sure you want to add this order to held invoices?",
    icon: "question",
    showCancelButton: true,
    confirmButtonColor: "#d33",       // red – matches your Hold button
    cancelButtonColor: "#3085d6",     // blue
    confirmButtonText: "Yes, Hold",
  });
  if (!isConfirmed) return;           // user aborted

  // 1️⃣  Basic validation (unchanged) --------------
  if (!selectedWarehouse || !selectedCustomer || !selectedAccount) {
    Swal.fire("Missing data", "Warehouse, customer and account are required.", "warning");
    return;
  }

  // 2️⃣  Find Hold payment type --------------------
  const pt = getPaymentTypeId("Hold");
  if (!pt) {
    Swal.fire("Config error", "Payment type 'Hold' is missing.", "error");
    return;
  }

  // 3️⃣  Build payload (your code) -----------------
  const payload = {
    warehouse: selectedWarehouse,
    customer: selectedCustomer,
    account: selectedAccount,
    items: items.map((it) => ({
      item: it.item,
      variant: it.variant || null,
      quantity: it.quantity,
      price: it.salesPrice,
      discount: it.discount || 0,
      unit: it.unit,
      tax: it.tax,
      subtotal: it.subtotal,
    })),
    totalAmount: totalAmount - totalDiscount,
    totalDiscount,
    payments: [
      {
        paymentType: pt,
        amount: totalAmount - totalDiscount,
        paymentNote: "Hold payment",
      },
    ],
    status: "OnHold",
    paymentMode: "hold",
    invoiceCount,
    previousBalance,
    adjustAdvancePayment,
    advancePaymentAmount,
    couponCode: couponCode || undefined,
  };

  // 4️⃣  POST / PUT exactly as before --------------
  try {
    const token = localStorage.getItem("token");
    if (currentOrderId) {
      await axios.put(`${link}/api/pos/${currentOrderId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
    } else {
      await axios.post(`{link}/api/pos`, payload, { headers: { Authorization: `Bearer ${token}` } });
    }
    await fetchHeld();
    Swal.fire("Held!", "Order has been moved to held invoices.", "success");
  } catch (err) {
    console.error("Hold error:", err);
    Swal.fire("Error", err.response?.data?.message || err.message, "error");
  }
}

  
  function onOpenModal(mode) {
    if (!editId || mode === "multiple") {
      if (!selectedWarehouse || !selectedCustomer || !selectedAccount) {
        alert("Please select a warehouse, customer, and account before proceeding with payment.");
        return;
      }
    }
    if (!items.length) {
      alert("Please add at least one item to the order.");
      return;
    }

    if (mode === "cash" || mode === "bank") {
      const paymentTypeId = getPaymentTypeId(mode);
      if (!paymentTypeId) {
        alert(
          `Missing payment type: ${mode.charAt(0).toUpperCase() + mode.slice(1)}. Please ensure it is configured.`
        );
        return;
      }

      const payment = {
        paymentType: paymentTypeId,
        amount: totalAmount - totalDiscount,
        paymentNote: `${mode.charAt(0).toUpperCase() + mode.slice(1)} payment`,
      };

      if (mode === "bank") {
        if (terminals.length > 0) {
          payment.terminal = terminals[0]._id;
        }
      }

      try {
        sendOrder(
          buildPayload({
            status: "Completed",
            payments: [payment],
            paymentMode: mode,
          }),
          currentOrderId ? "put" : "post",
          currentOrderId
        );
      } catch (err) {
        alert(err.message);
      }
    } else {
      setPaymentMode(mode);
      setIsPaymentModalOpen(true);
    }
  }

  // ─── HELPER: Edit / Delete held invoices ─────────────────────────────
  async function handleEditInvoice(id) {
    const inv = await fetchPosById(id);
    if (!inv) return;
    hydrateForEdit(inv);
    setShowHoldList(false);
  }

  async function handleDeleteInvoice(id) {
    if (!window.confirm("Delete this held invoice?")) return;
    await deletePosTransaction(id);
  }

  function handleLogout() {
    localStorage.clear();
    navigate("/");
    window.location.reload();
  }

  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  }

  // ─── RENDER ─────────────────────────────────────────────────────────
  const paymentSummary = {
    totalItems: quantity,
    totalPrice: totalAmount,
    discount: totalDiscount,
    couponDiscount: 0,
    totalPayable: totalAmount - totalDiscount,
    totalPaying: 0,
    balance: totalAmount - totalDiscount,
    changeReturn: 0,
  };

  const buttonStyles = {
    hold: orderPaymentMode === "hold" ? "border-4 border-yellow-400 shadow-lg" : "border border-gray-300",
    multiple: orderPaymentMode === "multiple" ? "border-4 border-yellow-400 shadow-lg" : "border border-gray-300",
    cash: orderPaymentMode === "cash" ? "border-4 border-yellow-400 shadow-lg" : "border border-gray-300",
    bank: orderPaymentMode === "bank" ? "border-4 border-yellow-400 shadow-lg" : "border border-gray-300",
  };

  if (isLoadingEdit) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen ">
      {/* Navbar */}
      <nav className="flex items-baseline justify-between px-4 text-white shadow-lg bg-gradient-to-r from-gray-800 to-gray-900">
        <div className="flex items-center gap-4">
          <h1
            className="text-xl font-bold transition-colors cursor-pointer hover:text-yellow-400"
            onClick={() => navigate("/dashboard")}
          >
            {storeName || "Grocery on Wheels"}
          </h1>
          <button
            className="text-2xl transition-colors md:hidden hover:text-yellow-400"
            onClick={() => setShowHoldList((v) => !v)}
          >
            <FaBars />
          </button>
          <div className="hidden gap-4 md:flex">
            <div
              className="flex items-center gap-1 transition-colors cursor-pointer hover:text-yellow-400"
              onClick={() => navigate("/sale-list")}
            >
              <FaList className="text-yellow-500" /> Sales List
            </div>
            <div
              className="flex items-center gap-1 transition-colors cursor-pointer hover:text-yellow-400"
              onClick={() => navigate("/customer/view")}
            >
              <FaUsers className="text-yellow-500" /> Customers
            </div>
            <div
              className="flex items-center gap-1 transition-colors cursor-pointer hover:text-yellow-400"
              onClick={() => navigate("/item-list")}
            >
              <FaBox className="text-yellow-500" /> Items
            </div>
            <div
              className="flex items-center gap-1 transition-colors cursor-pointer hover:text-yellow-400"
              onClick={resetForm}
            >
              <FaFileInvoice className="text-yellow-500" /> New Invoice
            </div>
          </div>
        </div>
        <div className="items-center hidden gap-4 md:flex">
          <div
            className="relative text-sm transition-colors cursor-pointer hover:text-yellow-400"
            onClick={() => setShowHoldList((v) => !v)}
          >
            Hold List{" "}
            <span className="absolute px-2 py-1 text-xs bg-red-600 rounded-full -top-2 -right-3">
              {heldInvoices.length}
            </span>
          </div>
          <FaWindowMaximize
            className="text-xl transition-colors cursor-pointer hover:text-yellow-400"
            onClick={toggleFullScreen}
          />
          <div
            className="relative flex items-center gap-2 cursor-pointer"
            onClick={() => setShowProfileDropdown((v) => !v)}
          >
            <img
              src="/userlogoprof.png"
              alt="Profile"
              className="w-10 h-10 border-2 border-gray-300 rounded-full shadow-sm"
            />
            <span className="transition-colors hover:text-yellow-400">
              {loadingUser ? "Loading..." : user.name}
            </span>
            {showProfileDropdown && (
              <div className="absolute right-0 z-20 w-64 p-4 text-black bg-white border border-gray-200 rounded-lg shadow-xl top-full">
                <div className="flex flex-col items-center">
                  <img
                    src="/userlogoprof.png"
                    alt="Profile"
                    className="w-16 h-16 border-2 border-gray-400 rounded-full shadow-sm"
                  />
                  <h3 className="mt-2 font-bold text-gray-800">{user.name}</h3>
                  <p className="text-sm text-blue-600">Role: {user.role}</p>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  <button className="px-4 py-2 transition-colors bg-gray-200 rounded hover:bg-gray-300">
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-white transition-colors bg-red-500 rounded hover:bg-red-600"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
          <div
            className="flex items-center gap-1 transition-colors cursor-pointer hover:text-yellow-400"
            onClick={() => navigate("/dashboard")}
          >
            <MdOutlineDashboard className="text-yellow-500" /> Dashboard
          </div>
        </div>
      </nav>

      {/* Held invoices */}
      {showHoldList && (
  <div className="absolute z-20 p-4 bg-white border border-gray-200 rounded-lg shadow-xl top-16 right-4 w-80">
    <h3 className="mb-3 text-lg font-bold text-gray-800">Held Invoices</h3>
    {heldInvoices.length ? (
      heldInvoices.map((inv) => (
        <div
          key={inv._id}
          className="flex items-center justify-between p-3 mb-2 transition bg-white border-l-4 rounded-lg border-cyan-500 hover:bg-gray-50"
        >
          {/* Show saleCode if available, otherwise first item name */}
          <div className="flex flex-col">
            <span className="font-semibold text-gray-800">
              {inv.saleCode || inv.items?.[0]?.itemName || inv._id.slice(0, 6)}
            </span>
            {inv.items?.length > 1 && (
              <span className="text-xs text-gray-500">
                +{inv.items.length - 1} more item{inv.items.length - 1 > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleEditInvoice(inv._id)}
              className="font-medium text-blue-600 hover:text-blue-800"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteInvoice(inv._id)}
              className="font-medium text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          </div>
        </div>
      ))
    ) : (
      <p className="text-sm text-gray-500">No held invoices</p>
    )}
  </div>
)}

      {/* Main content */}
      <div className="flex flex-col flex-grow gap-6 bg-white lg:flex-row">
           {activeTab==="pos1" && <POS1 selectedWarehouse={selectedWarehouse} setSelectedWarehouse={setSelectedWarehouse} warehouses={warehouses} invoiceCode={invoiceCode} selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer}
                       customers={customers} setActiveTab={setActiveTab}  
                         startScanner={startScanner}   filteredItems={filteredItems} scanning={scanning} setScanning={setScanning} videoRef={videoRef} orderPaymentMode={orderPaymentMode}    
                          previousBalance={previousBalance}
           />}
           {activeTab==="pos2" && <POS2 canvasRef={canvasRef} matchedItems={matchedItems} setMatchedItems={setMatchedItems}  searchItemCode={searchItemCode} setActiveTab={setActiveTab} setSearchItemCode={setSearchItemCode} updateItem={updateItem} removeItem={removeItem} items={items} setItems={setItems} stopScanner={stopScanner}
                                            allItems={allItems}  codeReaderRef={codeReaderRef} addItem={addItem} startScanner={startScanner} setScanning={setScanning} selectedWarehouse={selectedWarehouse}  filteredItems={filteredItems} scanning={scanning} videoRef={videoRef} orderPaymentMode={orderPaymentMode}    
           />}
           {activeTab==="pos3" && <POS3 allItems={allItems} showHoldList={showHoldList} heldInvoices={heldInvoices} handleEditInvoice={handleEditInvoice}
           handleDeleteInvoice={handleDeleteInvoice} selectedWarehouse={selectedWarehouse} warehouses={warehouses} setSelectedWarehouse={setSelectedWarehouse}  setActiveTab={setActiveTab}
           invoiceCode={invoiceCode} selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer} searchItemCode={searchItemCode} setSearchItemCode={setSearchItemCode}  addItem={addItem}
           filteredItems={filteredItems} startScanner={startScanner} scanning={scanning} videoRef={videoRef} codeReaderRef={codeReaderRef} setScanning={setScanning} orderPaymentMode={orderPaymentMode} items={items} updateItem={updateItem} removeItem={removeItem}
           onHold={onHold} previousBalance={previousBalance} buttonStyles={buttonStyles} onOpenModal={onOpenModal} quantity={quantity} totalAmount={totalAmount} totalDiscount={totalDiscount} couponCode={couponCode} setCouponCode={setCouponCode}
           isPaymentModalOpen={isPaymentModalOpen} PaymentModal={PaymentModal} setIsPaymentModalOpen={setIsPaymentModalOpen} paymentTypes={paymentTypes} accounts={accounts} terminals={terminals} advancePaymentAmount={advancePaymentAmount} selectedAccount={selectedAccount} setSelectedAccount={setSelectedAccount}
           paymentSummary={paymentSummary} sendOrder={sendOrder} buildPayload={buildPayload} currentOrderId={currentOrderId} setAdjustAdvancePayment={setAdjustAdvancePayment} customers={customers}
/>}       
      </div>
    </div>
  );
}
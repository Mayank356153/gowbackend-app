import React, { useEffect, useState, useRef, useCallback } from "react";
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
import { Camera } from "@capacitor/camera";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { MdOutlineDashboard } from "react-icons/md";
import axios, { all } from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import PaymentModal from "../PaymentModal";
import LoadingScreen from "../../../Loading";
import POS1 from "./POS1";
import POS2 from "./POS2";
import POS3 from "./POS3";
import Swal from 'sweetalert2';
import playSound from "../../../utility/sound";
import Print from "./Print";
import {Geolocation} from "@capacitor/geolocation";


function buildInvoiceHTML(order, payments = [], store, cust, rows, sellerName = "–", setPrint, setActiveTab) {
  const {
    logo, storeName, tagline, address, gst, phone, email
  } = store;

  const today = new Date(order.createdAt || Date.now());
  const totalQuantity = rows.reduce((sum, r) => sum + r.quantity, 0);

  // 2️⃣ “Before Tax” is pure quantity × rate, no discounts
  const rawTotal = rows.reduce((sum, r) => sum + (r.quantity * r.salesPrice), 0);

  // 3️⃣ Your existing order.totalDiscount and taxAmount
  const disc = order.totalDiscount || 0;
  const taxAmt = order.taxAmount || 0;

  // 4️⃣ Net total after discount, before adding tax
  const netBeforeTax = rawTotal - disc;

  // 5️⃣ Paid & previous due
  const paid = payments.reduce((s, p) => s + p.amount, 0);
  const prevDue = order.previousBalance || 0;

  // 6️⃣ Final due
  const totalDue = prevDue + netBeforeTax + taxAmt - paid;

  // build your rows as before…
  const body = rows.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.itemName}</td>
      <td class="r">${r.quantity}</td>
      <td class="r">${r.mrp.toFixed(2)}</td>
      <td class="r">${r.salesPrice.toFixed(2)}</td>
      <td class="r">${(r.quantity * r.salesPrice).toFixed(2)}</td>
    </tr>`
  ).join("");

  const payRows = payments.map((p, i) => `
    <tr><td>${i + 1}</td><td>${p.paymentNote || "-"}</td><td class="r">${(p.amount)}</td></tr>`
  ).join("");
  
  // REMOVED THE ALERT
  // alert("asd") 
  
  // setPrint({
  //   order,
  //   payments,
  //   store: {
  //      storeName, tagline, address, gst, phone, email
  //   },
  //   customer: cust,
  //   items: rows,
  //   seller: sellerName,
  //   dues: { previousDue: totalDue }
  // });
     return({
    order:{  rows:rows,...order },
    payments:payments,
    store: {
      storeName, tagline, address, gst, phone, email
    },
    customer: {customerName: cust.customerName || "–"},
    seller: {sellerName: sellerName},
    dues: { previousDue: totalDue }
  }); 
  // This will now correctly switch to the print view after the state has been set.
  // setActiveTab("print");
}






export default function POSM() {
  const link="https://pos.inspiredgrow.in/vps"
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const getLocation = async () => {
      try {
      
        const permission = await Geolocation.requestPermissions();
    const position = await Geolocation.getCurrentPosition();

    const { latitude, longitude } = position.coords;
          setLocation([ latitude, longitude ]);
      } catch (err) {
        console.error('Location error:', err);
      }
    };

    getLocation();
  }, []);
  
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

  const [storeName, setStoreName] = useState("");
  const [orderToEdit, setOrderToEdit] = useState(null);
  const [defaultWarehouse, setDefaultWarehouse]   = useState("");
  const prevWarehouseRef = useRef();    
  const[print,setPrint]=useState({})

  useEffect(()=>{
     setSelectedWarehouse(localStorage.getItem("deafultWarehouse") || null);
  },[])
   
    
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


useEffect(() => {
  const role = localStorage.getItem("role");
     
        const data = JSON.parse(localStorage.getItem("user"));
      setUser(data);
      setStoreName(data.storeName || "Grocery on Wheels");
      setDefaultWarehouse(data.defaultWarehouse || "");
},[])

  // ─── FETCHERS ───────────────────────────────────────────────────────
  useEffect(() => {
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
     const {data} = await axios.get(`${link}/api/items`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        params: { warehouse: selectedWarehouse,inStock:true }
      });
      console.log("a")
     console.log(data);
    const rawItems = data.data || [] ;

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
        flatItems
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
      amt += i.subtotal ;
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
  // if (defaultWarehouse) {
  //   // user has a default → honor it
  //   setSelectedWarehouse(defaultWarehouse);
  // } else {
  //   // fallback to restricted / first active
  //   const restricted = warehouses.find(
  //     (w) => w.isRestricted && w.status === "Active"
  //   );
  //   setSelectedWarehouse(
  //     restricted?._id ||
  //       warehouses.find((w) => w.status === "Active")?._id ||
  //       ""
  //   );
  // }
}, [warehouses, defaultWarehouse, editId]);

 const videoRef       = useRef(null);
  const codeReaderRef  = useRef(null);
 

  
const startScanner = async () => {
  if (!selectedWarehouse) {
    alert("Please select a warehouse before scanning.");
    return;
  }
  // Request Camera Permission on Android
  const permission = await Camera.requestPermissions(); // or checkPermissions()
  console.log(permission)
  if (permission.camera !== 'granted') {
    alert('Camera permission is required');
    return ;
  }
  const codeReader = new BrowserMultiFormatReader();
  codeReaderRef.current = codeReader;

  const decode = (facingMode) =>
    
    codeReader.decodeFromConstraints(
      { video: { facingMode } },
      videoRef.current,
      async (result, err) => {
        if (result) {
           const text = result.getText() 
        console.log("Scanned barcode:", text);
          
        const match = allItems.find(
          (i) =>
            i.itemCode === text ||
            i.barcodes?.includes(text) ||
            i.itemName.toLowerCase() === text.toLowerCase()
        );

        if (match) {
        setMatchedItems((prev) => {
  const existingIndex = prev.findIndex((item) => item.item === match._id);

  if (existingIndex !== -1) {
    // Existing item: increment quantity and play different sound
    const updatedItems = [...prev];
    updatedItems[existingIndex] = {
      ...updatedItems[existingIndex],
      quantity: updatedItems[existingIndex].quantity + 1,
    };
    playSound("/sounds/item-exists.mp3");
    return updatedItems;
  } else {
    // New item: add and play add sound
    playSound("/sounds/item-added.mp3");
    return [
      ...prev,
      {
        ...match,
        quantity: 1,
        item: match._id,
      },
    ];
  }
});


         // Wait a bit then scan again
            setTimeout(() => {
              codeReader.reset(); // very important to reset before new scan
              decode(facingMode); // recursively call decode
            }, 5000); // 800ms delay before next scan
        }}

        if (err && err.name !== 'NotFoundException') {
          console.error("Scan error:", err);
        }
      }
    );
    
   console.log(videoRef)
  try {
    await decode({ exact: "environment" }); // Try back camera first
  } catch {
    try {
      await decode("user"); // Fallback to front camera
    } catch (e) {
      console.error("Camera error:", e);
      stopScanner();
    }
  }
};



const stopScanner = () => {
  // Stop camera tracks
  const tracks = videoRef.current?.srcObject?.getTracks();
  if (tracks) {
    tracks.forEach((t) => t.stop());
  }

  codeReaderRef.current?.reset?.();
  setMatchedItems([])
};

function applyOfferLogic(itemList) {
  return itemList.map((item) => {
    const { discountPolicy, quantity, requiredQty, freeQty, salesPrice, discount = 0 } = item;

    if (discountPolicy === "BuyXGetY" && quantity >= requiredQty) {
      const groups = Math.floor(quantity / requiredQty); // how many times requiredQty fits
      const totalFree = groups * freeQty;
      const discountAmount = totalFree * salesPrice;

      return {
        ...item,
        subtotal: quantity * salesPrice - discountAmount,
        effectiveFreeQty: totalFree // optional: if you want to show how many were free
      };
    }

    return {
      ...item,
      subtotal: quantity * salesPrice - discount,
    };
  });
}

  // ─── ITEM HANDLERS ─────────────────────────────────────────────────
function addItem(it) {
 
  if (!it || !it.parentId) {
    console.error("Invalid item, missing parentId:", it);
    return;
  }

  const parentExists = allItems.some(
    (ai) => ai._id === it.parentId && !ai.variantId
  );
  if (!parentExists && !it.variantId) {
    console.error(`Parent item not found for parentId: ${it.parentId}`, it);
    return;
  }

  if (it.variantId) {
    const variantValid = allItems.some(
      (ai) => ai._id === it.variantId && ai.parentId === it.parentId
    );
    if (!variantValid) {
      console.error(
        `Invalid variantId: ${it.variantId} for parentId: ${it.parentId}`,
        it
      );
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

    if (newQty <= existing.currentStock) {
      playSound("/sounds/item-exists.mp3");
      updated[existingIdx] = {
        ...existing,
        quantity: newQty,
        subtotal: newQty * existing.salesPrice - (existing.discount || 0),
      };

      const updatedWithOffer = applyOfferLogic(updated); // 🔁 OFFER HERE
      setItems(updatedWithOffer);
      setSearchItemCode("");
      return;
    }

    setSearchItemCode("");
    return;
  } else {
    playSound("/sounds/item-added.mp3");
    const newItem = {
      discountPolicy: it.discountPolicy || "None",
      requiredQty: it.requiredQuantity || 0,
      freeQty: it.freeQuantity || 0,
      stock: it.currentStock || 0,
      item: it.parentId,
      variant: it.variantId || null,
      itemName: it.itemName,
      itemCode: it.itemCode || "",
      openingStock: it.openingStock || 0,
      currentStock:
        it.currentStock != null ? it.currentStock : it.openingStock || 0,
      salesPrice: it.salesPrice || 0,
      quantity: quantityToAdd,
      discount: it.discount || 0,
      tax: it.tax?._id || null,
      taxRate: it.tax?.taxPercentage || 0,
      unit: it.unit || null,
      mrp: it.mrp || 0,
      expiryDate: it.expiryDate || null,
      subtotal:
        quantityToAdd * (it.salesPrice || 0) - (it.discount || 0),
    };

    if (newItem.salesPrice <= 0) {
      alert("Item sales price must be greater than zero.");
      return;
    }

    const updatedWithNewItem = [...items, newItem];
    const updatedWithOffer = applyOfferLogic(updatedWithNewItem); // 🔁 OFFER HERE
   
    setItems(updatedWithOffer);
    setSearchItemCode("");
  }
}
function addItemsInBatch(matchedItems) {
  let updated = [...items];

  for (const it of matchedItems) {
    if (!it || !it.parentId) {
      console.error("Invalid item, missing parentId:", it);
      continue;
    }

    const parentExists = allItems.some(
      (ai) => ai._id === it.parentId && !ai.variantId
    );
    if (!parentExists && !it.variantId) {
      console.error(`Parent item not found for parentId: ${it.parentId}`, it);
      continue;
    }

    if (it.variantId) {
      const variantValid = allItems.some(
        (ai) => ai._id === it.variantId && ai.parentId === it.parentId
      );
      if (!variantValid) {
        console.error(
          `Invalid variantId: ${it.variantId} for parentId: ${it.parentId}`,
          it
        );
        continue;
      }
    }

    const quantityToAdd = it.quantity || 1;
    const existingIdx = updated.findIndex(
      (r) => r.item === it.parentId && r.variant === (it.variantId || null)
    );

    if (existingIdx !== -1) {
      const existing = updated[existingIdx];
      const newQty = existing.quantity + quantityToAdd;

      if (newQty <= existing.currentStock) {
        playSound("/sounds/item-exists.mp3");
        updated[existingIdx] = {
          ...existing,
          quantity: newQty,
          subtotal: newQty * existing.salesPrice - (existing.discount || 0),
        };
      }
      continue;
    } else {
      playSound("/sounds/item-added.mp3");
      const newItem = {
        discountPolicy: it.discountPolicy || "None",
        requiredQty: it.requiredQuantity || 0,
        freeQty: it.freeQuantity || 0,
        stock: it.currentStock || 0,
        item: it.parentId,
        variant: it.variantId || null,
        itemName: it.itemName,
        itemCode: it.itemCode || "",
        openingStock: it.openingStock || 0,
        currentStock:
          it.currentStock != null ? it.currentStock : it.openingStock || 0,
        salesPrice: it.salesPrice || 0,
        quantity: quantityToAdd,
        discount: it.discount || 0,
        tax: it.tax?._id || null,
        taxRate: it.tax?.taxPercentage || 0,
        unit: it.unit || null,
        mrp: it.mrp || 0,
        expiryDate: it.expiryDate || null,
        subtotal:
          quantityToAdd * (it.salesPrice || 0) - (it.discount || 0),
      };

      if (newItem.salesPrice <= 0) {
        alert("Item sales price must be greater than zero.");
        continue;
      }

      updated.push(newItem);
    }
  }

  const updatedWithOffer = applyOfferLogic(updated);
  setItems(updatedWithOffer);
  setSearchItemCode("");
}


function updateItem(idx, field, val) {
  const numericVal = Number(val);
  const row = items[idx];

  // ❗ Prevent salesPrice > MRP
  if (field === "salesPrice" && numericVal > row.mrp) {
    alert(`❗ Sales Price (${numericVal}) cannot exceed the MRP (${row.mrp})`);
    return;
  }

  // ❗ Prevent salesPrice <= 0
  if (field === "salesPrice" && numericVal <= 0) {
    alert(`${field.charAt(0).toUpperCase() + field.slice(1)} must be greater than zero.`);
    return;
  }

  // ❗ Prevent quantity > currentStock
  if (field === "quantity" && numericVal > row.currentStock) {
    return;
  }

  const updatedItems = items.map((r, i) =>
    i === idx
      ? {
          ...r,
          [field]: numericVal || 0,
        }
      : r
  );

  const withOffer = applyOfferLogic(updatedItems);

  // ✅ Ensure all subtotals are accurate after offer logic
  

  setItems(withOffer);
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
      location:location,
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
    console.log("Sending order with payload:", payload);
    
    /* ---- 2️⃣ Save the order ---- */
    const url  = id ? `${link}/api/pos/${id}` : `${link}/api/pos`;
    const { data } = await axios[method](url, payload, authHeaders());
     console.log("Order saved:", data);
    /* ---- 3️⃣ Build the final invoice HTML ---- */
    const custObj = customers.find(c => c._id === selectedCustomer) || {};
    
    const r= buildInvoiceHTML(
      data.order,
      payload.payments,
      storeInfo,
      custObj,
      items,
      sellerDisplayName(user),
      setActiveTab,setPrint          
    );
    console.log("Generated invoice HTML:", r);
    setPrint(r);
    setActiveTab("print")
    /* ---- 5️⃣ House-keeping ---- */
    setInvoiceCode(data.order.saleCode);
    // resetForm();
    // fetchHeld();
    Swal.fire("Saved!", "", "success");
  } catch (err) {
    // if (previewWin) previewWin.close();   // don’t leave a blank tab
    console.error("Send order error details:", err);
    Swal.fire("Error", err.response?.data?.message || err.message, "error");
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
    setSelectedWarehouse(localStorage.getItem("defaultWarehouse") || null);
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
    location: location,
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
      await axios.post(`${link}/api/pos`, payload, { headers: { Authorization: `Bearer ${token}` } });
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


  
  const sellerDisplayName = (u = {}) =>
  // ① show what’s in the navbar
  u.name?.trim() ||
  // ② otherwise try first + last
  [u.FirstName, u.LastName].filter(Boolean).join(" ").trim() ||
  // ③ fall back to email or phone
  u.userName || u.Mobile || "–";
  const storeInfo = {
  logo:        "/logo/inspiredgrow.jpg",                       //  40-50 px square looks right
  storeName:   storeName,                                //  already in state
  tagline:     "GROCERY ON WHEELS",
  address:     "Basement 210-211 new Rishi Nagar near Shree Shyam Baba Mandir Gali No. 9, Hisar – 125001",
  gst:         "06AAGCI0630K1ZR",
  phone:       "9050092092",
  email:       "INSPIREDGROW@GMAIL.COM",
};

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
<nav className="sticky top-0 z-50 flex flex-col items-center justify-between gap-2 px-6 pt-4 text-white bg-gray-900 md:gap-0 md:flex-row">
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
      <div className="flex flex-col bg-white lg:flex-row">
           {activeTab==="pos1" && <POS1 selectedWarehouse={selectedWarehouse} setSelectedWarehouse={setSelectedWarehouse} warehouses={warehouses} invoiceCode={invoiceCode} selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer}
                       customers={customers} setActiveTab={setActiveTab}  
                         startScanner={startScanner}   filteredItems={filteredItems} scanning={scanning} setScanning={setScanning} videoRef={videoRef} orderPaymentMode={orderPaymentMode}    
                          previousBalance={previousBalance}
           />}
           {activeTab==="pos2" && <POS2 addItemsInBatch={addItemsInBatch} matchedItems={matchedItems} setMatchedItems={setMatchedItems}  searchItemCode={searchItemCode} setActiveTab={setActiveTab} setSearchItemCode={setSearchItemCode} updateItem={updateItem} removeItem={removeItem} items={items} setItems={setItems} stopScanner={stopScanner}
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
           {activeTab==="print" && <Print setActiveTab={setActiveTab} print={print}/>}
      </div>
    </div>
  );
}
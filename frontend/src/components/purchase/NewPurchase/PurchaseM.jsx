import React, { useEffect, useState, useRef ,useCallback} from 'react';
import Navbar from "../../Navbar.jsx";
import Sidebar from "../../Sidebar.jsx";
import { useNavigate,  useSearchParams } from 'react-router-dom';
import axios from 'axios';

import LoadingScreen from '../../../Loading.jsx';
import dayjs from 'dayjs';
import SupplierPopup from "../SupplierPopup";
import Purchase1 from './Purchase1.jsx';
import Purchase2 from './Purchase2.jsx';
import Purchase3 from './Purchase3.jsx';
import { Camera } from '@capacitor/camera';
import playSound from "../../../utility/sound";
// Generate reference number
const generateReferenceNo = (lastReferenceNo) => {
  const currentYear = new Date().getFullYear();

  // If not present, return starting PO ref
  if (!lastReferenceNo || typeof lastReferenceNo !== 'string') {
    return `PO/${currentYear}/01`;
  }

  // Split into parts
  const parts = lastReferenceNo.split("/");

  // Case 1: PO format => PO/2025/03
  if (
    parts.length === 3 &&
    parts[0] === "PO" &&
    /^\d{4}$/.test(parts[1]) &&
    !isNaN(parseInt(parts[2]))
  ) {
    const lastNumber = parseInt(parts[2], 10);
    return `PO/${parts[1]}/${String(lastNumber + 1).padStart(2, "0")}`;
  }

  // Case 2: BULK format => BULK/1753680742051
  if (
    parts.length === 2 &&
    parts[0] === "BULK" &&
    /^\d+$/.test(parts[1])
  ) {
    return `BULK/${Date.now()}`;
  }

  // Default fallback (invalid format): start fresh
  return `PO/${currentYear}/01`;
};


// Handle item field changes
const handleItemFieldChange = (index, field, value, formData, setFormData, operation = null) => {
  const currentMRP = formData.items[index]?.mrp || 0;
  const currentUnitCost = formData.items[index]?.unitCost || 0;
  let newValue = value;

  if (field === 'quantity' && operation) {
    // Handle plus/minus buttons
    const currentQuantity = Number(formData.items[index]?.quantity) || 1;
    newValue = operation === 'increment' ? currentQuantity + 1 : Math.max(1, currentQuantity - 1);
  } else if (field === 'salesPrice' && Number(value) > currentUnitCost) {
    alert(`Sorry, the Sales Price cannot exceed the Cost Price (${currentUnitCost}).`);
    newValue = currentUnitCost;
  } else if ((field === 'salesPrice' || field === 'unitCost') && Number(value) > currentMRP) {
    alert(`Sorry, the ${field === 'salesPrice' ? 'Sales Price' : 'Cost Price'} cannot exceed the MRP (${currentMRP}).`);
    newValue = currentMRP;
  } else {
    newValue = field === 'expiryDate' ? value : Number(value) || 0;
  }

  setFormData((prev) => {
    const updatedItems = [...prev.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: field === 'expiryDate' ? newValue : Number(newValue) || 0,
      totalAmount:
        field === 'quantity' || field === 'mrp' || field === 'discount'
          ? (Number(field === 'quantity' ? newValue : updatedItems[index].quantity) || 1) *
            (Number(field === 'mrp' ? newValue : updatedItems[index].mrp) || 0) -
            (Number(field === 'discount' ? newValue : updatedItems[index].discount) || 0)
          : updatedItems[index].totalAmount,
    };
    return {
      ...prev,
      items: updatedItems,
    };
  });
};
// Utility to escape regex special characters
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const PurchaseM= () => {
  const link="https://pos.inspiredgrow.in/vps"
    const[activeTab,setActiveTab]=useState("p1")
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const [otherCharges, setOtherCharges] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [discountType, setDiscountType] = useState('amount');
  const [subtotal, setSubtotal] = useState(0);
  const [grandtotal, setGrandTotal] = useState(0);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [result, setResult] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [discountMoney, setDiscountMoney] = useState(0);
  const [showSupplierPop, setShowSupplierPop] = useState(false);
  const prevWarehouse = useRef(null);
  const [defaultWarehouse, setDefaultWarehouse] = useState(null);
  const[sWarehouse,setSWarehouse]=useState(null)
  const [options, setOptions] = useState({
    warehouse: [],
    items: [],
    suppliers: [],
    accounts: [],
    paymentType: [],
    terminals: [],
  });

  const [formData, setFormData] = useState({
    discountOnAll: 0,
    grandTotal: 0,
    items: [],
    note: "",
    otherCharges: 0,
    payments: [{
      account: null,
      amount: 0,
      paymentNote: "",
      paymentType: null,
      terminal: null,
    }],
    purchaseCode: "",
    purchaseDate: new Date().toLocaleDateString('en-CA'),
    referenceNo: "",
    supplier: null,
    warehouse: null,
    createdBy: "",
    createdByModel: "",
  });
  
    useEffect(()=>{
       setSWarehouse(localStorage.getItem("deafultWarehouse") || null);
    },[])
     

  const navigate = useNavigate();
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  
 const playBeep = useCallback(() => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(2.0, audioContext.currentTime);
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.15);
    }, []);
  

  useEffect(() => {
  // ‼️ Skip the very first render
  if (!prevWarehouse.current) {
    prevWarehouse.current = formData.warehouse;
    return;
  }

  // Did the warehouse actually change?
  if (prevWarehouse.current !== formData.warehouse) {
    // 1. Stop scanner if running
    const reader = codeReaderRef.current;
    if (reader?.stopStreams) reader.stopStreams();
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }


    // 2. Clear cart
    setOptions(o => ({ ...o, items: [] }));
    setFormData(fd => ({ ...fd, items: [] }));
  }

  // remember for next tick
  prevWarehouse.current = formData.warehouse;
}, [formData.warehouse]);
useEffect(() => {
  (async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");            // or "/login" – whatever you use
        return;
      }

      // Pick the right endpoint for the current role
      const role = localStorage.getItem("role");
      const url =
        role === "admin"
          ? `${link}/auth/profile`
          : `${link}/admiaddinguser/profile`;  // 🔁 change if your route differs

      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      
      const dw =
        typeof data.defaultWarehouse === "string"
          ? data.defaultWarehouse
          : data.defaultWarehouse?._id;

      setDefaultWarehouse(dw || null);
    } catch (err) {
      console.error("Profile fetch failed:", err);
    }
  })();
}, [navigate]);


  // Fetch last purchase for reference number
  useEffect(() => {
    if (id) return;
    const fetchLastPurchase = async () => {
      try {
        const response = await axios.get(`${link}/api/purchases`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const purchases = response.data.data || [];
        const nonReturnPurchases = purchases.filter(p => !p.isReturn);
        const lastReferenceNo = nonReturnPurchases.length
          ? nonReturnPurchases[nonReturnPurchases.length - 1].referenceNo
          : null;
        const newReferenceNo = generateReferenceNo(lastReferenceNo);
        setFormData(prev => ({ ...prev, referenceNo: newReferenceNo }));
      } catch (error) {
        console.error("Error fetching last purchase:", error);
      }
    };
    fetchLastPurchase();
  }, [id]);

  // Set sidebar state based on screen size
 

  
    async function fetchItems() {
    if (!sWarehouse) {
      setAllItems([]);
      return;
    }
  
    try {
       const {data} = await axios.get(`${link}/api/items`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          params: { warehouse: sWarehouse }
        });
        
     
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
  
        
        setAllItems(flatItems);
      } catch (err) {
        console.error("Fetch items error:", err.message);
      }
    }

  useEffect(() => {
    if (sWarehouse) {
      fetchItems(sWarehouse);
    } else {
      setAllItems([]);
    }
  }, [sWarehouse]);

  // Fetch purchase data for editing
  const fetchPurchase = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, redirecting...");
      navigate("/");
      return;
    }
    try {
      const response = await axios.get(`${link}/api/purchases/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const purchaseData = response.data.data;
      setFormData({
        ...purchaseData,
        warehouse: purchaseData.warehouse?._id || purchaseData.warehouse,
        supplier: purchaseData.supplier?._id || purchaseData.supplier,
        purchaseDate: purchaseData.purchaseDate ? dayjs(purchaseData.purchaseDate).format("YYYY-MM-DD") : new Date().toLocaleDateString('en-CA'),
        items: purchaseData.items.map(item => ({
          item: item.item?._id || item.item,
          variant: item.variant || null,
          quantity: item.quantity || 1,
          unitCost: item.purchasePrice || item.unitCost || 0,
          mrp: item.mrp || 0,
          expiryDate: item.expiryDate || "",
          discount: item.discount || 0,
          salesPrice: item.salesPrice || 0,
          totalAmount: item.totalAmount || (item.quantity * item.mrp - item.discount),
        })),
        payments: purchaseData.payments?.length > 0 ? purchaseData.payments.map(p => ({
          account: p.account?._id || p.account,
          amount: p.amount || 0,
          paymentNote: p.paymentNote || "",
          paymentType: p.paymentType?._id || p.paymentType,
          terminal: p.terminal?._id || p.terminal,
        })) : [{
          account: null,
          amount: 0,
          paymentNote: "",
          paymentType: null,
          terminal: null,
        }],
      });
      setOptions((prev) => ({
        ...prev,
        items: purchaseData.items.map(item => ({
          ...item.item,
          parentId: item.item?.parentItemId || item.item?._id,
          variantId: item.variant || null,
          itemName: item.item?.parentItemId ? `${item.item?.itemName} / ${item.item?.variantName || "Variant"}` : item.item?.itemName,
        })),
      }));
      setGrandTotal(purchaseData.grandTotal || 0);
      setSubtotal(purchaseData.subtotal || 0);
      setDiscountMoney(purchaseData.discountOnAll || 0);
      setDiscount(purchaseData.discountOnAll || 0);
      setOtherCharges(purchaseData.otherCharges || 0);
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    }
  };

  // Fetch warehouses
  const fetchWarehouses = async () => {
  setLoading(true);
  const token = localStorage.getItem("token");
  if (!token) {
    console.log("No token found, redirecting...");
    navigate("/");
    return;
  }
  try {
    const response = await axios.get(`${link}/api/warehouses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const allWh = response.data.data || [];
    const activeWh = allWh
      .filter(w => w.status === "Active")
      .map(w => ({
        label: w.warehouseName,
        value: w._id,
        cashAccount: w.cashAccount?._id || w.cashAccount,
      }));
    setOptions(prev => ({ ...prev, warehouse: activeWh }));
    //if (!id && activeWh.length) {
     // const restrictedWarehouse = allWh.find((w) => w.isRestricted && w.status === "Active");
      //setFormData(prev => ({
        //...prev,
        //warehouse: restrictedWarehouse?._id || activeWh[0]?.value || null
      //}));
    //}
  } catch (error) {
    alert(error.response?.data?.message || error.message);
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
  if (id) return;                     // editing – keep whatever came from DB
  if (!options.warehouse.length) return;   // wait for the list to load

  if (defaultWarehouse) {
    // ① user has a preferred warehouse
    setFormData(prev => ({ ...prev, warehouse: defaultWarehouse }));
  } else {
    // ② fall back to restricted-then-first-active
    const restricted = options.warehouse.find(
      w => w.isRestricted && w.status === "Active"
    ); // we only kept label/value above, so this will probably be undefined; if so, skip
    setFormData(prev => ({
      ...prev,
      warehouse:
        restricted?.value || options.warehouse[0].value || null
    }));
  }
}, [options.warehouse, defaultWarehouse, id]);

const updateItem = (e, itemId, action) => {
  alert("This feature is not implemented yet.");
  const updatedItems = formData.items.map((item) => {
    if (item.item !== itemId) return item;

    let newQty = item.quantity;

    if (action === "plus") {
      newQty = item.quantity + 1;
    } else if (action === "minus") {
      newQty = Math.max(1, item.quantity - 1);
    } else if (action === "change") {
      const val = parseInt(e.target.value) || 1;
      newQty = Math.max(1, val);
    }
    if (newQty > item.currentStock) {
      alert("Quantity cannot exceed available stock");
      newQty = item.currentStock; // Prevent exceeding stock
    }
    return {
      ...item,
      quantity: newQty,
      subtotal: newQty * item.salesPrice - (item.discount || 0),
    };
  });

  setFormData((prev) => ({
    ...prev,
    items: updatedItems,
  }));
};





  // Fetch suppliers
  const fetchSuppliers = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, redirecting...");
      navigate("/");
      return;
    }
    try {
      const response = await axios.get(`${link}/api/suppliers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newSuppliers = response.data.data
        .filter((supplier) => supplier.supplierName)
        .map((supplier) => ({
          label: supplier.supplierName,
          value: supplier._id,
        }));
        if(newSuppliers.length ===1 ) {
          handleSelectChange(newSuppliers[0].value, "supplier");
        }
      setOptions((prev) => ({ ...prev, suppliers: newSuppliers }));
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch accounts
  const fetchAccount = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, redirecting...");
      navigate("/");
      return;
    }
    try {
      const response = await axios.get(`${link}/api/accounts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newAccounts = response.data.data.map((account) => ({
        label: account.accountNumber,
        value: account._id,
      }));
      setOptions((prev) => ({ ...prev, accounts: newAccounts }));
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch payment types
  const fetchPaymentType = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, redirecting...");
      navigate("/");
      return;
    }
    try {
      const response = await axios.get(`${link}/api/payment-types`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newPaymentType = response.data.data.map((type) => ({
        label: type.paymentTypeName,
        value: type._id,
        name: type.paymentTypeName.toLowerCase(),
      }));
      setOptions((prev) => ({ ...prev, paymentType: newPaymentType }));
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch terminals
  const fetchTerminals = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, redirecting...");
      navigate("/");
      return;
    }
    try {
      const response = await axios.get(`${link}/api/terminals`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newTerminals = response.data.data.map((terminal) => ({
        label: terminal.tid,
        value: terminal._id,
        warehouse: terminal.warehouse?._id || terminal.warehouse,
      }));
      setOptions((prev) => ({ ...prev, terminals: newTerminals }));
    } catch (error) {
      alert(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter items by warehouse and search query
  useEffect(() => {
    const q = result.trim();
    if (!q || !formData.warehouse) {
      setFilteredItems([]);
      return;
    }
    const rx = new RegExp(esc(q), "i");
    setFilteredItems(
      allItems
        .filter(
          (it) =>
            it.warehouse?._id === formData.warehouse &&
            (rx.test(it.itemName) ||
              rx.test(it.itemCode) ||
              rx.test(it.barcodes?.join(" ") || ""))
        )
        .slice(0, 15)
    );
  }, [result, formData.warehouse, allItems]);

  // Handle form field changes
  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.type === "number" ? Number(e.target.value) : e.target.value,
    }));
  };

  // Handle payment field changes
  const handlePayment = (e) => {
    setFormData((prev) => ({
      ...prev,
      payments: [{
        ...prev.payments[0],
        [e.target.name]: e.target.type === "number" ? Number(e.target.value) : e.target.value,
      }],
    }));
  };

  // Calculate totals
  useEffect(() => {
  
    const sub = (formData?.items || []).reduce((acc, item) => {
   
      const itemTotal = (item.quantity || 0) * (item.purchasePrice || 0) - (item.discount || 0);
      return acc + itemTotal;
    }, 0);

    let discountAmount = discount;
    if (discountType === "percent") {
      discountAmount = (sub * discount) / 100;
    }

    const gtotal = sub + parseFloat(otherCharges || 0) - discountAmount;
    setSubtotal(sub);
    setDiscountMoney(discountAmount);
    setGrandTotal(gtotal > 0 ? gtotal : 0);

    setFormData((prev) => ({
      ...prev,
      grandTotal: isNaN(gtotal) ? 0 : gtotal,
      discountOnAll: discountAmount,
    }));
  }, [formData.items, discount, discountType, otherCharges]);

  
   useEffect(() => {
    if (!id) {
      setFormData(prev => ({
        ...prev,
        payments: [
          {
            ...prev.payments[0],
            amount: grandtotal
          }
        ]
      }));
    }
  }, [grandtotal, id]);

  // Fetch data on mount
  useEffect(() => {
    if (id) fetchPurchase();
    fetchWarehouses();
    fetchSuppliers();
    fetchPaymentType();
    fetchAccount();
    fetchTerminals();
  }, [id]);

  // Handle item removal
  const handleRemoveItem = (indexToRemove) => {
    setOptions((prev) => ({
      ...prev,
      items: prev.items.filter((_, index) => index !== indexToRemove),
    }));
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, index) => index !== indexToRemove),
    }));
  };

  // Post or update purchase
  const token = localStorage.getItem("token");

  const postData = async () => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${link}/api/purchases/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Updated Successfully");
      navigate("/purchase-list");
    } catch (err) {
      alert(`Unsuccessful: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const sendData = async () => {
    setLoading(true);
    if (!token) {
      console.log("No token found, redirecting...");
      navigate("/");
      return;
    }
    console.log("Sending formData:", JSON.stringify(formData, null, 2));
    try {
      const response = await axios.post(`${link}/api/purchases`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Created Successfully");
      navigate("/purchase-list");
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      alert(`Unsuccessful: ${errorMessage}`);
      console.error("Error creating purchase:", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.warehouse) {
      alert("Please select a warehouse.");
      return;
    }
    if (!formData.supplier) {
      alert("Please select a supplier.");
      return;
    }
    if (!formData.purchaseDate) {
      alert("Please select a purchase date.");
      return;
    }
    if (formData.items.length === 0) {
      alert("Please add at least one item.");
      return;
    }
    if (formData.grandTotal <= 0) {
      alert("Grand total must be greater than zero.");
      return;
    }
    if (formData.payments[0].amount > 0 && !formData.payments[0].paymentType) {
      alert("Please select a payment type.");
      return;
    }
    if (id) postData();
    else sendData();
  };


  useEffect(() => {
    return () => {
      const reader = codeReaderRef.current;
      if (!reader) return;
      if (typeof reader.stopStreams === "function") {
        reader.stopStreams();
      } else if (typeof reader.reset === "function") {
        reader.reset();
      }
    };
  }, []);

const addItem = (it) => {
  if (!it || !it.parentId) {
    console.error("Invalid item, missing parentId:", it);
    return;
  }

  const parentId = it.parentId;
  const variantId = it.variantId || null;

  const existingIndex = formData.items.findIndex(
    (item) => item.item === parentId && item.variant === variantId
  );

  const getDiscountAmount = (item) => {
    if (!item.discount) return 0;
    return item.discountType?.toLowerCase() === "percentage"
      ? ((item.discount || 0) * (item.mrp || 0)) / 100
      : item.discount || 0;
  };

  if (existingIndex !== -1) {
    // Item already exists: increase quantity

    
    setFormData((prev) => {
      const updatedItems = [...prev.items];
      const existing = updatedItems[existingIndex];

      const newQuantity = existing.quantity + 1;
      if(newQuantity > (existing.currentStock || 0)) {
        return prev; // Don't allow quantity to exceed opening stock
      }
      const discountAmount = getDiscountAmount(existing);
      const totalAmount = newQuantity * (existing.mrp || 0) - discountAmount;

      updatedItems[existingIndex] = {
        ...existing,
        quantity: newQuantity,
        totalAmount,
      };
          playSound("/sounds/item-exists.mp3");
      return { ...prev, items: updatedItems };
    });
  } else {
     playSound("/sounds/item-added.mp3");
    // Item does not exist: add new
    const discountAmount = getDiscountAmount(it);
    const totalAmount = (it.mrp || 0) - discountAmount;

    const newItem = {
      purchasePrice:it.purchasePrice ||0,
       item: it.parentId,
      variant: it.variantId || null,
      itemName: it.itemName,
      itemCode: it.itemCode || "",
      openingStock: it.openingStock || 0,
      currentStock: it.currentStock != null ? it.currentStock : (it.openingStock || 0),
      salesPrice: it.salesPrice || 0,
      quantity: it.quantity || 1,
      discount: it.discount || 0,
      tax: it.tax?._id || null,
      taxRate: it.tax?.taxPercentage || 0,
      unit: it.unit || null,
      mrp: it.mrp || 0,
      expiryDate: it.expiryDate || null,
    //   subtotal: quantityToAdd * (it.salesPrice || 0) - (it.discount || 0),
      totalAmount,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));

    // Also push to options.items for reference (optional)
    setOptions((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          ...it,
          parentId,
          variantId,
          itemName: it.itemName,
        },
      ],
    }));
  }

  // Clear result or search input
  setResult("");
};

const addItemsInBatch = (matchedItems) => {
  setFormData((prev) => {
    const updatedItems = [...(prev.items || [])];

    const getDiscountAmount = (item) => {
      if (!item.discount) return 0;
      return item.discountType?.toLowerCase() === "percentage"
        ? ((item.discount || 0) * (item.mrp || 0)) / 100
        : item.discount || 0;
    };

    matchedItems.forEach((it) => {
      if (!it || !it.parentId) {
        console.error("Invalid item, missing parentId:", it);
        return;
      }

      const parentId = it.parentId;
      const variantId = it.variantId || null;

      const existingIndex = updatedItems.findIndex(
        (item) => item.item === parentId && item.variant === variantId
      );

      if (existingIndex !== -1) {
        const existing = updatedItems[existingIndex];
        const newQuantity = existing.quantity + 1;

        if (newQuantity > (existing.currentStock || 0)) {
          return; // skip if exceeding stock
        }

        const discountAmount = getDiscountAmount(existing);
        const totalAmount = newQuantity * (existing.mrp || 0) - discountAmount;

        updatedItems[existingIndex] = {
          ...existing,
          quantity: newQuantity,
          totalAmount,
        };

        playSound("/sounds/item-exists.mp3");
      } else {
        const discountAmount = getDiscountAmount(it);
        const totalAmount = (it.mrp || 0) - discountAmount;

        const newItem = {
          purchasePrice: it.purchasePrice || 0,
          item: parentId,
          variant: variantId,
          itemName: it.itemName,
          itemCode: it.itemCode || "",
          openingStock: it.openingStock || 0,
          currentStock:
            it.currentStock != null
              ? it.currentStock
              : it.openingStock || 0,
          salesPrice: it.salesPrice || 0,
          quantity: it.quantity || 1,
          discount: it.discount || 0,
          tax: it.tax?._id || null,
          taxRate: it.tax?.taxPercentage || 0,
          unit: it.unit || null,
          mrp: it.mrp || 0,
          expiryDate: it.expiryDate || null,
          totalAmount,
        };

        updatedItems.push(newItem);
        playSound("/sounds/item-added.mp3");
      }
    });

    return {
      ...prev,
      items: updatedItems,
    };
  });

  // Optional: update options too
  setOptions((prev) => ({
    ...prev,
    items: [
      ...(prev.items || []),
      ...matchedItems.map((it) => ({
        ...it,
        parentId: it.parentId,
        variantId: it.variantId || null,
        itemName: it.itemName,
      })),
    ],
  }));

  setResult("");
};



  // Handle manual item addition
  const handleAddItem = () => {
    const it = filteredItems[0];
    if (it) addItem(it);
  };

  // Handle select changes
  const handleSelectChange = (selectedOption, name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: selectedOption ? selectedOption : null,
    }));
  };

  // Handle payment select changes
  const handlePaymentSelect = (name) => (selectedOption) => {
    
    setFormData((prev) => ({
      ...prev,
      payments: [{
        ...prev.payments[0],
        [name]: selectedOption ? selectedOption : null,
      }],
    }));
  };
  useEffect(()=>{console.log("formData",formData)},[formData])

  // Derive cash accounts and terminals
  const selectedWarehouse = options.warehouse.find(w => w.value === formData.warehouse);
  const cashAccounts = selectedWarehouse && selectedWarehouse.cashAccount
    ? options.accounts.filter(a => a.value === selectedWarehouse.cashAccount)
    : [];
  const paymentMode = options.paymentType.find(pt => pt.value === formData.payments[0]?.paymentType)?.name;
  const isCash = paymentMode === "cash";
  const isBank = paymentMode === "bank";

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex">
        <div className="w-auto">
          <Sidebar isSidebarOpen={isSidebarOpen} />
        </div>
        <div className="flex flex-col w-full min-h-screen p-2 overflow-x-auto md:p-2">
         


          <form onSubmit={handleSubmit}>

          {
            activeTab==="p1" && <Purchase1 options={options} sWarehouse={sWarehouse} setSWarehouse={setSWarehouse} setActiveTab={setActiveTab} handleSelectChange={handleSelectChange} formData={formData} setFormData={setFormData} setShowSupplierPop={setShowSupplierPop} />
          }
           {
            activeTab==="p2" && <Purchase2 addItemsInBatch={addItemsInBatch} updateItem={updateItem} items={formData.items} removeItem={handleRemoveItem}  selectedWarehouse={formData.warehouse} setActiveTab={setActiveTab} formData={formData} setFormData={setFormData} result={result} setResult={setResult} allItems={allItems} addItem={addItem} handleAddItem={handleAddItem}filteredItems={filteredItems}  options={options} handleItemFieldChange={handleItemFieldChange} handleRemoveItem={handleRemoveItem}
            />
          }
            {
            activeTab==="p3" && <Purchase3  options={options} setActiveTab={setActiveTab}
  formData={formData} updateItem={updateItem}
  handleItemFieldChange={handleItemFieldChange}
  setFormData={setFormData}
  handleRemoveItem={handleRemoveItem}
  handleChange={handleChange}
  setOtherCharges={setOtherCharges}
  discount={discount}
  setDiscount={setDiscount}
  setDiscountType={setDiscountType}
  discountType={discountType}
  subtotal={subtotal}
  discountMoney={discountMoney}
  grandtotal={grandtotal}
  handlePayment={handlePayment}
  handlePaymentSelect={handlePaymentSelect}
  isCash={isCash}
  cashAccounts={cashAccounts}
  isBank={isBank}
  id={id}
  navigate={navigate}
  items={formData.items}
  removeItem={handleRemoveItem}
            />
          } 
          </form>
          
        
         
          
        </div>
      </div>
      <SupplierPopup
        open={showSupplierPop}
        onClose={() => setShowSupplierPop(false)}
        onCreated={(sup) => {
          const newOpt = { label: sup.supplierName, value: sup._id };
          setOptions((opts) => ({ ...opts, suppliers: [...opts.suppliers, newOpt] }));
          setFormData((fd) => ({ ...fd, supplier: sup._id }));
        }}
      />
    </div>
  );
};

export default PurchaseM;
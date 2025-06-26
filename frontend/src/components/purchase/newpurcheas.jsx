import React, { useEffect, useState, useRef } from 'react';
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt, FaBarcode } from "react-icons/fa";
import Navbar from "../Navbar.jsx";
import Sidebar from "../Sidebar.jsx";
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Select from 'react-select';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera } from "@fortawesome/free-solid-svg-icons";
import { BrowserMultiFormatReader } from "@zxing/browser";
import LoadingScreen from '../../Loading.jsx';
import dayjs from 'dayjs';
import SupplierPopup from "./SupplierPopup";

// Generate reference number
const generateReferenceNo = (lastReferenceNo) => {
  const currentYear = new Date().getFullYear();
  if (!lastReferenceNo || typeof lastReferenceNo !== 'string') {
    return `PO/${currentYear}/01`;
  }
  const parts = lastReferenceNo.split("/");
  if (parts.length !== 3 || parts[0] !== "PO" || !/^\d{4}$/.test(parts[1]) || isNaN(parseInt(parts[2]))) {
    return `PO/${currentYear}/01`;
  }
  const lastNumber = parseInt(parts[2], 10);
  return `PO/${parts[1]}/${String(lastNumber + 1).padStart(2, "0")}`;
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

const QuotationSummary = () => {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");
  const [otherCharges, setOtherCharges] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [discountType, setDiscountType] = useState('amount');
  const [subtotal, setSubtotal] = useState(0);
  const [grandtotal, setGrandTotal] = useState(0);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [result, setResult] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [discountMoney, setDiscountMoney] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [showSupplierPop, setShowSupplierPop] = useState(false);
  const prevWarehouse = useRef(null);
  const [defaultWarehouse, setDefaultWarehouse] = useState(null);
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

  const navigate = useNavigate();
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

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
    setScanning(false);

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
          ? "https://pos.inspiredgrow.in/vps/auth/profile"
          : "https://pos.inspiredgrow.in/vps/admiaddinguser/profile";  // 🔁 change if your route differs

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
        const response = await axios.get("https://pos.inspiredgrow.in/vps/api/purchases", {
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
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  // Fetch all items
  const fetchItems = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, redirecting...");
      navigate("/");
      return;
    }
    try {
      const response = await axios.get("https://pos.inspiredgrow.in/vps/api/items", {
        headers: { Authorization: `Bearer ${token}` },
        params: { warehouse: formData.warehouse }
      });
      const rawItems = response.data.data || [];
      const flatItems = rawItems.map((it) => {
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
    } catch (error) {
      alert(error.response?.data?.message || error.message);
      setAllItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.warehouse) {
      fetchItems();
    } else {
      setAllItems([]);
    }
  }, [formData.warehouse]);

  // Fetch purchase data for editing
  const fetchPurchase = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found, redirecting...");
      navigate("/");
      return;
    }
    try {
      const response = await axios.get(`https://pos.inspiredgrow.in/vps/api/purchases/${id}`, {
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
    const response = await axios.get("https://pos.inspiredgrow.in/vps/api/warehouses", {
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
      const response = await axios.get("https://pos.inspiredgrow.in/vps/api/suppliers", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newSuppliers = response.data.data
        .filter((supplier) => supplier.supplierName)
        .map((supplier) => ({
          label: supplier.supplierName,
          value: supplier._id,
        }));
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
      const response = await axios.get("https://pos.inspiredgrow.in/vps/api/accounts", {
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
      const response = await axios.get("https://pos.inspiredgrow.in/vps/api/payment-types", {
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
      const response = await axios.get("https://pos.inspiredgrow.in/vps/api/terminals", {
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
      const itemTotal = (item.quantity || 0) * (item.mrp || 0) - (item.discount || 0);
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
        `https://pos.inspiredgrow.in/vps/api/purchases/${id}`,
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
      const response = await axios.post("https://pos.inspiredgrow.in/vps/api/purchases", formData, {
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

  // Barcode scanner
  const startScanner = async () => {
    setLoading(true);
    if (!formData.warehouse) {
      alert("Please select a warehouse to scan items.");
      setLoading(false);
      return;
    }
    setResult("");
    setScanning(true);
    const codeReader = new BrowserMultiFormatReader();
    codeReaderRef.current = codeReader;

    try {
      const videoInputDevices = await codeReader.listVideoInputDevices();
      const firstDeviceId = videoInputDevices[0]?.deviceId;
      if (!firstDeviceId) throw new Error("No camera found");

      codeReader.decodeFromVideoDevice(
        firstDeviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText();
            const hit = allItems.find(
              (i) =>
                i.warehouse?._id === formData.warehouse &&
                (i.itemCode === text || i.barcodes?.includes(text))
            );
            if (hit) addItem(hit);
            codeReader.stopStreams();
            setScanning(false);
            setLoading(false);
          } else if (err && err.name !== "NotFoundException") {
            console.error(err);
            setLoading(false);
          }
        }
      );
    } catch (e) {
      console.error("Scanner init failed:", e);
      alert("Failed to initialize scanner: " + e.message);
      setScanning(false);
      setLoading(false);
    }
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

  // Add item to purchase
  // Add item to purchase
const addItem = (targetItem) => {
  if (!targetItem) {
    console.log("No item selected");
    return;
  }

  // Check if the item already exists in formData.items
  const existingItemIndex = formData.items.findIndex(
    (item) =>
      item.item === targetItem.parentId &&
      (item.variant || null) === (targetItem.variantId || null)
  );

  if (existingItemIndex >= 0) {
    // Item exists, increment quantity
    setFormData((prev) => {
      const updatedItems = [...prev.items];
      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: (updatedItems[existingItemIndex].quantity || 1) + 1,
        totalAmount:
          ((updatedItems[existingItemIndex].quantity || 1) + 1) *
            (updatedItems[existingItemIndex].mrp || 0) -
          (updatedItems[existingItemIndex].discount || 0),
      };
      return { ...prev, items: updatedItems };
    });
  } else {
    // Item doesn't exist, add new item
    setOptions((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          ...targetItem,
          parentId: targetItem.parentId,
          variantId: targetItem.variantId,
          itemName: targetItem.itemName,
        },
      ],
    }));
    setFormData((prev) => ({
      ...prev,
      items: [
        ...(prev.items || []),
        {
          item: targetItem.parentId,
          variant: targetItem.variantId || null,
          quantity: 1,
          unitCost: targetItem.priceWithoutTax || 0,
          mrp: targetItem.mrp || 0,
          expiryDate: targetItem.expiryDate || "",
          discount:
            targetItem.discountType?.toLowerCase() === "percentage"
              ? (targetItem.discount * targetItem.mrp) / 100
              : targetItem.discount || 0,
          salesPrice: targetItem.salesPrice || 0,
          totalAmount: 1 * (targetItem.mrp || 0) - (targetItem.discount || 0),
        },
      ],
    }));
  }
  setResult("");
};

  // Handle manual item addition
  const handleAddItem = () => {
    const targetItem = filteredItems[0];
    if (targetItem) addItem(targetItem);
  };

  // Handle select changes
  const handleSelectChange = (selectedOption, name) => {
    setFormData((prev) => ({
      ...prev,
      [name]: selectedOption ? selectedOption.value : null,
    }));
  };

  // Handle payment select changes
  const handlePaymentSelect = (name) => (selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      payments: [{
        ...prev.payments[0],
        [name]: selectedOption ? selectedOption.value : null,
      }],
    }));
  };

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
          <header className="flex flex-col items-center justify-between p-4 bg-gray-100 rounded-md shadow sm:flex-row">
            <div className="flex items-baseline gap-1 text-center sm:flex-row sm:text-left">
              <h1 className="text-lg font-semibold truncate sm:text-xl">Purchase</h1>
              <span className="text-xs text-gray-600 sm:text-sm">Add/Update Purchase</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center mt-2 text-xs text-gray-500 sm:justify-start sm:text-sm sm:mt-0">
              <Link to="/dashboard" className="flex items-center text-gray-700 no-underline hover:text-cyan-600">
                <FaTachometerAlt className="mr-2 text-gray-500 hover:text-cyan-600" /> Home
              </Link>
              <BiChevronRight className="mx-1 sm:mx-2" />
              <Link to="/purchase-list" className="text-gray-700 no-underline hover:text-cyan-600">Purchase List</Link>
              <BiChevronRight className="mx-1 sm:mx-2" />
              <Link to="/purchase-new" className="text-gray-700 no-underline hover:text-cyan-600">New Purchase</Link>
            </nav>
          </header>
          
          <form onSubmit={handleSubmit}>
            <div className='p-2 mt-2 border-t-4 rounded-lg border-cyan-500'>
              <div className="flex flex-col mb-2 sm:flex-row">
                <label className="block mt-2 mb-1 text-sm font-medium">Warehouse <span className='text-red-500'>*</span></label>
                <div className="flex items-center w-full mt-2 border rounded sm:mt-0 sm:ml-4 sm:w-64">
                  <Select
                    className='w-full'
                    options={options.warehouse}
                    onChange={(selectedOption) => handleSelectChange(selectedOption, "warehouse")}
                    value={options.warehouse.find(opt => opt.value === formData.warehouse) || null}
                    placeholder="Select Warehouse"
                  />
                </div>
              </div>
              <div className="flex flex-col mb-4 sm:flex-row">
                <label className="block mt-2 mb-1 text-sm font-medium">Supplier Name <span className='text-red-500'>*</span></label>
                <div className="flex items-center w-full mt-2 border rounded sm:mt-0 sm:ml-4 sm:w-64">
                  <Select
                    className="w-full"
                    options={options.suppliers}
                    onChange={(o) => handleSelectChange(o, "supplier")}
                    value={options.suppliers.find(opt => opt.value === formData.supplier) || null}
                    placeholder="Select Supplier"
                  />
                  <span
                    onClick={() => setShowSupplierPop(true)}
                    title="Add new supplier"
                    className="px-3 py-[6px] text-lg font-bold text-blue-600 border-l cursor-pointer hover:bg-gray-100"
                  >
                    +
                  </span>
                </div>
              </div>
              <div className="flex flex-col mb-2 sm:flex-row">
                <label className="block mt-2 mb-1 text-sm font-medium">Reference No.</label>
                <input
                  type="text"
                  name="referenceNo"
                  value={formData.referenceNo}
                  readOnly
                  className="w-full px-3 py-2 mt-2 bg-gray-100 border rounded sm:w-64 sm:mt-0 sm:ml-7"
                  placeholder="Auto-generated"
                />
              </div>
              <div className="flex flex-col mb-2 sm:flex-row">
                <label className="block mt-2 mb-1 text-sm font-medium">Purchase Date</label>
                <input
                  type="date"
                  name="purchaseDate"
                  onChange={handleChange}
                  className="w-full px-3 py-2 mt-2 border rounded sm:w-64 sm:mt-0 sm:ml-6"
                  required
                  value={formData.purchaseDate ? dayjs(formData.purchaseDate).format("YYYY-MM-DD") : ""}
                />
              </div>
            </div>
            
            <div className="relative flex justify-center p-2 border-t-2 border-gray-500 rounded-lg">
              <FaBarcode className="w-12 h-10 mt-2 mr-2 text-gray-500 hover:text-cyan-600" />
              <input
                type="text"
                name="items"
                value={result}
                onChange={e => {
  const val = e.target.value;
  setResult(val);

  // if it’s an exact barcode match for this warehouse, auto-add:
  const hit = allItems.find(i =>
    i.warehouse?._id === formData.warehouse &&
    i.barcodes?.includes(val)
  );
  if (hit) {
    addItem(hit);
    setResult("");
  }
}}

                onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                placeholder="Item name/Barcode/Item code"
                className="w-full h-10 p-2 mt-2 border sm:w-96"
                disabled={!formData.warehouse}
              />
              <button
                type="button"
                onClick={handleAddItem}
                disabled={!result || !formData.warehouse}
                className={`ml-2 px-4 py-2 text-white ${result && formData.warehouse ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
              >
                Add
              </button>
              <button
                type="button"
                onClick={startScanner}
                disabled={!formData.warehouse}
                className={`ml-2 p-2 rounded-full ${formData.warehouse ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-400 text-gray-600 cursor-not-allowed'}`}
              >
                <FontAwesomeIcon icon={faCamera} className="w-5 h-5" />
              </button>
              {!formData.warehouse && (
                <p className="mt-2 text-sm text-red-500">Please select a warehouse to add items.</p>
              )}
              {scanning && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-70">
                  <div className="overflow-hidden border-4 border-white rounded-lg w-72 h-72">
                    <video
                      ref={videoRef}
                      className="object-cover w-full h-full"
                      autoPlay
                      muted
                      playsInline
                    />
                  </div>
                  <button
                    onClick={() => {
                      const reader = codeReaderRef.current;
                      if (reader?.stopStreams) reader.stopStreams();
                      setScanning(false);
                    }}
                    className="px-4 py-2 mt-6 text-white bg-red-600 rounded hover:bg-red-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
              {result && filteredItems.length > 0 && (
                <div className="absolute z-50 w-full overflow-y-auto bg-white border rounded-lg shadow-lg top-20 sm:w-96 max-h-60">
                  <ul>
                    {filteredItems.map((list) => (
                      <li
                        key={list._id}
                        onClick={() => addItem(list)}
                        className="p-2 cursor-pointer hover:bg-gray-100"
                      >
                        <strong>{list.itemCode}</strong> - {list.itemName}
                        {list.barcodes?.length > 0 && (
                          <span className="text-gray-500"> ({list.barcodes[0]})</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {result && filteredItems.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">No items found for the selected warehouse.</p>
              )}
            </div>
            <div className="mt-4 overflow-x-auto border-b-2 border-gray-500 rounded-lg max-h-96">
  <table className="w-full min-w-[1200px] border border-gray-300 text-sm">
    <thead>
      <tr className="text-center text-white bg-sky-600">
        <th className="p-3 text-base font-semibold border">Item Name</th>
        <th className="p-3 text-base font-semibold border">Quantity</th>
        <th className="p-3 text-base font-semibold border">MRP</th>
        <th className="p-3 text-base font-semibold border">Expiry Date</th>
        <th className="p-3 text-base font-semibold border">Price</th>
        <th className="p-3 text-base font-semibold border">Discount (₹)</th>
        <th className="p-3 text-base font-semibold border">Sales Price</th>
        <th className="p-3 text-base font-semibold border">Total Amount</th>
        <th className="p-3 text-base font-semibold border">Action</th>
      </tr>
    </thead>
    <tbody>
      {options.items.length === 0 ? (
        <tr>
          <td colSpan="9" className="p-4 text-base text-center border">No items added</td>
        </tr>
      ) : (
        options.items.map((item, index) => (
          <tr key={index} className="text-center">
            <td className="p-3 text-base border">{item.itemName || 'N/A'}</td>
            <td className="p-3 border">
              <div className="flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleItemFieldChange(index, 'quantity', null, formData, setFormData, 'decrement')}
                  className="w-8 h-8 text-lg bg-gray-200 rounded hover:bg-gray-300"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  value={formData.items[index]?.quantity || 1}
                  onChange={(e) => handleItemFieldChange(index, 'quantity', e.target.value, formData, setFormData)}
                  className="w-24 px-2 py-1 text-base text-center border rounded"
                  style={{ MozAppearance: 'textfield' }}
                />
                <button
                  type="button"
                  onClick={() => handleItemFieldChange(index, 'quantity', null, formData, setFormData, 'increment')}
                  className="w-8 h-8 text-lg bg-gray-200 rounded hover:bg-gray-300"
                >
                  +
                </button>
              </div>
            </td>
            <td className="p-3 border">
              <input
                type="number"
                min="0"
                value={formData.items[index]?.mrp || 0}
                onChange={(e) => handleItemFieldChange(index, 'mrp', e.target.value, formData, setFormData)}
                className="w-24 px-2 py-1 text-base text-center border rounded"
              />
            </td>
            <td className="p-3 border">
              <input
                type="date"
                value={formData.items[index]?.expiryDate ? dayjs(formData.items[index].expiryDate).format('YYYY-MM-DD') : ''}
                onChange={(e) => handleItemFieldChange(index, 'expiryDate', e.target.value, formData, setFormData)}
                className="w-32 px-2 py-1 text-base border rounded"
              />
            </td>
            <td className="p-3 border">
              <input
                type="number"
                min="0"
                value={formData.items[index]?.unitCost || 0}
                onChange={(e) => handleItemFieldChange(index, 'unitCost', e.target.value, formData, setFormData)}
                className="w-24 px-2 py-1 text-base text-center border rounded"
              />
            </td>
            <td className="p-3 border">
              <input
                type="number"
                min="0"
                value={formData.items[index]?.discount || 0}
                onChange={(e) => handleItemFieldChange(index, 'discount', e.target.value, formData, setFormData)}
                className="w-24 px-2 py-1 text-base text-center border rounded"
              />
            </td>
            <td className="p-3 border">
              <input
                type="number"
                min="0"
                value={formData.items[index]?.salesPrice || 0}
                onChange={(e) => handleItemFieldChange(index, 'salesPrice', e.target.value, formData, setFormData)}
                className="w-24 px-2 py-1 text-center border rounded"
              />
            </td>
            <td className="p-3 text-base border">
              {(formData.items[index]?.quantity || 1) * (formData.items[index]?.mrp || 0) - (formData.items[index]?.discount || 0)}
            </td>
            <td className="p-3 border">
              <button
                className="font-medium text-blue-600 hover:text-blue-800"
                onClick={() => handleRemoveItem(index)}
                type="button"
              >
                Remove
              </button>
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>
            <div className='flex flex-col sm:flex-row'>
              <div className='mb-2'>
                <div className="flex gap-5 mt-5 mb-4">
                  <label className="block text-sm font-medium">Total Quantities</label>
                  <p className="text-green-600">{formData.items.reduce((acc, item) => acc + (item.quantity || 0), 0)}</p>
                </div>
                <div className="flex gap-5 mb-4">
                  <label className="block text-sm font-medium">Other Charges</label>
                  <input
                    type="number"
                    min='0'
                    name="otherCharges"
                    value={formData.otherCharges}
                    onChange={(e) => { handleChange(e); setOtherCharges(e.target.value); }}
                    className="w-full px-3 py-2 ml-2 border rounded sm:w-64"
                    placeholder="Enter other charges"
                  />
                </div>
                <div className="flex gap-5 mb-4">
                  <label className="block text-sm font-medium">Discount on All</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min='0'
                      name="discountOnAll"
                      value={discount}
                      onChange={(e) => { handleChange(e); setDiscount(e.target.value); }}
                      className="w-full px-2 py-2 border rounded sm:w-32"
                      placeholder="Enter discount"
                    />
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      className="w-32 px-2 border rounded"
                    >
                      <option value="percent">Per%</option>
                      <option value="amount">Amount</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-20 mt-2 mb-2">
                  <label className="block text-sm font-medium">Note</label>
                  <textarea
                    value={formData.note}
                    name="note"
                    onChange={handleChange}
                    className="w-full h-16 px-3 py-2 border rounded sm:w-64 ml-9"
                    rows="3"
                    placeholder="Add a note"
                  />
                </div>
              </div>
              <div className="pt-4 mt-4 ml-0 border-t sm:ml-40 sm:w-1/2">
                <div className="flex gap-16 font-bold">
                  <span>Subtotal</span>
                  <span>₹ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex gap-4 font-bold">
                  <span>Other Charges</span>
                  <span>₹ {parseFloat(formData.otherCharges || 0).toFixed(2)}</span>
                </div>
                <div className="flex gap-3 font-bold">
                  <span>Discount on All</span>
                  <span>₹ {parseFloat(discountMoney || 0).toFixed(2)}</span>
                </div>
                <div className="flex gap-5 font-bold">
                  <span>Grand Total</span>
                  <span>₹ {grandtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h2 className="mb-4 text-base font-semibold text-cyan-500">Previous Payments Information :</h2>
              <div className="mb-6 overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-300">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-2 py-2 border">#</th>
                      <th className="px-2 py-2 border">Date</th>
                      <th className="px-2 py-2 border">Payment Type</th>
                      <th className="px-2 py-2 border">Payment Note</th>
                      <th className="px-2 py-2 border">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 text-center border" colSpan="5">Payments Pending!!</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <h2 className="mb-4 text-base font-semibold text-cyan-500">Make Payment :</h2>
              <div className="p-2 mb-6 bg-white rounded shadow-md">
                <div className="flex items-center gap-4 mb-2">
                  <label className="block w-1/4 text-sm font-medium text-right">Amount</label>
                  <input
                    type="number"
                    min='0'
                    value={formData.payments[0]?.amount}
                    name="amount"
                    onChange={handlePayment}
                    className="w-1/2 px-3 py-2 border rounded"
                    placeholder="Enter Amount"
                  />
                </div>
                <div className="flex items-center gap-4 mb-2">
                  <label className="block w-1/4 text-sm font-medium text-right">Payment Type</label>
                  <Select
                    options={options.paymentType}
                    className='w-1/2'
                    onChange={(o) => {
                      handlePaymentSelect("paymentType")(o);
                      setFormData((prev) => ({
                        ...prev,
                        payments: [{
                          ...prev.payments[0],
                          account: null,
                          terminal: null,
                        }],
                      }));
                    }}
                    value={options.paymentType.find(opt => opt.value === (formData.payments[0]?.paymentType?._id || formData.payments[0]?.paymentType)) || null}
                    placeholder="Select Payment Type"
                  />
                </div>
                {isCash && (
                  <div className="flex items-center gap-4 mb-2">
                    <label className="block w-1/4 text-sm font-medium text-right">Account</label>
                    <Select
                      options={cashAccounts}
                      className='w-1/2'
                      onChange={handlePaymentSelect("account")}
                      value={cashAccounts.find(opt => opt.value === formData.payments[0]?.account) || null}
                      placeholder="Select Account"
                    />
                  </div>
                )}
                {isBank && (
                  <div className="flex items-center gap-4 mb-2">
                    <label className="block w-1/4 text-sm font-medium text-right">Terminal</label>
                    <Select
                      options={options.terminals.filter(t => t.warehouse === formData.warehouse)}
                      className='w-1/2'
                      onChange={handlePaymentSelect("terminal")}
                      value={options.terminals.find(opt => opt.value === formData.payments[0]?.terminal) || null}
                      placeholder="Select Terminal"
                    />
                  </div>
                )}
                <div className="flex items-center gap-4 mb-2">
                  <label className="block w-1/4 text-sm font-medium text-right">Payment Note</label>
                  <textarea
                    name="paymentNote"
                    value={formData.payments[0]?.paymentNote}
                    onChange={handlePayment}
                    className="w-1/2 px-3 py-2 border rounded h-14"
                    rows="3"
                    placeholder="Add a payment note"
                  />
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                <button
                  className="px-12 py-2 text-white transition duration-200 bg-green-600 hover:bg-green-700"
                  type='submit'
                >
                  {id ? "Update" : "Save"}
                </button>
                <button
                  className="px-12 py-2 text-white transition duration-200 bg-orange-500 hover:bg-orange-600"
                  type='reset'
                  onClick={() => navigate("/purchase-list")}
                >
                  Close
                </button>
              </div>
            </div>
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

export default QuotationSummary;
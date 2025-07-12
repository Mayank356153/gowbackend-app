/* ──────────────────────────────────────────────────────────────
   AddItem.jsx  –  FULL FILE
   Last updated: 2025-05-01
   Works with Scanner for Single items & Tax selects for Variant items
   ────────────────────────────────────────────────────────────── */
   import React, { useEffect, useState } from "react";
   import Input from "../contact/Input";
   import Button from "../contact/Button";
   import Select from "react-select";
   import Scanner from "./Scanner";
   import Navbar from "../Navbar";
   import { FaTachometerAlt, FaSearch, FaTrash } from "react-icons/fa";
   import Sidebar from "../Sidebar";
   import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
   import Pop from "./Pop";
   import axios from "axios";
   import LoadingScreen from "../../Loading";
   
   export default function AddItem() {
     const link="https://pos.inspiredgrow.in/vps"
    const [selectedFiles, setSelectedFiles] = useState([]);
     /* ───────── Router */
     const [searchParams] = useSearchParams();
     const id = searchParams.get("id");
     const Navigate = useNavigate();
   
     /* ───────── UI flags */
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState(null);
     const [isSidebarOpen, setSidebarOpen] = useState(true);
   
     /* ───────── Pop-up create dialogs */
     const [add, setAdd]   = useState(false);
     const [name, setName] = useState("");
   
     /* ───────── Variant helper state */
     const [searchVariant, setSearchVariant] = useState("");
     const [allvariants,   setAllVariants]   = useState([]);
   
     /* ───────── Main form state */
     const [formData, setFormData] = useState({
       alertQuantity:   0,
       barcodes:        [],
       brand:           null,
       category:        null,
       subSubCategory:  null,
       description:     "",
       discount:        0,
       discountType:    "Percentage",
       discountPolicy:  "None",
       requiredQuantity:0,
       freeQuantity:    0,
       expiryDate:      "",
       itemCode:        "",
       itemGroup:       null,
       itemName:        "",
       openingStock:    0,
       subCategory:     null,
       tax:             null,
       taxType:         null,
       unit:            null,
       warehouse:       null,
       variants:        [],
       /* single-only fields */
       sku:             "",
       hsn:             "",
       priceWithoutTax: 0,
       purchasePrice:   0,
       salesPrice:      0,
       mrp:             0,
       profitMargin:    0,
       sellerPoints:    0,
       isOnline:        true, 
     });
   
     /* ───────── Select options */
     const [options, setOptions] = useState({
       brand:          [],
       category:       [],
       subCategory:    [],
       subsubCategory: [],
       itemGroup: [
         { label: "Single",   value: "Single"  },
         { label: "Variants", value: "Variant" },
       ],
       unit:           [],
       discounttype: [
         { label: "Percentage(%)", value: "Percentage" },
         { label: "Fixed",         value: "Fixed"      },
       ],
       discountPolicy: [
         { label: "None",        value: "None"      },
         { label: "Buy X Get Y", value: "BuyXGetY"  },
       ],
       tax:            [],
       taxType: [
         { label: "Inclusive", value: "inclusive" },
         { label: "Exclusive", value: "exclusive" },
       ],
       warehouse:      [],
       variants:       [],
     });
   
     /* ───────────────────────────────────────── helpers */
   
     const generateItemCode = (lastItemCode) => {
       const m = /(\D+)(\d+)/.exec(lastItemCode || "");
       if (!m) return "ITEM000001";
       const prefix = m[1];
       const next   = String(parseInt(m[2], 10) + 1).padStart(m[2].length, "0");
       return prefix + next;
     };
     const fetchLastItemCode = async () => {
      try {
        const { data } = await axios.get(
          `${link}/api/items`,
          auth()
        );
    
        // walk backwards until we find something like ITEM123456
        const last = [...data.data]
          .reverse()
          .find((it) => /^ITEM\d+$/.test(it.itemCode));
    
        const lastCode = last ? last.itemCode : "ITEM000000";
    
        setFormData((p) => ({ ...p, itemCode: generateItemCode(lastCode) }));
      } catch (err) {
        console.error("Unable to fetch last item-code:", err.message);
        setFormData((p) => ({ ...p, itemCode: "ITEM000001" }));
      }
    }
   
     /* unified change handler for simple inputs */
    const handleChange = (e) => {
  const { name, value, type } = e.target;
  const num = type === "number" ? Number(value) : value;

  // Validate salesPrice <= purchasePrice
  if (name === "salesPrice" && num > formData.purchasePrice) {
    alert(`❗ Sales Price (${num}) cannot exceed Purchase Price (${formData.purchasePrice})`);
    return;
  }

  // Validate price fields <= MRP
  if (
    ["priceWithoutTax", "purchasePrice", "salesPrice"].includes(name) &&
    num > formData.mrp
  ) {
    alert(`❗ ${name} (${num}) cannot exceed the MRP (${formData.mrp})`);
    return;
  }

  setFormData((prev) => ({ ...prev, [name]: num }));
};
     const handleSelectChange = (field) => (opt) =>
       setFormData((p) => ({ ...p, [field]: opt ? opt.value : null }));
   
     const handleFilesChange = (e) => {
      const newFiles = Array.from(e.target.files);
      // Validate file size (1 MB limit) and total number of files (max 5)
      const totalFiles = selectedFiles.length + newFiles.length;
      if (totalFiles > 5) {
        alert("You can only upload up to 5 images.");
        return;
      }
      for (const file of newFiles) {
        if (file.size > 1 * 1024 * 1024) {
          alert(`File ${file.name} exceeds the 1 MB size limit.`);
          return;
        }
      }
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    };
   
     /* ─── price helpers (Single) */
   const handlePrice = (e) => {
  const { name, value } = e.target;
  const num = Number(value);
  const mrp = formData.mrp;
  const purchasePrice = formData.purchasePrice;

  // Validate against MRP
  if (name === "priceWithoutTax" && num > mrp) {
    alert(`❗ Price (${num}) cannot exceed the MRP (${mrp})`);
    return;
  }
  if (name === "purchasePrice" && num > mrp) {
    alert(`❗ Purchase Price (${num}) cannot exceed the MRP (${mrp})`);
    return;
  }
  if (name === "salesPrice" && num > mrp) {
    alert(`❗ Sales Price (${num}) cannot exceed the MRP (${mrp})`);
    return;
  }

  // Handle price changes
  if (name === "priceWithoutTax") {
    const newSales = Math.round(num + (num * formData.profitMargin) / 100);
    if (newSales > num) {
      alert(`❗ Calculated Sales Price (${newSales}) cannot exceed Purchase Price (${num})`);
      return;
    }
    if (newSales > mrp) {
      alert(`❗ Calculated Sales Price (${newSales}) exceeds the MRP (${mrp}). Lower your cost or margin.`);
      return;
    }
    setFormData((p) => ({
      ...p,
      priceWithoutTax: num,
      purchasePrice: num,
      salesPrice: newSales,
    }));
  } else if (name === "profitMargin") {
    const cost = formData.priceWithoutTax;
    const newSales = Math.round(cost + (cost * num) / 100);
    if (newSales > purchasePrice) {
      alert(`❗ Calculated Sales Price (${newSales}) cannot exceed Purchase Price (${purchasePrice})`);
      return;
    }
    if (newSales > mrp) {
      alert(`❗ Calculated Sales Price (${newSales}) exceeds the MRP (${mrp}). Lower your margin.`);
      return;
    }
    setFormData((p) => ({
      ...p,
      profitMargin: num,
      salesPrice: newSales,
    }));
  } else if (name === "salesPrice") {
    if (num > purchasePrice) {
      alert(`❗ Sales Price (${num}) cannot exceed Purchase Price (${purchasePrice})`);
      return;
    }
    setFormData((p) => ({
      ...p,
      salesPrice: num,
      profitMargin: purchasePrice ? Math.round(((num - purchasePrice) / purchasePrice) * 100) : 0,
    }));
  }
};


   
     /* ─── variant helpers */
     const syncVariantArrays = (updater) => {
       setAllVariants((prev) => updater(prev));
       setFormData((prev) => ({ ...prev, variants: updater(prev.variants) }));
     };
   
     const handleVariantField = (e, id) => {
       const { name, value, type } = e.target;
       const newVal = Array.isArray(value) ? value : type === "number" ? Number(value) : value;
       syncVariantArrays((arr) =>
         arr.map((v) =>
           String(v.variantId) === String(id) ? { ...v, [name]: newVal } : v
         )
       );
     };
   const handleVariantPrice = (e, id) => {
  const { name, value } = e.target;
  const num = Number(value);
  syncVariantArrays((arr) =>
    arr.map((v) => {
      if (String(v.variantId) !== String(id)) return v;
      const upd = { ...v };

      // Validate against MRP
      if (name === "price" && num > v.mrp) {
        alert(`❗ Price (${num}) cannot exceed MRP (${v.mrp})`);
        return v; // Prevent update
      }
      if (name === "purchasePrice" && num > v.mrp) {
        alert(`❗ Purchase Price (${num}) cannot exceed MRP (${v.mrp})`);
        return v; // Prevent update
      }
      if (name === "salesPrice" && num > v.mrp) {
        alert(`❗ Sales Price (${num}) cannot exceed MRP (${v.mrp})`);
        return v; // Prevent update
      }

      // Handle price changes
      if (name === "price") {
        upd.price = num;
        upd.purchasePrice = num;
        const newSales = Math.round(num + (num * v.profitMargin) / 100);
        if (newSales > num) {
          alert(`❗ Calculated Sales Price (${newSales}) cannot exceed Purchase Price (${num})`);
          return v; // Prevent update
        }
        if (newSales > v.mrp) {
          alert(`❗ Calculated Sales Price (${newSales}) cannot exceed MRP (${v.mrp})`);
          return v; // Prevent update
        }
        upd.salesPrice = newSales;
      } else if (name === "profitMargin") {
        upd.profitMargin = num;
        const newSales = Math.round(v.price + (v.price * num) / 100);
        if (newSales > v.purchasePrice) {
          alert(`❗ Calculated Sales Price (${newSales}) cannot exceed Purchase Price (${v.purchasePrice})`);
          return v; // Prevent update
        }
        if (newSales > v.mrp) {
          alert(`❗ Calculated Sales Price (${newSales}) cannot exceed MRP (${v.mrp})`);
          return v; // Prevent update
        }
        upd.salesPrice = newSales;
      } else if (name === "salesPrice") {
        if (num > v.purchasePrice) {
          alert(`❗ Sales Price (${num}) cannot exceed Purchase Price (${v.purchasePrice})`);
          return v; // Prevent update
        }
        upd.salesPrice = num;
        upd.profitMargin = v.price ? Math.round(((num - v.price) / v.price) * 100) : 0;
      } else if (name === "purchasePrice") {
        upd.purchasePrice = num;
        // Ensure salesPrice doesn't exceed new purchasePrice
        if (upd.salesPrice > num) {
          alert(`❗ Sales Price (${upd.salesPrice}) cannot exceed new Purchase Price (${num})`);
          upd.salesPrice = num;
          upd.profitMargin = v.price ? Math.round(((num - v.price) / v.price) * 100) : 0;
        }
      }
      return upd;
    })
  );
};
     /* add/remove variants */
     const addvariant = () => {
       if (!searchVariant) return;
       const found = options.variants.find(
         (v) => v.variantName.toLowerCase() === searchVariant.toLowerCase()
       );
       if (!found) return;
       const newVar = {
         variantId:       found._id,
         variantName:     found.variantName,
         sku:             "",
         hsn:             "",
         barcodes:        [],
         price:           0,
         purchasePrice:   0,
         salesPrice:      0,
         mrp:             0,
         profitMargin:    0,
         openingStock:    0,
         discountPolicy:  "None",
         requiredQuantity:0,
         freeQuantity:    0,
       };
       setAllVariants((p) => [...p, newVar]);
       setFormData((p) => ({ ...p, variants: [...p.variants, newVar] }));
       setSearchVariant("");
     };
   
     const removeVariant = (id) => {
       syncVariantArrays((arr) => arr.filter((v) => String(v.variantId) !== String(id)));
     };
   
     useEffect(() => {
       if (searchVariant) addvariant();
     }, [searchVariant]);
   
     /* ───────────────────────────────────────── fetch helpers */
   
     const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
   
     const fetchSimple = async (url, key, mapfn) => {
       const { data } = await axios.get(url, auth());
       setOptions((p) => ({ ...p, [key]: mapfn(data.data) }));
     };
   
     const fetchInitData = async () => {
       try {
         await Promise.all([
           fetchSimple(
              `${link}/api/brands`,
             "brand",
             (d) => d.map((x) => ({ label: x.brandName, value: x._id }))
           ),
           fetchSimple(
              `${link}/api/categories`,
             "category",
             (d) => d.map((x) => ({ label: x.name, value: x._id }))
           ),
           fetchSimple(
              `${link}/api/subcategories`,
             "subCategory",
             (d) => d.map((x) => ({ label: x.name, value: x._id }))
           ),
           fetchSimple(
              `${link}/api/sub-subcategories`,
             "subsubCategory",
             (d) => d.map((x) => ({ label: x.name, value: x._id }))
           ),
           fetchSimple(
              `${link}/api/units`,
             "unit",
             (d) => d.map((x) => ({ label: x.unitName, value: x._id }))
           ),
           fetchSimple(
              `${link}/api/taxes`,
             "tax",
             (d) => d.map((x) => ({ label: x.taxName, value: x._id }))
           ),
          fetchSimple(
       `${link}/api/warehouses`,
      "warehouse",
      (d) =>
        d
         // only keep Active warehouses
         .filter((w) => w.status === "Active")
         .map((x) => ({ label: x.warehouseName, value: x._id }))
    ),
           axios
             .get( `${link}/api/variants`, auth())
             .then(({ data }) =>
               setOptions((p) => ({ ...p, variants: data.data }))
             ),
         ]);
   
         if (id) {
           const { data } = await axios.get(
             `${link}/api/items/${id}`,
             auth()
           );
           const it = data.data;
           setFormData({
             ...it,
             barcodes: it.barcodes || [],
             variants: it.variants || [],
             taxType:  it.taxType || null,
             isOnline : it.isOnline, 
           });
           setAllVariants(it.variants || []);
          } else {
               // brand-new item → get the next code
               await fetchLastItemCode();
             }
   
         /* responsive sidebar */
         if (window.innerWidth < 768) setSidebarOpen(false);
         setLoading(false);
       } catch (err) {
         setError(err.message);
       }
     };
   
     /* ───────────────────────────────────────── submit helpers */
   
     const variantPayload = (v) => ({
       variantId:       v.variantId,
       sku:             v.sku,
       hsn:             v.hsn,
       barcodes:        v.barcodes || [],
       priceWithoutTax: Number(v.price)         || 0,
       purchasePrice:   Number(v.purchasePrice) || 0,
       salesPrice:      Number(v.salesPrice)    || 0,
       mrp:             Number(v.mrp)           || 0,
       profitMargin:    Number(v.profitMargin)  || 0,
       openingStock:    Number(v.openingStock)  || 0,
       discountPolicy:  v.discountPolicy,
       requiredQuantity:Number(v.requiredQuantity) || 0,
       freeQuantity:    Number(v.freeQuantity)     || 0,
     });
   
     const saveItem = async () => {
  const payload = { ...formData };

  // if it’s a Variant group, map through and build the raw variant objects
  if (payload.itemGroup === "Variant") {
    payload.variants = payload.variants.map(variantPayload);
  }

  const body = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined) return;

    // ← special‐case the variants array
    if (key === "variants") {
      // append the entire array as one JSON string
      body.append("variants", JSON.stringify(value));
    }
    // keep your old behavior for simple arrays (barcodes, etc.)
    else if (Array.isArray(value)) {
      value.forEach((item, idx) => {
        body.append(`${key}[${idx}]`, item);
      });
    }
    // other objects (e.g. nested settings) as JSON
    else if (typeof value === "object") {
      body.append(key, JSON.stringify(value));
    }
    // primitives
    else {
      body.append(key, value);
    }
  });

  // images still appended one-by-one
  selectedFiles.forEach(file => {
    body.append("itemImages", file);
  });

  const url = id
    ? `${link}/api/items/${id}`
    : `${link}/api/items`;
  const method = id ? "put" : "post";

  await axios[method](url, body, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "multipart/form-data"
    }
  });
};

    
   
  const handleSubmit = async (e) => {
  e.preventDefault();
  if (
    formData.discountPolicy === "BuyXGetY" &&
    (formData.requiredQuantity < 1 || formData.freeQuantity < 1)
  ) {
    return alert("Required and Free Quantity must be ≥ 1");
  }

  try {
    setLoading(true);
    await saveItem();
    alert(id ? "Item Updated" : "Item Added");

    // After either adding or updating, go back to the list:
    Navigate("/item-list");
  } catch (err) {
    alert(err.response?.data?.message || err.message);
  } finally {
    setLoading(false);
  }
};

   
     /* ───────────────────────────────────────── initial load */
     useEffect(() => { fetchInitData(); }, []);
   
     if (loading) return <LoadingScreen />;
     if (error)   return <div className="p-4 text-red-500">Error: {error}</div>;
   
     /* ───────────────────────────────────────── JSX */
     return (
       <div className="flex flex-col h-screen">
         <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen} />
         <div className="flex flex-grow">
           <Sidebar isSidebarOpen={isSidebarOpen} />
           <div className="w-full h-full px-6 py-4 overflow-y-auto bg-gray-300">
             {/* header / breadcrumbs */}
             <div className="flex flex-col justify-between mt-4 md:flex-row">
               <div className="flex flex-wrap items-end">
                 <span className="text-3xl">Items</span>
                 <span className="ml-2 text-sm text-gray-700">Add / Update</span>
               </div>
               <div className="flex flex-wrap gap-2 px-2 py-2 text-sm font-semibold bg-gray-500 bg-opacity-50 rounded-md md:bg-transparent">
                 <NavLink to="/dashboard"  className="flex items-center text-gray-700"><FaTachometerAlt className="mr-1" />Home</NavLink>
                 <NavLink to="/item-list"  className="text-gray-700">&gt; Items List</NavLink>
                 <NavLink to="/items/add"  className="text-gray-700">&gt; Items</NavLink>
               </div>
             </div>
   
             {add && (
               <Pop
                 add={add}
                 setAdd={setAdd}
                 options={options}
                 setOptions={setOptions}
                 category={name}
                 fetchTax={()   => fetchSimple("api/taxes","tax",(d)=>d.map(x=>({label:x.taxName,value:x._id})))}
                 fetchUnits={() => fetchSimple("api/units","unit",(d)=>d.map(x=>({label:x.unitName,value:x._id})))}
                 fetchBrands={() => fetchSimple("api/brands","brand",(d)=>d.map(x=>({label:x.brandName,value:x._id})))}
                 fetchVariants={() => axios.get("api/variants",auth()).then(({data})=>setOptions(p=>({...p,variants:data.data})))}
               />
             )}
   
             {/* ╔══════════════════  FORM  ══════════════════╗ */}
             <form onSubmit={handleSubmit}>
               <div className="flex flex-col gap-5 p-4 bg-white border-t-2 rounded-lg border-t-blue-600">
   
                 {/* Item Code / Name */}
                 <div className="flex flex-col gap-2 lg:flex-row">
                   <Input
                     label="Item Code*"
                     value={formData.itemCode}
                     readOnly
                     label_class="text-sm font-semibold"
                     div_class="flex flex-col lg:w-1/4"
                     className="px-4 py-2 mt-1 text-sm bg-gray-200 border-2 border-gray-300 rounded-md"
                   />
                   <Input
                     label="Item Name*"
                     name="itemName"
                     value={formData.itemName}
                     onChange={handleChange}
                     label_class="text-sm font-semibold"
                     div_class="flex flex-col lg:w-1/4"
                     className="px-4 py-2 mt-1 text-sm border-2 border-gray-300 rounded-md"
                   />
                 </div>
   
                 {/* Brand / Category / SubCategory */}
                 <div className="flex flex-col gap-2 lg:flex-row">
                   <div className="flex flex-col lg:w-1/4">
                     <label className="mb-1 text-sm font-semibold">Brand</label>
                     <div className="flex">
                       <Select
                         options={options.brand}
                         onChange={handleSelectChange("brand")}
                         value={options.brand.find(o=>o.value=== (formData.brand?._id||formData.brand))||null}
                         className="w-full"
                       />
                       <span onClick={() => {setAdd(true);setName("Brand");}}
                             className="px-2 text-lg font-bold text-blue-500 border-2 border-gray-300 rounded-sm cursor-pointer hover:bg-gray-100">+</span>
                     </div>
                   </div>
                   <div className="flex flex-col w-full lg:w-1/4">
                     <label className="mb-1 text-sm font-semibold">Category</label>
                     <Select
                       options={options.category}
                       onChange={handleSelectChange("category")}
                       value={options.category.find(o=>o.value=== (formData.category?._id||formData.category))||null}
                     />
                   </div>
                   <div className="flex flex-col w-full lg:w-1/4">
                     <label className="mb-1 text-sm font-semibold">SubCategory</label>
                     <Select
                       options={options.subCategory}
                       onChange={handleSelectChange("subCategory")}
                       value={options.subCategory.find(o=>o.value=== (formData.subCategory?._id||formData.subCategory))||null}
                     />
                   </div>
                 </div>
   
                 {/* SubSub / ItemGroup / Unit */}
                 <div className="flex flex-col gap-2 lg:flex-row">
                   <div className="flex flex-col lg:w-1/4">
                     <label className="mb-1 text-sm font-semibold">Sub SubCategory</label>
                     <Select
                       options={options.subsubCategory}
                       onChange={handleSelectChange("subSubCategory")}
                       value={options.subsubCategory.find(o=>o.value=== (formData.subSubCategory?._id||formData.subSubCategory))||null}
                     />
                   </div>
                   <div className="flex flex-col w-full lg:w-1/4">
                     <label className="text-sm font-semibold">Item Group*</label>
                     <Select
                       options={options.itemGroup}
                       onChange={handleSelectChange("itemGroup")}
                       value={options.itemGroup.find(o=>o.value=== (formData.itemGroup))||null}
                     />
                   </div>
                   <div className="flex flex-col w-full lg:w-1/4">
                     <label className="mb-1 text-sm font-semibold">Unit</label>
                     <div className="flex">
                       <Select
                         options={options.unit}
                         onChange={handleSelectChange("unit")}
                         value={options.unit.find(o=>o.value=== (formData.unit?._id||formData.unit))||null}
                         className="w-full"
                       />
                       <span onClick={() => {setAdd(true);setName("Unit");}}
                             className="px-2 text-lg font-bold text-blue-500 border-2 border-gray-300 rounded-sm cursor-pointer hover:bg-gray-100">+</span>
                     </div>
                   </div>
                 </div>
   
                 {/* ─── Single-only section (SKU/HSN/Alert) */}
                 {formData.itemGroup !== "Variant" && (
                   <div className="flex flex-col gap-2 lg:flex-row">
                     <Input
                       label="SKU"
                       name="sku"
                       value={formData.sku}
                       onChange={handleChange}
                       label_class="text-sm font-semibold"
                       div_class="flex flex-col lg:w-1/4"
                       className="px-4 py-2 mt-1 text-sm border-2 border-gray-300 rounded-md"
                     />
                     <Input
                       label="HSN"
                       name="hsn"
                       value={formData.hsn}
                       onChange={handleChange}
                       label_class="text-sm font-semibold"
                       div_class="flex flex-col lg:w-1/4"
                       className="px-4 py-2 mt-1 text-sm border-2 border-gray-300 rounded-md"
                     />
                     <Input
                       label="Alert Quantity"
                       name="alertQuantity"
                       type="number"
                       min="0"
                       value={formData.alertQuantity}
                       onChange={handleChange}
                       label_class="text-sm font-semibold"
                       div_class="flex flex-col lg:w-1/4"
                       className="px-4 py-2 mt-1 text-sm border-2 border-gray-300 rounded-md"
                     />
                   </div>
                 )}
   
                 {/* Seller Points + Scanner + Description (Single) OR Seller Points only (Variant) */}
                 <div className="flex flex-col gap-2 lg:flex-row">
                   <Input
                     label="Seller Points"
                     name="sellerPoints"
                     type="number"
                     min="0"
                     value={formData.sellerPoints}
                     onChange={handleChange}
                     label_class="text-sm font-semibold"
                     div_class="flex flex-col lg:w-1/4"
                     className="px-4 py-2 mt-1 text-sm border-2 border-gray-300 rounded-md"
                   />
   
                   {formData.itemGroup !== "Variant" && (
                     <Scanner
                       formData={formData}
                       setFormData={setFormData}
                       fieldName="barcodes"
                     />
                   )}
   
                   <div className="flex flex-col lg:w-1/4">
                     <label className="text-sm font-semibold">Description</label>
                     <textarea
                       name="description"
                       value={formData.description}
                       onChange={handleChange}
                       className="px-2 py-2 border-2 border-gray-300 rounded-md focus:border-blue-600"
                     />
                   </div>
                 </div>

                 {/* Online / Offline toggle */}
<div className="flex flex-col lg:w-1/4">
  <label className="text-sm font-semibold">Visibility</label>
  <select
    value={formData.isOnline ? "online" : "offline"}
    onChange={e =>
      setFormData(p => ({ ...p, isOnline: e.target.value === "online" }))
    }
    className="px-4 py-2 mt-1 border-2 border-gray-300 rounded-md"
  >
    <option value="online">Show in customer app</option>
    <option value="offline">Hide from customer app</option>
  </select>
</div>

   
                 {/* Images uploader */}
                 <div className="flex flex-col lg:w-1/4">
  <label className="mb-1 text-sm font-semibold">Images</label>
  <input
    type="file"
    name="itemImages"
    multiple
    accept="image/*"
    onChange={handleFilesChange}
    className="px-4 py-2 bg-white border-2 border-gray-300 rounded-md"
  />
  <span className="mt-1 text-xs text-gray-600">
    You can pick up to 5 images (max 1 MB each)
  </span>
  {selectedFiles.length > 0 && (
    <div className="mt-2">
      <p className="text-sm font-semibold">Selected Files:</p>
      <ul className="pl-5 list-disc">
        {selectedFiles.map((file, index) => (
          <li key={index} className="flex items-center text-sm">
            {file.name} ({(file.size / 1024).toFixed(2)} KB)
            <button
              type="button"
              onClick={() =>
                setSelectedFiles((prev) =>
                  prev.filter((_, i) => i !== index)
                )
              }
              className="ml-2 text-red-500 hover:text-red-700"
            >
              <FaTrash />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )}
</div>
   
                 {/* Discount section */}
                 <div className="flex flex-col gap-2 py-5 border-t-2 border-b-2 border-gray-200 lg:flex-row">
                   <div className="flex flex-col lg:w-1/4">
                     <label className="text-sm font-semibold">Discount Type</label>
                     <Select
                       options={options.discounttype}
                       onChange={handleSelectChange("discountType")}
                       value={options.discounttype.find(o=>o.value===formData.discountType)||null}
                     />
                   </div>
                   <Input
                     label="Discount"
                     name="discount"
                     type="number"
                     min="0"
                     value={formData.discount}
                     onChange={handleChange}
                     label_class="text-sm font-semibold"
                     div_class="flex flex-col lg:w-1/4"
                     className="px-4 py-2 mt-1 text-sm border-2 border-gray-300 rounded-md"
                   />
                   <div className="flex flex-col lg:w-1/4">
                     <label className="text-sm font-semibold">Discount Policy</label>
                     <Select
                       options={options.discountPolicy}
                       onChange={handleSelectChange("discountPolicy")}
                       value={options.discountPolicy.find(o=>o.value===formData.discountPolicy)||null}
                     />
                   </div>
                 </div>
   
                 {formData.discountPolicy === "BuyXGetY" && (
                   <div className="flex flex-col gap-2 lg:flex-row">
                     <Input
                       label="Required Quantity*"
                       name="requiredQuantity"
                       type="number"
                       min="1"
                       value={formData.requiredQuantity}
                       onChange={handleChange}
                       label_class="text-sm font-semibold"
                       div_class="flex flex-col lg:w-1/4"
                       className="px-4 py-2 mt-1 text-sm border-2 border-gray-300 rounded-md"
                     />
                     <Input
                       label="Free Quantity*"
                       name="freeQuantity"
                       type="number"
                       min="1"
                       value={formData.freeQuantity}
                       onChange={handleChange}
                       label_class="text-sm font-semibold"
                       div_class="flex flex-col lg:w-1/4"
                       className="px-4 py-2 mt-1 text-sm border-2 border-gray-300 rounded-md"
                     />
                   </div>
                 )}
   
                 {/* ─── Price & Tax (Single items) */}
                 {formData.itemGroup !== "Variant" && (
                   <>
                     <div className="flex flex-col gap-2 pt-5 border-t-2 border-gray-200 lg:flex-row">
                       <Input
                         label="Price*"
                         name="priceWithoutTax"
                         type="number"
                         min="0"
                         value={formData.priceWithoutTax}
                         onChange={(e) => {handlePrice(e); handleChange(e);}}
                         label_class="text-sm font-semibold"
                         div_class="flex flex-col lg:w-1/4"
                         className="px-4 py-2 mt-1 text-sm border-2 border-gray-300 rounded-md"
                       />
                       <div className="flex flex-col lg:w-1/4">
                         <label className="text-sm font-semibold">Tax*</label>
                         <div className="flex">
                           <Select
                             options={options.tax}
                             onChange={handleSelectChange("tax")}
                             value={options.tax.find(o=>o.value=== (formData.tax?._id||formData.tax))||null}
                             className="w-full"
                           />
                           <span onClick={()=>{setAdd(true);setName("Tax");}}
                                 className="px-2 text-lg font-bold text-blue-500 border-2 border-gray-300 rounded-sm cursor-pointer hover:bg-gray-100">+</span>
                         </div>
                       </div>
                       <Input
   label="Purchase Price*"
  name="purchasePrice"
   type="number"
   min="0"
   value={formData.purchasePrice}
   onChange={handleChange}
   label_class="text-sm font-semibold"
   div_class="flex flex-col lg:w-1/4"
   className="px-4 py-2 mt-1 text-sm border-2 border-gray-300 rounded-md"
 />
                     </div>
   
                     <div className="flex flex-col gap-2 lg:flex-row">
                       <div className="flex flex-col lg:w-1/4">
                         <label className="text-sm font-semibold">Tax Type*</label>
                         <Select
                           options={options.taxType}
                           onChange={handleSelectChange("taxType")}
                           value={options.taxType.find(o=>o.value===formData.taxType)||null}
                         />
                       </div>
                       <Input
                         label="Profit Margin(%)"
                         name="profitMargin"
                         type="number"
                         min="0"
                         value={formData.profitMargin}
                         onChange={(e)=>{handlePrice(e);handleChange(e);}}
                         label_class="text-sm font-semibold"
                         div_class="flex flex-col lg:w-1/4"
                         className="px-4 py-2 mt-1 text-sm border-2 border-gray-300 rounded-md"
                       />
                       <Input
                         label="Sales Price*"
                         name="salesPrice"
                          type="number"
                          min="0"
                         value={formData.salesPrice}
                         onChange={handleChange}
                         label_class="text-sm font-semibold"
                         div_class="flex flex-col lg:w-1/4"
                         className="px-4 py-2 mt-1 text-sm border-2 border-gray-300 rounded-md"
                       />
                     </div>
   
                     <div className="flex flex-col gap-2 lg:flex-row">
                       <Input
                         label="MRP"
                         name="mrp"
                         type="number"
                         min="0"
                         value={formData.mrp}
                         onChange={handleChange}
                         label_class="text-sm font-semibold"
                         div_class="flex flex-col lg:w-1/4"
                         className="px-4 py-2 mt-1 text-sm border-2 border-gray-300 rounded-md"
                       />
                       <Input
                         label="Expiry Date"
                         name="expiryDate"
                         type="date"
                         value={formData.expiryDate ? new Date(formData.expiryDate).toISOString().split("T")[0] : ""}
                         onChange={handleChange}
                         label_class="text-sm font-semibold"
                         div_class="flex flex-col lg:w-1/4"
                         className="px-4 py-2 mt-1 text-sm border-2 border-gray-300 rounded-md"
                       />
                     </div>
                   </>
                 )}
   
                 {/* Warehouse & Opening Stock */}
                 <div className="flex flex-col gap-2 py-5 border-t-2 border-b-2 border-gray-200 lg:flex-row">
                   <div className="flex flex-col lg:w-1/4">
                     <label className="text-sm font-semibold">Warehouse</label>
                     <Select
                       options={options.warehouse}
                       onChange={handleSelectChange("warehouse")}
                       value={options.warehouse.find(o=>o.value=== (formData.warehouse?._id||formData.warehouse))||null}
                     />
                   </div>
                   {formData.itemGroup !== "Variant" && (
                     <Input
                       label="Opening Stock"
                       name="openingStock"
                       type="number"
                       min="0"
                       value={formData.openingStock}
                       onChange={handleChange}
                       label_class="text-sm font-semibold"
                       div_class="flex flex-col lg:w-1/4"
                       className="px-4 py-2 mt-1 text-sm border-2 border-gray-300 rounded-md"
                     />
                   )}
                 </div>
   
                 {/* ─── Variant-only: Tax / Type / Expiry before table */}
                 {formData.itemGroup === "Variant" && (
                   <div className="flex flex-col gap-2 lg:flex-row">
                     <div className="flex flex-col lg:w-1/4">
                       <label className="text-sm font-semibold">Tax*</label>
                       <div className="flex">
                         <Select
                           options={options.tax}
                           onChange={handleSelectChange("tax")}
                           value={options.tax.find(o=>o.value=== (formData.tax?._id||formData.tax))||null}
                           className="w-full"
                         />
                         <span onClick={()=>{setAdd(true);setName("Tax");}}
                               className="px-2 text-lg font-bold text-blue-500 border-2 border-gray-300 rounded-sm cursor-pointer hover:bg-gray-100">+</span>
                       </div>
                     </div>
                     <div className="flex flex-col lg:w-1/4">
                       <label className="text-sm font-semibold">Tax Type*</label>
                       <Select
                         options={options.taxType}
                         onChange={handleSelectChange("taxType")}
                         value={options.taxType.find(o=>o.value===formData.taxType)||null}
                       />
                     </div>
                     <Input
                       label="Expiry Date"
                       name="expiryDate"
                       type="date"
                       value={formData.expiryDate ? new Date(formData.expiryDate).toISOString().split("T")[0] : ""}
                       onChange={handleChange}
                       label_class="text-sm font-semibold"
                       div_class="flex flex-col lg:w-1/4"
                       className="px-4 py-2 mt-1 text-sm border-2 border-gray-300 rounded-md"
                     />
                   </div>
                 )}
   
                 {/* ───────────────── Variant Table */}
                 {formData.itemGroup === "Variant" && (
                   <div className="relative w-full p-4">
                     {/* search bar */}
                     <div className="flex items-center w-full px-2 mb-4 border border-t-2 rounded-md border-t-cyan-500">
                       <FaSearch className="mr-2 text-gray-500" />
                       <input
                         type="text"
                         placeholder="Search Variant"
                         value={searchVariant}
                         onChange={(e)=>setSearchVariant(e.target.value)}
                         className="w-full p-2 focus:outline-none"
                       />
                       <span onClick={()=>{setAdd(true);setName("Variant");}}
                             className="px-2 text-lg font-bold text-blue-500 border-2 border-gray-300 rounded-sm cursor-pointer hover:bg-gray-100">+</span>
                       {searchVariant && (
                         <div className="absolute z-50 w-full overflow-y-auto bg-white border rounded-lg shadow-lg sm:w-96 max-h-60 top-12">
                           <ul>
                             {options.variants
                               .filter(v=>v.variantName.toLowerCase().includes(searchVariant.toLowerCase()))
                               .map(v=>(
                                 <li key={v._id}
                                     className="p-2 cursor-pointer hover:bg-gray-100"
                                     onClick={()=>setSearchVariant(v.variantName)}>
                                   {v.variantName}
                                 </li>
                               ))}
                           </ul>
                         </div>
                       )}
                     </div>
   
                     {/* table */}
                     <div className="overflow-x-auto">
                       <table className="min-w-full border border-collapse">
                         <thead>
                           <tr className="text-sm bg-gray-300">
                             <th className="p-2 border">Variant</th>
                             <th className="p-2 border">SKU</th>
                             <th className="p-2 border">HSN</th>
                             <th className="p-2 border">Barcodes</th>
                             <th className="p-2 border">Price</th>
                             <th className="p-2 border">Purchase</th>
                             <th className="p-2 border">Profit %</th>
                             <th className="p-2 border">Sales</th>
                             <th className="p-2 border">MRP</th>
                             <th className="p-2 border">Opening</th>
                             <th className="p-2 border">Policy</th>
                             <th className="p-2 border">Req</th>
                             <th className="p-2 border">Free</th>
                             <th className="p-2 border">Action</th>
                           </tr>
                         </thead>
                         <tbody>
                           {allvariants.map((v, idx)=>(
                             <tr key={idx} className="text-sm text-center">
                               <td className="p-2 border">
                                 {v.variantName || v.variantId?.variantName}
                               </td>
                               <td className="p-2 border">
                                 <input
                                   name="sku"
                                   value={v.sku}
                                   onChange={(e)=>handleVariantField(e,v.variantId)}
                                   className="w-full px-1 py-1 text-center border"
                                   placeholder="Optional"
                                 />
                               </td>
                               <td className="p-2 border">
                                 <input
                                   name="hsn"
                                   value={v.hsn}
                                   onChange={(e)=>handleVariantField(e,v.variantId)}
                                   className="w-full px-1 py-1 text-center border"
                                   placeholder="Optional"
                                 />
                               </td>
                               <td className="p-2 border">
                                 <Scanner
                                   formData={{ barcodes:v.barcodes||[] }}
                                   fieldName="barcodes"
                                   setFormData={(upd)=>{
                                     const newBC = typeof upd==="function" ? upd({barcodes:v.barcodes}).barcodes : upd.barcodes;
                                     syncVariantArrays(arr=>arr.map(varr=>
                                       String(varr.variantId)===String(v.variantId)
                                         ? { ...varr, barcodes:newBC }
                                         : varr));
                                   }}
                                 />
                               </td>
                               <td className="p-2 border">
                                 <input
                                   required name="price" type="number" min="0"
                                   value={v.price}
                                   onChange={(e)=>{handleVariantField(e,v.variantId); handleVariantPrice(e,v.variantId);}}
                                   className="w-full px-1 py-1 text-center border-2 border-orange-300"
                                 />
                               </td>
                               <td className="p-2 border">
                                 <input required name="purchasePrice" type="number" min="0"
                                   value={v.purchasePrice}
                                   onChange={(e)=>{handleVariantField(e,v.variantId); handleVariantPrice(e,v.variantId);}}
                                   className="w-full px-1 py-1 text-center border-2 border-orange-300"/>
                               </td>
                               <td className="p-2 border">
                                 <input required name="profitMargin" type="number" min="0"
                                   value={v.profitMargin}
                                   onChange={(e)=>{handleVariantField(e,v.variantId); handleVariantPrice(e,v.variantId);}}
                                   className="w-full px-1 py-1 text-center border-2 border-orange-300"/>
                               </td>
                               <td className="p-2 border">
                                 <input required name="salesPrice" type="number" min="0"
                                   value={v.salesPrice}
                                   onChange={(e)=>{handleVariantField(e,v.variantId); handleVariantPrice(e,v.variantId);}}
                                   className="w-full px-1 py-1 text-center border-2 border-orange-300"/>
                               </td>
                               <td className="p-2 border">
                                 <input name="mrp" type="number" min="0"
                                   value={v.mrp}
                                   onChange={(e)=>handleVariantField(e,v.variantId)}
                                   className="w-full px-1 py-1 text-center border"/>
                               </td>
                               <td className="p-2 border">
                                 <input name="openingStock" type="number" min="0"
                                   value={v.openingStock}
                                   onChange={(e)=>handleVariantField(e,v.variantId)}
                                   className="w-full px-1 py-1 text-center border"/>
                               </td>
                               <td className="p-2 border">
                                 <select
                                   name="discountPolicy"
                                   value={v.discountPolicy}
                                   onChange={(e)=>handleVariantField(e,v.variantId)}
                                   className="w-full px-1 py-1 text-center border"
                                 >
                                   <option value="None">None</option>
                                   <option value="BuyXGetY">Buy X Get Y</option>
                                 </select>
                               </td>
                               <td className="p-2 border">
                                 <input name="requiredQuantity" type="number" min="0"
                                   value={v.requiredQuantity}
                                   onChange={(e)=>handleVariantField(e,v.variantId)}
                                   disabled={v.discountPolicy!=="BuyXGetY"}
                                   className="w-full px-1 py-1 text-center border"/>
                               </td>
                               <td className="p-2 border">
                                 <input name="freeQuantity" type="number" min="0"
                                   value={v.freeQuantity}
                                   onChange={(e)=>handleVariantField(e,v.variantId)}
                                   disabled={v.discountPolicy!=="BuyXGetY"}
                                   className="w-full px-1 py-1 text-center border"/>
                               </td>
                               <td className="p-2 border">
                                 <button type="button"
                                   onClick={()=>removeVariant(v.variantId)}
                                   className="px-2 py-1 text-white bg-red-600 rounded hover:bg-red-700">
                                   <FaTrash/>
                                 </button>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   </div>
                 )}
   
                 {/* Submit / Close */}
                 <div className="flex flex-col gap-2 sm:flex-row">
                   <Button type="submit"
                     className="w-full text-white bg-green-600 rounded hover:bg-green-700"
                     text={id ? "Update" : "Save"} />
                   <Button text="Close"
                     className="w-full text-white bg-orange-500 rounded hover:bg-orange-600"
                     onClick={()=>Navigate("/item-list")}/>
                 </div>
               </div>
             </form>
             {/* ╚══════════════════  FORM  ══════════════════╝ */}
           </div>
         </div>
       </div>
     );
   }
   
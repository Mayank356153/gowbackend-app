import React, { useState, useEffect, useRef } from "react";
import Navbar   from "../Navbar.jsx";
import Sidebar  from "../Sidebar.jsx";
import { BiChevronRight } from "react-icons/bi";
import { FaTachometerAlt } from "react-icons/fa";
import axios    from "axios";
import * as XLSX from "xlsx";
import LoadingScreen from "../../Loading.jsx";
import { useNavigate } from "react-router-dom";

const BASE_URL = "https://pos.inspiredgrow.in/vps";

export default function ImportItems() {
         const link="https://pos.inspiredgrow.in/vps"
  /* ─────────────────────────────── STATE ───────────────────────────── */
  const [file, setFile]                 = useState(null);
  const [imageFiles, setImageFiles]     = useState([]);      // uploads
  const [warehouses, setWarehouses]     = useState([]);
  const [categories, setCategories]     = useState([]);
  const [subCategories, setSubCategories]   = useState([]);
  const [subSubCategories, setSubSubCategories] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState("");
  const [loading, setLoading]           = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  /* ─────────────────────────────── UTILS ───────────────────────────── */
  const token   = localStorage.getItem("token") || "";
  const headers = useRef({
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
  });
  const cache   = useRef({ units:{}, brands:{}, taxes:{} });
  const str     = (v) => String(v ?? "").trim();

  /* ──────────────────────────── LOOK-UPS ───────────────────────────── */
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);

    Promise.all([
      axios.get(`${BASE_URL}/api/warehouses`,      headers.current),
      axios.get(`${BASE_URL}/api/categories`,      headers.current),
      axios.get(`${BASE_URL}/api/subcategories`,   headers.current),
      axios.get(`${BASE_URL}/api/sub-subcategories`, headers.current),
    ])
    .then(([wRes,cRes,sRes,ssRes]) => {
      const activeWh = (wRes.data.data || wRes.data).filter(w => w.status === "Active");
      setWarehouses(activeWh);
      setCategories(cRes.data.data  || cRes.data);
      setSubCategories(sRes.data.data|| sRes.data);
      setSubSubCategories(ssRes.data.data|| ssRes.data);
    })
    .catch(err => {
      console.error("Lookup load failed:", err);
      alert("Failed to load lookup data. Refresh to retry.");
    })
    .finally(() => setInitializing(false));
  }, []);

  /* Helper that finds or creates a doc and caches the id */
  const ensureOne = async (endpoint, nameField, rawName, extra={}) => {
    if (!rawName) return undefined;
    const name = str(rawName);
    cache.current[endpoint] = cache.current[endpoint] || {};
    if (cache.current[endpoint][name]) return cache.current[endpoint][name];

    const list = await axios
      .get(`${BASE_URL}/api/${endpoint}?search=${encodeURIComponent(name)}`, headers.current)
      .then(r => r.data.data || r.data)
      .catch(() => []);

    const found = list.find(it => str(it[nameField]).toLowerCase() === name.toLowerCase());
    let id = found?._id;

    if (!id) {
      const body = { [nameField]: name };
      if (endpoint === "taxes") {
        body.taxPercentage = Number(extra.value) || 0;
        body.type          = extra.type || "percentage";
      }
      id = await axios
        .post(`${BASE_URL}/api/${endpoint}`, body, headers.current)
        .then(r => (r.data.data || r.data)?._id)
        .catch(() => null);
    }
    cache.current[endpoint][name] = id;
    return id;
  };

  /* ─────────────────────────── HANDLERS ────────────────────────────── */
  const handleFileChange       = e => setFile(e.target.files[0] || null);
  const handleImageFilesChange = e => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length + imageFiles.length > 50) {
      alert("You can upload up to 50 images in total."); return;
    }
    for (const file of newFiles) {
      if (file.size > 1*1024*1024) { alert(`File ${file.name} exceeds the 1 MB limit.`); return; }
    }
    setImageFiles(prev => [...prev, ...newFiles]);
  };
  const removeImageFile = index => setImageFiles(prev => prev.filter((_,i)=>i!==index));

  /* ─────────────────────────── MAIN IMPORT ─────────────────────────── */
  const handleImport = async () => {
    if (initializing)           return alert("Loading lookup data; please wait…");
    if (!selectedWarehouse)     return alert("Please select a warehouse.");
    if (!file)                  return alert("Please choose a CSV file.");

    setLoading(true);
    try {
      /* 1️⃣ upload image files (if any) */
     let uploadedImageMap = {};
if (imageFiles.length) {
  const formData = new FormData();
  imageFiles.forEach(f => formData.append("itemImages", f));
  const up = await axios.post(`${BASE_URL}/api/items/upload-images`, formData, {
  headers: { Authorization:`Bearer ${token}`, "Content-Type":"multipart/form-data" }
});
console.log("Server response:", up.data); // Debug the response
uploadedImageMap = up.data.uploadedImages || {};
console.log("uploadedImageMap:", uploadedImageMap); // Debug the map
  if (!up.data.success) throw new Error(up.data.message || "Image upload failed");
  
  // If the server returns a flat list, map it back to original filenames
  if (Array.isArray(up.data.uploadedImages)) {
    uploadedImageMap = {};
    imageFiles.forEach((file, index) => {
      if (up.data.uploadedImages[index]) {
        uploadedImageMap[file.name] = up.data.uploadedImages[index];
      }
    });
  } else {
    uploadedImageMap = up.data.uploadedImages || {};
  }
}

      /* 2️⃣ parse CSV */
      const buf   = await file.arrayBuffer();
      const wb    = XLSX.read(buf,{type:"array"});
      const rows  = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {defval:"", raw:false});

      const payload    = [];
      const errors     = [];
      const failedRows = [];

      for (let idx = 0; idx < rows.length; idx++) {
        try {
          const row = rows[idx];

          /* Category + sub look-ups */
          const catName = str(row["CATEGORY NAME"]);
          const cat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
          if (!cat) throw new Error(`Category "${row["CATEGORY NAME"]}" not found`);

          let subId, subSubId;
          const subName    = str(row["SUB CATEGORY NAME"]).toLowerCase();
          const subSubName = str(row["SUB SUBCATEGORY NAME"]).toLowerCase();
          if (subName) {
            const sub = subCategories.find(s=>s.name.toLowerCase()===subName);
            if (!sub) throw new Error(`SubCategory "${row["SUB CATEGORY NAME"]}" not found`);
            subId = sub._id;
          }
          if (subSubName) {
            const ssc = subSubCategories.find(s=>s.name.toLowerCase()===subSubName);
            if (!ssc) throw new Error(`SubSubCategory "${row["SUB SUB CATEGORY NAME"]}" not found`);
            subSubId = ssc._id;
          }

          /* other look-ups */
          const unitId  = await ensureOne("units",  "unitName",  row["UNIT NAME"]);
          if (!unitId)  throw new Error(`Unit "${row["UNIT NAME"]}" cannot be created/found`);
          const brandId = await ensureOne("brands", "brandName", row["BRAND NAME"]);
          const taxId   = await ensureOne("taxes",  "taxName",   row["TAX NAME"],
                             {value:row["TAX VALUE"], type:row["TAX TYPE"]});
          if (!taxId)   throw new Error(`Tax "${row["TAX NAME"]}" cannot be created/found`);

          /* discount stuff */
          const discRaw  = str(row["DISCOUNT TYPE"]).toLowerCase();
          const discType = discRaw==="flat"||discRaw==="fixed"?"Fixed":"Percentage";
          const discPol  = str(row["DISCOUNT POLICY"]) || "None";
          const reqQty   = Number(row["REQUIRED QUANTITY"]||0);
          const freeQty  = Number(row["FREE QUANTITY"]||0);
          if (discPol==="BuyXGetY" && (reqQty<1||freeQty<1))
            throw new Error("Required/Free Quantity must be ≥1 for BuyXGetY");

          /* barcodes */
          const toPlain = v =>
            /e\+/i.test(v) ? Number(v).toLocaleString("fullwide",{useGrouping:false}) : v;
          const barcodes = str(row["BARCODES"])
            .split(",").map(b=>toPlain(b.trim())).filter(Boolean);

      const imageCode   = str(row["IMAGE CODE"]);
let   mappedImages = [];

if (imageCode) {
  mappedImages = Object.entries(uploadedImageMap)
    .filter(([orig]) => {
      const nameNoExt = orig.replace(/\.[^.]+$/, '');
      // Case-insensitive substring check
      const matches = nameNoExt.toLowerCase().includes(imageCode.toLowerCase());
      // Debug the comparison
      console.log(`Checking if "${nameNoExt}" contains "${imageCode}": ${matches}`);
      return matches;
    })
    .map(([,server]) => server);

  if (!mappedImages.length) {
    console.log(`No matches found for IMAGE CODE "${imageCode}" in uploaded images:`, Object.keys(uploadedImageMap));
    throw new Error(`No uploaded images contain IMAGE CODE “${imageCode}”`);
  }
} else {
  const itemImgs = str(row["ITEM IMAGES"])
    .split(",").map(img=>str(img)).filter(Boolean);
  mappedImages = itemImgs.map(img=>{
    const server = uploadedImageMap[img];
    if (!server) throw new Error(`Image "${img}" was not uploaded`);
    return server;
  });
}
          /* expiry */
          let expiry = row["EXPIRY DATE"];
          if (typeof expiry === "number") {
            const msPerDay = 24*60*60*1000;
            expiry = new Date((expiry-25569)*msPerDay).toISOString();
          } else {
            expiry = expiry? new Date(expiry).toISOString() : null;
          }

          /* mandatory checks */
          if (!str(row["ITEM NAME"]))        throw new Error("ITEM NAME is required");
          if (!catName)                      throw new Error("CATEGORY NAME is required");
          if (!str(row["UNIT NAME"]))        throw new Error("UNIT NAME is required");
          if (!str(row["TAX NAME"]))         throw new Error("TAX NAME is required");
          if (!row["TAX VALUE"])             throw new Error("TAX VALUE is required");
          if (!str(row["TAX TYPE"]))         throw new Error("TAX TYPE is required");
          if (!row["PRICE WITHOUT TAX"])     throw new Error("PRICE WITHOUT TAX is required");
          if (!row["SALES PRICE"])           throw new Error("SALES PRICE is required");
          if (!row["OPENING STOCK"])         throw new Error("OPENING STOCK is required");

          const visRaw  = str(row["VISIBILITY"]||"online").toLowerCase();
          const isOnline= !(visRaw==="offline"||visRaw==="no"||visRaw==="0");

          /* push to payload */
          payload.push({
            itemCode: str(row["ITEM CODE"]),
            itemName: str(row["ITEM NAME"]),
            category: cat._id,
            subCategory: subId,
            subSubCategory: subSubId,
            itemGroup: str(row["ITEM GROUP"]) || "Single",
            unit: unitId,
            brand: brandId,
            tax: taxId,
            sku: str(row["SKU"]),
            hsn: str(row["HSN"]),
            barcodes,
            priceWithoutTax: Number(row["PRICE WITHOUT TAX"]||0),
            purchasePrice  : Number(row["PURCHASE PRICE"] ||0),
            salesPrice     : Number(row["SALES PRICE"]    ||0),
            mrp            : Number(row["MRP"]            ||0),
            openingStock   : Number(row["OPENING STOCK"]  ||0),
            alertQuantity  : Number(row["ALERT QTY"]      ||0),
            sellerPoints   : Number(row["SELLER POINTS"]  ||0),
            discountType   : discType,
            discount       : Number(row["DISCOUNT"]||0),
            discountPolicy : discPol,
            requiredQuantity: reqQty,
            freeQuantity    : freeQty,
            warehouse: selectedWarehouse,
            description: str(row["ITEM DESCRIPTION"]),
            expiryDate: expiry,
            itemImages: mappedImages,
            isOnline
          });
        } catch(err) {
          errors.push(`Row ${idx+1}: ${err.message}`);
          failedRows.push({ ...rows[idx], ERROR:err.message, ROW_NUMBER:idx+1 });
        }
      }

      /* export fail sheet (if any) */
      if (failedRows.length) {
        const csv = XLSX.utils.sheet_to_csv(XLSX.utils.json_to_sheet(failedRows));
        const blob= new Blob([csv],{type:"text/csv;charset=utf-8;"});
        const link= document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "failed_imports.csv";
        link.click();
      }

      if (errors.length && !payload.length)
        throw new Error(`All rows failed:\n${errors.join("\n")}`);
      if (!payload.length) throw new Error("No valid items to import");

      /* 3️⃣ send items */
      const resp = await axios.post(`${BASE_URL}/api/items/bulk`, payload, headers.current);
      if (!resp.data.success) throw new Error(resp.data.error || "Bulk import failed");

      const createdCount = resp.data.count ?? payload.length;
      let message = `Imported ${createdCount}/${rows.length} items successfully.`;
      if (errors.length) message += `\n${rows.length-createdCount} rows failed:\n${errors.join("\n")}`;
      alert(message);
      navigate("/item-list");

    } catch(err) {
      console.error("[bulk] import failed:", err);
      alert(err.message || "Bulk import error");
    } finally {
      setLoading(false);
    }
  };

  /* ───────────────────────────── RENDER ───────────────────────────── */
  if (loading) return <LoadingScreen/>;

  /* instructions (unchanged, but you may add notes about “code can be anywhere”) */
  const instructions = [
    {col:1,  name:"ITEM CODE",        value:"Optional",  desc:""},
    {col:2,  name:"ITEM NAME",        value:"Required",  desc:""},
    {col:3,  name:"CATEGORY NAME",    value:"Required",  desc:""},
    {col:4,  name:"SUB CATEGORY NAME",value:"Optional",  desc:""},
    {col:5,  name:"UNIT NAME",        value:"Required",  desc:""},
    {col:6,  name:"BRAND NAME",       value:"Optional",  desc:""},
    {col:7,  name:"TAX NAME",         value:"Required",  desc:""},
    {col:8,  name:"TAX VALUE",        value:"Required",  desc:""},
    {col:9,  name:"TAX TYPE",         value:"Required",  desc:"'Inclusive' or 'Exclusive'"},
    {col:10, name:"ITEM GROUP",       value:"Optional",  desc:"Defaults to 'Single'"},
    {col:11, name:"SKU",              value:"Optional",  desc:""},
    {col:12, name:"HSN",              value:"Optional",  desc:""},
    {col:13, name:"BARCODES",         value:"Optional",  desc:"Comma-separated"},
    {col:14, name:"PRICE WITHOUT TAX",value:"Required",  desc:""},
    {col:15, name:"PURCHASE PRICE",   value:"Optional",  desc:""},
    {col:16, name:"SALES PRICE",      value:"Required",  desc:""},
    {col:17, name:"MRP",              value:"Optional",  desc:""},
    {col:18, name:"OPENING STOCK",    value:"Required",  desc:""},
    {col:19, name:"ALERT QTY",        value:"Optional",  desc:""},
    {col:20, name:"SELLER POINTS",    value:"Optional",  desc:""},
    {col:21, name:"DISCOUNT TYPE",    value:"Optional",  desc:"'Percentage' or 'Flat'"},
    {col:22, name:"DISCOUNT",         value:"Optional",  desc:""},
    {col:23, name:"DISCOUNT POLICY",  value:"Optional",  desc:"'None' or 'BuyXGetY'"},
    {col:24, name:"REQUIRED QUANTITY",value:"Optional",  desc:"Needed for BuyXGetY"},
    {col:25, name:"FREE QUANTITY",    value:"Optional",  desc:"Needed for BuyXGetY"},
    {col:26, name:"ITEM DESCRIPTION", value:"Optional",  desc:""},
    {col:27, name:"EXPIRY DATE",      value:"Optional",  desc:"Date or Excel serial"},
    {col:28, name:"IMAGE CODE",       value:"Optional",  desc:"Can appear anywhere in filename"},
    {col:29, name:"ITEM IMAGES",      value:"Optional",  desc:"Fallback—comma-separated filenames"},
    {col:30, name:"VISIBILITY",       value:"Optional",  desc:"'Online' (default) or 'Offline'"},
  ];

  /* UI */
  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen}/>
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen}/>
        <div className="flex-grow p-4 bg-gray-100">
          {/* breadcrumb */}
          <header className="flex flex-col items-center justify-between p-4 mb-4 bg-white rounded shadow sm:flex-row">
            <h1 className="text-xl font-semibold">Import Items (Bulk CSV)</h1>
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <a href="/dashboard" className="flex items-center hover:text-cyan-600">
                <FaTachometerAlt className="mr-1"/> Home
              </a>
              <BiChevronRight/>
              <a href="/item-list" className="hover:text-cyan-600">Items List</a>
            </nav>
          </header>

          {/* form card */}
          <div className="p-6 space-y-4 bg-white rounded shadow">
            {/* warehouse */}
            <div>
              <label className="block mb-1 font-semibold">Warehouse <span className="text-red-500">*</span></label>
              <select
                className="w-full p-2 border rounded md:w-1/2"
                value={selectedWarehouse}
                onChange={e=>setSelectedWarehouse(e.target.value)}
              >
                <option value="">Select Warehouse</option>
                {warehouses.map(w=>(
                  <option key={w._id} value={w._id}>{w.warehouseName}</option>
                ))}
              </select>
            </div>

            {/* csv */}
            <div>
              <label className="block mb-1 font-semibold">Import CSV <span className="text-red-500">*</span></label>
              <input type="file" accept=".csv" onChange={handleFileChange}
                     className="w-full p-2 border rounded md:w-1/2"/>
              <p className="mt-1 text-sm text-red-500">
                Column names must match the list below. IMAGE CODE can be anywhere in the filename.
              </p>
            </div>

            {/* images */}
            <div>
              <label className="block mb-1 font-semibold">Upload Images (Optional)</label>
              <input type="file" accept="image/*" multiple
                     onChange={handleImageFilesChange}
                     className="w-full p-2 border rounded md:w-1/2"/>
              <p className="mt-1 text-sm text-gray-600">
                Max 50 files, 1 MB each. Importer links files whose names contain the IMAGE CODE.
              </p>
              {imageFiles.length>0 && (
                <div className="mt-2">
                  <p className="text-sm font-semibold">Uploaded Files:</p>
                  <ul className="pl-5 list-disc">
                    {imageFiles.map((f,i)=>(
                      <li key={i} className="flex items-center text-sm">
                        {f.name} ({(f.size/1024).toFixed(2)} KB)
                        <button type="button" onClick={()=>removeImageFile(i)}
                                className="ml-2 text-red-500 hover:text-red-700">Remove</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* buttons */}
            <div className="flex space-x-2">
              <button onClick={handleImport}
                className="px-4 py-2 text-white bg-green-500 rounded hover:bg-green-600">
                Import
              </button>
              <button onClick={()=>navigate("/item-list")}
                className="px-4 py-2 text-white bg-yellow-500 rounded hover:bg-yellow-600">
                Close
              </button>
            </div>
          </div>

          {/* instructions */}
          <div className="p-4 mt-6 bg-white rounded shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Import Instructions</h2>
              <a href="/templates/bulk-items-example.csv" download
                 className="px-4 py-2 text-white rounded bg-cyan-500 hover:bg-cyan-600">
                Download Example Format
              </a>
            </div>
            <table className="w-full text-sm border border-gray-300">
              <thead className="bg-gray-200">
                <tr>
                  <th className="p-2 border">#</th>
                  <th className="p-2 border">Column Name</th>
                  <th className="p-2 border">Value</th>
                  <th className="p-2 border">Description</th>
                </tr>
              </thead>
              <tbody>
                {instructions.map(i=>(
                  <tr key={i.col} className="even:bg-gray-50">
                    <td className="p-2 text-center border">{i.col}</td>
                    <td className="p-2 border">{i.name}</td>
                    <td className="p-2 font-semibold border">
                      {i.value==="Required"
                        ? <span className="px-2 text-xs text-green-800 bg-green-100 rounded">{i.value}</span>
                        : <span className="px-2 text-xs italic text-gray-600 bg-gray-100 rounded">{i.value}</span>}
                    </td>
                    <td className="p-2 border">{i.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

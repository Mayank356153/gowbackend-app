
import { useState } from "react";
import { createContext ,useContext} from "react";
import axios from "axios";
export const POSContext = createContext();




export const POSProvider = ({ children }) => {
     const link="https://pos.inspiredgrow.in/vps"
  const [posData, setPosData] = useState({
    items: [],
    customers: [],
    warehouses:[],
    loading: false,
  });

  const[available,setAvailable]=useState(false)
 const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

const loadPOSData = async () => {
  setAvailable(true)
  const token = localStorage.getItem("token");

  try {
    // Properly fetch 3 endpoints in parallel
    const [warehousesRes, customersRes] = await Promise.all([
      axios.get(`${link}/api/warehouses?scope=mine`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      axios.get(`${link}/api/customer-data/all`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const warehouses = warehousesRes.data?.data || [];
        const customers = customersRes.data.data || customersRes.data || [];

    // Fetch items for each warehouse in parallel
    const warehouseItemsResponses = await Promise.all(
      warehouses.map((warehouse) =>
        axios.get(`${link}/api/items`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { warehouse: warehouse._id, inStock: true },
        })
      )
    );

    // Flatten and process all items
    const allFlatItems = warehouseItemsResponses.flatMap((res) => {
      const rawItems = res.data?.data || [];
      return rawItems
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
    });

    // Finally set everything in one go
    setPosData({
      items: allFlatItems,
      warehouses,
      customers,
      loading: false,
    });

  } catch (err) {
    console.error("Fetch POS data error:", err.message);
  }
};

  return (
    <POSContext.Provider value={{ posData, loadPOSData,available,setAvailable }}>
      {children}
    </POSContext.Provider>
  );
};

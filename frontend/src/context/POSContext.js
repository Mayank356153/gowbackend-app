
import { useState } from "react";
import { createContext ,useContext} from "react";
import axios from "axios";
export const POSContext = createContext();




export const POSProvider = ({ children }) => {
     const link="https://pos.inspiredgrow.in/vps"
  const [posData, setPosData] = useState({
    items: [],
    customers: [],
    loading: false,
  });
 const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });


  const loadPOSData =  async() => {
      try {
     const {data} = await axios.get(`${link}/api/items`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        params: {inStock:true}
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
      setPosData((prev) => ({ ...prev, items: flatItems }));
    } catch (err) {
      console.error("Fetch items error:", err.message);
    }
  };

  return (
    <POSContext.Provider value={{ posData, loadPOSData }}>
      {children}
    </POSContext.Provider>
  );
};

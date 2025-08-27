
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

const loadPOSData = async (editId=null) => {
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

   

   

    // Finally set everything in one go
    setPosData({
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

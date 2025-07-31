import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaTrash,
  FaEdit,
  FaTachometerAlt,
  FaPencilAlt
} from "react-icons/fa";
import { BiChevronRight } from "react-icons/bi";
import Navbar  from "../../Navbar.jsx";
import Sidebar from "../../Sidebar.jsx";
import LoadingScreen from "../../../Loading.jsx";
import axios   from "axios";
import AccountList2 from "./AccountList2.jsx";
import AccountList3 from "./AccountList3.jsx";
const API_BASE = "https://pos.inspiredgrow.in/vps/api";
const todayISO = () => new Date().toISOString().slice(0, 10);
const safe     = n => Number(n ?? 0).toFixed(2);

export default function AccountList1() {
  const navigate = useNavigate();
  const token    = localStorage.getItem("token") || "";
  axios.defaults.headers.common = { Authorization: `Bearer ${token}` };
  const[active,setActive] = useState("account2");
  const[selectedAccount,setSelectedAccount] = useState(null);
  /* ───────── UI & filter state ───────── */
  const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [loading,       setLoading]     = useState(false);
  const [error,         setError]       = useState("");
  const [searchTerm,    setSearchTerm]  = useState("");
  const [currentPage,   setCurrentPage] = useState(1);
  const [entriesPerPage]               = useState(10);

  const [onDate,   setOnDate]   = useState(todayISO());
  const [fromDate, setFromDate] = useState("");
  const [toDate,   setToDate]   = useState("");

  const [pollTick, setPollTick] = useState(0);

  /* ───────── data stores ───────── */
  const [accounts,   setAccounts]   = useState([]);
  const [statsByAcc, setStatsByAcc] = useState({});
  const [todayLive,  setTodayLive]  = useState({});
  const [accWhMap,   setAccWhMap]   = useState({});  // account → { warehouseId, warehouseName }

  const storeId = localStorage.getItem("storeId") || "";
  const role    = (localStorage.getItem("role") || "").toLowerCase();
  const isAdmin = role === "admin";

  const tableRef = useRef();


  /* ───────── 1 – Load accounts & their warehouses ───────── */
  useEffect(() => {
    setLoading(true);

    if (!isAdmin && !storeId) {
      setError("No store ID found. Please log in again.");
      setLoading(false);
      return;
    }

    Promise.all([
      axios.get(`${API_BASE}/accounts`),
      axios.get(`${API_BASE}/warehouses`)
    ])
      .then(([accRes, whRes]) => {
        const wMap = {};
        (whRes.data.data||[]).forEach(w => wMap[w._id] = w);

        // for each account, ask which warehouse it uses
        const ps = (accRes.data.data||[]).map(acc =>
          axios.get(`${API_BASE}/by-cash-account/${acc._id}`)
            .then(r => {
              const wid = r.data.warehouseId;
              const wh  = wMap[wid];
              const keep = isAdmin ? !!wh : (wh && wh.store===storeId);
              if (!keep) return null;
              setAccWhMap(m => ({ ...m,
                [acc._id]: {
                  warehouseId: wid,
                  warehouseName: wh.warehouseName
                }
              }));
              return acc;
            })
            .catch(()=>null)
        );

        Promise.all(ps).then(arr => {
          const ok = arr.filter(Boolean);
          setAccounts(ok);
          if (!ok.length) setError("No accounts found for your store.");
        });
      })
      .catch(err=>{
        console.error(err);
        setError(err.response?.data?.message||"Failed to load data.");
      })
      .finally(()=>setLoading(false));
  },[storeId,isAdmin]);

  /* ───────── 2 – Fetch summary for each account ───────── */
  const isRange = ()=>Boolean(fromDate && toDate);
  const isToday = ()=>!isRange() && onDate===todayISO();
  const activeKey = ()=> isRange()
    ? `range:${fromDate}_${toDate}`
    : `day:${onDate}`;
  const dateParams = p => isRange()
    ? { ...p, start: fromDate, end: toDate }
    : { ...p, date: onDate };

  useEffect(()=>{
    if (isToday()) {
      const id = setInterval(()=>setPollTick(t=>t+1),30_000);
      return ()=>clearInterval(id);
    }
  },[onDate,fromDate,toDate]);

  const fetchSummary = async accId => {
    const key = `${activeKey()}#${pollTick}`;
    if (statsByAcc[accId]?.key===key) return;

    setStatsByAcc(s=>({
      ...s,
      [accId]: { loading:true, key }
    }));
    try {
      const { warehouseId } = await axios
        .get(`${API_BASE}/by-cash-account/${accId}`)
        .then(r=>r.data);

      const row = await axios
        .get(`${API_BASE}/cash-summary`,{
          params: dateParams({ warehouseId })
        })
        .then(r=>r.data);

      if (isToday()) {
        setTodayLive(t=>({
          ...t,
          [accId]: row.liveBalance
        }));
      }

      setStatsByAcc(s=>({
        ...s,
        [accId]: { loading:false, key, data:row }
      }));
    } catch(err) {
      console.error(`fetchSummary(${accId}) failed`,err.message);
      const zeros = {
        deposit:0, cashSale:0, bankSale:0, totalSale:0,
        moneyTransfer:0, vanCash:0, vanCashRemark: "", diff:0,
        openingBalance:0, closingBalance:0, liveBalance:0
      };
      setStatsByAcc(s=>({
        ...s,
        [accId]: {
          loading:false,
          key,
          data: err.response?.status===404
            ? zeros
            : { ...zeros, error:err.message }
        }
      }));
    }
  };

  useEffect(()=>{
    accounts.forEach(a=>fetchSummary(a._id));
  },[accounts,onDate,fromDate,toDate,pollTick]);

  /* ───────── 3 – Edit Van Cash ───────── */
  const handleEditVanCash = async accId => {
    if (isRange()) {
      alert("Edit Van Cash only in single-day view.");
      return;
    }
    const row = statsByAcc[accId]?.data||{};
    const current = row.vanCash||0;
    const currentRemark = row.vanCashRemark||"";
    const amountInput = window.prompt("New Van Cash amount", current);
    if (amountInput === null) return;
    const amt = parseFloat(amountInput);
    if (isNaN(amt)) {
      alert("Please enter a valid number for the amount.");
      return;
    }
    const remarkInput = window.prompt("Enter remark for Van Cash (optional)", currentRemark);
    if (remarkInput === null) return; // Allow cancellation
    const remark = remarkInput.trim();
    const wh = accWhMap[accId]?.warehouseId;
    if (!wh) {
      alert("Warehouse missing.");
      return;
    }
    try {
      setLoading(true);
      await axios.put(`${API_BASE}/ledger/van-cash`, {
        warehouseId: wh,
        date: `${onDate}T12:00:00Z`,
        amount: amt,
        remark: remark
      });
      fetchSummary(accId);
      alert("Updated!");
    } catch(e) {
      console.error(e);
      alert(e.response?.data?.message || "Failed to update Van Cash");
    } finally {
      setLoading(false);
    }
  };
  
   
  

  /* ───────── 4 – Search & paginate ───────── */
  const filtered = accounts.filter(a=>{
    const q = searchTerm.toLowerCase();
    return a.accountName?.toLowerCase().includes(q)
       || a.accountNumber?.toLowerCase().includes(q)
       || accWhMap[a._id]?.warehouseName?.toLowerCase().includes(q)
       || a._id.includes(q);
  });

  const totalPages     = Math.ceil(filtered.length/entriesPerPage)||1;
  const currentRecords = filtered.slice(
    (currentPage-1)*entriesPerPage,
    currentPage*entriesPerPage
  );

  if (loading) return <LoadingScreen />;
  if (error)   return <p className="p-4 text-red-600">{error}</p>;

  return (
    <div className="flex flex-col h-screen">
      <Navbar isSidebarOpen={isSidebarOpen} setSidebarOpen={setSidebarOpen}/>
      <div className="flex flex-grow">
        <Sidebar isSidebarOpen={isSidebarOpen}/>
       {
       active=== "account2" && (
           <AccountList2 accountList={currentRecords} setSelectedAccount={setSelectedAccount} setActive={setActive} />
       )
       }
       {
        active === "account3" &&(<AccountList3 currentRecords={currentRecords} statsByAcc={statsByAcc} todayLive={todayLive} accWhMap={accWhMap} isToday={isToday}
           isRange={isRange} fromDate={fromDate} toDate={toDate} onDate={onDate} setSelectedAccount={setSelectedAccount} handleEditVanCash={handleEditVanCash} setActive={setActive} selectedAccount={selectedAccount}  navigate={navigate} safe={safe}
        />) 
       }

        
      </div>
    </div>
  );
}

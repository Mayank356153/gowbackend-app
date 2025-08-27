import React, { useState,useEffect } from 'react';
import { Link, useNavigate ,useLocation} from 'react-router-dom';
import { FaPencilAlt, FaEdit, FaTrash, FaArrowLeft } from 'react-icons/fa';
import { App } from '@capacitor/app';
// Helper to format numbers safely
const safe = (value) => new Intl.NumberFormat('en-IN').format(value || 0);

const AccountList3 = ({
    selectedAccount,
    setActive,
  currentRecords = [],
  statsByAcc = {},
  todayLive = {},
  accWhMap = {},
  isToday = () => false,
  isRange = () => false,
  fromDate,
  toDate,
  setFromDate,
  setToDate,
  setOnDate,
  onDate,
  filtered = [],
  currentPage = 1,
  entriesPerPage = 10,
  setCurrentPage, totalPages = 1,
  handleEditVanCash = () => {},
}) => {

    
  const [localPermissions, setLocalPermissions] = useState([]);

   
  const userRole = (localStorage.getItem("role") || "guest").toLowerCase();
  const isAdmin = userRole === "admin";




   useEffect(() => {
    const storedPermissions = localStorage.getItem("permissions");
    if (storedPermissions) {
      try {
        setLocalPermissions(JSON.parse(storedPermissions));
      } catch (error) {
        console.error("Error parsing permissions:", error);
        setLocalPermissions([]);
      }
    } else {
      setLocalPermissions([]);
    }
  }, []);

 const hasPermissionFor = (module, action) => {
    if (isAdmin) return true;
    return localPermissions.some(
      (perm) =>
        perm.module.toLowerCase() === module.toLowerCase() &&
        perm.actions.map((a) => a.toLowerCase()).includes(action.toLowerCase())
    );
  };

  // State for mobile view (to track selected account)
  const navigate = useNavigate();



   useEffect(() => {
              const backHandler = App.addListener('backButton', () => {
                setActive("account2")
              });
          
              return () => backHandler.remove();
            }, []);
          
            // Intercept swipe back or browser back
            useEffect(() => {
              const unblock = navigate((_, action) => {
                if (action === 'POP') {
                       setActive('account2'); // Navigate back to account list  
                  return false; // Prevent actual navigation
                }
              });
          
              return unblock;
            }, [navigate]);

            
  // --- Mobile Detail View Helper ---
  const DetailRow = ({ label, value, isLink, path, children }) => (
    <div className="flex items-center justify-between py-3">
      <p className="text-sm text-gray-500">{label}</p>
      {children ? (
        <div>{children}</div>
      ) : isLink ? (
        <Link to={path} className="font-semibold text-blue-600 hover:underline">
          {value}
        </Link>
      ) : (
        <p className="font-semibold text-right text-gray-800">{value}</p>
      )}
    </div>
  );

return (
  <div className="w-full max-w-3xl p-4 mx-auto bg-white border border-gray-100 shadow-lg rounded-2xl">
    {(() => {
      const acc = selectedAccount;
      const row = statsByAcc[acc._id]?.data || {};
      const live = isToday()
        ? todayLive[acc._id] ?? row.liveBalance
        : row.liveBalance;
      const whRec = accWhMap[acc._id] || {};
      const qs = isRange()
        ? `?from=${fromDate}&to=${toDate}`
        : `?on=${onDate}`;
      const ledgerPath = `/accounts/${acc._id}/ledger${qs}`;

      return (
        <>
          {/* Back Button */}
          <div
            className="flex items-center gap-2 mb-5 text-blue-600 cursor-pointer hover:underline"
            onClick={() => setActive("account2")}
          >
            <FaArrowLeft size={18} />
            <span className="text-base font-medium">Back</span>
          </div>

          {/* Date Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <input
              type="date"
              value={onDate}
              onChange={e => {
                setOnDate(e.target.value);
                setFromDate("");
                setToDate("");
              }}
              className="p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">or</span>
            <input
              type="date"
              value={fromDate}
              onChange={e => {
                setFromDate(e.target.value);
                setOnDate("");
              }}
              className="p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-500">to</span>
            <input
              type="date"
              value={toDate}
              onChange={e => {
                setToDate(e.target.value);
                setOnDate("");
              }}
              className="p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Account Details */}
          <div className="overflow-hidden divide-y divide-gray-200 bg-gray-50 rounded-xl">
            <DetailRow label="Account #" value={acc.accountNumber} />
            <DetailRow label="Account Name" value={acc.accountName} isLink path={ledgerPath} />
            <DetailRow label="Warehouse" value={whRec.warehouseName || "-"} isLink path={ledgerPath} />
            <DetailRow label="Deposit" value={safe(row.deposit)} />
            <DetailRow label="Cash Sale" value={safe(row.cashSale)} />
            <DetailRow label="Bank Sale" value={safe(row.bankSale)} />
            <DetailRow label="Total Sale" value={safe(row.totalSale)} />

            {/* Money Transfer */}
            <DetailRow label="Money Transfer">
              <div className="flex items-center gap-3">
                <span className="font-semibold">{safe(row.moneyTransfer)}</span>
                {(hasPermissionFor("AccountEdit", "Edit") ||
                  acc.createdBy?._id === localStorage.getItem("userId")) && (
                  <button
                    onClick={() => navigate("/add-money-transfer")}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaPencilAlt size={14} />
                  </button>
                )}
              </div>
            </DetailRow>

            {/* Van Cash */}
            <DetailRow label="Van Cash">
              <div className="flex items-center gap-3">
                <span className="font-semibold">{safe(row.vanCash)}</span>
                {(hasPermissionFor("AccountEdit", "Edit") ||
                  acc.createdBy?._id === localStorage.getItem("userId")) && (
                  <button
                    onClick={() => handleEditVanCash(acc._id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FaPencilAlt size={14} />
                  </button>
                )}
              </div>
            </DetailRow>

            <DetailRow label="Van Cash Remark" value={row.vanCashRemark || "-"} />
            <DetailRow label="Diff" value={safe(row.diff)} />
            <DetailRow label="Opening Balance" value={safe(row.openingBalance)} />
            <DetailRow
              label="Closing Balance"
              value={safe(isRange() ? row.totalClosingBalanceInRange : row.closingBalance)}
            />
            <DetailRow label="Live Balance" value={safe(live)} />
          </div>

          {/* Edit/Delete Buttons */}
          {(hasPermissionFor("AccountEdit", "Edit") ||
            acc.createdBy?._id === localStorage.getItem("userId")) && (
            <div className="flex justify-center gap-8 py-5">
              <button
                onClick={() => navigate(`/add-account?id=${acc._id}`)}
                className="flex flex-col items-center text-blue-600 hover:text-blue-800"
              >
                <FaEdit size={20} />
                <span className="mt-1 text-xs">Edit</span>
              </button>
              <button
                onClick={() => {}}
                className="flex flex-col items-center text-red-600 hover:text-red-800"
              >
                <FaTrash size={20} />
                <span className="mt-1 text-xs">Delete</span>
              </button>
            </div>
          )}
        </>
      );
    })()}
  </div>
);

};

export default AccountList3;
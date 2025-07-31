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
  onDate,
  handleEditVanCash = () => {},
}) => {

    
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
    
      

   
       
          
          <div className="w-full p-4 bg-white rounded-lg shadow">
           
            <div className="divide-y divide-gray-100">
              {(() => {
                const acc = selectedAccount;
                const row = statsByAcc[acc._id]?.data || {};
                const live = isToday() ? todayLive[acc._id] ?? row.liveBalance : row.liveBalance;
                const whRec = accWhMap[acc._id] || {};
                const qs = isRange() ? `?from=${fromDate}&to=${toDate}` : `?on=${onDate}`;
                const ledgerPath = `/accounts/${acc._id}/ledger${qs}`;
                const closing = isRange() ? row.totalClosingBalanceInRange : row.closingBalance;
                
                return (
                <>
    {/* Back Button */}
    <div
      className="flex items-center gap-2 mb-3 text-blue-600 cursor-pointer"
      onClick={() => setActive("account2")}
    >
      <FaArrowLeft size={16} />
      <span className="text-sm font-medium">Back</span>
    </div>

    {/* Main Card */}
    <div className="w-full p-4 bg-white rounded-lg shadow">
      <div className="divide-y divide-gray-100">
          <DetailRow label="Account #" value={acc.accountNumber} />
                    <DetailRow label="Account Name" value={acc.accountName} isLink path={ledgerPath} />
                    <DetailRow label="Warehouse" value={whRec.warehouseName || "-"} isLink path={ledgerPath} />
                    <DetailRow label="Deposit" value={safe(row.deposit)} />
                    <DetailRow label="Cash Sale" value={safe(row.cashSale)} />
                    <DetailRow label="Bank Sale" value={safe(row.bankSale)} />
                    <DetailRow label="Total Sale" value={safe(row.totalSale)} />
                    {/* <DetailRow label="Money Transfer" value={safe(row.moneyTransfer)} /> */}
                    <DetailRow label="Money Transfer">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{safe(row.moneyTransfer)}</span>
                        <button onClick={() => navigate("/add-money-transfer")} className="text-blue-600"><FaPencilAlt size={14} /></button>
                      </div>
                    </DetailRow>
                    <DetailRow label="Van Cash">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{safe(row.vanCash)}</span>
                        <button onClick={() => handleEditVanCash(acc._id)} className="text-blue-600"><FaPencilAlt size={14} /></button>
                      </div>
                    </DetailRow>
                    <DetailRow label="Van Cash Remark" value={row.vanCashRemark || "-"} />
                    <DetailRow label="Diff" value={safe(row.diff)} />
                    <DetailRow label="opening Balance" value={safe(row.openingBalance)} />
                    <DetailRow label="Closing Balance" value={safe(isRange()
                              ? row.totalClosingBalanceInRange
                              : row.closingBalance
                            )} />
                    <DetailRow label="Live Balance" value={safe(live)} />
                    <div className="flex justify-center gap-6 pt-4">
                      <button onClick={() => navigate(`/add-account?id=${acc._id}`)} className="flex flex-col items-center text-blue-600"><FaEdit size={20} /><span className="mt-1 text-xs">Edit</span></button>
                      <button onClick={() => { /* delete... */ }} className="flex flex-col items-center text-red-600"><FaTrash size={20} /><span className="mt-1 text-xs">Delete</span></button>
                    </div>
        {/* DetailRow rendering block stays unchanged */}
      </div>
    </div>
  </>


            
                );
              })()}
            </div>
          </div>
        
    
    
  );
};

export default AccountList3;
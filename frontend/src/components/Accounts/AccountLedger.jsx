// src/components/AccountLedger.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import Navbar  from '../Navbar.jsx';
import Sidebar from '../Sidebar.jsx';
import axios   from 'axios';
import * as XLSX    from 'xlsx';
import { saveAs }   from 'file-saver';
import { FaTachometerAlt } from 'react-icons/fa';
import { BiChevronRight }   from 'react-icons/bi';

const API_BASE = 'api';

function parseQs(search) {
  const p = new URLSearchParams(search);
  return {
    from: p.get('from') || '',
    to:   p.get('to')   || '',
    on:   p.get('on')   || new Date().toISOString().slice(0,10)
  };
}

export default function AccountLedger() {
        const link="https://pos.inspiredgrow.in/vps"
  const { accountId } = useParams();
  const { search }   = useLocation();
  const { from, to, on } = parseQs(search);

  const [accountName, setAccountName] = useState('');
  const [rows,        setRows]        = useState([]);
  const [loading,     setLoading]     = useState(true);

  // helper: list of YYYY-MM-DD between start/end
  function dateRange(start, end) {
    const out = [];
    const cur = new Date(start);
    const last = new Date(end);
    while (cur <= last) {
      out.push(cur.toISOString().slice(0,10));
      cur.setDate(cur.getDate()+1);
    }
    return out;
  }

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    // 1) get the account so we can show its name
    axios.get(`${link}/${API_BASE}/accounts/${accountId}`)
      .then(res => {
        if (!mounted) return;
        const acct = res.data.data;
        setAccountName(acct.accountName);

        // 2) find which warehouse this account backs
        return axios.get(`${link}/${API_BASE}/by-cash-account/${accountId}`);
      })
      .then(res2 => {
        if (!mounted) return;
        const warehouseId = res2.data.warehouseId;
        // build list of dates to fetch
        const dates = from && to ? dateRange(from, to) : [ on ];

        // 3) fetch one summary per date
        return Promise.all(dates.map(d =>
          axios.get(`${link}/${API_BASE}/cash-summary`, {
            params: { warehouseId, date: d }
          })
          .then(r => ({ date: d, ...r.data }))
        ));
      })
      .then(results => {
        if (mounted) setRows(results);
      })
      .catch(err => {
        console.error("Error loading ledger:", err);
        if (mounted) setRows([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [accountId, from, to, on]);

  // Compute column keys once
  const columns = useMemo(() => {
    return rows.length ? Object.keys(rows[0]) : [];
  }, [rows]);

  // Compute totals for each column (sum numeric values only)
  const totals = useMemo(() => {
    const t = {};
    columns.forEach(col => {
      const sum = rows.reduce((acc, r) => {
        const val = r[col];
        if (typeof val === 'number' && !isNaN(val)) {
          return acc + val;
        }
        // if value is string or something else, try Number()
        const num = Number(val);
        return !isNaN(num) ? acc + num : acc;
      }, 0);
      t[col] = sum;
    });
    return t;
  }, [rows, columns]);

  // CSV export (with UTF-8 BOM)
  const exportCSV = () => {
    if (!rows.length) return;
    const header = Object.keys(rows[0]);
    const lines = [
      header.join(','),
      ...rows.map(r =>
        header.map(k => `"${(r[k] ?? '').toString().replace(/"/g,'""')}"`).join(',')
      )
    ].join('\n');

    // Append a totals row at the end of CSV
    const totalLine = header.map((col, idx) => {
      if (idx === 0) return `"Total"`;
      const val = totals[col];
      // Only include a number if it's non-zero; otherwise leave it blank
      return val !== 0 ? `"${val}"` : `""`;
    }).join(',');
    const csv = '\uFEFF' + lines + '\n' + totalLine;

    saveAs(
      new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
      `ledger-${accountName || accountId}.csv`
    );
  };

  // Excel export
  const exportExcel = () => {
    if (!rows.length) return;
    // Build a copy of rows plus one final "total" row
    const dataWithTotal = [
      ...rows,
      columns.reduce((acc, col, idx) => {
        if (idx === 0) {
          acc[col] = 'Total';
        } else {
          const val = totals[col];
          acc[col] = val !== 0 ? val : '';
        }
        return acc;
      }, {})
    ];

    const ws = XLSX.utils.json_to_sheet(dataWithTotal);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ledger');
    const wbout = XLSX.write(wb, { bookType:'xlsx', type:'array' });
    saveAs(
      new Blob([wbout], { type:'application/octet-stream' }),
      `ledger-${accountName || accountId}.xlsx`
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        <Navbar />
        <div className="flex flex-grow">
          <Sidebar />
          <main className="flex-grow p-4">Loading…</main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-grow">
        <Sidebar />
        <main className="flex-grow p-4 overflow-x-auto bg-gray-50">
          <nav className="flex items-center mb-4 text-sm text-gray-500">
            <Link to="/account-list" className="flex items-center">
              <FaTachometerAlt className="mr-1" /> Accounts
            </Link>
            <BiChevronRight className="mx-2" />
            <span>Ledger</span>
          </nav>

          <h2 className="mb-4 text-xl font-bold">
            Ledger for <span className="text-indigo-600">{accountName}</span>
          </h2>

          <div className="mb-4 space-x-2">
            <button
              onClick={exportCSV}
              className="px-4 py-2 text-white bg-blue-600 rounded"
            >
              Export CSV
            </button>
            <button
              onClick={exportExcel}
              className="px-4 py-2 text-white bg-green-600 rounded"
            >
              Export Excel
            </button>
          </div>

          {rows.length > 0 ? (
            <div className="overflow-x-auto bg-white rounded shadow">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    {columns.map(col => (
                      <th key={col} className="p-2 border">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {columns.map((k, j) => (
                        <td key={j} className="p-2 border">
                          {r[k]?.toString() ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="font-semibold bg-gray-100">
                  <tr>
                    {columns.map((col, idx) => (
                      <td key={col} className="p-2 border">
                        {idx === 0
                          ? 'Total'
                          : (totals[col] !== 0 ? totals[col] : '')
                        }
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="py-8 text-center">No ledger summary found.</p>
          )}
        </main>
      </div>
    </div>
  );
}

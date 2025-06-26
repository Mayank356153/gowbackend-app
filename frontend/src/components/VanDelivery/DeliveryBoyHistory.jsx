import React, { useState } from 'react';

const deliveryData = [
  {
    id: 'DB101',
    name: 'Rahul Sharma',
    contact: '9876543210',
    paymentMethod: 'Cash + Online',
    cashAmount: 500,
    onlineAmount: 1200,
    cashSubmitted: true,
    submitDate: '2025-04-10',
  },
  {
    id: 'DB102',
    name: 'Priya Verma',
    contact: '9123456780',
    paymentMethod: 'Online Only',
    cashAmount: 0,
    onlineAmount: 950,
    cashSubmitted: null,
    submitDate: null,
  },
  {
    id: 'DB103',
    name: 'Ankit Raj',
    contact: '9988776655',
    paymentMethod: 'Cash Only',
    cashAmount: 800,
    onlineAmount: 0,
    cashSubmitted: false,
    submitDate: null,
  },
  {
    id: 'DB104',
    name: 'Simran Kaur',
    contact: '9012345678',
    paymentMethod: 'Cash + Online',
    cashAmount: 300,
    onlineAmount: 1100,
    cashSubmitted: true,
    submitDate: '2025-04-11',
  },
  {
    id: 'DB105',
    name: 'Rakesh Mehta',
    contact: '9870011223',
    paymentMethod: 'Cash',
    cashAmount: 150,
    onlineAmount: 0,
    cashSubmitted: false,
    submitDate: null,
  },
];

const formatDate = (isoDate) => {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-GB');
};

const DeliveryBoyHistory = () => {
  const [selectedDate, setSelectedDate] = useState('');

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const filteredData = deliveryData.filter((boy) => {
    if (!selectedDate) return true;
    return boy.submitDate === selectedDate;
  });

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="flex flex-col mb-6 md:flex-row md:items-center md:justify-between">
        <h1 className="mb-4 text-4xl font-bold text-gray-800 md:mb-0">Delivery Boy Records</h1>
        <div className="flex items-center gap-3">
          <label className="text-lg font-medium text-gray-700">Filter by Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow-lg">
        <table className="min-w-full bg-white table-auto">
          <thead className="text-white bg-red-600">
            <tr>
              <th className="px-4 py-3 text-sm text-left">ID</th>
              <th className="px-4 py-3 text-sm text-left">Name</th>
              <th className="px-4 py-3 text-sm text-left">Contact</th>
              <th className="px-4 py-3 text-sm text-left">Payment Method</th>
              <th className="px-4 py-3 text-sm text-left">Cash</th>
              <th className="px-4 py-3 text-sm text-left">Online</th>
              <th className="px-4 py-3 text-sm text-left">Wallet</th>
              <th className="px-4 py-3 text-sm text-left">Submitted</th>
              <th className="px-4 py-3 text-sm text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((boy, index) => (
                <tr
                  key={index}
                  className="transition duration-200 border-b border-gray-200 hover:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm">{boy.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">{boy.name}</td>
                  <td className="px-4 py-3 text-sm">{boy.contact}</td>
                  <td className="px-4 py-3 text-sm">{boy.paymentMethod}</td>
                  <td className="px-4 py-3 text-sm">₹{boy.cashAmount}</td>
                  <td className="px-4 py-3 text-sm">₹{boy.onlineAmount}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-700">
                    ₹{boy.cashAmount + boy.onlineAmount}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {boy.cashSubmitted === true ? (
                      <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full">
                        Yes
                      </span>
                    ) : boy.cashSubmitted === false ? (
                      <span className="px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 rounded-full">
                        No
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-200 rounded-full">
                        N/A
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {boy.submitDate ? formatDate(boy.submitDate) : '—'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="py-6 text-center text-gray-500">
                  No records found for the selected date.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeliveryBoyHistory;


// Redesigned POS3 for Clean Mobile UI
import React, { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { useNavigate } from 'react-router-dom';
import { FaBoxOpen, FaBox, FaPlus, FaMinus, FaTrash, FaChevronLeft, FaHandPaper, FaLayerGroup, FaMoneyBill, FaCreditCard } from 'react-icons/fa';
import { Keyboard } from '@capacitor/keyboard';
// No changes needed for these sub-components
const Info = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="font-semibold text-gray-800 truncate">{value}</p>
  </div>
);

const Summary = ({ label, value, isGrandTotal = false }) => (
  <div className="flex justify-between py-1.5 text-sm">
    <span className={isGrandTotal ? "font-bold text-gray-800" : "text-gray-600"}>{label}</span>
    <span className={isGrandTotal ? "font-bold text-lg text-gray-900" : "font-medium text-gray-800"}>{value}</span>
  </div>
);

// --- COMPONENT REFACTORED FOR BETTER MOBILE UX ---
const ItemsList = ({ items,couponCode,setCouponCode, updateItem, removeItem, setSelectedItem ,totalAmount ,totalDiscount}) => (
  <section className="overflow-y-auto">
    <div className="divide-y divide-gray-200 ">
      {items.length === 0 ? (
        <div className="p-10 text-center">
          <FaBoxOpen size={40} className="mx-auto text-gray-400" />
          <h3 className="mt-4 text-base font-semibold text-gray-800">Your Cart is Empty</h3>
          <p className="mt-1 text-sm text-gray-500">Add items to get started.</p>
        </div>
      ) : (
        items.map((item, idx) => (
          <div key={item.id || idx} className="flex items-center gap-4 p-3">
            {/* Item Name & Details */}
            <div className="flex-grow cursor-pointer" onClick={() => setSelectedItem(item)}>
              <p className="font-semibold leading-tight text-gray-800" title={item.itemName}>
                {item.itemName}
              </p>
              <p className="text-xs text-gray-500">
                @ ₹{item.salesPrice.toFixed(2)}
              </p>
            </div>

            {/* Quantity Stepper & Price */}
            <div className="flex flex-col items-end gap-2">
  <div className="flex items-center bg-gray-100 rounded-lg">
    <button
      onClick={() => updateItem(idx, 'quantity', Math.max(1, item.quantity - 1))}
      className="px-3 py-1 rounded-l-lg text-cyan-600 hover:bg-gray-200"
      aria-label="Decrease quantity"
    >
      <FaMinus size={12} />
    </button>

    <input
      type="text"
       onFocus={(e) => {
    e.target.focus(); // ensure input is focused
    setTimeout(() => {
      Keyboard.show(); // explicitly show the keyboard
    }, 100); // short delay helps trigger keyboard on some Androids
  }}
      value={item.quantity}
      onChange={(e) => {
        const val = parseInt(Number(e.target.value));
        updateItem(idx, 'quantity', val);
      }}
      className="w-12 text-base font-bold text-center bg-white border-none focus:ring-0"
    />

    <button
      onClick={() => updateItem(idx, 'quantity', item.quantity + 1)}
      className="px-3 py-1 rounded-r-lg text-cyan-600 hover:bg-gray-200"
      aria-label="Increase quantity"
    >
      <FaPlus size={12} />
    </button>
  </div>

  <p className="text-base font-bold text-gray-900">
    ₹{item.subtotal.toFixed(2)}
  </p>
</div>


            {/* Remove Button */}
            <button
              onClick={() => removeItem(idx)}
              className="p-2 text-gray-400 rounded-full hover:bg-red-50 hover:text-red-500"
              aria-label="Remove item"
            >
              <FaTrash size={16} />
            </button>
          </div>
        ))
      )}
    </div>
    
          <Summary label="Subtotal" value={`₹${totalAmount.toFixed(2)}`} />
          <Summary label="Discount" value={`- ₹${totalDiscount.toFixed(2)}`} />
          <div className="my-2 border-t border-dashed" />
          <Summary label="Grand Total" value={`₹${(totalAmount - totalDiscount).toFixed(2)}`} isGrandTotal={true} />

          <div >
            <label className="block mb-1 text-xs font-medium text-gray-600">Apply Coupon</label>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter coupon code"
              className="w-full p-2 text-sm border-2 border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
         <div className='h-44'></div>
  </section>
);


// --- COMPONENT REFACTORED FOR BETTER MOBILE UX ---
const ItemDetailModal = ({ selectedItem, allItems, onClose }) => {
  const item = allItems.find(it => it._id === selectedItem.item);
  console.log(item);
  if (!item) return null;

  return (
    // CHANGED: Full-screen modal with flex-col layout for sticky footer
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex items-center justify-between flex-shrink-0 p-4 border-b">
        <button onClick={onClose} className="p-2 -ml-2 text-gray-600">
          <FaChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-semibold">Item Details</h2>
        <div className="w-6" /> {/* Spacer */}
      </header>

      {/* CHANGED: Scrollable content area */}
      <main className="flex-grow p-4 overflow-y-auto ">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg">
              {item.image ? (
                <img src={item.image} alt="item" className="object-cover w-full h-full rounded-lg" />
              ) : (
                <FaBox size={32} className="text-gray-400" />
              )}
            </div>
            <div>
              <p className="text-xl font-bold">{item.itemName}</p>
              <p className="text-sm text-gray-500">SKU: {item.sku || 'N/A'}</p>
              <p className="text-lg font-semibold text-cyan-600">₹{item.salesPrice}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Info label="Category" value={item.category?.name || 'N/A'} />
            <Info label="Brand" value={item.brand?.brandName || 'N/A'} />
            <Info label="Stock" value={item.currentStock || 0} />
            <Info label="Barcode" value={item.barcode || item.barcodes?.[0] || 'N/A'} />
          </div>
          {item.description && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Description</p>
              <p className="mt-1 text-sm text-gray-700">{item.description}</p>
            </div>
          )}
        </div>
      </main>

      {/* CHANGED: Sticky footer */}
      <footer className="flex-shrink-0 p-4 bg-white border-t">
        <button onClick={onClose} className="w-full py-3 font-semibold text-white rounded-lg bg-cyan-600 hover:bg-cyan-700">
          Close
        </button>
      </footer>
    </div>
  );
};


export default function POS3({
selectedCustomer, selectedWarehouse, 
 allItems,  warehouses, invoiceCode, customers,
  orderPaymentMode, items, updateItem, removeItem, onHold,  onOpenModal,
  totalAmount, totalDiscount, couponCode, setCouponCode, isPaymentModalOpen, setIsPaymentModalOpen,
  PaymentModal, paymentMode, paymentTypes, accounts, terminals, buildPayload, selectedAccount,
  advancePaymentAmount, paymentSummary, sendOrder, currentOrderId, setAdvancePaymentAmount,
  setSelectedAccount, setActiveTab, setAdjustAdvancePayment
}) {
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const backHandler = App.addListener('backButton', () => setActiveTab('pos2'));
    return () => backHandler.remove();
  }, [setActiveTab]);
  useEffect(()=>{
    console.log("Ad")
    console.log(items)
  }, [items]);

  return (
    // CHANGED: Added pb-32 for padding at the bottom so content isn't hidden by the sticky footer
    <div className="text-gray-900 ">
     

      {/* CHANGED: Adjusted padding and spacing for a cleaner look */}
      <main className="px-3 pt-2 space-y-4">
        {/* Invoice Info Section */}
        <section className="pt-2 ">
          <div className="grid grid-cols-2 text-sm gap-x-4 ">
            <Info label="Warehouse" value={warehouses.find(w => w._id === selectedWarehouse)?.warehouseName || 'N/A'} />
            <Info label="Invoice #" value={invoiceCode} />
            <Info label="Customer" value={customers.find(c => c._id === selectedCustomer)?.customerName || 'N/A'} />
            <Info label="Payment" value={orderPaymentMode || 'None'} />
          </div>
          <div className="border-t border-gray-200 ">
            <button onClick={() => setActiveTab('pos2')} className="w-full px-4 py-2 text-sm font-medium text-center rounded-lg text-cyan-600 bg-cyan-50 hover:bg-cyan-100">
              <FaPlus className="inline mb-px mr-1" /> Add More Items
            </button>
          </div>
        </section>

        {/* Items List */}
        <ItemsList items={items} couponCode={couponCode} setCouponCode={setCouponCode} totalAmount={totalAmount} totalDiscount={totalDiscount} updateItem={updateItem} removeItem={removeItem} setSelectedItem={setSelectedItem} />

        {/* Order Summary Section */}
        {/* <section className="">
          <Summary label="Subtotal" value={`₹${totalAmount.toFixed(2)}`} />
          <Summary label="Discount" value={`- ₹${totalDiscount.toFixed(2)}`} />
          <div className="my-2 border-t border-dashed" />
          <Summary label="Grand Total" value={`₹${(totalAmount - totalDiscount).toFixed(2)}`} isGrandTotal={true} />

          <div className="mt-4">
            <label className="block mb-1 text-xs font-medium text-gray-600">Apply Coupon</label>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              placeholder="Enter coupon code"
              className="w-full p-2 text-sm border-gray-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
            />
          </div>
        </section> */}
      </main>

      {/* --- CHANGED: STICKY FOOTER FOR ACTIONS --- */}
      <footer className="fixed bottom-0 left-0 right-0 z-10 p-3 bg-white border-t border-gray-200">
          <h6>Grand Total:{`₹${(totalAmount - totalDiscount).toFixed(2)}`}</h6>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onHold} className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-yellow-800 bg-yellow-400 rounded-lg">
            <FaHandPaper /> Hold
          </button>
          <button onClick={() => onOpenModal("multiple")} className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white text-blue-800 bg-blue-400 rounded-lg">
            <FaLayerGroup /> Multiple
          </button>
          <button onClick={() => onOpenModal('cash')} className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-green-600 rounded-lg">
            <FaMoneyBill /> Cash
          </button>
          <button onClick={() => onOpenModal('bank')} className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-purple-600 rounded-lg">
            <FaCreditCard /> Bank
          </button>
        </div>
      </footer>


      {selectedItem && (
        <ItemDetailModal selectedItem={selectedItem} allItems={allItems} onClose={() => setSelectedItem(null)} />
      )}

      {isPaymentModalOpen && (
        <PaymentModal
          onClose={() => setIsPaymentModalOpen(false)}
          paymentMode={"multiple"}
          paymentTypes={paymentTypes}
          accounts={accounts}
          terminals={terminals}
          initialAdvance={advancePaymentAmount}
          initialAccount={selectedAccount}
          initialSummary={paymentSummary}
          selectedWarehouse={selectedWarehouse}
          onSubmit={({ paymentRows, couponCode, adjustAdvancePayment, advance, selectedAccount }) => {
            sendOrder(buildPayload({ status: 'Completed', payments: paymentRows, paymentMode }), currentOrderId ? 'put' : 'post', currentOrderId);
            setCouponCode(couponCode || '');
            setAdjustAdvancePayment(adjustAdvancePayment);
            setAdvancePaymentAmount(advance);
            setSelectedAccount(selectedAccount);
          }}
        />
      )}
    </div>
  );
}

// controllers/invoiceController.js
const Sales    = require("../models/Sales");
const PosOrder = require("../models/PosOrder");

exports.getAllInvoices = async (req, res) => {
  try {
    const [sales, pos] = await Promise.all([
      Sales.find().populate("customer","customerName").populate("warehouse","warehouseName").lean(),
      PosOrder.find().populate("customer","customerName").populate("warehouse","warehouseName").lean()
    ]);
    const mapWithStatus = (d, amountField) => {
      // sum up all embedded payments
      const totalPaid = (d.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      // paid if fully covered, else unpaid
      const paymentStatus = totalPaid >= d[amountField] ? "Paid" : "Unpaid";

      return {
        _id:          d._id,
        saleCode:     d.saleCode,
        saleDate:     amountField === "grandTotal" ? d.saleDate : d.createdAt,
        customer:     d.customer,
        warehouse:    d.warehouse,
        amount:       d[amountField],
        source:       amountField === "grandTotal" ? "Sale" : "POS",
        paymentStatus
      };
    };
    

    const unified = [
      ...sales.map(d => {
        const base = {
          _id:       d._id,
          saleCode:  d.saleCode,
          saleDate:  d.saleDate,
          customer:  d.customer,
          warehouse: d.warehouse,
          amount:    d.grandTotal,
          source:    "Sale"
        };
        const { paymentStatus } = mapWithStatus(d, "grandTotal");
        return { ...base, paymentStatus };
      }),
      ...pos.map(d => {
        const base = {
          _id:       d._id,
          saleCode:  d.saleCode,
          saleDate:  d.createdAt,
          customer:  d.customer,
          warehouse: d.warehouse,
          amount:    d.totalAmount,
          source:    "POS"
        };
        const { paymentStatus } = mapWithStatus(d, "totalAmount");
        return { ...base, paymentStatus };
      })
    ]
    .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));  // newest first

    res.json(unified);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

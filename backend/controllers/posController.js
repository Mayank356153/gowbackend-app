const PosOrder = require("../models/PosOrder");
const Warehouse = require("../models/warehouseModel");
const Customer = require("../models/customerDataModel");
const Item = require("../models/itemModel");
const PaymentType = require("../models/paymentTypeModel");
const DiscountCoupon = require("../models/discountCouponModel");
const { recordSale } = require("../services/recordSale");
const { updateInventory } = require('../helpers/inventory');


// Generate a unique payment code if none was provided
function generatePaymentCode(prefix = "PMT/2025/") {
  const randomNum = Math.floor(Math.random() * 9000) + 1000; // 4-digit
  return `${prefix}${randomNum}`;
}

exports.createOrder = async (req, res) => {
  try {
    let {
      warehouse,
      customer,
      items,
      totalAmount,
      totalDiscount = 0,
      payments,
      status,
      invoiceCount,
      previousBalance,
      couponCode,
      adjustAdvancePayment,
      advancePaymentAmount,
      account,
    } = req.body;

    // 1) Basic validation
    if (!warehouse || !customer || !items?.length || totalAmount == null || !payments?.length) {
      return res.status(400).json({ message: "Missing required fields!" });
    }

    // 2) Fetch warehouse & customer
    const [warehouseDoc, customerDoc] = await Promise.all([
      Warehouse.findById(warehouse).select("_id cashAccount"),
      Customer.findById(customer),
    ]);
    if (!warehouseDoc) return res.status(404).json({ message: "Warehouse not found!" });
    if (!customerDoc)  return res.status(404).json({ message: "Customer not found!"  });

    // 3) Coupon validation
    if (couponCode) {
      const cpn = await DiscountCoupon.findOne({ couponCode, status: "Active" });
      if (!cpn) return res.status(400).json({ message: "Invalid coupon code!" });
      if (new Date(cpn.expiryDate) < new Date()) {
        return res.status(400).json({ message: "Coupon expired!" });
      }
      const disc = cpn.couponType === "percentage"
        ? (totalAmount * cpn.value) / 100
        : cpn.value;
      totalDiscount += disc;
      totalAmount   -= disc;
    }

    // 4) Advance payment
    if (adjustAdvancePayment && advancePaymentAmount) {
      if (customerDoc.advanceBalance < advancePaymentAmount) {
        return res.status(400).json({ message: "Insufficient advance balance" });
      }
      customerDoc.advanceBalance -= advancePaymentAmount;
      await customerDoc.save();
      totalAmount -= advancePaymentAmount;
    }

    // 5) Payments validation & code generation
    let paid = 0;
    for (const p of payments) {
      const pt = await PaymentType.findById(p.paymentType);
      if (!pt) return res.status(404).json({ message: "Payment type not found!" });
      if (pt.paymentTypeName === "Bank" && !p.terminal) {
        return res.status(400).json({ message: "Bank payment requires terminal id" });
      }
      if (!p.paymentCode) {
        p.paymentCode = generatePaymentCode();
      }
      paid += p.amount;
    }

    // 6) Build validItems array (no stock mutation here)
    const validItems = [];
    for (const row of items) {
      const itemDoc = await Item.findById(row.item);
      if (!itemDoc) {
        return res.status(404).json({ message: `Item not found: ${row.item}` });
      }

      // If it's a variant, ensure it exists
      let variantId = null;
      if (itemDoc.itemGroup === "Variant") {
        if (!row.variant) {
          return res.status(400).json({
            message: `Variant ID required for item ${itemDoc.itemName}`
          });
        }
        const variant = itemDoc.variants.id(row.variant);
        if (!variant) {
          return res.status(404).json({
            message: `Variant ${row.variant} not found in item ${row.item}`
          });
        }
        variantId = variant._id;
      }

      validItems.push({
        item:     itemDoc._id,
        variant:  variantId,
        quantity: row.quantity,
        price:    row.price,
        discount: row.discount || 0,
        tax:      row.tax || null,
        subtotal: row.subtotal,
      });
    }

    // 7) Compute balanceDue / changeReturn / isPaid
    const balanceDue   = paid < totalAmount ? totalAmount - paid : 0;
    const changeReturn = paid > totalAmount ? paid - totalAmount : 0;
    const isPaid       = balanceDue === 0;

    // 8) Persist the PosOrder
    const order = await PosOrder.create({
      warehouse,
      customer,
      account,
      items:         validItems,
      totalAmount,
      totalDiscount,
      payments,
      status:        status || "Pending",
      invoiceCount,
      previousBalance,
      couponCode,
      balanceDue,
      changeReturn,
      advanceUsed:   adjustAdvancePayment ? advancePaymentAmount : 0,
      isPaid,
    });

    // 9) Update inventory ledger for each sold line (negative qty)
    for (const row of validItems) {
      const inventoryItemId = row.variant ?? row.item;
      await updateInventory(warehouse, inventoryItemId, -Number(row.quantity));
    }

    // 10) Record sale in payments ledger
    await recordSale({
      warehouseId: warehouse,
      payments:    order.payments,
      referenceId: order._id,
      refModel:    "PosOrder"
    });

    return res.status(201).json({
      message: "Order created successfully!",
      order
    });

  } catch (err) {
    console.error("createOrder error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// controllers/posController.js

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    let {
      warehouse,
      customer,
      items,
      totalAmount,
      totalDiscount = 0,
      payments = [],
      status,
      invoiceCount,
      previousBalance,
      couponCode,
      adjustAdvancePayment,
      advancePaymentAmount,
      account,
    } = req.body;

    // 1) Basic validation
    if (!warehouse || !customer || !items?.length || totalAmount == null || !payments.length) {
      return res.status(400).json({ message: "Missing required fields!" });
    }

    // 2) Fetch existing order to roll back its inventory
    const existing = await PosOrder.findById(id).lean();
    if (!existing) return res.status(404).json({ message: "Order not found" });

    // 3) Roll back inventory for the old items
    for (const oldRow of existing.items) {
      const inventoryItemId = oldRow.variant ?? oldRow.item;
      // add back what was sold
      await updateInventory(existing.warehouse, inventoryItemId, Number(oldRow.quantity));
    }

    // 4) Fetch & validate warehouse + customer
    const [warehouseDoc, customerDoc] = await Promise.all([
      Warehouse.findById(warehouse).select("_id"),
      Customer.findById(customer),
    ]);
    if (!warehouseDoc) return res.status(404).json({ message: "Warehouse not found" });
    if (!customerDoc)  return res.status(404).json({ message: "Customer not found" });

    // 5) Coupon & advance-payment adjustments
    let newTotalAmount   = totalAmount;
    let newTotalDiscount = totalDiscount;
    if (couponCode) {
      const cpn = await DiscountCoupon.findOne({ couponCode, status: "Active" });
      if (!cpn) return res.status(400).json({ message: "Invalid coupon code" });
      if (new Date(cpn.expiryDate) < new Date()) {
        return res.status(400).json({ message: "Coupon expired" });
      }
      const disc = cpn.couponType === "percentage"
        ? (newTotalAmount * cpn.value) / 100
        : cpn.value;
      newTotalDiscount += disc;
      newTotalAmount   -= disc;
    }
    if (adjustAdvancePayment && advancePaymentAmount) {
      if (customerDoc.advanceBalance < advancePaymentAmount) {
        return res.status(400).json({ message: "Insufficient advance balance" });
      }
      customerDoc.advanceBalance -= advancePaymentAmount;
      await customerDoc.save();
      newTotalAmount -= advancePaymentAmount;
    }

    // 6) Normalize payments so they sum to newTotalAmount
    {
      const sumPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      if (sumPaid !== newTotalAmount) {
        if (payments.length === 1) {
          payments[0].amount = newTotalAmount;
        } else {
          payments.forEach(p => {
            const ratio = (p.amount||0) / (sumPaid||1);
            p.amount = Math.round(ratio * newTotalAmount * 100) / 100;
          });
        }
      }
    }

    // 7) Payment-type validation & code gen
    let paid = 0;
    for (const p of payments) {
      const pt = await PaymentType.findById(p.paymentType);
      if (!pt) return res.status(404).json({ message: "Payment type not found" });
      if (pt.paymentTypeName === "Bank" && !p.terminal) {
        return res.status(400).json({ message: "Bank payment requires terminal id" });
      }
      if (!p.paymentCode) {
        p.paymentCode = generatePaymentCode();
      }
      paid += p.amount;
    }

    // 8) Build new validItems (no direct stock mutation here)
    const validItems = [];
    for (const row of items) {
      const itemDoc = await Item.findById(row.item);
      if (!itemDoc) {
        return res.status(404).json({ message: `Item not found: ${row.item}` });
      }

      let variantId = null;
      if (itemDoc.itemGroup === "Variant") {
        if (!row.variant) {
          return res.status(400).json({ message: `Variant ID required for ${itemDoc.itemName}` });
        }
        const variant = itemDoc.variants.id(row.variant);
        if (!variant) {
          return res.status(404).json({ message: `Variant not found: ${row.variant}` });
        }
        variantId = variant._id;
      }

      validItems.push({
        item:     itemDoc._id,
        variant:  variantId,
        quantity: row.quantity,
        price:    row.price,
        discount: row.discount || 0,
        tax:      row.tax || null,
        subtotal: row.subtotal,
      });
    }

    // 9) Compute balanceDue / changeReturn / isPaid
    const balanceDue   = paid < newTotalAmount ? newTotalAmount - paid : 0;
    const changeReturn = paid > newTotalAmount ? paid - newTotalAmount : 0;
    const isPaid       = balanceDue === 0;

    // 10) Persist the updated order
    const updated = await PosOrder.findByIdAndUpdate(
      id,
      {
        warehouse,
        customer,
        account,
        items:         validItems,
        totalAmount:   newTotalAmount,
        totalDiscount: newTotalDiscount,
        payments,
        status:        status || "Pending",
        invoiceCount,
        previousBalance,
        couponCode,
        balanceDue,
        changeReturn,
        advanceUsed:   adjustAdvancePayment ? advancePaymentAmount : 0,
        isPaid,
      },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 11) Apply new inventory deductions
    for (const row of validItems) {
      const inventoryItemId = row.variant ?? row.item;
      await updateInventory(warehouse, inventoryItemId, -Number(row.quantity));
    }

    // 12) Rewrite the payment ledger
    await recordSale({
      warehouseId: warehouse,
      payments:    updated.payments,
      referenceId: updated._id,
      refModel:    "PosOrder",
    });

    return res.json({ message: "Order updated successfully!", order: updated });
  }
  catch (err) {
    console.error("updateOrder error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


exports.getAllOrders = async (req, res) => {
  try {
    const orders = await PosOrder.find()
      .populate("warehouse customer")
      .populate("payments.paymentType", "paymentTypeName")
      .populate({ path: "items.item" });
    res.status(200).json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await PosOrder.findById(req.params.id)
      .populate("warehouse customer")
      .populate("payments.paymentType", "paymentTypeName")
      .populate({ path: "items.item" });
    if (!order) return res.status(404).json({ message: "Order not found!" });
    res.status(200).json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await PosOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found!" });
    await PosOrder.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Order deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
// controllers/pos.js
exports.updateOrderPaymentType = async (req, res) => {
  try {
    const { paymentType } = req.body;
    if (!paymentType) {
      return res.status(400).json({ message: "paymentType is required" });
    }

    const order = await PosOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!order.payments.length) {
      return res.status(400).json({ message: "No payments to update" });
    }

    order.payments[0].paymentType = paymentType;
    await order.save();
    await recordSale({
           warehouseId:  order.warehouse,
           payments:     order.payments,
           referenceId:  order._id,
           refModel:     "PosOrder"
         });

    return res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

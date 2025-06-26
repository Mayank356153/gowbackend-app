// controllers/purchaseController.js

const Purchase = require("../models/purchaseModel");
const Warehouse = require("../models/warehouseModel");
const Supplier = require("../models/supplierModel");
const PaymentType = require("../models/paymentTypeModel");
const Item = require("../models/itemModel");
const { updateInventory } = require("../helpers/inventory");
const { recordSale }     = require("../services/recordSale");




// 1) Create a Normal Purchase
exports.createPurchase = async (req, res) => {
  try {
    const { warehouse, supplier, referenceNo, items, purchaseDate, grandTotal, payments = [] } = req.body;

    // 1) Basic validations
    if (!warehouse || !supplier || !purchaseDate || !grandTotal || !items?.length) {
      return res.status(400).json({ success: false, message: "Missing required fields or items are empty" });
    }
    if (!req.user || !req.user.id) {
      return res.status(400).json({ success: false, message: "User ID not found in request" });
    }

    // 2) Validate items and variants, and sanitize purchasePrice
    const sanitizedItems = [];
    for (const row of items) {
      const item = await Item.findById(row.item);
      if (!item) {
        return res.status(404).json({ success: false, message: `Item not found: ${row.item}` });
      }

      if (item.itemGroup === "Variant" && !row.variant) {
        return res.status(400).json({
          success: false,
          message: `Variant ID required for item ${item.itemName} (ID: ${row.item}) with itemGroup 'Variant'`,
        });
      }
      if (item.itemGroup === "Variant") {
        const variant = item.variants.id(row.variant);
        if (!variant) {
          return res.status(404).json({
            success: false,
            message: `Variant ${row.variant} not found in item ${item.itemName} (ID: ${row.item})`,
          });
        }
      }

      sanitizedItems.push({
        item: item._id,
        variant: row.variant || null,
        quantity: row.quantity || 1,
        purchasePrice: row.purchasePrice != null ? row.purchasePrice : (row.unitCost != null ? row.unitCost : 0),
        mrp: row.mrp || 0,
        salesPrice: row.salesPrice || 0,
        discount: row.discount || 0,
        totalAmount: row.totalAmount || 0,
        expiryDate: row.expiryDate || null,
      });
    }

    // 3) Create purchase object with only required fields
    const purchaseData = {
      warehouse,
      supplier,
      referenceNo,
      purchaseDate,
      grandTotal,
      items: sanitizedItems,
      createdBy: req.user.id,
      createdByModel: req.user.role.toLowerCase() === "admin" ? "Admin" : "User",
      isReturn: false,
      status: "Normal",
      otherCharges: req.body.otherCharges || 0,
      discountOnAll: req.body.discountOnAll || 0,
      note: req.body.note || "",
      payments: req.body.payments || [],
    };

    console.log("✅ Purchase Data Before Saving:", purchaseData);

    // 4) Save purchase
    const newPurchase = new Purchase(purchaseData);
    await newPurchase.save();

    // 5) Update inventory for each line
    for (const row of sanitizedItems) {
      const inventoryItemId = row.variant || row.item;
      await updateInventory(warehouse, inventoryItemId, Number(row.quantity));
    }
    const negativePayments = payments.map(p => ({
     ...p,
     amount: -(p.amount || 0)   // make it negative
   }));
   await recordSale({
     warehouseId: warehouse,
     payments:    negativePayments,
     referenceId: newPurchase._id,
     refModel:    "Purchase"
   });

    return res.status(201).json({
      success: true,
      message: "Purchase created successfully",
      data: newPurchase,
    });
  } catch (error) {
    console.error("Error creating purchase:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
// 2) Create a Purchase Return or Cancel
exports.createPurchaseReturn = async (req, res) => {
  try {
    const {
      originalPurchaseRef,
      warehouse,
      supplier,
      referenceNo,
      purchaseDate,
      status,
      items: rows,
      otherCharges,
      discountCouponCode,
      couponType,
      couponValue,
      discountOnAll,
      note,
      payments = [],
    } = req.body;

    // Validations
    if (
      !originalPurchaseRef ||
      !warehouse ||
      !supplier ||
      !referenceNo ||
      !purchaseDate ||
      !status ||
      !rows?.length
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields or items are empty" });
    }
    if (!req.user?.id) {
      return res.status(400).json({ success: false, message: "User ID not found in request" });
    }

    // Find original purchase
    const original = await Purchase.findOne({
      referenceNo: originalPurchaseRef,
      supplier,
      warehouse,
      isReturn: false,
      status: "Normal",
    });
    if (!original) {
      return res
        .status(400)
        .json({ success: false, message: "No valid purchase found to return items" });
    }

    // Build return items array
    const validItems = [];
    for (const row of rows) {
      const { item: parentId, variant, quantity = 0, reason = "", purchasePrice, salesPrice } = row;

      if (purchasePrice == null || salesPrice == null) {
        return res
          .status(400)
          .json({ success: false, message: "Each returned item must include purchasePrice & salesPrice" });
      }

      if (variant) {
        // Variant return
        const parent = await Item.findById(parentId);
        const v      = parent?.variants.id(variant);
        if (!parent || !v) {
          return res
            .status(404)
            .json({ success: false, message: `Variant ${variant} not found in item ${parentId}` });
        }
        validItems.push({
          item:        parent._id,
          variant:     v._id,
          quantity,
          reason,
          purchasePrice,
          salesPrice,
          totalAmount: purchasePrice * quantity,
          expiryDate: row.expiryDate || null,
        });
      } else {
        // Non-variant return
        const it = await Item.findById(parentId);
        if (!it) {
          return res
            .status(404)
            .json({ success: false, message: `Item not found: ${parentId}` });
        }
        validItems.push({
          item:        it._id,
          variant:     null,
          quantity,
          reason,
          purchasePrice,
          salesPrice,
          totalAmount: purchasePrice * quantity,
          expiryDate: row.expiryDate || null,
        });
      }
    }

    // Attach creator metadata and return info
    req.body.createdBy          = req.user.id;
    req.body.createdByModel     = req.user.role.toLowerCase() === "admin" ? "Admin" : "User";
    req.body.referenceNo        = referenceNo;
    req.body.purchaseDate       = purchaseDate;
    req.body.items              = validItems;
    req.body.isReturn           = true;
    req.body.status             = status;
    req.body.otherCharges       = otherCharges;
    req.body.discountOnAll      = discountOnAll;
    req.body.discountCouponCode = discountCouponCode;
    req.body.couponType         = couponType;
    req.body.couponValue        = couponValue;
    req.body.note               = note;
    req.body.payments           = payments;
    req.body.grandTotal         =
      validItems.reduce((sum, i) => sum + i.totalAmount, 0) +
      (otherCharges || 0) -
      (discountOnAll || 0);

    console.log("✅ Return Data Before Saving:", req.body);

    // Persist return
    const newReturn = new Purchase(req.body);
    await newReturn.save();

    // **Subtract** returned quantities from inventory
    for (const row of validItems) {
      const inventoryItemId = row.variant || row.item;
      // negative quantity to decrement stock
      await updateInventory(warehouse, inventoryItemId, -Number(row.quantity));
    }
    await recordSale({
     warehouseId: warehouse,
     payments:    payments,            // same payments array from your request body
     referenceId: newReturn._id,
     refModel:    "Purchase"
   });

    return res.status(201).json({
      success: true,
      message:
        status === "Return"
          ? "Purchase Return created successfully"
          : "Purchase cancellation recorded successfully",
      data: newReturn,
    });
  } catch (error) {
    console.error("Error creating purchase return:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
// 3) Get All Normal Purchases (with Summary)
exports.getAllPurchases = async (req, res) => {
  try {
    // A) Aggregation for summary
    // 1. Count how many normal purchases exist
    const totalInvoices = await Purchase.countDocuments({ isReturn: false });

    // 2. Sum up grandTotal for all normal purchases
    const invoiceAmountAgg = await Purchase.aggregate([
      { $match: { isReturn: false } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);
    const totalInvoiceAmount = invoiceAmountAgg.length ? invoiceAmountAgg[0].total : 0;

    // 3. Sum all payments for normal purchases
    const paymentsAgg = await Purchase.aggregate([
      { $match: { isReturn: false } },
      { $unwind: "$payments" },
      { $group: { _id: null, total: { $sum: "$payments.amount" } } },
    ]);
    const totalPaidAmount = paymentsAgg.length ? paymentsAgg[0].total : 0;

    // 4. Total purchase due
    const totalPurchaseDue = totalInvoiceAmount - totalPaidAmount;

    // B) Fetch the list of normal purchases
    const purchases = await Purchase.find({ isReturn: false })
      .populate("warehouse", "warehouseName")
      .populate("supplier", "name email")
      .populate("items.item", "itemName salesPrice")
      .populate("payments.paymentType", "paymentTypeName")
      .populate("createdBy"); // Explicit fields

    // Process each purchase to add a computed 'creatorName' field
    const processedPurchases = purchases.map((purchase) => {
      let creatorName = "";
      if (purchase.createdBy) {
        if (purchase.createdByModel === "Admin" && purchase.createdBy.name) {
          creatorName = purchase.createdBy.name;
        } else if (purchase.createdBy.FirstName && purchase.createdBy.LastName) {
          creatorName = `${purchase.createdBy.FirstName} ${purchase.createdBy.LastName}`;
        }
      }
      return {
        ...purchase.toObject(),
        creatorName,
      };
    });

    // C) Return summary + list using processedPurchases
    return res.status(200).json({
      success: true,
      summary: {
        totalInvoices,
        totalInvoiceAmount,
        totalPaidAmount,
        totalPurchaseDue,
      },
      data: processedPurchases,
    });
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 4) Get All Purchase Returns (with Summary)
exports.getAllPurchaseReturns = async (req, res) => {
  try {
    // A) Aggregation for summary
    // 1. Count how many return invoices exist
    const totalReturnInvoices = await Purchase.countDocuments({ isReturn: true });

    // 2. Sum up grandTotal for all returns
    const returnAmountAgg = await Purchase.aggregate([
      { $match: { isReturn: true } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]);
    const totalReturnInvoiceAmount = returnAmountAgg.length ? returnAmountAgg[0].total : 0;

    // 3. Sum all payments for return purchases
    const paymentsAgg = await Purchase.aggregate([
      { $match: { isReturn: true } },
      { $unwind: "$payments" },
      { $group: { _id: null, total: { $sum: "$payments.amount" } } },
    ]);
    const totalReturnPaidAmount = paymentsAgg.length ? paymentsAgg[0].total : 0;

    // 4. Total purchase return due
    const totalReturnDue = totalReturnInvoiceAmount - totalReturnPaidAmount;

    // B) Fetch the list of return purchases
    const returns = await Purchase.find({ isReturn: true })
      .populate("warehouse", "warehouseName")
      .populate("supplier", "name email")
      .populate("items.item", "itemName salesPrice")
      .populate("payments.paymentType", "paymentTypeName")
      .populate("createdBy"); // populate full document

    // Process each purchase to add a computed 'creatorName' field
    const processedReturns = returns.map(purchase => {
      let creatorName = "";
      if (purchase.createdBy) {
        if (purchase.createdByModel === "Admin" && purchase.createdBy.name) {
          creatorName = purchase.createdBy.name;
        } else if (purchase.createdBy.FirstName && purchase.createdBy.LastName) {
          creatorName = `${purchase.createdBy.FirstName} ${purchase.createdBy.LastName}`;
        }
      }
      return {
        ...purchase.toObject(),
        creatorName,
      };
    });

    // C) Return summary + list using processedReturns
    return res.status(200).json({
      success: true,
      summary: {
        totalReturnInvoices,
        totalReturnInvoiceAmount,
        totalReturnPaidAmount,
        totalReturnDue,
      },
      data: processedReturns,
    });
  } catch (error) {
    console.error("Error fetching purchase returns:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 5) Get a Single Purchase by ID
exports.getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate("warehouse", "warehouseName")
      .populate("supplier", "name email")
      .populate("items.item", "itemName salesPrice")
      .populate("payments.paymentType", "paymentTypeName")
      .populate("createdBy"); // populate full document

    if (!purchase) {
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }

    // Compute creatorName directly for the single purchase
    let creatorName = "";
    if (purchase.createdBy) {
      if (purchase.createdByModel === "Admin" && purchase.createdBy.name) {
        creatorName = purchase.createdBy.name;
      } else if (purchase.createdBy.FirstName && purchase.createdBy.LastName) {
        creatorName = `${purchase.createdBy.FirstName} ${purchase.createdBy.LastName}`;
      }
    }

    const processedPurchase = { ...purchase.toObject(), creatorName };

    return res.status(200).json({ success: true, data: processedPurchase });
  } catch (error) {
    console.error("Error fetching purchase:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 6) Update a Purchase
exports.updatePurchase = async (req, res) => {
  try {
    const purchaseId = req.params.id;

    // ② Destructure everything from req.body, defaulting `payments` to an empty array if it’s not sent:
    const {
      warehouse,
      supplier,
      referenceNo,
      purchaseDate,
      grandTotal,
      items: incomingItems,
      otherCharges = 0,
      discountOnAll = 0,
      discountCouponCode,
      couponType,
      couponValue,
      note,
      payments = [],        // ← if client omitted “payments”, we treat it as []
      isReturn = false,
      status,
    } = req.body;

    // 1) Fetch the existing Purchase so we can roll back its inventory
    const existing = await Purchase.findById(purchaseId).lean();
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase not found" });
    }

    // 2) Roll back inventory for each previously‐saved line
    for (const oldRow of existing.items) {
      // if it was a normal purchase, we previously “added” stock; to roll back we “add the negative” = subtract
      const inventoryItemId = oldRow.variant || oldRow.item;
      await updateInventory(existing.warehouse, inventoryItemId, Number(oldRow.quantity));
    }

    // 3) Validate required fields exactly as in createPurchase
    if (!warehouse || !supplier || !purchaseDate || !incomingItems?.length) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields or items are empty" });
    }

    // 4) Fetch & validate Warehouse and Supplier
    const [warehouseDoc, supplierDoc] = await Promise.all([
      Warehouse.findById(warehouse).select("_id"),
      Supplier.findById(supplier).select("_id"),
    ]);
    if (!warehouseDoc) return res.status(404).json({ success: false, message: "Warehouse not found" });
    if (!supplierDoc) return res.status(404).json({ success: false, message: "Supplier not found" });

    // 5) Recalculate discountCouponCode if present (same as in create)
    let newGrandTotal     = Number(grandTotal);
    let newDiscountOnAll  = Number(discountOnAll);
    if (discountCouponCode) {
      const cpn = await DiscountCoupon.findOne({
        couponCode: discountCouponCode,
        status: "Active"
      });
      if (!cpn) {
        return res.status(400).json({ success: false, message: "Invalid coupon code" });
      }
      if (new Date(cpn.expiryDate) < new Date()) {
        return res.status(400).json({ success: false, message: "Coupon expired" });
      }
      const discAmount = cpn.couponType === "percentage"
        ? (newGrandTotal * cpn.value) / 100
        : cpn.value;
      newDiscountOnAll += discAmount;
      newGrandTotal    -= discAmount;
    }

    // 6) Validate & sanitize incomingItems exactly as you did in createPurchase
    const sanitizedItems = [];
    for (const row of incomingItems) {
      const itemDoc = await Item.findById(row.item);
      if (!itemDoc) {
        return res.status(404).json({
          success: false,
          message: `Item not found: ${row.item}`
        });
      }

      // If it’s a Variant, row.variant must be present
      let variantId = null;
      if (itemDoc.itemGroup === "Variant") {
        if (!row.variant) {
          return res.status(400).json({
            success: false,
            message: `Variant ID required for item ${itemDoc.itemName} (ID: ${row.item})`
          });
        }
        const v = itemDoc.variants.id(row.variant);
        if (!v) {
          return res.status(404).json({
            success: false,
            message: `Variant ${row.variant} not found in item ${row.item}`
          });
        }
        variantId = v._id;
      }

      sanitizedItems.push({
        item:         itemDoc._id,
        variant:      variantId,
        quantity:     row.quantity || 1,
        purchasePrice: row.purchasePrice != null
          ? row.purchasePrice
          : (row.unitCost != null ? row.unitCost : 0),
        mrp:          row.mrp || 0,
        salesPrice:   row.salesPrice || 0,
        discount:     row.discount || 0,
        totalAmount:  row.totalAmount || 0,
        expiryDate:   row.expiryDate || null
      });
    }

    // 7) Validate & normalize `payments` (just like in createPurchase)
    //    We also compute sumPaid, generate a paymentCode if missing, etc.
    let sumPaid = 0;
    for (const p of payments) {
      const pt = await PaymentType.findById(p.paymentType);
      if (!pt) {
        return res.status(404).json({ success: false, message: "Payment type not found" });
      }
      // If “Bank” payment type requires a terminal, enforce it here:
      if (pt.paymentTypeName === "Bank" && !p.terminal) {
        return res.status(400).json({ success: false, message: "Bank payment requires terminal id" });
      }
      // If the client didn’t supply a paymentCode, generate one:
      if (!p.paymentCode) {
        p.paymentCode = `PMT/${new Date().getFullYear()}/${Math.floor(Math.random() * 9000 + 1000)}`;
      }
      sumPaid += Number(p.amount || 0);
    }

    // 8) Recalculate balanceDue, changeReturn, isPaid if you track them
    const balanceDue   = sumPaid < newGrandTotal ? newGrandTotal - sumPaid : 0;
    const changeReturn = sumPaid > newGrandTotal ? sumPaid - newGrandTotal : 0;
    const isPaid       = balanceDue === 0;

    // 9) Build the updated Purchase object exactly as you wish
    const updatedData = {
      warehouse,
      supplier,
      referenceNo,
      purchaseDate,
      grandTotal:    newGrandTotal,
      items:         sanitizedItems,
      otherCharges,
      discountOnAll: newDiscountOnAll,
      discountCouponCode,
      couponType,
      couponValue,
      note,
      payments,
      isReturn,
      status:        status || (isReturn ? "Return" : "Normal"),
      balanceDue,
      changeReturn,
      // …any other fields (e.g. modifiedBy) you usually store
    };

    // 10) Persist the updated document
    const updatedPurchase = await Purchase.findByIdAndUpdate(
      purchaseId,
      updatedData,
      { new: true }
    );
    if (!updatedPurchase) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase not found" });
    }

    // 11) Re‐apply inventory deductions FOR THE “new” items
    //     (If isReturn: we subtract quantities; if normal: we add quantities.)
    for (const row of sanitizedItems) {
      const inventoryItemId = row.variant || row.item;
      const delta = isReturn
        ? -Number(row.quantity)    // a return → remove stock
        : Number(row.quantity);    // a normal purchase → add stock
      await updateInventory(warehouse, inventoryItemId, delta);
    }

    // 12) Rewrite the payment ledger ENTRIES
    //     Since updatedPurchase.payments now describes how much the user actually paid,
    //     we want to “reverse” any old ledger entries (we already deleted/rolled‐back them in step 2)
    //     and then write brand‐new ones. Because this is a “purchase,” we flip the sign of each payment
    //     so that a positive cash payment (e.g. 100) becomes a ledger entry of type CASH_SALE / BANK_SALE
    //     with amount = -100. That way, your CashSummary (which just sums all CASH_SALE entries) will
    //     subtract these purchase payments from the cash total.
    const negativePayments = updatedPurchase.payments.map(p => ({
      ...p,
      amount: -(Number(p.amount) || 0)    // flip to negative
    }));

    await recordSale({
      warehouseId: warehouse,
      payments:    negativePayments,
      referenceId: updatedPurchase._id,
      refModel:    "Purchase"
    });

    // 13) Return the updated purchase
    return res.status(200).json({
      success: true,
      message: "Purchase updated successfully",
      data: updatedPurchase
    });
  }
  catch (err) {
    console.error("Error updating purchase:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// 7) Delete a Purchase
exports.deletePurchase = async (req, res) => {
  try {
    const deletedPurchase = await Purchase.findByIdAndDelete(req.params.id);
    if (!deletedPurchase) {
      return res.status(404).json({ success: false, message: "Purchase not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Purchase deleted successfully" });
  } catch (error) {
    console.error("Error deleting purchase:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


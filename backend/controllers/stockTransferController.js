const mongoose = require("mongoose");
const StockTransfer = require("../models/stockTransferModel");
const Warehouse = require("../models/warehouseModel");
const Item = require("../models/itemModel");
const Inventory = require("../models/inventoryModel");

// Helper function to update the inventory ledger for a specific (warehouse, item) pair.
async function updateInventory(warehouseId, itemId, quantityDelta) {
  const updatedRecord = await Inventory.findOneAndUpdate(
    {
      warehouse: new mongoose.Types.ObjectId(warehouseId),
      item: new mongoose.Types.ObjectId(itemId)
    },
    {
      $inc: { quantity: quantityDelta },
      $set: { lastUpdated: new Date() }
    },
    { new: true, upsert: true } // upsert creates the record if it doesn't exist.
  );
  return updatedRecord;
}

// CREATE Stock Transfer
exports.createStockTransfer = async (req, res) => {
  try {
    const { transferDate, fromWarehouse, toWarehouse, items, note, details, createdBy } = req.body;

    if (!transferDate || !fromWarehouse || !toWarehouse || !items || items.length === 0) {
      return res.status(400).json({ success: false, message: "Missing required fields or items are empty" });
    }

    if (fromWarehouse === toWarehouse) {
      return res.status(400).json({ success: false, message: "Cannot transfer to the same warehouse" });
    }

    // Create a new stock transfer document.
    const newTransfer = new StockTransfer({
      transferDate,
      fromWarehouse,
      toWarehouse,
      items,
      note,
      details,
      createdBy
    });

    await newTransfer.save();

    // Update the inventory ledger for each transferred item.
    for (const transferItem of items) {
      // Decrease stock from the sending warehouse.
      await updateInventory(fromWarehouse, transferItem.item, -transferItem.quantity);
      // Increase stock in the receiving warehouse.
      await updateInventory(toWarehouse, transferItem.item, transferItem.quantity);
    }

    return res.status(201).json({
      success: true,
      message: "Stock transfer created successfully",
      data: newTransfer,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET All Stock Transfers
exports.getAllStockTransfers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.fromWarehouse) filter.fromWarehouse = req.query.fromWarehouse;
    if (req.query.toWarehouse) filter.toWarehouse = req.query.toWarehouse;

    // const transfers = await StockTransfer.find(filter)
    //   .populate("fromWarehouse", "warehouseName")
    //   .populate("toWarehouse", "warehouseName")
    //   .populate("items.item", "itemName salesPrice category brand ")
    //   .populate("items.item.brand", "brandName")
    //   .populate("items.item.category", "categoryName")
    const transfers = await StockTransfer.find(filter)
  .populate("fromWarehouse", "warehouseName")
  .populate("toWarehouse", "warehouseName")
  .populate({
    path: "items.item",
    select: "itemName salesPrice category brand barcode",
    populate: [
      { path: "brand", select: "brandName" },
      { path: "category", select: "name" },
    ],
  });

    return res.status(200).json({ success: true, data: transfers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET Single Stock Transfer
exports.getStockTransferById = async (req, res) => {
  try {
    const transfer = await StockTransfer.findById(req.params.id)
      .populate("fromWarehouse", "warehouseName")
      .populate("toWarehouse", "warehouseName")
      .populate("items.item", "itemName salesPrice");
    if (!transfer) {
      return res.status(404).json({ success: false, message: "Stock transfer not found" });
    }
    return res.status(200).json({ success: true, data: transfer });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE Stock Transfer
exports.updateStockTransfer = async (req, res) => {
  try {
    const transferId = req.params.id;
    const { fromWarehouse: newFrom, toWarehouse: newTo, items: newItems } = req.body;

    // 1️⃣ Fetch the old transfer
    const oldTransfer = await StockTransfer.findById(transferId).lean();
    if (!oldTransfer) {
      return res.status(404).json({ success: false, message: "Stock transfer not found" });
    }

    // 2️⃣ Reverse the old movements
    for (const line of oldTransfer.items) {
      // add back to the original sender
      await updateInventory(oldTransfer.fromWarehouse, line.item, +line.quantity);
      // subtract back from the original receiver
      await updateInventory(oldTransfer.toWarehouse,   line.item, -line.quantity);
    }

    // 3️⃣ Update the transfer record
    const updated = await StockTransfer.findByIdAndUpdate(
      transferId,
      { ...req.body }, // assumes you send transferDate, fromWarehouse, toWarehouse, items, etc.
      { new: true }
    )
      .populate("fromWarehouse", "warehouseName")
      .populate("toWarehouse", "warehouseName")
      .populate("items.item",    "itemName salesPrice");

    // 4️⃣ Apply the new movements
    for (const line of updated.items) {
      // subtract from the new sender
      await updateInventory(newFrom, line.item, -line.quantity);
      // add to the new receiver
      await updateInventory(newTo,   line.item, +line.quantity);
    }

    return res.status(200).json({
      success: true,
      message: "Stock transfer updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating stock transfer:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE Stock Transfer
exports.deleteStockTransfer = async (req, res) => {
  try {
    // NOTE: Reversing ledger updates for deletion is not implemented here.
    // A complete solution would require adding ledger update logic to reverse the transfer.
    const deletedTransfer = await StockTransfer.findByIdAndDelete(req.params.id);
    if (!deletedTransfer) {
      return res.status(404).json({ success: false, message: "Stock transfer not found" });
    }
    return res.status(200).json({ success: true, message: "Stock transfer deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getInventoryByWarehouse = async (req, res) => {
  const records = await Inventory.find({ warehouse: req.query.warehouse })
    .populate("item", "itemName itemCode barcode");
  res.json(records);
};

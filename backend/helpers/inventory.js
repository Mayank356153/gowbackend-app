// helpers/inventory.js
const mongoose  = require('mongoose');
const Inventory = require('../models/inventoryModel');

async function updateInventory(warehouseId, itemId, quantityDelta) {
  return Inventory.findOneAndUpdate(
    {
      warehouse: new mongoose.Types.ObjectId(warehouseId),
      item:      new mongoose.Types.ObjectId(itemId),
    },
    { 
      $inc:   { quantity: quantityDelta },
      $set:   { lastUpdated: new Date() }
    },
    { new: true, upsert: true }
  );
}

module.exports = { updateInventory };


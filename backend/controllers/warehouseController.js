// controllers/warehouseController.js

const mongoose        = require('mongoose');
const Warehouse       = require('../models/warehouseModel');
const Store           = require('../models/storeModel');
const Account         = require('../models/accountModel');
const StockAdjustment = require('../models/stockAdjustmentModel');
const StockTransfer   = require('../models/stockTransferModel');
const Inventory       = require('../models/inventoryModel');
const Terminal  = require('../models/terminalModel');
const Item = require('../models/itemModel');
const Purchase = require('../models/purchaseModel');


/**
 * Create a new warehouse.
 * Admins may supply `store`; non-admins are locked to their own.
 * Auto-creates a cash account under the store if none is passed.
 * Supports optional TID and QR upload (via multer → req.file).
 */

exports.createWarehouse = async (req, res) => {
  let autoAcc, autoTerm;

  console.log('▶️ req.body:', req.body);
  console.log('▶️ req.file:', req.file);

  try {
    // 1) Destructure incoming fields
    const {
      warehouseName,
      mobile,
      email,
      status,
      Latitude,
      Longitude,
      cashAccount: incomingCashAcc,
      terminalId,
      tid: incomingTid,
      store: incomingStore
    } = req.body;

    // 2) Determine storeId
    let storeId;
    if (req.user.role.toLowerCase() === 'admin' && incomingStore) {
      storeId = incomingStore;
    } else {
      storeId = Array.isArray(req.user.stores)
        ? req.user.stores[0]
        : req.user.store;
    }
    if (!storeId) {
      return res.status(400).json({ success: false, message: 'Store ID is required' });
    }

    // 3) Build GeoJSON location
    const location = {
      type: 'Point',
      coordinates: [ Number(Longitude), Number(Latitude) ]
    };

    // 4) Select or auto-create cashAccount
    let cashAccount = incomingCashAcc;
    if (!cashAccount) {
      const store = await Store.findById(storeId);
      if (!store) throw new Error('Invalid store');
      autoAcc = new Account({
        parentAccount:  store.storeAccount,
        accountNumber:  `CASH-${Date.now()}`,
        accountName:    `${warehouseName} Cash`,
        openingBalance: 0,
        note:           '',
        createdBy:      req.user.id,
        createdByModel: req.user.role.toLowerCase() === 'admin' ? 'Admin' : 'User'
      });
      const savedAcc = await autoAcc.save();
      cashAccount = savedAcc._id;
    }

    // 5) Handle optional QR upload
    const qrCodePath = req.file
      ? `/uploads/qr/${req.file.filename}`
      : null;

    // 6) Create the warehouse (initially without terminal link)
    let wh = await Warehouse.create({
      warehouseName,
      mobile,
      email,
      status,
      Latitude,
      Longitude,
      location,
      cashAccount,
      store: storeId
    });

    // 7) Select or auto-create Terminal
    let term;
    if (terminalId) {
      term = await Terminal.findById(terminalId);
      if (!term) throw new Error('Invalid terminalId');
      term.warehouse = wh._id;
      await term.save();
    } else {
      if (!incomingTid) throw new Error('tid is required when no terminalId provided');
      autoTerm = new Terminal({
        tid:         incomingTid,
        qrCodePath,
        warehouse:   wh._id,
        createdBy:   req.user.id
      });
      term = await autoTerm.save();
    }

    // 8) Link terminal back onto warehouse
    wh.terminal = term._id;
    wh.tid      = term.tid;
    wh.qrCode   = term.qrCodePath;
    await wh.save();

    return res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      data: { warehouse: wh, terminal: term }
    });

  } catch (error) {
    // Roll back any auto-created Account or Terminal
    if (autoAcc?.id)  await Account.findByIdAndDelete(autoAcc.id).catch(() => {});
    if (autoTerm?.id) await Terminal.findByIdAndDelete(autoTerm.id).catch(() => {});
    console.error('Error creating warehouse:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all warehouses, sorted by name.
 * Populates cashAccount and store references for clarity.
 */
// controllers/warehouseController.js

exports.getAllWarehouses = async (req, res) => {
  try {
    // 1️⃣ Build the same filter you already had
    let filter = {};
    if (req.user.role.toLowerCase() !== 'admin') {
      const stores = Array.isArray(req.user.stores)
        ? req.user.stores
        : [req.user.store];
      filter.store = { $in: stores };
    }

    // 2️⃣ Load all matching warehouses
    const warehouses = await Warehouse.find(filter)
      .sort({ warehouseName: 1 })
      .populate('cashAccount', 'accountNumber accountName')
      .lean();  // ← lean() gives us plain JS objects so we can add properties

    // 3️⃣ Figure out *your* store’s “main” warehouse ID
    const storeId = Array.isArray(req.user.stores)
      ? req.user.stores[0]
      : req.user.store;
    let mainWarehouseId = null;
    if (storeId) {
      const store = await Store.findById(storeId).select('warehouse').lean();
      mainWarehouseId = store?.warehouse?.toString() || null;
    }

    // 4️⃣ Enrich each warehouse with a boolean
    const data = warehouses.map(w => ({
      ...w,
      isRestricted: w._id.toString() === mainWarehouseId
    }));

    // 5️⃣ Return it
    return res.status(200).json({ success: true, data });

  } catch (error) {
    console.error('Error fetching warehouses:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


/**
 * Get one warehouse by ID.
 */
exports.getWarehouseById = async (req, res) => {
  try {
    const warehouse = await Warehouse
      .findById(req.params.id)
      .populate('cashAccount', 'accountNumber accountName')
      .populate('store', 'StoreName');
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }
    return res.status(200).json({ success: true, data: warehouse });
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update a warehouse.
 * Mirrors createWarehouse logic for store override, cashAccount, tid, qrCode and location.
 */
exports.updateWarehouse = async (req, res) => {
  let autoAcc, autoTerm;

  try {
    // ── Quick path for status‐only updates ─────────────────────────────
    if (
      Object.keys(req.body).length === 1 &&
      Object.prototype.hasOwnProperty.call(req.body, "status")
    ) {
      const wh = await Warehouse.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true }
      );
      if (!wh) {
        return res.status(404).json({ success: false, message: "Warehouse not found" });
      }
      return res.json({ success: true, data: wh });
    }

    // ── Full update path ────────────────────────────────────────────────
    // 1) Destructure incoming fields
    const {
      warehouseName,
      mobile,
      email,
      status,
      Latitude,
      Longitude,
      cashAccount: incomingCashAcc,
      terminalId,
      tid: incomingTid,
      store: incomingStore
    } = req.body;

    // 2) Determine storeId
    let storeId;
    if (req.user.role.toLowerCase() === "admin" && incomingStore) {
      storeId = incomingStore;
    } else {
      storeId = Array.isArray(req.user.stores)
        ? req.user.stores[0]
        : req.user.store;
    }
    if (!storeId) {
      return res.status(400).json({ success: false, message: "Store ID is required" });
    }

    // 3) Build update payload (without terminal)
    const updateData = {
      warehouseName,
      mobile,
      email,
      status,
      Latitude,
      Longitude,
      location: { type: "Point", coordinates: [+Longitude, +Latitude] },
      store: storeId
    };

    // 4) Select or auto-create cashAccount
    let cashAccount = incomingCashAcc;
    if (!cashAccount) {
      const store = await Store.findById(storeId);
      if (!store) throw new Error("Invalid store");
      autoAcc = new Account({
        parentAccount: store.storeAccount,
        accountNumber: `CASH-${Date.now()}`,
        accountName: `${warehouseName} Cash`,
        openingBalance: 0,
        note: "",
        createdBy: req.user._id,
        createdByModel:
          req.user.role.toLowerCase() === "admin" ? "Admin" : "User"
      });
      const savedAcc = await autoAcc.save();
      cashAccount = savedAcc._id;
    }
    updateData.cashAccount = cashAccount;

    // 5) Handle optional QR upload
    const qrCodePath = req.file ? `/uploads/qr/${req.file.filename}` : null;

    // 6) Apply update (warehouse without terminal yet)
    let wh = await Warehouse.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );
    if (!wh) {
      return res.status(404).json({ success: false, message: "Warehouse not found" });
    }

    // 7) Select or auto-create Terminal
    let term;
    if (terminalId) {
      term = await Terminal.findById(terminalId);
      if (!term) throw new Error("Invalid terminalId");
      term.warehouse = wh._id;
      await term.save();
    } else {
      if (!incomingTid) throw new Error("tid is required when no terminalId provided");
      autoTerm = new Terminal({
        tid: incomingTid,
        qrCodePath,
        warehouse: wh._id,
        createdBy: req.user._id
      });
      term = await autoTerm.save();
    }

    // 8) Link terminal back onto warehouse
    wh.terminal = term._id;
    wh.tid      = term.tid;
    wh.qrCode   = term.qrCodePath;
    await wh.save();

    return res.status(200).json({
      success: true,
      message: "Warehouse updated successfully",
      data: wh
    });

  } catch (error) {
    // Roll back any auto-created Account or Terminal
    if (autoAcc?.id)  await Account.findByIdAndDelete(autoAcc.id).catch(() => {});
    if (autoTerm?.id) await Terminal.findByIdAndDelete(autoTerm.id).catch(() => {});
    console.error("Error updating warehouse:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a warehouse.
 */
exports.deleteWarehouse = async (req, res) => {
  try {
    const deleted = await Warehouse.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }
    return res.status(200).json({ success: true, message: 'Warehouse deleted successfully' });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Find nearby warehouses via geospatial query.
 */
exports.getNearbyWarehouses = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'latitude and longitude are required' });
    }
    const lat = parseFloat(latitude), lng = parseFloat(longitude);
    const distance = maxDistance ? parseInt(maxDistance) : 5000;

    const warehouses = await Warehouse.find({
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: distance
        }
      }
    });
    return res.status(200).json({ success: true, data: warehouses });
  } catch (error) {
    console.error('Error fetching nearby warehouses:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get detailed inventory for a warehouse.
 */
// controllers/warehouseController.js
exports.getWarehouseInventory = async (req, res) => {
  try {
    const warehouseId = req.params.id;
    const whOid       = new mongoose.Types.ObjectId(warehouseId);

    // 1) Get every unique item/variant touched by this warehouse
    const ledgerRecords = await Inventory
      .find({ warehouse: whOid })
      .select('item')
      .lean();

    const detailed = [];

    // helper to sum each ledger type for a given itemId
    async function sumsFor(itemId) {
      const [
        [{ totalAdjustment = 0 } = {}],
        [{ totalIn         = 0 } = {}],
        [{ totalOut        = 0 } = {}],
        [{ totalPurchased  = 0 } = {}],
        [{ totalReturned   = 0 } = {}]
      ] = await Promise.all([
        StockAdjustment.aggregate([
          { $match: { warehouse: whOid } },
          { $unwind: '$items' },
          { $match: { 'items.item': itemId } },
          { $group: { _id: null, totalAdjustment: { $sum: '$items.quantity' } } }
        ]),
        StockTransfer.aggregate([
          { $match: { toWarehouse: whOid } },
          { $unwind: '$items' },
          { $match: { 'items.item': itemId } },
          { $group: { _id: null, totalIn: { $sum: '$items.quantity' } } }
        ]),
        StockTransfer.aggregate([
          { $match: { fromWarehouse: whOid } },
          { $unwind: '$items' },
          { $match: { 'items.item': itemId } },
          { $group: { _id: null, totalOut: { $sum: '$items.quantity' } } }
        ]),
        Purchase.aggregate([
          { $match: { warehouse: whOid, isReturn: false } },
          { $unwind: '$items' },
          { $match: { 'items.item': itemId } },
          { $group: { _id: null, totalPurchased: { $sum: '$items.quantity' } } }
        ]),
        Purchase.aggregate([
          { $match: { warehouse: whOid, isReturn: true } },
          { $unwind: '$items' },
          { $match: { 'items.item': itemId } },
          { $group: { _id: null, totalReturned: { $sum: '$items.quantity' } } }
        ]),
      ]);
      return { totalAdjustment, totalIn, totalOut, totalPurchased, totalReturned };
    }

    // 2) For each record, load the item/variant and build a row
    for (const { item: iid } of ledgerRecords) {
      // load parent + variantSub if any
      let parent = await Item.findOne({ 'variants._id': iid })
        .populate('variants.variantId', 'variantName')
        .select('itemName description variants warehouse itemGroup')
        .lean();
      let variantSub = null;
      if (parent) {
        variantSub = parent.variants.find(v => v._id.toString() === iid.toString());
      } else {
        parent = await Item.findById(iid)
          .select('itemName sku openingStock description warehouse itemGroup')
          .lean();
      }
      if (!parent) continue;                         // skip if missing
      if (!variantSub && parent.itemGroup === 'Variant') continue; // skip parent record for variants

      // 3) Sum everything
      const {
        totalAdjustment,
        totalIn,
        totalOut,
        totalPurchased,
        totalReturned
      } = await sumsFor(iid);

      // 4) Determine “base” opening
       let opening = 0;
    if (variantSub) {
      // for variants, only their sub-record on this warehouse
      opening = parent.warehouse.toString() === warehouseId
        ? (variantSub.openingStock || 0)
        : 0;
    } else {
      // for non-variants, only the parent if it lives in this warehouse
      opening = parent.warehouse.toString() === warehouseId
        ? (parent.openingStock || 0)
        : 0;
    }

      // 5) Compute current
      const currentStock = opening
                         + totalPurchased
                         - totalReturned
                         + totalAdjustment
                         + totalIn
                         - totalOut;

      // 6) Push row
      if (variantSub) {
        detailed.push({
          itemName:       `${parent.itemName} – ${variantSub.variantId.variantName}`,
          sku:            variantSub.sku,
          description:    parent.description || '',
          openingStock:   opening,
          totalPurchased,
          totalReturned,
          totalAdjustment,
          totalIn,
          totalOut,
          currentStock
        });
      } else {
        detailed.push({
          itemName:       parent.itemName,
          sku:            parent.sku,
          description:    parent.description || '',
          openingStock:   opening,
          totalPurchased,
          totalReturned,
          totalAdjustment,
          totalIn,
          totalOut,
          currentStock
        });
      }
    }

    return res.status(200).json({ success: true, data: detailed });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
// controllers/warehouseController.js
exports.getWarehouseList = async (req, res) => {
  try {
    // 1️⃣ build the same store‐scoping filter you use in getAllWarehouses
    let filter = {};
    if (req.user.role.toLowerCase() !== 'admin') {
      const stores = Array.isArray(req.user.stores)
        ? req.user.stores
        : [req.user.store];
      filter.store = { $in: stores };
    }

    // 2️⃣ fetch, sort, and populate both cashAccount & terminal
    const warehouses = await Warehouse.find(filter)
      .sort({ warehouseName: 1 })
      .populate('cashAccount', 'accountNumber accountName')
      .populate('terminal',    'tid qrCodePath');

    // 3️⃣ return them
    return res.status(200).json({ success: true, data: warehouses });
  } catch (error) {
    console.error('Error fetching warehouse list:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};


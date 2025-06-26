require("dotenv").config();
const mongoose = require("mongoose");
const Ledger = require("../models/ledgerModel");

exports.postVanCash = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { date, amount, warehouseId } = req.body;
      if (!date || amount == null || !warehouseId)
        return res.status(400).json({ message: "date, amount & warehouseId required" });

      // refuse if today already has a row
      const day      = date.slice(0, 10);
      const startUTC = new Date(`${day}T00:00:00Z`);
      const endUTC   = new Date(`${day}T24:00:00Z`);

      const exists = await Ledger.exists({
        warehouse: warehouseId,
        type:      "VAN_CASH",
        date:      { $gte: startUTC, $lt: endUTC }
      }).session(session);

      if (exists) {
        return res.status(409).json({ message: "VAN_CASH already set for this date; use PUT to change it" });
      }

      const row = await Ledger.create(
        [{ date: new Date(date), type: "VAN_CASH", amount: +amount, warehouse: warehouseId }],
        { session }
      );

      res.status(201).json({ success: true, data: row[0] });
    });
  } catch (err) {
    console.error("postVanCash:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};


exports.putVanCash = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { date, amount, warehouseId } = req.body;
      if (!date || amount == null || !warehouseId)
        return res.status(400).json({ message: "date, amount & warehouseId required" });

      // calendar-day window in UTC
      const day      = date.slice(0, 10);                // "YYYY-MM-DD"
      const startUTC = new Date(`${day}T00:00:00Z`);
      const endUTC   = new Date(`${day}T24:00:00Z`);

      const updated = await Ledger.findOneAndUpdate(
        {
          warehouse: warehouseId,
          type:      "VAN_CASH",
          date:      { $gte: startUTC, $lt: endUTC }
        },
        { $set: { amount: +amount, date: new Date(date) } },
        { new: true, upsert: true, session }
      );

      res.json({ success: true, data: updated });
    });
  } catch (err) {
    console.error("putVanCash:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};
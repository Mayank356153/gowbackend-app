// controllers/addressController.js
const asyncHandler = require('express-async-handler');
const Address      = require('../models/addressModel');

// POST /api/addresses
exports.createAddress = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const {
    label,
    street,
    area,
    city,
    state,
    country,
    postalCode,
    isDefault = false
  } = req.body;

  // 1) create the new address
  const addr = await Address.create({
    user:       userId,
    label,
    street,
    area,
    city,
    state,
    country,
    postalCode,
    isDefault
  });

  // 2) if it's “default”, clear the flag on all their other addresses
  if (isDefault) {
    await Address.updateMany(
      { user: userId, _id: { $ne: addr._id } },
      { isDefault: false }
    );
  }

  res.status(201).json({ success: true, data: addr });
});

// GET /api/addresses
exports.getAddresses = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const list = await Address.find({ user: userId })
                            .sort({ isDefault: -1, updatedAt: -1 });
  res.json({ success: true, data: list });
});

// GET /api/addresses/:id
exports.getAddressById = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const addr = await Address.findOne({
    _id: req.params.id,
    user: userId
  });
  if (!addr) return res.status(404).json({ message: "Not found" });
  res.json({ success: true, data: addr });
});

// PUT /api/addresses/:id
exports.updateAddress = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const updateData = req.body;

  // only update if it belongs to them
  const addr = await Address.findOneAndUpdate(
    { _id: req.params.id, user: userId },
    updateData,
    { new: true }
  );
  if (!addr) return res.status(404).json({ message: "Not found or forbidden" });

  // if they toggled default→true, clear others
  if (updateData.isDefault) {
    await Address.updateMany(
      { user: userId, _id: { $ne: addr._id } },
      { isDefault: false }
    );
  }

  res.json({ success: true, data: addr });
});

// DELETE /api/addresses/:id
exports.deleteAddress = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const result = await Address.deleteOne({
    _id: req.params.id,
    user: userId
  });
  if (result.deletedCount === 0) {
    return res.status(404).json({ message: "Not found or forbidden" });
  }
  res.json({ success: true, message: "Deleted" });
});

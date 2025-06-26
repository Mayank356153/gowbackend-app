const express = require("express");
const {
  createStockTransfer,
  getAllStockTransfers,
  getStockTransferById,
  updateStockTransfer,
  deleteStockTransfer,
  getInventoryByWarehouse
} = require("../controllers/stockTransferController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE


router.get(
  "/inventory",
  getInventoryByWarehouse
);
router.post(
  "/",
  authMiddleware,
  hasPermission("StockTransfers", "Add"),
  createStockTransfer
);

// GET ALL
router.get(
  "/",
  authMiddleware,
  hasPermission("StockTransfers", "View"),
  getAllStockTransfers
);

// GET SINGLE
router.get(
  "/:id",
  authMiddleware,
  hasPermission("StockTransfers", "View"),
  getStockTransferById
);

// UPDATE
router.put(
  "/:id",
  authMiddleware,
  hasPermission("StockTransfers", "Edit"),
  updateStockTransfer
);

// DELETE
router.delete(
  "/:id",
  authMiddleware,
  hasPermission("StockTransfers", "Delete"),
  deleteStockTransfer
);

module.exports = router;

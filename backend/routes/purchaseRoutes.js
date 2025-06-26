const express = require("express");
const {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
  createPurchaseReturn,
  getAllPurchaseReturns,
} = require("../controllers/purchaseController");
const { authMiddleware, hasPermission } = require("../middleware/authMiddleware");

const router = express.Router();

// CREATE Purchase
router.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Purchases", "Add")(req, res, next);
  },
  createPurchase
);

router.post(
  "/purchase-returns",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("PurchasesReturn", "Add")(req, res, next);
  },
  createPurchaseReturn
);
// READ ALL Purchases
router.get(
  "/",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Purchases", "View")(req, res, next);
  },
  getAllPurchases
);

router.get(
  "/purchase-returns",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("PurchasesReturn", "View")(req, res, next);
  },
  getAllPurchaseReturns
);

// READ Single Purchase
router.get(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Purchases", "View")(req, res, next);
  },
  getPurchaseById
);

// UPDATE Purchase
router.put(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Purchases", "Edit")(req, res, next);
  },
  updatePurchase
);

// DELETE Purchase
router.delete(
  "/:id",
  authMiddleware,
  (req, res, next) => {
    if (req.user.role.toLowerCase() === "admin") return next();
    return hasPermission("Purchases", "Delete")(req, res, next);
  },
  deletePurchase
);

module.exports = router;

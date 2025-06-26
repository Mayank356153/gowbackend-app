const mongoose = require("mongoose");

const checkoutItemSchema = new mongoose.Schema({
  item:       { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  quantity:   { type: Number, required: true },
  salesPrice: { type: Number, required: true }   // snapshot
});

const checkoutSessionSchema = new mongoose.Schema({
  customer:    { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
  items:       { type: [checkoutItemSchema], required: true },
  amount:      { type: Number, required: true },
  status:      { type: String, enum: ["pending", "completed", "expired"], default: "pending" },
  createdAt:   { type: Date, default: Date.now },
  expiresAt:   { type: Date, default: () => Date.now() + 60 * 60 * 1000 }, // 1 h
  razorpayId:{type:String},
  razorpayPaymentId: String,
    razorpaySignature: String,
    paymentVerifiedAt: Date
});

module.exports = mongoose.model("CheckoutSession", checkoutSessionSchema);

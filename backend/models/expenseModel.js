const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    referenceNo: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "createdByModel",
    },
    createdByModel: {
      type: String,
      required: true,
      enum: ["User", "Admin"],
    },
    // Updated category reference: now points to ExpenseCategory
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpenseCategory",
    },
    expenseFor: {
      type: String,
    },
    paymentType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentType",
      required: true,
    },
    account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    amount: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
    },
    status: {
      type: String,
      default: "Active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);

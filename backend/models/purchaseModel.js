const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "createdByModel"
    },
    createdByModel: {
      type: String,
      required: true,
      enum: ["User", "Admin"] 
    },
    referenceNo: { type: String, required: true, unique: true },
    purchaseDate: { type: Date, required: true },
    
    isReturn: { type: Boolean, default: false },
    
    status: {
      type: String,
      enum: ["Normal", "Return", "Cancel"],
      default: "Normal"
    },
    items: [
      {
        item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
        quantity: { type: Number, required: true },
        mrp: { type: Number },
        expiryDate: { type: Date },
        purchasePrice: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        salesPrice: { type: Number, required: true },
        unitCost: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true },
      },
    ],
    otherCharges: { type: Number, default: 0 },
    discountOnAll: { type: Number, default: 0 },
    note: { type: String },
    payments: [
      {
        date: { type: Date, default: Date.now },
        paymentType: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentType", required: true },
        account: { type: mongoose.Schema.Types.ObjectId, ref: "Account" }, 
        amount: { type: Number, required: true },
        paymentNote: { type: String },
      },
    ],
    
    grandTotal: { type: Number, required: true },
    
    
    purchaseCode: { type: String, unique: true },
  },
  { timestamps: true }

  
);


purchaseSchema.pre("save", function(next) {
  if (!this.purchaseCode) {
    let prefix = "PC/2025/"; // Default for normal purchases
    if (this.isReturn) {
      prefix = "PR/2025/"; // Use PR prefix for purchase returns
    }
    const randomNum = Math.floor(Math.random() * 9000) + 1000; // Random 4-digit number
    this.purchaseCode = prefix + randomNum;
  }
  next();
});


module.exports = mongoose.model("Purchase", purchaseSchema);

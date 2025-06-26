
require("dotenv").config();
const mongoose        = require("mongoose");
const Deposit         = require("../models/depositModel");
const Warehouse       = require("../models/warehouseModel");
const Ledger          = require("../models/ledgerModel");
const { recordTransfer } = require("../services/recordTransfer");

exports.createDeposit = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      depositDate,
      referenceNo,
      debitAccount,
      creditAccount,
      amount,
      note
    } = req.body;

    // 1️⃣ Validate
    if (!depositDate || !debitAccount || !creditAccount || !amount) {
      throw new Error("Missing required fields");
    }
    if (debitAccount === creditAccount) {
      throw new Error("Debit and credit cannot be the same");
    }

    // 2️⃣ Create the Deposit doc
    const [newDeposit] = await Deposit.create(
      [{
        depositDate,
        referenceNo,
        debitAccount,
        creditAccount,
        amount,
        note,
        createdBy:      req.user?.id,
        createdByModel: req.user
                         ? (req.user.role.toLowerCase() === "admin" ? "Admin" : "User")
                         : null
      }],
      { session }
    );

    // 3️⃣ Adjust both accounts’ balances
    //    debitAccount ↓, creditAccount ↑
    await recordTransfer({
      debitAccount,
      creditAccount,
      amount,
      session
    });

    // 4️⃣ Record in your Ledger
    //    (so cash-summary can pick it up)
    //  – Find the warehouse that owns this cashAccount
    const wh = await Warehouse
  .findOne({ cashAccount: creditAccount })
  .select("_id")
  .lean();
if (!wh?._id) {
  throw new Error("Warehouse not found for this cash account");
}

await Ledger.create([{
  date:      new Date(depositDate),
  type:      "DEPOSIT",
  amount,
  warehouse: wh._id
}], { session });

    // 5️⃣ Commit transaction
    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      message: "Deposit created",
      data: newDeposit
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error creating deposit:", err);
    return res.status(400).json({ success: false, message: err.message });
  }
};



// GET All Deposits (with computed creatorName)
exports.getAllDeposits = async (req, res) => {
  try {
    const deposits = await Deposit.find()
      .populate("debitAccount", "accountName accountNumber")
      .populate("creditAccount", "accountName accountNumber")
      .populate("createdBy", "FirstName LastName name");
      
    // Process deposits to compute creatorName
    const processedDeposits = deposits.map((deposit) => {
      let creatorName = "";
      if (deposit.createdBy) {
        if (deposit.createdBy.name) {
          creatorName = deposit.createdBy.name;
        } else if (deposit.createdBy.FirstName && deposit.createdBy.LastName) {
          creatorName = `${deposit.createdBy.FirstName} ${deposit.createdBy.LastName}`;
        }
      }
      return { ...deposit.toObject(), creatorName };
    });

    return res.status(200).json({ success: true, data: processedDeposits });
  } catch (error) {
    console.error("Error fetching deposits:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET Single Deposit (with computed creatorName)
exports.getDepositById = async (req, res) => {
  try {
    const deposit = await Deposit.findById(req.params.id)
      .populate("debitAccount", "accountName accountNumber")
      .populate("creditAccount", "accountName accountNumber")
      .populate("createdBy", "FirstName LastName name");
      
    if (!deposit) {
      return res.status(404).json({ success: false, message: "Deposit not found" });
    }
    
    let creatorName = "";
    if (deposit.createdBy) {
      if (deposit.createdBy.name) {
        creatorName = deposit.createdBy.name;
      } else if (deposit.createdBy.FirstName && deposit.createdBy.LastName) {
        creatorName = `${deposit.createdBy.FirstName} ${deposit.createdBy.LastName}`;
      }
    }
    
    return res.status(200).json({ success: true, data: { ...deposit.toObject(), creatorName } });
  } catch (error) {
    console.error("Error fetching deposit:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDeposit = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { id } = req.params;
      const {
        depositDate,
        referenceNo,
        debitAccount,
        creditAccount,
        amount,
        note
      } = req.body;

      // … your existing validation …

      // 1) Load existing deposit
      const old = await Deposit.findById(id).session(session);
      if (!old) throw new Error("Deposit not found");

      // 2) Reverse its old balance movement
      await recordTransfer({
        debitAccount:  old.creditAccount.toString(),
        creditAccount: old.debitAccount.toString(),
        amount:        old.amount,
        session
      });

      // 3) Remove the old ledger entry
      //    (find the warehouse by old.debitAccount)
      const oldWh = await Warehouse.findOne({ cashAccount: old.creditAccount }).select("_id").lean();
      if (oldWh?._id) {
        await Ledger.deleteOne({
          type:      "DEPOSIT",
          date:      new Date(old.depositDate).setHours(0,0,0,0),
          amount:    old.amount,
          warehouse: oldWh._id
        }).session(session);
      }

      // 4) Update the deposit document
      old.depositDate   = depositDate;
      old.referenceNo   = referenceNo;
      old.debitAccount  = debitAccount;
      old.creditAccount = creditAccount;
      old.amount        = amount;
      old.note          = note;
      await old.save({ session });

      // 5) Apply the new movement
      await recordTransfer({
        debitAccount,
        creditAccount,
        amount,
        session
      });

      // 6) Write the new ledger entry
      const newWh = await Warehouse.findOne({ cashAccount: creditAccount }).select("_id").lean();
      if (!newWh?._id) throw new Error("Warehouse not found for new cashAccount");
      await Ledger.create([{
        date:      new Date(depositDate),
        type:      "DEPOSIT",
        amount,
        warehouse: newWh._id
      }], { session });

      // 7) Return the updated deposit (as before)
      const updated = await Deposit.findById(id)
        .populate("debitAccount",  "accountName accountNumber")
        .populate("creditAccount", "accountName accountNumber")
        .populate("createdBy",     "FirstName LastName name")
        .session(session);

      let creatorName = "";
      if (updated.createdBy) {
        creatorName = updated.createdBy.name
          ? updated.createdBy.name
          : `${updated.createdBy.FirstName} ${updated.createdBy.LastName}`;
      }

      res.status(200).json({
        success: true,
        message: "Deposit updated successfully",
        data: { ...updated.toObject(), creatorName }
      });
    });

  } catch (err) {
    console.error("Error updating deposit:", err);
    res.status(400).json({ success: false, message: err.message });
  } finally {
    session.endSession();
  }
};

// DELETE Deposit
exports.deleteDeposit = async (req, res) => {
  try {
    const deleted = await Deposit.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Deposit not found" });
    }
    return res.status(200).json({ success: true, message: "Deposit deleted" });
  } catch (error) {
    console.error("Error deleting deposit:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

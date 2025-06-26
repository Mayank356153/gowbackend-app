// services/recordSale.js
require("dotenv").config();

const Account   = require("../models/accountModel");
const Warehouse = require("../models/warehouseModel");
const Ledger    = require("../models/ledgerModel");

// ensure we always use the correct Cash ID
const CASH_ID = process.env.CASH_PAYMENT_TYPE_ID || "67df360816a7331e79eb28e7";
const BANK_ID = process.env.BANK_PAYMENT_TYPE_ID || "67df361316a7331e79eb28e9";

/**
 * @param {String} warehouseId
 * @param {Array}  payments           – [{ amount, paymentType, … }]
 * @param {String} referenceId        – the Sale or POS _id
 * @param {Object?} session           – mongoose session
 */
async function recordSale({ warehouseId, payments, referenceId, refModel, session = null }) {
  if (!payments?.length) return;

  // 1) remove any old cash/bank entries for this invoice
  await Ledger.deleteMany({
    warehouse:   warehouseId,
    referenceId,
    refModel,
    type: { $in: ['CASH_SALE','BANK_SALE'] }
  }, { session });

  // 2) add fresh ones based on current payments[]
  for (const pay of payments) {
   if (!pay.amount) continue;

    let type = null;
    if (String(pay.paymentType) === CASH_ID) type = 'CASH_SALE';
    else if (String(pay.paymentType) === BANK_ID) type = 'BANK_SALE';
    if (!type) continue;

    await Ledger.create([{
      date:        pay.date ? new Date(pay.date) : new Date(),
      type,
      amount:      pay.amount,
      warehouse:   warehouseId,
      referenceId,    // tie back to invoice
      refModel        // e.g. 'Sale' or 'PosOrder'
    }], { session });
  }
}

module.exports = { recordSale };
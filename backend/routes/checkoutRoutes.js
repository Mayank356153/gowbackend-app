
// routes/checkoutRoutes.js
const express = require('express');
const router = express.Router();




const {verifyPayment,createCheckoutSession}=require("../controllers/checkoutController")


router.post("/create",createCheckoutSession)

router.put("/verify-payment",verifyPayment)









module.exports = router;


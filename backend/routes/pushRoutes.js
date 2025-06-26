const router  = require("express").Router();
const { protect }          = require("../middleware/customerauthMiddleware");
const { registerToken, broadcastPush }    = require("../controllers/pushController");
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware"); 

router.post("/register-token", protect, registerToken);
router.post("/broadcast", authMiddleware,   // verifies JWT & builds req.user
            isAdmin, broadcastPush); // checks if user is admin


module.exports = router;

const asyncHandler  = require("express-async-handler");
const DeviceToken   = require("../models/deviceTokenModel");
const admin       = require("../lib/fcm");

/* POST /api/push/register-token
   Body: { "deviceToken":"AAA...", "platform":"android" | "ios" }
*/
exports.registerToken = asyncHandler(async (req, res) => {
  const { deviceToken, platform } = req.body;
  if (!deviceToken || !platform)
    return res.status(400).json({ message: "deviceToken & platform are required" });

  await DeviceToken.findOneAndUpdate(
    { customer: req.user, token: deviceToken },          // query
    { customer: req.user, token: deviceToken, platform, updatedAt: new Date() }, // update
    { upsert: true, new: true }
  );

  res.json({ message: "Token registered" });
});

exports.broadcastPush = asyncHandler(async (req, res) => {
  const { title, body } = req.body;

  const tokens = await DeviceToken.distinct("token");
  while (tokens.length) {
    await admin.messaging().sendEachForMulticast({
      tokens: tokens.splice(0, 500),   // FCM limit 500
      notification: { title, body }
    });
  }
  res.json({ message: "Broadcast sent" });
});
 const express=require("express")

 const router=express.Router()
const { singleUpload, arrayUpload, fieldsUpload } = require("../middleware/upload");
const{createRider,getAllRider,deleteById,giveRating}=require("../controllers/riderController.js")

const{authMiddleware,hasPermission}=require("../middleware/authMiddleware.js")


// For multiple specific fields (recommended)
router.post("/create",authMiddleware,hasPermission("rider","Add"),fieldsUpload([
      { name: 'addharCardImage'},
      { name: 'drivingLicenseImage' },
      { name: 'panCardImage'},
      { name: 'profileImage' }
    ]),
    createRider
  );
  

  router.get("/all",authMiddleware,hasPermission("rider","View"),getAllRider)
  router.get("/available",authMiddleware,hasPermission("rider","View"),getAllRider)
  
  router.delete("/:id",authMiddleware,hasPermission("rider","Delete"),deleteById)

router.put("/rating/:riderid",giveRating)

module.exports=router

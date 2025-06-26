const AuditUser=require("../models/AuditUser")
const express = require("express");

const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

const {createAudit,auditLogin, putBucket, calculateAuditDiscrepancy, allAudits, applyAuditUpdates, endAudit, deleteAudit}=require("../controllers/auditController")
const {createBucket,getBucketbyAuditorId,deleteBucket,updateBucket} =require("../controllers/Bucket-Controller")



router.post("/login",auditLogin)

router.post("/create",authMiddleware,createAudit)

router.get("/all",authMiddleware,allAudits)

router.put("/end",authMiddleware,endAudit)

router.delete("/delete/:id",authMiddleware,deleteAudit)

router.put("/update-quantity-db",authMiddleware,applyAuditUpdates)


router.get("/profile",authMiddleware,async(req,res)=>{
    const id=req.user.id
    try {
        console.log("asdf")
        console.log(req.user)
        const audit=await AuditUser.findById(id)
        console.log(audit)
        

         if (!audit) return res.status(404).json({ message: 'Auditor not found' });
         
         
         return res.status(200).json({
            message:"Auditor profile found",
            data:{
                userName:audit.userName,
                employeeId:audit.employeeId || "",
                role:"Auditor"
            }
        })
    } catch (e) {
        console.error('Auditor Profile Error:', e);
        return res.status(500).json({ message: 'Server error', error: e.message });
     } 
     
    })

    

    router.get("/compare-items",authMiddleware,calculateAuditDiscrepancy)

    router.get("/",authMiddleware,allAudits)
    
    
    
    router.put("/bucket-submission",authMiddleware,putBucket)

    router.post("/bucket/create",authMiddleware,createBucket)
    
    router.put("/bucket/:bucketId",authMiddleware,updateBucket)

router.get("/bucket/auditor/:auditor_id",authMiddleware,getBucketbyAuditorId)



router.delete("/:bucketId",authMiddleware,deleteBucket)






module.exports = router;

const AuditUser=require("../models/AuditUser")
const Audit=require("../models/AuditModel")
const Warehouse=require("../models/warehouseModel")
const Store=require("../models/storeModel")
const bcryptjs=require("bcryptjs")
const jwt =require("jsonwebtoken")
const Items=require("../models/itemModel")
const mongoose=require("mongoose")
//auditor login
exports.auditLogin=async(req,res)=>{
    try {
    console.log("🔹 Received Request Body:", req.body);
    
    const{username,password}=req.body
     console.log("🔹 Login Attempt - Username:", username);
    console.log("🔹 Login Attempt - Password:", password ? "Received" : "❌ MISSING!");

  if (!username || !password) {
      return res.status(400).json({ message: "❌ Email and Password are required" });
    }

    const findUser=await AuditUser.findOne({userName:username})

    console.log(findUser)
    if (!findUser) {
      console.log("❌ User Not Found in DB");
      return res.status(400).json({ message: "User not found" });
    }

    if (!findUser.password) {
      console.log("❌ User Password is MISSING in DB");
      return res.status(500).json({ message: "User password is missing in the database" });
    }
    console.log(findUser.password)
    const isMatch=await bcryptjs.compare(password,findUser.password)

        console.log("🔹 Password Match Result:", isMatch);
      if (!isMatch) {
      console.log("❌ Password Incorrect");
      return res.status(400).json({ message: "Invalid credentials" });
    }

        console.log("✅ Password Matched. Generating Token...");
    const token=jwt.sign(
      {id:findUser._id},
      process.env.JWT_SECRET,
      {expiresIn:"7D"}
    );
        console.log("✅ Token Generated:", token);
     res.status(200).json({
      message:"Login Successful",
      token,
      user:{
        id:findUser._id,
        username:findUser.userName,
        role:"auditor",
        auditId:findUser.auditId
      }
     })
  } catch (error) {
       console.error("🚨 Login Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
    }
}

//start audit
exports.createAudit=async(req,res)=>{
    try {
    const { storeId, warehouseId, users } = req.body;

    if(!storeId && !warehouseId){
      return res.status(401).json({
        message:"either store or warehouse id is required"
      })
    }
    // Validate store and warehouse exist
    console.log(req.body)

    const storeExist = await Store.findById(storeId);
    const warehouseExist = await Warehouse.findById(warehouseId);
    
    if (!storeExist && storeId) {
      return res.status(404).json({ 
        success: false,
        message: 'Store not found' 
      });
    }

    if (!warehouseExist && warehouseId) {
      return res.status(404).json({ 
        success: false,
        message: 'Warehouse not found' 
      });
    }

    // Process each user
    const createdUsers = [];
    const errors = [];

    for (const userData of users) {
      try {
        // Check if username already exists
        const existingUser = await AuditUser.findOne({ username: userData.username });
        if (existingUser) {
          errors.push({
            username: userData.username,
            error: 'Username already exists'
          });
          continue;
        }

        // Hash password
        const hashedPassword = await bcryptjs.hash(userData.password, 10);

        // Create user
        const newUser = new AuditUser({
          userName: userData.username,
          password: hashedPassword,
          employeeId:userData.employeeId || "",
        });

        const auditSave=await newUser.save();
         console.log("Audit users save")
         console.log(auditSave)

        createdUsers.push({
          userName: userData.username,
          password:hashedPassword
         });
      } catch (error) {
        errors.push({
          username: userData.username,
          error: error.message
        });
      }
   
    }
      console.log("createdUsers")
      console.log(createdUsers)
      console.log("errors")
      console.log(errors)


    const auditSaved=new Audit ({
        storeId:storeId || "",
        warehouseId:warehouseId || "",
        auditPerson:createdUsers || [],
        createdBy:req.user.id
    })

    const audit_res=await auditSaved.save();
    console.log("l")
    for (const user of createdUsers) {
  await AuditUser.findOneAndUpdate(
    { userName: user.userName },
    { auditId: audit_res._id }
  );
}
console.log("po")

    res.status(201).json({
      success: true,
      message: "Audit started successfully",
      data:audit_res
    });

  } catch (error) {
    console.error('Error in bulk user creation:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error:error.message
    });
  } 
}





exports.putBucket = async (req, res) => {
  const { auditId, buckets } = req.body;

  if (!auditId || !buckets || !Array.isArray(buckets)) {
    return res.status(400).json({
      success: false,
      message: "auditId and buckets array are required",
    });
  }

  try {
    console.log(buckets)
    const audit = await Audit.findById(auditId);
    if (!audit) {
      return res.status(404).json({ success: false, message: "Audit not found" });
    }

    audit.buckets.push({
      createdBy: req.user.id,
      scannedItems: buckets,
      submittedAt: new Date(),
    });

    const updatedAudit = await audit.save();

    return res.status(200).json({
      success: true,
      message: "Bucket submitted successfully",
      data: updatedAudit,
    });
  } catch (error) {
    console.error("Error submitting bucket:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};




exports.calculateAuditDiscrepancy = async (req, res) => {
  try {
    const creatorId = new mongoose.Types.ObjectId(req.user.id);

    // Step 1: Get all audits created by this user
    const audits = await Audit.find({ createdBy: creatorId ,open:true});

    console.log(audits)

    if (!audits.length) {
      return res.status(404).json({ success: false, message: "No audits found for this user" });
    }

    const updatedAudits = [];

    // Step 2: Process each audit
    for (const audit of audits) {
      const scannedMap = {}; // { itemId: totalScannedQuantity }

      audit.buckets.forEach(bucket => {
        bucket.scannedItems.forEach(scan => {
          const id = scan.itemId?.toString();
          if (!id) return;

          scannedMap[id] = (scannedMap[id] || 0) + (scan.quantity || 0);
        });
      });

      const itemIds = Object.keys(scannedMap);
      if (!itemIds.length) continue;

      // Step 3: Fetch item details from DB
      const items = await Items.find({ _id: { $in: itemIds.map(id => new mongoose.Types.ObjectId(id)) } });

      // Step 4: Construct finalUnit array
       const finalUnit = items.map(item => {
        const scannedQty = scannedMap[item._id.toString()] || 0;
        const expectedQty = item.openingStock || 0;
        return {
          itemId: item._id,
          itemName: item.itemName,
          scannedQty,
          expectedQty,
          difference: scannedQty - expectedQty
        };
      });

      // Step 5: Update audit with finalUnit
      audit.finalUnit = finalUnit;
      await audit.save();
      updatedAudits.push({
        auditId: audit._id,
        finalUnit
      });
    }

    res.status(200).json({
      success: true,
      message: "Discrepancy calculated for all audits",
      data: updatedAudits
    });

  } catch (error) {
    console.error("Error in calculating discrepancies:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

exports.allAudits=async(req,res)=>{
  const creatorId = new mongoose.Types.ObjectId(req.user.id);

    // Step 1: Get all audits created by this user
    const audits = await Audit.find({ createdBy: creatorId});

    console.log(audits)

    if (!audits.length) {
      return res.status(404).json({ success: false, message: "No audits found for this user" });
    }
    return res.status(200).json({
      message:"Audit fetched successfully",
      data:audits
    })
}


exports.applyAuditUpdates = async (req, res) => {
  try {
    const { finalUnit , auditId} = req.body;
    if (!Array.isArray(finalUnit) || finalUnit.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid or empty finalUnit array" });
    }

    const bulkUpdates = finalUnit.map((item) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(item.itemId) },
        update: { $set: { openingStock: item.expectedQty } }
      }
    }));





    const result = await Items.bulkWrite(bulkUpdates);

    const auditExist=await Audit.findOne({_id:new mongoose.Types.ObjectId(auditId)})

    if(!auditExist){
      return res.status(400).json({
        message:"No such audit found"
      })
    }

const auditUpdate = await Audit.findByIdAndUpdate(
  auditId,
  { $set: { finalUnit } },
  { new: true }
);



    res.status(200).json({
      success: true,
      message: "Stock updated successfully for audited items",
      modifiedCount: result.modifiedCount,
      result:result,
      auditupdate:auditUpdate
    });
  } catch (error) {
    console.error("Error updating item quantities from audit:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update item quantities",
      error: error.message,
    });
  }
};


exports.endAudit=async(req,res)=>{
  const auditId=req.body.auditId
  try {
    console.log(auditId)
    const update= await Audit.findByIdAndUpdate(auditId,{
      open:false
    })
    return res.status(200).json({
      success:true,
      message:"Audit End successfully",
      data:update
    })
  } catch (error) {
    return res.status(400).json({
      message:"Internal server error",
      error:error.message
    })
  }
}

exports.allAudits=async(req,res)=>{
   const creatorId = new mongoose.Types.ObjectId(req.user.id);

    // Step 1: Get all audits created by this user
    const audits = await Audit.find({ createdBy: creatorId });

    if(!audits){
      return res.status(400).json({
        message:"Unable to fetch audits"
      })
    }
    return res.status(200).json({
      message:"Audit fetched successfully",
      data:audits
    })

}


exports.deleteAudit=async(req,res)=>{
  const id=req.params.id
  try {
        await Audit.findByIdAndDelete(id)
        return res.status(200).json({
          message:"Deleted successfully"
        })    
  } catch (error) {
    return res.status(500).json({
      message:"Internal server error",
     error:error.message
    })
  }
}
const mongoose=require("mongoose")

const personSchema=new mongoose.Schema({
    userName:{
        type:String,
        unique:[true,"username should be unique"],
        required:[true,"username is required"]
    },
    password:{
        type:String,
        required:[true,"password is required"]
    }
})



const bucketSchema=new mongoose.Schema({
    createBy:{
        type:String
    },
    scannedItems:[{
        itemId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Item"
        },
        quantity:{
            type:Number
        }
    }]
},{_id:false,timestamps:true})




const auditSchema=new mongoose.Schema({
    createBy:{
           type:mongoose.Schema.Types.ObjectId,
           ref:"User"
    },
    storeId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Store"
    },
    warehouseId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Warehouse"
    },
    buckets:[bucketSchema],
    finalUnit:[{
         itemId:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Item"
        },
        itemName:String,
        expectedQty:Number,
        scannedQty:Number,
        difference:Number
    }],
    auditPerson:[personSchema],
    open:{
        type:Boolean,
        default:true
    }
},{timestamps:true,_id:true})




module.exports = mongoose.model("Audit",auditSchema);

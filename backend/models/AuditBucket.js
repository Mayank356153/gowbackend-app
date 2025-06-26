const mongoose = require("mongoose")



const bucketSchema=new  mongoose.Schema({
       auditorId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"AuditUser"
       },
       items:[
        {
           item_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Item"
}

               ,
                quantity:{
                    type:Number,
                    default:1
                }
            
        },
       ]

},{timestamps:true})

module.exports=mongoose.model("AuditBucket",bucketSchema)
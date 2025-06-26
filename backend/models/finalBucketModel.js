const mongoose = require("mongoose")



const Schema=new  mongoose.Schema({
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

})



const bucketSchema=[Schema]






module.exports=mongoose.model("FinalBucket",bucketSchema)
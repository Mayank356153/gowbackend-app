const mongoose = require("mongoose");





const user = mongoose.Schema({
  userName: {
    type: String,
    required:["true","Audit username is required"],
    trim:true,
    unique:[true,"audit username should be true"]
  },
  password:{
    type:String,
    required:[true,"Audit password is required"]
  },
  employeeId:{
    type:String
  },
  auditId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Audit"
  }
});


const User = mongoose.model("AuditUser", user);
module.exports = User;

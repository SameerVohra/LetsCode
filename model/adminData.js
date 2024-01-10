const mongoose = require("mongoose")

const adminInfo = new mongoose.Schema({
    id:Number,
    userName:String,
    password:String
})

const admin = mongoose.model("admin",adminInfo);
module.exports = admin;
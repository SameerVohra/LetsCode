const mongoose = require("mongoose")

const questionSchema = new mongoose.Schema({
    name:String,
    difficulty:String,
    acceptanceRate:Number,
    description:String,
})

const ques = mongoose.model("Ques",userSchema);
module.exports = ques;
const mongoose = require("mongoose")

const quesSchema = new mongoose.Schema({
    name:String,
    difficulty:String,
    description:String,
})

const ques = mongoose.model("Ques",quesSchema);
module.exports = ques;
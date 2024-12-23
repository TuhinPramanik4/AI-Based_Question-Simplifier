const { default: mongoose } = require("mongoose");
const Schema =require("mongoose");
const usersSchema = new mongoose.Schema({
    Name:{
        type: String,
        require: true,
    },
    Email:{
        type: String,
        require: true,
    },
    Password:{
        type: String,
        require: true,
    }
}) 

const User = mongoose.model("user",usersSchema );
module.exports =User;

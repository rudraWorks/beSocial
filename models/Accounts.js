const mongoose = require('mongoose')

const schema = mongoose.Schema({
    username:String,
    name:String,
    bio:String,
    gender:String,
    country:String,
    age:String,
    website:String,
    profilePic:Buffer,
    followers:{
        type:Array,
        default:[]
    },
    following:{
        type:Array,
        default:[]  
    }
})

module.exports = mongoose.model('accounts',schema)
const mongoose = require('mongoose')

const schema = mongoose.Schema({
    postPic:Buffer,
    caption:String,
    postDate:String,
    author:String, 
    likes:{
        type:Array,
        default:[]
    },
    comments:{
        type:Array,
        default:[]
    }
})

module.exports = mongoose.model('posts',schema)
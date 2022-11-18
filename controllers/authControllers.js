const Users = require('../models/users')
const jwt = require('jsonwebtoken')
const Accounts = require('../models/Accounts')
const multer = require('multer')
const sharp = require('sharp')
const Posts = require('../models/Posts')
const { json } = require('express')

let maxAge = 1000*60*60*24*5 // 5 days 
let createToken = (id) =>{
    return jwt.sign({id},'srudra754',{expiresIn:maxAge})
}


module.exports.root = async (req,res) =>{
    let allPosts = await Posts.find({  },{comments:1,likes:1,_id:0})
    let totalPosts = allPosts.length 

    let totalLikes = 0 
    for(let i=0;i<allPosts.length;++i)
        totalLikes+=allPosts[i].likes.length

    let totalComments = 0 
    for(let i=0;i<allPosts.length;++i)
        totalComments+=allPosts[i].comments.length

    let totalRegisteredUsers = await Users.countDocuments()

    return res.render('home',{totalPosts,totalLikes,totalComments,totalRegisteredUsers})
}

module.exports.loginGet = (req,res) =>{
    if(res.locals.isAuthenticated){
        res.locals.message="Already loggedin!";
        return res.render('home')
     }
    res.render('auth/login')
}

module.exports.loginPost = async (req,res) =>{
    if(res.locals.isAuthenticated){
        return res.json({success:false,message:"Already loggedin"})
    }
    let {username,password} = req.body 
    username = username.trim()
    password = password.trim()
    let t = await Users.findOne({username})
    if(!t){
        return res.json({success:false,message:"No user with this username exists!"})
    }
    if(t.password!=password){
        return res.json({success:false,message:"Wrong password!"})
    }
    res.cookie('smartChat',createToken(t.username),{httpOnly:true,maxAge:maxAge})
    res.json({success:true,message:"Successfully logged in"})
}

module.exports.registerGet = (req,res) =>{
    if(res.locals.isAuthenticated){
       res.locals.message="Already registered!";
       return res.render('home')
    }
    res.render('auth/register')
}


function isAlphaNumeric(str) {
    var code, i, len;
  
    for (i = 0, len = str.length; i < len; i++) {
      code = str.charCodeAt(i);
      if (!(code > 47 && code < 58) && // numeric (0-9)
          !(code > 64 && code < 91) && // upper alpha (A-Z)
          !(code > 96 && code < 123)) { // lower alpha (a-z)
        return false;
      }
    }
    return true;
};

module.exports.registerPost = async (req,res) =>{
    if(res.locals.isAuthenticated){
         return res.json({success:false,message:"Already registered"})
    }
    let {username,password,email} = req.body 
    let usernameFetch = await Users.findOne({username})

    username = username.trim()
    password = password.trim()
    email = email.trim()

    if(username=="" || password=="" || email==""){
        return res.json({success:false,message:"Input fields can't be empty!"})
    }
    if(!isAlphaNumeric(username)){
        return res.json({success:false,message:"Username must be alphanumeric!"})
    }
    if(username.length<=5){
        return res.json({success:false,message:"Username length is too short, must be greater than five characters!"})
    }
    if(password.length<=6){
        return res.json({success:false,message:"Password length is too short, must be greater than six characters!"})
    }
    if(usernameFetch){
        if(usernameFetch.username==username){
            return res.json({success:false,message:"This username is already occupied!"})
        }
        if(usernameFetch.email==email){
            return res.json({success:false,message:"This email is already occupied!"}) 
        }
    }

 
    let createUser = await Users.create({username,password,email})
    await Accounts.create({username,name:"NA",age:"NA",profilePic:new Buffer('pic'),country:"NA",website:"NA",gender:"NA",bio:"NA"})
    // console.log(createUser)
    res.cookie('smartChat',createToken(createUser.username),{httpOnly:true,maxAge:maxAge})
    return res.json({success:true,message:"User registered successfully."})

}

module.exports.logout = (req,res) =>{
    res.cookie('smartChat','',{httpOnly:true,maxAge:1})
    res.redirect('/')
}

function _arrayBufferToBase64( buffer ) {

    return buffer.toString('base64')
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    // return btoa( binary );
    // return Buffer.from(binary).toString('base64')
}

module.exports.profile = async (req,res) =>{
    if(!res.locals.isAuthenticated){
        res.locals.message="Please login to access this page!"
        return res.render('auth/login')
    }
    let userFetch = await Accounts.findOne({username:res.locals.user})
    if(!userFetch)
        return res.render('general/404')
    let profilePic = userFetch.profilePic 
    profilePic = _arrayBufferToBase64(profilePic)
    userFetch.profilePic=profilePic
    let posts = await Posts.find({author:res.locals.user}) 
    for(let i=0;i<posts.length;++i){
        posts[i].postPic = _arrayBufferToBase64(posts[i].postPic)
    }
    
    return res.render('auth/profile',{generalInfo:userFetch,postsInfo:posts})
}





module.exports.updateGeneralInfo = async (req,res) =>{

    if(!res.locals.isAuthenticated){
        return res.json({success:false,message:'auth failed'})
    }

    let {name,age,gender,website,bio,country} = req.body 

    let userFetch = await Accounts.findOne({username:res.locals.user})
    let profilePicTemp = userFetch.profilePic
    let profilePic
    if(req.file)
    profilePic = await sharp(req.file.buffer).resize({width:200,height:200}).png().toBuffer()
    else profilePic=profilePicTemp
    // console.log(profilePic)
    await Accounts.findOneAndUpdate({username:res.locals.user},{name,age,gender,website,bio,country,profilePic})
    // return res.json({success:true,message:'updation successful'})
    return res.redirect('/profile')
} 

module.exports.accountFollow = async (req,res) =>{


    let {whom,by} = req.body 
    if(!res.locals.isAuthenticated || res.locals.user != by) {
        return res.json({success:false,message:'Please login to follow this account!'})
    }
    let t =await Accounts.findOne({username:whom}) 
    if(!t){
        return res.json({success:false,message:'auth failed'})
    }
    // console.log(req.body)
    let fetchAccountBy = await Accounts.findOne({username:by})
    let prevFollowingArrBy = fetchAccountBy.following 
    prevFollowingArrBy.unshift(whom)
    await Accounts.findOneAndUpdate({username:by},{following:prevFollowingArrBy})

    let fetchAccountWhom = await Accounts.findOne({username:whom})
    let prevFollowersArrWhom = fetchAccountWhom.followers
    prevFollowersArrWhom.unshift(by)
    await Accounts.findOneAndUpdate({username:whom},{followers:prevFollowersArrWhom})

    return res.json({success:true,message:"done"})

}


module.exports.accountUnfollow = async (req,res) =>{

    if(!res.locals.isAuthenticated){
        return res.json({success:false,message:'Please login to unfollow this account!'})
    }
    let {whom,by} = req.body 

    let fetchAccountBy = await Accounts.findOne({username:by})
    let prevFollowingArrBy = fetchAccountBy.following 
    let index = prevFollowingArrBy.indexOf(whom);
    if (index > -1) { 
      prevFollowingArrBy.splice(index, 1); 
    }
    await Accounts.findOneAndUpdate({username:by},{following:prevFollowingArrBy})

    let fetchAccountWhom = await Accounts.findOne({username:whom})
    let prevFollowersArrWhom = fetchAccountWhom.followers 
    index = prevFollowersArrWhom.indexOf(by);
    if (index > -1) { 
        prevFollowersArrWhom.splice(index, 1); 
    }
    await Accounts.findOneAndUpdate({username:whom},{followers:prevFollowersArrWhom})

    return res.json({success:true,message:"done"})
}
const Users = require('../models/users')
const Posts = require('../models/Posts')
const moment = require('moment')
const sharp = require('sharp')
const badWords = require('bad-words')
const Accounts = require('../models/Accounts')


let bad = new badWords()

module.exports.createPost = (req,res) =>{
    if(!res.locals.user){
        res.locals.message="Please login to create a post!"
        res.locals.messageBackground="tomato"
        return res.render('auth/login')
    }
    return res.render('posts/createPostPage')
}

module.exports.uploadPost = async(req,res) =>{
    if(!res.locals.user){
        res.locals.message="Please login to create a post!"
        res.locals.messageBackground="tomato"
        return res.render('auth/login')
    }
    let {caption} = req.body 

    let postPic 
    try{
        postPic = await sharp(req.file.buffer).resize({width:300,  fit: sharp.fit.contain}).png().toBuffer()
    }
    catch(e){
        res.locals.message ="Please select an image!"
        res.locals.messageBackground = "tomato"
        return res.render('posts/createPostPage')
    }

    if(bad.isProfane(caption)){
        res.locals.message ="Profane words not allowed!"
        res.locals.messageBackground = "tomato"
        return res.render('posts/createPostPage')     
    }
    let postDate = moment().format('ll')
    await Posts.create({author:res.locals.user,caption,postPic,postDate})
    return res.redirect('/profile')
}

function _arrayBufferToBase64( buffer ) {
    return buffer.toString('base64')
}

module.exports.showPost = async (req,res) =>{
    let {post_id} = req.query
    let fetchPost
    try{
        fetchPost = await Posts.findOne({_id:post_id},{postViews:1})
    }
    catch(e){
        return res.render('general/404')
    }
    if(!fetchPost)
        return res.render('general/404')

    fetchPost.postViews=fetchPost.postViews+1

    fetchPost = await Posts.findOneAndUpdate({_id:post_id},fetchPost,{new:true})
    fetchPost.postPic = _arrayBufferToBase64(fetchPost.postPic)

    return res.render('posts/showPost',{postDetails:fetchPost})
}

module.exports.addComment = async (req,res) =>{ 

    let {commentText,author,post_id} = req.body 
    if(!author){
        return res.json({success:false,message:"Please login to add comments!"})
    }
   
    // console.log(post_id,author)  
    let t = await Posts.findOne({_id:post_id}) 
    if(!t){
        // console.log(t)
        return res.json({success:false,message:"Something went wrong!"})
    }   
    let prevComment = t.comments
    
    prevComment.unshift({commentText,author,post_id,commentDate:moment().format('ll'),comment_id:Date.now().toString()})
    await Posts.findOneAndUpdate({_id:post_id},{comments:prevComment})
    return res.json({success:true,message:"success"})
}
 
module.exports.deleteComment = async (req,res) =>{

    let {comment_id,author,post_id} = req.body 
    if(!author){
        return res.json({success:false,message:"Please login to delete this comment!"})
    }
    let fetchPost = await Posts.findById(post_id);
    if(!fetchPost || !res.locals.user){
        return res.json({success:false,message:"invalid post!"})      
    }
    let oriCommentsArray = fetchPost.comments 
    let newCommentsArray = [] 
    for(let i=0;i<oriCommentsArray.length;++i){
        if(oriCommentsArray[i].comment_id==comment_id)continue 
        newCommentsArray.push(oriCommentsArray[i])
    }
    await Posts.findOneAndUpdate({_id:post_id},{comments:newCommentsArray})
    return res.json({success:true,message:"comment deleted successfully"})
}

module.exports.deletePost = async (req,res) =>{

    let {post_id} = req.body 
    let fetchPost = await Posts.findById(post_id)
    if(!fetchPost || !res.locals.user)
        return res.json({success:false,message:"invalid post"})
    await Posts.findOneAndRemove({_id:post_id})
    return res.json({success:true,message:"post deleted successfully"})
}

module.exports.likePost = async (req,res) =>{


    let {post_id,author} = req.body 
    let fetchPost = await Posts.findById(post_id)
    if(!fetchPost || !res.locals.user)
        return res.json({success:false,message:"Please login to like this post!"})
    let prevLikesArr = fetchPost.likes 
    prevLikesArr.unshift(author) 
    await Posts.findOneAndUpdate({_id:post_id},{likes:prevLikesArr})
    return res.json({success:true,message:"successfully liked"})
}

module.exports.dislikePost = async (req,res) =>{
    let {post_id,author} = req.body 
    let fetchPost = await Posts.findById(post_id)
    if(!fetchPost || !res.locals.user)
        return res.json({success:false,message:"Please login to dislike this post!"})
    let prevLikesArr = fetchPost.likes 
    const index = prevLikesArr.indexOf(author);
    if (index > -1) { 
        prevLikesArr.splice(index, 1);
    }
    await Posts.findOneAndUpdate({_id:post_id},{likes:prevLikesArr})
    return res.json({success:true,message:"successfully disliked"})
}

module.exports.user = async (req,res) =>{
    // console.log(req.query)
    let accountsFetch = await Accounts.findOne({username:req.query.username})
    if(!accountsFetch){
        res.locals.message="No user found with username: "+req.query.username
        res.locals.messageBackground="tomato"
        return res.render('general/404',{statusCode:"404",message:"No user with username "+req.query.username+" exist!"})
    }
    
    let profilePic = accountsFetch.profilePic 

    profilePic = _arrayBufferToBase64(profilePic)
    accountsFetch.profilePic=profilePic

    let posts = await Posts.find({author:req.query.username}) 
    for(let i=0;i<posts.length;++i){
        posts[i].postPic = _arrayBufferToBase64(posts[i].postPic)
    }
    
    return res.render('general/user',{generalInfo:accountsFetch,postsInfo:posts})
}
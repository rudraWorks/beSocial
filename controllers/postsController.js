const Users = require('../models/users')
const Posts = require('../models/Posts')
const moment = require('moment')
const sharp = require('sharp')
const Accounts = require('../models/Accounts')

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
        postPic = await sharp(req.file.buffer).resize({width:200,height:200}).png().toBuffer()
    }
    catch(e){
        res.locals.message ="Please select an image!"
        res.locals.messageBackground = "tomato"
        return res.render('posts/createPostPage')
    }
    // console.log(postPic)
    // console.log(postPic)
    let postDate = moment().format('ll')
    await Posts.create({author:res.locals.user,caption,postPic,postDate})
    return res.redirect('/profile')
}

function _arrayBufferToBase64( buffer ) {
    return buffer.toString('base64')
    var binary = '';
    var bytes = new Uint8Array( buffer );
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return btoa( binary );
    // let res = Buffer.from(binary).toString('base64')
    // const str1 = res
    // let arr=[]
    // for(let i=0;i<str1.length;++i)
    //       arr.push(str1[i])
    // while(arr[arr.length-1]=='!')arr.pop()
    // let str2="";
    // for(let i=0;i<arr.length;++i)
    //       str2+=(arr[i])
    // return str2
}

module.exports.showPost = async (req,res) =>{
    let {post_id} = req.query
    let fetchPost
    try{
        fetchPost = await Posts.findOne({_id:post_id})
    }
    catch(e){
        return res.render('general/404')
    }
    if(!fetchPost)
        return res.render('general/404')

    // console.log(fetchPost)
    fetchPost.postPic = _arrayBufferToBase64(fetchPost.postPic)
    
    // console.log(fetchPost)
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
        return res.render('general/404')
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
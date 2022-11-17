const {Router} = require('express')
const postsController = require('../controllers/postsController')
const multer = require('multer')


const router = Router()

const upload = multer({
    // dest:'images',
    limits:{
        fileSize:4000000 // 4 mb 
    },
    fileFilter(req,file,cb){ 
       if(  !(file.originalname.endsWith('.PNG')) && 
            !(file.originalname.endsWith('.jpg')) && 
            !(file.originalname.endsWith('.JPG')) && 
            !(file.originalname.endsWith('.png')) && 
            !(file.originalname.endsWith('.jpeg')) && 
            !(file.originalname.endsWith('.JPEG')) ){ 
            return cb(new Error('please upload an image')) 
       }
        cb(undefined,true) 
    }
})


router.get('/createPost',postsController.createPost)
router.post('/uploadPost',upload.single('postPic'),postsController.uploadPost, (error,req,res,next) =>{
    if(error.message=='File too large')
        error.message="File size is too large, max limit is 4mb!"
    res.locals.message = error.message 
    res.locals.messageBackground = 'tomato'
    res.render('posts/createPostPage')
})
router.get('/showPost',postsController.showPost)
router.post('/addComment',postsController.addComment)
router.post('/deleteComment',postsController.deleteComment)
router.post('/deletePost',postsController.deletePost)
router.post('/likePost',postsController.likePost)
router.post('/dislikePost',postsController.dislikePost)
router.get('/user',postsController.user)

module.exports = router
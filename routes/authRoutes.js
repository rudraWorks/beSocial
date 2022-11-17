const {Router} = require('express') 
const authControllers = require('../controllers/authControllers')
const multer = require('multer')


const router = Router()

const upload = multer({
    // dest:'images',
    limits:{
        fileSize:4000000 // 1 mb 
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

router.get('/',authControllers.root)
router.get('/login',authControllers.loginGet)
router.post('/login',authControllers.loginPost)
router.get('/register',authControllers.registerGet)
router.post('/register',authControllers.registerPost)
router.get('/logout',authControllers.logout)
router.get('/profile',authControllers.profile)
router.post('/updateGeneralInfo',upload.single('pic'),authControllers.updateGeneralInfo,(error,req,res,next) =>{
    if(error.message=='File too large')
        error.message="File size is too large, max limit is 4mb!"
    res.locals.message = error.message 
    res.locals.messageBackground = 'tomato'
    // res.render('auth/profile')
    res.render('general/404',{errorMessage:error.message,statusCode:"413"})
})
router.post('/accountFollow',authControllers.accountFollow)
router.post('/accountUnfollow',authControllers.accountUnfollow)

module.exports = router 
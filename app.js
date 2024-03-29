const express = require('express')
const cookieParser = require('cookie-parser')
const mongoose = require('mongoose')
const Users = require('./models/users')
require('dotenv').config()

const authRoutes = require('./routes/authRoutes')
const {checkAuth} = require('./middlewares/checkAuth')
const postRoutes = require('./routes/postsRoutes')

// const DB = "mongodb://127.0.0.1:27017/smartChat"
const DB = process.env.DB
mongoose.connect(DB,{useNewUrlParser: true,useUnifiedTopology: true,}).then(()=>{console.log("connected to db")}).catch(()=>{"error connecting"})
   

const app = express() 

app.set('view engine','ejs')
app.use(express.json())
app.use(cookieParser()) 
app.use(express.urlencoded({extended:true}))
app.use(express.static(__dirname+"/public"))

app.use(checkAuth)
app.use(authRoutes)
app.use(postRoutes)
 

app.get('/updates',(req,res)=>{
    res.render('general/updates')
})

app.get('*',(req,res)=>{
    res.render('general/404')
})


const PORT = process.env.PORT || 3000
app.listen(PORT,()=>{ 
    console.log('Connected to port '+PORT)
}) 
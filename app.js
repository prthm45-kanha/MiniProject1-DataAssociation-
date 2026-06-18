const express=require('express');
const app=express();
const path=require('path');
const cookieParser=require('cookie-parser');
const jwt=require('jsonwebtoken');
const bcrypt=require('bcrypt');
const userModel=require('./models/user');
const postModel=require('./models/post');


app.use(cookieParser());
app.set('view engine','ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));


app.get('/',(req,res)=>{
    res.render('index');
})
app.get('/login',(req,res)=>{
    res.render('login');
})
 app.get('/logout',(req,res)=>{
    res.cookie("token","");
    res.redirect('/login');
 })
app.post('/login',async (req,res)=>{
    let{email,password}=req.body;
    let findUser=await userModel.findOne({email});
    if(!findUser) res.status(500).send("Something Went Wrong");

    bcrypt.compare(password,findUser.password,(err,result)=>{
        if(result) res.status(200).send("Thank You For Login");
        else res.redirect('/login');
    })
});

app.post('/register',async (req,res)=>{
    let{username,name,age,email,password}=req.body;
    let findUser=await userModel.findOne({email,username});
    if(findUser) return res.redirect('/login');

    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt,async (err,hash)=>{
            let createUser= await userModel.create({
                username,
                name,
                age,
                email,
                password:hash
            });
            let tokenn = jwt.sign({email:email,userid:createUser._id},"secret");
            res.cookie("token",tokenn);
            res.send("registered")
        })
    })


})
app.listen(3000,()=>{
    console.log("Server is running on port 3000");
})
const express=require('express');
const app=express();
const path=require('path');
const cookieParser=require('cookie-parser');
const jwt=require('jsonwebtoken');
const bcrypt=require('bcrypt');
const userModel=require('./models/user');
const postModel=require('./models/post');
const user = require('./models/user');
const multer=require('multer');
const crypto=require('crypto');

app.use(cookieParser());
app.set('view engine','ejs');
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    crypto.randomBytes(12,(err,bytes)=>{
     const fn=bytes.toString('hex')+path.extname(file.originalname)
     cb(null, fn)
    })
  }
})

const upload = multer({ storage: storage })


app.get('/',(req,res)=>{
    res.render('index');
})
app.get('/test',(req,res)=>{
    res.render('test');
})
app.post('/upload',upload.single('image'),(req,res)=>{
    console.log(req.file);
})
app.get('/login',(req,res)=>{
    res.render('login');
})
app.get('/logout',(req,res)=>{
    res.cookie("token","");
    res.redirect('/login');
})
app.get('/profile',isLoggedIn,async (req,res)=>{
    let useer=await userModel.findOne({email:req.user.email}).populate('posts');
    console.log(useer);
    
    res.render('profile',{useer});
})
app.get('/like/:id',isLoggedIn,async (req,res)=>{
    let post=await postModel.findOne({_id:req.params.id}).populate('user');
    if(post.likes.indexOf(req.user.userid)=== -1){
        post.likes.push(req.user.userid);
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid),1);
    }
      await post.save();
      res.redirect('/profile');
    
    
})
app.get('/edit/:id',isLoggedIn,async (req,res)=>{
    let post=await postModel.findOne({_id:req.params.id}).populate('user');

      res.render('edit',{post});
    
    
})
app.post('/update/:id',isLoggedIn,async (req,res)=>{
    let post=await postModel.findOneAndUpdate({_id:req.params.id},{content:req.body.contentt});
    res.redirect('/profile');
})

app.post("/post",isLoggedIn,async (req,res)=>{
    let useer= await userModel.findOne({email:req.user.email});
    let{contentt}=req.body;
    let post=await postModel.create({
        user:useer._id,
        content:contentt
    });
    useer.posts.push(post._id);
    await useer.save();
    res.redirect('/profile')
})
function isLoggedIn(req,res,next){
    if(req.cookies.token === "") res.redirect("/login")
        else{
    let data=jwt.verify(req.cookies.token,"secret");
    req.user=data;
    next();
    }
}
app.post('/login',async (req,res)=>{
    let{email,password}=req.body;
    let findUser=await userModel.findOne({email});
    if(!findUser) res.status(500).send("Something Went Wrong");

    bcrypt.compare(password,findUser.password,(err,result)=>{
        if(result){
            let tokenn = jwt.sign({email:email,userid:findUser._id},"secret");
           res.cookie("token",tokenn);
             res.status(200).redirect('/profile');
        }

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
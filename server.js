const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const res = require('express/lib/response');
const User = require('./model/userData')
const admin = require('./model/adminData');
require('dotenv').config();
const quesData = require('./model/questions')

async function db(){
    await mongoose.connect(process.env.DB_URI);
}

db()
    .then(res=>console.log("Connection Established"))
    .catch(err=>console.log(`error ${err}`));

const port = process.env.port || 3000;
const application = express();

application.set('view engine','ejs');
application.use(cookieParser());
application.use(express.urlencoded({extended:true}));

application.use((req,res,next)=>{
    const {auth} = req.cookies;

    if(auth){
       req.isAuthenticated = true;
    }else{
       req.isAuthenticated = false;
    }
    next();
})

const isAuthenticated = (req,res,next)=>{
    if(req.isAuthenticated){
        next();
    }else{
        res.status(401).redirect("/");
    }
}

application.get("/", (req, res)=>{
    res.render("home");
})

application.get("/login",(req,res)=>{
    console.log("Login page called");
    res.render('login');
})

application.get("/register",(req,res)=>{
    console.log("Register page called");
    res.render('register',{"error":""});
})

application.get('/home', (req, res)=>{
    res.render('home')
})

application.get('/admin', (req, res)=>{
    console.log('/admin called');
    res.render('admin')
})

application.get('/adminPanel', (req, res)=>{
    console.log('/adminPanel called');
    res.render('adminPanel')
})

application.get('/submissionsDone', (req, res)=>{
    res.render('submissionsDone');
})

application.get('/logout', (req, res)=>{
    res.clearCookie("auth")
    res.render('logout');
})

application.get('/quesDetails', (req, res)=>{
    res.render('quesDetails');
})

application.get('/about', (req, res)=>{
    res.render('about');
})

application.post('/register',async (req,res)=>{
    console.log(req.body);
    const {username,password,conpassword} = req.body;
    try{
        if(!username || !password || !conpassword){
            res.status(401).render('register',{'error':"Enter username and password(or Confirm Password)"})
            return;
        }
        const existingUser = await User.findOne({username});
        if(existingUser){
            res.status(400).render('register',{"error":"Username already exists"})
            return;
        }
        const hashedPassword = bcrypt.hashSync(password,10);
        const newUser = new User({
            username,
            password:hashedPassword
        })

        if(password !== conpassword){
            res.status(401).render('register',{'error':"Password and confirm password doesn't matches"});
            return;
        }
        
        await newUser.save();
        res.status(201).redirect('/login');
    }catch(error){
        console.log(error);
        res.status(500).render('register',{'error':"Internal server error"})
    }
})

application.post('/login',async (req,res)=>{
    const {username,password} = req.body;
    try{
        const user = await User.findOne({username});
        if(user && bcrypt.compareSync(password,user.password)){
            res.cookie('auth',true);
            res.status(201).redirect('/userData');
        }else{
            res.status(500).render('login',{'error':"Incorrect username/password"})
        }
    }catch(error){
        console.log(error);
        res.status(500).render('login',{'error':"Internal server error"})
    }
})

application.post('/admin', isAuthenticated, async(req, res)=>{
    const { username, password, Eid } = req.body;
    console.log(req.body);
    try{
        const adminData = await admin.findOne({ username });
        if(username && ((password===adminData.password) && (Eid==adminData.id))){
            res.cookie('auth', true);
            res.status(201).redirect('/adminPanel');
        }
        else{
            res.status(401).render('admin',{'error':"Incorrect information"})
        }
    }catch(error){
        console.log(error);
        res.status(500).render('admin',{'error':"Internal server error"})
    }
})

application.post('/adminPanel', isAuthenticated, async(req, res) => {
    console.log(req.body);
    const { name, difficulty, description } = req.body;
    try {
        if (!name || !difficulty || !description) {
            res.status(401).render('adminPanel', {'error': "All fields are mandatory"});
            return;
        }
        const questionExists = await quesData.findOne({ name });
        if (questionExists) {
            res.status(400).render('adminPanel', {'error': "Question already exists"});
            return;
        }

        const newQues = new quesData({
            name,
            difficulty,
            description
        });

        await newQues.save();
        res.status(201).redirect('/submissionsDone');
    } catch (error) {
        console.log(error);
        res.status(500).render('adminPanel', {'error': "Internal server error"});
    }
});


application.get('/userData', async(req, res) => {
    try{
        const questionArray = await quesData.find({}, 'name difficulty description');
        const question = questionArray.map(questionsData =>({
            name: questionsData.name,
            difficulty: questionsData.difficulty,
            description: questionsData.description
        }));
        console.log(question);
        res.status(201).render('userData', { question });
    }catch(error){
        res.status(500).send("Internal server error")
        console.log(error);
    }
})

application.listen(port, ()=>{
    console.log("Server Started");
})
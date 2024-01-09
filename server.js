const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const res = require('express/lib/response');
const User = require('./model/userData')
const axios = require('axios');
const databaseUri = 'mongodb://127.0.0.1:27017/LetsCode';


async function db(){
    await mongoose.connect(databaseUri);
}

db()
    .then(res=>console.log("DB connected"))
    .catch(err=>console.log(`error ${err}`));

const port = 3000;
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
        res.status(401).redirect("/login");
    }
}

application.get("/login",(req,res)=>{
    console.log("Login page called");
    res.render('login');
})

application.get("/register",(req,res)=>{
    console.log("Register page called");
    res.render('register',{"error":""});
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
            console.log("Called not matching");
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

application.use('/userData', async(req, res) => {
    console.log("/called");

    try{
        const response = await axios.get(`https://leetcode-api-faisalshohag.vercel.app/Sameer_Vohra`);
        const fetchData = response.data;

        const totalQuestionsSubmitted = fetchData.totalSubmissions
            .filter(submission => submission.difficulty === "All")
            .reduce((acc, submission) => acc + submission.count, 0);

        const easyQuestionsSubmitted = fetchData.totalSubmissions
            .filter(submission => submission.difficulty==="Easy")
            .reduce((acc, submission) => acc + submission.count, 0);
        
        const medQuestionsSubmitted = fetchData.totalSubmissions
            .filter(submission => submission.difficulty==="Medium")
            .reduce((acc, submission) => acc+submission.count, 0);
        
        const hardQuestionsSubmitted = fetchData.totalSubmissions
            .filter(submission => submission.difficulty==="Hard")
            .reduce((acc, submission) => acc+submission.count,0)

        console.log(easyQuestionsSubmitted);
        console.log(medQuestionsSubmitted);
        console.log(hardQuestionsSubmitted);
        console.log(totalQuestionsSubmitted);
        res.render('userData', { fetchData,totalQuestionsSubmitted, easyQuestionsSubmitted, medQuestionsSubmitted, hardQuestionsSubmitted });
    }catch(error){
        console.log("Error fetching the API", error.message);
        res.status(500).json({ error: 'Internal server error' });
    }

})

application.listen(port, ()=>{
    console.log("Server Started");
})

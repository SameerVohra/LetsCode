const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const res = require('express/lib/response');
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

application.get('/login', (req, res)=>{
    console.log("Login page called");
        res.render('login');
})

application.get("/register",(req,res)=>{
    res.render('register',{"error":""});
})

application.get('/userData', async(req, res) => {
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
    console.log("Hello from the server");
})

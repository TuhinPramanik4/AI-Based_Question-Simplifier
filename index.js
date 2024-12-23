const express = require('express');
const mongoose = require('mongoose');
const User = require("./db_Schemas/Users");
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const bodyparser = require('body-parser');
const app = express();

mongoose.connect('mongodb://localhost:27017/Question-Simplifier').then(()=>{
    console.log("MongoDB connected");
});
app.use(express.urlencoded({ extended: true }));
app.use(express.json());



const genAI = new GoogleGenerativeAI(" ");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get("/chat", (req, res) => {
    res.render('Chat-Interface');
});
app.get("/Sign-up",(req,res)=>{
      res.render('SignUP');
});
app.get("/signin",(req,res)=>{
    res.render('sign-in');
})
app.get("/",(req,res)=>{
    res.render('Start');
})
app.post("/Send-Question", async (req, res) => {
    const ques = req.body.question;
    console.log("Question is:", ques);

    const prompt = ques + " simplify this question. and don't provide the solution , you can provide example give the response point wise like 1: , 2: ....";

    try {
        const result = await model.generateContent(prompt); 

        if (result && result.response && typeof result.response.text === 'function') {
            
            const simplifiedText = await result.response.text();  

            console.log("Simplified Question:", simplifiedText);
            res.send(simplifiedText);
        } else {
            console.error("Unexpected result structure:", result);
            res.status(500).json({ error: "Failed to process response correctly." });
        }
    } catch (error) {
       
        console.error("Error generating content:", error);
        res.status(500).json({ error: "Failed to generate content." });
    }
});
app.post("/Sign-up", async  (req,res)=>{
   try{
    console.log("Request Body : ", req.body);
    const name = String(req.body.UserName);
    console.log(`User Name: ${name}`);
    const Mail = String(req.body.email);
    const PassWord = String( req.body.UserPassword);
    if(!name || !Mail || !PassWord){
       return  res.status(400).send("Invalid Credentials");
    }
    const Check_for_Existing_User  = await User.findOne({
        Email : Mail
    });
     if(Check_for_Existing_User){
        return res.status(400).send("Account already Exixst , Please Sign in ");
     }
    const NewUser = new User({
        Name: name ,
        Email: Mail ,
        Password: PassWord,
    })
    await NewUser.save();
    res.render('Sign-in');
   }catch(e){
        console.log("Somthing Went Wrong");
        res.status(500).send("Internal Server Error")
   }
});

app.post("/signin", async (req,res)=>{
           try{
              const Usermail = req.body.UserMail;
              const userPassword = req.body.PassWord;

                  const check_For_Mail = await User.findOne({
                    Email: Usermail
                  })
                  if(!check_For_Mail){
                     return res.send("Account does not Exists ");
                  }
                  if(check_For_Mail.Password !=userPassword ){
                    return res.send("Invalid Password");
                  }
                  return res.render('Chat_Interface')
           }catch(e){
            return res.status(500).send("Something Went Wrong");
           }
})

app.listen(8000, () => {
    console.log("Server started at port: 8000");
});

const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('./db_Schemas/Users');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cookieParser = require('cookie-parser');
const app = express();

const secret = "Tuhin";

// For MongoDB connection
mongoose.connect('Give your MongoDB connection URL here', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

// For  Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

//For Google Generative AI setup
const genAI = new GoogleGenerativeAI("(Enter your API KEY)");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//For Set up EJS views
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//For get request Routes
app.get('/chat', (req, res) => res.render('Chat'));
app.get('/sign-up', (req, res) => res.render('SignUP'));
app.get('/signin', (req, res) => res.render('sign-in'));
app.get('/', (req, res) => res.render('Start'));

// Helper to verify JWT
function getUser(token) {
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        console.error("Invalid Token:", error);
        return null;
    }
}

//For  POST requests
app.post('/send-question', async (req, res) => {
    const ques = req.body.question;
    console.log("Question is:", ques);

    const prompt = `${ques} simplify this question. Do not provide the solution. Provide an example and respond point-wise like 1:, 2:, etc.`;

    try {
        const result = await model.generateContent(prompt);

        if (result?.response?.text) {
            const simplifiedText = result.response.text();
            console.log("Simplified Question:", simplifiedText);
            return res.send(simplifiedText);
        }

        console.error("Unexpected result structure:", result);
        res.status(500).json({ error: "Failed to process response correctly." });
    } catch (error) {
        console.error("Error generating content:", error);
        res.status(500).json({ error: "Failed to generate content." });
    }
});

app.post('/sign-up', async (req, res) => {
    try {
        const { UserName, email, UserPassword } = req.body;

        if (!UserName || !email || !UserPassword) {
            return res.status(400).send("Invalid Credentials");
        }

        const existingUser = await User.findOne({ Email: email });
        if (existingUser) {
            return res.status(400).send("Account already exists. Please sign in.");
        }

        const hashedPassword = await bcrypt.hash(UserPassword, 10);

        const newUser = new User({
            Name: UserName,
            Email: email,
            Password: hashedPassword,
        });
        await newUser.save();
        res.render('sign-in');
    } catch (error) {
        console.error("Error during sign-up:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/signin', async (req, res) => {
    try {
        const { UserMail, PassWord } = req.body;

        const user = await User.findOne({ Email: UserMail });
        if (!user) {
            return res.status(400).send("Account does not exist.");
        }

        const isMatch = await bcrypt.compare(PassWord, user.Password);
        if (!isMatch) {
            return res.status(400).send("Invalid Password.");
        }

        const token = jwt.sign({ id: user._id, email: user.Email }, secret, { expiresIn: '1h' });
        res.cookie('uuid', token, { httpOnly: true, secure: true, sameSite: 'strict' });

        res.render('Chat');
    } catch (error) {
        console.error("Error during sign-in:", error);
        res.status(500).send("Something went wrong. Please try again later.");
    }
});

//  To Start the server
app.listen(8000, () => {
    console.log("Server started at port: 8000");
});

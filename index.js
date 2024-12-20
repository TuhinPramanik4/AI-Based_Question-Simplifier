const express = require('express');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const bodyparser = require('body-parser');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const genAI = new GoogleGenerativeAI("Enter APIKEY here");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get("/", (req, res) => {
    res.render('home');
});

app.post("/Send-Question", async (req, res) => {
    const ques = req.body.question;
    console.log("Question is:", ques);

    const prompt = ques + " simplify this question. and don't provide the solution , you can provide example";

    try {
        const result = await model.generateContent(prompt); 

        if (result && result.response && typeof result.response.text === 'function') {
            
            const simplifiedText = await result.response.text();  

            console.log("Simplified Question:", simplifiedText);
            res.json({ simplifiedQuestion: simplifiedText });
        } else {
            console.error("Unexpected result structure:", result);
            res.status(500).json({ error: "Failed to process response correctly." });
        }
    } catch (error) {
       
        console.error("Error generating content:", error);
        res.status(500).json({ error: "Failed to generate content." });
    }
});


app.listen(8000, () => {
    console.log("Server started at port: 8000");
});

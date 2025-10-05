// Import packages
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const axios = require('axios');

// Create an Express app
const app = express();
const port = 3000;

// Use middleware
app.use(cors());
app.use(express.json());

// Update the chat endpoint to call OpenRouter
app.post('/chat', async (req, res) => {
    try {
        // UPDATED: Receive message, emotion, and name
        const userMessage = req.body.message;
        const userEmotion = req.body.emotion || 'neutral';
        const userName = req.body.name || 'Crew Member'; // Default to 'Crew Member' if no name is recognized

        console.log(`Received message: "${userMessage}", User: ${userName}, Emotion: ${userEmotion}`);

        // Make an API call to OpenRouter
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "nvidia/nemotron-nano-9b-v2:free",
                messages: [
                    // UPDATED: Add the user's name to the system context
                    { 
                        role: "system", 
                        content: `You are MAITRI, an AI assistant for astronauts. The user you are speaking to is named '${userName}'. Address them by name when it feels natural. The user is currently expressing a '${userEmotion}' emotion. Tailor your response to be empathetic and relevant to their emotional state.` 
                    },
                    { role: "user", content: userMessage }
                ]
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "HTTP-Referer": "http://localhost",
                    "X-Title": "MAITRI AI Assistant"
                }
            }
        );

        const aiResponse = response.data.choices[0].message.content;

        res.json({
            reply: aiResponse
        });

    } catch (error) {
        console.error("Error with OpenRouter API:", error.response ? error.response.data : error.message);
        res.status(500).json({ reply: "I'm sorry, I had an issue connecting to the OpenRouter service." });
    }
});

// ENDPOINT FOR HANDLING REPORTS
app.post('/report', (req, res) => {
    try {
        const reportText = req.body.report;
        if (!reportText || reportText.trim() === '') {
            return res.status(400).json({ message: 'Report content cannot be empty.' });
        }

        console.log("\n--- DAILY REPORT RECEIVED ---");
        console.log(reportText);
        console.log("---------------------------\n");
        
        res.status(200).json({ message: 'Report received successfully!' });

    } catch (error) {
        console.error("Error saving report:", error);
        res.status(500).json({ message: 'Failed to save the report on the server.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`🤖 MAITRI server is listening at http://localhost:${port}`);
});


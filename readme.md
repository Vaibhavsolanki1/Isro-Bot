MAITRI - A Context-Aware AI Assistant for Astronauts
MAITRI is a full-stack AI-powered application designed to provide psychological support and monitoring for individuals in isolated, high-stress environments, with astronauts as the primary use case. It uses in-browser AI for real-time analysis and a powerful backend language model to provide context-aware, empathetic, and personalized interactions.

(Suggestion: Replace this with a screenshot of your working application)

🚀 Core Features
Real-time Emotion Detection: Uses face-api.js to analyze the user's facial expressions directly in the browser, ensuring privacy and speed.

Personalized Face Recognition: Learns a user's face from a reference photo to provide personalized greetings and track interactions.

Context-Aware Chat: Combines the user's message, detected emotion, and identity into an enriched prompt for a Large Language Model (LLM), resulting in more intelligent and empathetic responses.

Voice Activation: Features an "always-on" listening mode that activates on the wake word "Hey MAITRI" for a complete hands-free experience.

Interactive Support Modules: Includes features like a guided breathing exercise and a daily reporting tool.

🛠️ Technology Stack
Front-End: Vanilla JavaScript, HTML5, Tailwind CSS

In-Browser AI: face-api.js

Voice I/O: Web Speech API

Back-End: Node.js, Express.js

Language Model: Connected to NVIDIA Nemotron via the OpenRouter API.

⚙️ Setup and Installation
Prerequisites
Node.js installed

A modern web browser that supports the Web Speech API (e.g., Google Chrome)

An API key from OpenRouter

Installation Steps
Clone the repository:

git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
cd your-repo-name

Install backend dependencies:

cd Backend
npm install

Set up the API Key:

In the Backend folder, create a file named .env.

Add your OpenRouter API key to it:

OPENROUTER_API_KEY=YOUR_API_KEY_HERE

Run the application:

In one terminal, start the backend server:

cd Backend
node server.js

In a second terminal, open the Frontend/index.html file with a live server extension (like VS Code's "Live Server").

This project was developed by Vaibhav.

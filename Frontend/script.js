document.addEventListener('DOMContentLoaded', async () => {
    // --- DOM Elements ---
    const video = document.getElementById('camera');
    const cameraError = document.getElementById('cameraError');
    const astroVideo = document.getElementById('astroVideo');
    const chatBox = document.getElementById('chatBox');
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const micBtn = document.getElementById('micBtn');

    // --- Emotion Status DOM Elements ---
    const emotionStatusEl = document.querySelector('.emotion-box p:nth-child(2) b');
    const confidenceEl = document.querySelector('.emotion-box p:nth-child(3)');
    const physicalStateEl = document.querySelector('.emotion-box p:nth-child(4)');

    // --- State Variables ---
    let currentDetectedEmotion = 'neutral';
    let identifiedUserName = 'Crew Member';
    let faceMatcher = null;
    let isMaitriActive = false;
    let recognitionError = false; // <-- NEW: Flag to track network errors

    // --- Load Models and Start Video ---
    async function setupFaceAPI() {
        try {
            console.log("Loading AI Models...");
            await faceapi.nets.tinyFaceDetector.loadFromUri('models');
            await faceapi.nets.faceLandmark68Net.loadFromUri('models');
            await faceapi.nets.faceRecognitionNet.loadFromUri('models');
            await faceapi.nets.faceExpressionNet.loadFromUri('models');
            console.log("AI Models Loaded Successfully.");

            faceMatcher = await createFaceMatcher();
            startVideo();
        } catch (error) {
            console.error("Error loading the AI models:", error);
            cameraError.textContent = "Could not load AI models. Check file paths.";
            cameraError.classList.remove('hidden');
        }
    }

    function startVideo() {
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
            .then(stream => { video.srcObject = stream; })
            .catch(err => {
                console.error("Camera access denied:", err);
                video.style.display = 'none';
                cameraError.classList.remove('hidden');
            });
    }

    async function createFaceMatcher() {
        try {
            const referenceImage = await faceapi.fetchImage('astro1.jpg');
            const detections = await faceapi.detectSingleFace(referenceImage, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceDescriptor();
            if (!detections) {
                console.error("Could not find a face in the reference image ('astro1.jpg').");
                return null;
            }
            const labeledDescriptors = [
                new faceapi.LabeledFaceDescriptors('Vaibhav', [detections.descriptor])
            ];
            return new faceapi.FaceMatcher(labeledDescriptors, 0.6);
        } catch (error) {
            console.error("Error creating face matcher:", error);
            return null;
        }
    }

    // --- Emotion and Face Detection Loop ---
    video.addEventListener('play', () => {
        console.log("Starting real-time detection...");
        setInterval(async () => {
            const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.3 })).withFaceLandmarks().withFaceExpressions().withFaceDescriptor();
            if (detections) {
                physicalStateEl.textContent = 'Physical State: Active';
                const expressions = detections.expressions;
                let primaryEmotion = 'neutral';
                let maxConfidence = 0;
                for (const [emotion, confidence] of Object.entries(expressions)) {
                    if (confidence > maxConfidence) {
                        maxConfidence = confidence;
                        primaryEmotion = emotion;
                    }
                }
                currentDetectedEmotion = primaryEmotion;
                emotionStatusEl.textContent = primaryEmotion.charAt(0).toUpperCase() + primaryEmotion.slice(1);
                confidenceEl.textContent = `Confidence: ${Math.round(maxConfidence * 100)}%`;

                if (faceMatcher && detections.descriptor) {
                    const bestMatch = faceMatcher.findBestMatch(detections.descriptor);
                    identifiedUserName = bestMatch.label === 'unknown' ? 'Crew Member' : bestMatch.label;
                }
            } else {
                physicalStateEl.textContent = 'Physical State: Inactive';
                emotionStatusEl.textContent = 'Unknown';
                confidenceEl.textContent = 'Confidence: 0%';
                identifiedUserName = 'Crew Member';
            }
        }, 500);
    });

    // --- Chat and Video Reply Functionality ---
    let isVideoPlaying = false;

    function playAstronautReply() {
        if (isVideoPlaying) return;
        isVideoPlaying = true;
        astroVideo.classList.remove("hidden");
        astroVideo.currentTime = 0;
        astroVideo.play();
    }

    function pauseAstronautReply() {
        astroVideo.pause();
        isVideoPlaying = false;
    }

    chatForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const userText = userInput.value;
        if (userText.trim() === '') return;
        addMessage(userText, 'astro');
        userInput.value = '';
        getMaitriResponse(userText);
    });

    function addMessage(text, sender) {
        const newMessage = document.createElement('div');
        newMessage.className = `message ${sender}`;
        newMessage.innerText = text;
        chatBox.appendChild(newMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async function getMaitriResponse(userText) {
        const serverUrl = 'http://localhost:3000/chat';
        try {
            const response = await fetch(serverUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userText,
                    emotion: currentDetectedEmotion,
                    userName: identifiedUserName
                })
            });
            if (!response.ok) throw new Error(`Server error: ${response.status}`);
            const data = await response.json();
            const maitriReply = data.reply;
            addMessage(`MAITRI: ${maitriReply}`, 'maitri');
            speakText(maitriReply);
        } catch (error) {
            console.error("Could not connect to the server:", error);
            addMessage("MAITRI: I'm having trouble connecting to my systems right now.", 'maitri');
        }
    }

    // --- Voice Synthesis (Text-to-Speech) ---
    let voices = [];
    function populateVoiceList() { voices = window.speechSynthesis.getVoices(); }
    populateVoiceList();
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = populateVoiceList;
    }
    
    // UPDATED: This version is more robust against browser timing bugs.
    function speakText(text, onEndCallback) {
        // Cancel any previous speech to prevent overlap
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const femaleVoice = voices.find(voice => voice.name.includes('Female') || voice.name.includes('Zira') || voice.name.includes('Samantha'));
        if (femaleVoice) { utterance.voice = femaleVoice; }
        
        // Start the video loop
        playAstronautReply();
        
        // Begin speaking
        window.speechSynthesis.speak(utterance);

        // Robust check to see when speech has actually finished
        const speechCheckInterval = setInterval(() => {
            if (!window.speechSynthesis.speaking) {
                clearInterval(speechCheckInterval); // Stop checking
                pauseAstronautReply(); // Now pause the video
                if (onEndCallback) {
                    onEndCallback();
                }
            }
        }, 250);
    }
    
    // =============================================================
    // == VOICE ACTIVATION LOGIC (UPDATED WITH ERROR HANDLING)    ==
    // =============================================================
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            console.log("Voice recognition started. Listening for wake word...");
            micBtn.classList.add('is-listening');
            recognitionError = false; // Reset error flag on successful start
        };

        // UPDATED: Smarter onend handler
        recognition.onend = () => {
            console.log("Voice recognition stopped.");
            micBtn.classList.remove('is-listening');
            // Only restart if there wasn't a network error.
            if (!recognitionError) {
                console.log("Restarting recognition...");
                recognition.start(); 
            } else {
                console.log("Not restarting due to network error. Click mic to try again.");
            }
        };

        // UPDATED: Smarter onerror handler
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'network') {
                recognitionError = true; // Set flag to prevent auto-restart
            }
        };

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');

            const wakeWord = "hey maitri";

            if (transcript.toLowerCase().includes(wakeWord) && !isMaitriActive) {
                isMaitriActive = true;
                console.log("Wake word detected!");
                const greeting = `Hey ${identifiedUserName}, how can I assist you today?`;
                addMessage(`MAITRI: ${greeting}`, 'maitri');
                speakText(greeting);
            } 
            else if (isMaitriActive && event.results[event.results.length - 1].isFinal) {
                const command = transcript.toLowerCase().split(wakeWord).pop().trim();
                if (command) {
                    addMessage(command, 'astro');
                    getMaitriResponse(command);
                }
                isMaitriActive = false;
            }
        };
        
        // UPDATED: Mic button now also restarts the service if it stopped
        micBtn.addEventListener('click', () => {
            try {
                recognition.start();
            } catch (e) {
                console.log("Recognition is likely already running.");
            }
            if (!isMaitriActive) {
                isMaitriActive = true;
                const greeting = `Hey ${identifiedUserName}, how can I assist you today?`;
                addMessage(`MAITRI: ${greeting}`, 'maitri');
                speakText(greeting);
            }
        });

        recognition.start();

    } else {
        console.log("Speech Recognition not supported in this browser.");
        micBtn.style.display = 'none';
    }
    // =============================================================
    // == END OF VOICE ACTIVATION LOGIC                           ==
    // =============================================================

    // --- Start Face Detection ---
    setupFaceAPI();

    // --- Breathing Module Logic ---
    const breathingBtn = document.querySelector('.quick-actions button:nth-child(1)');
    const breathingModule = document.getElementById('breathing-module');
    const closeBreathingBtn = document.getElementById('close-breathing');
    const pacer = document.querySelector('.pacer');
    const breathingInstruction = document.getElementById('breathing-instruction');
    let breathingInterval;

    function startBreathingExercise() {
        const instructions = ['Breathe In...', 'Hold', 'Breathe Out...', 'Hold'];
        let instructionIndex = 0;
        breathingInstruction.textContent = instructions[0];
        pacer.classList.add('grow');
        breathingInterval = setInterval(() => {
            instructionIndex = (instructionIndex + 1) % instructions.length;
            breathingInstruction.textContent = instructions[instructionIndex];
            if (instructionIndex === 0) {
                pacer.classList.add('grow');
            } else if (instructionIndex === 2) {
                pacer.classList.remove('grow');
            }
        }, 4000);
    }

    function stopBreathingExercise() {
        clearInterval(breathingInterval);
        pacer.classList.remove('grow');
        breathingInstruction.textContent = 'Get Ready...';
        breathingModule.classList.add('hidden');
    }
    if (breathingBtn) breathingBtn.addEventListener('click', () => {
        breathingModule.classList.remove('hidden');
        startBreathingExercise();
    });
    if(closeBreathingBtn) closeBreathingBtn.addEventListener('click', stopBreathingExercise);


    // --- Report Module Logic ---
    const reportBtn = document.getElementById('report-btn');
    const reportModule = document.getElementById('report-module');
    const closeReportBtn = document.getElementById('close-report');
    const submitReportBtn = document.getElementById('submit-report-btn');
    
    if (reportBtn) reportBtn.addEventListener('click', () => {
        reportModule.classList.remove('hidden');
    });
    
    if (closeReportBtn) closeReportBtn.addEventListener('click', () => {
        reportModule.classList.add('hidden');
        const reportTextarea = document.getElementById('report-textarea');
        const reportStatus = document.getElementById('report-status');
        if(reportTextarea) reportTextarea.value = '';
        if(reportStatus) reportStatus.textContent = '';
    });

    if (submitReportBtn) submitReportBtn.addEventListener('click', async () => {
        const reportTextarea = document.getElementById('report-textarea');
        const reportStatus = document.getElementById('report-status');
        const reportText = reportTextarea.value;
        if (reportText.trim() === '') {
            reportStatus.textContent = 'Please enter a report before submitting.';
            return;
        }
        try {
            reportStatus.textContent = 'Submitting...';
            const response = await fetch('http://localhost:3000/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ report: reportText })
            });
            const result = await response.json();
            if (!response.ok) { throw new Error(result.message || 'Failed to submit report.'); }
            reportStatus.textContent = 'Report submitted successfully!';
            setTimeout(() => {
                if (closeReportBtn) closeReportBtn.click();
            }, 2000);
        } catch (error) {
            console.error('Report submission error:', error);
            reportStatus.textContent = `Error: ${error.message}`;
        }
    });
});


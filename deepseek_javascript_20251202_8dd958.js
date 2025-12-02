// API Configuration
const API_KEY = 'AIzaSyBpqNW7M2JREsdeFbn6Ek3eVZk6QXB5SXE';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const clearChatButton = document.getElementById('clearChat');
const voiceButton = document.getElementById('voiceButton');
const learningMode = document.getElementById('learningMode');
const promptButtons = document.querySelectorAll('.prompt-btn');
const currentTimeElement = document.getElementById('current-time');

// Update current time
function updateCurrentTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    currentTimeElement.textContent = timeString;
}

// Initialize time
updateCurrentTime();
setInterval(updateCurrentTime, 60000);

// Add message to chat
function addMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="message-icon">
            <i class="fas ${isUser ? 'fa-user' : 'fa-robot'}"></i>
        </div>
        <div class="message-content">
            <div class="message-header">
                <strong>${isUser ? 'You' : 'EduBot'}</strong>
                <span class="message-time">${time}</span>
            </div>
            <p>${content}</p>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show typing indicator
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.id = 'typingIndicator';
    
    typingDiv.innerHTML = `
        <div class="message-icon">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="message-header">
                <strong>EduBot</strong>
                <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Get mode-specific instruction
function getModeInstruction() {
    const mode = learningMode.value;
    const modeInstructions = {
        'beginner': 'Explain this in simple, easy-to-understand terms suitable for a beginner with no prior knowledge. Use simple analogies and avoid technical jargon.',
        'intermediate': 'Provide a balanced explanation with some technical details but keep it accessible. Include key concepts and practical applications.',
        'advanced': 'Give a detailed, technical explanation suitable for someone with prior knowledge. Include formulas, theories, and in-depth analysis where appropriate.',
        'exam_prep': 'Focus on key points, common exam questions, and important concepts. Provide mnemonics or memory aids if helpful.',
        'simplified': 'Explain this as simply as possible, like you would to a 10-year-old. Use everyday examples and avoid all technical terms.'
    };
    return modeInstructions[mode] || '';
}

// Send message to API
async function sendToGeminiAPI(message) {
    try {
        showTypingIndicator();
        
        const modeInstruction = getModeInstruction();
        const fullPrompt = modeInstruction ? `${message}\n\n${modeInstruction}` : message;
        
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: fullPrompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1500,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        removeTypingIndicator();
        
        if (data.candidates && data.candidates[0].content.parts[0].text) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('No valid response from API');
        }
    } catch (error) {
        console.error('Error:', error);
        removeTypingIndicator();
        return `I apologize, but I encountered an error: ${error.message}. Please try again or rephrase your question.`;
    }
}

// Handle sending message
async function handleSendMessage() {
    const message = userInput.value.trim();
    
    if (!message) return;
    
    // Add user message
    addMessage(message, true);
    userInput.value = '';
    
    // Get response from API
    const response = await sendToGeminiAPI(message);
    
    // Add bot response
    addMessage(response);
}

// Event Listeners
sendButton.addEventListener('click', handleSendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
});

clearChatButton.addEventListener('click', () => {
    chatMessages.innerHTML = `
        <div class="message bot-message">
            <div class="message-icon">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-header">
                    <strong>EduBot</strong>
                    <span class="message-time" id="current-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p>Hello! I'm your educational AI assistant. I can help explain concepts, answer questions, and guide your learning. What would you like to learn about today?</p>
            </div>
        </div>
    `;
});

// Quick prompt buttons
promptButtons.forEach(button => {
    button.addEventListener('click', () => {
        const prompt = button.getAttribute('data-prompt');
        userInput.value = prompt;
        userInput.focus();
    });
});

// Voice input (basic implementation)
voiceButton.addEventListener('click', () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        
        recognition.start();
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            userInput.value = transcript;
        };
        
        recognition.onspeechend = () => {
            recognition.stop();
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            addMessage("I couldn't capture your voice input. Please type your question instead.", false);
        };
    } else {
        addMessage("Your browser doesn't support speech recognition. Please type your question.", false);
    }
});

// Auto-expand textarea
userInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Initialize with welcome message
window.onload = () => {
    updateCurrentTime();
};
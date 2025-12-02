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
const hamburgerMenu = document.getElementById('hamburgerMenu');
const closeSidebar = document.getElementById('closeSidebar');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const toggleTheme = document.getElementById('toggleTheme');
const charCount = document.getElementById('charCount');
const currentModeText = document.getElementById('currentModeText');
const modeDesc = document.getElementById('modeDesc');

// Mode descriptions
const modeDescriptions = {
    'beginner': 'Simple explanations for beginners with no prior knowledge',
    'intermediate': 'Balanced explanations with some technical details',
    'advanced': 'Detailed technical explanations for advanced learners',
    'exam_prep': 'Exam-focused explanations with key points and mnemonics',
    'simplified': 'Super simple explanations using everyday analogies'
};

// Mode display names
const modeDisplayNames = {
    'beginner': 'Beginner Mode',
    'intermediate': 'Intermediate Mode',
    'advanced': 'Advanced Mode',
    'exam_prep': 'Exam Prep Mode',
    'simplified': 'Simplified Mode'
};

// Initialize
function init() {
    updateCurrentTime();
    updateCharCount();
    updateModeDisplay();
    setupEventListeners();
    loadChatHistory();
    setupVoiceRecognition();
}

// Update current time
function updateCurrentTime() {
    const timeElements = document.querySelectorAll('.message-time');
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Update welcome message time
    if (timeElements.length > 0) {
        timeElements[0].textContent = timeString;
    }
}

// Update character count
function updateCharCount() {
    const count = userInput.value.length;
    charCount.textContent = `${count}/500`;
    
    // Change color if接近 limit
    if (count > 450) {
        charCount.style.color = 'var(--warning-color)';
    } else if (count > 400) {
        charCount.style.color = '#f39c12';
    } else {
        charCount.style.color = 'var(--text-secondary)';
    }
}

// Update mode display
function updateModeDisplay() {
    const mode = learningMode.value;
    currentModeText.textContent = modeDisplayNames[mode];
    modeDesc.textContent = modeDescriptions[mode];
}

// Setup event listeners
function setupEventListeners() {
    // Send message
    sendButton.addEventListener('click', handleSendMessage);
    
    // Enter key to send
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    
    // Character count
    userInput.addEventListener('input', updateCharCount);
    
    // Clear chat
    clearChatButton.addEventListener('click', clearChat);
    
    // Learning mode change
    learningMode.addEventListener('change', updateModeDisplay);
    
    // Quick prompts
    promptButtons.forEach(button => {
        button.addEventListener('click', () => {
            const prompt = button.getAttribute('data-prompt');
            userInput.value = prompt;
            userInput.focus();
            updateCharCount();
        });
    });
    
    // Hamburger menu
    hamburgerMenu.addEventListener('click', toggleSidebar);
    closeSidebar.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);
    
    // Theme toggle
    toggleTheme.addEventListener('click', toggleThemeMode);
    
    // Auto-expand textarea
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
    
    // Voice button
    voiceButton.addEventListener('click', startVoiceRecognition);
    
    // Close sidebar on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 992 && sidebar.classList.contains('active')) {
            toggleSidebar();
        }
    });
}

// Toggle sidebar
function toggleSidebar() {
    sidebar.classList.toggle('active');
    sidebarOverlay.style.display = sidebar.classList.contains('active') ? 'block' : 'none';
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
}

// Toggle theme
function toggleThemeMode() {
    document.body.classList.toggle('dark-theme');
    const icon = toggleTheme.querySelector('i');
    icon.classList.toggle('fa-moon');
    icon.classList.toggle('fa-sun');
    
    // Save theme preference
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
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

// Add message to chat
function addMessage(content, isUser = false) {
    const messageContainer = document.createElement('div');
    messageContainer.className = `message-container ${isUser ? 'user-message-container' : 'bot-message-container'}`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isUser) {
        messageContainer.innerHTML = `
            <div class="message-content-wrapper user-wrapper">
                <div class="message-header user-header">
                    <span class="sender-name">You</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-bubble user-bubble">
                    <p>${content}</p>
                    <div class="message-actions">
                        <button class="action-btn" onclick="copyMessage(this)"><i class="fas fa-copy"></i></button>
                        <button class="action-btn" onclick="editMessage(this)"><i class="fas fa-edit"></i></button>
                    </div>
                </div>
            </div>
            <div class="message-avatar user-avatar">
                <div class="avatar">
                    <i class="fas fa-user"></i>
                </div>
            </div>
        `;
    } else {
        messageContainer.innerHTML = `
            <div class="message-avatar">
                <div class="avatar bot-avatar">
                    <i class="fas fa-robot"></i>
                </div>
            </div>
            <div class="message-content-wrapper">
                <div class="message-header">
                    <span class="sender-name">REXB0T AI</span>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-bubble bot-bubble">
                    <p>${content}</p>
                    <div class="message-footer">
                        <span class="ai-tag"><i class="fas fa-brain"></i> AI Generated</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    chatMessages.appendChild(messageContainer);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Save to localStorage
    saveMessageToHistory(content, isUser);
}

// Show typing indicator
function showTypingIndicator() {
    const typingContainer = document.createElement('div');
    typingContainer.className = 'message-container bot-message-container';
    typingContainer.id = 'typingIndicator';
    
    typingContainer.innerHTML = `
        <div class="message-avatar">
            <div class="avatar bot-avatar">
                <i class="fas fa-robot"></i>
            </div>
        </div>
        <div class="message-content-wrapper">
            <div class="message-header">
                <span class="sender-name">EduBot AI</span>
                <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingContainer);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Send message to API
async function sendToGeminiAPI(message) {
    try {
        showTypingIndicator();
        
        const modeInstruction = getModeInstruction();
        const fullPrompt = modeInstruction ? `${message}\n\nPlease respond in this style: ${modeInstruction}` : message;
        
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
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2000,
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
        return `I apologize, but I encountered an error while processing your request. Please try again or rephrase your question.\n\nError: ${error.message}`;
    }
}

// Handle sending message
async function handleSendMessage() {
    const message = userInput.value.trim();
    
    if (!message) {
        // Show warning
        userInput.focus();
        return;
    }
    
    if (message.length > 500) {
        alert('Message is too long. Please limit to 500 characters.');
        return;
    }
    
    // Add user message
    addMessage(message, true);
    userInput.value = '';
    userInput.style.height = 'auto';
    updateCharCount();
    
    // Close sidebar on mobile
    if (window.innerWidth <= 992) {
        toggleSidebar();
    }
    
    // Get response from API
    try {
        const response = await sendToGeminiAPI(message);
        addMessage(response);
    } catch (error) {
        addMessage(`Sorry, I'm having trouble connecting to the AI service. Please check your internet connection and try again.`);
    }
}

// Clear chat
function clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
        chatMessages.innerHTML = `
            <div class="message-container bot-message-container">
                <div class="message-avatar">
                    <div class="avatar bot-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                </div>
                <div class="message-content-wrapper">
                    <div class="message-header">
                        <span class="sender-name">EduBot AI</span>
                        <span class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div class="message-bubble bot-bubble">
                        <p>Hello! 👋 I'm your educational AI assistant. I can help explain complex concepts, answer your questions, and guide your learning journey. What topic would you like to explore today?</p>
                    </div>
                </div>
            </div>
        `;
        localStorage.removeItem('chatHistory');
    }
}

// Setup voice recognition
function setupVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        return true;
    } else {
        voiceButton.style.display = 'none';
        return false;
    }
}

// Start voice recognition
function startVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
    
    // Change button state
    voiceButton.innerHTML = '<i class="fas fa-microphone-slash"></i>';
    voiceButton.style.background = 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
    
    recognition.start();
    
    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        updateCharCount();
        
        // Reset button
        voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceButton.style.background = 'linear-gradient(135deg, var(--primary-color) 0%, #2980b9 100%)';
    };
    
    recognition.onspeechend = () => {
        recognition.stop();
        
        // Reset button
        voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceButton.style.background = 'linear-gradient(135deg, var(--primary-color) 0%, #2980b9 100%)';
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        
        // Reset button
        voiceButton.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceButton.style.background = 'linear-gradient(135deg, var(--primary-color) 0%, #2980b9 100%)';
        
        if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please allow microphone access to use voice input.');
        }
    };
}

// Copy message to clipboard
function copyMessage(button) {
    const message = button.closest('.message-bubble').querySelector('p').textContent;
    navigator.clipboard.writeText(message).then(() => {
        // Show copied feedback
        const originalHTML = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.style.color = '#2ecc71';
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.color = '';
        }, 2000);
    });
}

// Edit message (for user messages)
function editMessage(button) {
    const messageBubble = button.closest('.message-bubble');
    const messageText = messageBubble.querySelector('p').textContent;
    userInput.value = messageText;
    userInput.focus();
    updateCharCount();
    
    // Remove the message
    const messageContainer = button.closest('.message-container');
    messageContainer.remove();
    
    // Remove from history
    removeMessageFromHistory(messageText);
}

// Save message to history
function saveMessageToHistory(content, isUser) {
    const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    history.push({
        content,
        isUser,
        timestamp: new Date().toISOString(),
        mode: learningMode.value
    });
    
    // Keep only last 50 messages
    if (history.length > 50) {
        history.splice(0, history.length - 50);
    }
    
    localStorage.setItem('chatHistory', JSON.stringify(history));
}

// Remove message from history
function removeMessageFromHistory(content) {
    const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    const filtered = history.filter(msg => msg.content !== content);
    localStorage.setItem('chatHistory', JSON.stringify(filtered));
}

// Load chat history
function loadChatHistory() {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const icon = toggleTheme.querySelector('i');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
    
    // Load chat history
    const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    if (history.length > 0) {
        // Clear initial message
        chatMessages.innerHTML = '';
        
        // Add history messages
        history.forEach(msg => {
            addMessage(msg.content, msg.isUser);
        });
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', init);

// Handle offline/online status
window.addEventListener('online', () => {
    showToast('You are back online!', 'success');
});

window.addEventListener('offline', () => {
    showToast('You are offline. Some features may not work.', 'warning');
});

// Toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// Add toast styles dynamically
const toastStyles = document.createElement('style');
toastStyles.textContent = `
.toast {
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 15px 25px;
    border-radius: 10px;
    color: white;
    font-weight: 500;
    transform: translateY(100px);
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 9999;
    max-width: 300px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.toast.show {
    transform: translateY(0);
    opacity: 1;
}

.toast-success {
    background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
}

.toast-warning {
    background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
}

.toast-info {
    background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
}
`;
document.head.appendChild(toastStyles);

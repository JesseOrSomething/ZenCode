class ChatInterface {
    constructor() {
        this.conversationId = this.generateConversationId();
        this.isLoading = false;
        this.hasStartedConversation = false;
        this.attachedImage = null;
        this.maxQuestions = 3;
        this.questionCount = this.getQuestionCount();
        this.selectedPlan = localStorage.getItem('selectedPlan');
        console.log('Selected plan:', this.selectedPlan); // Debug log
        this.initializeElements();
        this.setupEventListeners();
        this.updateQuestionCounter();
        this.initializeAuthState();
    }

    generateConversationId() {
        return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    getQuestionCount() {
        const count = this.getCookie('questionCount');
        return count ? parseInt(count) : 0;
    }

    setQuestionCount(count) {
        this.setCookie('questionCount', count, 7); // Expires in 7 days
    }

    getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
    }

    resetQuestionCount() {
        this.questionCount = 0;
        this.setQuestionCount(0);
    }

    updateQuestionCounter() {
        const questionCounter = document.getElementById('questionCounter');
        const questionCountText = document.getElementById('questionCountText');
        
        if (questionCounter && questionCountText) {
            const remaining = this.maxQuestions - this.questionCount;
            questionCountText.textContent = `Questions remaining: ${remaining}`;
            
            if (remaining <= 0) {
                questionCounter.style.display = 'none';
            }
        }
    }

    initializeAuthState() {
        const user = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        // Always hide auth prompt by default
        this.hideAuthPrompt();
        
        // If user is authenticated, they can chat freely
        if (user && token) {
            return;
        }
        
        // For unauthenticated users, show question counter (3 free questions)
        this.updateQuestionCounter();
    }

    showAuthPrompt() {
        const authPrompt = document.getElementById('authPrompt');
        if (authPrompt) {
            authPrompt.style.display = 'flex';
        }
    }

    hideAuthPrompt() {
        const authPrompt = document.getElementById('authPrompt');
        if (authPrompt) {
            authPrompt.style.display = 'none';
        }
    }

    showUpgradePrompt() {
        const upgradePrompt = document.getElementById('upgradePrompt');
        if (upgradePrompt) {
            upgradePrompt.style.display = 'flex';
        }
    }

    hideUpgradePrompt() {
        const upgradePrompt = document.getElementById('upgradePrompt');
        if (upgradePrompt) {
            upgradePrompt.style.display = 'none';
        }
    }


    initializeElements() {
        this.messageInput = document.getElementById('messageInput');
        this.sendButton = document.getElementById('sendButton');
        this.chatMessages = document.getElementById('chatMessages');
        this.imageButton = document.getElementById('imageButton');
        this.imageUpload = document.getElementById('imageUpload');
        
        console.log('Elements found:');
        console.log('messageInput:', this.messageInput);
        console.log('sendButton:', this.sendButton);
        console.log('chatMessages:', this.chatMessages);
        console.log('imageButton:', this.imageButton);
        console.log('imageUpload:', this.imageUpload);
    }

    setupEventListeners() {
        // Send message on button click
        this.sendButton.addEventListener('click', () => this.sendMessage());
        
        // Send message on Enter key
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Image upload functionality
        this.imageButton.addEventListener('click', () => {
            console.log('Image button clicked');
            this.imageUpload.click();
        });

        this.imageUpload.addEventListener('change', (e) => {
            console.log('File input changed');
            const file = e.target.files[0];
            console.log('Selected file:', file);
            if (file && file.type.startsWith('image/')) {
                console.log('Valid image file selected');
                this.handleImageUpload(file);
            } else {
                console.log('Invalid file type or no file selected');
            }
        });

        // Paste image functionality
        document.addEventListener('paste', (e) => {
            console.log('Paste event detected');
            const items = e.clipboardData.items;
            console.log('Clipboard items:', items.length);
            for (let item of items) {
                console.log('Item type:', item.type);
                if (item.type.startsWith('image/')) {
                    console.log('Image found in clipboard');
                    e.preventDefault();
                    const file = item.getAsFile();
                    this.handleImageUpload(file);
                    break;
                }
            }
        });

        // Focus input on page load
        this.messageInput.focus();
        
        // Keep input focused when clicking elsewhere
        document.addEventListener('click', (e) => {
            // If the click is not on the input field or its children, refocus it
            if (!this.messageInput.contains(e.target) && !this.imageButton.contains(e.target) && !this.sendButton.contains(e.target)) {
                this.messageInput.focus();
            }
        });
        
        // Also refocus when clicking on the chat messages area
        this.chatMessages.addEventListener('click', () => {
            this.messageInput.focus();
        });
        
        // Navigation functionality
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');
        const accountBtn = document.getElementById('accountBtn');
        
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                window.location.href = 'login.html';
            });
        }
        
        if (signupBtn) {
            signupBtn.addEventListener('click', () => {
                window.location.href = 'signup.html';
            });
        }
        
        if (accountBtn) {
            accountBtn.addEventListener('click', () => {
                // Show account options (logout for now)
                if (confirm('Do you want to logout?')) {
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    // Refresh the page to show login/signup buttons
                    window.location.reload();
                }
            });
        }

        // Fullscreen auth buttons
        const fullscreenLoginBtn = document.getElementById('fullscreenLoginBtn');
        const fullscreenSignupBtn = document.getElementById('fullscreenSignupBtn');
        
        if (fullscreenLoginBtn) {
            fullscreenLoginBtn.addEventListener('click', () => {
                window.location.href = 'login.html';
            });
        }
        
        if (fullscreenSignupBtn) {
            fullscreenSignupBtn.addEventListener('click', () => {
                window.location.href = 'signup.html';
            });
        }
        
        // Upgrade buttons
        const upgradeBtn = document.getElementById('upgradeBtn');
        const closeUpgradeBtn = document.getElementById('closeUpgradeBtn');
        
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => {
                window.location.href = 'pricing.html';
            });
        }
        
        if (closeUpgradeBtn) {
            closeUpgradeBtn.addEventListener('click', () => {
                this.hideUpgradePrompt();
            });
        }
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || this.isLoading) return;
        
        // Check if user is authenticated
        const user = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!user || !token) {
            // User is not authenticated - check question limit
            if (this.questionCount >= this.maxQuestions) {
                this.addMessage('system', 'You\'ve reached your daily limit of 3 questions. Please log in or upgrade to Pro for unlimited access!');
                this.showAuthPrompt();
                return;
            }
            // Increment question count for unauthenticated users
            this.questionCount++;
            this.setQuestionCount(this.questionCount);
            this.updateQuestionCounter();
        }

        console.log('Sending message:', message); // Debug log

        // Expand to full screen on first message
        if (!this.hasStartedConversation) {
            this.expandToFullScreen();
            this.hasStartedConversation = true;
        }

        // Add user message to chat (with image if attached)
        this.addMessage('user', message, this.attachedImage);
        
        // Store the image for the API call before clearing
        const imageToSend = this.attachedImage;
        
        // Clear input and show loading
        this.messageInput.value = '';
        this.attachedImage = null;
        this.removeImagePreview();
        this.setLoading(true);

        // Add typing indicator
        this.addTypingIndicator();

        try {
            console.log('Making API request...'); // Debug log
            console.log('Attached image:', imageToSend ? 'Yes' : 'No');
            if (imageToSend) {
                console.log('Image length:', imageToSend.length);
                console.log('Image starts with:', imageToSend.substring(0, 50));
            }
            
            const token = localStorage.getItem('token');
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch('/chat', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    message: message,
                    image: imageToSend, // Use the stored image
                    conversationId: this.conversationId
                })
            });

            console.log('Response status:', response.status); // Debug log

            if (response.status === 429) {
                const errorData = await response.json();
                this.addMessage('system', errorData.message);
                if (errorData.upgradeRequired) {
                    this.showUpgradePrompt();
                }
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('AI Response:', data.response); // Debug log
            
            // Add a small delay to make the typing feel more natural
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Remove typing indicator and add AI response
            this.removeTypingIndicator();
            this.addMessage('assistant', data.response);

        } catch (error) {
            console.error('Error sending message:', error);
            this.removeTypingIndicator();
            this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
        } finally {
            this.setLoading(false);
        }
    }

    addMessage(role, content, imageUrl = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message ${imageUrl ? 'image-message' : ''}`;
        
        let imageHtml = '';
        if (imageUrl) {
            imageHtml = `<img src="${imageUrl}" alt="Uploaded image" class="message-image">`;
        }
        
        if (role === 'user') {
            messageDiv.innerHTML = `
                <div class="message-content">
                    ${imageHtml}
                    <div class="message-text">${this.escapeHtml(content)}</div>
                    <div class="message-time">${this.getCurrentTime()}</div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content">
                    ${imageHtml}
                    <div class="message-text">${this.formatResponse(content)}</div>
                    <div class="message-time">${this.getCurrentTime()}</div>
                </div>
            `;
        }

        this.chatMessages.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatResponse(content) {
        // Enhanced formatting for code blocks with copy buttons
        let formatted = this.escapeHtml(content);
        
        // Handle code blocks with copy buttons
        formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, language, code) => {
            const lang = language || 'text';
            const codeId = 'code_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            return `
                <div class="code-block">
                    <div class="code-header">
                        <span class="code-language">${lang}</span>
                        <button class="copy-button" onclick="copyCode('${codeId}')" data-code-id="${codeId}" title="Copy code">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="code-content" id="${codeId}">${code.trim()}</div>
                </div>
            `;
        });
        
        // Handle inline code
        formatted = formatted.replace(/`([^`]+)`/g, '<span class="inline-code">$1</span>');
        
        // Handle line breaks
        formatted = formatted.replace(/\n/g, '<br>');
        
        return formatted;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getCurrentTime() {
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    setLoading(loading) {
        this.isLoading = loading;
        this.sendButton.disabled = loading;
        
        if (loading) {
            this.sendButton.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="spinning">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                </svg>
            `;
        } else {
            this.sendButton.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
                </svg>
            `;
        }
    }

    scrollToBottom() {
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    addTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant-message typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <div class="typing-text">AI is typing...</div>
            </div>
        `;
        this.chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    expandToFullScreen() {
        const container = document.querySelector('.container');
        const mainContent = document.querySelector('.main-content');
        const inputContainer = document.querySelector('.input-container');
        const inputField = document.querySelector('.input-field');
        const nav = document.querySelector('.nav');

        // Add fullscreen class to trigger CSS transition
        container.classList.add('fullscreen');
        mainContent.classList.add('fullscreen');
        inputContainer.classList.add('fullscreen');
        inputField.classList.add('fullscreen');

        // Update chat messages height for fullscreen
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.style.maxHeight = 'calc(100vh - 200px)';
            chatMessages.style.transition = 'max-height 0.5s ease';
        }

        // Add a subtle scale animation for the input field
        setTimeout(() => {
            if (inputField) {
                inputField.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    inputField.style.transform = 'scale(1)';
                }, 200);
            }
        }, 100);
    }

    handleImageUpload(file) {
        console.log('handleImageUpload called with file:', file);
        if (!file || !file.type.startsWith('image/')) {
            console.log('Please select a valid image file.');
            return;
        }

        console.log('Processing image file:', file.name, file.type, file.size);
        
        // Create a FileReader to convert the image to a data URL
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target.result;
            console.log('Image loaded, data URL length:', imageUrl.length);
            console.log('Image data URL starts with:', imageUrl.substring(0, 50));
            
            // Store the full data URL for preview, but extract base64 for API
            this.attachedImage = imageUrl;
            console.log('Attached image set:', this.attachedImage ? 'Yes' : 'No');
            
            // Show preview in input area
            this.showImagePreview(imageUrl);
            
            // Clear the file input
            this.imageUpload.value = '';
        };
        
        reader.readAsDataURL(file);
    }

    showImagePreview(imageUrl) {
        // Remove any existing preview
        this.removeImagePreview();
        
        // Create preview element
        const previewDiv = document.createElement('div');
        previewDiv.id = 'image-preview';
        previewDiv.className = 'image-preview';
        previewDiv.innerHTML = `
            <div class="preview-content">
                <img src="${imageUrl}" alt="Preview" class="preview-image">
                <button class="remove-image-btn" title="Remove image">×</button>
            </div>
        `;
        
        // Insert at the top of the chat messages area
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.insertBefore(previewDiv, chatMessages.firstChild);
        
        // Add remove button functionality
        const removeBtn = previewDiv.querySelector('.remove-image-btn');
        removeBtn.addEventListener('click', () => {
            this.removeImagePreview();
            this.attachedImage = null;
        });
    }

    removeImagePreview() {
        const existingPreview = document.getElementById('image-preview');
        if (existingPreview) {
            existingPreview.remove();
        }
    }
}

// Global function to copy code to clipboard
function copyCode(codeId) {
    const codeElement = document.getElementById(codeId);
    if (!codeElement) return;
    
    const codeText = codeElement.textContent;
    
    // Copy to clipboard
    navigator.clipboard.writeText(codeText).then(() => {
        // Find the copy button and update its appearance
        const copyButton = document.querySelector(`[data-code-id="${codeId}"]`);
        if (copyButton) {
            const originalText = copyButton.innerHTML;
            copyButton.innerHTML = `
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
            `;
            copyButton.classList.add('copied');
            
            // Reset after 1.5 seconds
            setTimeout(() => {
                copyButton.innerHTML = originalText;
                copyButton.classList.remove('copied');
            }, 1500);
        }
    }).catch(err => {
        console.error('Failed to copy code: ', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = codeText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    });
}

// Initialize chat interface when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Chat interface initializing...');
    new ChatInterface();
    console.log('Chat interface ready!');
});

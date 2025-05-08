// Main application script for Retro AI Online
document.addEventListener('DOMContentLoaded', () => {
    console.log('Retro AI Online is starting...');
    
    // Initialize storage
    const storageInitialized = storage.init();
    if (!storageInitialized) {
        showStatusMessage('LocalStorage is not available. The application may not work correctly.', 'error');
    }
    
    // Initialize UI components from ui.js
    initializeUI();
    
    // Initialize app-specific UI
    setupAppUI();
    
    // Set up event listeners
    setupEventListeners();
    
    // Restore application state
    restoreApplicationState();
    
    // Ensure default avatar is available by using the SVG directly
    ensureDefaultAvatar();
    
    console.log('Retro AI Online is ready');
});

// Initialize UI components
function setupAppUI() {
    // Load initial data
    renderCharacterList();
}

// Set up global event listeners
function setupEventListeners() {
    // Main navigation buttons
    document.getElementById('settings-btn').addEventListener('click', toggleSettingsPanel);
    document.getElementById('new-character-btn').addEventListener('click', () => showCharacterModal());
    document.getElementById('import-character-btn').addEventListener('click', showImportModal);
    document.getElementById('edit-character-btn').addEventListener('click', () => {
        if (window.currentCharacter) {
            showCharacterModal(window.currentCharacter);
        } else {
            showStatusMessage('Please select a character first', 'error');
        }
    });
    
    // Help button
    document.getElementById('help-btn').addEventListener('click', showHelp);
    
    // Settings panel close button
    document.getElementById('close-settings-btn').addEventListener('click', toggleSettingsPanel);
    
    // Test connection button
    document.getElementById('test-connection-btn').addEventListener('click', testApiConnection);
    
    // Forget everything button
    document.getElementById('forget-everything-btn').addEventListener('click', showForgetModal);
    
    // Chat input handling for empty messages (to trigger AI continuation)
    document.getElementById('chat-input').addEventListener('keydown', handleEmptyMessage);
    document.getElementById('send-btn').addEventListener('click', handleEmptySendClick);
}

// Handle when user sends an empty message (for continuation)
function handleEmptyMessage(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        const input = document.getElementById('chat-input');
        if (input.value.trim() === '') {
            e.preventDefault();
            continueAIResponse();
        }
    }
}

// Handle send button click with empty message
function handleEmptySendClick() {
    const input = document.getElementById('chat-input');
    if (input.value.trim() === '') {
        continueAIResponse();
    }
}

// Continue AI response when user sends empty message
function continueAIResponse() {
    if (!window.currentConversation || !window.currentCharacter) {
        showStatusMessage('Please select a character and start a conversation first', 'error');
        return;
    }
    
    // Get the last message in the conversation
    const conversation = window.currentConversation;
    const visibleMessages = conversation.messages.filter(msg => 
        msg.role === 'user' || msg.role === 'assistant');
    
    if (visibleMessages.length === 0) {
        showStatusMessage('No conversation to continue', 'error');
        return;
    }
    
    const lastMessage = visibleMessages[visibleMessages.length - 1];
    
    // If the last message was from the assistant, continue from there
    if (lastMessage.role === 'assistant') {
        // Create a special continuation message
        const userMessage = {
            role: 'user',
            content: '[continue]',
            timestamp: new Date().toISOString()
        };
        
        // Add to conversation
        conversation.messages.push(userMessage);
        
        // Save conversation
        storage.saveConversation(conversation);
        
        // Send to API
        try {
            showTypingIndicator();
            sendToAPI(conversation);
        } catch (error) {
            hideTypingIndicator();
            showStatusMessage(`Error: ${error.message}`, 'error');
        }
    } else {
        showStatusMessage('Please enter a message', 'error');
    }
}

// Restore application state from stored data
function restoreApplicationState() {
    // Load current character if available
    const character = storage.getCurrentCharacter();
    if (character) {
        window.currentCharacter = character;
        
        // Update header
        document.getElementById('character-avatar').src = character.avatar || 'img/default_avatar.png';
        document.getElementById('character-name').textContent = character.name;
        
        // Select character in UI
        const characterElements = document.querySelectorAll('.character-card');
        characterElements.forEach(element => {
            if (element.getAttribute('data-id') === character.id) {
                element.classList.add('active');
            }
        });
        
        // Load current conversation if available
        const conversation = storage.getCurrentConversation();
        if (conversation && conversation.character_id === character.id) {
            window.currentConversation = conversation;
            
            // Load conversation messages
            loadConversation(conversation.id);
            
            // Select conversation in UI
            const conversationElements = document.querySelectorAll('.conversation-card');
            conversationElements.forEach(element => {
                if (element.getAttribute('data-id') === conversation.id) {
                    element.classList.add('active');
                }
            });
        } else {
            // Just display the character's conversations
            loadCharacterConversations(character.id);
        }
    } else {
        // No character selected, just load all characters
        renderCharacterList();
    }
}

// Ensure default avatar is available
function ensureDefaultAvatar() {
    // Use the default avatar PNG file
    const defaultAvatarPath = 'img/default_avatar.png';
    
    // Check all avatar images and set default if they failed to load
    const avatarImages = document.querySelectorAll('img[src*="default_avatar.png"]');
    avatarImages.forEach(img => {
        img.onerror = function() {
            console.error('Failed to load avatar image, ensure img/default_avatar.png exists');
            // If the default image itself fails, we have a fallback solid color
            this.style.backgroundColor = '#7c4dff';
            this.style.borderRadius = '50%';
        };
    });
    
    // Store the default avatar path for future use
    window.defaultAvatarUrl = defaultAvatarPath;
}

// Show help information
function showHelp() {
    // Create a modal-like popup for help
    const helpContent = `
        <div class="modal-content" style="max-width: 600px; margin: 0 auto; text-align: center;">
            <div class="modal-header">
                <h2>Retro AI Online Help</h2>
                <button id="close-help-btn">×</button>
            </div>
            <div class="modal-body" style="padding: 20px;">
                <h3>Quick Start Guide</h3>
                <ol style="display: inline-block; margin: 10px auto; text-align: center;">
                    <p><strong>API Setup:</strong> Click Settings and enter your API endpoint (e.g., http://localhost:5001/v1) for your LLM server.</p>
                    <p><strong>Create a Character:</strong> Click the "+" button in the Characters section.</p>
                    <p><strong>Start Chatting:</strong> Select a character and start typing messages.</p>
                </ol>
                
                <h3>Features</h3>
                <ul style="text-align: left; display: inline-block; margin: 10px auto; text-align: center;">
                    <p><strong>Import Characters:</strong> Import character JSON files from sources like ChubAI.</p>
                    <p><strong>Multiple Conversations:</strong> Create different conversations with the same character.</p>
                    <p><strong>Empty Message:</strong> Send an empty message to continue the AI's response.</p>
                    <p><strong>Regenerate:</strong> Click "Regenerate" to get a different response.</p>
                </ul>
                
                <h3>Storage</h3>
                <p style="margin: 10px auto; max-width: 500px;">All data is stored locally in your browser. Use the Export/Import options in Settings to backup your data.</p>
            </div>
        </div>
    `;
    
    // Create modal container
    const helpModal = document.createElement('div');
    helpModal.id = 'help-modal';
    helpModal.className = 'modal';
    helpModal.style.display = 'flex';
    helpModal.style.justifyContent = 'center';
    helpModal.style.alignItems = 'center';
    helpModal.innerHTML = helpContent;
    document.body.appendChild(helpModal);
    
    // Add close button functionality
    helpModal.querySelector('#close-help-btn').addEventListener('click', () => {
        document.body.removeChild(helpModal);
    });
    
    // Close when clicking outside the modal content
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            document.body.removeChild(helpModal);
        }
    });
} 
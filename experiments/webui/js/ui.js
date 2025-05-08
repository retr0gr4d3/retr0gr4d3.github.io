// UI handling for Retro AI Online
function initializeUI() {
    console.log('Initializing UI...');
    
    // Apply current theme
    applyTheme();
    
    // Initialize modals
    initializeModals();
    
    // Set up file upload handling
    setupFileUploads();
    
    // Set up sidebar toggle
    setupSidebarToggle();
    
    // Set up settings button
    document.getElementById('settings-btn').addEventListener('click', toggleSettingsPanel);
}

// Modal handling
function initializeModals() {
    // Character modal close
    document.getElementById('close-character-modal-btn').addEventListener('click', () => {
        document.getElementById('character-modal').classList.add('hidden');
    });
    
    document.getElementById('cancel-character-btn').addEventListener('click', () => {
        document.getElementById('character-modal').classList.add('hidden');
    });
    
    // Import modal close
    document.getElementById('close-chub-modal-btn').addEventListener('click', () => {
        document.getElementById('chub-import-modal').classList.add('hidden');
    });
    
    document.getElementById('cancel-chub-btn').addEventListener('click', () => {
        document.getElementById('chub-import-modal').classList.add('hidden');
    });
    
    // Forget modal
    document.getElementById('close-forget-modal-btn').addEventListener('click', () => {
        document.getElementById('forget-modal').classList.add('hidden');
    });
    
    document.getElementById('cancel-forget-btn').addEventListener('click', () => {
        document.getElementById('forget-modal').classList.add('hidden');
    });
    
    // Forget confirmation
    document.getElementById('forget-confirmation').addEventListener('input', (e) => {
        document.getElementById('confirm-forget-btn').disabled = e.target.value !== 'FORGET';
    });
    
    document.getElementById('confirm-forget-btn').addEventListener('click', () => {
        if (document.getElementById('forget-confirmation').value === 'FORGET') {
            forgetEverything();
            document.getElementById('forget-modal').classList.add('hidden');
        }
    });
}

// File upload handling
function setupFileUploads() {
    // Character avatar upload
    document.getElementById('upload-avatar-btn').addEventListener('click', () => {
        document.getElementById('character-avatar-upload').click();
    });
    
    document.getElementById('character-avatar-upload').addEventListener('change', handleAvatarUpload);
    
    // JSON file import
    document.getElementById('json-file-btn').addEventListener('click', () => {
        document.getElementById('json-file-input').click();
    });
    
    document.getElementById('json-file-input').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            document.getElementById('json-file-name').textContent = file.name;
            
            // Read the file content
            const reader = new FileReader();
            reader.onload = (event) => {
                document.getElementById('json-data').value = event.target.result;
            };
            reader.readAsText(file);
        }
    });
}

// Handle avatar upload
function handleAvatarUpload(e) {
    if (e.target.files.length > 0) {
        const file = e.target.files[0];
        
        // Read and preview the image
        const reader = new FileReader();
        reader.onload = (event) => {
            const avatar = document.getElementById('character-avatar-preview');
            avatar.src = event.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Theme handling
function applyTheme() {
    const settings = storage.getSettings();
    const theme = settings.theme || 'dark';
    
    document.documentElement.setAttribute('data-theme', theme);
    
    // Update theme selector
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) {
        themeSelect.value = theme;
    }
}

function setTheme(theme) {
    const settings = storage.getSettings();
    settings.theme = theme;
    storage.saveSettings(settings);
    
    applyTheme();
}

// Show settings panel
function toggleSettingsPanel() {
    const panel = document.getElementById('settings-panel');
    panel.classList.toggle('hidden');
}

// Character modal
function showCharacterModal(character = null) {
    const modal = document.getElementById('character-modal');
    const modalTitle = document.getElementById('character-modal-title');
    const avatarPreview = document.getElementById('character-avatar-preview');
    
    if (character) {
        modalTitle.textContent = 'Edit Character';
        
        // Fill form
        document.getElementById('character-name-input').value = character.name || '';
        document.getElementById('character-description').value = character.description || '';
        document.getElementById('character-personality').value = character.personality || '';
        document.getElementById('character-first-message').value = character.first_message || '';
        document.getElementById('character-example-messages').value = character.example_messages || '';
        
        // Set avatar if available
        if (character.avatar) {
            avatarPreview.src = character.avatar;
        } else if (window.defaultAvatarUrl) {
            avatarPreview.src = window.defaultAvatarUrl;
        } else {
            avatarPreview.src = 'img/default_avatar.png';
            // Add error handler
            avatarPreview.onerror = function() {
                // If the default image fails, use a colored background
                this.style.backgroundColor = '#D4000B';
                this.style.borderRadius = '50%';
            };
        }
        
        // Set character ID for later reference
        document.getElementById('save-character-btn').setAttribute('data-character-id', character.id);
    } else {
        modalTitle.textContent = 'Create New Character';
        
        // Clear form
        document.getElementById('character-name-input').value = '';
        document.getElementById('character-description').value = '';
        document.getElementById('character-personality').value = '';
        document.getElementById('character-first-message').value = '';
        document.getElementById('character-example-messages').value = '';
        
        // Set default avatar
        if (window.defaultAvatarUrl) {
            avatarPreview.src = window.defaultAvatarUrl;
        } else {
            avatarPreview.src = 'img/default_avatar.png';
            // Add error handler
            avatarPreview.onerror = function() {
                // If the default image fails, use a colored background
                this.style.backgroundColor = '#D4000B';
                this.style.borderRadius = '50%';
            };
        }
        
        // Remove character ID
        document.getElementById('save-character-btn').removeAttribute('data-character-id');
    }
    
    modal.classList.remove('hidden');
}

// Import modal
function showImportModal() {
    const modal = document.getElementById('chub-import-modal');
    
    // Clear previous data
    document.getElementById('json-data').value = '';
    document.getElementById('json-file-name').textContent = 'No file chosen';
    document.getElementById('json-file-input').value = '';
    
    modal.classList.remove('hidden');
}

// Forget everything confirmation
function showForgetModal() {
    const modal = document.getElementById('forget-modal');
    document.getElementById('forget-confirmation').value = '';
    document.getElementById('confirm-forget-btn').disabled = true;
    modal.classList.remove('hidden');
}

// Clear everything from storage
function forgetEverything() {
    // Get a reference to the setAccentColor function from settings.js
    const setAccentColor = window.setAccentColor || 
        function(color) {
            // Fallback implementation if the function is not globally available
            document.documentElement.style.setProperty('--accent-color', color);
            
            // Convert hex to RGB for the RGB variable
            const r = parseInt(color.substr(1, 2), 16);
            const g = parseInt(color.substr(3, 2), 16);
            const b = parseInt(color.substr(5, 2), 16);
            document.documentElement.style.setProperty('--accent-color-rgb', `${r}, ${g}, ${b}`);
            
            // Generate a slightly lighter color for hover states
            const lighterHex = lightenColor(color, 15);
            document.documentElement.style.setProperty('--accent-hover', lighterHex);
        };
    
    // Helper function to lighten color (only used if fallback is needed)
    function lightenColor(hex, percent) {
        let r = parseInt(hex.substr(1, 2), 16);
        let g = parseInt(hex.substr(3, 2), 16);
        let b = parseInt(hex.substr(5, 2), 16);
        
        r = Math.min(255, Math.round(r * (1 + percent / 100)));
        g = Math.min(255, Math.round(g * (1 + percent / 100)));
        b = Math.min(255, Math.round(b * (1 + percent / 100)));
        
        return `#${(r.toString(16).padStart(2, '0'))}${(g.toString(16).padStart(2, '0'))}${(b.toString(16).padStart(2, '0'))}`;
    }
    
    storage.clearAll();
    
    // Clear UI
    document.getElementById('character-list').innerHTML = '';
    document.getElementById('conversation-list').innerHTML = '';
    document.getElementById('chat-messages').innerHTML = `
        <div class="welcome-message">
            <h3>Welcome to Retro AI Online</h3>
            <p>Select a character from the sidebar to start a conversation or create a new one.</p>
        </div>
    `;
    
    // Reset current character/conversation
    window.currentCharacter = null;
    window.currentConversation = null;
    
    // Update header
    document.getElementById('character-avatar').src = 'img/default_avatar.png';
    document.getElementById('character-name').textContent = 'Select a Character';
    
    // Reset settings to defaults
    document.getElementById('api-url').value = 'http://localhost:5001/v1';
    document.getElementById('api-key').value = '';
    
    // Reset model settings
    document.getElementById('temperature').value = 0.7;
    document.getElementById('temperature-value').textContent = '0.7';
    
    document.getElementById('max-tokens').value = 2048;
    document.getElementById('max-tokens-value').textContent = '2048';
    
    document.getElementById('top-p').value = 0.9;
    document.getElementById('top-p-value').textContent = '0.9';
    
    // Reset UI settings
    document.getElementById('theme-select').value = 'dark';
    document.documentElement.setAttribute('data-theme', 'dark');
    
    // Reset accent color
    const defaultColor = '#D4000B';
    document.getElementById('accent-color').value = defaultColor;
    setAccentColor(defaultColor);
    
    // Show notification
    showStatusMessage('All data has been cleared.', 'info');
}

// Test API connection
async function testApiConnection() {
    const apiUrl = document.getElementById('api-url').value;
    
    if (!apiUrl) {
        showStatusMessage('Please enter an API URL', 'error');
        return;
    }
    
    // Show testing message
    showStatusMessage('Testing API connection...', 'info');
    
    try {
        const result = await api.testConnection(apiUrl);
        
        if (result.success) {
            showStatusMessage(result.message, 'success');
            
            // Save API settings
            const settings = storage.getSettings();
            settings.apiUrl = apiUrl;
            settings.apiKey = document.getElementById('api-key').value;
            storage.saveSettings(settings);
            
            // Fetch available models
            fetchModels();
        } else {
            showStatusMessage(result.message, 'error');
        }
    } catch (error) {
        showStatusMessage(`Connection failed: ${error.message}`, 'error');
    }
}

// Fetch available models from API
async function fetchModels() {
    try {
        const models = await api.getModels();
        const select = document.getElementById('model-select');
        
        // Clear existing options
        select.innerHTML = '';
        
        // Add options
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = model.name;
            select.appendChild(option);
        });
        
        // Set current model
        const settings = storage.getSettings();
        if (settings.model) {
            select.value = settings.model;
        }
    } catch (error) {
        console.error('Failed to fetch models:', error);
    }
}

// Format message text with basic markdown-like syntax
function formatMessageText(text) {
    if (!text) return '';
    
    // Replace *italic* with <em>italic</em>
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Replace "quoted text" with <strong class="accent-text">quoted text</strong>
    text = text.replace(/"(.*?)"/g, '<strong class="accent-text">$1</strong>');
    
    // Replace newlines with <br>
    text = text.replace(/\n/g, '<br>');
    
    return text;
}

// Add a message to the chat
function addMessageToChat(message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${message.role === 'user' ? 'user' : 'bot'}`;
    
    // Create header (name/time)
    const header = document.createElement('div');
    header.className = 'message-header';
    header.textContent = message.role === 'user' ? 'You' : window.currentCharacter?.name || 'AI';
    messageElement.appendChild(header);
    
    // Create content
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = formatMessageText(message.content);
    messageElement.appendChild(content);
    
    // Create timestamp
    const timestamp = document.createElement('div');
    timestamp.className = 'message-timestamp';
    timestamp.textContent = new Date().toLocaleTimeString();
    messageElement.appendChild(timestamp);
    
    chatMessages.appendChild(messageElement);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show a notification to the user
function showStatusMessage(message, type = 'info') {
    // Get or create the notification container
    let notificationContainer = document.querySelector('.notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Create notification content
    const content = document.createElement('p');
    content.className = 'notification-content';
    content.textContent = message;
    notification.appendChild(content);
    
    // Create close button
    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.innerHTML = '×';
    closeButton.addEventListener('click', () => {
        removeNotification(notification);
    });
    notification.appendChild(closeButton);
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Remove after a delay (animation handles the fade out)
    setTimeout(() => {
        removeNotification(notification);
    }, 3000);
    
    return notification;
}

// Helper function to remove a notification
function removeNotification(notification) {
    if (!notification || !notification.parentNode) return;
    
    // Start by adding a class that triggers the fade-out animation
    notification.classList.add('removing');
    
    // After animation completes, remove from DOM
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
            
            // If container is empty, remove it too
            const container = document.querySelector('.notification-container');
            if (container && container.childNodes.length === 0) {
                container.remove();
            }
        }
    }, 500);
}

// Add toggle sidebar functionality
function setupSidebarToggle() {
    const toggleBtn = document.getElementById('toggle-sidebar-btn');
    const sidebar = document.getElementById('sidebar');
    const chatContainer = document.querySelector('.chat-container');
    
    // Check if sidebar should be open by default
    if (window.innerWidth > 768) {
        sidebar.style.transform = 'translateX(0)';
        chatContainer.style.marginLeft = 'var(--sidebar-width)';
    } else {
        sidebar.style.transform = 'translateX(-100%)';
        chatContainer.style.marginLeft = '0';
    }
    
    // Toggle sidebar visibility when hamburger button is clicked
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent propagation to document click handler
        const isHidden = sidebar.style.transform === 'translateX(-100%)';
        
        if (isHidden) {
            sidebar.style.transform = 'translateX(0)';
            if (window.innerWidth > 768) {
                chatContainer.style.marginLeft = 'var(--sidebar-width)';
            }
        } else {
            sidebar.style.transform = 'translateX(-100%)';
            chatContainer.style.marginLeft = '0';
        }
    });
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        // Check if sidebar is visible
        if (sidebar.style.transform !== 'translateX(-100%)') {
            // Check if click is outside sidebar and not on toggle button
            if (!sidebar.contains(e.target) && e.target !== toggleBtn) {
                sidebar.style.transform = 'translateX(-100%)';
                chatContainer.style.marginLeft = '0';
            }
        }
    });
    
    // Prevent closing when clicking inside the sidebar
    sidebar.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Update layout on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            if (sidebar.style.transform === 'translateX(0)') {
                chatContainer.style.marginLeft = 'var(--sidebar-width)';
            }
        } else {
            chatContainer.style.marginLeft = '0';
        }
    });
}

// Show typing indicator
function showTypingIndicator() {
    // ... existing code ...
}

// Hide typing indicator
function hideTypingIndicator() {
    // ... existing code ...
}

// Update the UI when a character is selected
function updateUIForCharacter(character) {
    // ... existing code ...
}

// Show a notification
function showNotification(message, type = 'info', duration = 3000) {
    // ... existing code ...
}

// Toggle UI elements based on connection status
function updateConnectionStatusUI(isConnected) {
    // ... existing code ...
} 
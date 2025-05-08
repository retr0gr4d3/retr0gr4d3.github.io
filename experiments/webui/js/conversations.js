// Conversation management for Retro AI Online
document.addEventListener('DOMContentLoaded', () => {
    // Set up conversation-related event listeners
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('chat-input').addEventListener('keydown', handleChatInputKeydown);
    document.getElementById('clear-chat-btn').addEventListener('click', clearCurrentChat);
    document.getElementById('regenerate-btn').addEventListener('click', regenerateLastMessage);
    
    // Conversation handling
    document.getElementById('new-conversation-btn').addEventListener('click', () => {
        if (window.currentCharacter) {
            startNewConversation(window.currentCharacter);
        } else {
            showStatusMessage('Please select a character first', 'error');
        }
    });
});

// Handle keydown in chat input
function handleChatInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

// Send message from user
async function sendMessage() {
    const inputElement = document.getElementById('chat-input');
    let userMessage = inputElement.value.trim();
    
    // Check if a conversation and character are selected
    if (!window.currentCharacter) {
        showStatusMessage('Please select a character first', 'error');
        return;
    }
    
    if (!window.currentConversation) {
        startNewConversation(window.currentCharacter, userMessage);
        return;
    }
    
    // Create a message object
    const message = {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
    };
    
    // Add message to UI
    addMessageToChat(message);
    
    // Clear input
    inputElement.value = '';
    
    // Prepare conversation context for the API
    const conversation = window.currentConversation;
    
    // Add message to conversation
    conversation.messages.push(message);
    
    // Save conversation
    storage.saveConversation(conversation);
    
    try {
        // Show typing indicator
        showTypingIndicator();
        
        // Send to API
        await sendToAPI(conversation);
    } catch (error) {
        console.error('Error sending message:', error);
        hideTypingIndicator();
        showStatusMessage(`Error: ${error.message}`, 'error');
    }
}

// Start a new conversation
function startNewConversation(character, initialUserMessage = null) {
    if (!character) {
        showStatusMessage('Please select a character first', 'error');
        return;
    }
    
    // Create a new conversation
    const conversation = {
        id: storage.generateId(),
        character_id: character.id,
        title: `Conversation with ${character.name}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: []
    };
    
    // Set as current conversation
    window.currentConversation = conversation;
    storage.setCurrentConversation(conversation);
    
    // Prepare system message with character information
    let systemMessage = `You are ${character.name}.`;
    
    if (character.personality) {
        systemMessage += `\n\nPersonality: ${character.personality}`;
    }
    
    if (character.description) {
        systemMessage += `\n\nDescription: ${character.description}`;
    }
    
    // Add example conversations if available
    if (character.example_messages) {
        systemMessage += `\n\nExample conversations:\n${character.example_messages}`;
    }
    
    // Add system message to conversation
    conversation.messages.push({
        role: 'system',
        content: systemMessage,
        timestamp: new Date().toISOString()
    });
    
    // Save conversation
    storage.saveConversation(conversation);
    
    // Update UI
    renderConversationList();
    
    // Update chat UI
    document.getElementById('chat-messages').innerHTML = '';
    
    // Add first message if character has one defined and no initial user message
    if (character.first_message && !initialUserMessage) {
        const firstMessage = {
            role: 'assistant',
            content: character.first_message,
            timestamp: new Date().toISOString()
        };
        
        // Add to conversation
        conversation.messages.push(firstMessage);
        storage.saveConversation(conversation);
        
        // Add to UI
        addMessageToChat(firstMessage);
    } else if (initialUserMessage) {
        // If there was an initial user message, process it now
        const userMessage = {
            role: 'user',
            content: initialUserMessage,
            timestamp: new Date().toISOString()
        };
        
        // Add to conversation
        conversation.messages.push(userMessage);
        storage.saveConversation(conversation);
        
        // Add to UI
        addMessageToChat(userMessage);
        
        // Clear input
        document.getElementById('chat-input').value = '';
        
        // Send to API
        try {
            showTypingIndicator();
            sendToAPI(conversation);
        } catch (error) {
            hideTypingIndicator();
            showStatusMessage(`Error: ${error.message}`, 'error');
        }
    }
    
    // Update active conversation in UI
    const conversationElements = document.querySelectorAll('.conversation-card');
    conversationElements.forEach(element => {
        element.classList.remove('active');
        if (element.getAttribute('data-id') === conversation.id) {
            element.classList.add('active');
        }
    });
}

// Send conversation to API
async function sendToAPI(conversation) {
    if (!conversation || !conversation.messages || conversation.messages.length === 0) {
        hideTypingIndicator();
        return;
    }
    
    try {
        // Filter out system messages for the API call (they're included in the first message)
        const visibleMessages = conversation.messages.filter(msg => 
            msg.role === 'user' || msg.role === 'assistant');
        
        // Get system message if any
        const systemMessages = conversation.messages.filter(msg => msg.role === 'system');
        const systemMessage = systemMessages.length > 0 ? systemMessages[0] : null;
        
        // Prepare messages for API
        let apiMessages = [];
        
        // Add system message if available
        if (systemMessage) {
            apiMessages.push({
                role: 'system',
                content: systemMessage.content
            });
        }
        
        // Add visible messages
        apiMessages = apiMessages.concat(visibleMessages.map(msg => ({
            role: msg.role,
            content: msg.content
        })));
        
        // Get the response from API
        const response = await api.sendChatMessage(apiMessages);
        
        // Create a message object
        const assistantMessage = {
            role: 'assistant',
            content: response.content,
            timestamp: new Date().toISOString()
        };
        
        // Add to conversation
        conversation.messages.push(assistantMessage);
        conversation.updated_at = new Date().toISOString();
        
        // Save conversation
        storage.saveConversation(conversation);
        
        // Add to UI
        hideTypingIndicator();
        addMessageToChat(assistantMessage);
        
        // Update conversation title after a few messages
        if (conversation.messages.filter(m => m.role === 'user').length === 2) {
            updateConversationTitle(conversation);
        }
    } catch (error) {
        hideTypingIndicator();
        showStatusMessage(`API Error: ${error.message}`, 'error');
    }
}

// Update conversation title based on content
async function updateConversationTitle(conversation) {
    try {
        // Get the first couple of exchanges to generate a title
        const messages = conversation.messages.filter(m => m.role === 'user' || m.role === 'assistant');
        const titleContext = messages.slice(0, 4);
        
        // Create a title ourselves based on the first user message
        const firstUserMessage = conversation.messages.find(m => m.role === 'user');
        if (firstUserMessage) {
            // Use the first 30 chars of the first user message as the title
            let title = firstUserMessage.content.trim().substring(0, 30);
            if (firstUserMessage.content.length > 30) {
                title += '...';
            }
            
            // Update conversation
            conversation.title = title;
            conversation.updated_at = new Date().toISOString();
            
            // Save conversation
            storage.saveConversation(conversation);
            
            // Update UI
            renderConversationList();
        }
    } catch (error) {
        console.error('Error updating conversation title:', error);
    }
}

// Render the conversation list
function renderConversationList(conversations = null) {
    // If no conversations provided, get from storage based on current character
    if (!conversations && window.currentCharacter) {
        conversations = storage.getConversationsByCharacter(window.currentCharacter.id);
    } else if (!conversations) {
        conversations = [];
    }
    
    const listElement = document.getElementById('conversation-list');
    
    // Clear existing list but keep default empty message
    const defaultEmptyMessage = listElement.querySelector('.default-empty-message');
    const existingItems = listElement.querySelectorAll(':not(.default-empty-message)');
    existingItems.forEach(item => item.remove());
    
    if (conversations.length === 0) {
        // Show the default empty message if it exists
        if (defaultEmptyMessage) {
            defaultEmptyMessage.style.display = 'block';
        } else {
            // Create it if it doesn't exist
            listElement.innerHTML = '<div class="empty-list">No conversations yet. Please start one by selecting or creating a character, then clicking the plus.</div>';
        }
        return;
    }
    
    // Hide the default empty message
    if (defaultEmptyMessage) {
        defaultEmptyMessage.style.display = 'none';
    }
    
    // Sort conversations by update time (newest first)
    conversations.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    
    // Add each conversation to the list
    conversations.forEach(conversation => {
        const element = createConversationElement(conversation);
        listElement.appendChild(element);
    });
}

// Create conversation list item
function createConversationElement(conversation) {
    const element = document.createElement('div');
    element.className = 'conversation-card';
    element.setAttribute('data-id', conversation.id);
    
    // Check if this is the current conversation
    if (window.currentConversation && window.currentConversation.id === conversation.id) {
        element.classList.add('active');
    }
    
    // Conversation info
    const infoDiv = document.createElement('div');
    infoDiv.className = 'conversation-info';
    
    const title = document.createElement('div');
    title.className = 'conversation-title';
    title.textContent = conversation.title;
    infoDiv.appendChild(title);
    
    const meta = document.createElement('div');
    meta.className = 'conversation-meta';
    
    // Count messages
    const messageCount = conversation.messages.filter(m => m.role === 'user' || m.role === 'assistant').length;
    const date = new Date(conversation.updated_at).toLocaleDateString();
    meta.textContent = `${messageCount} messages · ${date}`;
    
    infoDiv.appendChild(meta);
    element.appendChild(infoDiv);
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Delete Conversation';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteConversation(conversation.id);
    });
    element.appendChild(deleteBtn);
    
    // Click event to load conversation
    element.addEventListener('click', () => {
        loadConversation(conversation.id);
    });
    
    return element;
}

// Load a conversation
function loadConversation(conversationId) {
    // Get conversation from storage
    const conversations = storage.getConversations();
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (!conversation) {
        showStatusMessage('Conversation not found', 'error');
        return;
    }
    
    // Set as current conversation
    window.currentConversation = conversation;
    storage.setCurrentConversation(conversation);
    
    // Update UI for active conversation
    const conversationElements = document.querySelectorAll('.conversation-card');
    conversationElements.forEach(element => {
        element.classList.remove('active');
        if (element.getAttribute('data-id') === conversationId) {
            element.classList.add('active');
        }
    });
    
    // Clear chat and add messages
    document.getElementById('chat-messages').innerHTML = '';
    
    // Filter out system messages
    const visibleMessages = conversation.messages.filter(msg => 
        msg.role === 'user' || msg.role === 'assistant');
    
    // Add visible messages to chat
    visibleMessages.forEach(message => {
        addMessageToChat(message);
    });
}

// Delete a conversation
function deleteConversation(conversationId) {
    if (!confirm('Are you sure you want to delete this conversation?')) {
        return;
    }
    
    // Delete conversation
    storage.deleteConversation(conversationId);
    
    // Refresh conversation list
    renderConversationList();
    
    // Clear chat if needed
    if (window.currentConversation && window.currentConversation.id === conversationId) {
        window.currentConversation = null;
        
        // Show welcome message
        document.getElementById('chat-messages').innerHTML = `
            <div class="welcome-message">
                <h3>Talking to ${window.currentCharacter.name}</h3>
                <p>Start a new conversation or select an existing one.</p>
            </div>
        `;
    }
    
    showStatusMessage('Conversation deleted', 'info');
}

// Clear the current chat (but keep the conversation in storage)
function clearCurrentChat() {
    if (!window.currentConversation) {
        return;
    }
    
    if (!confirm('Are you sure you want to clear this chat? This will delete all messages but keep the conversation.')) {
        return;
    }
    
    const conversation = window.currentConversation;
    
    // Keep only system messages
    const systemMessages = conversation.messages.filter(msg => msg.role === 'system');
    conversation.messages = systemMessages;
    conversation.updated_at = new Date().toISOString();
    
    // Save conversation
    storage.saveConversation(conversation);
    
    // Clear chat UI
    document.getElementById('chat-messages').innerHTML = '';
    
    // Show notification
    showStatusMessage('Chat cleared', 'info');
}

// Regenerate the last message
async function regenerateLastMessage() {
    if (!window.currentConversation) {
        showStatusMessage('No active conversation', 'error');
        return;
    }
    
    const conversation = window.currentConversation;
    
    // Check if there are any messages to regenerate
    const visibleMessages = conversation.messages.filter(msg => 
        msg.role === 'user' || msg.role === 'assistant');
    
    if (visibleMessages.length === 0) {
        showStatusMessage('No messages to regenerate', 'error');
        return;
    }
    
    // Get the last message
    const lastMessage = visibleMessages[visibleMessages.length - 1];
    
    // If the last message is from the user, send it again
    if (lastMessage.role === 'user') {
        // Get chat messages element
        const chatMessages = document.getElementById('chat-messages');
        
        // Remove the last message element (user's)
        chatMessages.lastElementChild.remove();
        
        // Remove the last message from the conversation
        conversation.messages.pop();
        
        // Save conversation
        storage.saveConversation(conversation);
        
        // Send the message again
        const userMessage = {
            role: 'user',
            content: lastMessage.content,
            timestamp: new Date().toISOString()
        };
        
        // Add to conversation
        conversation.messages.push(userMessage);
        storage.saveConversation(conversation);
        
        // Add to UI
        addMessageToChat(userMessage);
        
        // Send to API
        try {
            showTypingIndicator();
            await sendToAPI(conversation);
        } catch (error) {
            hideTypingIndicator();
            showStatusMessage(`Error: ${error.message}`, 'error');
        }
    } 
    // If the last message is from the AI, regenerate it
    else if (lastMessage.role === 'assistant') {
        // Get chat messages element
        const chatMessages = document.getElementById('chat-messages');
        
        // Remove the last message element (AI's)
        chatMessages.lastElementChild.remove();
        
        // Remove the last message from the conversation
        conversation.messages.pop();
        
        // Save conversation
        storage.saveConversation(conversation);
        
        // Send to API again
        try {
            showTypingIndicator();
            await sendToAPI(conversation);
        } catch (error) {
            hideTypingIndicator();
            showStatusMessage(`Error: ${error.message}`, 'error');
        }
    }
}

// Show typing indicator
function showTypingIndicator() {
    const chatMessages = document.getElementById('chat-messages');
    
    // Check if typing indicator already exists
    if (document.getElementById('typing-indicator')) {
        return;
    }
    
    // Create typing indicator
    const indicator = document.createElement('div');
    indicator.id = 'typing-indicator';
    indicator.className = 'message message-bot typing-indicator';
    indicator.innerHTML = '<div class="dots"><span>.</span><span>.</span><span>.</span></div>';
    
    chatMessages.appendChild(indicator);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Hide typing indicator
function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.remove();
    }
} 
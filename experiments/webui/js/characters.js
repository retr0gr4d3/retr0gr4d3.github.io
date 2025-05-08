// Character management for Retro AI Online
document.addEventListener('DOMContentLoaded', () => {
    // Set up character event listeners
    document.getElementById('save-character-btn').addEventListener('click', saveCharacter);
    document.getElementById('import-json-btn').addEventListener('click', importCharacterFromJson);
    
    // Add event listeners for character buttons
    document.getElementById('new-character-btn').addEventListener('click', () => showCharacterModal());
    document.getElementById('import-character-btn').addEventListener('click', showImportModal);
    document.getElementById('edit-character-btn').addEventListener('click', () => {
        if (window.currentCharacter) {
            showCharacterModal(window.currentCharacter);
        } else {
            showStatusMessage('Please select a character first', 'error');
        }
    });
    
    // Render any existing characters
    renderCharacterList();
});

// Save character (create or update)
function saveCharacter() {
    // Get form values
    const nameInput = document.getElementById('character-name-input');
    const name = nameInput.value.trim();
    
    if (!name) {
        showStatusMessage('Character name is required', 'error');
        nameInput.focus();
        return;
    }
    
    // Get other form values
    const description = document.getElementById('character-description').value.trim();
    const personality = document.getElementById('character-personality').value.trim();
    const firstMessage = document.getElementById('character-first-message').value.trim();
    const exampleMessages = document.getElementById('character-example-messages').value.trim();
    
    // Get avatar
    const avatarPreview = document.getElementById('character-avatar-preview');
    const avatar = avatarPreview.src === window.location.href + 'img/default_avatar.png' 
        ? null 
        : avatarPreview.src;
    
    // Check if updating existing character
    const saveBtn = document.getElementById('save-character-btn');
    const characterId = saveBtn.getAttribute('data-character-id');
    
    let character = {
        name,
        description,
        personality,
        first_message: firstMessage,
        example_messages: exampleMessages,
        avatar,
        created_at: new Date().toISOString()
    };
    
    if (characterId) {
        // Updating existing character
        character.id = characterId;
        character.updated_at = new Date().toISOString();
    } else {
        // Creating new character
        character.id = storage.generateId();
    }
    
    // Save character
    storage.saveCharacter(character);
    
    // Hide modal
    document.getElementById('character-modal').classList.add('hidden');
    
    // Refresh character list
    renderCharacterList();
    
    // Show success message
    showStatusMessage(`Character ${characterId ? 'updated' : 'created'} successfully`, 'success');
    
    // Select the new/updated character
    selectCharacter(character.id);
}

// Import character from JSON
function importCharacterFromJson() {
    const jsonData = document.getElementById('json-data').value.trim();
    
    if (!jsonData) {
        showStatusMessage('Please enter JSON data or upload a file', 'error');
        return;
    }
    
    try {
        console.log('Trying to parse JSON data:', jsonData.substring(0, 100) + '...');
        
        // Analyze JSON structure to help with debugging
        try {
            const rawData = JSON.parse(jsonData);
            console.log('Full JSON keys at root level:', Object.keys(rawData));
            printObjectStructure(rawData, 'root');
        } catch (e) {
            console.error('Error analyzing JSON structure:', e);
        }
        
        // Parse character data
        const character = api.parseCharacterJson(jsonData);
        
        console.log('Parsed character data:', character);
        
        // Add created timestamp
        character.created_at = new Date().toISOString();
        
        // Save character
        storage.saveCharacter(character);
        
        // Hide modal
        document.getElementById('chub-import-modal').classList.add('hidden');
        
        // Refresh character list
        renderCharacterList();
        
        // Show success message
        showStatusMessage('Character imported successfully', 'success');
        
        // Select the imported character
        selectCharacter(character.id);
    } catch (error) {
        console.error('Import error:', error);
        console.error('JSON data that failed:', jsonData);
        showStatusMessage(`Import failed: ${error.message}`, 'error');
    }
}

// Helper function to print object structure for debugging
function printObjectStructure(obj, path = '', maxDepth = 2, currentDepth = 0) {
    if (currentDepth >= maxDepth) {
        console.log(`${path}: [Max depth reached]`);
        return;
    }
    
    if (obj === null) {
        console.log(`${path}: null`);
        return;
    }
    
    if (typeof obj !== 'object') {
        console.log(`${path}: ${typeof obj} = ${obj.toString().substring(0, 50)}`);
        return;
    }
    
    if (Array.isArray(obj)) {
        console.log(`${path}: Array(${obj.length})`);
        if (obj.length > 0 && currentDepth < maxDepth - 1) {
            printObjectStructure(obj[0], `${path}[0]`, maxDepth, currentDepth + 1);
        }
        return;
    }
    
    console.log(`${path}: Object with keys: ${Object.keys(obj).join(', ')}`);
    
    if (currentDepth < maxDepth - 1) {
        for (const key of Object.keys(obj)) {
            printObjectStructure(obj[key], `${path}.${key}`, maxDepth, currentDepth + 1);
        }
    }
}

// Render the character list
function renderCharacterList() {
    const characters = storage.getCharacters();
    const listElement = document.getElementById('character-list');
    
    // Clear existing list
    const defaultEmptyMessage = listElement.querySelector('.default-empty-message');
    const existingItems = listElement.querySelectorAll(':not(.default-empty-message)');
    existingItems.forEach(item => item.remove());
    
    if (characters.length === 0) {
        // Show the default empty message if it exists
        if (defaultEmptyMessage) {
            defaultEmptyMessage.style.display = 'block';
        } else {
            // Create it if it doesn't exist
            listElement.innerHTML = '<div class="empty-list">No characters yet. Please import a JSON file, or create your own.</div>';
        }
        return;
    }
    
    // Hide the default empty message
    if (defaultEmptyMessage) {
        defaultEmptyMessage.style.display = 'none';
    }
    
    // Sort characters by name
    characters.sort((a, b) => a.name.localeCompare(b.name));
    
    // Add each character to the list
    characters.forEach(character => {
        const characterElement = createCharacterElement(character);
        listElement.appendChild(characterElement);
    });
}

// Create character list item
function createCharacterElement(character) {
    const element = document.createElement('div');
    element.className = 'character-card';
    element.setAttribute('data-id', character.id);
    
    // Check if this is the current character
    const currentCharacter = storage.getCurrentCharacter();
    if (currentCharacter && currentCharacter.id === character.id) {
        element.classList.add('active');
    }
    
    // Avatar
    const avatar = document.createElement('img');
    if (character.avatar) {
        avatar.src = character.avatar;
    } else if (window.defaultAvatarUrl) {
        avatar.src = window.defaultAvatarUrl;
    } else {
        avatar.src = 'img/default_avatar.png';
        // Add error handler
        avatar.onerror = function() {
            // If the default image fails, use a colored background
            this.style.backgroundColor = '#7c4dff';
            this.style.borderRadius = '50%';
        };
    }
    avatar.alt = character.name;
    element.appendChild(avatar);
    
    // Character info
    const infoDiv = document.createElement('div');
    infoDiv.className = 'character-info';
    
    const name = document.createElement('div');
    name.className = 'character-name';
    name.textContent = character.name;
    infoDiv.appendChild(name);
    
    const description = document.createElement('div');
    description.className = 'character-description';
    description.textContent = character.description || '';
    infoDiv.appendChild(description);
    
    element.appendChild(infoDiv);
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '×';
    deleteBtn.title = 'Delete Character';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteCharacter(character.id);
    });
    element.appendChild(deleteBtn);
    
    // Click event to select character
    element.addEventListener('click', () => {
        selectCharacter(character.id);
    });
    
    return element;
}

// Select a character
function selectCharacter(characterId) {
    // Get character
    const characters = storage.getCharacters();
    const character = characters.find(c => c.id === characterId);
    
    if (!character) {
        showStatusMessage('Character not found', 'error');
        return;
    }
    
    // Update UI
    const characterCards = document.querySelectorAll('.character-card');
    characterCards.forEach(card => {
        card.classList.remove('active');
        if (card.getAttribute('data-id') === characterId) {
            card.classList.add('active');
        }
    });
    
    // Set as current character
    window.currentCharacter = character;
    storage.setCurrentCharacter(character);
    
    // Update header with proper avatar fallback
    const avatarElement = document.getElementById('character-avatar');
    if (character.avatar) {
        avatarElement.src = character.avatar;
    } else if (window.defaultAvatarUrl) {
        avatarElement.src = window.defaultAvatarUrl;
    } else {
        avatarElement.src = 'img/default_avatar.png';
        // Add error handler
        avatarElement.onerror = function() {
            // If the default image fails, use a colored background
            this.style.backgroundColor = '#7c4dff';
            this.style.borderRadius = '50%';
        };
    }
    document.getElementById('character-name').textContent = character.name;
    
    // Load character conversations
    loadCharacterConversations(characterId);
    
    // Clear current chat if no conversation is selected
    if (!window.currentConversation) {
        document.getElementById('chat-messages').innerHTML = `
            <div class="welcome-message">
                <h3>Talking to ${character.name}</h3>
                <p>Start a new conversation or select an existing one.</p>
            </div>
        `;
    }
}

// Delete character
function deleteCharacter(characterId) {
    if (!confirm('Are you sure you want to delete this character? This will also delete all conversations with this character.')) {
        return;
    }
    
    // Delete character
    storage.deleteCharacter(characterId);
    
    // Refresh lists
    renderCharacterList();
    renderConversationList();
    
    // Clear chat if needed
    if (window.currentCharacter && window.currentCharacter.id === characterId) {
        window.currentCharacter = null;
        window.currentConversation = null;
        
        const avatarElement = document.getElementById('character-avatar');
        if (window.defaultAvatarUrl) {
            avatarElement.src = window.defaultAvatarUrl;
        } else {
            avatarElement.src = 'img/default_avatar.png';
        }
        document.getElementById('character-name').textContent = 'Select a Character';
        
        document.getElementById('chat-messages').innerHTML = `
            <div class="welcome-message">
                <h3>Welcome to Retro AI Online</h3>
                <p>Select a character from the sidebar to start a conversation or create a new one.</p>
            </div>
        `;
    }
    
    showStatusMessage('Character deleted', 'info');
}

// Load a character's conversations
function loadCharacterConversations(characterId) {
    const conversations = storage.getConversationsByCharacter(characterId);
    
    // Try to restore current conversation if it belongs to this character
    const currentConversation = storage.getCurrentConversation();
    if (currentConversation && currentConversation.character_id === characterId) {
        window.currentConversation = currentConversation;
        loadConversation(currentConversation.id);
    } else {
        // Otherwise clear current conversation
        window.currentConversation = null;
        storage.clearCurrentConversation();
    }
    
    // Render conversation list
    renderConversationList(conversations);
} 
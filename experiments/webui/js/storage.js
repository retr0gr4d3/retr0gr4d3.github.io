// Storage handler for Retro AI Online
const storage = {
    // Key names for different data types
    KEYS: {
        CHARACTERS: 'rao_characters',
        CONVERSATIONS: 'rao_conversations',
        SETTINGS: 'rao_settings',
        CURRENT_CHARACTER: 'rao_current_character',
        CURRENT_CONVERSATION: 'rao_current_conversation'
    },
    
    // Initialize storage with default values if needed
    init() {
        // Check if storage is available
        if (!this.isAvailable()) {
            console.error('localStorage is not available. Application may not work correctly.');
            return false;
        }
        
        // Create empty arrays/objects if they don't exist
        if (!this.getCharacters()) {
            this.setItem(this.KEYS.CHARACTERS, []);
        }
        
        if (!this.getConversations()) {
            this.setItem(this.KEYS.CONVERSATIONS, []);
        }
        
        if (!this.getSettings()) {
            const defaultSettings = {
                apiUrl: 'http://localhost:5001/v1',
                apiKey: '',
                model: 'default',
                temperature: 0.7,
                max_tokens: 2048,
                top_p: 0.9,
                theme: 'dark',
                fontSize: 16
            };
            this.setItem(this.KEYS.SETTINGS, defaultSettings);
        }
        
        return true;
    },
    
    // Check if localStorage is available
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },
    
    // Get/Set generic items
    getItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (e) {
            console.error(`Error getting item from storage: ${key}`, e);
            return null;
        }
    },
    
    setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`Error setting item in storage: ${key}`, e);
            return false;
        }
    },
    
    removeItem(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error(`Error removing item from storage: ${key}`, e);
            return false;
        }
    },
    
    // Characters
    getCharacters() {
        return this.getItem(this.KEYS.CHARACTERS) || [];
    },
    
    saveCharacter(character) {
        const characters = this.getCharacters();
        
        // Check if character already exists (for updates)
        const index = characters.findIndex(c => c.id === character.id);
        
        if (index !== -1) {
            // Update existing character
            characters[index] = character;
        } else {
            // Add new character
            characters.push(character);
        }
        
        return this.setItem(this.KEYS.CHARACTERS, characters);
    },
    
    deleteCharacter(characterId) {
        const characters = this.getCharacters();
        const filteredCharacters = characters.filter(c => c.id !== characterId);
        
        // Also delete related conversations
        const conversations = this.getConversations();
        const filteredConversations = conversations.filter(c => c.character_id !== characterId);
        this.setItem(this.KEYS.CONVERSATIONS, filteredConversations);
        
        // Clear current character/conversation if they're being deleted
        const currentCharacter = this.getCurrentCharacter();
        if (currentCharacter && currentCharacter.id === characterId) {
            this.clearCurrentCharacter();
        }
        
        return this.setItem(this.KEYS.CHARACTERS, filteredCharacters);
    },
    
    // Conversations
    getConversations() {
        return this.getItem(this.KEYS.CONVERSATIONS) || [];
    },
    
    getConversationsByCharacter(characterId) {
        const conversations = this.getConversations();
        return conversations.filter(c => c.character_id === characterId);
    },
    
    saveConversation(conversation) {
        const conversations = this.getConversations();
        
        // Check if conversation already exists (for updates)
        const index = conversations.findIndex(c => c.id === conversation.id);
        
        if (index !== -1) {
            // Update existing conversation
            conversations[index] = conversation;
        } else {
            // Add new conversation
            conversations.push(conversation);
        }
        
        return this.setItem(this.KEYS.CONVERSATIONS, conversations);
    },
    
    deleteConversation(conversationId) {
        const conversations = this.getConversations();
        const filteredConversations = conversations.filter(c => c.id !== conversationId);
        
        // Clear current conversation if it's being deleted
        const currentConversation = this.getCurrentConversation();
        if (currentConversation && currentConversation.id === conversationId) {
            this.clearCurrentConversation();
        }
        
        return this.setItem(this.KEYS.CONVERSATIONS, filteredConversations);
    },
    
    // Settings
    getSettings() {
        return this.getItem(this.KEYS.SETTINGS) || {};
    },
    
    saveSettings(settings) {
        return this.setItem(this.KEYS.SETTINGS, settings);
    },
    
    // Current character/conversation tracking
    getCurrentCharacter() {
        return this.getItem(this.KEYS.CURRENT_CHARACTER);
    },
    
    setCurrentCharacter(character) {
        return this.setItem(this.KEYS.CURRENT_CHARACTER, character);
    },
    
    clearCurrentCharacter() {
        return this.removeItem(this.KEYS.CURRENT_CHARACTER);
    },
    
    getCurrentConversation() {
        return this.getItem(this.KEYS.CURRENT_CONVERSATION);
    },
    
    setCurrentConversation(conversation) {
        return this.setItem(this.KEYS.CURRENT_CONVERSATION, conversation);
    },
    
    clearCurrentConversation() {
        return this.removeItem(this.KEYS.CURRENT_CONVERSATION);
    },
    
    // Utility to generate unique IDs
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    },
    
    // Clear all stored data
    clearAll() {
        this.removeItem(this.KEYS.CHARACTERS);
        this.removeItem(this.KEYS.CONVERSATIONS);
        this.removeItem(this.KEYS.CURRENT_CHARACTER);
        this.removeItem(this.KEYS.CURRENT_CONVERSATION);
        // Keep settings
        
        // Re-initialize with defaults
        this.init();
    },
    
    // Export all data
    exportData() {
        return {
            characters: this.getCharacters(),
            conversations: this.getConversations(),
            settings: this.getSettings(),
            version: '1.0'
        };
    },
    
    // Import data
    importData(data) {
        if (!data) return false;
        
        try {
            // Validate data structure
            if (data.characters && Array.isArray(data.characters)) {
                this.setItem(this.KEYS.CHARACTERS, data.characters);
            }
            
            if (data.conversations && Array.isArray(data.conversations)) {
                this.setItem(this.KEYS.CONVERSATIONS, data.conversations);
            }
            
            if (data.settings && typeof data.settings === 'object') {
                this.setItem(this.KEYS.SETTINGS, data.settings);
            }
            
            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    }
}; 
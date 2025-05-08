// API Client for Retro AI Online
const api = {
    // Get current API settings from storage
    getApiSettings() {
        const settings = storage.getSettings();
        return {
            apiUrl: settings.apiUrl || 'http://localhost:5001/v1',
            apiKey: settings.apiKey || ''
        };
    },
    
    // Helper method for making API requests
    async request(endpoint, options = {}) {
        // Get current API settings
        const { apiUrl, apiKey } = this.getApiSettings();
        
        // Construct full URL
        let url = endpoint.startsWith('http') ? endpoint : `${apiUrl}${endpoint}`;
        
        // Set default headers
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        // Add API key if available
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }
        
        try {
            const response = await fetch(url, {
                ...options,
                headers
            });
            
            // Handle non-JSON responses
            const contentType = response.headers.get('Content-Type');
            if (contentType && contentType.includes('application/json')) {
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || `API Error: ${response.status}`);
                }
                
                return data;
            } else {
                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(text || `API Error: ${response.status}`);
                }
                
                return await response.text();
            }
        } catch (error) {
            console.error(`API Request Failed: ${error.message}`);
            throw error;
        }
    },
    
    // Test connection to API
    async testConnection(apiUrl) {
        try {
            const url = apiUrl ? apiUrl : this.getApiSettings().apiUrl;
            
            // Try to get models as a basic connectivity test
            const response = await fetch(`${url}/models`);
            
            if (response.ok) {
                return { success: true, message: 'Successfully connected to API' };
            } else {
                // Fallback to simple check
                const text = await response.text();
                return { 
                    success: false, 
                    message: `Unable to connect to API: ${text || response.statusText}`
                };
            }
        } catch (error) {
            return { 
                success: false, 
                message: `API connection failed: ${error.message}`
            };
        }
    },
    
    // Get available models
    async getModels() {
        try {
            const { apiUrl } = this.getApiSettings();
            const response = await fetch(`${apiUrl}/models`);
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.data && Array.isArray(data.data)) {
                    return data.data.map(model => ({
                        id: model.id,
                        name: model.id
                    }));
                }
            }
            
            // Fallback to default model if API doesn't support model listing
            return [{ id: 'default', name: 'Default Model' }];
        } catch (error) {
            console.error('Failed to get models:', error);
            return [{ id: 'default', name: 'Default Model' }];
        }
    },
    
    // Chat completion API call
    async sendChatMessage(messages, settings = {}) {
        const { apiUrl, apiKey } = this.getApiSettings();
        
        // Get model settings
        const modelSettings = storage.getSettings();
        
        const payload = {
            model: settings.model || modelSettings.model || 'default',
            messages,
            temperature: parseFloat(settings.temperature) || parseFloat(modelSettings.temperature) || 0.7,
            max_tokens: parseInt(settings.max_tokens) || parseInt(modelSettings.max_tokens) || 2048,
            top_p: parseFloat(settings.top_p) || parseFloat(modelSettings.top_p) || 0.9,
            frequency_penalty: parseFloat(settings.frequency_penalty) || 0,
            presence_penalty: parseFloat(settings.presence_penalty) || 0
        };
        
        console.log('Sending chat message:', payload);
        
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (apiKey) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }
            
            const response = await fetch(`${apiUrl}/chat/completions`, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `API Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Extract and return the response
            if (data.choices && data.choices.length > 0) {
                return {
                    content: data.choices[0].message.content,
                    role: data.choices[0].message.role || 'assistant'
                };
            } else {
                throw new Error('Invalid response from API');
            }
        } catch (error) {
            console.error('Chat completion failed:', error);
            throw error;
        }
    },
    
    // Process and convert a character JSON from various formats
    parseCharacterJson(jsonData) {
        console.log('parseCharacterJson called with:', typeof jsonData);
        
        // Try to parse the JSON if it's a string
        let data = jsonData;
        if (typeof jsonData === 'string') {
            try {
                data = JSON.parse(jsonData);
                console.log('Successfully parsed JSON string to object');
            } catch (error) {
                console.error('JSON parse error:', error);
                throw new Error('Invalid JSON format: ' + error.message);
            }
        }
        
        console.log('JSON data after parsing:', data);
        
        if (!data) {
            throw new Error('No character data provided');
        }
        
        // Initialize character with default values
        let character = {
            id: storage.generateId(),
            name: 'Unknown Character',
            avatar: null,
            description: '',
            personality: '',
            first_message: '',
            example_messages: ''
        };
        
        console.log('Looking for character data in fields...');
        
        // Handle chara_card_v2 special format (this is a very common format)
        if (data.spec === "chara_card_v2" && data.data) {
            console.log('Found chara_card_v2 format - using data field');
            
            const cardData = data.data;
            console.log('Character card data keys:', Object.keys(cardData));
            
            // Process the character card data
            if (cardData.name) character.name = cardData.name;
            if (cardData.description) character.description = cardData.description;
            if (cardData.personality) character.personality = cardData.personality;
            if (cardData.avatar) character.avatar = cardData.avatar;
            
            // First message is commonly in first_mes in this format
            if (cardData.first_mes) {
                console.log('Found first_mes in chara_card_v2:', cardData.first_mes.substring(0, 50) + '...');
                character.first_message = cardData.first_mes;
            }
            
            // Example messages
            if (cardData.mes_example) {
                character.example_messages = cardData.mes_example;
            }
            
            console.log('Final character from character card:', character);
            return character;
        }
        
        // Handle nested character data in some export formats
        if (data.character) {
            console.log('Found nested character data in data.character');
            data = data.character;
        }
        
        // Some formats store data in a 'data' field
        const dataField = data.data || {};
        
        // Dump all keys from the object for debugging
        console.log('Available keys in the JSON:', Object.keys(data));
        if (data.data) {
            console.log('Available keys in data.data:', Object.keys(data.data));
        }
        
        // NAME FIELDS - Check for different name fields in various formats
        // Standard formats
        if (data.name) {
            console.log('Found name:', data.name);
            character.name = data.name;
        }
        // Tavern/Character.AI formats
        else if (data.char_name) {
            console.log('Found char_name:', data.char_name);
            character.name = data.char_name;
        }
        // Check in data field
        else if (dataField.name) {
            console.log('Found name in data.data:', dataField.name);
            character.name = dataField.name;
        }
        // Try alternate fields
        else if (data.bot_name) {
            console.log('Found bot_name:', data.bot_name);
            character.name = data.bot_name;
        }
        else if (data.character_name) {
            console.log('Found character_name:', data.character_name);
            character.name = data.character_name;
        }
        
        // AVATAR FIELDS
        if (data.avatar) {
            console.log('Found avatar');
            character.avatar = data.avatar;
        } else if (data.avatar_uri) {
            console.log('Found avatar_uri');
            character.avatar = data.avatar_uri;
        } else if (data.img) {
            console.log('Found img');
            character.avatar = data.img;
        } else if (dataField.avatar) {
            console.log('Found avatar in data.data');
            character.avatar = dataField.avatar;
        } else if (data.image) {
            console.log('Found image');
            character.avatar = data.image;
        }
        
        // DESCRIPTION FIELDS
        if (data.description) {
            console.log('Found description');
            character.description = data.description;
        } else if (dataField.description) {
            console.log('Found description in data.data');
            character.description = dataField.description;
        } else if (data.char_description) {
            console.log('Found char_description');
            character.description = data.char_description;
        } else if (data.summary) {
            console.log('Found summary');
            character.description = data.summary;
        }
        
        // PERSONALITY FIELDS
        if (data.personality) {
            console.log('Found personality field');
            character.personality = data.personality;
        } else if (data.char_persona) {
            console.log('Found char_persona');
            character.personality = data.char_persona;
        } else if (dataField.personality) {
            console.log('Found personality in data.data');
            character.personality = dataField.personality;
        } else if (data.persona) {
            console.log('Found persona');
            character.personality = data.persona;
        }
        
        // FIRST MESSAGE FIELDS
        if (data.first_message) {
            console.log('Found first_message');
            character.first_message = data.first_message;
        } else if (data.char_greeting) {
            console.log('Found char_greeting');
            character.first_message = data.char_greeting;
        } else if (data.first_mes) {
            console.log('Found first_mes');
            character.first_message = data.first_mes;
        } else if (data.greeting) {
            console.log('Found greeting');
            character.first_message = data.greeting;
        } else if (dataField.first_message) {
            console.log('Found first_message in data.data');
            character.first_message = dataField.first_message;
        } else if (dataField.first_mes) {
            console.log('Found first_mes in data.data');
            character.first_message = dataField.first_mes;
        } else if (data.welcome_message) {
            console.log('Found welcome_message');
            character.first_message = data.welcome_message;
        } else if (data.opening) {
            console.log('Found opening');
            character.first_message = data.opening;
        } else if (data.introduction) {
            console.log('Found introduction');
            character.first_message = data.introduction;
        }
        
        // EXAMPLE MESSAGES FIELDS
        if (data.example_messages) {
            console.log('Found example_messages');
            character.example_messages = data.example_messages;
        } else if (data.example_dialogue) {
            console.log('Found example_dialogue');
            character.example_messages = data.example_dialogue;
        } else if (data.mes_example) {
            console.log('Found mes_example');
            character.example_messages = data.mes_example;
        } else if (dataField.example_messages) {
            console.log('Found example_messages in data.data');
            character.example_messages = dataField.example_messages;
        } else if (dataField.mes_example) {
            console.log('Found mes_example in data.data');
            character.example_messages = dataField.mes_example;
        } else if (data.examples || data.sample_dialogue) {
            console.log('Found examples/sample_dialogue');
            character.example_messages = data.examples || data.sample_dialogue;
        }
        
        console.log('Final character data:', character);
        return character;
    }
}; 
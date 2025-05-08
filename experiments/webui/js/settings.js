// Settings management for Retro AI Online
document.addEventListener('DOMContentLoaded', () => {
    // Set up settings event listeners
    document.getElementById('theme-select').addEventListener('change', (e) => {
        setTheme(e.target.value);
    });
    
    document.getElementById('model-select').addEventListener('change', (e) => {
        saveModelSetting('model', e.target.value);
    });
    
    // Accent color
    document.getElementById('accent-color').addEventListener('change', (e) => {
        setAccentColor(e.target.value);
    });
    
    // Font size
    document.getElementById('font-size').addEventListener('input', (e) => {
        setFontSize(e.target.value);
    });
    
    // Sliders
    setupSliderSetting('temperature', 'temperature-value');
    setupSliderSetting('max-tokens', 'max-tokens-value');
    setupSliderSetting('top-p', 'top-p-value');
    
    // Export/Import data
    document.getElementById('export-data-btn').addEventListener('click', exportAllData);
    document.getElementById('import-data-btn').addEventListener('click', importData);
    
    // Load initial settings
    loadSettings();
});

// Load settings from storage
function loadSettings() {
    const settings = storage.getSettings();
    
    // Apply settings to form
    if (settings.apiUrl) {
        document.getElementById('api-url').value = settings.apiUrl;
    }
    
    if (settings.apiKey) {
        document.getElementById('api-key').value = settings.apiKey;
    }
    
    if (settings.model) {
        const modelSelect = document.getElementById('model-select');
        // Check if option exists first
        if (Array.from(modelSelect.options).some(option => option.value === settings.model)) {
            modelSelect.value = settings.model;
        }
    }
    
    if (settings.temperature) {
        const slider = document.getElementById('temperature');
        slider.value = settings.temperature;
        document.getElementById('temperature-value').textContent = settings.temperature;
    }
    
    if (settings.max_tokens) {
        const slider = document.getElementById('max-tokens');
        slider.value = settings.max_tokens;
        document.getElementById('max-tokens-value').textContent = settings.max_tokens;
    }
    
    if (settings.top_p) {
        const slider = document.getElementById('top-p');
        slider.value = settings.top_p;
        document.getElementById('top-p-value').textContent = settings.top_p;
    }
    
    if (settings.theme) {
        document.getElementById('theme-select').value = settings.theme;
        setTheme(settings.theme);
    }
    
    if (settings.accentColor) {
        document.getElementById('accent-color').value = settings.accentColor;
        setAccentColor(settings.accentColor);
    } else {
        // Default to red
        document.getElementById('accent-color').value = '#D4000B';
    }
    
    if (settings.fontSize) {
        const fontSizeSlider = document.getElementById('font-size');
        fontSizeSlider.value = settings.fontSize;
        setFontSize(settings.fontSize);
    }
    
    // Fetch available models
    fetchModels();
}

// Set accent color
function setAccentColor(color) {
    // Set the CSS variable for the accent color
    document.documentElement.style.setProperty('--accent-color', color);
    
    // Convert hex to RGB for the RGB variable
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    document.documentElement.style.setProperty('--accent-color-rgb', `${r}, ${g}, ${b}`);
    
    // Generate a slightly lighter color for hover states
    const lighterColor = lightenColor(color, 15);
    document.documentElement.style.setProperty('--accent-hover', lighterColor);
    
    // Save the setting
    saveModelSetting('accentColor', color);
}

// Make setAccentColor available globally
window.setAccentColor = setAccentColor;

// Helper function to lighten a hex color
function lightenColor(hex, percent) {
    // Convert hex to RGB
    let r = parseInt(hex.substr(1, 2), 16);
    let g = parseInt(hex.substr(3, 2), 16);
    let b = parseInt(hex.substr(5, 2), 16);
    
    // Lighten
    r = Math.min(255, Math.round(r * (1 + percent / 100)));
    g = Math.min(255, Math.round(g * (1 + percent / 100)));
    b = Math.min(255, Math.round(b * (1 + percent / 100)));
    
    // Convert back to hex
    return `#${(r.toString(16).padStart(2, '0'))}${(g.toString(16).padStart(2, '0'))}${(b.toString(16).padStart(2, '0'))}`;
}

// Make lightenColor available globally
window.lightenColor = lightenColor;

// Set up slider setting
function setupSliderSetting(sliderId, valueId, formatter = (val) => val, callback = null) {
    const slider = document.getElementById(sliderId);
    const valueEl = document.getElementById(valueId);
    
    slider.addEventListener('input', () => {
        // Update value display
        const value = slider.value;
        valueEl.textContent = formatter(value);
        
        // Save setting
        saveModelSetting(sliderId, value);
        
        // Execute callback if provided
        if (callback) {
            callback(value);
        }
    });
}

// Save model setting
function saveModelSetting(name, value) {
    const settings = storage.getSettings();
    
    // Map UI element IDs to settings keys
    const settingsMap = {
        'temperature': 'temperature',
        'max-tokens': 'max_tokens',
        'top-p': 'top_p',
        'model-select': 'model',
        'model': 'model',
        'theme-select': 'theme',
        'api-url': 'apiUrl',
        'api-key': 'apiKey',
        'accent-color': 'accentColor',
        'accentColor': 'accentColor'
    };
    
    // Get the correct settings key
    const settingsKey = settingsMap[name] || name;
    
    // Update the setting
    settings[settingsKey] = value;
    
    // Save settings
    storage.saveSettings(settings);
}

// Export all data to a JSON file
function exportAllData() {
    const data = storage.exportData();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    // Create a link to download the file
    const link = document.createElement('a');
    link.href = url;
    link.download = 'retro-ai-online-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showStatusMessage('Data exported successfully', 'success');
}

// Import data from JSON
function importData() {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length === 0) return;
        
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                
                if (confirm('This will replace all your current data. Are you sure you want to proceed?')) {
                    const success = storage.importData(data);
                    
                    if (success) {
                        showStatusMessage('Data imported successfully', 'success');
                        
                        // Reload the page to reflect changes
                        setTimeout(() => {
                            window.location.reload();
                        }, 1000);
                    } else {
                        showStatusMessage('Failed to import data', 'error');
                    }
                }
            } catch (error) {
                showStatusMessage(`Error importing data: ${error.message}`, 'error');
            }
        };
        
        reader.readAsText(file);
    });
    
    // Trigger file selection
    fileInput.click();
}

// Set font size
function setFontSize(size) {
    // Update UI
    document.getElementById('font-size-value').textContent = `${size}px`;
    
    // Apply to CSS variable
    document.documentElement.style.setProperty('--font-size', `${size}px`);
    
    // Save setting
    saveModelSetting('fontSize', size);
}

// Make setFontSize available globally
window.setFontSize = setFontSize; 
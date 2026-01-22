/* ==========================================
   API Configuration
   IMPORTANT: Do not commit this file to Git
   Add to .gitignore: js/config.js
   ========================================== */

const Config = {
    // OpenAI API Configuration
    // Replace YOUR_API_KEY_HERE with your actual OpenAI API key
    OPENAI_API_KEY: 'YOUR_API_KEY_HERE',
    
    // API Endpoints
    OPENAI_ENDPOINT: 'https://api.openai.com/v1/chat/completions',
    
    // Model Configuration
    AI_MODEL: 'gpt-3.5-turbo', // Or 'gpt-4' for higher quality
    
    // Rate Limiting
    MAX_TOKENS: 1500,
    TEMPERATURE: 0.7,
    
    // Feature Flags
    ENABLE_AI_FEATURES: true,
    ENABLE_AI_CACHING: true
};

// Make Config available globally
window.Config = Config;

// Validate API Key
if (Config.OPENAI_API_KEY === 'YOUR_API_KEY_HERE') {
    console.warn('WARNING: API Key not configured! Please add your key to js/config.js');
}
/* ==========================================
   API Configuration
   QUAN TRỌNG: File này KHÔNG được commit lên Git
   Thêm vào .gitignore: js/config.js
   ========================================== */

const Config = {
    // OpenAI API Configuration
    OPENAI_API_KEY: 'YOUR_API_KEY_HERE', // ⚠️ Thay bằng key mới sau khi xóa key cũ
    
    // API Endpoints
    OPENAI_ENDPOINT: 'https://api.openai.com/v1/chat/completions',
    
    // Model Configuration
    AI_MODEL: 'gpt-4', // Hoặc 'gpt-4' nếu muốn chất lượng cao hơn
    
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
    console.warn('⚠️ API Key chưa được cấu hình! Vui lòng thêm key vào js/config.js');
}
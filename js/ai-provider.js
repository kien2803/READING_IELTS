/* ==========================================
   AI Provider Module
   Support multiple AI providers for test generation
   ========================================== */

const AIProvider = {
    // Supported providers configuration
    providers: {
        openai: {
            name: 'OpenAI (ChatGPT)',
            icon: '🟢',
            models: [
                { id: 'gpt-4o', name: 'GPT-4o (Recommended)', maxTokens: 4096 },
                { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Cheap)', maxTokens: 4096 },
                { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 4096 },
                { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo (Legacy)', maxTokens: 4096 }
            ],
            endpoint: 'https://api.openai.com/v1/chat/completions',
            keyPrefix: 'sk-',
            docsUrl: 'https://platform.openai.com/api-keys'
        },
        google: {
            name: 'Google Gemini',
            icon: '🔵',
            models: [
                { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Best)', maxTokens: 8192 },
                { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast)', maxTokens: 8192 },
                { id: 'gemini-pro', name: 'Gemini Pro', maxTokens: 4096 }
            ],
            endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
            keyPrefix: 'AI',
            docsUrl: 'https://aistudio.google.com/app/apikey'
        },
        anthropic: {
            name: 'Anthropic Claude',
            icon: '🟠',
            models: [
                { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Best)', maxTokens: 4096 },
                { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku (Fast)', maxTokens: 4096 },
                { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (Premium)', maxTokens: 4096 }
            ],
            endpoint: 'https://api.anthropic.com/v1/messages',
            keyPrefix: 'sk-ant-',
            docsUrl: 'https://console.anthropic.com/settings/keys'
        },
        groq: {
            name: 'Groq (Free & Fast)',
            icon: '⚡',
            models: [
                { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Best)', maxTokens: 4096 },
                { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Fastest)', maxTokens: 4096 },
                { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', maxTokens: 4096 },
                { id: 'gemma2-9b-it', name: 'Gemma 2 9B', maxTokens: 4096 }
            ],
            endpoint: 'https://api.groq.com/openai/v1/chat/completions',
            keyPrefix: 'gsk_',
            docsUrl: 'https://console.groq.com/keys'
        },
        openrouter: {
            name: 'OpenRouter (Multi-Model)',
            icon: '🌐',
            models: [
                { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', maxTokens: 4096 },
                { id: 'openai/gpt-4o', name: 'GPT-4o', maxTokens: 4096 },
                { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro', maxTokens: 4096 },
                { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', maxTokens: 4096 },
                { id: 'mistralai/mixtral-8x22b-instruct', name: 'Mixtral 8x22B', maxTokens: 4096 }
            ],
            endpoint: 'https://openrouter.ai/api/v1/chat/completions',
            keyPrefix: 'sk-or-',
            docsUrl: 'https://openrouter.ai/keys'
        },
        custom: {
            name: 'Custom API',
            icon: '🔧',
            models: [
                { id: 'custom', name: 'Custom Model', maxTokens: 4096 }
            ],
            endpoint: '',
            keyPrefix: '',
            docsUrl: ''
        }
    },

    // Current settings
    currentProvider: 'openai',
    currentModel: 'gpt-4o-mini',

    /**
     * Initialize provider settings from storage
     */
    init() {
        const saved = Storage.get('ai_provider_settings');
        if (saved) {
            this.currentProvider = saved.provider || 'openai';
            this.currentModel = saved.model || 'gpt-4o-mini';
        }
        this.updateProviderUI();
    },

    /**
     * Get current provider config
     */
    getProvider() {
        return this.providers[this.currentProvider];
    },

    /**
     * Get API key for current provider
     */
    getApiKey() {
        const key = Storage.get(`ai_key_${this.currentProvider}`);
        if (key) return key;
        
        // Fallback to legacy OpenAI key
        if (this.currentProvider === 'openai') {
            return Storage.get('openai_api_key') || (window.CONFIG && CONFIG.OPENAI_API_KEY);
        }
        return null;
    },

    /**
     * Set API key for a provider
     */
    setApiKey(provider, key) {
        Storage.set(`ai_key_${provider}`, key);
    },

    /**
     * Set current provider and model
     */
    setProvider(provider, model) {
        this.currentProvider = provider;
        this.currentModel = model || this.providers[provider].models[0].id;
        
        Storage.set('ai_provider_settings', {
            provider: this.currentProvider,
            model: this.currentModel
        });

        this.updateProviderUI();
        Utils.showNotification(`✅ Đã chọn ${this.providers[provider].name}`, 'success');
    },

    /**
     * Update UI to reflect current provider
     */
    updateProviderUI() {
        // Update provider selector
        const providerSelect = document.getElementById('aiProviderSelect');
        if (providerSelect) {
            providerSelect.value = this.currentProvider;
        }

        // Update model selector
        this.updateModelOptions();

        // Update API key input
        const keyInput = document.getElementById('aiApiKeyInput');
        if (keyInput) {
            const key = this.getApiKey();
            keyInput.value = key ? '••••••••' + key.slice(-4) : '';
            keyInput.placeholder = `${this.getProvider().keyPrefix}...`;
        }

        // Update status indicator
        this.updateConnectionStatus();
    },

    /**
     * Update model dropdown based on selected provider
     */
    updateModelOptions() {
        const modelSelect = document.getElementById('aiModelSelect');
        if (!modelSelect) return;

        const provider = this.getProvider();
        modelSelect.innerHTML = provider.models.map(m => 
            `<option value="${m.id}" ${m.id === this.currentModel ? 'selected' : ''}>${m.name}</option>`
        ).join('');
    },

    /**
     * Update connection status indicator
     */
    updateConnectionStatus() {
        const statusEl = document.getElementById('aiConnectionStatus');
        if (!statusEl) return;

        const apiKey = this.getApiKey();
        const provider = this.getProvider();

        if (apiKey) {
            statusEl.innerHTML = `<span class="status-dot connected"></span> ${provider.icon} ${provider.name} đã kết nối`;
            statusEl.className = 'connection-status connected';
        } else {
            statusEl.innerHTML = `<span class="status-dot"></span> Chưa cấu hình API key`;
            statusEl.className = 'connection-status disconnected';
        }
    },

    /**
     * Make API call to current provider
     */
    async callAPI(messages, options = {}) {
        const provider = this.currentProvider;
        const apiKey = this.getApiKey();

        if (!apiKey) {
            throw new Error(`Vui lòng cấu hình API key cho ${this.getProvider().name}`);
        }

        switch (provider) {
            case 'openai':
            case 'groq':
            case 'openrouter':
                return await this.callOpenAICompatible(messages, options, apiKey);
            case 'google':
                return await this.callGoogleGemini(messages, options, apiKey);
            case 'anthropic':
                return await this.callAnthropic(messages, options, apiKey);
            case 'custom':
                return await this.callCustomAPI(messages, options, apiKey);
            default:
                throw new Error('Unsupported provider');
        }
    },

    /**
     * Call OpenAI-compatible APIs (OpenAI, Groq, OpenRouter)
     */
    async callOpenAICompatible(messages, options, apiKey) {
        const provider = this.getProvider();
        let endpoint = provider.endpoint;
        
        // Get custom endpoint if set
        if (this.currentProvider === 'custom') {
            endpoint = Storage.get('ai_custom_endpoint') || endpoint;
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        };

        // OpenRouter requires additional headers
        if (this.currentProvider === 'openrouter') {
            headers['HTTP-Referer'] = window.location.origin;
            headers['X-Title'] = 'IELTS Reading Practice';
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                model: this.currentModel,
                messages: messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 3000
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content;
    },

    /**
     * Call Google Gemini API
     */
    async callGoogleGemini(messages, options, apiKey) {
        const endpoint = this.getProvider().endpoint.replace('{model}', this.currentModel);
        
        // Convert messages to Gemini format
        const contents = messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

        // For system message, prepend to first user message
        if (messages[0]?.role === 'system' && messages.length > 1) {
            contents[1].parts[0].text = messages[0].content + '\n\n' + contents[1].parts[0].text;
            contents.shift();
        }

        const response = await fetch(`${endpoint}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: options.temperature || 0.7,
                    maxOutputTokens: options.maxTokens || 3000
                }
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `Gemini Error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text;
    },

    /**
     * Call Anthropic Claude API
     */
    async callAnthropic(messages, options, apiKey) {
        const endpoint = this.getProvider().endpoint;
        
        // Extract system message
        let systemMessage = '';
        const chatMessages = [];
        
        messages.forEach(m => {
            if (m.role === 'system') {
                systemMessage = m.content;
            } else {
                chatMessages.push({
                    role: m.role,
                    content: m.content
                });
            }
        });

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.currentModel,
                max_tokens: options.maxTokens || 3000,
                system: systemMessage,
                messages: chatMessages
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `Claude Error: ${response.status}`);
        }

        const data = await response.json();
        return data.content?.[0]?.text;
    },

    /**
     * Call custom API endpoint
     */
    async callCustomAPI(messages, options, apiKey) {
        const endpoint = Storage.get('ai_custom_endpoint');
        if (!endpoint) {
            throw new Error('Vui lòng cấu hình Custom API Endpoint');
        }

        // Try OpenAI-compatible format
        return await this.callOpenAICompatible(messages, options, apiKey);
    },

    /**
     * Test API connection
     */
    async testConnection() {
        try {
            const response = await this.callAPI([
                { role: 'user', content: 'Say "OK" to confirm connection.' }
            ], { maxTokens: 10 });
            
            return { success: true, message: response };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    /**
     * Get provider list for UI
     */
    getProviderList() {
        return Object.entries(this.providers).map(([id, provider]) => ({
            id,
            name: provider.name,
            icon: provider.icon,
            docsUrl: provider.docsUrl
        }));
    },

    /**
     * Render provider settings UI
     */
    renderSettings() {
        return `
            <div class="ai-provider-settings">
                <div class="setting-item">
                    <label>🤖 AI Provider</label>
                    <select id="aiProviderSelect" class="select" onchange="AIProvider.onProviderChange(this.value)">
                        ${this.getProviderList().map(p => 
                            `<option value="${p.id}" ${p.id === this.currentProvider ? 'selected' : ''}>
                                ${p.icon} ${p.name}
                            </option>`
                        ).join('')}
                    </select>
                </div>
                
                <div class="setting-item">
                    <label>📦 Model</label>
                    <select id="aiModelSelect" class="select" onchange="AIProvider.onModelChange(this.value)">
                        ${this.getProvider().models.map(m => 
                            `<option value="${m.id}" ${m.id === this.currentModel ? 'selected' : ''}>${m.name}</option>`
                        ).join('')}
                    </select>
                </div>

                <div class="setting-item">
                    <label>🔑 API Key</label>
                    <div class="api-key-input-wrapper">
                        <input type="password" id="aiApiKeyInput" class="input" 
                            placeholder="${this.getProvider().keyPrefix}..."
                            onchange="AIProvider.onApiKeyChange(this.value)">
                        <button type="button" class="btn btn-sm btn-ghost toggle-visibility" onclick="AIProvider.toggleKeyVisibility()">
                            👁️
                        </button>
                    </div>
                    <small>
                        <a href="${this.getProvider().docsUrl}" target="_blank" rel="noopener">
                            📄 Lấy API key tại đây
                        </a>
                    </small>
                </div>

                <div id="aiConnectionStatus" class="connection-status">
                    <span class="status-dot"></span> Đang kiểm tra...
                </div>

                <div class="setting-actions">
                    <button class="btn btn-primary btn-sm" onclick="AIProvider.testAndSave()">
                        🔌 Test kết nối
                    </button>
                </div>

                ${this.currentProvider === 'custom' ? `
                    <div class="setting-item">
                        <label>🔗 Custom Endpoint</label>
                        <input type="text" id="aiCustomEndpoint" class="input" 
                            placeholder="https://your-api.com/v1/chat/completions"
                            value="${Storage.get('ai_custom_endpoint') || ''}"
                            onchange="Storage.set('ai_custom_endpoint', this.value)">
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * Event handlers
     */
    onProviderChange(provider) {
        this.currentProvider = provider;
        this.currentModel = this.providers[provider].models[0].id;
        
        // Save settings
        Storage.set('ai_provider_settings', {
            provider: this.currentProvider,
            model: this.currentModel
        });
        
        this.updateProviderUI();
        this.updateDocsLink();
        
        // Re-render settings if custom provider
        const customSection = document.getElementById('customEndpointSection');
        if (customSection) {
            customSection.style.display = provider === 'custom' ? 'block' : 'none';
        }
    },

    onModelChange(model) {
        this.currentModel = model;
        Storage.set('ai_provider_settings', {
            provider: this.currentProvider,
            model: this.currentModel
        });
    },

    onApiKeyChange(key) {
        if (key && !key.startsWith('••••')) {
            this.setApiKey(this.currentProvider, key);
            this.updateConnectionStatus();
        }
    },

    toggleKeyVisibility() {
        const input = document.getElementById('aiApiKeyInput');
        if (input) {
            input.type = input.type === 'password' ? 'text' : 'password';
        }
    },

    async testAndSave() {
        const statusEl = document.getElementById('aiConnectionStatus');
        if (statusEl) {
            statusEl.innerHTML = '<span class="status-dot testing"></span> Đang kiểm tra...';
            statusEl.className = 'connection-status testing';
        }

        const result = await this.testConnection();
        
        if (result.success) {
            Utils.showNotification('✅ Kết nối thành công!', 'success');
            this.updateConnectionStatus();
        } else {
            Utils.showNotification(`❌ Lỗi kết nối: ${result.message}`, 'error');
            if (statusEl) {
                statusEl.innerHTML = `<span class="status-dot error"></span> Lỗi: ${result.message}`;
                statusEl.className = 'connection-status error';
            }
        }
    },

    /**
     * Clear all AI settings
     */
    clearSettings() {
        if (!confirm('Bạn có chắc muốn xóa tất cả cấu hình AI?')) return;

        // Clear all provider keys
        Object.keys(this.providers).forEach(provider => {
            Storage.remove(`ai_key_${provider}`);
        });

        // Clear settings
        Storage.remove('ai_provider_settings');
        Storage.remove('ai_custom_endpoint');
        Storage.remove('openai_api_key'); // Legacy key

        // Reset to defaults
        this.currentProvider = 'openai';
        this.currentModel = 'gpt-4o-mini';

        // Update UI
        this.updateProviderUI();
        
        const keyInput = document.getElementById('aiApiKeyInput');
        if (keyInput) keyInput.value = '';

        Utils.showNotification('🗑️ Đã xóa tất cả cấu hình AI', 'success');
    },

    /**
     * Update docs link when provider changes
     */
    updateDocsLink() {
        const docsLink = document.getElementById('aiKeyDocsLink');
        if (docsLink) {
            const provider = this.getProvider();
            docsLink.innerHTML = `<a href="${provider.docsUrl}" target="_blank" rel="noopener">📄 Lấy API key tại đây</a>`;
        }
        
        // Show/hide custom endpoint section
        const customSection = document.getElementById('customEndpointSection');
        if (customSection) {
            customSection.style.display = this.currentProvider === 'custom' ? 'block' : 'none';
        }
    }
};

// Make AIProvider available globally
window.AIProvider = AIProvider;

/* ==========================================
   AI Generator Module - Professional Edition
   Generate IELTS Reading tests with AI
   ========================================== */

const AIGenerator = {
    providers: {
        'openai': {
            name: 'OpenAI GPT-4',
            models: ['gpt-4', 'gpt-3.5-turbo'],
            endpoint: 'https://api.openai.com/v1/chat/completions'
        },
        'gemini': {
            name: 'Google Gemini',
            models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
            endpoint: 'https://generativelanguage.googleapis.com/v1beta/models'
        },
        'claude': {
            name: 'Anthropic Claude',
            models: ['claude-3-opus', 'claude-3-sonnet'],
            endpoint: 'https://api.anthropic.com/v1/messages'
        }
    },

    currentProvider: 'gemini',
    currentModel: 'gemini-1.5-pro',
    isGenerating: false,

    /**
     * Initialize AI Generator
     */
    init() {
        this.loadSettings();
        this.renderUI();
    },

    /**
     * Load saved settings
     */
    loadSettings() {
        const settings = Storage.get('ai_generator_settings') || {};
        this.currentProvider = settings.provider || 'gemini';
        this.currentModel = settings.model || 'gemini-1.5-pro';
    },

    /**
     * Save settings
     */
    saveSettings() {
        Storage.set('ai_generator_settings', {
            provider: this.currentProvider,
            model: this.currentModel
        });
    },

    /**
     * Render professional UI
     */
    renderUI() {
        const container = document.getElementById('aiGenerator');
        if (!container) return;

        container.innerHTML = `
            <div class="ai-generator-modern">
                <!-- Header Section -->
                <div class="ai-gen-header">
                    <div class="header-content">
                        <div class="header-icon">🤖</div>
                        <div class="header-text">
                            <h2>AI-Powered IELTS Test Generator</h2>
                            <p class="header-subtitle">Generate professional IELTS Reading tests tailored to your needs</p>
                        </div>
                    </div>
                    <div class="header-badge">
                        <span class="premium-badge">✨ Pro Feature</span>
                    </div>
                </div>

                <!-- Configuration Section -->
                <div class="ai-gen-config">
                    <div class="config-card">
                        <h3 class="config-title">⚙️ AI Configuration</h3>
                        
                        <!-- Provider Selection -->
                        <div class="config-group">
                            <label class="config-label">
                                <span class="label-text">AI Provider</span>
                                <span class="label-hint">Choose your preferred AI model</span>
                            </label>
                            <div class="provider-grid">
                                ${Object.keys(this.providers).map(key => this.renderProviderCard(key)).join('')}
                            </div>
                        </div>

                        <!-- Model Selection -->
                        <div class="config-group">
                            <label class="config-label">
                                <span class="label-text">Model</span>
                                <span class="label-hint">Select model variant</span>
                            </label>
                            <select class="modern-select" id="modelSelect" onchange="AIGenerator.selectModel(this.value)">
                                ${this.providers[this.currentProvider].models.map(model => `
                                    <option value="${model}" ${model === this.currentModel ? 'selected' : ''}>
                                        ${model} ${model.includes('pro') || model.includes('opus') || model.includes('gpt-4') ? '(Recommended)' : ''}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <!-- API Key -->
                        <div class="config-group">
                            <label class="config-label">
                                <span class="label-text">API Key</span>
                                <span class="label-hint">Your ${this.providers[this.currentProvider].name} API key</span>
                            </label>
                            <div class="input-with-icon">
                                <input 
                                    type="password" 
                                    class="modern-input" 
                                    id="apiKeyInput"
                                    placeholder="sk-..." 
                                    value="${this.getApiKey()}"
                                    onchange="AIGenerator.saveApiKey(this.value)"
                                >
                                <button class="input-icon-btn" onclick="AIGenerator.toggleApiKeyVisibility()">
                                    👁️
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Generation Section -->
                <div class="ai-gen-generation">
                    <div class="generation-card">
                        <h3 class="config-title">📝 Test Parameters</h3>
                        
                        <!-- Topic -->
                        <div class="param-group">
                            <label class="param-label">
                                <span>Topic / Theme</span>
                            </label>
                            <input 
                                type="text" 
                                class="modern-input" 
                                id="topicInput"
                                placeholder="e.g., Climate Change, Technology, Education..."
                            >
                        </div>

                        <!-- Difficulty -->
                        <div class="param-group">
                            <label class="param-label">
                                <span>Target Band Score</span>
                            </label>
                            <div class="band-selector-modern">
                                ${[4.0, 5.0, 6.0, 7.0, 8.0, 9.0].map(band => `
                                    <button 
                                        class="band-btn" 
                                        data-band="${band}"
                                        onclick="AIGenerator.selectBand(${band})"
                                    >
                                        ${band.toFixed(1)}
                                    </button>
                                `).join('')}
                            </div>
                            <div class="band-description" id="bandDescription">
                                Select target difficulty level
                            </div>
                        </div>

                        <!-- Question Types -->
                        <div class="param-group">
                            <label class="param-label">
                                <span>Question Types</span>
                            </label>
                            <div class="checkbox-grid">
                                <label class="checkbox-modern">
                                    <input type="checkbox" value="tfng" checked>
                                    <span>True/False/Not Given</span>
                                </label>
                                <label class="checkbox-modern">
                                    <input type="checkbox" value="multiple-choice" checked>
                                    <span>Multiple Choice</span>
                                </label>
                                <label class="checkbox-modern">
                                    <input type="checkbox" value="summary">
                                    <span>Summary Completion</span>
                                </label>
                                <label class="checkbox-modern">
                                    <input type="checkbox" value="matching">
                                    <span>Matching Headings</span>
                                </label>
                            </div>
                        </div>

                        <!-- Length -->
                        <div class="param-group">
                            <label class="param-label">
                                <span>Passage Length: <strong id="lengthValue">600</strong> words</span>
                            </label>
                            <input 
                                type="range" 
                                class="modern-slider" 
                                min="400" 
                                max="1000" 
                                step="50"
                                value="600"
                                oninput="AIGenerator.updateLength(this.value)"
                            >
                            <div class="slider-labels">
                                <span>Short (400)</span>
                                <span>Long (1000)</span>
                            </div>
                        </div>

                        <!-- Number of Questions -->
                        <div class="param-group">
                            <label class="param-label">
                                <span>Number of Questions: <strong id="questionCount">13</strong></span>
                            </label>
                            <input 
                                type="range" 
                                class="modern-slider" 
                                min="8" 
                                max="20" 
                                step="1"
                                value="13"
                                oninput="AIGenerator.updateQuestionCount(this.value)"
                            >
                            <div class="slider-labels">
                                <span>Mini (8)</span>
                                <span>Full (20)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Generate Button -->
                <div class="ai-gen-actions">
                    <button class="generate-btn" onclick="AIGenerator.generate()" id="generateBtn">
                        <span class="btn-icon">✨</span>
                        <span class="btn-text">Generate IELTS Test</span>
                        <span class="btn-loader" style="display: none;">
                            <span class="spinner"></span>
                        </span>
                    </button>
                    <p class="action-hint">
                        AI will create a complete IELTS Reading test with passage, questions, and explanations
                    </p>
                </div>

                <!-- Result Section -->
                <div class="ai-gen-result" id="aiGenResult" style="display: none;">
                    <div class="result-card">
                        <div class="result-header">
                            <h3>✅ Test Generated Successfully</h3>
                            <button class="close-btn" onclick="AIGenerator.closeResult()">✕</button>
                        </div>
                        <div class="result-content" id="resultContent"></div>
                        <div class="result-actions">
                            <button class="btn btn-primary" onclick="AIGenerator.saveTest()">
                                💾 Save to Library
                            </button>
                            <button class="btn btn-success" onclick="AIGenerator.startTest()">
                                🚀 Practice Now
                            </button>
                            <button class="btn btn-ghost" onclick="AIGenerator.copyTest()">
                                📋 Copy JSON
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render provider card
     */
    renderProviderCard(providerKey) {
        const provider = this.providers[providerKey];
        const isActive = providerKey === this.currentProvider;

        return `
            <div class="provider-card ${isActive ? 'active' : ''}" onclick="AIGenerator.selectProvider('${providerKey}')">
                <div class="provider-icon">${this.getProviderIcon(providerKey)}</div>
                <div class="provider-name">${provider.name}</div>
                <div class="provider-check">${isActive ? '✓' : ''}</div>
            </div>
        `;
    },

    /**
     * Get provider icon
     */
    getProviderIcon(provider) {
        const icons = {
            'openai': '🟢',
            'gemini': '💎',
            'claude': '🟣'
        };
        return icons[provider] || '🤖';
    },

    /**
     * Select provider
     */
    selectProvider(provider) {
        this.currentProvider = provider;
        this.currentModel = this.providers[provider].models[0];
        this.saveSettings();
        this.renderUI();
    },

    /**
     * Select model
     */
    selectModel(model) {
        this.currentModel = model;
        this.saveSettings();
    },

    /**
     * Get API key
     */
    getApiKey() {
        return Storage.get(`ai_key_${this.currentProvider}`) || '';
    },

    /**
     * Save API key
     */
    saveApiKey(key) {
        Storage.set(`ai_key_${this.currentProvider}`, key);
        Utils.showNotification('API key saved', 'success');
    },

    /**
     * Toggle API key visibility
     */
    toggleApiKeyVisibility() {
        const input = document.getElementById('apiKeyInput');
        input.type = input.type === 'password' ? 'text' : 'password';
    },

    /**
     * Select band
     */
    selectBand(band) {
        document.querySelectorAll('.band-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        const descriptions = {
            4.0: 'Basic - Simple passages with straightforward questions',
            5.0: 'Elementary - Moderate complexity with clear language',
            6.0: 'Intermediate - Standard IELTS difficulty',
            7.0: 'Advanced - Complex vocabulary and ideas',
            8.0: 'Expert - Sophisticated language and nuanced concepts',
            9.0: 'Master - Maximum difficulty with academic language'
        };
        
        document.getElementById('bandDescription').textContent = descriptions[band];
    },

    /**
     * Update length display
     */
    updateLength(value) {
        document.getElementById('lengthValue').textContent = value;
    },

    /**
     * Update question count display
     */
    updateQuestionCount(value) {
        document.getElementById('questionCount').textContent = value;
    },

    /**
     * Generate test
     */
    async generate() {
        if (this.isGenerating) return;

        // Validate
        const topic = document.getElementById('topicInput').value.trim();
        if (!topic) {
            Utils.showNotification('Please enter a topic', 'warning');
            return;
        }

        const apiKey = this.getApiKey();
        if (!apiKey) {
            Utils.showNotification('Please enter your API key', 'warning');
            return;
        }

        this.isGenerating = true;
        const btn = document.getElementById('generateBtn');
        btn.querySelector('.btn-text').style.display = 'none';
        btn.querySelector('.btn-loader').style.display = 'inline-block';
        btn.disabled = true;

        try {
            // Get parameters
            const band = document.querySelector('.band-btn.active')?.dataset.band || '6.0';
            const length = document.getElementById('lengthValue').textContent;
            const questionCount = document.getElementById('questionCount').textContent;
            
            const selectedTypes = Array.from(document.querySelectorAll('.checkbox-modern input:checked'))
                .map(cb => cb.value);

            // Generate via AI Provider
            const result = await this.callAI({
                topic,
                band: parseFloat(band),
                length: parseInt(length),
                questionCount: parseInt(questionCount),
                questionTypes: selectedTypes
            });

            this.showResult(result);
            Utils.showNotification('Test generated successfully!', 'success');

        } catch (error) {
            Utils.showNotification('Generation failed: ' + error.message, 'error');
            console.error(error);
        } finally {
            this.isGenerating = false;
            btn.querySelector('.btn-text').style.display = 'inline';
            btn.querySelector('.btn-loader').style.display = 'none';
            btn.disabled = false;
        }
    },

    /**
     * Call AI API
     */
    async callAI(params) {
        const prompt = this.buildPrompt(params);
        
        // Placeholder - implement actual API calls
        // For now, return mock data
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return this.generateMockTest(params);
    },

    /**
     * Build AI prompt
     */
    buildPrompt(params) {
        return `Generate an IELTS Reading passage about "${params.topic}" with the following specifications:

- Difficulty: Band ${params.band}
- Passage length: approximately ${params.length} words
- Number of questions: ${params.questionCount}
- Question types: ${params.questionTypes.join(', ')}

Requirements:
1. Create an academic passage suitable for IELTS Reading
2. Use appropriate vocabulary for Band ${params.band} level
3. Generate ${params.questionCount} questions evenly distributed across the specified types
4. Provide correct answers and brief explanations
5. Format as JSON with structure: {title, text, questions: [{id, type, text, options, answer, explanation}]}

Make it challenging but fair for the target band level.`;
    },

    /**
     * Generate mock test (temporary)
     */
    generateMockTest(params) {
        return {
            id: Utils.generateId(),
            title: `${params.topic} - Band ${params.band}`,
            passages: [{
                title: params.topic,
                text: `[AI Generated passage about ${params.topic} - ${params.length} words]`,
                questions: Array.from({length: params.questionCount}, (_, i) => ({
                    id: `q${i+1}`,
                    type: params.questionTypes[i % params.questionTypes.length],
                    text: `Question ${i+1} about ${params.topic}`,
                    answer: 'True',
                    explanation: 'AI generated explanation'
                }))
            }]
        };
    },

    /**
     * Show result
     */
    showResult(test) {
        const resultDiv = document.getElementById('aiGenResult');
        const contentDiv = document.getElementById('resultContent');
        
        contentDiv.innerHTML = `
            <div class="test-preview">
                <h4>${test.title}</h4>
                <p class="preview-meta">
                    📝 ${test.passages[0].questions.length} questions | 
                    📖 ~${test.passages[0].text.split(' ').length} words
                </p>
                <div class="preview-passage">
                    ${test.passages[0].text.substring(0, 200)}...
                </div>
            </div>
        `;
        
        resultDiv.style.display = 'block';
        this.generatedTest = test;
    },

    /**
     * Close result
     */
    closeResult() {
        document.getElementById('aiGenResult').style.display = 'none';
    },

    /**
     * Save test
     */
    saveTest() {
        // Implementation to save to library
        Utils.showNotification('Test saved to library!', 'success');
    },

    /**
     * Start test
     */
    startTest() {
        // Implementation to start practice
        App.switchTab('practice');
    },

    /**
     * Copy test JSON
     */
    copyTest() {
        navigator.clipboard.writeText(JSON.stringify(this.generatedTest, null, 2));
        Utils.showNotification('JSON copied to clipboard!', 'success');
    }
};

// Make available globally
window.AIGenerator = AIGenerator;

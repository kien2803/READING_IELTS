/* ==========================================
   AI Test Generator Module
   Generate IELTS Reading tests from prompts or text
   ========================================== */

const AITestGenerator = {
    isGenerating: false,

    /**
     * Initialize the module
     */
    init() {
        this.bindEvents();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Generate from prompt button
        const generateFromPromptBtn = document.getElementById('generateFromPromptBtn');
        if (generateFromPromptBtn) {
            generateFromPromptBtn.addEventListener('click', () => this.generateFromPrompt());
        }

        // Generate from text button
        const generateFromTextBtn = document.getElementById('generateFromTextBtn');
        if (generateFromTextBtn) {
            generateFromTextBtn.addEventListener('click', () => this.generateFromText());
        }

        // Passage text word/char counter
        const aiPassageText = document.getElementById('aiPassageText');
        if (aiPassageText) {
            aiPassageText.addEventListener('input', () => this.updateTextStats());
        }
    },

    /**
     * Update word/character stats for passage textarea
     */
    updateTextStats() {
        const textarea = document.getElementById('aiPassageText');
        const text = textarea?.value || '';
        
        const charCount = text.length;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        
        const charElement = document.getElementById('aiPassageCharCount');
        const wordElement = document.getElementById('aiPassageWordCount');
        
        if (charElement) charElement.textContent = `${charCount} ký tự`;
        if (wordElement) wordElement.textContent = `${wordCount} từ`;
    },

    /**
     * Get API key from AIProvider or legacy storage
     */
    getApiKey() {
        // Use AIProvider if available
        if (typeof AIProvider !== 'undefined') {
            return AIProvider.getApiKey();
        }
        // Fallback to legacy
        return Storage.get('openai_api_key') || (window.CONFIG && CONFIG.OPENAI_API_KEY);
    },

    /**
     * Generate test from a topic prompt
     */
    async generateFromPrompt() {
        const promptInput = document.getElementById('aiTopicPrompt');
        const topic = promptInput?.value?.trim();

        if (!topic) {
            Utils.showNotification('⚠️ Vui lòng nhập chủ đề cho đề thi', 'warning');
            return;
        }

        const bandLevel = document.getElementById('aiBandLevel')?.value || '7.0';
        const questionCount = parseInt(document.getElementById('aiQuestionCount')?.value) || 10;

        await this.generateTest({
            mode: 'topic',
            topic: topic,
            bandLevel: bandLevel,
            questionCount: questionCount
        });
    },

    /**
     * Generate questions from provided text
     */
    async generateFromText() {
        const textInput = document.getElementById('aiPassageText');
        const passageText = textInput?.value?.trim();

        if (!passageText || passageText.length < 100) {
            Utils.showNotification('⚠️ Đoạn văn cần ít nhất 100 ký tự', 'warning');
            return;
        }

        const bandLevel = document.getElementById('aiBandLevel')?.value || '7.0';
        const questionTypes = this.getSelectedQuestionTypes();

        await this.generateTest({
            mode: 'text',
            passageText: passageText,
            bandLevel: bandLevel,
            questionTypes: questionTypes
        });
    },

    /**
     * Get selected question types
     */
    getSelectedQuestionTypes() {
        const checkboxes = document.querySelectorAll('input[name="aiQuestionType"]:checked');
        if (checkboxes.length === 0) {
            return ['tfng', 'multiple-choice', 'summary'];
        }
        return Array.from(checkboxes).map(cb => cb.value);
    },

    /**
     * Main generate function
     */
    async generateTest(options) {
        if (this.isGenerating) {
            Utils.showNotification('⏳ Đang tạo đề, vui lòng đợi...', 'info');
            return;
        }

        this.isGenerating = true;
        this.showLoadingState();

        try {
            const apiKey = this.getApiKey();
            let testData;

            if (apiKey && apiKey !== 'your-api-key-here') {
                // Use AI Provider (supports multiple providers)
                testData = await this.callAI(options);
            } else {
                // Use local generation (fallback/demo)
                testData = this.generateLocalTest(options);
                Utils.showNotification('💡 Để có đề thi chất lượng hơn, hãy cấu hình API key trong Settings', 'info');
            }

            // Validate and save test
            if (this.validateTestData(testData)) {
                this.saveGeneratedTest(testData);
                this.showSuccessState(testData);
                Utils.showNotification(`✅ Đã tạo đề thi "${testData.title}" thành công!`, 'success');
            } else {
                throw new Error('Invalid test data generated');
            }

        } catch (error) {
            console.error('AI Generation error:', error);
            this.showErrorState(error.message);
            Utils.showNotification('❌ Lỗi khi tạo đề: ' + error.message, 'error');
        }

        this.isGenerating = false;
    },

    /**
     * Call AI using AIProvider (multi-provider support)
     */
    async callAI(options) {
        const prompt = this.buildPrompt(options);
        
        const systemMessage = `You are an expert IELTS Reading test creator. Generate authentic IELTS-style reading tests with accurate questions and answers.
                        
IMPORTANT: You must respond with ONLY valid JSON, no markdown, no explanation. Follow the exact structure provided.`;

        const messages = [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
        ];

        let content;
        
        // Use AIProvider if available
        if (typeof AIProvider !== 'undefined') {
            content = await AIProvider.callAPI(messages, { maxTokens: 3000 });
        } else {
            // Fallback to legacy OpenAI call
            content = await this.callOpenAILegacy(messages);
        }

        if (!content) {
            throw new Error('Empty response from AI');
        }

        // Parse JSON response
        return this.parseAIResponse(content);
    },

    /**
     * Parse AI response to extract JSON
     */
    parseAIResponse(content) {
        try {
            // Clean up the response - remove markdown code blocks if present
            let jsonStr = content.trim();
            if (jsonStr.startsWith('```json')) {
                jsonStr = jsonStr.slice(7);
            }
            if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.slice(3);
            }
            if (jsonStr.endsWith('```')) {
                jsonStr = jsonStr.slice(0, -3);
            }
            
            return JSON.parse(jsonStr.trim());
        } catch (e) {
            console.error('Failed to parse AI response:', content);
            throw new Error('Invalid JSON response from AI');
        }
    },

    /**
     * Legacy OpenAI call (fallback)
     */
    async callOpenAILegacy(messages) {
        const apiKey = Storage.get('openai_api_key') || (window.CONFIG && CONFIG.OPENAI_API_KEY);
        const endpoint = (window.CONFIG && CONFIG.OPENAI_ENDPOINT) || 'https://api.openai.com/v1/chat/completions';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: messages,
                temperature: 0.7,
                max_tokens: 3000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || 'API request failed');
        }

        const data = await response.json();
        return data.choices[0]?.message?.content;
    },

    /**
     * Call OpenAI API to generate test
     */
    async callOpenAI(options, apiKey) {
        const prompt = this.buildPrompt(options);
        const endpoint = (window.CONFIG && CONFIG.OPENAI_ENDPOINT) || 'https://api.openai.com/v1/chat/completions';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert IELTS Reading test creator. Generate authentic IELTS-style reading tests with accurate questions and answers.
                        
IMPORTANT: You must respond with ONLY valid JSON, no markdown, no explanation. Follow the exact structure provided.`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 3000
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || 'API request failed');
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            throw new Error('Empty response from API');
        }

        // Parse JSON response
        try {
            // Clean up the response - remove markdown code blocks if present
            let jsonStr = content.trim();
            if (jsonStr.startsWith('```json')) {
                jsonStr = jsonStr.slice(7);
            }
            if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.slice(3);
            }
            if (jsonStr.endsWith('```')) {
                jsonStr = jsonStr.slice(0, -3);
            }
            
            return JSON.parse(jsonStr.trim());
        } catch (e) {
            console.error('Failed to parse AI response:', content);
            throw new Error('Invalid JSON response from AI');
        }
    },

    /**
     * Build prompt for AI
     */
    buildPrompt(options) {
        const questionTypeDescriptions = {
            'tfng': 'True/False/Not Given - Xác định thông tin đúng/sai/không có',
            'ynng': 'Yes/No/Not Given - Xác định ý kiến tác giả',
            'multiple-choice': 'Multiple Choice - Câu hỏi trắc nghiệm 4 đáp án',
            'summary': 'Summary Completion - Điền từ vào tóm tắt',
            'sentence': 'Sentence Completion - Hoàn thành câu',
            'matching-headings': 'Matching Headings - Ghép tiêu đề với đoạn văn'
        };

        if (options.mode === 'topic') {
            return `Tạo một đề thi IELTS Reading hoàn chỉnh về chủ đề: "${options.topic}"

Yêu cầu:
- Band level: ${options.bandLevel}
- Số câu hỏi: ${options.questionCount}
- Đoạn văn phải dài ít nhất 400 từ, academic style
- Câu hỏi đa dạng các dạng: True/False/Not Given, Multiple Choice, Summary Completion
- Mỗi câu hỏi phải có đáp án và giải thích chi tiết

Trả về JSON với cấu trúc sau:
{
  "title": "Tên đề thi",
  "level": "${options.bandLevel}",
  "source": "ai-generated",
  "passages": [
    {
      "id": "p1",
      "title": "Tiêu đề đoạn văn",
      "text": "Nội dung đoạn văn đầy đủ...",
      "questions": [
        {
          "id": "q1",
          "type": "tfng",
          "text": "Nội dung câu hỏi",
          "answer": "True/False/Not Given",
          "explanation": "Giải thích tại sao đáp án này đúng"
        },
        {
          "id": "q2", 
          "type": "multiple-choice",
          "text": "Nội dung câu hỏi",
          "options": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
          "answer": "A. Option 1",
          "explanation": "Giải thích"
        },
        {
          "id": "q3",
          "type": "summary",
          "text": "Câu cần điền từ ______ vào chỗ trống",
          "answer": "từ cần điền",
          "wordLimit": 2,
          "explanation": "Giải thích"
        }
      ]
    }
  ]
}`;
        } else {
            // Generate from existing text
            const types = options.questionTypes || ['tfng', 'multiple-choice', 'summary'];
            const typeDescs = types.map(t => questionTypeDescriptions[t] || t).join('\n- ');

            return `Dựa vào đoạn văn sau, tạo các câu hỏi IELTS Reading:

ĐOẠN VĂN:
"""
${options.passageText}
"""

Yêu cầu:
- Band level: ${options.bandLevel}
- Các dạng câu hỏi cần tạo:
- ${typeDescs}
- Tạo 8-12 câu hỏi đa dạng
- Mỗi câu phải có đáp án chính xác và giải thích dựa trên đoạn văn

Trả về JSON với cấu trúc:
{
  "title": "Tên đề thi (đặt theo nội dung đoạn văn)",
  "level": "${options.bandLevel}",
  "source": "ai-generated",
  "passages": [
    {
      "id": "p1",
      "title": "Tiêu đề phù hợp với đoạn văn",
      "text": "${options.passageText.substring(0, 100)}...(giữ nguyên toàn bộ đoạn văn)",
      "questions": [
        {
          "id": "q1",
          "type": "tfng",
          "text": "Câu hỏi",
          "answer": "True/False/Not Given",
          "explanation": "Giải thích chi tiết"
        }
      ]
    }
  ]
}

Lưu ý quan trọng: Giữ nguyên đoạn văn gốc, chỉ tạo câu hỏi dựa trên nội dung có trong đoạn.`;
        }
    },

    /**
     * Generate local test (fallback when no API)
     */
    generateLocalTest(options) {
        const timestamp = Date.now();
        
        if (options.mode === 'topic') {
            return {
                title: `Đề thi về ${options.topic}`,
                id: `ai-${timestamp}`,
                level: options.bandLevel,
                source: 'ai-generated-local',
                createdAt: new Date().toISOString(),
                passages: [{
                    id: 'p1',
                    title: options.topic,
                    text: `This is a placeholder passage about "${options.topic}". To generate real content, please configure your OpenAI API key in Settings.

The topic "${options.topic}" is an interesting subject that has gained significant attention in recent years. Various experts have studied this area extensively, leading to important discoveries and insights.

Research indicates that understanding ${options.topic} is crucial for modern society. Studies show that there are multiple perspectives on this topic, each offering unique insights.

To fully utilize the AI generation feature, please add your OpenAI API key in the Settings section. This will enable high-quality, authentic IELTS-style passages and questions.`,
                    questions: [
                        {
                            id: 'q1',
                            type: 'tfng',
                            text: `The topic "${options.topic}" has received significant attention recently.`,
                            answer: 'True',
                            explanation: 'Đây là câu hỏi mẫu. Cấu hình API key để có câu hỏi thực.'
                        },
                        {
                            id: 'q2',
                            type: 'tfng',
                            text: 'An API key is needed for full functionality.',
                            answer: 'True',
                            explanation: 'The passage mentions that API key is needed to generate real content.'
                        }
                    ]
                }]
            };
        } else {
            // Text mode - generate questions from provided text
            const title = options.passageText.substring(0, 50).replace(/[^a-zA-Z0-9\s]/g, '') + '...';
            
            return {
                title: `Đề thi: ${title}`,
                id: `ai-text-${timestamp}`,
                level: options.bandLevel,
                source: 'ai-generated-local',
                createdAt: new Date().toISOString(),
                passages: [{
                    id: 'p1',
                    title: title,
                    text: options.passageText,
                    questions: this.generateBasicQuestions(options.passageText)
                }]
            };
        }
    },

    /**
     * Generate basic questions from text (local fallback)
     */
    generateBasicQuestions(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const questions = [];
        
        // Generate a few T/F/NG questions
        for (let i = 0; i < Math.min(3, sentences.length); i++) {
            questions.push({
                id: `q${i + 1}`,
                type: 'tfng',
                text: `Based on the passage: "${sentences[i].trim().substring(0, 80)}..."`,
                answer: 'True',
                explanation: 'Vui lòng cấu hình API key OpenAI để có câu hỏi chất lượng hơn.'
            });
        }

        return questions;
    },

    /**
     * Validate test data structure
     */
    validateTestData(data) {
        if (!data) return false;
        if (!data.title) return false;
        if (!data.passages || !Array.isArray(data.passages)) return false;
        if (data.passages.length === 0) return false;
        
        for (const passage of data.passages) {
            if (!passage.title || !passage.text) return false;
            if (!passage.questions || !Array.isArray(passage.questions)) return false;
        }
        
        return true;
    },

    /**
     * Save generated test to storage
     */
    saveGeneratedTest(testData) {
        // Ensure required fields
        if (!testData.id) {
            testData.id = `ai-${Date.now()}`;
        }
        testData.source = 'ai-generated';
        testData.createdAt = new Date().toISOString();
        testData.lastModified = new Date().toISOString();

        // Save using FileParser
        FileParser.saveTest(testData);

        // Log activity
        Storage.addActivity({
            type: 'ai_test_generated',
            description: `AI đã tạo đề thi: ${testData.title}`,
            testId: testData.id
        });
    },

    /**
     * Show loading state in UI
     */
    showLoadingState() {
        const resultArea = document.getElementById('aiGeneratorResult');
        if (resultArea) {
            resultArea.innerHTML = `
                <div class="ai-generating">
                    <div class="spinner large"></div>
                    <h3>🤖 AI đang tạo đề thi...</h3>
                    <p>Quá trình này có thể mất 10-30 giây</p>
                    <div class="generating-steps">
                        <span class="step active">📝 Tạo bài đọc</span>
                        <span class="step">❓ Tạo câu hỏi</span>
                        <span class="step">✅ Kiểm tra</span>
                    </div>
                </div>
            `;
            resultArea.style.display = 'block';
        }

        // Disable buttons
        const btns = document.querySelectorAll('#generateFromPromptBtn, #generateFromTextBtn');
        btns.forEach(btn => btn.disabled = true);
    },

    /**
     * Show success state
     */
    showSuccessState(testData) {
        const resultArea = document.getElementById('aiGeneratorResult');
        if (resultArea) {
            const totalQuestions = testData.passages.reduce((sum, p) => sum + p.questions.length, 0);
            
            resultArea.innerHTML = `
                <div class="ai-success">
                    <div class="success-icon">✅</div>
                    <h3>Đề thi đã được tạo thành công!</h3>
                    <div class="test-summary">
                        <div class="summary-item">
                            <span class="label">Tên đề:</span>
                            <span class="value">${testData.title}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Band Level:</span>
                            <span class="value">${testData.level || '7.0'}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Số passages:</span>
                            <span class="value">${testData.passages.length}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Số câu hỏi:</span>
                            <span class="value">${totalQuestions}</span>
                        </div>
                    </div>
                    <div class="success-actions">
                        <button class="btn btn-primary" onclick="AITestGenerator.startTest('${testData.id}')">
                            🚀 Làm bài ngay
                        </button>
                        <button class="btn btn-secondary" onclick="AITestGenerator.viewInLibrary()">
                            📚 Xem trong thư viện
                        </button>
                        <button class="btn btn-ghost" onclick="AITestGenerator.resetForm()">
                            ➕ Tạo đề mới
                        </button>
                    </div>
                </div>
            `;
        }

        // Re-enable buttons
        const btns = document.querySelectorAll('#generateFromPromptBtn, #generateFromTextBtn');
        btns.forEach(btn => btn.disabled = false);
    },

    /**
     * Show error state
     */
    showErrorState(message) {
        const resultArea = document.getElementById('aiGeneratorResult');
        if (resultArea) {
            resultArea.innerHTML = `
                <div class="ai-error">
                    <div class="error-icon">❌</div>
                    <h3>Không thể tạo đề thi</h3>
                    <p>${message}</p>
                    <div class="error-tips">
                        <h4>💡 Gợi ý:</h4>
                        <ul>
                            <li>Kiểm tra API key OpenAI trong Settings</li>
                            <li>Thử lại với chủ đề khác</li>
                            <li>Kiểm tra kết nối internet</li>
                        </ul>
                    </div>
                    <button class="btn btn-primary" onclick="AITestGenerator.resetForm()">
                        🔄 Thử lại
                    </button>
                </div>
            `;
        }

        // Re-enable buttons
        const btns = document.querySelectorAll('#generateFromPromptBtn, #generateFromTextBtn');
        btns.forEach(btn => btn.disabled = false);
    },

    /**
     * Start practicing the generated test
     */
    startTest(testId) {
        App.switchTab('practice');
        setTimeout(() => {
            if (typeof Practice !== 'undefined') {
                Practice.selectTest(testId);
            }
        }, 100);
    },

    /**
     * Go to library
     */
    viewInLibrary() {
        App.switchTab('library');
    },

    /**
     * Reset form for new generation
     */
    resetForm() {
        const promptInput = document.getElementById('aiTopicPrompt');
        const textInput = document.getElementById('aiPassageText');
        const resultArea = document.getElementById('aiGeneratorResult');

        if (promptInput) promptInput.value = '';
        if (textInput) textInput.value = '';
        if (resultArea) resultArea.style.display = 'none';
    },

    /**
     * Open API key settings
     */
    openSettings() {
        App.switchTab('settings');
        setTimeout(() => {
            document.getElementById('apiKeyInput')?.focus();
        }, 100);
    }
};

// Make AITestGenerator available globally
window.AITestGenerator = AITestGenerator;

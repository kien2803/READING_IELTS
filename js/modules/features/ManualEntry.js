/* ==========================================
   Manual Entry Module
   Create tests by manually entering content
   ========================================== */

const ManualEntry = {
    currentPassage: 1,
    passages: [{}, {}, {}], // 3 passages max
    questionCounter: 1,

    /**
     * Initialize manual entry
     */
    init() {
        this.bindEvents();
        this.resetForm();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Passage tabs
        document.querySelectorAll('.passage-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchPassage(parseInt(e.target.dataset.passage));
            });
        });

        // Upload method tabs
        document.querySelectorAll('.method-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchMethod(e.target.dataset.method);
            });
        });

        // Add question button
        const addBtn = document.getElementById('addQuestionBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addQuestion());
        }

        // Passage text change
        const passageText = document.getElementById('passageText');
        if (passageText) {
            passageText.addEventListener('input', (e) => this.updateTextStats(e.target));
        }
    },

    /**
     * Switch upload method (manual/file/ai-generator)
     */
    switchMethod(method) {
        document.querySelectorAll('.method-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.method === method);
        });

        document.querySelectorAll('.upload-method-content').forEach(content => {
            content.classList.remove('active');
        });

        let targetSection;
        if (method === 'manual') {
            targetSection = 'manualEntrySection';
        } else if (method === 'upload') {
            targetSection = 'fileUploadSection';
        } else if (method === 'ai-generator') {
            targetSection = 'aiGeneratorSection';
        }

        const section = document.getElementById(targetSection);
        if (section) {
            section.classList.add('active');
        }
    },

    /**
     * Switch between passages
     */
    switchPassage(passageNum) {
        // Save current passage data
        this.saveCurrentPassage();

        // Update tabs
        document.querySelectorAll('.passage-tab').forEach(tab => {
            tab.classList.toggle('active', parseInt(tab.dataset.passage) === passageNum);
        });

        this.currentPassage = passageNum;

        // Load passage data
        this.loadPassage(passageNum);
    },

    /**
     * Save current passage data
     */
    saveCurrentPassage() {
        const passageData = {
            title: document.getElementById('passageTitle')?.value || '',
            text: document.getElementById('passageText')?.value || '',
            questions: this.getQuestionsFromUI()
        };
        this.passages[this.currentPassage - 1] = passageData;
    },

    /**
     * Load passage data into UI
     */
    loadPassage(passageNum) {
        const passageData = this.passages[passageNum - 1] || {};

        const titleInput = document.getElementById('passageTitle');
        const textInput = document.getElementById('passageText');

        if (titleInput) titleInput.value = passageData.title || '';
        if (textInput) {
            textInput.value = passageData.text || '';
            this.updateTextStats(textInput);
        }

        // Load questions
        this.loadQuestions(passageData.questions || []);
    },

    /**
     * Get questions from UI
     */
    getQuestionsFromUI() {
        const questions = [];
        document.querySelectorAll('.question-entry').forEach(entry => {
            questions.push({
                id: entry.dataset.questionId,
                type: entry.querySelector('.question-type-select')?.value || 'tfng',
                text: entry.querySelector('.question-text-input')?.value || '',
                answer: entry.querySelector('.answer-input')?.value || '',
                explanation: entry.querySelector('.explanation-input')?.value || ''
            });
        });
        return questions;
    },

    /**
     * Load questions into UI
     */
    loadQuestions(questions) {
        const container = document.getElementById('questionsInputContainer');
        if (!container) return;

        container.innerHTML = '';
        this.questionCounter = 0;

        if (questions.length === 0) {
            this.addQuestion();
        } else {
            questions.forEach(q => this.addQuestion(q));
        }
    },

    /**
     * Add a new question entry
     */
    addQuestion(data = null) {
        this.questionCounter++;
        const container = document.getElementById('questionsInputContainer');
        if (!container) return;

        const questionHtml = `
            <div class="question-entry" data-question-id="${this.questionCounter}">
                <div class="question-header">
                    <span class="question-number">Câu ${this.questionCounter}</span>
                    <select class="select question-type-select">
                        <option value="tfng" ${data?.type === 'tfng' ? 'selected' : ''}>True/False/Not Given</option>
                        <option value="ynng" ${data?.type === 'ynng' ? 'selected' : ''}>Yes/No/Not Given</option>
                        <option value="multiple-choice" ${data?.type === 'multiple-choice' ? 'selected' : ''}>Multiple Choice</option>
                        <option value="matching-headings" ${data?.type === 'matching-headings' ? 'selected' : ''}>Matching Headings</option>
                        <option value="summary" ${data?.type === 'summary' ? 'selected' : ''}>Summary Completion</option>
                        <option value="sentence" ${data?.type === 'sentence' ? 'selected' : ''}>Sentence Completion</option>
                    </select>
                    <button class="btn btn-sm btn-danger remove-question-btn" onclick="ManualEntry.removeQuestion(${this.questionCounter})">🗑️</button>
                </div>
                <div class="question-body">
                    <input type="text" class="input question-text-input" placeholder="Nội dung câu hỏi..." value="${data?.text || ''}">
                    <div class="answer-row">
                        <input type="text" class="input answer-input" placeholder="Đáp án đúng" value="${data?.answer || ''}">
                        <input type="text" class="input explanation-input" placeholder="Giải thích (tùy chọn)" value="${data?.explanation || ''}">
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', questionHtml);
    },

    /**
     * Remove a question
     */
    removeQuestion(id) {
        const entry = document.querySelector(`.question-entry[data-question-id="${id}"]`);
        if (entry) {
            entry.remove();
            this.renumberQuestions();
        }
    },

    /**
     * Renumber questions after removal
     */
    renumberQuestions() {
        document.querySelectorAll('.question-entry').forEach((entry, i) => {
            entry.querySelector('.question-number').textContent = `Câu ${i + 1}`;
        });
    },

    /**
     * Update text statistics
     */
    updateTextStats(textarea) {
        const text = textarea.value;
        const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
        const charCount = text.length;

        const wordEl = document.getElementById('passageWordCount');
        const charEl = document.getElementById('passageCharCount');

        if (wordEl) wordEl.textContent = `${wordCount} từ`;
        if (charEl) charEl.textContent = `${charCount} ký tự`;
    },

    /**
     * Save the complete test
     */
    saveTest() {
        // Save current passage first
        this.saveCurrentPassage();

        // Validate
        const title = document.getElementById('manualTestTitle')?.value?.trim();
        if (!title) {
            Utils.showNotification('Vui lòng nhập tên đề thi', 'warning');
            return;
        }

        // Check if at least one passage has content
        const validPassages = this.passages.filter(p => p.title && p.text && p.questions?.length > 0);
        
        if (validPassages.length === 0) {
            Utils.showNotification('Vui lòng nhập ít nhất 1 passage với câu hỏi', 'warning');
            return;
        }

        // Build test data
        const testData = {
            id: `custom-${Utils.generateId()}`,
            title: title,
            source: document.getElementById('manualTestSource')?.value || 'custom',
            level: document.getElementById('manualTestLevel')?.value || '7.0',
            passages: validPassages.map((p, i) => ({
                id: `passage-${i + 1}`,
                title: p.title,
                text: p.text,
                questions: p.questions.map((q, j) => ({
                    id: `q-${i + 1}-${j + 1}`,
                    type: q.type,
                    text: q.text,
                    answer: q.answer,
                    explanation: q.explanation
                }))
            })),
            createdAt: new Date().toISOString()
        };

        // Save to storage
        FileParser.saveCustomTest(testData);

        Utils.showNotification(`✅ Đã lưu đề thi "${title}" thành công!`, 'success');

        // Reset form
        this.resetForm();

        // Refresh library
        if (typeof Library !== 'undefined') {
            Library.render();
        }
    },

    /**
     * Reset form to initial state
     */
    resetForm() {
        this.passages = [{}, {}, {}];
        this.currentPassage = 1;
        this.questionCounter = 0;

        // Clear inputs
        const titleInput = document.getElementById('manualTestTitle');
        const sourceInput = document.getElementById('manualTestSource');
        const levelInput = document.getElementById('manualTestLevel');
        const passageTitle = document.getElementById('passageTitle');
        const passageText = document.getElementById('passageText');

        if (titleInput) titleInput.value = '';
        if (sourceInput) sourceInput.value = 'custom';
        if (levelInput) levelInput.value = '7.0';
        if (passageTitle) passageTitle.value = '';
        if (passageText) passageText.value = '';

        // Reset passage tabs
        document.querySelectorAll('.passage-tab').forEach((tab, i) => {
            tab.classList.toggle('active', i === 0);
        });

        // Reset questions
        this.loadQuestions([]);

        // Update stats
        this.updateTextStats(document.getElementById('passageText') || { value: '' });
    }
};

// Make ManualEntry available globally
window.ManualEntry = ManualEntry;

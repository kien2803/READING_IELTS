/* ==========================================
   Practice Module - Completely Redesigned
   Better UX, Test Management, Highlight System
   ========================================== */

const Practice = {
    // Current state
    currentLevel: '5.0',
    currentQuestionType: null,
    currentPassage: null,
    currentPassageIndex: 0,
    currentQuestions: [],
    userAnswers: {},
    startTime: null,
    selectedTestId: null,
    selectedTestData: null,
    currentHighlightColor: 'yellow',
    highlights: [],
    isHighlightMode: false,

    /**
     * Initialize practice module
     */
    init() {
        this.bindEvents();
        this.renderTestSelector();
    },

    /**
     * Render test selector with improved UX
     */
    renderTestSelector() {
        const container = document.getElementById('testSelectorGrid');
        if (!container) return;

        const customTests = FileParser.getCustomTests();
        const sampleTests = this.getSampleTests();
        const allTests = [...customTests, ...sampleTests];

        if (allTests.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; padding: 40px; text-align: center;">
                    <h3 style="color: #667eea; margin-bottom: 15px;">📚 Chưa có đề thi nào</h3>
                    <p style="margin-bottom: 20px;">Hãy upload file JSON/TXT để tạo đề thi của bạn!</p>
                    <button class="btn btn-primary" onclick="App.switchTab('upload')">
                        ➕ Tải lên đề thi
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = allTests.map(test => {
            const totalQuestions = test.passages ? 
                test.passages.reduce((sum, p) => sum + p.questions.length, 0) : 0;
            const isCustom = !test.id.startsWith('sample-');
            
            return `
                <div class="test-selector-card ${this.selectedTestId === test.id ? 'selected' : ''}" 
                     data-test-id="${test.id}" 
                     onclick="Practice.selectTest('${test.id}')">
                    ${isCustom ? '<span class="test-badge">Custom</span>' : '<span class="test-badge sample">Sample</span>'}
                    <div class="test-selector-title">${test.title || 'IELTS Reading Test'}</div>
                    <span class="test-card-level">Band ${test.level || '7.0'}</span>
                    <div class="test-selector-meta">
                        <span>📖 ${test.passages ? test.passages.length : 0} passages</span>
                        <span>❓ ${totalQuestions} questions</span>
                    </div>
                    ${this.getTestProgress(test.id)}
                </div>
            `;
        }).join('');
    },

    /**
     * Get test progress bar
     */
    getTestProgress(testId) {
        const completed = Storage.getTests().filter(t => t.testId === testId);
        if (completed.length === 0) return '';
        
        const lastScore = completed[0].bandScore;
        return `
            <div class="test-progress-indicator">
                <span class="test-last-score">Last: ${lastScore}</span>
            </div>
        `;
    },

    /**
     * Get sample tests - use Library's default tests for consistency
     */
    getSampleTests() {
        // Use Library's default tests if available
        if (typeof Library !== 'undefined' && Library.getDefaultTests) {
            return Library.getDefaultTests();
        }
        
        // Fallback to basic sample test
        return [
            {
                id: 'sample-coffee',
                title: 'The History of Coffee',
                level: '6.0',
                passages: [{
                    title: 'The History of Coffee',
                    text: `Coffee is one of the world's most popular beverages. The origins of coffee can be traced back to the ancient coffee forests on the Ethiopian plateau. According to legend, a goat herder named Kaldi first discovered the potential of these beloved beans when he noticed his goats becoming energetic after eating berries from a certain tree.

By the 15th century, coffee was being grown in the Yemeni district of Arabia. By the 16th century, it was known in Persia, Egypt, Syria, and Turkey. Coffee was not only enjoyed in homes but also in many public coffee houses called "qahveh khaneh."

These coffee houses quickly became centers of social activity and communication in the major cities of the Middle East. People would gather to drink coffee, watch performers, play chess and keep current with the news. Coffee houses became such an important center for the exchange of information that they were often referred to as "Schools of the Wise."`,
                    questions: [
                        {
                            id: 'q1',
                            type: 'tfng',
                            text: 'Coffee was first discovered in Yemen.',
                            answer: 'False',
                            explanation: 'The passage states coffee originated in Ethiopia, not Yemen.'
                        },
                        {
                            id: 'q2',
                            type: 'tfng',
                            text: 'Kaldi was a goat herder.',
                            answer: 'True',
                            explanation: 'The passage clearly states Kaldi was a goat herder.'
                        },
                        {
                            id: 'q3',
                            type: 'tfng',
                            text: 'Coffee houses were only used for drinking coffee.',
                            answer: 'False',
                            explanation: 'The passage mentions people also watched performers, played chess, and kept current with news.'
                        }
                    ]
                }]
            }
        ];
    },

    /**
     * Select test - improved UX with better test lookup
     */
    selectTest(testId) {
        this.selectedTestId = testId;
        
        // Try to find test from various sources
        let testData = null;
        
        // 1. Check Library's default tests first
        if (typeof Library !== 'undefined') {
            const defaultTests = Library.getDefaultTests();
            testData = defaultTests.find(t => t.id === testId);
        }
        
        // 2. Check custom/uploaded tests
        if (!testData) {
            testData = FileParser.loadCustomTest(testId);
        }
        
        // 3. Fallback to Practice's sample tests
        if (!testData) {
            const sampleTests = this.getSampleTests();
            testData = sampleTests.find(t => t.id === testId);
        }
        
        if (!testData) {
            Utils.showNotification('❌ Không tìm thấy đề thi!', 'error');
            console.error('Test not found:', testId);
            return;
        }
        
        this.selectedTestData = testData;

        // Update UI
        document.querySelectorAll('.test-selector-card').forEach(card => {
            card.classList.remove('selected');
            card.classList.remove('active');
        });
        const selectedCard = document.querySelector(`[data-test-id="${testId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('active');
            selectedCard.classList.add('selected');
        }

        // Update question types grid for this test
        this.updateQuestionTypesForTest();

        // Show config section with animation
        const configSection = document.getElementById('testConfigSection');
        if (configSection) {
            configSection.style.display = 'block';
            setTimeout(() => configSection.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }

        console.log('Selected test:', testData);
        Utils.showNotification(`✅ Đã chọn: ${this.selectedTestData.title}`, 'success', 2000);
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Level selector
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectLevel(e, e.target.dataset.level);
            });
        });

        // Question type cards
        document.querySelectorAll('.question-type-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const type = card.dataset.type;
                this.selectQuestionType(type);
            });
        });

        // Submit button
        const submitBtn = document.getElementById('submitAnswers');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitAnswers());
        }

        // Highlight controls
        this.setupHighlightControls();
    },

    /**
     * Setup improved highlight system
     */
    setupHighlightControls() {
        // Color selection
        document.querySelectorAll('.highlight-btn[data-color]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.selectHighlightColor(btn.dataset.color);
            });
        });

        // Clear highlights
        const clearBtn = document.getElementById('clearHighlights');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.clearAllHighlights();
            });
        }

        // Enable/disable highlight mode
        document.addEventListener('keydown', (e) => {
            if (e.key === 'h' && e.ctrlKey) {
                e.preventDefault();
                this.toggleHighlightMode();
            }
        });
    },

    /**
     * Select highlight color
     */
    selectHighlightColor(color) {
        this.currentHighlightColor = color;
        this.isHighlightMode = true;
        
        // Update UI
        document.querySelectorAll('.highlight-btn[data-color]').forEach(btn => {
            btn.classList.remove('active');
        });
        const selectedBtn = document.querySelector(`[data-color="${color}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }

        // Show notification
        const colorNames = { yellow: 'Vàng', green: 'Xanh lá', blue: 'Xanh dương', pink: 'Hồng' };
        Utils.showNotification(`Chế độ highlight ${colorNames[color]}. Chọn text để highlight.`, 'info', 2000);
        
        // Enable selection mode
        this.enableHighlightMode();
    },

    /**
     * Enable highlight mode
     */
    enableHighlightMode() {
        const passageContent = document.getElementById('passageContent');
        if (passageContent) {
            passageContent.classList.add('highlight-mode');
            passageContent.style.cursor = 'crosshair';
            
            // Add mouseup event
            passageContent.addEventListener('mouseup', this.handleHighlight.bind(this));
        }
    },

    /**
     * Toggle highlight mode
     */
    toggleHighlightMode() {
        this.isHighlightMode = !this.isHighlightMode;
        const passageContent = document.getElementById('passageContent');
        
        if (this.isHighlightMode) {
            this.enableHighlightMode();
            Utils.showNotification('Chế độ highlight BẬT (Ctrl+H để tắt)', 'success', 2000);
        } else {
            if (passageContent) {
                passageContent.classList.remove('highlight-mode');
                passageContent.style.cursor = '';
            }
            Utils.showNotification('Chế độ highlight TẮT', 'info', 2000);
        }
    },

    /**
     * Handle text highlighting - improved version
     */
    handleHighlight(e) {
        if (!this.isHighlightMode) return;

        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText.length === 0) return;

        try {
            const range = selection.getRangeAt(0);
            
            // Check if selection is within passage content
            const passageContent = document.getElementById('passageContent');
            if (!passageContent.contains(range.commonAncestorContainer)) {
                return;
            }

            // Create highlight span
            const span = document.createElement('span');
            span.className = `highlight highlight-${this.currentHighlightColor}`;
            span.dataset.highlightId = Utils.generateId();
            span.title = 'Double-click to remove';
            
            // Wrap selection - More robust method than surroundContents
            try {
                range.surroundContents(span);
            } catch (e) {
                // If surroundContents fails (complex selection), use extractContents
                const contents = range.extractContents();
                span.appendChild(contents);
                range.insertNode(span);
            }
            
            // Save highlight
            this.highlights.push({
                id: span.dataset.highlightId,
                color: this.currentHighlightColor,
                text: selectedText
            });

            // Clear selection
            selection.removeAllRanges();
            
            // Add double-click to remove
            span.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                this.removeHighlight(span.dataset.highlightId);
            });

            // Visual feedback
            span.style.animation = 'highlightPulse 0.5s ease-out';

        } catch (error) {
            console.warn('Highlight Error:', error);
            Utils.showNotification('Không thể highlight vùng này. Hãy chọn đoạn văn đơn giản hơn.', 'warning', 2000);
        }
    },

    /**
     * Remove specific highlight
     */
    removeHighlight(highlightId) {
        const span = document.querySelector(`[data-highlight-id="${highlightId}"]`);
        if (span) {
            const parent = span.parentNode;
            while (span.firstChild) {
                parent.insertBefore(span.firstChild, span);
            }
            parent.removeChild(span);
            parent.normalize(); // Merge text nodes
            
            // Remove from saved highlights
            this.highlights = this.highlights.filter(h => h.id !== highlightId);
            
            Utils.showNotification('Đã xóa highlight', 'success', 1000);
        }
    },

    /**
     * Clear all highlights
     */
    clearAllHighlights() {
        const passageContent = document.getElementById('passageContent');
        if (!passageContent) return;

        const highlights = passageContent.querySelectorAll('.highlight');
        if (highlights.length === 0) {
            Utils.showNotification('Không có highlight nào', 'info');
            return;
        }

        if (confirm(`Xóa tất cả ${highlights.length} highlights?`)) {
            highlights.forEach(span => {
                const parent = span.parentNode;
                while (span.firstChild) {
                    parent.insertBefore(span.firstChild, span);
                }
                parent.removeChild(span);
            });
            
            this.highlights = [];
            passageContent.normalize();
            Utils.showNotification('Đã xóa tất cả highlights', 'success');
        }
    },

    /**
     * Select level
     */
    selectLevel(e, level) {
        this.currentLevel = level;
        
        document.querySelectorAll('.level-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const target = e ? e.target : null;
        if (target) {
            target.classList.add('active');
        }

        Utils.showNotification(`Đã chọn level ${level}`, 'info', 1500);
    },

    /**
     * Select question type - improved
     */
    selectQuestionType(type) {
        if (!this.selectedTestId || !this.selectedTestData) {
            Utils.showNotification('⚠️ Vui lòng chọn đề thi trước!', 'warning');
            
            // Scroll to test selector
            const testSelector = document.getElementById('testSelectorGrid');
            if (testSelector) {
                testSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        this.currentQuestionType = type;
        
        // Update UI
        document.querySelectorAll('.question-type-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const target = event ? event.target.closest('.question-type-card') : null;
        if (target) {
            target.classList.add('selected');
        }

        // Start test based on type
        if (type === 'full-test') {
            this.startFullTest();
        } else {
            this.startFilteredTest(type);
        }
    },

    /**
     * Start full test (all questions)
     */
    startFullTest() {
        if (!this.selectedTestData || !this.selectedTestData.passages) {
            Utils.showNotification('Không tìm thấy dữ liệu đề thi', 'error');
            return;
        }

        // Load first passage with all questions
        this.currentPassageIndex = 0;
        this.loadPassage(0);

        Utils.showNotification(`🎯 Bắt đầu Full Test: ${this.selectedTestData.title}`, 'success');
    },

    /**
     * Start filtered test (specific question type)
     */
    startFilteredTest(type) {
        if (!this.selectedTestData || !this.selectedTestData.passages) {
            Utils.showNotification('Không tìm thấy dữ liệu đề thi', 'error');
            return;
        }

        // Filter questions by type
        const allQuestions = [];
        this.selectedTestData.passages.forEach(passage => {
            const filtered = passage.questions.filter(q => q.type === type);
            if (filtered.length > 0) {
                allQuestions.push(...filtered);
            }
        });

        if (allQuestions.length === 0) {
            Utils.showNotification(`Không tìm thấy câu hỏi dạng ${this.getQuestionTypeName(type)}`, 'warning');
            return;
        }

        // Load first passage and filtered questions
        this.currentPassageIndex = 0;
        this.currentPassage = this.selectedTestData.passages[0];
        this.currentQuestions = allQuestions;

        this.showPracticeArea();
        this.renderPassage();
        this.renderQuestions();

        Utils.showNotification(`Bắt đầu luyện ${this.getQuestionTypeName(type)}: ${allQuestions.length} câu`, 'success');
    },

    /**
     * Load specific passage
     */
    loadPassage(index) {
        if (!this.selectedTestData.passages[index]) return;

        this.currentPassageIndex = index;
        this.currentPassage = this.selectedTestData.passages[index];
        this.currentQuestions = this.currentPassage.questions;

        this.showPracticeArea();
        this.renderPassage();
        this.renderQuestions();

        // Update passage number
        const passageNum = document.getElementById('passageNumber');
        if (passageNum) {
            passageNum.textContent = index + 1;
        }
    },

    /**
     * Show practice area
     */
    showPracticeArea() {
        // Show timer
        const timerSection = document.getElementById('timerSection');
        if (timerSection) {
            timerSection.style.display = 'block';
        }

        // Show practice area container
        const practiceArea = document.getElementById('practiceArea');
        if (practiceArea) {
            practiceArea.style.display = 'block';
        }

        // Show passage container
        const passageContainer = document.getElementById('passageContainer');
        if (passageContainer) {
            passageContainer.style.display = 'grid';
        }

        // Hide test selector and config
        const testSelector = document.querySelector('.test-selector-grid')?.closest('.card');
        if (testSelector) {
            testSelector.style.display = 'none';
        }
        const configSection = document.getElementById('testConfigSection');
        if (configSection) {
            configSection.style.display = 'none';
        }

        // Reset and start timer
        Timer.reset();
        Timer.start();
        this.startTime = Date.now();

        // Scroll to practice area
        setTimeout(() => {
            Utils.scrollToElement('#practiceArea', 80);
        }, 100);
    },

    /**
     * Render passage
     */
    renderPassage() {
        const passageContent = document.getElementById('passageContent');
        if (!passageContent || !this.currentPassage) return;

        const paragraphs = this.currentPassage.text.split('\n\n').filter(p => p.trim());
        
        const html = `
            <h4 style="color: #667eea; margin-bottom: 15px;">${this.currentPassage.title}</h4>
            ${paragraphs.map(p => `<p>${p.trim()}</p>`).join('')}
        `;
        
        passageContent.innerHTML = Utils.sanitize(html);

        // Re-enable highlight mode if it was active
        if (this.isHighlightMode) {
            this.enableHighlightMode();
        }
    },

    /**
     * Render questions - supports mixed question types
     */
    renderQuestions() {
        const questionsContent = document.getElementById('questionsContent');
        const questionCount = document.getElementById('questionCount');
        
        if (!questionsContent || !this.currentQuestions) return;

        // Update question count
        if (questionCount) {
            const answered = Object.keys(this.userAnswers).length;
            questionCount.textContent = `${answered}/${this.currentQuestions.length}`;
        }

        // Render each question individually based on its own type
        const questionsHTML = this.currentQuestions.map((q, index) => {
            return this.renderSingleQuestion(q, index);
        }).join('');
        
        questionsContent.innerHTML = Utils.sanitize(questionsHTML);

        // Bind answer events
        this.bindAnswerEvents();
    },

    /**
     * Render a single question based on its type
     */
    renderSingleQuestion(q, index) {
        // Multiple Choice
        if (q.type === 'multiple-choice') {
            return `
                <div class="question-item" data-id="${q.id}">
                    <p class="question-text"><strong>Question ${index + 1}:</strong> ${q.text}</p>
                    <div class="options-list">
                        ${(q.options || []).map((option, i) => `
                            <label class="option-item">
                                <input type="radio" name="${q.id}" value="${option}" class="option-radio">
                                <span class="option-label">${String.fromCharCode(65 + i)}. ${option}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        } 
        // True/False/Not Given or Yes/No/Not Given
        else if (q.type === 'tfng' || q.type === 'ynng') {
            const options = q.type === 'ynng' 
                ? ['Yes', 'No', 'Not Given']
                : ['True', 'False', 'Not Given'];
            return `
                <div class="question-item" data-id="${q.id}">
                    <p class="question-text"><strong>Question ${index + 1}:</strong> ${q.text}</p>
                    <div class="options-list">
                        ${options.map(option => `
                            <label class="option-item">
                                <input type="radio" name="${q.id}" value="${option}" class="option-radio">
                                <span class="option-label">${option}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        } 
        // Text Input (summary, sentence completion, etc.)
        else {
            return `
                <div class="question-item" data-id="${q.id}">
                    <p class="question-text"><strong>Question ${index + 1}:</strong> ${q.text}</p>
                    ${q.wordLimit ? `<p class="word-limit-hint">Write NO MORE THAN ${q.wordLimit} word(s)</p>` : ''}
                    <input type="text" class="question-input" data-id="${q.id}" placeholder="Type your answer here...">
                </div>
            `;
        }
    },


    /**
     * Render multiple choice questions
     */
    renderMultipleChoice() {
        return this.currentQuestions.map((q, index) => `
            <div class="question-item" data-id="${q.id}">
                <p class="question-text"><strong>Question ${index + 1}:</strong> ${q.text}</p>
                <div class="options-list">
                    ${(q.options || []).map((option, i) => `
                        <label class="option-item">
                            <input type="radio" name="${q.id}" value="${option}" class="option-radio">
                            <span class="option-label">${String.fromCharCode(65 + i)}. ${option}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },

    /**
     * Render T/F/NG questions
     */
    renderTFNG() {
        const options = this.currentQuestions[0].type === 'ynng' 
            ? ['Yes', 'No', 'Not Given']
            : ['True', 'False', 'Not Given'];

        return this.currentQuestions.map((q, index) => `
            <div class="question-item" data-id="${q.id}">
                <p class="question-text"><strong>Question ${index + 1}:</strong> ${q.text}</p>
                <div class="options-list">
                    ${options.map(option => `
                        <label class="option-item">
                            <input type="radio" name="${q.id}" value="${option}" class="option-radio">
                            <span class="option-label">${option}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },

    /**
     * Render text input questions
     */
    renderTextInput() {
        return this.currentQuestions.map((q, index) => `
            <div class="question-item" data-id="${q.id}">
                <p class="question-text"><strong>Question ${index + 1}:</strong> ${q.text}</p>
                ${q.wordLimit ? `<p class="word-limit-hint">Write NO MORE THAN ${q.wordLimit} word(s)</p>` : ''}
                <input type="text" class="question-input" data-id="${q.id}" placeholder="Type your answer here...">
            </div>
        `).join('');
    },

    /**
     * Bind answer events
     */
    bindAnswerEvents() {
        // Radio buttons
        document.querySelectorAll('.option-radio').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const questionId = e.target.name;
                this.userAnswers[questionId] = e.target.value;
                this.updateQuestionCount();
                
                // Mark as answered
                const item = e.target.closest('.question-item');
                item.classList.add('answered');
            });
        });

        // Text inputs
        document.querySelectorAll('.question-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const questionId = e.target.dataset.id;
                this.userAnswers[questionId] = e.target.value;
                this.updateQuestionCount();
                
                // Mark as answered
                const item = e.target.closest('.question-item');
                if (e.target.value.trim()) {
                    item.classList.add('answered');
                } else {
                    item.classList.remove('answered');
                }
            });
        });
    },

    /**
     * Update question count
     */
    updateQuestionCount() {
        const questionCount = document.getElementById('questionCount');
        if (questionCount) {
            const answered = Object.keys(this.userAnswers).filter(key => this.userAnswers[key]).length;
            questionCount.textContent = `${answered}/${this.currentQuestions.length}`;
        }
    },

    /**
     * Submit answers
     */
    submitAnswers() {
        const answered = Object.keys(this.userAnswers).filter(key => this.userAnswers[key]).length;
        
        if (answered === 0) {
            Utils.showNotification('⚠️ Bạn chưa trả lời câu nào!', 'warning');
            return;
        }

        if (answered < this.currentQuestions.length) {
            if (!confirm(`Bạn mới trả lời ${answered}/${this.currentQuestions.length} câu. Bạn có chắc muốn nộp bài?`)) {
                return;
            }
        }

        // Stop timer
        Timer.pause();
        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

        // Calculate score
        const result = this.calculateScore();
        
        // Save test result
        Storage.addTest({
            testId: this.selectedTestId,
            level: this.currentLevel,
            questionType: this.currentQuestionType,
            totalQuestions: this.currentQuestions.length,
            correctAnswers: result.correct,
            bandScore: result.bandScore,
            timeSpent: timeSpent,
            passageTitle: this.currentPassage.title
        });

        // Show results
        this.showResults(result);

        // Track errors
        this.trackErrors(result);
    },

    /**
     * Calculate score
     */
    calculateScore() {
        let correct = 0;
        const details = [];

        this.currentQuestions.forEach((q, index) => {
            const userAnswer = this.userAnswers[q.id] || '';
            const isCorrect = Utils.compareAnswers(userAnswer, q.answer);
            
            if (isCorrect) {
                correct++;
            }

            details.push({
                question: q,
                userAnswer: userAnswer,
                isCorrect: isCorrect
            });
        });

        const bandScore = Utils.calculateBandScore(correct, this.currentQuestions.length);

        return {
            correct: correct,
            total: this.currentQuestions.length,
            percentage: Utils.calculatePercentage(correct, this.currentQuestions.length, 1),
            bandScore: bandScore,
            details: details
        };
    },

    /**
     * Show results modal - improved
     */
    showResults(result) {
        const emoji = result.bandScore >= 8.0 ? '🎉' : result.bandScore >= 7.0 ? '🌟' : result.bandScore >= 6.0 ? '👍' : '💪';
        const message = result.bandScore >= 8.0 ? 'Xuất sắc!' : result.bandScore >= 7.0 ? 'Rất tốt!' : result.bandScore >= 6.0 ? 'Tốt!' : 'Cố lên!';

        const overlay = document.createElement('div');
        overlay.className = 'result-overlay';
        overlay.innerHTML = `
            <div class="result-modal">
                <div class="result-icon">${emoji}</div>
                <h2>${message}</h2>
                <div class="result-score">${result.correct}/${result.total}</div>
                <div class="result-band">Band Score: <strong>${result.bandScore}</strong></div>
                <div class="result-details">
                    <p>Độ chính xác: <strong>${result.percentage}%</strong></p>
                    <p>Thời gian: <strong>${Utils.secondsToHoursMinutes(Math.floor((Date.now() - this.startTime) / 1000))}</strong></p>
                    <p>Sai: <strong>${result.total - result.correct} câu</strong></p>
                </div>
                <div class="result-actions">
                    <button class="btn btn-primary" onclick="Practice.reviewAnswers()">📝 Xem đáp án</button>
                    <button class="btn btn-success" onclick="Practice.tryAgain()">🔄 Làm lại</button>
                    <button class="btn btn-warning" onclick="this.closest('.result-overlay').remove()">Đóng</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    },

    /**
     * Review answers with AI explanation
     */
    reviewAnswers() {
        document.querySelector('.result-overlay').remove();
        
        this.currentQuestions.forEach((q, index) => {
            const item = document.querySelector(`[data-id="${q.id}"]`);
            const userAnswer = this.userAnswers[q.id] || '';
            const isCorrect = Utils.compareAnswers(userAnswer, q.answer);
            
            item.classList.add(isCorrect ? 'correct' : 'incorrect');
            
            // Add explanation with AI button
            const explanation = document.createElement('div');
            explanation.className = isCorrect ? 'answer-explanation correct' : 'answer-explanation incorrect';
            explanation.innerHTML = `
                <div><strong>Đáp án đúng:</strong> ${q.answer}</div>
                ${!isCorrect ? `<div><strong>Bạn trả lời:</strong> ${userAnswer || '(Không trả lời)'}</div>` : ''}
                <div><strong>Giải thích:</strong> ${q.explanation || 'Xem lại bài đọc để tìm thông tin.'}</div>
                ${!isCorrect ? `
                    <button class="btn btn-sm btn-primary" style="margin-top: 10px;" onclick="Practice.getAIExplanation(event, '${q.id}', ${index})">
                        🤖 AI giải thích chi tiết
                    </button>
                    <div id="ai-explanation-${index}" style="display: none;"></div>
                ` : ''}
            `;
            item.appendChild(explanation);
        });

        Utils.showNotification('Xem đáp án và giải thích bên dưới ⬇️', 'info', 3000);
    },

    /**
     * Get AI explanation for specific question - Using OpenAI
     */
    async getAIExplanation(e, questionId, questionIndex) {
        const question = this.currentQuestions.find(q => q.id === questionId);
        if (!question) return;

        const container = document.getElementById(`ai-explanation-${questionIndex}`);
        const btn = e ? e.target : (typeof event !== 'undefined' ? event.target : null);
        
        if (!container) return;

        // Check API key
        if (!window.Config || Config.OPENAI_API_KEY === 'YOUR_API_KEY_HERE') {
            container.style.display = 'block';
            container.innerHTML = '<p style="color: #dc3545; font-size: 13px;">⚠️ API Key chưa được cấu hình trong js/config.js</p>';
            return;
        }

        // Show loading
        btn.disabled = true;
        btn.textContent = '⏳ Đang tạo giải thích...';
        container.style.display = 'block';
        container.innerHTML = '<div class="spinner"></div><p style="font-size: 13px;">AI đang phân tích...</p>';

        try {
            const userAnswer = this.userAnswers[questionId] || 'No answer';
            const passageText = this.currentPassage.text;

            const prompt = `You are an IELTS Reading expert. Explain why the student got this question wrong.

PASSAGE EXCERPT:
${passageText.substring(0, 600)}...

QUESTION TYPE: ${question.type}
QUESTION: ${question.text}
STUDENT'S ANSWER: ${userAnswer}
CORRECT ANSWER: ${question.answer}

Provide explanation in Vietnamese with:
1. 🎯 **Tại sao đáp án đúng** - Cite specific evidence from passage
2. ❌ **Tại sao bạn sai** - Clear explanation of the mistake
3. 💡 **Mẹo tránh sai** - Specific tip for this question type
4. 📝 **Từ khóa quan trọng** - Key words to look for

Keep it concise, practical, and encouraging.`;

            const response = await fetch(Config.OPENAI_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${Config.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: Config.AI_MODEL,
                    messages: [
                        { role: "system", content: "You are an IELTS Reading expert explaining answers in Vietnamese." },
                        { role: "user", content: prompt }
                    ],
                    max_tokens: 800,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const explanation = data.choices[0].message.content;
                container.innerHTML = `
                    <div class="ai-explanation-box">
                        ${explanation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}
                    </div>
                `;
            } else {
                throw new Error('Invalid AI response');
            }

        } catch (error) {
            console.error('AI explanation error:', error);
            container.innerHTML = `<p style="color: #dc3545; font-size: 13px;">❌ Lỗi: ${error.message}</p>`;
        } finally {
            btn.textContent = '🤖 AI giải thích chi tiết';
            btn.disabled = false;
        }
    },

    /**
     * Try again
     */
    tryAgain() {
        document.querySelector('.result-overlay').remove();
        this.userAnswers = {};
        this.highlights = [];
        this.loadPassage(this.currentPassageIndex);
    },

    /**
     * Track errors
     */
    trackErrors(result) {
        result.details.forEach((detail, index) => {
            if (!detail.isCorrect) {
                ErrorTracker.addError({
                    questionType: detail.question.type,
                    questionNumber: index + 1,
                    question: detail.question.text,
                    userAnswer: detail.userAnswer,
                    correctAnswer: detail.question.answer,
                    level: this.currentLevel,
                    passage: this.currentPassage.title
                });
            }
        });
    },

    /**
     * Get question type name
     */
    getQuestionTypeName(type) {
        const names = {
            'full-test': 'Full Test',
            'tfng': 'True/False/Not Given',
            'ynng': 'Yes/No/Not Given',
            'multiple-choice': 'Multiple Choice',
            'matching-headings': 'Matching Headings',
            'matching-info': 'Matching Information',
            'matching-features': 'Matching Features',
            'summary': 'Summary Completion',
            'sentence': 'Sentence Completion',
            'diagram': 'Diagram Labelling'
        };
        return names[type] || type;
    },

    /**
     * Start practice with selected test - CRITICAL MISSING FUNCTION
     */
    startSelectedTest() {
        if (!this.selectedTestData) {
            Utils.showNotification('⚠️ Vui lòng chọn đề thi trước!', 'warning');
            return;
        }

        // Get timer mode
        const timerMode = document.querySelector('input[name="timerMode"]:checked')?.value || 'standard';
        
        // Set timer based on mode
        if (typeof Timer !== 'undefined') {
            switch (timerMode) {
                case 'standard':
                    Timer.setDuration(60 * 60); // 60 minutes
                    break;
                case 'relaxed':
                    Timer.setDuration(90 * 60); // 90 minutes
                    break;
                case 'unlimited':
                    Timer.setDuration(0); // No limit
                    break;
            }
        }

        // Start full test
        this.startFullTest();
        
        Utils.showNotification(`🚀 Bắt đầu ${this.selectedTestData.title}!`, 'success');
    },

    /**
     * Start fullscreen mode
     */
    startFullscreen() {
        if (!this.selectedTestData) {
            Utils.showNotification('⚠️ Vui lòng chọn đề thi trước!', 'warning');
            return;
        }

        // Try to use FullscreenPractice module if available
        if (typeof FullscreenPractice !== 'undefined') {
            FullscreenPractice.start(this.selectedTestData);
        } else {
            // Fallback: Enter browser fullscreen and start normal practice
            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen().then(() => {
                    this.startSelectedTest();
                }).catch(err => {
                    console.log('Fullscreen error:', err);
                    this.startSelectedTest();
                });
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
                this.startSelectedTest();
            } else {
                // Fullscreen not supported, just start normally
                this.startSelectedTest();
            }
        }
    },

    /**
     * Exit fullscreen mode
     */
    exitFullscreen() {
        if (document.fullscreenElement || document.webkitFullscreenElement) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
        
        // Handle custom fullscreen UI if exists
        const fsUI = document.getElementById('fullscreenMode');
        if (fsUI) {
            fsUI.style.display = 'none';
        }

        Utils.showNotification('Đã thoát chế độ toàn màn hình', 'info', 1000);
    },

    /**
     * Update question types grid based on selected test
     */
    updateQuestionTypesForTest() {
        if (!this.selectedTestData || !this.selectedTestData.passages) return;

        const grid = document.getElementById('questionTypesGrid');
        if (!grid) return;

        // Get all unique question types in the test
        const types = new Set();
        this.selectedTestData.passages.forEach(passage => {
            passage.questions.forEach(q => {
                types.add(q.type);
            });
        });

        // Always include full-test option
        const typeCards = [{
            type: 'full-test',
            icon: '📝',
            name: 'Full Test',
            desc: 'Làm toàn bộ đề'
        }];

        // Add available types
        types.forEach(type => {
            const typeInfo = this.getQuestionTypeInfo(type);
            if (typeInfo) {
                typeCards.push(typeInfo);
            }
        });

        grid.innerHTML = typeCards.map(t => `
            <div class="question-type-card" data-type="${t.type}" onclick="Practice.selectQuestionType('${t.type}')">
                <span class="type-icon">${t.icon}</span>
                <span class="type-name">${t.name}</span>
                <span class="type-desc">${t.desc}</span>
            </div>
        `).join('');

        // Update selected test name display
        const nameDisplay = document.getElementById('selectedTestName');
        if (nameDisplay) {
            nameDisplay.textContent = this.selectedTestData.title;
        }
    },

    /**
     * Get question type info
     */
    getQuestionTypeInfo(type) {
        const types = {
            'tfng': { type: 'tfng', icon: '✓✗', name: 'True/False/NG', desc: 'Xác định thông tin đúng/sai' },
            'ynng': { type: 'ynng', icon: '👍👎', name: 'Yes/No/NG', desc: 'Xác định quan điểm tác giả' },
            'multiple-choice': { type: 'multiple-choice', icon: 'ABCD', name: 'Multiple Choice', desc: 'Chọn đáp án đúng' },
            'summary': { type: 'summary', icon: '📝', name: 'Summary', desc: 'Điền từ vào tóm tắt' },
            'sentence': { type: 'sentence', icon: '✏️', name: 'Sentence Completion', desc: 'Hoàn thành câu' },
            'matching-headings': { type: 'matching-headings', icon: '🔗', name: 'Matching Headings', desc: 'Ghép tiêu đề đoạn văn' },
            'matching-info': { type: 'matching-info', icon: '📌', name: 'Matching Info', desc: 'Ghép thông tin với đoạn' },
            'diagram': { type: 'diagram', icon: '📊', name: 'Diagram', desc: 'Điền vào sơ đồ' }
        };
        return types[type] || null;
    },

    /**
     * Load custom test from file
     */
    loadCustomTest(testData) {
        this.selectedTestData = testData;
        this.selectedTestId = testData.id;
        this.currentLevel = testData.level || '7.0';
        
        // Auto select and start full test
        this.currentQuestionType = 'full-test';
        this.startFullTest();
    }
};

// Make Practice available globally
window.Practice = Practice;
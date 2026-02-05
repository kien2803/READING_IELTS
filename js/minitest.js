/* ==========================================
   Mini-Test Module
   Quick 15-minute practice sessions
   ========================================== */

const MiniTest = {
    currentMode: null,
    questions: [],
    answers: {},
    startTime: null,
    timerInterval: null,
    timeLimit: 15 * 60, // 15 minutes in seconds

    /**
     * Start a mini-test session
     * @param {string} mode - Test mode (random, tfng, matching, completion)
     */
    start(mode) {
        this.currentMode = mode;
        this.questions = [];
        this.answers = {};
        
        // Get questions based on mode
        this.questions = this.getQuestions(mode, 13);
        
        if (this.questions.length === 0) {
            Utils.showNotification('Không đủ câu hỏi cho Mini-Test. Hãy thêm đề thi!', 'warning');
            return;
        }

        // Start the mini-test
        this.renderTest();
        this.startTimer();
        
        Utils.showNotification(`Mini-Test ${this.getModeTitle(mode)} đã bắt đầu!`, 'success');
    },

    /**
     * Get questions for mini-test
     */
    getQuestions(mode, count) {
        const allTests = [...FileParser.getCustomTests(), ...this.getSampleQuestions()];
        let filteredQuestions = [];

        allTests.forEach(test => {
            if (test.passages) {
                test.passages.forEach(passage => {
                    passage.questions.forEach(q => {
                        if (mode === 'random' || this.matchesMode(q.type, mode)) {
                            filteredQuestions.push({
                                ...q,
                                passageTitle: passage.title,
                                passageText: passage.text.substring(0, 500)
                            });
                        }
                    });
                });
            }
        });

        // Shuffle and take required count
        return Utils.shuffle(filteredQuestions).slice(0, count);
    },

    /**
     * Check if question type matches mode
     */
    matchesMode(type, mode) {
        const modeTypes = {
            'tfng': ['tfng', 'ynng'],
            'matching': ['matching-headings', 'matching-info', 'matching-features'],
            'completion': ['summary', 'sentence', 'diagram']
        };
        return modeTypes[mode]?.includes(type) || false;
    },

    /**
     * Get sample questions for mini-test
     */
    getSampleQuestions() {
        return [{
            id: 'sample-minitest-1',
            passages: [{
                title: 'Climate Change Effects',
                text: 'Climate change is affecting ecosystems worldwide. Rising temperatures are causing glaciers to melt at unprecedented rates, leading to rising sea levels that threaten coastal communities.',
                questions: [
                    { id: 'mt1', type: 'tfng', text: 'Glaciers are melting faster than before.', answer: 'True', explanation: 'The passage states glaciers are melting at "unprecedented rates".' },
                    { id: 'mt2', type: 'tfng', text: 'Coastal communities are safe from rising sea levels.', answer: 'False', explanation: 'The passage says rising sea levels "threaten coastal communities".' },
                    { id: 'mt3', type: 'tfng', text: 'Climate change only affects polar regions.', answer: 'Not Given', explanation: 'The passage mentions "ecosystems worldwide" but does not specifically say it only affects polar regions.' }
                ]
            }]
        }];
    },

    /**
     * Render mini-test UI
     */
    renderTest() {
        const container = document.getElementById('minitest');
        if (!container) return;

        container.innerHTML = `
            <div class="section-header">
                <h2>⏱️ Mini-Test: ${this.getModeTitle(this.currentMode)}</h2>
                <p class="section-subtitle">13 câu hỏi trong 15 phút</p>
            </div>

            <div class="card minitest-active">
                <div class="minitest-header">
                    <div class="minitest-timer" id="minitestTimer">15:00</div>
                    <div class="minitest-progress">
                        <span id="minitestProgress">0</span>/13 đã trả lời
                    </div>
                    <button class="btn btn-danger" onclick="MiniTest.submit()">📤 Nộp bài</button>
                </div>

                <div class="minitest-questions" id="minitestQuestions">
                    ${this.questions.map((q, i) => this.renderQuestion(q, i)).join('')}
                </div>
            </div>
        `;

        this.bindEvents();
    },

    /**
     * Render individual question
     */
    renderQuestion(question, index) {
        const options = this.getOptionsForType(question.type);
        
        return `
            <div class="minitest-question" data-id="${question.id}">
                <div class="question-number">${index + 1}</div>
                <div class="question-content">
                    <p class="question-text">${question.text}</p>
                    ${question.passageTitle ? `<span class="question-source">From: ${question.passageTitle}</span>` : ''}
                    <div class="question-options">
                        ${options.map(opt => `
                            <label class="option-item">
                                <input type="radio" name="q_${question.id}" value="${opt}">
                                <span class="option-label">${opt}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Get options based on question type
     */
    getOptionsForType(type) {
        if (type === 'tfng') return ['True', 'False', 'Not Given'];
        if (type === 'ynng') return ['Yes', 'No', 'Not Given'];
        return ['A', 'B', 'C', 'D'];
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        document.querySelectorAll('.minitest-question input').forEach(input => {
            input.addEventListener('change', (e) => {
                const questionId = e.target.name.replace('q_', '');
                this.answers[questionId] = e.target.value;
                this.updateProgress();
                
                // Mark question as answered
                e.target.closest('.minitest-question').classList.add('answered');
            });
        });
    },

    /**
     * Update progress display
     */
    updateProgress() {
        const progressEl = document.getElementById('minitestProgress');
        if (progressEl) {
            progressEl.textContent = Object.keys(this.answers).length;
        }
    },

    /**
     * Start timer
     */
    startTimer() {
        this.startTime = Date.now();
        let remaining = this.timeLimit;

        this.timerInterval = setInterval(() => {
            remaining--;
            const minutes = Math.floor(remaining / 60);
            const seconds = remaining % 60;
            
            const timerEl = document.getElementById('minitestTimer');
            if (timerEl) {
                timerEl.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                
                if (remaining <= 60) {
                    timerEl.classList.add('danger');
                } else if (remaining <= 180) {
                    timerEl.classList.add('warning');
                }
            }

            if (remaining <= 0) {
                this.submit();
            }
        }, 1000);
    },

    /**
     * Submit mini-test
     */
    submit() {
        clearInterval(this.timerInterval);
        
        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
        const result = this.calculateScore();
        
        // Save result
        this.saveResult(result, timeSpent);
        
        // Show results
        this.showResults(result, timeSpent);
    },

    /**
     * Calculate score
     */
    calculateScore() {
        let correct = 0;
        const details = [];

        this.questions.forEach(q => {
            const userAnswer = this.answers[q.id] || '';
            const isCorrect = Utils.compareAnswers(userAnswer, q.answer);
            
            if (isCorrect) correct++;
            
            details.push({
                question: q,
                userAnswer,
                isCorrect
            });
        });

        return {
            correct,
            total: this.questions.length,
            percentage: Math.round((correct / this.questions.length) * 100),
            details
        };
    },

    /**
     * Save result to storage
     */
    saveResult(result, timeSpent) {
        const history = Storage.get('minitest_history') || [];
        history.unshift({
            id: Utils.generateId(),
            mode: this.currentMode,
            correct: result.correct,
            total: result.total,
            percentage: result.percentage,
            timeSpent,
            timestamp: new Date().toISOString()
        });
        Storage.set('minitest_history', history.slice(0, 50)); // Keep last 50

        // Add to activity
        Storage.addActivity({
            type: 'minitest_completed',
            description: `Mini-Test ${this.getModeTitle(this.currentMode)}: ${result.correct}/${result.total} (${result.percentage}%)`
        });
    },

    /**
     * Show results modal
     */
    showResults(result, timeSpent) {
        const emoji = result.percentage >= 80 ? '🎉' : result.percentage >= 60 ? '👍' : '💪';
        const message = result.percentage >= 80 ? 'Xuất sắc!' : result.percentage >= 60 ? 'Tốt lắm!' : 'Cố gắng thêm!';

        const modal = document.createElement('div');
        modal.className = 'result-overlay';
        modal.innerHTML = `
            <div class="result-modal">
                <div class="result-icon">${emoji}</div>
                <h2>${message}</h2>
                <div class="result-score">${result.correct}/${result.total}</div>
                <div class="result-band">${result.percentage}% đúng</div>
                <div class="result-details">
                    <p>Thời gian: <strong>${Utils.secondsToHoursMinutes(timeSpent)}</strong></p>
                    <p>Mode: <strong>${this.getModeTitle(this.currentMode)}</strong></p>
                </div>
                <div class="result-actions">
                    <button class="btn btn-primary" onclick="MiniTest.reviewAnswers()">📝 Xem đáp án</button>
                    <button class="btn btn-success" onclick="MiniTest.start('${this.currentMode}')">🔄 Làm lại</button>
                    <button class="btn btn-ghost" onclick="App.switchTab('minitest'); this.closest('.result-overlay').remove();">Đóng</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    /**
     * Review answers with explanations
     */
    reviewAnswers() {
        document.querySelector('.result-overlay')?.remove();
        
        const result = this.calculateScore();
        
        result.details.forEach((detail, i) => {
            const questionEl = document.querySelector(`[data-id="${detail.question.id}"]`);
            if (questionEl) {
                questionEl.classList.add(detail.isCorrect ? 'correct' : 'incorrect');
                
                // Add explanation
                const explanation = document.createElement('div');
                explanation.className = `answer-explanation ${detail.isCorrect ? 'correct' : 'incorrect'}`;
                explanation.innerHTML = `
                    <div><strong>Đáp án đúng:</strong> ${detail.question.answer}</div>
                    ${!detail.isCorrect ? `<div><strong>Bạn trả lời:</strong> ${detail.userAnswer || '(Chưa trả lời)'}</div>` : ''}
                    <div><strong>Giải thích:</strong> ${detail.question.explanation || 'N/A'}</div>
                `;
                questionEl.appendChild(explanation);
            }
        });

        Utils.showNotification('Xem đáp án và giải thích bên dưới', 'info');
    },

    /**
     * Get mode title
     */
    getModeTitle(mode) {
        const titles = {
            'random': 'Random Mix',
            'tfng': 'T/F/NG Focus',
            'matching': 'Matching Focus',
            'completion': 'Completion Focus'
        };
        return titles[mode] || mode;
    },

    /**
     * Render history
     */
    renderHistory() {
        const container = document.getElementById('minitestHistory');
        if (!container) return;

        const history = Storage.get('minitest_history') || [];
        
        if (history.length === 0) {
            container.innerHTML = '<p class="empty-state">Chưa có kết quả Mini-Test nào</p>';
            return;
        }

        container.innerHTML = history.slice(0, 10).map(item => `
            <div class="history-item">
                <div class="history-info">
                    <span class="history-mode">${this.getModeTitle(item.mode)}</span>
                    <span class="history-time">${Utils.formatDate(item.timestamp)}</span>
                </div>
                <div class="history-score ${item.percentage >= 80 ? 'good' : item.percentage >= 60 ? 'medium' : 'poor'}">
                    ${item.correct}/${item.total} (${item.percentage}%)
                </div>
            </div>
        `).join('');
    }
};

// Make MiniTest available globally
window.MiniTest = MiniTest;

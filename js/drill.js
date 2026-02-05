/* ==========================================
   Drill Mode Module
   Intensive practice on specific question types
   ========================================== */

const Drill = {
    currentType: null,
    questions: [],
    currentIndex: 0,
    answers: {},
    stats: {},
    isActive: false,

    /**
     * Start drill mode for a specific question type
     * @param {string} type - Question type to drill
     */
    start(type) {
        this.currentType = type;
        this.questions = this.getQuestionsOfType(type);
        this.currentIndex = 0;
        this.answers = {};
        this.isActive = true;

        if (this.questions.length === 0) {
            Utils.showNotification(`Không tìm thấy câu hỏi dạng ${this.getTypeName(type)}. Hãy thêm đề thi!`, 'warning');
            return;
        }

        // Shuffle questions
        this.questions = Utils.shuffle(this.questions);

        this.renderDrill();
        Utils.showNotification(`Drill Mode: ${this.getTypeName(type)} - ${this.questions.length} câu`, 'success');
    },

    /**
     * Get all questions of a specific type
     */
    getQuestionsOfType(type) {
        const allTests = [...FileParser.getCustomTests(), ...this.getSampleDrillQuestions()];
        const questions = [];

        allTests.forEach(test => {
            if (test.passages) {
                test.passages.forEach(passage => {
                    passage.questions.forEach(q => {
                        if (q.type === type) {
                            questions.push({
                                ...q,
                                passageTitle: passage.title,
                                passageText: passage.text
                            });
                        }
                    });
                });
            }
        });

        return questions;
    },

    /**
     * Sample drill questions
     */
    getSampleDrillQuestions() {
        return [{
            id: 'drill-sample-1',
            passages: [{
                title: 'The Digital Revolution',
                text: `The digital revolution has transformed nearly every aspect of modern life. From how we communicate and work to how we shop and entertain ourselves, digital technology has become deeply embedded in our daily routines.

One of the most significant changes has been in the workplace. Remote work, once considered unusual, has become commonplace for millions of workers worldwide. Video conferencing tools have replaced many face-to-face meetings, while cloud computing has made it possible to access work files from anywhere in the world.

The education sector has also undergone dramatic changes. Online learning platforms have made education accessible to people who might otherwise not have the opportunity to study. Students can now take courses from prestigious universities without leaving their homes.

However, the digital revolution has also raised concerns about privacy, mental health, and the growing digital divide between those who have access to technology and those who do not.`,
                questions: [
                    { id: 'dr1', type: 'tfng', text: 'Remote work was common before the digital revolution.', answer: 'False', explanation: 'The passage states remote work was "once considered unusual".' },
                    { id: 'dr2', type: 'tfng', text: 'Cloud computing allows people to access files from anywhere.', answer: 'True', explanation: 'The passage explicitly states this.' },
                    { id: 'dr3', type: 'tfng', text: 'All universities now offer online courses.', answer: 'Not Given', explanation: 'The passage mentions online courses from "prestigious universities" but does not say all universities offer them.' },
                    { id: 'dr4', type: 'ynng', text: 'The author believes the digital revolution has been entirely positive.', answer: 'No', explanation: 'The author mentions concerns about privacy, mental health, and digital divide.' },
                    { id: 'dr5', type: 'multiple-choice', text: 'What has replaced many face-to-face meetings?', answer: 'Video conferencing tools', options: ['Email', 'Video conferencing tools', 'Phone calls', 'Text messages'], explanation: 'The passage states video conferencing tools have replaced many face-to-face meetings.' },
                    { id: 'dr6', type: 'summary', text: 'The digital revolution has made _______ accessible to more people.', answer: 'education', wordLimit: 1, explanation: 'The passage discusses how online learning has made education accessible.' }
                ]
            }]
        }];
    },

    /**
     * Render drill interface
     */
    renderDrill() {
        const container = document.getElementById('drill');
        if (!container) return;

        const currentQ = this.questions[this.currentIndex];
        const progress = this.currentIndex + 1;
        const total = this.questions.length;

        container.innerHTML = `
            <div class="section-header">
                <h2>🔥 Drill: ${this.getTypeName(this.currentType)}</h2>
                <p class="section-subtitle">Luyện tập chuyên sâu từng dạng bài</p>
            </div>

            <div class="card drill-active">
                <div class="drill-header">
                    <div class="drill-progress">
                        <span class="progress-text">${progress}/${total}</span>
                        <div class="progress-bar small">
                            <div class="progress-fill" style="width: ${(progress/total)*100}%"></div>
                        </div>
                    </div>
                    <div class="drill-stats-display">
                        <span class="stat correct">✓ ${this.getCorrectCount()}</span>
                        <span class="stat incorrect">✗ ${this.getIncorrectCount()}</span>
                    </div>
                    <button class="btn btn-danger btn-sm" onclick="Drill.exit()">✕ Thoát</button>
                </div>

                <div class="drill-passage">
                    <h4>${currentQ.passageTitle}</h4>
                    <p>${currentQ.passageText}</p>
                </div>

                <div class="drill-question">
                    <div class="question-type-badge">${this.getTypeName(currentQ.type)}</div>
                    <p class="question-text"><strong>Question ${progress}:</strong> ${currentQ.text}</p>
                    
                    ${this.renderAnswerInput(currentQ)}
                </div>

                <div class="drill-actions">
                    <button class="btn btn-primary btn-large" id="checkAnswerBtn" onclick="Drill.checkAnswer()">
                        ✓ Kiểm tra đáp án
                    </button>
                </div>

                <div class="drill-explanation" id="drillExplanation" style="display: none;"></div>
            </div>
        `;
    },

    /**
     * Render answer input based on question type
     */
    renderAnswerInput(question) {
        if (question.type === 'tfng') {
            return `
                <div class="answer-options">
                    <label class="option-large"><input type="radio" name="drillAnswer" value="True"> True</label>
                    <label class="option-large"><input type="radio" name="drillAnswer" value="False"> False</label>
                    <label class="option-large"><input type="radio" name="drillAnswer" value="Not Given"> Not Given</label>
                </div>
            `;
        } else if (question.type === 'ynng') {
            return `
                <div class="answer-options">
                    <label class="option-large"><input type="radio" name="drillAnswer" value="Yes"> Yes</label>
                    <label class="option-large"><input type="radio" name="drillAnswer" value="No"> No</label>
                    <label class="option-large"><input type="radio" name="drillAnswer" value="Not Given"> Not Given</label>
                </div>
            `;
        } else if (question.type === 'multiple-choice' && question.options) {
            return `
                <div class="answer-options">
                    ${question.options.map((opt, i) => `
                        <label class="option-large">
                            <input type="radio" name="drillAnswer" value="${opt}">
                            ${String.fromCharCode(65 + i)}. ${opt}
                        </label>
                    `).join('')}
                </div>
            `;
        } else {
            return `
                <div class="answer-input-container">
                    ${question.wordLimit ? `<p class="word-limit">Write NO MORE THAN ${question.wordLimit} word(s)</p>` : ''}
                    <input type="text" id="drillAnswerInput" class="input drill-input" placeholder="Type your answer...">
                </div>
            `;
        }
    },

    /**
     * Check the current answer
     */
    checkAnswer() {
        const currentQ = this.questions[this.currentIndex];
        let userAnswer;

        // Get answer based on input type
        const radioInput = document.querySelector('input[name="drillAnswer"]:checked');
        const textInput = document.getElementById('drillAnswerInput');

        if (radioInput) {
            userAnswer = radioInput.value;
        } else if (textInput) {
            userAnswer = textInput.value.trim();
        } else {
            Utils.showNotification('Vui lòng chọn hoặc nhập đáp án', 'warning');
            return;
        }

        const isCorrect = Utils.compareAnswers(userAnswer, currentQ.answer);
        
        // Store answer
        this.answers[currentQ.id] = {
            userAnswer,
            isCorrect,
            question: currentQ
        };

        // Update stats
        this.updateStats(currentQ.type, isCorrect);

        // Show explanation
        this.showExplanation(currentQ, userAnswer, isCorrect);
    },

    /**
     * Show explanation after checking answer
     */
    showExplanation(question, userAnswer, isCorrect) {
        const explanationDiv = document.getElementById('drillExplanation');
        const checkBtn = document.getElementById('checkAnswerBtn');
        
        if (explanationDiv) {
            explanationDiv.style.display = 'block';
            explanationDiv.className = `drill-explanation ${isCorrect ? 'correct' : 'incorrect'}`;
            explanationDiv.innerHTML = `
                <div class="explanation-header">
                    <span class="result-icon">${isCorrect ? '✓ Đúng!' : '✗ Sai!'}</span>
                </div>
                <div class="explanation-content">
                    <p><strong>Đáp án đúng:</strong> ${question.answer}</p>
                    ${!isCorrect ? `<p><strong>Bạn trả lời:</strong> ${userAnswer}</p>` : ''}
                    <p><strong>Giải thích:</strong> ${question.explanation || 'N/A'}</p>
                </div>
            `;
        }

        if (checkBtn) {
            checkBtn.style.display = 'none';
        }

        // Show next button
        const actionsDiv = document.querySelector('.drill-actions');
        if (actionsDiv) {
            actionsDiv.innerHTML = `
                ${this.currentIndex < this.questions.length - 1 ? 
                    `<button class="btn btn-success btn-large" onclick="Drill.next()">➡️ Câu tiếp theo</button>` :
                    `<button class="btn btn-primary btn-large" onclick="Drill.finish()">🏁 Hoàn thành</button>`
                }
            `;
        }

        // Disable inputs
        document.querySelectorAll('.drill-question input').forEach(input => {
            input.disabled = true;
        });
    },

    /**
     * Go to next question
     */
    next() {
        this.currentIndex++;
        this.renderDrill();
    },

    /**
     * Finish drill session
     */
    finish() {
        const correct = this.getCorrectCount();
        const total = Object.keys(this.answers).length;
        const percentage = Math.round((correct / total) * 100);

        // Save drill result
        Storage.addActivity({
            type: 'drill_completed',
            description: `Drill ${this.getTypeName(this.currentType)}: ${correct}/${total} (${percentage}%)`
        });

        // Save stats
        this.saveDrillStats();

        // Show completion modal
        const modal = document.createElement('div');
        modal.className = 'result-overlay';
        modal.innerHTML = `
            <div class="result-modal">
                <div class="result-icon">🔥</div>
                <h2>Drill hoàn thành!</h2>
                <div class="result-score">${correct}/${total}</div>
                <div class="result-band">${percentage}% đúng</div>
                <div class="result-details">
                    <p>Dạng bài: <strong>${this.getTypeName(this.currentType)}</strong></p>
                </div>
                <div class="result-actions">
                    <button class="btn btn-success" onclick="Drill.start('${this.currentType}'); this.closest('.result-overlay').remove();">🔄 Drill tiếp</button>
                    <button class="btn btn-ghost" onclick="App.switchTab('drill'); this.closest('.result-overlay').remove();">Xong</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        this.isActive = false;
    },

    /**
     * Exit drill mode
     */
    exit() {
        if (confirm('Bạn có chắc muốn thoát? Tiến độ sẽ không được lưu.')) {
            this.isActive = false;
            App.switchTab('drill');
        }
    },

    /**
     * Update stats for question type
     */
    updateStats(type, isCorrect) {
        const stats = Storage.get('drill_stats') || {};
        
        if (!stats[type]) {
            stats[type] = { total: 0, correct: 0 };
        }
        
        stats[type].total++;
        if (isCorrect) stats[type].correct++;
        
        Storage.set('drill_stats', stats);
    },

    /**
     * Save drill stats
     */
    saveDrillStats() {
        const stats = Storage.get('drill_stats') || {};
        // Already updated in updateStats
    },

    /**
     * Get correct count from current session
     */
    getCorrectCount() {
        return Object.values(this.answers).filter(a => a.isCorrect).length;
    },

    /**
     * Get incorrect count from current session
     */
    getIncorrectCount() {
        return Object.values(this.answers).filter(a => !a.isCorrect).length;
    },

    /**
     * Get question type display name
     */
    getTypeName(type) {
        const names = {
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
     * Render drill stats on the drill tab
     */
    renderStats() {
        const stats = Storage.get('drill_stats') || {};
        
        const types = ['tfng', 'ynng', 'matching-headings', 'multiple-choice', 'summary', 'sentence'];
        
        types.forEach(type => {
            const el = document.getElementById(`drillAcc${this.getStatsId(type)}`);
            if (el && stats[type]) {
                const accuracy = Math.round((stats[type].correct / stats[type].total) * 100);
                el.textContent = `${accuracy}% (${stats[type].total})`;
            }
        });
    },

    /**
     * Get stats element ID suffix
     */
    getStatsId(type) {
        const ids = {
            'tfng': 'Tfng',
            'ynng': 'Ynng',
            'matching-headings': 'Headings',
            'multiple-choice': 'Mc',
            'summary': 'Summary',
            'sentence': 'Sentence'
        };
        return ids[type] || type;
    }
};

// Make Drill available globally
window.Drill = Drill;

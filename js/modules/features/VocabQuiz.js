/* ==========================================
   Vocabulary Quiz Module
   Test vocabulary retention with various quiz modes
   ========================================== */

const VocabQuiz = {
    // Current state
    currentQuiz: [],
    currentQuestionIndex: 0,
    userAnswers: [],
    quizMode: 'multiple-choice', // 'multiple-choice' | 'typing' | 'mixed'
    score: 0,
    startTime: null,

    /**
     * Initialize quiz module
     */
    init() {
        this.bindEvents();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Submit answer button
        const submitBtn = document.getElementById('quizSubmitAnswer');
        if (submitBtn) {
            submitBtn.addEventListener('click', () => this.submitAnswer());
        }

        // Next question button
        const nextBtn = document.getElementById('quizNextQuestion');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextQuestion());
        }
    },

    /**
     * Start vocabulary quiz
     * @param {string} mode - 'multiple-choice' | 'typing' | 'mixed'
     * @param {number} count - Number of questions
     */
    start(mode = 'multiple-choice', count = 10) {
        const vocabulary = Storage.getVocabulary();
        
        if (vocabulary.length === 0) {
            Utils.showNotification('Chưa có từ vựng nào để kiểm tra!', 'warning');
            return;
        }

        // Select random words for quiz
        const selectedWords = Utils.shuffleArray(vocabulary).slice(0, Math.min(count, vocabulary.length));
        
        // Generate quiz questions
        this.currentQuiz = selectedWords.map(word => this.generateQuestion(word, vocabulary, mode));
        this.currentQuestionIndex = 0;
        this.userAnswers = [];
        this.score = 0;
        this.quizMode = mode;
        this.startTime = Date.now();

        // Show quiz section
        this.showQuizSection();
        this.renderQuestion();

        Utils.showNotification(`Bắt đầu kiểm tra ${this.currentQuiz.length} từ vựng`, 'success');
        
        Storage.addActivity({
            type: 'vocab_quiz_started',
            description: `Bắt đầu quiz ${mode} - ${this.currentQuiz.length} câu`
        });
    },

    /**
     * Generate a quiz question
     * @param {Object} word - Target word
     * @param {Array} allWords - All available words for distractors
     * @param {string} mode - Quiz mode
     */
    generateQuestion(word, allWords, mode) {
        const questionMode = mode === 'mixed' 
            ? (Math.random() > 0.5 ? 'multiple-choice' : 'typing')
            : mode;

        const question = {
            id: word.id,
            word: word.word,
            correctAnswer: word.meaning,
            type: questionMode,
            phonetic: word.phonetic || ''
        };

        if (questionMode === 'multiple-choice') {
            // Generate 3 wrong answers
            const wrongAnswers = allWords
                .filter(w => w.id !== word.id)
                .map(w => w.meaning)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);

            // Combine and shuffle
            question.choices = Utils.shuffleArray([
                word.meaning,
                ...wrongAnswers
            ]);
        }

        return question;
    },

    /**
     * Show quiz section
     */
    showQuizSection() {
        // Hide vocabulary list
        const vocabSection = document.querySelector('#vocabulary .vocab-list-container');
        if (vocabSection) vocabSection.style.display = 'none';

        const addForm = document.querySelector('#vocabulary .card');
        if (addForm) addForm.style.display = 'none';

        // Hide flashcard if visible
        const flashcardSection = document.getElementById('flashcardSection');
        if (flashcardSection) flashcardSection.style.display = 'none';

        // Show quiz section
        let quizSection = document.getElementById('quizSection');
        if (!quizSection) {
            const container = document.querySelector('#vocabulary');
            quizSection = document.createElement('div');
            quizSection.id = 'quizSection';
            quizSection.className = 'quiz-section';
            container.appendChild(quizSection);
        }
        quizSection.style.display = 'block';
        quizSection.innerHTML = this.getQuizHTML();
        
        // Re-bind events
        this.bindEvents();
    },

    /**
     * Hide quiz section
     */
    hideQuizSection() {
        const quizSection = document.getElementById('quizSection');
        if (quizSection) quizSection.style.display = 'none';

        const vocabSection = document.querySelector('#vocabulary .vocab-list-container');
        if (vocabSection) vocabSection.style.display = 'block';

        const addForm = document.querySelector('#vocabulary .card');
        if (addForm) addForm.style.display = 'block';
    },

    /**
     * Get quiz section HTML
     */
    getQuizHTML() {
        return `
            <div class="card quiz-container">
                <div class="card-header">
                    <h3>📝 Kiểm tra từ vựng</h3>
                    <div class="quiz-actions">
                        <button class="btn btn-sm btn-danger" onclick="VocabQuiz.exit()">✕ Thoát</button>
                    </div>
                </div>
                
                <div class="quiz-progress">
                    <div class="progress-info">
                        <span id="quizProgress">1 / 10</span>
                        <span class="quiz-score">Điểm: <span id="quizScore">0</span></span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="quizProgressBar" style="width: 0%"></div>
                    </div>
                </div>

                <div class="quiz-question-container" id="quizQuestionContainer">
                    <!-- Question will be rendered here -->
                </div>

                <div class="quiz-feedback" id="quizFeedback" style="display: none;">
                    <!-- Feedback will be shown here -->
                </div>

                <div class="quiz-navigation">
                    <button class="btn btn-primary" id="quizSubmitAnswer">
                        Kiểm tra đáp án
                    </button>
                    <button class="btn btn-success" id="quizNextQuestion" style="display: none;">
                        Câu tiếp theo →
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Render current question
     */
    renderQuestion() {
        const container = document.getElementById('quizQuestionContainer');
        if (!container) return;

        const question = this.currentQuiz[this.currentQuestionIndex];
        
        let questionHTML = `
            <div class="quiz-question">
                <div class="question-number">Câu ${this.currentQuestionIndex + 1}/${this.currentQuiz.length}</div>
                <div class="question-word">
                    ${question.word}
                    ${question.phonetic ? `<span class="question-phonetic">/${question.phonetic}/</span>` : ''}
                </div>
                <div class="question-prompt">Nghĩa của từ này là gì?</div>
        `;

        if (question.type === 'multiple-choice') {
            questionHTML += '<div class="quiz-choices">';
            question.choices.forEach((choice, index) => {
                questionHTML += `
                    <label class="quiz-choice">
                        <input type="radio" name="quizAnswer" value="${choice}">
                        <span class="choice-text">${choice}</span>
                    </label>
                `;
            });
            questionHTML += '</div>';
        } else {
            questionHTML += `
                <div class="quiz-typing">
                    <input type="text" id="quizTypingAnswer" class="input" placeholder="Nhập nghĩa của từ..." autofocus>
                </div>
            `;
        }

        questionHTML += '</div>';
        container.innerHTML = questionHTML;

        // Add enter key listener for typing mode
        if (question.type === 'typing') {
            const input = document.getElementById('quizTypingAnswer');
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.submitAnswer();
                });
            }
        }

        // Reset feedback
        const feedbackEl = document.getElementById('quizFeedback');
        if (feedbackEl) feedbackEl.style.display = 'none';

        // Show submit button, hide next button
        const submitBtn = document.getElementById('quizSubmitAnswer');
        const nextBtn = document.getElementById('quizNextQuestion');
        if (submitBtn) submitBtn.style.display = 'block';
        if (nextBtn) nextBtn.style.display = 'none';

        this.updateProgress();
    },

    /**
     * Submit current answer
     */
    submitAnswer() {
        const question = this.currentQuiz[this.currentQuestionIndex];
        let userAnswer = '';

        if (question.type === 'multiple-choice') {
            const selected = document.querySelector('input[name="quizAnswer"]:checked');
            if (!selected) {
                Utils.showNotification('Vui lòng chọn đáp án!', 'warning');
                return;
            }
            userAnswer = selected.value;
        } else {
            const input = document.getElementById('quizTypingAnswer');
            if (!input || !input.value.trim()) {
                Utils.showNotification('Vui lòng nhập đáp án!', 'warning');
                return;
            }
            userAnswer = input.value.trim();
        }

        // Check answer
        const isCorrect = this.checkAnswer(userAnswer, question.correctAnswer);
        
        this.userAnswers.push({
            question: question.word,
            userAnswer: userAnswer,
            correctAnswer: question.correctAnswer,
            isCorrect: isCorrect
        });

        if (isCorrect) {
            this.score++;
        }

        // Show feedback
        this.showFeedback(isCorrect, question.correctAnswer);

        // Update mastery level in storage
        Storage.updateVocabulary(question.id, {
            reviewCount: ((Storage.getVocabulary().find(v => v.id === question.id)?.reviewCount || 0) + 1),
            masteryLevel: isCorrect 
                ? Math.min(5, ((Storage.getVocabulary().find(v => v.id === question.id)?.masteryLevel || 0) + 1))
                : Math.max(0, ((Storage.getVocabulary().find(v => v.id === question.id)?.masteryLevel || 0) - 1)),
            lastReviewed: new Date().toISOString()
        });

        // Hide submit, show next
        const submitBtn = document.getElementById('quizSubmitAnswer');
        const nextBtn = document.getElementById('quizNextQuestion');
        if (submitBtn) submitBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'block';

        this.updateProgress();
    },

    /**
     * Check if answer is correct
     */
    checkAnswer(userAnswer, correctAnswer) {
        // Normalize both strings for comparison
        const normalize = (str) => Utils.normalizeText(str.toLowerCase());
        return normalize(userAnswer) === normalize(correctAnswer);
    },

    /**
     * Show answer feedback
     */
    showFeedback(isCorrect, correctAnswer) {
        const feedbackEl = document.getElementById('quizFeedback');
        if (!feedbackEl) return;

        feedbackEl.className = `quiz-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
        feedbackEl.innerHTML = `
            <div class="feedback-icon">${isCorrect ? '✅' : '❌'}</div>
            <div class="feedback-message">
                ${isCorrect ? 'Chính xác!' : 'Chưa đúng'}
            </div>
            ${!isCorrect ? `<div class="feedback-answer">Đáp án đúng: <strong>${correctAnswer}</strong></div>` : ''}
        `;
        feedbackEl.style.display = 'block';
    },

    /**
     * Move to next question
     */
    nextQuestion() {
        if (this.currentQuestionIndex < this.currentQuiz.length - 1) {
            this.currentQuestionIndex++;
            this.renderQuestion();
        } else {
            this.showResults();
        }
    },

    /**
     * Update progress display
     */
    updateProgress() {
        const progressEl = document.getElementById('quizProgress');
        const progressBarEl = document.getElementById('quizProgressBar');
        const scoreEl = document.getElementById('quizScore');

        if (progressEl) {
            progressEl.textContent = `${this.currentQuestionIndex + 1} / ${this.currentQuiz.length}`;
        }

        if (progressBarEl) {
            const progress = ((this.currentQuestionIndex + 1) / this.currentQuiz.length) * 100;
            progressBarEl.style.width = `${progress}%`;
        }

        if (scoreEl) {
            scoreEl.textContent = this.score;
        }
    },

    /**
     * Show quiz results
     */
    showResults() {
        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
        const accuracy = (this.score / this.currentQuiz.length * 100).toFixed(1);
        
        const container = document.getElementById('quizQuestionContainer');
        if (!container) return;

        container.innerHTML = `
            <div class="quiz-results">
                <div class="results-icon">🎉</div>
                <h3>Hoàn thành bài kiểm tra!</h3>
                
                <div class="results-stats">
                    <div class="stat-item">
                        <div class="stat-value">${this.score}/${this.currentQuiz.length}</div>
                        <div class="stat-label">Câu đúng</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${accuracy}%</div>
                        <div class="stat-label">Độ chính xác</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${Utils.secondsToMinutesSeconds(timeSpent)}</div>
                        <div class="stat-label">Thời gian</div>
                    </div>
                </div>

                <div class="results-feedback">
                    ${this.getResultsFeedback(accuracy)}
                </div>

                <div class="results-actions">
                    <button class="btn btn-primary" onclick="VocabQuiz.reviewWrongAnswers()">
                        📋 Xem câu sai
                    </button>
                    <button class="btn btn-success" onclick="VocabQuiz.start('${this.quizMode}', ${this.currentQuiz.length})">
                        🔄 Làm lại
                    </button>
                    <button class="btn btn-secondary" onclick="VocabQuiz.exit()">
                        ✕ Thoát
                    </button>
                </div>
            </div>
        `;

        // Hide navigation buttons
        const submitBtn = document.getElementById('quizSubmitAnswer');
        const nextBtn = document.getElementById('quizNextQuestion');
        if (submitBtn) submitBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';

        // Hide feedback
        const feedbackEl = document.getElementById('quizFeedback');
        if (feedbackEl) feedbackEl.style.display = 'none';

        // Save to activity
        Storage.addActivity({
            type: 'vocab_quiz_completed',
            description: `Hoàn thành quiz - ${this.score}/${this.currentQuiz.length} đúng (${accuracy}%)`
        });
    },

    /**
     * Get results feedback message
     */
    getResultsFeedback(accuracy) {
        if (accuracy >= 90) {
            return '🌟 Xuất sắc! Bạn đã nắm vững từ vựng!';
        } else if (accuracy >= 70) {
            return '👍 Khá tốt! Tiếp tục cố gắng!';
        } else if (accuracy >= 50) {
            return '💪 Cần cải thiện thêm. Hãy ôn luyện nhiều hơn!';
        } else {
            return '📚 Hãy dành thêm thời gian ôn tập từ vựng nhé!';
        }
    },

    /**
     * Review wrong answers
     */
    reviewWrongAnswers() {
        const wrongAnswers = this.userAnswers.filter(a => !a.isCorrect);
        
        if (wrongAnswers.length === 0) {
            Utils.showNotification('Bạn đã làm đúng tất cả!', 'success');
            return;
        }

        const container = document.getElementById('quizQuestionContainer');
        if (!container) return;

        let html = `
            <div class="wrong-answers-review">
                <h3>📋 Các câu trả lời sai</h3>
                <p class="review-hint">Hãy xem lại và ghi nhớ những từ này:</p>
                <div class="wrong-answers-list">
        `;

        wrongAnswers.forEach((answer, index) => {
            html += `
                <div class="wrong-answer-item">
                    <div class="wrong-answer-number">${index + 1}</div>
                    <div class="wrong-answer-content">
                        <div class="wrong-answer-word">${answer.question}</div>
                        <div class="wrong-answer-user">Bạn trả lời: <span class="incorrect-text">${answer.userAnswer}</span></div>
                        <div class="wrong-answer-correct">Đáp án đúng: <span class="correct-text">${answer.correctAnswer}</span></div>
                    </div>
                </div>
            `;
        });

        html += `
                </div>
                <div class="review-actions">
                    <button class="btn btn-primary" onclick="VocabQuiz.showResults()">
                        ← Quay lại kết quả
                    </button>
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    /**
     * Exit quiz mode
     */
    exit() {
        this.hideQuizSection();
        
        if (typeof Vocabulary !== 'undefined') {
            Vocabulary.loadVocabulary();
            Vocabulary.filterAndSort();
        }
    }
};

// Make VocabQuiz available globally
window.VocabQuiz = VocabQuiz;

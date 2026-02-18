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
        // Get tests from all sources
        let allTests = [...this.getSampleQuestions()];
        
        // Add custom tests
        if (typeof FileParser !== 'undefined') {
            allTests = [...allTests, ...FileParser.getCustomTests()];
        }
        
        // Add library default tests
        if (typeof Library !== 'undefined' && Library.getDefaultTests) {
            allTests = [...allTests, ...Library.getDefaultTests()];
        }
        
        let filteredQuestions = [];

        allTests.forEach(test => {
            if (test.passages) {
                test.passages.forEach(passage => {
                    passage.questions.forEach(q => {
                        if (mode === 'random' || this.matchesMode(q.type, mode)) {
                            filteredQuestions.push({
                                ...q,
                                passageTitle: passage.title,
                                passageText: passage.text  // Full text, not truncated
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
     * Get sample questions for mini-test - comprehensive question bank
     */
    getSampleQuestions() {
        return [
            {
                id: 'sample-minitest-climate',
                passages: [{
                    title: 'Climate Change Effects',
                    text: 'Climate change is affecting ecosystems worldwide. Rising temperatures are causing glaciers to melt at unprecedented rates, leading to rising sea levels that threaten coastal communities. Scientists predict that if current trends continue, many island nations could be submerged by the end of the century.',
                    questions: [
                        { id: 'mt1', type: 'tfng', text: 'Glaciers are melting faster than before.', answer: 'True', explanation: 'The passage states glaciers are melting at "unprecedented rates".' },
                        { id: 'mt2', type: 'tfng', text: 'Coastal communities are safe from rising sea levels.', answer: 'False', explanation: 'The passage says rising sea levels "threaten coastal communities".' },
                        { id: 'mt3', type: 'tfng', text: 'Climate change only affects polar regions.', answer: 'Not Given', explanation: 'The passage mentions "ecosystems worldwide" but does not specifically say it only affects polar regions.' },
                        { id: 'mt4', type: 'tfng', text: 'Island nations may disappear due to rising sea levels.', answer: 'True', explanation: 'The passage states many island nations "could be submerged".' }
                    ]
                }]
            },
            {
                id: 'sample-minitest-sleep',
                passages: [{
                    title: 'The Science of Sleep',
                    text: 'Sleep is essential for human health and cognitive function. During sleep, the brain consolidates memories and removes toxic waste products. Adults need between 7-9 hours of sleep per night, while teenagers require 8-10 hours. Chronic sleep deprivation has been linked to obesity, diabetes, cardiovascular disease, and weakened immune function. Blue light from electronic devices can disrupt the production of melatonin, the hormone that regulates sleep.',
                    questions: [
                        { id: 'mt5', type: 'tfng', text: 'The brain is inactive during sleep.', answer: 'False', explanation: 'The passage indicates the brain consolidates memories and removes waste during sleep.' },
                        { id: 'mt6', type: 'tfng', text: 'Teenagers need more sleep than adults.', answer: 'True', explanation: 'Adults need 7-9 hours while teenagers require 8-10 hours.' },
                        { id: 'mt7', type: 'tfng', text: 'Lack of sleep can cause heart problems.', answer: 'True', explanation: 'The passage mentions "cardiovascular disease" as a consequence of sleep deprivation.' },
                        { id: 'mt8', type: 'summary', text: 'Melatonin is a _______ that controls sleep patterns.', answer: 'hormone', wordLimit: 1, explanation: 'The passage describes melatonin as "the hormone that regulates sleep".' },
                        { id: 'mt9', type: 'multiple-choice', text: 'How many hours of sleep do adults need?', answer: '7-9 hours', options: ['5-6 hours', '7-9 hours', '10-12 hours', '4-5 hours'], explanation: 'The passage states adults need 7-9 hours.' }
                    ]
                }]
            },
            {
                id: 'sample-minitest-tech',
                passages: [{
                    title: 'Artificial Intelligence in Healthcare',
                    text: 'Artificial intelligence is revolutionizing healthcare delivery. AI algorithms can analyze medical images with greater accuracy than human doctors in some cases. Machine learning models are being used to predict patient outcomes and identify potential health risks before symptoms appear. However, concerns remain about data privacy and the potential for algorithmic bias in healthcare decisions. Many experts believe that AI will augment rather than replace human doctors.',
                    questions: [
                        { id: 'mt10', type: 'tfng', text: 'AI can sometimes be more accurate than doctors at analyzing images.', answer: 'True', explanation: 'The passage states AI can analyze images "with greater accuracy than human doctors in some cases".' },
                        { id: 'mt11', type: 'tfng', text: 'All doctors will be replaced by AI systems.', answer: 'False', explanation: 'Experts believe AI will "augment rather than replace" human doctors.' },
                        { id: 'mt12', type: 'ynng', text: 'The author has concerns about AI in healthcare.', answer: 'Yes', explanation: 'The passage mentions concerns about data privacy and algorithmic bias.' },
                        { id: 'mt13', type: 'tfng', text: 'Machine learning can predict health problems before they occur.', answer: 'True', explanation: 'The passage states ML models can "identify potential health risks before symptoms appear".' }
                    ]
                }]
            },
            {
                id: 'sample-minitest-ocean',
                passages: [{
                    title: 'Ocean Pollution Crisis',
                    text: 'The world\'s oceans are facing an unprecedented pollution crisis. Every year, approximately 8 million tons of plastic waste enters the ocean, forming massive garbage patches in the Pacific and Atlantic. Marine animals often mistake plastic for food, leading to starvation and death. Microplastics, tiny particles less than 5mm in size, have been found in drinking water, seafood, and even human blood. Scientists are developing new technologies to clean up ocean plastic, but prevention remains the most effective solution.',
                    questions: [
                        { id: 'mt14', type: 'tfng', text: 'About 8 million tons of plastic enters the ocean annually.', answer: 'True', explanation: 'The passage explicitly states this figure.' },
                        { id: 'mt15', type: 'tfng', text: 'Microplastics have not been detected in humans.', answer: 'False', explanation: 'The passage states microplastics have been found in "human blood".' },
                        { id: 'mt16', type: 'summary', text: 'Microplastics are particles smaller than _______ mm.', answer: '5', wordLimit: 1, explanation: 'The passage defines microplastics as "particles less than 5mm in size".' },
                        { id: 'mt17', type: 'ynng', text: 'Prevention is more effective than cleanup, according to the passage.', answer: 'Yes', explanation: 'The passage states "prevention remains the most effective solution".' }
                    ]
                }]
            },
            {
                id: 'sample-minitest-space',
                passages: [{
                    title: 'Mars Exploration',
                    text: 'The exploration of Mars has captivated scientists for decades. Several rovers, including Curiosity and Perseverance, have successfully operated on the Martian surface, collecting valuable data about the planet\'s geology and atmosphere. Evidence suggests that Mars once had liquid water on its surface, raising the possibility of ancient microbial life. NASA and private companies like SpaceX are planning crewed missions to Mars within the next two decades. However, significant challenges remain, including radiation exposure during the journey and the difficulty of returning astronauts to Earth.',
                    questions: [
                        { id: 'mt18', type: 'tfng', text: 'Multiple rovers have operated on Mars.', answer: 'True', explanation: 'The passage mentions Curiosity and Perseverance rovers.' },
                        { id: 'mt19', type: 'tfng', text: 'Mars currently has liquid water on its surface.', answer: 'Not Given', explanation: 'The passage only mentions Mars "once had" liquid water, current status is not stated.' },
                        { id: 'mt20', type: 'tfng', text: 'Only government agencies are planning Mars missions.', answer: 'False', explanation: 'The passage mentions NASA and private companies like SpaceX.' },
                        { id: 'mt21', type: 'multiple-choice', text: 'What evidence raises the possibility of ancient life on Mars?', answer: 'Presence of liquid water in the past', options: ['Presence of oxygen', 'Presence of liquid water in the past', 'Detection of radio signals', 'Finding fossils'], explanation: 'The passage links liquid water evidence to the "possibility of ancient microbial life".' }
                    ]
                }]
            },
            {
                id: 'sample-minitest-language',
                passages: [{
                    title: 'Multilingualism Benefits',
                    text: 'Research consistently shows that learning multiple languages provides numerous cognitive benefits. Bilingual individuals demonstrate enhanced executive function, including better attention control and task-switching abilities. Studies indicate that multilingualism may delay the onset of dementia by several years. Children who learn a second language also tend to develop greater cultural awareness and empathy. Additionally, knowing multiple languages significantly expands career opportunities in our globalized economy. Scientists believe that the mental effort required to manage multiple language systems strengthens the brain in much the same way that physical exercise strengthens muscles.',
                    questions: [
                        { id: 'mt22', type: 'tfng', text: 'Bilingual people have better attention control.', answer: 'True', explanation: 'The passage states bilinguals show "enhanced executive function, including better attention control".' },
                        { id: 'mt23', type: 'tfng', text: 'Learning languages can help prevent dementia completely.', answer: 'False', explanation: 'The passage says it may "delay the onset" not prevent it completely.' },
                        { id: 'mt24', type: 'ynng', text: 'The author believes multilingualism has economic advantages.', answer: 'Yes', explanation: 'The passage mentions "career opportunities in our globalized economy".' },
                        { id: 'mt25', type: 'tfng', text: 'Managing multiple languages is similar to physical exercise for the brain.', answer: 'True', explanation: 'The passage explicitly makes this comparison.' }
                    ]
                }]
            }
        ];
    },

    /**
     * Render mini-test UI
     */
    renderTest() {
        const container = document.getElementById('minitest');
        if (!container) return;

        // Group questions by passage
        const passages = this.groupQuestionsByPassage();

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

                <div class="minitest-content">
                    ${passages.map(passage => this.renderPassageBlock(passage)).join('')}
                </div>
            </div>
        `;

        this.bindEvents();
    },

    /**
     * Group questions by passage
     */
    groupQuestionsByPassage() {
        const passageMap = new Map();
        
        this.questions.forEach(q => {
            const title = q.passageTitle || 'Reading Passage';
            if (!passageMap.has(title)) {
                passageMap.set(title, {
                    title: title,
                    text: q.passageText || '',
                    questions: []
                });
            }
            passageMap.get(title).questions.push(q);
        });
        
        return Array.from(passageMap.values());
    },

    /**
     * Render passage with its questions
     */
    renderPassageBlock(passage) {
        return `
            <div class="minitest-passage-block">
                <div class="minitest-passage">
                    <div class="passage-header">
                        <h3>📖 ${passage.title}</h3>
                    </div>
                    <div class="passage-text">
                        ${passage.text || 'Read the passage carefully...'}
                    </div>
                </div>
                <div class="minitest-questions" id="minitestQuestions">
                    ${passage.questions.map((q, i) => this.renderQuestion(q, this.questions.indexOf(q))).join('')}
                </div>
            </div>
        `;
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

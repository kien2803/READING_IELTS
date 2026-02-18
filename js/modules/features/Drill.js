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
        // Get tests from all sources
        let allTests = [...this.getSampleDrillQuestions()];
        
        // Add custom tests
        if (typeof FileParser !== 'undefined') {
            allTests = [...allTests, ...FileParser.getCustomTests()];
        }
        
        // Add library default tests
        if (typeof Library !== 'undefined' && Library.getDefaultTests) {
            allTests = [...allTests, ...Library.getDefaultTests()];
        }
        
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
     * Sample drill questions - comprehensive question bank for all types
     */
    getSampleDrillQuestions() {
        return [
            {
                id: 'drill-sample-digital',
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
            },
            {
                id: 'drill-sample-environment',
                passages: [{
                    title: 'Renewable Energy Transition',
                    text: `The global transition to renewable energy is accelerating faster than many experts predicted. Solar and wind power have become the cheapest sources of new electricity generation in most parts of the world. In 2022, renewable energy sources accounted for nearly 30% of global electricity production.

Many countries have set ambitious targets for carbon neutrality. The European Union aims to be carbon neutral by 2050, while China has pledged to achieve this goal by 2060. These commitments are driving massive investments in clean energy infrastructure.

However, the transition faces significant challenges. The intermittent nature of solar and wind power requires improved energy storage solutions. Additionally, the mining of minerals needed for batteries and solar panels raises environmental and ethical concerns.

Despite these challenges, the economic case for renewable energy continues to strengthen. The cost of solar panels has dropped by 90% over the past decade, making clean energy increasingly competitive with fossil fuels.`,
                    questions: [
                        { id: 'dr7', type: 'tfng', text: 'Renewable energy is now the cheapest option for new electricity in most regions.', answer: 'True', explanation: 'The passage states solar and wind have become the cheapest sources in most parts of the world.' },
                        { id: 'dr8', type: 'tfng', text: 'China plans to achieve carbon neutrality before the EU.', answer: 'False', explanation: 'EU aims for 2050, China for 2060.' },
                        { id: 'dr9', type: 'tfng', text: 'Solar panel production has no environmental impact.', answer: 'False', explanation: 'The passage mentions "environmental and ethical concerns" about mining for batteries and solar panels.' },
                        { id: 'dr10', type: 'summary', text: 'Renewables accounted for nearly _______% of global electricity in 2022.', answer: '30', wordLimit: 1, explanation: 'The passage states "nearly 30% of global electricity production".' },
                        { id: 'dr11', type: 'multiple-choice', text: 'By how much have solar panel costs decreased in the past decade?', answer: '90%', options: ['50%', '70%', '90%', '30%'], explanation: 'The passage states costs dropped by 90%.' },
                        { id: 'dr12', type: 'ynng', text: 'The author is optimistic about the future of renewable energy.', answer: 'Yes', explanation: 'The passage ends on a positive note about economics strengthening.' }
                    ]
                }]
            },
            {
                id: 'drill-sample-psychology',
                passages: [{
                    title: 'The Psychology of Decision Making',
                    text: `Human decision-making is far less rational than we might assume. Psychologists have identified numerous cognitive biases that influence our choices, often without our awareness.

A. Confirmation bias leads us to seek information that supports our existing beliefs while ignoring contradictory evidence. This can reinforce misconceptions and prevent us from changing our minds even when presented with new facts.

B. The anchoring effect causes us to rely too heavily on the first piece of information we encounter. For example, in negotiations, the initial offer serves as an anchor that influences all subsequent discussions.

C. Loss aversion describes our tendency to prefer avoiding losses over acquiring equivalent gains. Research suggests that the pain of losing is psychologically about twice as powerful as the pleasure of gaining.

D. Understanding these biases can help us make better decisions. By being aware of our cognitive tendencies, we can implement strategies to counteract them, such as actively seeking out opposing viewpoints or using decision-making frameworks.`,
                    questions: [
                        { id: 'dr13', type: 'matching-headings', text: 'Which paragraph discusses how first impressions affect negotiations?', answer: 'B', options: ['A', 'B', 'C', 'D'], explanation: 'Paragraph B discusses anchoring effect and negotiations.' },
                        { id: 'dr14', type: 'matching-headings', text: 'Which paragraph explains why we avoid changing our beliefs?', answer: 'A', options: ['A', 'B', 'C', 'D'], explanation: 'Paragraph A discusses confirmation bias.' },
                        { id: 'dr15', type: 'tfng', text: 'Humans naturally make rational decisions.', answer: 'False', explanation: 'The passage states decision-making is "far less rational than we might assume".' },
                        { id: 'dr16', type: 'tfng', text: 'Losing feels worse than gaining feels good.', answer: 'True', explanation: 'The passage states "the pain of losing is psychologically about twice as powerful as the pleasure of gaining".' },
                        { id: 'dr17', type: 'summary', text: 'The _______ effect causes us to rely too heavily on first information.', answer: 'anchoring', wordLimit: 1, explanation: 'The passage discusses "the anchoring effect".' },
                        { id: 'dr18', type: 'sentence', text: 'One strategy to counteract biases is to actively seek out opposing _______.', answer: 'viewpoints', wordLimit: 1, explanation: 'The passage mentions "actively seeking out opposing viewpoints".' }
                    ]
                }]
            },
            {
                id: 'drill-sample-health',
                passages: [{
                    title: 'The Mediterranean Diet',
                    text: `The Mediterranean diet has been recognized as one of the healthiest eating patterns in the world. Based on the traditional foods of countries bordering the Mediterranean Sea, this diet emphasizes plant-based foods, healthy fats, and moderate consumption of fish and poultry.

Key components include olive oil as the primary fat source, abundant fruits and vegetables, whole grains, legumes, and nuts. Red meat is consumed sparingly, typically only a few times per month. Moderate wine consumption, usually with meals, is also characteristic of this dietary pattern.

Research has consistently shown that following a Mediterranean diet reduces the risk of cardiovascular disease, type 2 diabetes, and certain cancers. A landmark study published in the New England Journal of Medicine found that people following this diet had a 30% lower risk of heart attacks and strokes.

The diet's benefits extend beyond physical health. Studies suggest it may also protect against cognitive decline and depression, likely due to its anti-inflammatory effects and high content of antioxidants.`,
                    questions: [
                        { id: 'dr19', type: 'tfng', text: 'The Mediterranean diet focuses mainly on meat consumption.', answer: 'False', explanation: 'The diet emphasizes plant-based foods, with red meat consumed sparingly.' },
                        { id: 'dr20', type: 'tfng', text: 'Olive oil is the main source of fat in this diet.', answer: 'True', explanation: 'The passage states olive oil is "the primary fat source".' },
                        { id: 'dr21', type: 'tfng', text: 'Alcohol is completely forbidden in the Mediterranean diet.', answer: 'False', explanation: 'The passage mentions "moderate wine consumption".' },
                        { id: 'dr22', type: 'multiple-choice', text: 'By how much can the Mediterranean diet reduce heart attack risk?', answer: '30%', options: ['10%', '20%', '30%', '50%'], explanation: 'The passage cites a study showing 30% lower risk.' },
                        { id: 'dr23', type: 'summary', text: 'The diet may protect against cognitive decline due to its anti-_______ effects.', answer: 'inflammatory', wordLimit: 1, explanation: 'The passage mentions "anti-inflammatory effects".' },
                        { id: 'dr24', type: 'ynng', text: 'The author considers the Mediterranean diet beneficial for mental health.', answer: 'Yes', explanation: 'The passage mentions protection against cognitive decline and depression.' }
                    ]
                }]
            },
            {
                id: 'drill-sample-history',
                passages: [{
                    title: 'The Industrial Revolution',
                    text: `The Industrial Revolution, which began in Britain in the late 18th century, fundamentally transformed human society. What started as technological innovations in textile manufacturing spread to other industries and eventually to countries around the world.

The invention of the steam engine by James Watt in 1769 was a pivotal moment. This new source of power enabled factories to operate independently of water sources, allowing industrial centers to develop anywhere. Steam power also revolutionized transportation through railways and steamships.

The social consequences were profound. Millions of people migrated from rural areas to cities in search of factory work. Working conditions were often harsh, with long hours, dangerous machinery, and no labor protections. Child labor was common.

However, the Industrial Revolution also brought significant improvements in living standards over time. Mass production made goods more affordable, technological innovations improved healthcare, and rising wealth eventually led to better working conditions and the expansion of education.`,
                    questions: [
                        { id: 'dr25', type: 'tfng', text: 'The Industrial Revolution started in France.', answer: 'False', explanation: 'The passage states it began in Britain.' },
                        { id: 'dr26', type: 'tfng', text: 'James Watt invented the steam engine in 1769.', answer: 'True', explanation: 'The passage explicitly states this.' },
                        { id: 'dr27', type: 'tfng', text: 'Factory working conditions were immediately good.', answer: 'False', explanation: 'The passage describes conditions as "often harsh".' },
                        { id: 'dr28', type: 'sentence', text: 'Steam power allowed factories to operate without depending on _______ sources.', answer: 'water', wordLimit: 1, explanation: 'The passage states factories could operate "independently of water sources".' },
                        { id: 'dr29', type: 'multiple-choice', text: 'What industry first saw innovations during the Industrial Revolution?', answer: 'Textile manufacturing', options: ['Mining', 'Textile manufacturing', 'Steel production', 'Agriculture'], explanation: 'The passage mentions "textile manufacturing" as where it started.' },
                        { id: 'dr30', type: 'ynng', text: 'The author views the Industrial Revolution as having mixed effects.', answer: 'Yes', explanation: 'The passage discusses both negative consequences and improvements.' }
                    ]
                }]
            }
        ];
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

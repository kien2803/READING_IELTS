/* ==========================================
   Adaptive Difficulty Module
   Progressive training from current band to 9.0
   ========================================== */

const AdaptiveDifficulty = {
    currentBand: 0,
    targetBand: 9.0,

    /**
     * Initialize adaptive system
     */
    init() {
        this.currentBand = this.getCurrentBand();
        this.renderBandSelector();
        this.renderRecommendations();
    },

    /**
     * Get current band from recent performance
     */
    getCurrentBand() {
        const tests = Storage.getTests();
        if (tests.length === 0) return 4.0;

        // Get last 5 tests average
        const recent = tests.slice(0, 5);
        const avgBand = recent.reduce((sum, t) => sum + t.bandScore, 0) / recent.length;
        
        return Math.round(avgBand * 2) / 2; // Round to nearest 0.5
    },

    /**
     * Render band selector
     */
    renderBandSelector() {
        const container = document.getElementById('bandSelector');
        if (!container) return;

        const bands = [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0];

        container.innerHTML = `
            <div class="band-selector-wrapper">
                <label class="band-selector-label">
                    <span>🎯 Band hiện tại của bạn:</span>
                    <select id="currentBandSelect" class="band-select" onchange="AdaptiveDifficulty.updateCurrentBand(this.value)">
                        ${bands.map(band => `
                            <option value="${band}" ${band === this.currentBand ? 'selected' : ''}>
                                Band ${band.toFixed(1)}
                            </option>
                        `).join('')}
                    </select>
                </label>
                
                <div class="band-progression">
                    ${this.renderProgression()}
                </div>
            </div>
        `;
    },

    /**
     * Render band progression
     */
    renderProgression() {
        const bands = [4.0, 5.0, 6.0, 7.0, 8.0, 9.0];
        
        return `
            <div class="progression-track">
                ${bands.map((band, i) => {
                    const isActive = band <= this.currentBand;
                    const isCurrent = band === this.currentBand;
                    return `
                        <div class="progression-step ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}">
                            <div class="step-circle">${band.toFixed(1)}</div>
                            <div class="step-label">${this.getBandLabel(band)}</div>
                        </div>
                        ${i < bands.length - 1 ? '<div class="progression-line"></div>' : ''}
                    `;
                }).join('')}
            </div>
        `;
    },

    /**
     * Get band label
     */
    getBandLabel(band) {
        const labels = {
            4.0: 'Beginner',
            5.0: 'Elementary',
            6.0: 'Intermediate',
            7.0: 'Advanced',
            8.0: 'Expert',
            9.0: 'Master'
        };
        return labels[band] || '';
    },

    /**
     * Update current band
     */
    updateCurrentBand(band) {
        this.currentBand = parseFloat(band);
        this.renderProgression();
        this.renderRecommendations();
        Utils.showNotification(`Đã cập nhật band hiện tại: ${band}`, 'success');
    },

    /**
     * Render test recommendations
     */
    renderRecommendations() {
        const container = document.getElementById('adaptiveRecommendations');
        if (!container) return;

        const tests = this.getRecommendedTests();

        if (tests.length === 0) {
            container.innerHTML = '<div class="empty-state">Không có đề thi phù hợp. Hãy thêm đề thi mới!</div>';
            return;
        }

        container.innerHTML = tests.map(test => this.renderTestCard(test)).join('');
    },

    /**
     * Get recommended tests based on current band
     */
    getRecommendedTests() {
        // Get all available tests
        let allTests = [];
        
        if (typeof Library !== 'undefined') {
            allTests = Library.getAllTests();
        }

        // Filter by difficulty matching current band
        const suitable = allTests.filter(test => {
            const difficulty = this.estimateDifficulty(test);
            // Recommend slightly harder tests to push improvement
            return difficulty >= this.currentBand && difficulty <= this.currentBand + 1.0;
        });

        return suitable.slice(0, 3); // Top 3 recommendations
    },

    /**
     * Estimate test difficulty
     */
    estimateDifficulty(test) {
        // Simple heuristic based on test metadata or title
        // In real scenario, this would be pre-labeled
        
        if (test.level) {
            const levelMap = {
                'beginner': 4.0,
                'elementary': 5.0,
                'intermediate': 6.0,
                'advanced': 7.0,
                'expert': 8.0
            };
            return levelMap[test.level.toLowerCase()] || 6.0;
        }

        // Default to current band
        return this.currentBand;
    },

    /**
     * Render test recommendation card
     */
    renderTestCard(test) {
        const difficulty = this.estimateDifficulty(test);
        const diffLabel = this.getDifficultyLabel(difficulty);
        const diffClass = this.getDifficultyClass(difficulty);

        return `
            <div class="adaptive-card">
                <div class="adaptive-card-header">
                    <h4>${test.title || test.id}</h4>
                    <span class="difficulty-badge ${diffClass}">${diffLabel}</span>
                </div>
                <div class="adaptive-card-body">
                    <p class="adaptive-reason">
                        <strong>Tại sao nên làm:</strong> Đề này phù hợp với band ${this.currentBand.toFixed(1)} 
                        và giúp bạn tiến tới band ${(this.currentBand + 0.5).toFixed(1)}
                    </p>
                    <div class="adaptive-stats">
                        <span>📝 ${test.passages?.length || 3} passages</span>
                        <span>❓ Khoảng 40 câu hỏi</span>
                        <span>⏱️ 60 phút</span>
                    </div>
                </div>
                <div class="adaptive-card-footer">
                    <button class="btn btn-primary" onclick="AdaptiveDifficulty.startTest('${test.id}')">
                        🚀 Bắt đầu luyện tập
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Get difficulty label
     */
    getDifficultyLabel(band) {
        if (band < 5.0) return 'Dễ';
        if (band < 6.5) return 'Trung bình';
        if (band < 8.0) return 'Khó';
        return 'Rất khó';
    },

    /**
     * Get difficulty class
     */
    getDifficultyClass(band) {
        if (band < 5.0) return 'diff-easy';
        if (band < 6.5) return 'diff-medium';
        if (band < 8.0) return 'diff-hard';
        return 'diff-expert';
    },

    /**
     * Start recommended test
     */
    startTest(testId) {
        App.switchTab('practice');
        setTimeout(() => {
            if (typeof Practice !== 'undefined') {
                const tests = Library.getAllTests();
                const test = tests.find(t => t.id === testId);
                if (test && test.passages && test.passages[0]) {
                    Practice.startTest(testId, test.passages[0].questions[0].type);
                }
            }
        }, 100);
    }
};

// Make available globally
window.AdaptiveDifficulty = AdaptiveDifficulty;

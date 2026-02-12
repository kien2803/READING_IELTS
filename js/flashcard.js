/* ==========================================
   Flashcard Learning System
   Interactive vocabulary flashcard module
   ========================================== */

const Flashcard = {
    // Current state
    currentDeck: [],
    currentIndex: 0,
    isFlipped: false,
    reviewMode: 'learning', // 'learning' | 'review' | 'test'
    stats: {
        studied: 0,
        remembered: 0,
        needReview: 0
    },

    /**
     * Initialize flashcard module
     */
    init() {
        this.bindEvents();
        this.loadStats();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Flashcard flip
        const flashcard = document.getElementById('flashcardCard');
        if (flashcard) {
            flashcard.addEventListener('click', () => this.flipCard());
        }

        // Navigation buttons
        const prevBtn = document.getElementById('flashcardPrev');
        const nextBtn = document.getElementById('flashcardNext');
        const shuffleBtn = document.getElementById('flashcardShuffle');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.previousCard());
        if (nextBtn) nextBtn.addEventListener('click', () => this.nextCard());
        if (shuffleBtn) shuffleBtn.addEventListener('click', () => this.shuffleDeck());

        // Mastery buttons
        const easyBtn = document.getElementById('masteryEasy');
        const mediumBtn = document.getElementById('masteryMedium');
        const hardBtn = document.getElementById('masteryHard');
        
        if (easyBtn) easyBtn.addEventListener('click', () => this.markMastery(2));
        if (mediumBtn) mediumBtn.addEventListener('click', () => this.markMastery(1));
        if (hardBtn) hardBtn.addEventListener('click', () => this.markMastery(-1));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.isActive()) return;
            
            switch(e.key) {
                case ' ':
                case 'Enter':
                    e.preventDefault();
                    this.flipCard();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.previousCard();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.nextCard();
                    break;
                case '1':
                    e.preventDefault();
                    this.markMastery(-1); // Hard
                    break;
                case '2':
                    e.preventDefault();
                    this.markMastery(1); // Medium
                    break;
                case '3':
                    e.preventDefault();
                    this.markMastery(2); // Easy
                    break;
            }
        });
    },

    /**
     * Check if flashcard is currently active
     */
    isActive() {
        const flashcardSection = document.getElementById('flashcardSection');
        return flashcardSection && flashcardSection.style.display !== 'none';
    },

    /**
     * Start flashcard session
     * @param {string} mode - 'all' | 'new' | 'review' | 'weak'
     */
    start(mode = 'all') {
        let vocabulary = Storage.getVocabulary();
        
        // Filter based on mode
        switch(mode) {
            case 'new':
                vocabulary = vocabulary.filter(v => (v.reviewCount || 0) === 0);
                break;
            case 'review':
                vocabulary = vocabulary.filter(v => (v.reviewCount || 0) > 0);
                break;
            case 'weak':
                vocabulary = vocabulary.filter(v => (v.masteryLevel || 0) < 3);
                break;
            case 'mastered':
                vocabulary = vocabulary.filter(v => (v.masteryLevel || 0) >= 4);
                break;
        }

        if (vocabulary.length === 0) {
            Utils.showNotification('Không có từ vựng nào để ôn luyện!', 'warning');
            return;
        }

        this.currentDeck = [...vocabulary];
        this.currentIndex = 0;
        this.reviewMode = mode;
        
        // Show flashcard section
        this.showFlashcardSection();
        this.renderCard();
        this.updateProgress();

        Utils.showNotification(`Bắt đầu ôn luyện ${this.currentDeck.length} từ vựng`, 'success');
        
        Storage.addActivity({
            type: 'flashcard_started',
            description: `Bắt đầu flashcard ${mode} - ${this.currentDeck.length} từ`
        });
    },

    /**
     * Show flashcard section
     */
    showFlashcardSection() {
        // Hide vocabulary list
        const vocabSection = document.querySelector('#vocabulary .vocab-list-container');
        if (vocabSection) vocabSection.style.display = 'none';

        const addForm = document.querySelector('#vocabulary .card');
        if (addForm) addForm.style.display = 'none';

        // Show flashcard section
        let flashcardSection = document.getElementById('flashcardSection');
        if (!flashcardSection) {
            // Create flashcard section if it doesn't exist
            const container = document.querySelector('#vocabulary');
            flashcardSection = document.createElement('div');
            flashcardSection.id = 'flashcardSection';
            flashcardSection.className = 'flashcard-section';
            container.appendChild(flashcardSection);
        }
        flashcardSection.style.display = 'block';
        flashcardSection.innerHTML = this.getFlashcardHTML();
        
        // Re-bind events after creating HTML
        this.bindEvents();
    },

    /**
     * Hide flashcard section
     */
    hideFlashcardSection() {
        const flashcardSection = document.getElementById('flashcardSection');
        if (flashcardSection) flashcardSection.style.display = 'none';

        const vocabSection = document.querySelector('#vocabulary .vocab-list-container');
        if (vocabSection) vocabSection.style.display = 'block';

        const addForm = document.querySelector('#vocabulary .card');
        if (addForm) addForm.style.display = 'block';
    },

    /**
     * Get flashcard section HTML
     */
    getFlashcardHTML() {
        return `
            <div class="card flashcard-container">
                <div class="card-header">
                    <h3>🎴 Flashcard - Ôn luyện từ vựng</h3>
                    <div class="flashcard-actions">
                        <button class="btn btn-sm btn-ghost" id="flashcardShuffle" title="Trộn bài">🔀</button>
                        <button class="btn btn-sm btn-danger" onclick="Flashcard.exit()">✕ Thoát</button>
                    </div>
                </div>
                
                <div class="flashcard-progress">
                    <div class="progress-info">
                        <span id="flashcardProgress">1 / 1</span>
                        <span class="progress-stats">
                            <span class="stat-badge stat-success">✓ <span id="flashcardRemembered">0</span></span>
                            <span class="stat-badge stat-warning">↻ <span id="flashcardReview">0</span></span>
                        </span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="flashcardProgressBar" style="width: 0%"></div>
                    </div>
                </div>

                <div class="flashcard-main">
                    <div class="flashcard" id="flashcardCard">
                        <div class="flashcard-inner">
                            <div class="flashcard-front">
                                <div class="card-hint">Click để lật thẻ</div>
                                <div class="card-word" id="flashcardWord">Loading...</div>
                                <div class="card-phonetic" id="flashcardPhonetic"></div>
                            </div>
                            <div class="flashcard-back">
                                <div class="card-meaning" id="flashcardMeaning">...</div>
                                <div class="card-example" id="flashcardExample"></div>
                                <div class="card-tags" id="flashcardTags"></div>
                            </div>
                        </div>
                    </div>

                    <div class="flashcard-mastery" id="flashcardMastery" style="display: none;">
                        <p class="mastery-question">Bạn nhớ từ này như thế nào?</p>
                        <div class="mastery-buttons">
                            <button class="btn mastery-btn mastery-hard" id="masteryHard">
                                <span class="emoji">😓</span>
                                <span class="label">Khó</span>
                                <span class="key">1</span>
                            </button>
                            <button class="btn mastery-btn mastery-medium" id="masteryMedium">
                                <span class="emoji">🤔</span>
                                <span class="label">Tạm được</span>
                                <span class="key">2</span>
                            </button>
                            <button class="btn mastery-btn mastery-easy" id="masteryEasy">
                                <span class="emoji">😄</span>
                                <span class="label">Dễ</span>
                                <span class="key">3</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="flashcard-navigation">
                    <button class="btn btn-secondary" id="flashcardPrev">
                        ← Trước
                    </button>
                    <div class="flashcard-shortcuts">
                        <span class="shortcut-hint">Space/Enter: Lật thẻ</span>
                        <span class="shortcut-hint">← →: Di chuyển</span>
                    </div>
                    <button class="btn btn-secondary" id="flashcardNext">
                        Tiếp →
                    </button>
                </div>
            </div>
        `;
    },

    /**
     * Render current card
     */
    renderCard() {
        if (this.currentDeck.length === 0) {
            this.showCompletionSummary();
            return;
        }

        const currentCard = this.currentDeck[this.currentIndex];
        
        // Reset flip state
        this.isFlipped = false;
        const flashcard = document.getElementById('flashcardCard');
        if (flashcard) flashcard.classList.remove('flipped');

        // Update front
        const wordEl = document.getElementById('flashcardWord');
        const phoneticEl = document.getElementById('flashcardPhonetic');
        
        if (wordEl) wordEl.textContent = currentCard.word;
        if (phoneticEl) {
            phoneticEl.textContent = currentCard.phonetic ? `/${currentCard.phonetic}/` : '';
        }

        // Update back
        const meaningEl = document.getElementById('flashcardMeaning');
        const exampleEl = document.getElementById('flashcardExample');
        const tagsEl = document.getElementById('flashcardTags');
        
        if (meaningEl) meaningEl.textContent = currentCard.meaning;
        if (exampleEl) {
            exampleEl.textContent = currentCard.example || '';
            exampleEl.style.display = currentCard.example ? 'block' : 'none';
        }
        if (tagsEl) {
            const masteryLevel = currentCard.masteryLevel || 0;
            const reviewCount = currentCard.reviewCount || 0;
            tagsEl.innerHTML = `
                <span class="tag">Độ thành thạo: ${masteryLevel}/5</span>
                <span class="tag">Đã ôn: ${reviewCount} lần</span>
            `;
        }

        // Hide mastery buttons
        const masterySection = document.getElementById('flashcardMastery');
        if (masterySection) masterySection.style.display = 'none';

        this.updateProgress();
    },

    /**
     * Flip card
     */
    flipCard() {
        const flashcard = document.getElementById('flashcardCard');
        if (!flashcard) return;

        this.isFlipped = !this.isFlipped;
        flashcard.classList.toggle('flipped');

        // Show mastery buttons when flipped
        const masterySection = document.getElementById('flashcardMastery');
        if (masterySection) {
            masterySection.style.display = this.isFlipped ? 'block' : 'none';
        }
    },

    /**
     * Next card
     */
    nextCard() {
        if (this.currentIndex < this.currentDeck.length - 1) {
            this.currentIndex++;
            this.renderCard();
        } else {
            this.showCompletionSummary();
        }
    },

    /**
     * Previous card
     */
    previousCard() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.renderCard();
        }
    },

    /**
     * Shuffle deck
     */
    shuffleDeck() {
        this.currentDeck = Utils.shuffleArray(this.currentDeck);
        this.currentIndex = 0;
        this.renderCard();
        Utils.showNotification('Đã trộn bài!', 'success');
    },

    /**
     * Mark mastery level and move to next
     * @param {number} change - Change in mastery level (-1, 1, 2)
     */
    markMastery(change) {
        if (!this.isFlipped) return;

        const currentCard = this.currentDeck[this.currentIndex];
        const vocab = Storage.getVocabulary().find(v => v.id === currentCard.id);
        
        if (vocab) {
            const newMastery = Math.min(5, Math.max(0, (vocab.masteryLevel || 0) + change));
            
            Storage.updateVocabulary(vocab.id, {
                masteryLevel: newMastery,
                reviewCount: (vocab.reviewCount || 0) + 1,
                lastReviewed: new Date().toISOString()
            });

            // Update stats
            if (change >= 1) {
                this.stats.remembered++;
            } else {
                this.stats.needReview++;
            }

            this.updateProgress();
            this.nextCard();
        }
    },

    /**
     * Update progress display
     */
    updateProgress() {
        const progressEl = document.getElementById('flashcardProgress');
        const progressBarEl = document.getElementById('flashcardProgressBar');
        const rememberedEl = document.getElementById('flashcardRemembered');
        const reviewEl = document.getElementById('flashcardReview');

        if (progressEl) {
            progressEl.textContent = `${this.currentIndex + 1} / ${this.currentDeck.length}`;
        }

        if (progressBarEl) {
            const progress = ((this.currentIndex + 1) / this.currentDeck.length) * 100;
            progressBarEl.style.width = `${progress}%`;
        }

        if (rememberedEl) rememberedEl.textContent = this.stats.remembered;
        if (reviewEl) reviewEl.textContent = this.stats.needReview;
    },

    /**
     * Show completion summary
     */
    showCompletionSummary() {
        const accuracy = this.stats.remembered + this.stats.needReview > 0
            ? (this.stats.remembered / (this.stats.remembered + this.stats.needReview) * 100).toFixed(1)
            : 0;

        Utils.showNotification(`
            🎉 Hoàn thành!\n
            Tổng số từ: ${this.currentDeck.length}\n
            Nhớ tốt: ${this.stats.remembered}\n
            Cần ôn lại: ${this.stats.needReview}\n
            Độ chính xác: ${accuracy}%
        `, 'success', 5000);

        Storage.addActivity({
            type: 'flashcard_completed',
            description: `Hoàn thành flashcard - ${this.stats.remembered}/${this.currentDeck.length} từ nhớ tốt`
        });

        this.exit();
    },

    /**
     * Exit flashcard mode
     */
    exit() {
        this.hideFlashcardSection();
        this.stats = { studied: 0, remembered: 0, needReview: 0 };
        
        if (typeof Vocabulary !== 'undefined') {
            Vocabulary.loadVocabulary();
            Vocabulary.filterAndSort();
        }
    },

    /**
     * Load stats from storage
     */
    loadStats() {
        // Stats are reset each session
        this.stats = {
            studied: 0,
            remembered: 0,
            needReview: 0
        };
    }
};

// Make Flashcard available globally
window.Flashcard = Flashcard;

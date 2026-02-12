/* ==========================================
   Text Selection & Vocabulary Saver
   Save vocabulary from reading passages
   ========================================== */

const TextSelector = {
    // Current state
    isEnabled: false,
    selectedText: '',
    languageMode: 'en', // 'en' | 'vi'
    tooltipTimeout: null,

    /**
     * Initialize text selector
     */
    init() {
        this.setupSelectionHandler();
        this.setupLanguageToggle();
    },

    /**
     * Setup text selection handler
     */
    setupSelectionHandler() {
        // Add selection event to passage content
        document.addEventListener('mouseup', (e) => {
            this.handleTextSelection(e);
        });

        // Close tooltip when clicking outside
        document.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.vocab-save-tooltip')) {
                this.hideTooltip();
            }
        });
    },

    /**
     * Handle text selection
     */
    handleTextSelection(e) {
        // Only work in passage content areas
        const passageContent = e.target.closest('.passage-content, .flashcard, .quiz-question');
        if (!passageContent) {
            this.hideTooltip();
            return;
        }

        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        // Must be a single word or short phrase (1-3 words)
        if (!selectedText || selectedText.split(/\s+/).length > 3) {
            this.hideTooltip();
            return;
        }

        this.selectedText = selectedText;
        
        // Get selection position
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Show save tooltip
        this.showTooltip(rect);
    },

    /**
     * Show vocabulary save tooltip
     */
    showTooltip(rect) {
        // Remove existing tooltip
        this.hideTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = 'vocab-save-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-content">
                <div class="tooltip-word">"${this.selectedText}"</div>
                <div class="tooltip-actions">
                    <button class="btn btn-sm btn-primary" id="saveVocabBtn">
                        💾 Lưu vào từ vựng
                    </button>
                    <button class="btn btn-sm btn-secondary" id="translateBtn">
                        🌐 Dịch
                    </button>
                </div>
                <div class="tooltip-translation" id="tooltipTranslation" style="display: none;">
                    <div class="translation-loading">Đang dịch...</div>
                </div>
            </div>
        `;

        // Position tooltip above selection
        tooltip.style.position = 'fixed';
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - 10}px`;
        tooltip.style.transform = 'translate(-50%, -100%)';
        tooltip.style.zIndex = '10000';

        document.body.appendChild(tooltip);

        // Bind actions
        document.getElementById('saveVocabBtn')?.addEventListener('click', () => {
            this.showSaveDialog();
        });

        document.getElementById('translateBtn')?.addEventListener('click', () => {
            this.translateWord();
        });

        // Auto-hide after delay
        this.tooltipTimeout = setTimeout(() => {
            this.hideTooltip();
        }, 10000);
    },

    /**
     * Hide tooltip
     */
    hideTooltip() {
        const tooltip = document.querySelector('.vocab-save-tooltip');
        if (tooltip) tooltip.remove();
        
        if (this.tooltipTimeout) {
            clearTimeout(this.tooltipTimeout);
            this.tooltipTimeout = null;
        }
    },

    /**
     * Show save vocabulary dialog
     */
    showSaveDialog() {
        const existingVocab = Storage.getVocabulary().find(v => 
            Utils.normalizeText(v.word) === Utils.normalizeText(this.selectedText)
        );

        if (existingVocab) {
            Utils.showNotification('Từ này đã có trong danh sách!', 'info');
            this.hideTooltip();
            return;
        }

        // Show custom dialog
        const dialog = document.createElement('div');
        dialog.className = 'vocab-save-dialog-overlay';
        dialog.innerHTML = `
            <div class="vocab-save-dialog">
                <div class="dialog-header">
                    <h3>💾 Lưu từ vựng mới</h3>
                    <button class="dialog-close" onclick="this.closest('.vocab-save-dialog-overlay').remove()">✕</button>
                </div>
                <div class="dialog-content">
                    <div class="form-group">
                        <label>Từ vựng</label>
                        <input type="text" id="saveVocabWord" class="input" value="${this.selectedText}" readonly>
                    </div>
                    <div class="form-group">
                        <label>Nghĩa tiếng Việt *</label>
                        <input type="text" id="saveVocabMeaning" class="input" placeholder="Nhập nghĩa..." autofocus>
                    </div>
                    <div class="form-group">
                        <label>Phiên âm (tùy chọn)</label>
                        <input type="text" id="saveVocabPhonetic" class="input" placeholder="VD: ˈvokəbjʊləri">
                    </div>
                    <div class="form-group">
                        <label>Ví dụ (tùy chọn)</label>
                        <textarea id="saveVocabExample" class="textarea" placeholder="Nhập câu ví dụ..."></textarea>
                    </div>
                </div>
                <div class="dialog-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.vocab-save-dialog-overlay').remove()">
                        Hủy
                    </button>
                    <button class="btn btn-primary" id="confirmSaveVocab">
                        💾 Lưu
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // Bind save action
        document.getElementById('confirmSaveVocab')?.addEventListener('click', () => {
            this.saveVocabulary();
        });

        // Enter to save
        dialog.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.saveVocabulary();
                }
            });
        });

        this.hideTooltip();
    },

    /**
     * Save vocabulary to storage
     */
    saveVocabulary() {
        const word = document.getElementById('saveVocabWord')?.value.trim();
        const meaning = document.getElementById('saveVocabMeaning')?.value.trim();
        const phonetic = document.getElementById('saveVocabPhonetic')?.value.trim();
        const example = document.getElementById('saveVocabExample')?.value.trim();

        if (!word || !meaning) {
            Utils.showNotification('Vui lòng nhập đầy đủ từ và nghĩa!', 'warning');
            return;
        }

        const vocab = {
            word: word,
            meaning: meaning,
            phonetic: phonetic,
            example: example,
            category: 'from-reading',
            masteryLevel: 0,
            reviewCount: 0,
            lastReviewed: null
        };

        Storage.addVocabulary(vocab);

        Utils.showNotification(`✅ Đã lưu từ "${word}"!`, 'success');
        
        Storage.addActivity({
            type: 'vocab_saved_from_reading',
            description: `Lưu từ từ reading: ${word}`
        });

        // Close dialog
        document.querySelector('.vocab-save-dialog-overlay')?.remove();
        
        // Refresh vocabulary if on that tab
        if (typeof Vocabulary !== 'undefined' && App.currentTab === 'vocabulary') {
            Vocabulary.loadVocabulary();
            Vocabulary.filterAndSort();
        }
    },

    /**
     * Translate selected word (using simple dictionary or API)
     */
    async translateWord() {
        const translationEl = document.getElementById('tooltipTranslation');
        if (!translationEl) return;

        translationEl.style.display = 'block';
        translationEl.innerHTML = '<div class="translation-loading">⏳ Đang dịch...</div>';

        try {
            // Try to find in existing vocabulary first
            const existingVocab = Storage.getVocabulary().find(v => 
                Utils.normalizeText(v.word) === Utils.normalizeText(this.selectedText)
            );

            if (existingVocab) {
                translationEl.innerHTML = `
                    <div class="translation-result">
                        <div class="translation-meaning">${existingVocab.meaning}</div>
                        ${existingVocab.phonetic ? `<div class="translation-phonetic">/${existingVocab.phonetic}/</div>` : ''}
                        ${existingVocab.example ? `<div class="translation-example">${existingVocab.example}</div>` : ''}
                    </div>
                `;
                return;
            }

            // Use a simple dictionary API (MyMemory Translation API - free, no key needed)
            const response = await fetch(
                `https://api.mymemory.translated.net/get?q=${encodeURIComponent(this.selectedText)}&langpair=en|vi`
            );
            
            if (!response.ok) throw new Error('Translation failed');
            
            const data = await response.json();
            
            if (data.responseData && data.responseData.translatedText) {
                translationEl.innerHTML = `
                    <div class="translation-result">
                        <div class="translation-meaning">${data.responseData.translatedText}</div>
                        <button class="btn btn-sm btn-primary save-translation-btn" onclick="TextSelector.saveTranslation('${data.responseData.translatedText}')">
                            💾 Lưu nghĩa này
                        </button>
                    </div>
                `;
            } else {
                throw new Error('No translation found');
            }

        } catch (error) {
            console.error('Translation error:', error);
            translationEl.innerHTML = `
                <div class="translation-error">
                    ❌ Không thể dịch tự động. 
                    <button class="btn btn-sm btn-primary" onclick="TextSelector.showSaveDialog()">
                        Nhập thủ công
                    </button>
                </div>
            `;
        }
    },

    /**
     * Save translation directly
     */
    saveTranslation(meaning) {
        const vocab = {
            word: this.selectedText,
            meaning: meaning,
            phonetic: '',
            example: '',
            category: 'from-reading',
            masteryLevel: 0,
            reviewCount: 0,
            lastReviewed: null
        };

        Storage.addVocabulary(vocab);
        Utils.showNotification(`✅ Đã lưu từ "${this.selectedText}"!`, 'success');
        
        this.hideTooltip();
        
        if (typeof Vocabulary !== 'undefined' && App.currentTab === 'vocabulary') {
            Vocabulary.loadVocabulary();
            Vocabulary.filterAndSort();
        }
    },

    /**
     * Setup language toggle for hover translations
     */
    setupLanguageToggle() {
        // This will be used in vocabulary review mode
        // Add data attributes to vocabulary items for hover translations
    },

    /**
     * Toggle language mode
     */
    toggleLanguage() {
        this.languageMode = this.languageMode === 'en' ? 'vi' : 'en';
        
        // Update all vocab cards to show/hide translations
        const vocabCards = document.querySelectorAll('.vocab-card-hoverable');
        vocabCards.forEach(card => {
            if (this.languageMode === 'vi') {
                card.classList.add('show-vietnamese');
            } else {
                card.classList.remove('show-vietnamese');
            }
        });

        return this.languageMode;
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TextSelector.init());
} else {
    TextSelector.init();
}

// Make TextSelector available globally
window.TextSelector = TextSelector;

/* ==========================================
   Vocabulary Management Module
   Handles vocabulary CRUD operations
   ========================================== */

const Vocabulary = {
    // Current state
    currentList: [],
    filteredList: [],
    searchQuery: '',
    sortOrder: 'newest',
    selectedCategory: 'all',

    /**
     * Initialize vocabulary module
     */
    init() {
        this.loadVocabulary();
        this.bindEvents();
        this.render();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Add vocabulary button
        const addBtn = document.getElementById('addVocabBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addVocabulary());
        }

        // Search input
        const searchInput = document.getElementById('searchVocab');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.searchQuery = e.target.value;
                this.filterAndSort();
            }, 300));
        }

        // Sort select
        const sortSelect = document.getElementById('sortVocab');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.sortOrder = e.target.value;
                this.filterAndSort();
            });
        }

        // Enter key to add vocabulary
        const inputs = ['newWord', 'newMeaning', 'newExample'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.addVocabulary();
                    }
                });
            }
        });
    },

    /**
     * Load vocabulary from storage
     */
    loadVocabulary() {
        this.currentList = Storage.getVocabulary();
        this.filteredList = [...this.currentList];
    },

    /**
     * Add new vocabulary item
     */
    addVocabulary() {
        const wordInput = document.getElementById('newWord');
        const meaningInput = document.getElementById('newMeaning');
        const exampleInput = document.getElementById('newExample');

        if (!wordInput || !meaningInput) return;

        const word = wordInput.value.trim();
        const meaning = meaningInput.value.trim();
        const example = exampleInput.value.trim();

        // Validate inputs
        if (!word) {
            Utils.showNotification('Vui lòng nhập từ vựng', 'warning');
            wordInput.focus();
            return;
        }

        if (!meaning) {
            Utils.showNotification('Vui lòng nhập nghĩa', 'warning');
            meaningInput.focus();
            return;
        }

        // Check for duplicates
        const duplicate = this.currentList.find(v => 
            Utils.normalizeText(v.word) === Utils.normalizeText(word)
        );

        if (duplicate) {
            Utils.showNotification('Từ này đã tồn tại trong danh sách', 'warning');
            return;
        }

        // Create vocabulary object
        const vocab = {
            word: word,
            meaning: meaning,
            example: example,
            phonetic: '',
            category: 'general',
            masteryLevel: 0,
            reviewCount: 0,
            lastReviewed: null
        };

        // Save to storage
        Storage.addVocabulary(vocab);

        // Clear inputs
        wordInput.value = '';
        meaningInput.value = '';
        exampleInput.value = '';

        // Reload and render
        this.loadVocabulary();
        this.filterAndSort();

        Utils.showNotification('Đã thêm từ vựng mới', 'success');

        // Add activity
        Storage.addActivity({
            type: 'vocab_added',
            description: `Thêm từ mới: ${word}`
        });

        // Focus back to word input
        wordInput.focus();
    },

    /**
     * Delete vocabulary item
     * @param {string} id - Vocabulary ID
     */
    deleteVocabulary(id) {
        const vocab = this.currentList.find(v => v.id === id);
        if (!vocab) return;

        if (confirm(`Bạn có chắc muốn xóa từ "${vocab.word}"?`)) {
            Storage.deleteVocabulary(id);
            this.loadVocabulary();
            this.filterAndSort();
            
            Utils.showNotification('Đã xóa từ vựng', 'success');
            
            Storage.addActivity({
                type: 'vocab_deleted',
                description: `Xóa từ: ${vocab.word}`
            });
        }
    },

    /**
     * Update vocabulary item
     * @param {string} id - Vocabulary ID
     * @param {Object} updates - Fields to update
     */
    updateVocabulary(id, updates) {
        Storage.updateVocabulary(id, updates);
        this.loadVocabulary();
        this.filterAndSort();
        Utils.showNotification('Đã cập nhật từ vựng', 'success');
    },

    /**
     * Filter and sort vocabulary list
     */
    filterAndSort() {
        // Filter by search query
        this.filteredList = this.currentList.filter(vocab => {
            if (!this.searchQuery) return true;
            
            const query = Utils.normalizeText(this.searchQuery);
            const word = Utils.normalizeText(vocab.word);
            const meaning = Utils.normalizeText(vocab.meaning);
            
            return word.includes(query) || meaning.includes(query);
        });

        // Sort
        switch (this.sortOrder) {
            case 'newest':
                this.filteredList.sort((a, b) => 
                    new Date(b.createdAt) - new Date(a.createdAt)
                );
                break;
            case 'oldest':
                this.filteredList.sort((a, b) => 
                    new Date(a.createdAt) - new Date(b.createdAt)
                );
                break;
            case 'alphabetical':
                this.filteredList.sort((a, b) => 
                    a.word.localeCompare(b.word)
                );
                break;
        }

        this.render();
    },

    /**
     * Render vocabulary list
     */
    render() {
        const container = document.getElementById('vocabList');
        if (!container) return;

        if (this.filteredList.length === 0) {
            container.innerHTML = '<p class="empty-state">Không tìm thấy từ vựng nào</p>';
            return;
        }

        container.innerHTML = this.filteredList.map(vocab => `
            <div class="vocab-item" data-id="${vocab.id}">
                <div class="vocab-content">
                    <div class="vocab-word">
                        ${vocab.word}
                        ${vocab.phonetic ? `<span class="vocab-phonetic">/${vocab.phonetic}/</span>` : ''}
                    </div>
                    <div class="vocab-meaning">${vocab.meaning}</div>
                    ${vocab.example ? `<div class="vocab-example">${vocab.example}</div>` : ''}
                    <div class="vocab-tags">
                        ${this.getMasteryTag(vocab.masteryLevel)}
                        <span class="vocab-tag">${Utils.formatDateShort(vocab.createdAt)}</span>
                    </div>
                </div>
                <div class="vocab-actions">
                    <button class="vocab-action-btn edit" onclick="Vocabulary.editVocabulary('${vocab.id}')" title="Chỉnh sửa">
                        ✏️
                    </button>
                    <button class="vocab-action-btn delete" onclick="Vocabulary.deleteVocabulary('${vocab.id}')" title="Xóa">
                        🗑️
                    </button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Get mastery level tag
     * @param {number} level - Mastery level (0-5)
     * @returns {string} HTML for mastery tag
     */
    getMasteryTag(level) {
        if (level >= 4) {
            return '<span class="vocab-tag mastered">Đã thành thạo</span>';
        } else if (level >= 2) {
            return '<span class="vocab-tag learning">Đang học</span>';
        }
        return '<span class="vocab-tag">Mới học</span>';
    },

    /**
     * Edit vocabulary item
     * @param {string} id - Vocabulary ID
     */
    editVocabulary(id) {
        const vocab = this.currentList.find(v => v.id === id);
        if (!vocab) return;

        const newWord = prompt('Từ vựng:', vocab.word);
        if (newWord === null) return;

        const newMeaning = prompt('Nghĩa:', vocab.meaning);
        if (newMeaning === null) return;

        const newExample = prompt('Ví dụ:', vocab.example || '');
        
        this.updateVocabulary(id, {
            word: newWord.trim(),
            meaning: newMeaning.trim(),
            example: newExample ? newExample.trim() : ''
        });
    },

    /**
     * Mark vocabulary as reviewed
     * @param {string} id - Vocabulary ID
     */
    markAsReviewed(id) {
        const vocab = this.currentList.find(v => v.id === id);
        if (!vocab) return;

        const updates = {
            reviewCount: (vocab.reviewCount || 0) + 1,
            lastReviewed: new Date().toISOString(),
            masteryLevel: Math.min(5, (vocab.masteryLevel || 0) + 1)
        };

        this.updateVocabulary(id, updates);
    },

    /**
     * Export vocabulary to CSV
     */
    exportToCSV() {
        const headers = ['Từ vựng', 'Nghĩa', 'Ví dụ', 'Mức độ thành thạo', 'Ngày thêm'];
        const rows = this.currentList.map(vocab => [
            vocab.word,
            vocab.meaning,
            vocab.example || '',
            vocab.masteryLevel || 0,
            Utils.formatDateShort(vocab.createdAt)
        ]);

        let csv = headers.join(',') + '\n';
        rows.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `vocabulary_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        Utils.showNotification('Đã xuất danh sách từ vựng', 'success');
    },

    /**
     * Import vocabulary from CSV
     * @param {File} file - CSV file
     */
    importFromCSV(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const lines = csv.split('\n');
                let imported = 0;

                // Skip header row
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    const matches = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
                    if (!matches || matches.length < 2) continue;

                    const word = matches[0].replace(/"/g, '').trim();
                    const meaning = matches[1].replace(/"/g, '').trim();
                    const example = matches[2] ? matches[2].replace(/"/g, '').trim() : '';

                    if (word && meaning) {
                        Storage.addVocabulary({ word, meaning, example });
                        imported++;
                    }
                }

                this.loadVocabulary();
                this.filterAndSort();
                Utils.showNotification(`Đã nhập ${imported} từ vựng`, 'success');
            } catch (error) {
                Utils.showNotification('Lỗi khi nhập file CSV', 'error');
            }
        };
        reader.readAsText(file);
    },

    /**
     * Get vocabulary statistics
     * @returns {Object} Statistics
     */
    getStatistics() {
        const total = this.currentList.length;
        const mastered = this.currentList.filter(v => v.masteryLevel >= 4).length;
        const learning = this.currentList.filter(v => v.masteryLevel >= 2 && v.masteryLevel < 4).length;
        const newWords = this.currentList.filter(v => v.masteryLevel < 2).length;

        return {
            total,
            mastered,
            learning,
            newWords,
            masteredPercentage: total > 0 ? (mastered / total * 100).toFixed(1) : 0
        };
    },

    /**
     * Get random vocabulary for practice
     * @param {number} count - Number of words to get
     * @returns {Array} Random vocabulary items
     */
    getRandomVocabulary(count = 10) {
        return Utils.shuffleArray(this.currentList).slice(0, count);
    },

    /**
     * Search vocabulary by word
     * @param {string} word - Word to search
     * @returns {Object|null} Vocabulary item or null
     */
    searchByWord(word) {
        return this.currentList.find(v => 
            Utils.normalizeText(v.word) === Utils.normalizeText(word)
        );
    },

    /**
     * Export vocabulary to JSON file
     */
    exportVocabulary() {
        const data = {
            vocabulary: this.currentList,
            exportedAt: new Date().toISOString(),
            totalWords: this.currentList.length
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `vocabulary-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);

        Utils.showNotification(`✅ Đã xuất ${this.currentList.length} từ vựng`, 'success');
    },

    /**
     * Import vocabulary from JSON file
     * @param {File} file - JSON file to import
     */
    async importVocabulary(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            let importedWords = [];
            
            if (Array.isArray(data)) {
                importedWords = data;
            } else if (data.vocabulary && Array.isArray(data.vocabulary)) {
                importedWords = data.vocabulary;
            } else {
                throw new Error('Invalid vocabulary file format');
            }

            let addedCount = 0;
            let duplicateCount = 0;

            importedWords.forEach(word => {
                // Check for duplicates
                const exists = this.currentList.find(v =>
                    Utils.normalizeText(v.word) === Utils.normalizeText(word.word)
                );

                if (!exists && word.word && word.meaning) {
                    Storage.addVocabulary({
                        word: word.word,
                        meaning: word.meaning,
                        example: word.example || '',
                        phonetic: word.phonetic || '',
                        category: word.category || 'imported',
                        masteryLevel: word.masteryLevel || 0,
                        reviewCount: word.reviewCount || 0,
                        lastReviewed: null
                    });
                    addedCount++;
                } else {
                    duplicateCount++;
                }
            });

            this.loadVocabulary();
            this.filterAndSort();

            Utils.showNotification(
                `✅ Đã import ${addedCount} từ mới${duplicateCount > 0 ? `, ${duplicateCount} từ đã tồn tại` : ''}`,
                'success'
            );

            Storage.addActivity({
                type: 'vocab_imported',
                description: `Import ${addedCount} từ vựng từ file`
            });

        } catch (error) {
            console.error('Import error:', error);
            Utils.showNotification('❌ Lỗi khi import file từ vựng', 'error');
        }
    },

    /**
     * Clear all vocabulary (with confirmation)
     */
    clearAll() {
        if (!confirm('Bạn có chắc muốn xóa TẤT CẢ từ vựng? Hành động này không thể hoàn tác.')) {
            return;
        }

        Storage.set(Storage.KEYS.VOCABULARY, []);
        this.loadVocabulary();
        this.filterAndSort();

        Utils.showNotification('Đã xóa tất cả từ vựng', 'success');

        Storage.addActivity({
            type: 'vocab_cleared',
            description: 'Xóa tất cả từ vựng'
        });
    }
};

// Make Vocabulary available globally
window.Vocabulary = Vocabulary;
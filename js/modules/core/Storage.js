/* ==========================================
   Storage Management Module
   Handles all data persistence operations
   Uses localStorage for permanent data storage
   ========================================== */

const Storage = {
    // Storage keys
    KEYS: {
        USER_DATA: 'ielts_user_data',
        VOCABULARY: 'ielts_vocabulary',
        ERRORS: 'ielts_errors',
        PROGRESS: 'ielts_progress',
        SETTINGS: 'ielts_settings',
        ACTIVITIES: 'ielts_activities',
        TESTS: 'ielts_tests',
        CUSTOM_TESTS: 'ielts_custom_tests',
        LAST_BACKUP: 'ielts_last_backup',
        LAST_SAVE: 'ielts_last_save'
    },

    // Autosave status
    lastSaveTime: null,
    saveQueue: [],
    isSaving: false,
    saveIndicatorTimeout: null,

    /**
     * Initialize storage with default data
     */
    init() {
        console.log('📦 Initializing Storage with localStorage...');
        
        // Check if localStorage is available
        if (!this.isLocalStorageAvailable()) {
            console.warn('⚠️ localStorage không khả dụng, dữ liệu sẽ không được lưu!');
            Utils.showNotification('Trình duyệt không hỗ trợ lưu dữ liệu vĩnh viễn', 'warning');
        }
        
        // Check if this is first time user
        if (!this.get(this.KEYS.USER_DATA)) {
            this.initializeDefaultData();
        }
        
        // Auto backup every 5 minutes
        setInterval(() => this.autoBackup(), 5 * 60 * 1000);
        
        // Show last save time
        this.lastSaveTime = this.get(this.KEYS.LAST_SAVE);
        if (this.lastSaveTime) {
            console.log(`📅 Lần lưu cuối: ${new Date(this.lastSaveTime).toLocaleString('vi-VN')}`);
        }
    },
    
    /**
     * Check if localStorage is available
     */
    isLocalStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },

    /**
     * Initialize default data for new users
     */
    initializeDefaultData() {
        const defaultData = {
            userData: {
                name: '',
                targetBand: 8.0,
                currentLevel: 5.0,
                createdAt: new Date().toISOString()
            },
            progress: {
                completed: 0,
                average: 0,
                totalTime: 0,
                vocabCount: 0,
                streak: 0,
                lastStudyDate: null,
                totalTests: 0,
                bandProgress: {
                    '5.0': 0,
                    '6.0': 0,
                    '6.5': 0,
                    '7.0': 0,
                    '7.5': 0,
                    '8.0': 0,
                    '8.5': 0,
                    '9.0': 0
                },
                questionTypeStats: {}
            },
            vocabulary: [],
            errors: [],
            activities: [],
            tests: [],
            settings: {
                theme: 'light',
                notifications: true,
                soundEffects: true,
                autoSave: true,
                language: 'vi'
            }
        };

        this.set(this.KEYS.USER_DATA, defaultData.userData);
        this.set(this.KEYS.PROGRESS, defaultData.progress);
        this.set(this.KEYS.VOCABULARY, defaultData.vocabulary);
        this.set(this.KEYS.ERRORS, defaultData.errors);
        this.set(this.KEYS.ACTIVITIES, defaultData.activities);
        this.set(this.KEYS.TESTS, defaultData.tests);
        this.set(this.KEYS.SETTINGS, defaultData.settings);
        
        console.log('✅ Default data initialized');
    },

    /**
     * Save data to memory storage
     * @param {string} key - Storage key
     * @param {*} value - Value to store
     * @returns {boolean} Success status
     */
    set(key, value) {
        try {
            const data = JSON.stringify(value);
            localStorage.setItem(key, data);
            
            // Update last save time
            this.lastSaveTime = new Date().toISOString();
            localStorage.setItem(this.KEYS.LAST_SAVE, JSON.stringify(this.lastSaveTime));
            
            // Show successful autosave indicator
            this.showSaveIndicator(true);
            
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            
            // Show failed autosave indicator
            this.showSaveIndicator(false);
            
            // Check if quota exceeded
            if (error.name === 'QuotaExceededError') {
                Utils.showNotification('Bộ nhớ full! Hãy xóa bớt dữ liệu.', 'error');
            } else {
                Utils.showNotification('Lỗi khi lưu dữ liệu', 'error');
            }
            return false;
        }
    },

    /**
     * Retrieve data from localStorage
     * @param {string} key - Storage key
     * @returns {*} Retrieved value or null
     */
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Storage get error:', error);
            return null;
        }
    },
    
    /**
     * Show autosave indicator
     */
    showSaveIndicator(success = true) {
        // Clear existing timeout to debounce
        if (this.saveIndicatorTimeout) {
            clearTimeout(this.saveIndicatorTimeout);
        }

        // Create or update save indicator
        let indicator = document.getElementById('autosaveIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'autosaveIndicator';
            indicator.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                padding: 8px 16px;
                background: rgba(40, 167, 69, 0.9);
                color: white;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                z-index: 9999;
                opacity: 0;
                transition: all 0.3s ease;
                pointer-events: none;
            `;
            document.body.appendChild(indicator);
        }
        
        if (success) {
            indicator.textContent = '💾 Đã lưu tự động';
            indicator.style.background = 'rgba(40, 167, 69, 0.9)';
        } else {
            indicator.textContent = '❌ Lỗi lưu dữ liệu';
            indicator.style.background = 'rgba(220, 53, 69, 0.9)';
        }
        
        indicator.style.opacity = '1';
        
        // Use debounce - hide after 2s
        this.saveIndicatorTimeout = setTimeout(() => {
            indicator.style.opacity = '0';
        }, 2000);
    },

    /**
     * Remove data from memory storage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },

    /**
     * Clear all storage data
     * @returns {boolean} Success status
     */
    clear() {
        try {
            Object.values(this.KEYS).forEach(key => {
                this.remove(key);
            });
            console.log('✅ All data cleared');
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    },

    /**
     * Get user data
     * @returns {Object} User data
     */
    getUserData() {
        return this.get(this.KEYS.USER_DATA) || {};
    },

    /**
     * Update user data
     * @param {Object} data - User data to update
     */
    updateUserData(data) {
        const current = this.getUserData();
        this.set(this.KEYS.USER_DATA, { ...current, ...data });
    },

    /**
     * Get progress data
     * @returns {Object} Progress data
     */
    getProgress() {
        return this.get(this.KEYS.PROGRESS) || {
            completed: 0,
            average: 0,
            totalTime: 0,
            vocabCount: 0,
            streak: 0,
            lastStudyDate: null,
            totalTests: 0,
            bandProgress: {},
            questionTypeStats: {}
        };
    },

    /**
     * Update progress data
     * @param {Object} data - Progress data to update
     */
    updateProgress(data) {
        const current = this.getProgress();
        this.set(this.KEYS.PROGRESS, { ...current, ...data });
    },

    /**
     * Get vocabulary list
     * @returns {Array} Vocabulary items
     */
    getVocabulary() {
        return this.get(this.KEYS.VOCABULARY) || [];
    },

    /**
     * Add vocabulary item
     * @param {Object} vocab - Vocabulary item
     */
    addVocabulary(vocab) {
        const vocabList = this.getVocabulary();
        vocabList.push({
            ...vocab,
            id: Utils.generateId(),
            createdAt: new Date().toISOString(),
            masteryLevel: 0
        });
        this.set(this.KEYS.VOCABULARY, vocabList);
        
        // Update vocab count
        const progress = this.getProgress();
        progress.vocabCount = vocabList.length;
        this.updateProgress(progress);
    },

    /**
     * Update vocabulary item
     * @param {string} id - Vocabulary ID
     * @param {Object} updates - Updates to apply
     */
    updateVocabulary(id, updates) {
        const vocabList = this.getVocabulary();
        const index = vocabList.findIndex(v => v.id === id);
        if (index !== -1) {
            vocabList[index] = { ...vocabList[index], ...updates };
            this.set(this.KEYS.VOCABULARY, vocabList);
        }
    },

    /**
     * Delete vocabulary item
     * @param {string} id - Vocabulary ID
     */
    deleteVocabulary(id) {
        const vocabList = this.getVocabulary();
        const filtered = vocabList.filter(v => v.id !== id);
        this.set(this.KEYS.VOCABULARY, filtered);
        
        // Update vocab count
        const progress = this.getProgress();
        progress.vocabCount = filtered.length;
        this.updateProgress(progress);
    },

    /**
     * Get error logs
     * @returns {Array} Error items
     */
    getErrors() {
        return this.get(this.KEYS.ERRORS) || [];
    },

    /**
     * Add error log
     * @param {Object} error - Error item
     */
    addError(error) {
        const errors = this.getErrors();
        errors.unshift({
            ...error,
            id: Utils.generateId(),
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 100 errors
        if (errors.length > 100) {
            errors.length = 100;
        }
        
        this.set(this.KEYS.ERRORS, errors);
    },

    /**
     * Clear all errors
     */
    clearErrors() {
        this.set(this.KEYS.ERRORS, []);
    },

    /**
     * Get activities
     * @returns {Array} Activity items
     */
    getActivities() {
        return this.get(this.KEYS.ACTIVITIES) || [];
    },

    /**
     * Add activity
     * @param {Object} activity - Activity item
     */
    addActivity(activity) {
        const activities = this.getActivities();
        activities.unshift({
            ...activity,
            id: Utils.generateId(),
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 50 activities
        if (activities.length > 50) {
            activities.length = 50;
        }
        
        this.set(this.KEYS.ACTIVITIES, activities);
    },

    /**
     * Get all tests
     * @returns {Array} Test results
     */
    getTests() {
        return this.get(this.KEYS.TESTS) || [];
    },

    /**
     * Add test result
     * @param {Object} test - Test result
     */
    addTest(test) {
        const tests = this.getTests();
        const testData = {
            ...test,
            id: Utils.generateId(),
            timestamp: new Date().toISOString()
        };
        
        tests.unshift(testData);
        this.set(this.KEYS.TESTS, tests);
        
        // Update progress
        const progress = this.getProgress();
        progress.completed++;
        progress.totalTests++;
        
        // Update average score
        const totalScore = tests.reduce((sum, t) => sum + t.bandScore, 0);
        progress.average = totalScore / tests.length;
        
        // Update band progress
        if (!progress.bandProgress[test.level]) {
            progress.bandProgress[test.level] = 0;
        }
        progress.bandProgress[test.level]++;
        
        // Update question type stats
        if (test.questionType) {
            if (!progress.questionTypeStats[test.questionType]) {
                progress.questionTypeStats[test.questionType] = {
                    total: 0,
                    correct: 0,
                    accuracy: 0
                };
            }
            const stats = progress.questionTypeStats[test.questionType];
            stats.total += test.totalQuestions;
            stats.correct += test.correctAnswers;
            stats.accuracy = (stats.correct / stats.total) * 100;
        }
        
        this.updateProgress(progress);
        
        // Add activity
        this.addActivity({
            type: 'test_completed',
            description: `Hoàn thành bài test ${test.questionType} - Band ${test.bandScore}`,
            bandScore: test.bandScore
        });
    },

    /**
     * Get settings
     * @returns {Object} Settings
     */
    getSettings() {
        return this.get(this.KEYS.SETTINGS) || {
            theme: 'light',
            notifications: true,
            soundEffects: true,
            autoSave: true,
            language: 'vi'
        };
    },

    /**
     * Update settings
     * @param {Object} settings - Settings to update
     */
    updateSettings(settings) {
        const current = this.getSettings();
        this.set(this.KEYS.SETTINGS, { ...current, ...settings });
    },

    /**
     * Update study streak
     */
    updateStreak() {
        const progress = this.getProgress();
        const today = new Date().toDateString();
        const lastStudy = progress.lastStudyDate ? new Date(progress.lastStudyDate).toDateString() : null;
        
        if (lastStudy === today) {
            // Already studied today
            return;
        }
        
        if (lastStudy) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastStudy === yesterday.toDateString()) {
                // Continue streak
                progress.streak++;
            } else {
                // Streak broken
                progress.streak = 1;
            }
        } else {
            // First study
            progress.streak = 1;
        }
        
        progress.lastStudyDate = new Date().toISOString();
        this.updateProgress(progress);
    },

    /**
     * Export all data
     * @returns {Object} All data
     */
    exportData() {
        return {
            userData: this.getUserData(),
            progress: this.getProgress(),
            vocabulary: this.getVocabulary(),
            errors: this.getErrors(),
            activities: this.getActivities(),
            tests: this.getTests(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString()
        };
    },

    /**
     * Import data
     * @param {Object} data - Data to import
     * @returns {boolean} Success status
     */
    importData(data) {
        try {
            if (data.userData) this.set(this.KEYS.USER_DATA, data.userData);
            if (data.progress) this.set(this.KEYS.PROGRESS, data.progress);
            if (data.vocabulary) this.set(this.KEYS.VOCABULARY, data.vocabulary);
            if (data.errors) this.set(this.KEYS.ERRORS, data.errors);
            if (data.activities) this.set(this.KEYS.ACTIVITIES, data.activities);
            if (data.tests) this.set(this.KEYS.TESTS, data.tests);
            if (data.settings) this.set(this.KEYS.SETTINGS, data.settings);
            
            Utils.showNotification('Nhập dữ liệu thành công!', 'success');
            return true;
        } catch (error) {
            console.error('Import error:', error);
            Utils.showNotification('Lỗi khi nhập dữ liệu', 'error');
            return false;
        }
    },

    /**
     * Auto backup data
     */
    autoBackup() {
        const data = this.exportData();
        this.set(this.KEYS.LAST_BACKUP, {
            timestamp: new Date().toISOString(),
            dataSize: JSON.stringify(data).length
        });
        console.log('✅ Auto backup completed');
    },

    /**
     * Get last backup info
     * @returns {Object|null} Backup info
     */
    getLastBackupInfo() {
        return this.get(this.KEYS.LAST_BACKUP);
    },

    /**
     * Get storage usage statistics
     * @returns {Object} Storage stats
     */
    getStorageStats() {
        const data = this.exportData();
        const totalSize = JSON.stringify(data).length;
        
        return {
            totalSize: totalSize,
            formattedSize: (totalSize / 1024).toFixed(2) + ' KB',
            vocabularyCount: data.vocabulary.length,
            errorCount: data.errors.length,
            testCount: data.tests.length,
            activityCount: data.activities.length
        };
    }
};

// Make Storage available globally
window.Storage = Storage;
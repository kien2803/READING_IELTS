/* ==========================================
   Main Application Controller
   Initializes and coordinates all modules
   ========================================== */

const App = {
    // Application state
    currentTab: 'dashboard',
    isInitialized: false,

    /**
     * Initialize the entire application
     */
    async init() {
        console.log('🚀 Initializing IELTS Reading App...');

        try {
            // Initialize storage first
            Storage.init();
            console.log('✅ Storage initialized');

            // Initialize all modules
            this.initializeModules();

            // Setup event listeners
            this.setupEventListeners();

            // Setup upload functionality
            this.setupUpload();

            // Setup backup functionality
            this.setupBackup();

            // Load initial tab
            this.switchTab('dashboard');

            // Check achievements
            Dashboard.checkAchievements();

            // Mark as initialized
            this.isInitialized = true;

            console.log('✅ App initialized successfully');
            Utils.showNotification('Chào mừng đến với IELTS Reading Practice!', 'success', 3000);

        } catch (error) {
            console.error('❌ Initialization error:', error);
            Utils.showNotification('Có lỗi khi khởi động ứng dụng', 'error');
        }
    },

    /**
     * Initialize all modules
     */
    initializeModules() {
        // Initialize timer with 60 minutes
        Timer.init({
            duration: 3600,
            warningThreshold: 300,
            onComplete: () => {
                Utils.showNotification('Hết giờ! Hãy nộp bài của bạn.', 'warning', 5000);
            }
        });

        // Initialize dashboard
        Dashboard.init();

        // Initialize vocabulary
        Vocabulary.init();

        // Initialize error tracker
        ErrorTracker.init();

        // Initialize practice module
        Practice.init();

        console.log('✅ All modules initialized');
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                if (tab) {
                    this.switchTab(tab);
                }
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Window beforeunload
        window.addEventListener('beforeunload', (e) => {
            if (Timer.isRunning()) {
                e.preventDefault();
                e.returnValue = 'Bộ đếm giờ đang chạy. Bạn có chắc muốn thoát?';
            }
        });

        // Handle visibility change (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                console.log('App hidden');
            } else {
                console.log('App visible');
                Dashboard.refresh();
            }
        });

        console.log('✅ Event listeners setup');
    },

    /**
     * Switch between tabs
     * @param {string} tabName - Tab name to switch to
     */
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active class from all buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        const selectedTab = document.getElementById(tabName);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        // Add active class to button
        const selectedBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }

        // Update current tab
        this.currentTab = tabName;

        // Refresh tab content
        this.refreshTab(tabName);

        // Add to history
        if (history.pushState) {
            history.pushState({ tab: tabName }, '', `#${tabName}`);
        }
    },

    /**
     * Refresh specific tab content
     * @param {string} tabName - Tab name
     */
    refreshTab(tabName) {
        switch (tabName) {
            case 'dashboard':
                Dashboard.refresh();
                break;
            case 'vocabulary':
                Vocabulary.filterAndSort();
                break;
            case 'errors':
                ErrorTracker.render();
                break;
            case 'practice':
                Practice.renderTestSelector();
                break;
            case 'upload':
                this.updateBackupInfo();
                this.renderTestLibrary();
                break;
        }
    },

    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + S: Save/Export data
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            this.exportAllData();
        }

        // Ctrl/Cmd + K: Focus search (in vocabulary tab)
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchVocab');
            if (searchInput && this.currentTab === 'vocabulary') {
                searchInput.focus();
            }
        }

        // Esc: Close modals
        if (e.key === 'Escape') {
            const modal = document.querySelector('.result-overlay');
            if (modal) {
                modal.remove();
            }
        }

        // Tab shortcuts: Ctrl + 1-5
        if (e.ctrlKey && e.key >= '1' && e.key <= '5') {
            e.preventDefault();
            const tabs = ['dashboard', 'practice', 'vocabulary', 'errors', 'upload'];
            const index = parseInt(e.key) - 1;
            if (tabs[index]) {
                this.switchTab(tabs[index]);
            }
        }
    },

    /**
     * Setup file upload functionality
     */
    setupUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        if (!uploadArea || !fileInput) return;

        // Click to upload
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#667eea';
            uploadArea.style.background = '#f0f4ff';
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '';
            uploadArea.style.background = '';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '';
            uploadArea.style.background = '';

            const files = e.dataTransfer.files;
            this.handleFileUpload(files);
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });

        console.log('✅ Upload functionality setup');
    },

    /**
     * Handle file upload
     * @param {FileList} files - Files to upload
     */
    async handleFileUpload(files) {
        for (const file of Array.from(files)) {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                Utils.showNotification(`File "${file.name}" quá lớn (max 10MB)`, 'error');
                continue;
            }

            // Check file type
            const allowedTypes = ['.json', '.txt'];
            const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
            
            if (!allowedTypes.includes(fileExt)) {
                Utils.showNotification(`Định dạng file không được hỗ trợ: ${fileExt}`, 'error');
                continue;
            }

            // Try to parse as test file
            try {
                Utils.showNotification(`Đang xử lý file: ${file.name}...`, 'info', 2000);
                
                const testData = await FileParser.parseFile(file);
                const testId = FileParser.saveTest(testData);
                
                // Refresh test library display
                this.renderTestLibrary();
                
                Utils.showNotification(`✅ Đã tạo đề thi: ${testData.title || file.name}`, 'success');

                // Store file info in activity
                Storage.addActivity({
                    type: 'test_uploaded',
                    description: `Tạo đề thi: ${testData.title || file.name}`
                });

            } catch (error) {
                console.error('Parse error:', error);
                Utils.showNotification(`❌ Không thể parse file: ${error.message}`, 'error');
            }
        }
        
        // Clear file input
        const fileInput = document.getElementById('fileInput');
        if (fileInput) fileInput.value = '';
    },

    /**
     * Render test library
     */
    renderTestLibrary() {
        const container = document.getElementById('testLibrary');
        if (!container) return;

        const tests = FileParser.getCustomTests();
        
        if (tests.length === 0) {
            container.innerHTML = '<p class="empty-state">Chưa có đề thi nào. Hãy upload file để bắt đầu!</p>';
            
            // Hide clear all button
            const clearBtn = document.getElementById('clearAllTestsBtn');
            if (clearBtn) clearBtn.style.display = 'none';
            return;
        }

        // Show clear all button
        const clearBtn = document.getElementById('clearAllTestsBtn');
        if (clearBtn) clearBtn.style.display = 'block';

        // Sort by creation date (newest first)
        tests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        container.innerHTML = tests.map(test => {
            const totalQuestions = test.passages.reduce((sum, p) => sum + p.questions.length, 0);
            const createdDate = new Date(test.createdAt).toLocaleDateString('vi-VN');
            
            return `
                <div class="test-card" data-test-id="${test.id}">
                    <div class="test-card-header">
                        <h4 class="test-card-title">${test.title || 'IELTS Reading Test'}</h4>
                        <span class="test-card-level">Band ${test.level}</span>
                    </div>
                    
                    <div class="test-card-meta">
                        <div class="test-card-meta-item">
                            <span>📖</span>
                            <span>${test.passages.length} passage${test.passages.length > 1 ? 's' : ''}</span>
                        </div>
                        <div class="test-card-meta-item">
                            <span>❓</span>
                            <span>${totalQuestions} questions</span>
                        </div>
                    </div>
                    
                    <div class="test-card-date">
                        📅 Uploaded: ${createdDate}
                    </div>
                    
                    <div class="test-card-actions">
                        <button class="btn btn-success" onclick="App.startCustomTest('${test.id}')">
                            ▶️ Bắt đầu
                        </button>
                        <button class="btn btn-primary" onclick="App.viewTestDetails('${test.id}')">
                            👁️ Xem
                        </button>
                        <button class="btn btn-danger" onclick="App.deleteCustomTest('${test.id}')">
                            🗑️
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * Start custom test
     * @param {string} testId - Test ID
     */
    startCustomTest(testId) {
        const testData = FileParser.loadCustomTest(testId);
        if (!testData) {
            Utils.showNotification('Không tìm thấy đề thi', 'error');
            return;
        }

        // Switch to practice tab
        this.switchTab('practice');

        // Load custom test into practice module
        Practice.loadCustomTest(testData);
        
        Utils.showNotification(`Bắt đầu: ${testData.title}`, 'success');
    },

    /**
     * View test details
     * @param {string} testId - Test ID
     */
    viewTestDetails(testId) {
        const testData = FileParser.loadCustomTest(testId);
        if (!testData) {
            Utils.showNotification('Không tìm thấy đề thi', 'error');
            return;
        }

        const totalQuestions = testData.passages.reduce((sum, p) => sum + p.questions.length, 0);
        
        // Group questions by type
        const questionTypes = {};
        testData.passages.forEach(passage => {
            passage.questions.forEach(q => {
                questionTypes[q.type] = (questionTypes[q.type] || 0) + 1;
            });
        });

        const typesList = Object.entries(questionTypes)
            .map(([type, count]) => `<li>${this.getQuestionTypeName(type)}: ${count} questions</li>`)
            .join('');

        const modal = document.createElement('div');
        modal.className = 'result-overlay';
        modal.innerHTML = `
            <div class="result-modal" style="max-width: 600px; text-align: left;">
                <h2 style="text-align: center; margin-bottom: 20px;">📋 Chi tiết đề thi</h2>
                
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #667eea;">${testData.title}</h3>
                    <p style="color: #666;">Level: <strong>Band ${testData.level}</strong></p>
                </div>

                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h4 style="margin-bottom: 10px;">📊 Thống kê:</h4>
                    <ul style="margin-left: 20px;">
                        <li>Số passages: ${testData.passages.length}</li>
                        <li>Tổng số câu hỏi: ${totalQuestions}</li>
                        <li>Thời gian đề xuất: 60 phút</li>
                    </ul>
                </div>

                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h4 style="margin-bottom: 10px;">📝 Các dạng câu hỏi:</h4>
                    <ul style="margin-left: 20px;">
                        ${typesList}
                    </ul>
                </div>

                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <h4 style="margin-bottom: 10px;">📚 Các Passages:</h4>
                    ${testData.passages.map((p, i) => `
                        <div style="margin-bottom: 10px;">
                            <strong>Passage ${i + 1}:</strong> ${p.title}<br>
                            <span style="color: #666; font-size: 13px;">${p.questions.length} questions • ${p.text.length} characters</span>
                        </div>
                    `).join('')}
                </div>

                <div class="result-actions">
                    <button class="btn btn-success" onclick="App.startCustomTest('${testId}'); this.closest('.result-overlay').remove();">
                        ▶️ Bắt đầu làm bài
                    </button>
                    <button class="btn btn-warning" onclick="this.closest('.result-overlay').remove()">
                        Đóng
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    /**
     * Get question type display name
     * @param {string} type - Question type
     * @returns {string} Display name
     */
    getQuestionTypeName(type) {
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
     * Delete custom test
     * @param {string} testId - Test ID
     */
    deleteCustomTest(testId) {
        if (confirm('Bạn có chắc muốn xóa đề thi này?')) {
            FileParser.deleteCustomTest(testId);
            this.renderTestLibrary();
        }
    },

    /**
     * Clear all tests
     */
    clearAllTests() {
        const tests = FileParser.getCustomTests();
        if (tests.length === 0) {
            Utils.showNotification('Không có đề thi nào để xóa', 'info');
            return;
        }

        if (confirm(`Bạn có chắc muốn xóa tất cả ${tests.length} đề thi?`)) {
            Storage.set('custom_tests', []);
            this.renderTestLibrary();
            Utils.showNotification('Đã xóa tất cả đề thi', 'success');
        }
    },

    /**
     * Setup backup functionality
     */
    setupBackup() {
        const exportBtn = document.getElementById('exportDataBtn');
        const importBtn = document.getElementById('importDataBtn');
        const importFile = document.getElementById('importFile');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportAllData());
        }

        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => importFile.click());
            importFile.addEventListener('change', (e) => this.importData(e.target.files[0]));
        }

        console.log('✅ Backup functionality setup');
    },

    /**
     * Export all data
     */
    exportAllData() {
        const data = Storage.exportData();
        const filename = `ielts-reading-backup-${new Date().toISOString().split('T')[0]}.json`;
        
        Utils.exportToJSON(data, filename);
        this.updateBackupInfo();
        
        Utils.showNotification('Đã xuất dữ liệu thành công', 'success');

        Storage.addActivity({
            type: 'data_exported',
            description: 'Xuất dữ liệu ra file'
        });
    },

    /**
     * Import data from file
     * @param {File} file - JSON file to import
     */
    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Validate data structure
                if (!data.userData && !data.progress) {
                    throw new Error('Invalid data format');
                }

                // Confirm import
                if (confirm('Nhập dữ liệu sẽ ghi đè lên dữ liệu hiện tại. Bạn có chắc chắn?')) {
                    Storage.importData(data);
                    
                    // Refresh all modules
                    Dashboard.refresh();
                    Vocabulary.loadVocabulary();
                    Vocabulary.filterAndSort();
                    ErrorTracker.loadErrors();
                    ErrorTracker.render();
                    
                    Utils.showNotification('Đã nhập dữ liệu thành công!', 'success');
                    
                    Storage.addActivity({
                        type: 'data_imported',
                        description: 'Nhập dữ liệu từ file'
                    });
                }
            } catch (error) {
                console.error('Import error:', error);
                Utils.showNotification('Lỗi: File dữ liệu không hợp lệ', 'error');
            }
        };

        reader.readAsText(file);
    },

    /**
     * Update backup info display
     */
    updateBackupInfo() {
        const lastBackupEl = document.getElementById('lastBackup');
        const backupInfo = Storage.getLastBackupInfo();

        if (lastBackupEl) {
            if (backupInfo) {
                lastBackupEl.textContent = Utils.formatDate(backupInfo.timestamp);
            } else {
                lastBackupEl.textContent = 'Chưa có';
            }
        }
    },

    /**
     * Show example file format
     */
    showExampleFormat() {
        const modal = document.createElement('div');
        modal.className = 'result-overlay';
        modal.innerHTML = `
            <div class="result-modal" style="max-width: 700px; max-height: 80vh; overflow-y: auto;">
                <h2>📝 Hướng dẫn định dạng file</h2>
                <div style="text-align: left; margin: 20px 0;">
                    <h3>Format JSON:</h3>
                    <pre style="background: #f5f5f5; padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 12px;">${this.escapeHtml(FileParser.generateExample('json'))}</pre>
                    
                    <h3 style="margin-top: 20px;">Format TXT:</h3>
                    <pre style="background: #f5f5f5; padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 12px; white-space: pre-wrap;">${this.escapeHtml(FileParser.generateExample('txt'))}</pre>
                </div>
                <div class="result-actions">
                    <button class="btn btn-primary" onclick="App.downloadExample('json')">
                        📥 Tải mẫu JSON
                    </button>
                    <button class="btn btn-success" onclick="App.downloadExample('txt')">
                        📥 Tải mẫu TXT
                    </button>
                    <button class="btn btn-warning" onclick="this.closest('.result-overlay').remove()">
                        Đóng
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    },

    /**
     * Escape HTML
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Download example file
     * @param {string} format - File format
     */
    downloadExample(format) {
        const content = FileParser.generateExample(format);
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ielts-test-example.${format}`;
        link.click();
        URL.revokeObjectURL(url);
        
        Utils.showNotification(`Đã tải file mẫu ${format.toUpperCase()}`, 'success');
    },

    /**
     * Show app statistics
     */
    showStatistics() {
        const stats = Storage.getStorageStats();
        const performance = Dashboard.getPerformanceSummary();

        console.log('=== App Statistics ===');
        console.log('Storage:', stats);
        console.log('Performance:', performance);
        console.log('Current tab:', this.currentTab);
        console.log('Initialized:', this.isInitialized);
    },

    /**
     * Clear all app data (with confirmation)
     */
    clearAllData() {
        if (!confirm('⚠️ CẢNH BÁO: Hành động này sẽ XÓA TẤT CẢ dữ liệu của bạn và không thể hoàn tác. Bạn có chắc chắn?')) {
            return;
        }

        if (!confirm('Bạn có thực sự chắc chắn? Hãy xác nhận lần nữa để xóa tất cả dữ liệu.')) {
            return;
        }

        Storage.clear();
        Storage.initializeDefaultData();
        
        // Reload page
        location.reload();
    },

    /**
     * Get app version and info
     * @returns {Object} App info
     */
    getAppInfo() {
        return {
            name: 'IELTS Reading Practice',
            version: '1.0.0',
            build: '2024.01.16',
            author: 'IELTS Learning Team',
            initialized: this.isInitialized,
            currentTab: this.currentTab
        };
    },

    /**
     * Handle browser back/forward
     */
    handlePopState() {
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.tab) {
                this.switchTab(e.state.tab);
            } else {
                // Get tab from URL hash
                const hash = window.location.hash.substring(1);
                if (hash) {
                    this.switchTab(hash);
                }
            }
        });
    }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}

// Handle browser history
App.handlePopState();

// Make App available globally for debugging
window.App = App;

// Add console welcome message
console.log('%c🎯 IELTS Reading - Road to 9.0', 'color: #667eea; font-size: 20px; font-weight: bold;');
console.log('%cVersion 1.0.0', 'color: #666; font-size: 12px;');
console.log('%cType App.showStatistics() to view stats', 'color: #999; font-size: 11px;');

// Export for development/debugging
window.IELTS = {
    App,
    Storage,
    Timer,
    Vocabulary,
    ErrorTracker,
    Practice,
    Dashboard,
    Utils
};
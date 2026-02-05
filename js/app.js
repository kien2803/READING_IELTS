/* ==========================================
   Main Application Controller
   IELTS Reading Practice - Road to 9.0
   ========================================== */

const App = {
    currentTab: 'dashboard',
    isInitialized: false,

    /**
     * Initialize the application
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

            // Setup sidebar
            this.setupSidebar();

            // Setup upload functionality
            this.setupUpload();

            // Setup backup functionality
            this.setupBackup();

            // Load initial tab
            this.switchTab('dashboard');

            // Update topbar stats
            this.updateTopbarStats();

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
        // Core modules
        if (typeof Timer !== 'undefined') Timer.init();
        if (typeof Dashboard !== 'undefined') Dashboard.init();
        if (typeof Vocabulary !== 'undefined') Vocabulary.init();
        if (typeof ErrorTracker !== 'undefined') ErrorTracker.init();
        if (typeof Practice !== 'undefined') Practice.init();

        // New modules
        if (typeof Library !== 'undefined') Library.init();
        if (typeof ManualEntry !== 'undefined') ManualEntry.init();
        if (typeof Drill !== 'undefined') Drill.renderStats();
        if (typeof MiniTest !== 'undefined') MiniTest.renderHistory();
        if (typeof AIAnalysis !== 'undefined') AIAnalysis.renderTypeStats();

        console.log('✅ All modules initialized');
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Navigation items
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                if (tab) this.switchTab(tab);
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.tab) {
                this.switchTab(e.state.tab, false);
            }
        });

        // Handle hash changes
        window.addEventListener('hashchange', () => {
            const hash = window.location.hash.replace('#', '');
            if (hash) this.switchTab(hash, false);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcut(e);
        });

        // Check initial hash
        const hash = window.location.hash.replace('#', '');
        if (hash) {
            setTimeout(() => this.switchTab(hash), 100);
        }
    },

    /**
     * Setup sidebar functionality
     */
    setupSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggle = document.getElementById('sidebarToggle');
        const mobileBtn = document.getElementById('mobileMenuBtn');

        // Toggle sidebar collapse
        if (toggle) {
            toggle.addEventListener('click', () => {
                sidebar.classList.toggle('collapsed');
                localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
            });
        }

        // Mobile menu toggle
        if (mobileBtn) {
            mobileBtn.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-open');
            });
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('mobile-open')) {
                if (!sidebar.contains(e.target) && !mobileBtn.contains(e.target)) {
                    sidebar.classList.remove('mobile-open');
                }
            }
        });

        // Restore sidebar state
        if (localStorage.getItem('sidebarCollapsed') === 'true') {
            sidebar.classList.add('collapsed');
        }

        // Update sidebar footer with user data
        this.updateSidebarFooter();
    },

    /**
     * Update sidebar footer with user progress
     */
    updateSidebarFooter() {
        const settings = Storage.get('settings') || {};
        const tests = Storage.get('tests') || [];
        
        // Update current band
        const bandEl = document.getElementById('currentBandSidebar');
        if (bandEl) {
            const avgBand = tests.length > 0
                ? (tests.reduce((sum, t) => sum + parseFloat(t.bandScore || 0), 0) / tests.length).toFixed(1)
                : settings.currentBand || '6.5';
            bandEl.textContent = avgBand;
        }

        // Update streak
        const streakEl = document.getElementById('streakCount');
        if (streakEl) {
            const streak = this.calculateStreak();
            streakEl.textContent = streak;
        }

        // Update progress circle
        this.updateProgressCircle();
    },

    /**
     * Update progress circle in sidebar
     */
    updateProgressCircle() {
        const settings = Storage.get('settings') || {};
        const tests = Storage.get('tests') || [];
        
        const currentBand = tests.length > 0
            ? tests.reduce((sum, t) => sum + parseFloat(t.bandScore || 0), 0) / tests.length
            : parseFloat(settings.currentBand) || 6.0;
        
        const targetBand = parseFloat(settings.targetBand) || 8.0;
        const startBand = parseFloat(settings.startBand) || 5.0;
        
        const progress = Math.min(100, Math.max(0, 
            ((currentBand - startBand) / (targetBand - startBand)) * 100
        ));

        const progressPath = document.querySelector('.circle-progress');
        const progressText = document.querySelector('.progress-text');
        
        if (progressPath) {
            progressPath.setAttribute('stroke-dasharray', `${progress}, 100`);
        }
        if (progressText) {
            progressText.textContent = `${Math.round(progress)}%`;
        }
    },

    /**
     * Calculate current streak
     */
    calculateStreak() {
        const activities = Storage.get('activities') || [];
        if (activities.length === 0) return 0;

        let streak = 0;
        const today = new Date().toDateString();
        const uniqueDays = [...new Set(activities.map(a => 
            new Date(a.timestamp).toDateString()
        ))].sort((a, b) => new Date(b) - new Date(a));

        for (let i = 0; i < uniqueDays.length; i++) {
            const expectedDate = new Date();
            expectedDate.setDate(expectedDate.getDate() - i);
            
            if (uniqueDays[i] === expectedDate.toDateString()) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    },

    /**
     * Switch between tabs
     */
    switchTab(tabName, pushState = true) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        const selectedTab = document.getElementById(tabName);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        // Add active class to nav item
        const selectedNav = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
        if (selectedNav) {
            selectedNav.classList.add('active');
        }

        // Update current tab
        this.currentTab = tabName;

        // Update breadcrumb
        const breadcrumb = document.getElementById('currentSection');
        if (breadcrumb) {
            breadcrumb.textContent = this.getTabTitle(tabName);
        }

        // Refresh tab content
        this.refreshTab(tabName);

        // Close mobile sidebar
        document.getElementById('sidebar')?.classList.remove('mobile-open');

        // Update history
        if (pushState && history.pushState) {
            history.pushState({ tab: tabName }, '', `#${tabName}`);
        }
    },

    /**
     * Get human-readable tab title
     */
    getTabTitle(tabName) {
        const titles = {
            'dashboard': 'Dashboard',
            'practice': 'Luyện tập',
            'library': 'Thư viện đề',
            'minitest': 'Mini-Test',
            'drill': 'Drill Mode',
            'vocabulary': 'Từ vựng',
            'errors': 'Lỗi sai',
            'aianalysis': 'AI Phân tích',
            'upload': 'Tạo đề thi',
            'settings': 'Cài đặt'
        };
        return titles[tabName] || tabName;
    },

    /**
     * Refresh tab content
     */
    refreshTab(tabName) {
        switch (tabName) {
            case 'dashboard':
                if (typeof Dashboard !== 'undefined') Dashboard.render();
                break;
            case 'practice':
                if (typeof Practice !== 'undefined') Practice.renderTestSelector();
                break;
            case 'library':
                if (typeof Library !== 'undefined') Library.render();
                break;
            case 'minitest':
                if (typeof MiniTest !== 'undefined') MiniTest.renderHistory();
                break;
            case 'drill':
                if (typeof Drill !== 'undefined') Drill.renderStats();
                break;
            case 'vocabulary':
                if (typeof Vocabulary !== 'undefined') Vocabulary.render();
                break;
            case 'errors':
                if (typeof ErrorTracker !== 'undefined') ErrorTracker.render();
                break;
            case 'aianalysis':
                if (typeof AIAnalysis !== 'undefined') AIAnalysis.renderTypeStats();
                break;
            case 'upload':
                this.renderTestLibrary();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }

        // Update sidebar footer
        this.updateSidebarFooter();
    },

    /**
     * Update topbar statistics
     */
    updateTopbarStats() {
        const tests = Storage.get('tests') || [];
        const totalTime = tests.reduce((sum, t) => sum + (t.timeSpent || 0), 0);

        const testsEl = document.getElementById('topbarTests');
        const timeEl = document.getElementById('topbarTime');

        if (testsEl) testsEl.textContent = tests.length;
        if (timeEl) timeEl.textContent = Utils.secondsToHoursMinutes(totalTime);
    },

    /**
     * Handle keyboard shortcuts
     */
    handleKeyboardShortcut(e) {
        // Ctrl + number for quick tab switching
        if (e.ctrlKey && !e.shiftKey && !e.altKey) {
            const tabMap = {
                '1': 'dashboard',
                '2': 'practice',
                '3': 'library',
                '4': 'minitest',
                '5': 'drill',
                '6': 'vocabulary'
            };

            if (tabMap[e.key]) {
                e.preventDefault();
                this.switchTab(tabMap[e.key]);
            }
        }

        // Escape to close modals
        if (e.key === 'Escape') {
            document.querySelector('.result-overlay')?.remove();
            document.getElementById('fullscreenMode')?.style.display === 'flex' && Practice.exitFullscreen();
        }
    },

    /**
     * Quick practice - random test
     */
    startQuickPractice() {
        const allTests = [...FileParser.getCustomTests(), 
            ...(typeof Library !== 'undefined' ? Library.getDefaultTests() : [])];
        
        if (allTests.length === 0) {
            Utils.showNotification('Chưa có đề thi nào. Hãy tạo đề thi!', 'warning');
            this.switchTab('upload');
            return;
        }

        const randomTest = allTests[Math.floor(Math.random() * allTests.length)];
        
        this.switchTab('practice');
        setTimeout(() => {
            if (typeof Practice !== 'undefined') {
                Practice.selectTest(randomTest.id);
            }
        }, 100);
    },

    /**
     * Setup file upload functionality
     */
    setupUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        if (!uploadArea || !fileInput) return;

        // Click to upload
        uploadArea.addEventListener('click', () => fileInput.click());

        // File selection
        fileInput.addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files);
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFileUpload(e.dataTransfer.files);
        });
    },

    /**
     * Handle file upload
     */
    async handleFileUpload(files) {
        for (const file of files) {
            try {
                const result = await FileParser.parseFile(file);
                
                if (result.success) {
                    Utils.showNotification(`✅ Đã upload: ${result.data.title}`, 'success');
                    this.renderTestLibrary();
                    if (typeof Library !== 'undefined') Library.render();
                } else {
                    Utils.showNotification(`❌ Lỗi: ${result.error}`, 'error');
                }
            } catch (error) {
                console.error('Upload error:', error);
                Utils.showNotification('Có lỗi khi upload file', 'error');
            }
        }
    },

    /**
     * Render test library in upload tab
     */
    renderTestLibrary() {
        const container = document.getElementById('testLibrary');
        if (!container) return;

        const customTests = FileParser.getCustomTests();

        if (customTests.length === 0) {
            container.innerHTML = '<p class="empty-state">Chưa có đề thi nào</p>';
            return;
        }

        container.innerHTML = customTests.map(test => `
            <div class="test-library-item">
                <div class="test-info">
                    <strong>${test.title}</strong>
                    <span class="test-meta">${test.passages?.length || 0} passages • ${new Date(test.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
                <div class="test-actions">
                    <button class="btn btn-sm btn-primary" onclick="Library.startTest('${test.id}')">▶️</button>
                    <button class="btn btn-sm btn-danger" onclick="Library.deleteTest('${test.id}'); App.renderTestLibrary();">🗑️</button>
                </div>
            </div>
        `).join('');
    },

    /**
     * Setup backup functionality
     */
    setupBackup() {
        const exportBtn = document.getElementById('exportDataBtn');
        const importBtn = document.getElementById('importDataBtn');
        const importFile = document.getElementById('importFile');

        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        if (importBtn) {
            importBtn.addEventListener('click', () => importFile.click());
        }

        if (importFile) {
            importFile.addEventListener('change', (e) => this.importData(e.target.files[0]));
        }

        // Update last backup time
        this.updateLastBackupTime();
    },

    /**
     * Export all data
     */
    exportData() {
        const data = {
            tests: Storage.get('tests') || [],
            vocabulary: Storage.get('vocabulary') || [],
            errors: Storage.get('errors') || [],
            customTests: FileParser.getCustomTests(),
            settings: Storage.get('settings') || {},
            activities: Storage.get('activities') || [],
            drillStats: Storage.get('drill_stats') || {},
            minitestHistory: Storage.get('minitest_history') || [],
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `ielts-reading-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();

        URL.revokeObjectURL(url);

        Storage.set('lastBackup', new Date().toISOString());
        this.updateLastBackupTime();
        Utils.showNotification('📥 Đã xuất dữ liệu thành công!', 'success');
    },

    /**
     * Import data from backup
     */
    async importData(file) {
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            if (confirm('Nhập dữ liệu sẽ ghi đè dữ liệu hiện tại. Bạn có chắc không?')) {
                if (data.tests) Storage.set('tests', data.tests);
                if (data.vocabulary) Storage.set('vocabulary', data.vocabulary);
                if (data.errors) Storage.set('errors', data.errors);
                if (data.settings) Storage.set('settings', data.settings);
                if (data.activities) Storage.set('activities', data.activities);
                if (data.drillStats) Storage.set('drill_stats', data.drillStats);
                if (data.minitestHistory) Storage.set('minitest_history', data.minitestHistory);
                
                if (data.customTests) {
                    data.customTests.forEach(test => FileParser.saveCustomTest(test));
                }

                Utils.showNotification('📤 Đã nhập dữ liệu thành công!', 'success');
                
                // Refresh current tab
                this.refreshTab(this.currentTab);
                this.updateSidebarFooter();
                this.updateTopbarStats();
            }
        } catch (error) {
            console.error('Import error:', error);
            Utils.showNotification('Có lỗi khi nhập dữ liệu', 'error');
        }
    },

    /**
     * Update last backup time display
     */
    updateLastBackupTime() {
        const el = document.getElementById('lastBackup');
        if (!el) return;

        const lastBackup = Storage.get('lastBackup');
        el.textContent = lastBackup 
            ? new Date(lastBackup).toLocaleString('vi-VN')
            : 'Chưa có';
    },

    /**
     * Load settings into form
     */
    loadSettings() {
        const settings = Storage.get('settings') || {};

        const currentBandEl = document.getElementById('currentBandSetting');
        const targetBandEl = document.getElementById('targetBandSetting');
        const apiKeyEl = document.getElementById('apiKeySetting');
        const soundEl = document.getElementById('soundSetting');
        const darkModeEl = document.getElementById('darkModeSetting');

        if (currentBandEl) currentBandEl.value = settings.currentBand || '6.5';
        if (targetBandEl) targetBandEl.value = settings.targetBand || '8.0';
        if (apiKeyEl) apiKeyEl.value = Storage.get('openai_api_key') || '';
        if (soundEl) soundEl.checked = settings.sound !== false;
        if (darkModeEl) darkModeEl.checked = settings.darkMode !== false;
    },

    /**
     * Clear all tests
     */
    clearAllTests() {
        if (!confirm('Bạn có chắc muốn xóa TẤT CẢ đề thi đã tạo?')) return;

        Storage.set('custom_tests', []);
        Utils.showNotification('Đã xóa tất cả đề thi', 'success');
        this.renderTestLibrary();
        if (typeof Library !== 'undefined') Library.render();
    },

    /**
     * Show example file format
     */
    showExampleFormat() {
        const example = {
            title: "Cambridge IELTS 17 - Test 1",
            source: "cambridge",
            level: "7.5",
            passages: [
                {
                    title: "The Voyage of the Beagle",
                    text: "Nội dung passage ở đây...",
                    questions: [
                        {
                            type: "tfng",
                            text: "Darwin was born in England.",
                            answer: "True",
                            explanation: "Giải thích..."
                        }
                    ]
                }
            ]
        };

        const blob = new Blob([JSON.stringify(example, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'example-format.json';
        a.click();

        URL.revokeObjectURL(url);
        Utils.showNotification('📥 Đã tải file mẫu', 'success');
    }
};

// Settings module
const Settings = {
    save() {
        const settings = {
            currentBand: document.getElementById('currentBandSetting')?.value || '6.5',
            targetBand: document.getElementById('targetBandSetting')?.value || '8.0',
            sound: document.getElementById('soundSetting')?.checked ?? true,
            darkMode: document.getElementById('darkModeSetting')?.checked ?? true
        };

        Storage.set('settings', settings);

        // Save API key separately
        const apiKey = document.getElementById('apiKeySetting')?.value;
        if (apiKey) {
            Storage.set('openai_api_key', apiKey);
        }

        Utils.showNotification('✅ Đã lưu cài đặt!', 'success');
        
        // Update UI
        App.updateSidebarFooter();
        
        // Update target band display
        const targetDisplay = document.getElementById('targetBandDisplay');
        if (targetDisplay) targetDisplay.textContent = settings.targetBand;
    }
};

// Make Settings available globally
window.Settings = Settings;

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Make App available globally
window.App = App;
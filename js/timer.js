/* ==========================================
   Timer Management Module
   Handles countdown timer functionality
   ========================================== */

const Timer = {
    // Timer state
    state: {
        totalSeconds: 3600, // 60 minutes default
        remainingSeconds: 3600,
        isRunning: false,
        isPaused: false,
        interval: null,
        startTime: null,
        pausedTime: 0,
        warningThreshold: 300, // 5 minutes
        onComplete: null,
        onTick: null,
        onWarning: null
    },

    /**
     * Initialize timer
     * @param {Object} options - Timer options
     */
    init(options = {}) {
        this.state.totalSeconds = options.duration || 3600;
        this.state.remainingSeconds = this.state.totalSeconds;
        this.state.warningThreshold = options.warningThreshold || 300;
        this.state.onComplete = options.onComplete || null;
        this.state.onTick = options.onTick || null;
        this.state.onWarning = options.onWarning || null;
        
        this.updateDisplay();
        this.bindEvents();
    },

    /**
     * Bind timer button events
     */
    bindEvents() {
        const startBtn = document.getElementById('startTimer');
        const pauseBtn = document.getElementById('pauseTimer');
        const resetBtn = document.getElementById('resetTimer');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.start());
        }

        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pause());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.reset());
        }
    },

    /**
     * Start or resume timer
     */
    start() {
        if (this.state.isRunning) return;

        this.state.isRunning = true;
        this.state.isPaused = false;
        this.state.startTime = Date.now() - this.state.pausedTime;

        this.state.interval = setInterval(() => {
            this.tick();
        }, 1000);

        this.updateButtonStates();
        Utils.showNotification('Bắt đầu đếm giờ', 'success', 2000);
        
        // Update study streak when starting timer
        Storage.updateStreak();
    },

    /**
     * Pause timer
     */
    pause() {
        if (!this.state.isRunning) return;

        this.state.isRunning = false;
        this.state.isPaused = true;
        this.state.pausedTime = Date.now() - this.state.startTime;

        clearInterval(this.state.interval);
        this.updateButtonStates();
        Utils.showNotification('Tạm dừng đếm giờ', 'warning', 2000);
    },

    /**
     * Reset timer
     */
    reset() {
        this.stop();
        this.state.remainingSeconds = this.state.totalSeconds;
        this.state.pausedTime = 0;
        this.updateDisplay();
        Utils.showNotification('Đặt lại bộ đếm giờ', 'info', 2000);
    },

    /**
     * Stop timer completely
     */
    stop() {
        this.state.isRunning = false;
        this.state.isPaused = false;
        clearInterval(this.state.interval);
        this.updateButtonStates();
    },

    /**
     * Timer tick (called every second)
     */
    tick() {
        if (this.state.remainingSeconds > 0) {
            this.state.remainingSeconds--;
            this.updateDisplay();

            // Call onTick callback if provided
            if (this.state.onTick) {
                this.state.onTick(this.state.remainingSeconds);
            }

            // Check for warning threshold
            if (this.state.remainingSeconds === this.state.warningThreshold) {
                this.showWarning();
                if (this.state.onWarning) {
                    this.state.onWarning(this.state.remainingSeconds);
                }
            }

            // Update total study time in storage
            const progress = Storage.getProgress();
            progress.totalTime++;
            Storage.updateProgress(progress);

        } else {
            // Timer complete
            this.complete();
        }
    },

    /**
     * Timer completion handler
     */
    complete() {
        this.stop();
        this.playSound('complete');
        
        Utils.showNotification('Hết giờ! Đã đến lúc nộp bài.', 'warning', 5000);

        // Call onComplete callback if provided
        if (this.state.onComplete) {
            this.state.onComplete();
        }

        // Add activity
        Storage.addActivity({
            type: 'timer_complete',
            description: 'Hoàn thành 60 phút luyện tập'
        });
    },

    /**
     * Show warning when time is running low
     */
    showWarning() {
        const display = document.getElementById('timerDisplay');
        if (display) {
            display.classList.add('timer-warning');
        }

        this.playSound('warning');
        Utils.showNotification(
            `Còn ${this.state.warningThreshold / 60} phút!`, 
            'warning', 
            3000
        );
    },

    /**
     * Update timer display
     */
    updateDisplay() {
        const display = document.getElementById('timerDisplay');
        if (!display) return;

        const formatted = Utils.formatTime(this.state.remainingSeconds);
        display.textContent = formatted;

        // Add warning class if time is low
        if (this.state.remainingSeconds <= this.state.warningThreshold) {
            display.classList.add('timer-warning');
        } else {
            display.classList.remove('timer-warning');
        }

        // Update document title
        if (this.state.isRunning) {
            document.title = `${formatted} - IELTS Reading`;
        } else {
            document.title = 'IELTS Reading - Road to 9.0';
        }
    },

    /**
     * Update button states
     */
    updateButtonStates() {
        const startBtn = document.getElementById('startTimer');
        const pauseBtn = document.getElementById('pauseTimer');
        const resetBtn = document.getElementById('resetTimer');

        if (startBtn) {
            startBtn.disabled = this.state.isRunning;
            startBtn.textContent = this.state.isPaused ? 'Tiếp tục' : 'Bắt đầu';
        }

        if (pauseBtn) {
            pauseBtn.disabled = !this.state.isRunning;
        }

        if (resetBtn) {
            resetBtn.disabled = this.state.isRunning;
        }
    },

    /**
     * Set custom duration
     * @param {number} seconds - Duration in seconds
     */
    setDuration(seconds) {
        this.stop();
        this.state.totalSeconds = seconds;
        this.state.remainingSeconds = seconds;
        this.state.pausedTime = 0;
        this.updateDisplay();
    },

    /**
     * Get remaining time
     * @returns {number} Remaining seconds
     */
    getRemainingTime() {
        return this.state.remainingSeconds;
    },

    /**
     * Get elapsed time
     * @returns {number} Elapsed seconds
     */
    getElapsedTime() {
        return this.state.totalSeconds - this.state.remainingSeconds;
    },

    /**
     * Get progress percentage
     * @returns {number} Progress percentage (0-100)
     */
    getProgress() {
        return ((this.getElapsedTime() / this.state.totalSeconds) * 100).toFixed(2);
    },

    /**
     * Check if timer is running
     * @returns {boolean} Running status
     */
    isRunning() {
        return this.state.isRunning;
    },

    /**
     * Play sound effect
     * @param {string} type - Sound type ('warning', 'complete', 'tick')
     */
    playSound(type) {
        const settings = Storage.getSettings();
        if (!settings.soundEffects) return;

        // Create audio context for simple beep sounds
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Different frequencies for different sounds
            switch (type) {
                case 'warning':
                    oscillator.frequency.value = 800;
                    gainNode.gain.value = 0.3;
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.2);
                    break;
                case 'complete':
                    oscillator.frequency.value = 1000;
                    gainNode.gain.value = 0.5;
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.5);
                    break;
                case 'tick':
                    oscillator.frequency.value = 600;
                    gainNode.gain.value = 0.1;
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.05);
                    break;
            }
        } catch (error) {
            console.log('Audio not supported');
        }
    },

    /**
     * Add time to timer
     * @param {number} seconds - Seconds to add
     */
    addTime(seconds) {
        this.state.remainingSeconds += seconds;
        if (this.state.remainingSeconds > this.state.totalSeconds) {
            this.state.totalSeconds = this.state.remainingSeconds;
        }
        this.updateDisplay();
        Utils.showNotification(`Đã thêm ${seconds / 60} phút`, 'success', 2000);
    },

    /**
     * Create quick timer presets
     * @returns {Array} Timer preset options
     */
    getPresets() {
        return [
            { label: '20 phút', value: 1200 },
            { label: '40 phút', value: 2400 },
            { label: '60 phút', value: 3600 },
            { label: '90 phút', value: 5400 },
            { label: '120 phút', value: 7200 }
        ];
    },

    /**
     * Format remaining time for display
     * @returns {Object} Formatted time components
     */
    getFormattedTime() {
        const hours = Math.floor(this.state.remainingSeconds / 3600);
        const minutes = Math.floor((this.state.remainingSeconds % 3600) / 60);
        const seconds = this.state.remainingSeconds % 60;

        return {
            hours: hours.toString().padStart(2, '0'),
            minutes: minutes.toString().padStart(2, '0'),
            seconds: seconds.toString().padStart(2, '0'),
            formatted: Utils.formatTime(this.state.remainingSeconds)
        };
    },

    /**
     * Save timer state
     */
    saveState() {
        const timerState = {
            remainingSeconds: this.state.remainingSeconds,
            isRunning: this.state.isRunning,
            isPaused: this.state.isPaused,
            pausedTime: this.state.pausedTime,
            totalSeconds: this.state.totalSeconds
        };
        
        Storage.set('timer_state', timerState);
    },

    /**
     * Restore timer state
     */
    restoreState() {
        const timerState = Storage.get('timer_state');
        if (timerState) {
            this.state.remainingSeconds = timerState.remainingSeconds;
            this.state.totalSeconds = timerState.totalSeconds;
            this.state.pausedTime = timerState.pausedTime;
            this.updateDisplay();
        }
    },

    /**
     * Clean up timer on page unload
     */
    cleanup() {
        this.saveState();
        this.stop();
    }
};

// Auto-save timer state before page unload
window.addEventListener('beforeunload', () => {
    Timer.cleanup();
});

// Make Timer available globally
window.Timer = Timer;
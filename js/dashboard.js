/* ==========================================
   Dashboard Module
   Manages dashboard display and statistics
   ========================================== */

const Dashboard = {
    // Refresh interval
    refreshInterval: null,

    /**
     * Initialize dashboard
     */
    init() {
        this.loadData();
        this.render();
        this.startAutoRefresh();
    },

    /**
     * Load all dashboard data
     */
    loadData() {
        this.progressData = Storage.getProgress();
        this.userData = Storage.getUserData();
        this.activities = Storage.getActivities();
        this.tests = Storage.getTests();
        this.vocabulary = Storage.getVocabulary();
        this.errors = Storage.getErrors();
    },

    /**
     * Render entire dashboard
     */
    render() {
        this.renderProgress();
        this.renderGoal();
        this.renderWeaknesses();
        this.renderActivities();
        this.renderStreak();
        
        // Initialize charts if available
        if (typeof DashboardCharts !== 'undefined') {
            setTimeout(() => DashboardCharts.init(), 100);
        }
        
        // Initialize adaptive difficulty if available
        if (typeof AdaptiveDifficulty !== 'undefined') {
            AdaptiveDifficulty.init();
        }
    },

    /**
     * Render progress statistics
     */
    renderProgress() {
        const progress = this.progressData;

        // Update completed tests
        const completedEl = document.getElementById('completedTests');
        if (completedEl) {
            this.animateNumber(completedEl, progress.completed || 0);
        }

        // Update average score
        const averageEl = document.getElementById('averageScore');
        if (averageEl) {
            this.animateNumber(averageEl, progress.average || 0, 1);
        }

        // Update total time
        const timeEl = document.getElementById('totalTime');
        if (timeEl) {
            const hours = (progress.totalTime || 0) / 3600;
            timeEl.textContent = hours.toFixed(1) + 'h';
        }

        // Update vocab count
        const vocabEl = document.getElementById('vocabCount');
        if (vocabEl) {
            this.animateNumber(vocabEl, progress.vocabCount || 0);
        }

        // Update overall progress bar
        const progressBar = document.getElementById('overallProgress');
        if (progressBar) {
            const percentage = this.calculateOverallProgress();
            this.animateProgressBar(progressBar, percentage);
        }
    },

    /**
     * Calculate overall progress percentage
     * @returns {number} Progress percentage
     */
    calculateOverallProgress() {
        const progress = this.progressData;
        const target = this.userData.targetBand || 8.0;
        const current = progress.average || 0;
        
        // Progress based on band score
        const bandProgress = (current / target) * 100;
        
        // Progress based on completed tests (assume 40 tests to reach target)
        const testProgress = ((progress.completed || 0) / 40) * 100;
        
        // Average of both metrics
        return Math.min(100, (bandProgress + testProgress) / 2);
    },

    /**
     * Render goal section
     */
    renderGoal() {
        const progress = this.progressData;
        const target = this.userData.targetBand || 8.0;
        const current = progress.average || 0;

        // Calculate goal progress
        const goalProgress = Math.min(100, (current / target) * 100);
        const goalProgressEl = document.getElementById('goalProgress');
        
        if (goalProgressEl) {
            this.animateProgressBar(goalProgressEl, goalProgress);
        }

        // Calculate remaining tests
        const completed = progress.completed || 0;
        const targetTests = 40; // Assume 40 tests needed
        const remaining = Math.max(0, targetTests - completed);
        
        const remainingEl = document.getElementById('remainingTests');
        if (remainingEl) {
            remainingEl.textContent = remaining;
        }
    },

    /**
     * Render weakness analysis
     */
    renderWeaknesses() {
        const stats = this.progressData.questionTypeStats || {};
        const weaknesses = [];

        // Find question types with accuracy < 75%
        Object.keys(stats).forEach(type => {
            const accuracy = stats[type].accuracy || 0;
            if (accuracy < 75) {
                weaknesses.push({
                    type: type,
                    accuracy: accuracy,
                    name: this.getQuestionTypeName(type)
                });
            }
        });

        // Sort by accuracy (lowest first)
        weaknesses.sort((a, b) => a.accuracy - b.accuracy);

        // Take top 3
        const top3 = weaknesses.slice(0, 3);

        // Render each weakness
        const container = document.querySelector('.weakness-list');
        if (!container) return;

        if (top3.length === 0) {
            container.innerHTML = '<p class="empty-state">Chưa có dữ liệu về điểm yếu. Hãy làm thêm bài test!</p>';
            return;
        }

        container.innerHTML = top3.map(w => `
            <div class="weakness-item">
                <div class="weakness-header">
                    <span class="weakness-name">${w.name}</span>
                    <span class="weakness-percent">${w.accuracy.toFixed(0)}%</span>
                </div>
                <div class="progress-bar small">
                    <div class="progress-fill" style="width: ${w.accuracy}%;"></div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Get question type display name
     * @param {string} type - Question type key
     * @returns {string} Display name
     */
    getQuestionTypeName(type) {
        const names = {
            'multiple-choice': 'Multiple Choice',
            'tfng': 'True/False/Not Given',
            'matching-headings': 'Matching Headings',
            'matching-info': 'Matching Information',
            'matching-features': 'Matching Features',
            'summary': 'Summary Completion',
            'sentence': 'Sentence Completion',
            'diagram': 'Diagram Labelling',
            'ynng': 'Yes/No/Not Given'
        };
        return names[type] || type;
    },

    /**
     * Render recent activities
     */
    renderActivities() {
        const activities = this.activities.slice(0, 5); // Get latest 5
        const container = document.getElementById('recentActivity');
        
        if (!container) return;

        if (activities.length === 0) {
            container.innerHTML = '<p class="empty-state">Chưa có hoạt động nào</p>';
            return;
        }

        container.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${this.getActivityIcon(activity.type)}</div>
                <div class="activity-content">
                    <div class="activity-title">${activity.description}</div>
                    <div class="activity-time">${this.getRelativeTime(activity.timestamp)}</div>
                </div>
            </div>
        `).join('');
    },

    /**
     * Get icon for activity type
     * @param {string} type - Activity type
     * @returns {string} Icon emoji
     */
    getActivityIcon(type) {
        const icons = {
            'test_completed': '✅',
            'vocab_added': '📚',
            'vocab_deleted': '🗑️',
            'timer_complete': '⏱️',
            'streak_milestone': '🔥',
            'band_achieved': '🎯'
        };
        return icons[type] || '📌';
    },

    /**
     * Get relative time string
     * @param {string} timestamp - ISO timestamp
     * @returns {string} Relative time
     */
    getRelativeTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now - time;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return Utils.formatDateShort(time);
    },

    /**
     * Render study streak
     */
    renderStreak() {
        const progress = this.progressData;
        const streak = progress.streak || 0;

        // You can add streak display in a dedicated section if needed
        console.log(`Current streak: ${streak} days`);
        
        // Check for streak milestones
        if (streak > 0 && streak % 7 === 0) {
            this.showStreakMilestone(streak);
        }
    },

    /**
     * Show streak milestone notification
     * @param {number} streak - Current streak
     */
    showStreakMilestone(streak) {
        Utils.showNotification(
            `🔥 Chúc mừng! Bạn đã học liên tục ${streak} ngày!`,
            'success',
            5000
        );

        Storage.addActivity({
            type: 'streak_milestone',
            description: `Đạt cột mốc ${streak} ngày học liên tục`
        });
    },

    /**
     * Animate number counter
     * @param {HTMLElement} element - Element to animate
     * @param {number} target - Target number
     * @param {number} decimals - Decimal places
     */
    animateNumber(element, target, decimals = 0) {
        const current = parseFloat(element.textContent) || 0;
        const increment = (target - current) / 30;
        let count = current;

        const timer = setInterval(() => {
            count += increment;
            if ((increment > 0 && count >= target) || (increment < 0 && count <= target)) {
                element.textContent = target.toFixed(decimals);
                clearInterval(timer);
            } else {
                element.textContent = count.toFixed(decimals);
            }
        }, 20);
    },

    /**
     * Animate progress bar
     * @param {HTMLElement} element - Progress bar element
     * @param {number} percentage - Target percentage
     */
    animateProgressBar(element, percentage) {
        const current = parseFloat(element.style.width) || 0;
        const increment = (percentage - current) / 30;
        let width = current;

        const timer = setInterval(() => {
            width += increment;
            if ((increment > 0 && width >= percentage) || (increment < 0 && width <= percentage)) {
                element.style.width = percentage + '%';
                element.querySelector('span').textContent = percentage.toFixed(0) + '%';
                clearInterval(timer);
            } else {
                element.style.width = width + '%';
                element.querySelector('span').textContent = width.toFixed(0) + '%';
            }
        }, 20);
    },

    /**
     * Generate weekly chart data
     * @returns {Array} Chart data for last 7 days
     */
    generateWeeklyData() {
        const tests = this.tests;
        const weekData = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();

            const dayTests = tests.filter(test => {
                return new Date(test.timestamp).toDateString() === dateStr;
            });

            const avgScore = dayTests.length > 0
                ? dayTests.reduce((sum, t) => sum + t.bandScore, 0) / dayTests.length
                : 0;

            weekData.push({
                day: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
                count: dayTests.length,
                avgScore: avgScore
            });
        }

        return weekData;
    },

    /**
     * Render weekly chart (if you add chart visualization)
     */
    renderWeeklyChart() {
        const weekData = this.generateWeeklyData();
        const container = document.querySelector('.weekly-chart');
        
        if (!container) return;

        // This is a simple text-based representation
        // You can integrate Chart.js or other library for better visualization
        console.log('Weekly data:', weekData);
    },

    /**
     * Get performance summary
     * @returns {Object} Performance summary
     */
    getPerformanceSummary() {
        const progress = this.progressData;
        const tests = this.tests;

        // Recent performance (last 10 tests)
        const recentTests = tests.slice(0, 10);
        const recentAvg = recentTests.length > 0
            ? recentTests.reduce((sum, t) => sum + t.bandScore, 0) / recentTests.length
            : 0;

        // Overall performance
        const overallAvg = progress.average || 0;

        // Performance trend
        const trend = recentAvg > overallAvg ? 'improving' : 
                     recentAvg < overallAvg ? 'declining' : 'stable';

        return {
            overall: overallAvg,
            recent: recentAvg,
            trend: trend,
            improvement: (recentAvg - overallAvg).toFixed(1)
        };
    },

    /**
     * Export dashboard report
     */
    exportReport() {
        const report = {
            generatedAt: new Date().toISOString(),
            userData: this.userData,
            progress: this.progressData,
            performance: this.getPerformanceSummary(),
            weaknesses: this.getWeaknessReport(),
            activities: this.activities.slice(0, 20),
            recentTests: this.tests.slice(0, 10)
        };

        Utils.exportToJSON(report, `dashboard-report-${new Date().toISOString().split('T')[0]}.json`);
        Utils.showNotification('Đã xuất báo cáo dashboard', 'success');
    },

    /**
     * Get weakness report
     * @returns {Array} Weakness details
     */
    getWeaknessReport() {
        const stats = this.progressData.questionTypeStats || {};
        const report = [];

        Object.keys(stats).forEach(type => {
            const accuracy = stats[type].accuracy || 0;
            report.push({
                type: type,
                name: this.getQuestionTypeName(type),
                accuracy: accuracy,
                total: stats[type].total,
                correct: stats[type].correct,
                status: accuracy >= 75 ? 'good' : accuracy >= 60 ? 'fair' : 'needs-improvement'
            });
        });

        return report.sort((a, b) => a.accuracy - b.accuracy);
    },

    /**
     * Refresh dashboard data
     */
    refresh() {
        this.loadData();
        this.render();
        console.log('✅ Dashboard refreshed');
    },

    /**
     * Start auto-refresh
     */
    startAutoRefresh() {
        // Refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.refresh();
        }, 30000);
    },

    /**
     * Stop auto-refresh
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    },

    /**
     * Show achievement notification
     * @param {string} achievement - Achievement name
     */
    showAchievement(achievement) {
        const achievements = {
            'first_test': {
                title: '🎯 Bài test đầu tiên',
                description: 'Hoàn thành bài test đầu tiên của bạn!'
            },
            'band_7': {
                title: '🌟 Band 7.0',
                description: 'Đạt được Band 7.0 trong một bài test!'
            },
            'week_streak': {
                title: '🔥 Streak 7 ngày',
                description: 'Học liên tục 7 ngày không nghỉ!'
            },
            'vocab_master': {
                title: '📚 Vocab Master',
                description: 'Thêm 100 từ vựng vào kho của bạn!'
            }
        };

        const ach = achievements[achievement];
        if (ach) {
            Utils.showNotification(`${ach.title}\n${ach.description}`, 'success', 5000);
        }
    },

    /**
     * Generate AI Analysis - Using OpenAI API
     */
    async generateAIAnalysis() {
        const btn = document.getElementById('aiAnalysisBtn');
        const container = document.getElementById('aiAnalysisContent');
        
        if (!btn || !container) return;

        // Check API key
        if (!window.Config || Config.OPENAI_API_KEY === 'YOUR_API_KEY_HERE') {
            container.innerHTML = `
                <div class="error-message">
                    <p>⚠️ API Key chưa được cấu hình!</p>
                    <p style="font-size: 13px;">Vui lòng thêm OpenAI API key vào file <code>js/config.js</code></p>
                </div>
            `;
            return;
        }

        // Show loading
        btn.disabled = true;
        btn.textContent = '⏳ Đang phân tích...';
        container.innerHTML = '<div class="spinner"></div><p style="text-align: center; margin-top: 10px;">AI đang phân tích dữ liệu của bạn...</p>';

        try {
            // Collect user data
            const progress = this.progressData;
            const errors = Storage.getErrors();
            const tests = Storage.getTests();
            const weaknessReport = this.getWeaknessReport();

            // Prepare data summary
            const dataSummary = {
                totalTests: progress.completed || 0,
                averageScore: (progress.average || 0).toFixed(1),
                totalErrors: errors.length,
                weaknesses: weaknessReport.slice(0, 3),
                recentTests: tests.slice(0, 5)
            };

            // Build AI prompt
            const prompt = `You are an expert IELTS Reading coach. Analyze this student's performance and provide personalized feedback in Vietnamese.

STUDENT DATA:
- Tests completed: ${dataSummary.totalTests}
- Average band score: ${dataSummary.averageScore}
- Total errors: ${dataSummary.totalErrors}

WEAKEST QUESTION TYPES:
${dataSummary.weaknesses.map(w => `- ${w.name}: ${w.accuracy.toFixed(0)}% accuracy (${w.correct}/${w.total} correct)`).join('\n')}

RECENT TEST RESULTS:
${dataSummary.recentTests.map(t => `- ${t.questionType}: ${t.bandScore} band (${t.correctAnswers}/${t.totalQuestions} correct)`).join('\n')}

Please provide:

1. **ĐIỂM MẠNH** (Strengths): What the student is good at
2. **ĐIỂM YẾU** (Weaknesses): Specific areas that need improvement
3. **PHÂN TÍCH** (Analysis): Why they struggle with certain question types
4. **LỘ TRÌNH** (Action Plan): 
   - What to practice next (prioritize weak areas)
   - Specific techniques for each weak question type
   - Daily/weekly practice recommendations
   - Target for next 2 weeks

5. **DỰ ĐOÁN BAND** (Predicted Band): Based on current performance, what band score they can achieve with focused practice

Format in clear sections with emojis. Be encouraging but honest. Keep it practical and actionable.`;

            // Call OpenAI API
            const response = await fetch(Config.OPENAI_ENDPOINT, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${Config.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: Config.AI_MODEL,
                    messages: [
                        { role: "system", content: "You are an expert IELTS Reading coach providing personalized feedback in Vietnamese." },
                        { role: "user", content: prompt }
                    ],
                    max_tokens: Config.MAX_TOKENS,
                    temperature: Config.TEMPERATURE
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const analysis = data.choices[0].message.content;
                
                // Display analysis
                container.innerHTML = `
                    <div class="ai-analysis-result">
                        ${this.formatAIAnalysis(analysis)}
                    </div>
                    <button class="btn btn-sm btn-primary" style="margin-top: 15px;" onclick="Dashboard.generateAIAnalysis()">
                        🔄 Phân tích lại
                    </button>
                `;

                // Save analysis
                Storage.set('last_ai_analysis', {
                    analysis: analysis,
                    timestamp: new Date().toISOString()
                });

            } else {
                throw new Error('Invalid response from AI');
            }

        } catch (error) {
            console.error('AI Analysis error:', error);
            container.innerHTML = `
                <div class="error-message">
                    <p>❌ Không thể tạo phân tích AI.</p>
                    <p style="font-size: 13px; color: #666;">Lỗi: ${error.message}</p>
                    <p style="font-size: 12px; margin-top: 10px;">Kiểm tra API key và kết nối mạng.</p>
                </div>
            `;
        } finally {
            btn.disabled = false;
            btn.textContent = '✨ Phân tích ngay';
        }
    },

    /**
     * Format AI analysis for display
     */
    formatAIAnalysis(text) {
        // Convert markdown-style formatting to HTML
        let formatted = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');

        return `<div class="ai-analysis-content">${formatted}</div>`;
    },

    /**
     * Check achievements
     */
    checkAchievements() {
        const progress = this.progressData;

        // First test
        if (progress.completed === 1) {
            this.showAchievement('first_test');
        }

        // Band 7.0
        if (progress.average >= 7.0) {
            this.showAchievement('band_7');
        }

        // Week streak
        if (progress.streak === 7) {
            this.showAchievement('week_streak');
        }

        // 100 vocab words
        if (progress.vocabCount === 100) {
            this.showAchievement('vocab_master');
        }
    },

    /**
     * Get study recommendations
     * @returns {Array} Recommendations
     */
    getRecommendations() {
        const recommendations = [];
        const progress = this.progressData;
        const performance = this.getPerformanceSummary();

        // Based on average score
        if (progress.average < 6.0) {
            recommendations.push({
                type: 'practice',
                priority: 'high',
                message: 'Hãy tập trung luyện tập các dạng bài cơ bản ở level 5.0-6.0'
            });
        }

        // Based on trend
        if (performance.trend === 'declining') {
            recommendations.push({
                type: 'review',
                priority: 'high',
                message: 'Kết quả gần đây có xu hướng giảm. Hãy ôn lại các lỗi sai trước đó.'
            });
        }

        // Based on streak
        if (progress.streak === 0) {
            recommendations.push({
                type: 'motivation',
                priority: 'medium',
                message: 'Hãy bắt đầu chuỗi học tập mới! Học đều đặn sẽ giúp bạn tiến bộ nhanh hơn.'
            });
        }

        // Based on weaknesses
        const weaknesses = this.getWeaknessReport();
        if (weaknesses.length > 0) {
            const weakest = weaknesses[0];
            recommendations.push({
                type: 'focus',
                priority: 'high',
                message: `Tập trung vào dạng bài "${weakest.name}" - độ chính xác hiện tại: ${weakest.accuracy.toFixed(0)}%`
            });
        }

        return recommendations;
    }
};

// Make Dashboard available globally
window.Dashboard = Dashboard;
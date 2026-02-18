/* ==========================================
   Dashboard Charts Module
   Comprehensive data visualization
   ========================================== */

const DashboardCharts = {
    charts: {
        bar: null,
        line: null,
        pie: null
    },

    /**
     * Initialize all charts
     */
    init() {
        this.renderBarChart();
        this.renderLineChart();
        this.renderPieChart();
        this.renderTableChart();
    },

    /**
     * Get chart data from storage
     */
    getChartData() {
        const tests = Storage.getTests();
        const progress = Storage.getProgress();
        
        return {
            tests: tests,
            progress: progress,
            bandDistribution: this.getBandDistribution(tests),
            weeklyProgress: this.getWeeklyProgress(tests),
            questionTypeAccuracy: this.getQuestionTypeAccuracy(tests),
            recentTests: tests.slice(0, 10)
        };
    },

    /**
     * Get band distribution
     */
    getBandDistribution(tests) {
        const distribution = {
            '4.0-5.5': 0,
            '6.0-6.5': 0,
            '7.0-7.5': 0,
            '8.0-8.5': 0,
            '9.0': 0
        };

        tests.forEach(test => {
            const band = test.bandScore;
            if (band < 6.0) distribution['4.0-5.5']++;
            else if (band < 7.0) distribution['6.0-6.5']++;
            else if (band < 8.0) distribution['7.0-7.5']++;
            else if (band < 9.0) distribution['8.0-8.5']++;
            else distribution['9.0']++;
        });

        return distribution;
    },

    /**
     * Get weekly progress
     */
    getWeeklyProgress(tests) {
        const weeks = 7;
        const now = new Date();
        const labels = [];
        const scores = [];

        for (let i = weeks - 1; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - (i * 7));
            
            labels.push(`Week ${weeks - i}`);
            
            // Get tests from this week
            const weekTests = tests.filter(test => {
                const testDate = new Date(test.timestamp);
                return testDate >= weekStart && testDate < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
            });
            
            if (weekTests.length > 0) {
                const avgScore = weekTests.reduce((sum, t) => sum + t.bandScore, 0) / weekTests.length;
                scores.push(avgScore.toFixed(1));
            } else {
                scores.push(0);
            }
        }

        return { labels, scores };
    },

    /**
     * Get question type accuracy
     */
    getQuestionTypeAccuracy(tests) {
        const typeStats = {};
        
        tests.forEach(test => {
            const type = test.questionType || 'Other';
            if (!typeStats[type]) {
                typeStats[type] = { correct: 0, total: 0 };
            }
            typeStats[type].correct += test.correctAnswers;
            typeStats[type].total += test.totalQuestions;
        });

        const labels = Object.keys(typeStats);
        const data = labels.map(type => {
            const accuracy = (typeStats[type].correct / typeStats[type].total) * 100;
            return accuracy.toFixed(1);
        });

        return { labels, data };
    },

    /**
     * Render bar chart - Band distribution
     */
    renderBarChart() {
        const canvas = document.getElementById('barChart');
        if (!canvas) return;

        const data = this.getChartData();
        
        if (this.charts.bar) this.charts.bar.destroy();

        this.charts.bar = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: Object.keys(data.bandDistribution),
                datasets: [{
                    label: 'Số bài test',
                    data: Object.values(data.bandDistribution),
                    backgroundColor: [
                        'rgba(16, 185, 129, 0.8)',   // Green
                        'rgba(59, 130, 246, 0.8)',   // Blue
                        'rgba(251, 191, 36, 0.8)',   // Orange
                        'rgba(192, 132, 252, 0.8)',  // Purple
                        'rgba(239, 68, 68, 0.8)'     // Red
                    ],
                    borderRadius: 8,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '📊 Phân bố Band Score',
                        font: { size: 16, weight: 'bold' },
                        color: '#fff'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            color: '#9ca3af'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#9ca3af'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    },

    /**
     * Render line chart - Weekly progress
     */
    renderLineChart() {
        const canvas = document.getElementById('lineChart');
        if (!canvas) return;

        const data = this.getChartData();
        const weekly = data.weeklyProgress;
        
        if (this.charts.line) this.charts.line.destroy();

        this.charts.line = new Chart(canvas, {
            type: 'line',
            data: {
                labels: weekly.labels,
                datasets: [{
                    label: 'Điểm trung bình',
                    data: weekly.scores,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: 'rgb(59, 130, 246)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '📈 Tiến độ 7 tuần gần đây',
                        font: { size: 16, weight: 'bold' },
                        color: '#fff'
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 9,
                        ticks: {
                            stepSize: 1,
                            color: '#9ca3af'
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            color: '#9ca3af'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    },

    /**
     * Render pie chart - Question type accuracy
     */
    renderPieChart() {
        const canvas = document.getElementById('pieChart');
        if (!canvas) return;

        const data = this.getChartData();
        const typeData = data.questionTypeAccuracy;
        
        if (this.charts.pie) this.charts.pie.destroy();

        const colors = [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(251, 191, 36, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(192, 132, 252, 0.8)'
        ];

        this.charts.pie = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: typeData.labels,
                datasets: [{
                    data: typeData.data,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: '🎯 Độ chính xác theo dạng câu hỏi',
                        font: { size: 16, weight: 'bold' },
                        color: '#fff'
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#9ca3af',
                            padding: 15,
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
    },

    /**
     * Render table chart - Recent performance
     */
    renderTableChart() {
        const container = document.getElementById('tableChart');
        if (!container) return;

        const data = this.getChartData();
        const tests = data.recentTests;

        if (tests.length === 0) {
            container.innerHTML = '<p class="text-muted">Chưa có dữ liệu</p>';
            return;
        }

        container.innerHTML = `
            <table class="performance-table">
                <thead>
                    <tr>
                        <th>Ngày</th>
                        <th>Đề thi</th>
                        <th>Loại câu hỏi</th>
                        <th>Điểm</th>
                        <th>Band</th>
                        <th>Độ chính xác</th>
                    </tr>
                </thead>
                <tbody>
                    ${tests.map(test => `
                        <tr>
                            <td>${Utils.formatDate(test.timestamp)}</td>
                            <td>${test.passageTitle || test.testId}</td>
                            <td>${test.questionType || 'Mixed'}</td>
                            <td>${test.correctAnswers}/${test.totalQuestions}</td>
                            <td><span class="band-badge">${test.bandScore.toFixed(1)}</span></td>
                            <td><span class="accuracy-badge">${Math.round((test.correctAnswers / test.totalQuestions) * 100)}%</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    },

    /**
     * Refresh all charts
     */
    refresh() {
        this.init();
        Utils.showNotification('Đã làm mới biểu đồ', 'success');
    }
};

// Make available globally
window.DashboardCharts = DashboardCharts;

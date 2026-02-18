/* ==========================================
   AI Analysis Module
   Smart analysis of user performance
   ========================================== */

const AIAnalysis = {
    isLoading: false,
    lastAnalysis: null,

    /**
     * Generate AI analysis based on user's performance
     */
    async generate() {
        if (this.isLoading) return;

        const btn = document.getElementById('generateAIBtn');
        const content = document.getElementById('aiAnalysisContent');
        
        if (!content) return;

        // Get user data
        const userData = this.getUserData();
        
        if (userData.totalTests === 0) {
            Utils.showNotification('Bạn cần hoàn thành ít nhất 1 bài test để AI phân tích', 'warning');
            return;
        }

        this.isLoading = true;
        if (btn) btn.disabled = true;

        // Show loading state
        content.innerHTML = `
            <div class="ai-loading">
                <div class="spinner"></div>
                <p>🤖 AI đang phân tích dữ liệu của bạn...</p>
            </div>
        `;

        try {
            // Check if API key is configured
            const apiKey = Storage.get('openai_api_key') || (window.CONFIG && CONFIG.OPENAI_API_KEY);
            
            if (apiKey && apiKey !== 'your-api-key-here') {
                // Use OpenAI API for analysis
                const analysis = await this.callOpenAI(userData, apiKey);
                this.displayAnalysis(analysis);
            } else {
                // Use local analysis
                const analysis = this.generateLocalAnalysis(userData);
                this.displayAnalysis(analysis);
            }

            this.lastAnalysis = new Date().toISOString();
            Storage.set('last_ai_analysis', this.lastAnalysis);
            
        } catch (error) {
            console.error('AI Analysis error:', error);
            // Fallback to local analysis
            const analysis = this.generateLocalAnalysis(userData);
            this.displayAnalysis(analysis);
        }

        this.isLoading = false;
        if (btn) btn.disabled = false;
    },

    /**
     * Call OpenAI API for analysis
     */
    async callOpenAI(userData, apiKey) {
        const prompt = this.buildPrompt(userData);
        
        const endpoint = (window.CONFIG && CONFIG.OPENAI_ENDPOINT) || 'https://api.openai.com/v1/chat/completions';
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'Bạn là một chuyên gia IELTS Reading với nhiều năm kinh nghiệm giảng dạy. Phân tích dữ liệu học tập và đưa ra lời khuyên cụ thể, thực tế.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        if (!response.ok) {
            throw new Error('API request failed');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    },

    /**
     * Build prompt for AI analysis
     */
    buildPrompt(userData) {
        return `Phân tích dữ liệu học IELTS Reading của học viên:

**Thống kê tổng quan:**
- Tổng số bài test: ${userData.totalTests}
- Band trung bình: ${userData.averageBand}
- Độ chính xác: ${userData.accuracy}%
- Band mục tiêu: ${userData.targetBand}
- Band hiện tại: ${userData.currentBand}

**Phân tích theo dạng câu hỏi:**
${Object.entries(userData.typeStats).map(([type, stats]) => 
    `- ${type}: ${stats.accuracy}% (${stats.total} câu)`
).join('\n')}

**Lỗi thường gặp:**
${userData.commonErrors.map((e, i) => `${i+1}. ${e}`).join('\n')}

**Yêu cầu phân tích:**
1. Đánh giá điểm mạnh và điểm yếu
2. Xác định dạng bài cần cải thiện urgently
3. Đề xuất lộ trình cụ thể để đạt Band ${userData.targetBand}
4. 3-5 tips cụ thể để cải thiện ngay

Trả lời bằng tiếng Việt, format markdown.`;
    },

    /**
     * Generate local analysis without API
     */
    generateLocalAnalysis(userData) {
        const { averageBand, targetBand, typeStats, accuracy, commonErrors } = userData;

        // Find weakest types
        const sortedTypes = Object.entries(typeStats)
            .filter(([_, stats]) => stats.total > 0)
            .sort((a, b) => a[1].accuracy - b[1].accuracy);

        const weakestTypes = sortedTypes.slice(0, 2);
        const strongestTypes = sortedTypes.slice(-2).reverse();

        const bandGap = parseFloat(targetBand) - parseFloat(averageBand);
        
        let analysis = `## 🎯 Báo cáo phân tích IELTS Reading

### 📊 Tổng quan
- **Band hiện tại:** ${averageBand}
- **Band mục tiêu:** ${targetBand}
- **Khoảng cách:** ${bandGap > 0 ? '+' + bandGap.toFixed(1) : bandGap.toFixed(1)} band
- **Độ chính xác tổng:** ${accuracy}%

---

### ✅ Điểm mạnh
`;

        if (strongestTypes.length > 0) {
            strongestTypes.forEach(([type, stats]) => {
                if (stats.accuracy >= 70) {
                    analysis += `- **${this.getTypeName(type)}:** ${stats.accuracy}% - Tốt!\n`;
                }
            });
        } else {
            analysis += `- Cần hoàn thành thêm bài test để xác định điểm mạnh\n`;
        }

        analysis += `
---

### ⚠️ Điểm cần cải thiện
`;
        
        if (weakestTypes.length > 0) {
            weakestTypes.forEach(([type, stats]) => {
                analysis += `- **${this.getTypeName(type)}:** ${stats.accuracy}%\n`;
                analysis += `  - ${this.getImprovementTip(type)}\n`;
            });
        }

        analysis += `
---

### 📈 Lộ trình cải thiện (${Math.ceil(bandGap * 4)} tuần)
`;

        if (bandGap <= 0.5) {
            analysis += `
1. **Tuần 1-2:** Củng cố dạng bài yếu nhất
2. **Tuần 3-4:** Luyện full test với thời gian thực

**Mẹo:** Với khoảng cách ${bandGap.toFixed(1)} band, bạn chỉ cần tăng thêm 2-3 câu đúng!
`;
        } else if (bandGap <= 1) {
            analysis += `
1. **Tuần 1-2:** Tập trung drilling ${weakestTypes[0] ? this.getTypeName(weakestTypes[0][0]) : 'dạng bài yếu'}
2. **Tuần 3-4:** Kết hợp Mini-Test hàng ngày
3. **Tuần 5-6:** Full test practice với review kỹ

**Mẹo:** Mỗi tuần cố gắng cải thiện 2-3% accuracy!
`;
        } else {
            analysis += `
1. **Tháng 1:** Nắm vững từng dạng bài qua Drill Mode
2. **Tháng 2:** Mini-Test daily + Full test weekly
3. **Tháng 3:** Simulation test như thi thật

**Lưu ý:** Với gap ${bandGap.toFixed(1)} band, cần luyện tập đều đặn mỗi ngày!
`;
        }

        analysis += `
---

### 💡 Tips cải thiện ngay
`;

        const tips = this.getRelevantTips(weakestTypes);
        tips.forEach((tip, i) => {
            analysis += `${i + 1}. ${tip}\n`;
        });

        analysis += `
---

*Phân tích được tạo lúc: ${new Date().toLocaleString('vi-VN')}*
`;

        return analysis;
    },

    /**
     * Get improvement tip for question type
     */
    getImprovementTip(type) {
        const tips = {
            'tfng': 'Chú ý phân biệt "False" (ngược với passage) và "Not Given" (không đề cập)',
            'ynng': 'Tập trung vào quan điểm AUTHOR, không phải facts',
            'multiple-choice': 'Loại trừ đáp án sai trước, tìm keywords trong passage',
            'matching-headings': 'Đọc lướt để nắm main idea từng đoạn trước',
            'matching-info': 'Scan từng statement, tìm paraphrase trong passage',
            'summary': 'Chú ý word limit và grammar của đáp án',
            'sentence': 'Đọc câu trước/sau chỗ trống để đoán loại từ cần điền'
        };
        return tips[type] || 'Luyện tập thêm dạng bài này với Drill Mode';
    },

    /**
     * Get relevant tips based on weak types
     */
    getRelevantTips(weakTypes) {
        const baseTips = [
            '⏱️ Phân bổ thời gian: 20 phút/passage, không dành quá 2 phút cho 1 câu',
            '📖 Đọc câu hỏi TRƯỚC khi đọc passage',
            '✍️ Highlight keywords trong cả câu hỏi và passage',
            '🔄 Sử dụng Drill Mode mỗi ngày 15 phút',
            '📝 Review lỗi sai sau mỗi bài test'
        ];

        const specificTips = [];
        
        weakTypes.forEach(([type]) => {
            if (type === 'tfng' || type === 'ynng') {
                specificTips.push('🎯 TFNG/YNNG: Không suy luận quá xa, bám sát text');
            }
            if (type === 'matching-headings') {
                specificTips.push('📑 Matching Headings: Tìm topic sentence (thường ở đầu/cuối đoạn)');
            }
        });

        return [...specificTips, ...baseTips].slice(0, 5);
    },

    /**
     * Display analysis result
     */
    displayAnalysis(analysis) {
        const content = document.getElementById('aiAnalysisContent');
        if (!content) return;

        // Convert markdown to HTML (simple conversion)
        let html = analysis
            .replace(/## (.*)/g, '<h2>$1</h2>')
            .replace(/### (.*)/g, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^- (.*)/gm, '<li>$1</li>')
            .replace(/^(\d+)\. (.*)/gm, '<li>$2</li>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/---/g, '<hr>');

        // Wrap list items
        html = html.replace(/(<li>.*<\/li>)+/g, (match) => `<ul>${match}</ul>`);

        content.innerHTML = `<div class="ai-analysis-result">${html}</div>`;
        
        Utils.showNotification('✨ Phân tích AI hoàn thành!', 'success');
    },

    /**
     * Get user data for analysis
     */
    getUserData() {
        const tests = Storage.get('tests') || [];
        const errors = Storage.get('errors') || [];
        const settings = Storage.get('settings') || {};

        // Calculate average band
        const averageBand = tests.length > 0 
            ? (tests.reduce((sum, t) => sum + (parseFloat(t.bandScore) || 0), 0) / tests.length).toFixed(1)
            : '0';

        // Calculate type-specific stats
        const typeStats = {};
        tests.forEach(test => {
            if (test.questionType) {
                if (!typeStats[test.questionType]) {
                    typeStats[test.questionType] = { total: 0, correct: 0 };
                }
                typeStats[test.questionType].total += test.totalQuestions || 0;
                typeStats[test.questionType].correct += test.correctAnswers || 0;
            }
        });

        // Calculate accuracy for each type
        Object.keys(typeStats).forEach(type => {
            const stats = typeStats[type];
            stats.accuracy = stats.total > 0 
                ? Math.round((stats.correct / stats.total) * 100) 
                : 0;
        });

        // Get common errors
        const errorCounts = {};
        errors.forEach(e => {
            const key = e.type || 'other';
            errorCounts[key] = (errorCounts[key] || 0) + 1;
        });
        const commonErrors = Object.entries(errorCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([type, count]) => `${this.getTypeName(type)}: ${count} lỗi`);

        // Overall accuracy
        const totalQuestions = tests.reduce((sum, t) => sum + (t.totalQuestions || 0), 0);
        const totalCorrect = tests.reduce((sum, t) => sum + (t.correctAnswers || 0), 0);
        const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

        return {
            totalTests: tests.length,
            averageBand,
            targetBand: settings.targetBand || '8.0',
            currentBand: settings.currentBand || '6.5',
            typeStats,
            commonErrors,
            accuracy
        };
    },

    /**
     * Get type name for display
     */
    getTypeName(type) {
        const names = {
            'tfng': 'True/False/Not Given',
            'ynng': 'Yes/No/Not Given',
            'multiple-choice': 'Multiple Choice',
            'matching-headings': 'Matching Headings',
            'matching-info': 'Matching Information',
            'summary': 'Summary Completion',
            'sentence': 'Sentence Completion',
            'all': 'All Types'
        };
        return names[type] || type;
    },

    /**
     * Render question type stats
     */
    renderTypeStats() {
        const container = document.getElementById('questionTypeStats');
        if (!container) return;

        const userData = this.getUserData();
        const { typeStats } = userData;

        if (Object.keys(typeStats).length === 0) {
            container.innerHTML = '<p class="empty-state">Hoàn thành bài test để xem thống kê</p>';
            return;
        }

        container.innerHTML = Object.entries(typeStats).map(([type, stats]) => {
            const accuracyClass = stats.accuracy >= 70 ? 'good' : stats.accuracy >= 50 ? 'medium' : 'poor';
            return `
                <div class="type-stat-card">
                    <div class="type-stat-header">
                        <span class="type-stat-name">${this.getTypeName(type)}</span>
                        <span class="type-stat-accuracy ${accuracyClass}">${stats.accuracy}%</span>
                    </div>
                    <div class="progress-bar small">
                        <div class="progress-fill" style="width: ${stats.accuracy}%"></div>
                    </div>
                    <span class="type-stat-count">${stats.total} câu đã làm</span>
                </div>
            `;
        }).join('');
    }
};

// Make AIAnalysis available globally
window.AIAnalysis = AIAnalysis;

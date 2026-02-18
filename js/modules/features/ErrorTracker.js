/* ==========================================
   Error Tracker Module
   Tracks mistakes and provides improvement tips
   ========================================== */

const ErrorTracker = {
    // Error categories and explanations
    ERROR_TYPES: {
        'multiple-choice': {
            name: 'Multiple Choice',
            icon: '📝',
            tips: [
                'Đọc kỹ câu hỏi và tất cả các đáp án trước khi chọn',
                'Loại trừ các đáp án sai trước khi chọn đáp án đúng',
                'Chú ý từ khóa trong câu hỏi và tìm trong bài đọc'
            ]
        },
        'tfng': {
            name: 'True/False/Not Given',
            icon: '✓✗',
            tips: [
                'Phân biệt rõ giữa False và Not Given',
                'False: thông tin mâu thuẫn với bài đọc',
                'Not Given: không có thông tin trong bài',
                'Chỉ dựa vào thông tin trong bài, không dùng kiến thức riêng'
            ]
        },
        'matching-headings': {
            name: 'Matching Headings',
            icon: '📑',
            tips: [
                'Đọc câu đầu và câu cuối của đoạn văn',
                'Tìm ý chính, không bị phân tâm bởi chi tiết',
                'Loại trừ các heading đã dùng',
                'Chú ý từ đồng nghĩa giữa heading và đoạn văn'
            ]
        },
        'matching-info': {
            name: 'Matching Information',
            icon: '🔗',
            tips: [
                'Scan toàn bộ bài để tìm thông tin',
                'Chú ý paraphrase của từ khóa',
                'Một đoạn có thể chứa nhiều câu trả lời',
                'Đọc cẩn thận yêu cầu của đề bài'
            ]
        },
        'summary': {
            name: 'Summary Completion',
            icon: '📋',
            tips: [
                'Đọc trước toàn bộ đoạn tóm tắt',
                'Xác định từ loại cần điền (danh từ, động từ, tính từ)',
                'Chú ý giới hạn số từ trong đề bài',
                'Viết đúng chính tả từ trong bài đọc'
            ]
        },
        'sentence': {
            name: 'Sentence Completion',
            icon: '✍️',
            tips: [
                'Đọc cả câu để hiểu nghĩa',
                'Tìm từ khóa trong câu',
                'Đảm bảo câu hoàn chỉnh về mặt ngữ pháp',
                'Kiểm tra giới hạn số từ'
            ]
        },
        'ynng': {
            name: 'Yes/No/Not Given',
            icon: '❓',
            tips: [
                'Dùng cho câu hỏi về quan điểm/ý kiến',
                'Yes: tác giả đồng ý với ý kiến',
                'No: tác giả không đồng ý',
                'Not Given: tác giả không đưa ra quan điểm rõ ràng'
            ]
        }
    },

    // Current errors
    currentErrors: [],

    /**
     * Initialize error tracker
     */
    init() {
        this.loadErrors();
        this.bindEvents();
        this.render();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        const clearBtn = document.getElementById('clearErrors');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAllErrors());
        }
    },

    /**
     * Load errors from storage
     */
    loadErrors() {
        this.currentErrors = Storage.getErrors();
    },

    /**
     * Add new error
     * @param {Object} errorData - Error data
     */
    addError(errorData) {
        const error = {
            questionType: errorData.questionType || 'unknown',
            questionNumber: errorData.questionNumber || 0,
            question: errorData.question || '',
            userAnswer: errorData.userAnswer || '',
            correctAnswer: errorData.correctAnswer || '',
            level: errorData.level || '6.0',
            passage: errorData.passage || '',
            explanation: this.generateExplanation(errorData),
            improvement: this.generateImprovementTips(errorData.questionType)
        };

        Storage.addError(error);
        this.loadErrors();
        this.render();

        // Update error statistics
        this.updateStatistics();
    },

    /**
     * Generate explanation for the error
     * @param {Object} errorData - Error data
     * @returns {string} Explanation text
     */
    generateExplanation(errorData) {
        const type = errorData.questionType;
        
        if (type === 'tfng' || type === 'ynng') {
            if (errorData.userAnswer === 'True' && errorData.correctAnswer === 'Not Given') {
                return 'Bài đọc không đưa ra thông tin rõ ràng về vấn đề này. Đừng suy luận hoặc dùng kiến thức bên ngoài.';
            } else if (errorData.userAnswer === 'False' && errorData.correctAnswer === 'Not Given') {
                return 'Mặc dù thông tin có vẻ mâu thuẫn, nhưng bài đọc không trực tiếp phủ nhận điều này.';
            } else if (errorData.userAnswer === 'Not Given' && errorData.correctAnswer === 'True') {
                return 'Thông tin này có trong bài đọc, có thể được diễn đạt bằng từ đồng nghĩa (paraphrase).';
            }
        }

        if (type === 'matching-headings') {
            return 'Heading phải phản ánh ý chính của toàn bộ đoạn văn, không chỉ là một chi tiết. Hãy tập trung vào câu chủ đề (topic sentence).';
        }

        if (type === 'summary' || type === 'sentence') {
            return 'Đảm bảo từ điền vào phù hợp về nghĩa và ngữ pháp. Lấy chính xác từ trong bài, không thay đổi dạng từ trừ khi cần thiết.';
        }

        return 'Đọc kỹ lại đoạn văn liên quan và chú ý các từ khóa. So sánh câu trả lời của bạn với thông tin trong bài.';
    },

    /**
     * Generate improvement tips based on question type
     * @param {string} questionType - Question type
     * @returns {Array} Array of tips
     */
    generateImprovementTips(questionType) {
        const typeInfo = this.ERROR_TYPES[questionType];
        return typeInfo ? typeInfo.tips : [
            'Đọc kỹ đề bài và yêu cầu',
            'Tìm từ khóa và scan bài đọc',
            'Chú ý paraphrase và từ đồng nghĩa',
            'Luyện tập thường xuyên dạng bài này'
        ];
    },

    /**
     * Clear all errors
     */
    clearAllErrors() {
        if (confirm('Bạn có chắc muốn xóa tất cả lỗi đã ghi nhận?')) {
            Storage.clearErrors();
            this.loadErrors();
            this.render();
            this.updateStatistics();
            Utils.showNotification('Đã xóa tất cả lỗi', 'success');
        }
    },

    /**
     * Delete specific error
     * @param {string} id - Error ID
     */
    deleteError(id) {
        const errors = Storage.getErrors();
        const filtered = errors.filter(e => e.id !== id);
        Storage.set(Storage.KEYS.ERRORS, filtered);
        this.loadErrors();
        this.render();
        this.updateStatistics();
    },

    /**
     * Render error log
     */
    render() {
        const container = document.getElementById('errorLog');
        if (!container) return;

        if (this.currentErrors.length === 0) {
            container.innerHTML = '<p class="empty-state">Chưa có lỗi nào được ghi nhận. Hãy bắt đầu luyện tập!</p>';
            return;
        }

        container.innerHTML = this.currentErrors.map(error => this.renderErrorItem(error)).join('');
    },

    /**
     * Render single error item
     * @param {Object} error - Error object
     * @returns {string} HTML string
     */
    renderErrorItem(error) {
        const typeInfo = this.ERROR_TYPES[error.questionType] || { 
            name: error.questionType, 
            icon: '❓' 
        };

        return `
            <div class="error-item" data-id="${error.id}">
                <div class="error-header">
                    <div class="error-type">
                        ${typeInfo.icon} ${typeInfo.name} - Question ${error.questionNumber}
                    </div>
                    <div class="error-meta">
                        <span class="error-level">Band ${error.level}</span>
                        <span class="error-date">${Utils.formatDateShort(error.timestamp)}</span>
                        <button class="vocab-action-btn delete" onclick="ErrorTracker.deleteError('${error.id}')" title="Xóa">
                            🗑️
                        </button>
                    </div>
                </div>
                
                <div class="error-question">
                    <strong>Câu hỏi:</strong> ${error.question}
                </div>
                
                <div class="error-answers">
                    <div class="error-answer user-answer">
                        <strong>Trả lời của bạn:</strong> 
                        <span class="answer-text incorrect">${error.userAnswer || 'Không trả lời'}</span>
                    </div>
                    <div class="error-answer correct-answer">
                        <strong>Đáp án đúng:</strong> 
                        <span class="answer-text correct">${error.correctAnswer}</span>
                    </div>
                </div>
                
                <div class="error-explanation">
                    <strong>💡 Giải thích:</strong>
                    <p>${error.explanation}</p>
                </div>
                
                <div class="improvement-tip">
                    <strong>🎯 Cách cải thiện:</strong>
                    <ul>
                        ${error.improvement.map(tip => `<li>${tip}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    },

    /**
     * Update error statistics
     */
    updateStatistics() {
        const totalEl = document.getElementById('totalErrors');
        const commonEl = document.getElementById('mostCommonError');

        if (totalEl) {
            totalEl.textContent = this.currentErrors.length;
        }

        if (commonEl) {
            const mostCommon = this.getMostCommonErrorType();
            const typeInfo = this.ERROR_TYPES[mostCommon];
            commonEl.textContent = typeInfo ? typeInfo.name : '-';
        }
    },

    /**
     * Get most common error type
     * @returns {string} Most common error type
     */
    getMostCommonErrorType() {
        if (this.currentErrors.length === 0) return 'none';

        const typeCounts = {};
        this.currentErrors.forEach(error => {
            typeCounts[error.questionType] = (typeCounts[error.questionType] || 0) + 1;
        });

        let maxCount = 0;
        let mostCommon = 'none';
        
        Object.keys(typeCounts).forEach(type => {
            if (typeCounts[type] > maxCount) {
                maxCount = typeCounts[type];
                mostCommon = type;
            }
        });

        return mostCommon;
    },

    /**
     * Get error statistics by question type
     * @returns {Object} Statistics by type
     */
    getStatisticsByType() {
        const stats = {};
        
        Object.keys(this.ERROR_TYPES).forEach(type => {
            stats[type] = {
                count: 0,
                percentage: 0
            };
        });

        this.currentErrors.forEach(error => {
            if (stats[error.questionType]) {
                stats[error.questionType].count++;
            }
        });

        const total = this.currentErrors.length;
        Object.keys(stats).forEach(type => {
            stats[type].percentage = total > 0 ? 
                ((stats[type].count / total) * 100).toFixed(1) : 0;
        });

        return stats;
    },

    /**
     * Get errors by level
     * @param {string} level - Band level
     * @returns {Array} Filtered errors
     */
    getErrorsByLevel(level) {
        return this.currentErrors.filter(error => error.level === level);
    },

    /**
     * Get recent errors
     * @param {number} count - Number of errors to get
     * @returns {Array} Recent errors
     */
    getRecentErrors(count = 5) {
        return this.currentErrors.slice(0, count);
    },

    /**
     * Export errors to JSON
     */
    exportErrors() {
        if (this.currentErrors.length === 0) {
            Utils.showNotification('Không có lỗi để xuất', 'warning');
            return;
        }

        const data = {
            errors: this.currentErrors,
            statistics: this.getStatisticsByType(),
            exportDate: new Date().toISOString(),
            totalErrors: this.currentErrors.length
        };

        Utils.exportToJSON(data, `errors_${new Date().toISOString().split('T')[0]}.json`);
        Utils.showNotification('Đã xuất danh sách lỗi', 'success');
    },

    /**
     * Get improvement suggestions based on error patterns
     * @returns {Array} Suggestions
     */
    getImprovementSuggestions() {
        const suggestions = [];
        const stats = this.getStatisticsByType();

        // Find weak areas (error rate > 30%)
        Object.keys(stats).forEach(type => {
            if (stats[type].count >= 3 && stats[type].percentage > 30) {
                const typeInfo = this.ERROR_TYPES[type];
                suggestions.push({
                    type: type,
                    name: typeInfo.name,
                    errorCount: stats[type].count,
                    tips: typeInfo.tips,
                    priority: 'high'
                });
            }
        });

        return suggestions;
    },

    /**
     * Generate error report
     * @returns {Object} Error report
     */
    generateReport() {
        const byType = this.getStatisticsByType();
        const suggestions = this.getImprovementSuggestions();
        const recentErrors = this.getRecentErrors(10);

        return {
            summary: {
                totalErrors: this.currentErrors.length,
                mostCommonType: this.getMostCommonErrorType(),
                errorsByType: byType
            },
            recentErrors: recentErrors,
            suggestions: suggestions,
            generatedAt: new Date().toISOString()
        };
    }
};

// Add CSS styles for error display
const errorStyles = document.createElement('style');
errorStyles.textContent = `
    .error-item {
        background: white;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
        border-left: 4px solid #dc3545;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .error-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        flex-wrap: wrap;
        gap: 10px;
    }

    .error-type {
        font-weight: 600;
        color: #dc3545;
        font-size: 16px;
    }

    .error-meta {
        display: flex;
        gap: 10px;
        align-items: center;
        font-size: 14px;
        color: #666;
    }

    .error-level {
        background: #667eea;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
    }

    .error-question {
        padding: 12px;
        background: #f8f9fa;
        border-radius: 6px;
        margin-bottom: 12px;
        font-size: 14px;
    }

    .error-answers {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 12px;
    }

    .error-answer {
        padding: 10px;
        background: #f8f9fa;
        border-radius: 6px;
        font-size: 14px;
    }

    .answer-text {
        display: block;
        margin-top: 5px;
        padding: 5px 8px;
        border-radius: 4px;
        font-weight: 600;
    }

    .answer-text.incorrect {
        background: #ffe0e0;
        color: #dc3545;
    }

    .answer-text.correct {
        background: #d4edda;
        color: #28a745;
    }

    .error-explanation {
        background: #e3f2fd;
        padding: 12px;
        border-radius: 6px;
        margin-bottom: 12px;
        border-left: 3px solid #17a2b8;
    }

    .error-explanation strong {
        color: #17a2b8;
        display: block;
        margin-bottom: 8px;
    }

    .error-explanation p {
        margin: 0;
        line-height: 1.6;
        font-size: 14px;
    }

    .improvement-tip {
        background: #e8f5e9;
        padding: 12px;
        border-radius: 6px;
        border-left: 3px solid #28a745;
    }

    .improvement-tip strong {
        color: #28a745;
        display: block;
        margin-bottom: 8px;
    }

    .improvement-tip ul {
        margin: 0;
        padding-left: 20px;
    }

    .improvement-tip li {
        margin-bottom: 6px;
        line-height: 1.5;
        font-size: 14px;
    }

    @media (max-width: 768px) {
        .error-answers {
            grid-template-columns: 1fr;
        }
    }
`;
document.head.appendChild(errorStyles);

// Make ErrorTracker available globally
window.ErrorTracker = ErrorTracker;
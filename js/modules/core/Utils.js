/* ==========================================
   Utility Functions
   ========================================== */

const Utils = {
    /**
     * Format time in seconds to MM:SS format
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string
     */
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Format date to Vietnamese format
     * @param {Date} date - Date object
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        const options = { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        };
        return new Date(date).toLocaleString('vi-VN', options);
    },

    /**
     * Format date to short format (DD/MM/YYYY)
     * @param {Date} date - Date object
     * @returns {string} Formatted date string
     */
    formatDateShort(date) {
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    },

    /**
     * Calculate IELTS band score from correct answers
     * @param {number} correct - Number of correct answers
     * @param {number} total - Total number of questions
     * @returns {number} Band score (0-9)
     */
    calculateBandScore(correct, total) {
        const percentage = (correct / total) * 100;
        
        if (percentage >= 95) return 9.0;
        if (percentage >= 90) return 8.5;
        if (percentage >= 83) return 8.0;
        if (percentage >= 75) return 7.5;
        if (percentage >= 68) return 7.0;
        if (percentage >= 60) return 6.5;
        if (percentage >= 53) return 6.0;
        if (percentage >= 45) return 5.5;
        if (percentage >= 38) return 5.0;
        if (percentage >= 30) return 4.5;
        if (percentage >= 23) return 4.0;
        return 3.5;
    },

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    /**
     * Shuffle array randomly
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled array
     */
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    },

    /**
     * Alias for shuffleArray
     * @param {Array} array - Array to shuffle
     * @returns {Array} Shuffled array
     */
    shuffle(array) {
        return this.shuffleArray(array);
    },

    /**
     * Debounce function to limit function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function to limit function execution rate
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    /**
     * Show notification/toast message
     * @param {string} message - Message to display
     * @param {string} type - Type of notification (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     */
    showNotification(message, type = 'info', duration = 3000) {
        // Use new Notification system if available
        if (window.Notification && window.Notification.show) {
            window.Notification.show(message, type, duration);
            return;
        }

        // Fallback to simple notification
        const existing = document.querySelector('.notification-toast');
        if (existing) {
            existing.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification-toast notification-${type}`;
        notification.textContent = message;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 9999;
            animation: slideInRight 0.3s ease-out;
            max-width: 400px;
            font-size: 14px;
            font-weight: 500;
        `;

        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#667eea'
        };
        notification.style.borderLeft = `4px solid ${colors[type] || colors.info}`;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    },

    /**
     * Validate email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     */
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    /**
     * Capitalize first letter of string
     * @param {string} str - String to capitalize
     * @returns {string} Capitalized string
     */
    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },

    /**
     * Truncate text to specified length
     * @param {string} text - Text to truncate
     * @param {number} length - Maximum length
     * @returns {string} Truncated text
     */
    truncateText(text, length) {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    },

    /**
     * Parse query string from URL
     * @returns {Object} Query parameters as object
     */
    parseQueryString() {
        const params = {};
        const queryString = window.location.search.substring(1);
        const pairs = queryString.split('&');
        
        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            if (key) {
                params[decodeURIComponent(key)] = decodeURIComponent(value || '');
            }
        });
        
        return params;
    },

    /**
     * Deep clone an object
     * @param {Object} obj - Object to clone
     * @returns {Object} Cloned object
     */
    deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    /**
     * Check if element is in viewport
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} True if in viewport
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * Smooth scroll to element
     * @param {string} selector - Element selector
     * @param {number} offset - Offset from top in pixels
     */
    scrollToElement(selector, offset = 0) {
        const element = document.querySelector(selector);
        if (element) {
            const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({
                top: top,
                behavior: 'smooth'
            });
        }
    },

    /**
     * Format number with thousand separators
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    /**
     * Calculate percentage
     * @param {number} value - Current value
     * @param {number} total - Total value
     * @param {number} decimals - Number of decimal places
     * @returns {number} Percentage
     */
    calculatePercentage(value, total, decimals = 0) {
        if (total === 0) return 0;
        return parseFloat(((value / total) * 100).toFixed(decimals));
    },

    /**
     * Get random item from array
     * @param {Array} array - Source array
     * @returns {*} Random item
     */
    getRandomItem(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    /**
     * Remove duplicates from array
     * @param {Array} array - Source array
     * @returns {Array} Array without duplicates
     */
    removeDuplicates(array) {
        return [...new Set(array)];
    },

    /**
     * Sort array of objects by property
     * @param {Array} array - Array to sort
     * @param {string} property - Property to sort by
     * @param {string} order - 'asc' or 'desc'
     * @returns {Array} Sorted array
     */
    sortByProperty(array, property, order = 'asc') {
        return array.sort((a, b) => {
            if (order === 'asc') {
                return a[property] > b[property] ? 1 : -1;
            } else {
                return a[property] < b[property] ? 1 : -1;
            }
        });
    },

    /**
     * Check if object is empty
     * @param {Object} obj - Object to check
     * @returns {boolean} True if empty
     */
    isEmpty(obj) {
        return Object.keys(obj).length === 0;
    },

    /**
     * Convert seconds to hours and minutes
     * @param {number} seconds - Seconds to convert
     * @returns {string} Formatted time string
     */
    secondsToHoursMinutes(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    },

    /**
     * Normalize text for comparison (remove accents, lowercase, trim)
     * @param {string} text - Text to normalize
     * @returns {string} Normalized text
     */
    normalizeText(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    },

    /**
     * Compare two answers (case-insensitive, accent-insensitive)
     * @param {string} answer1 - First answer
     * @param {string} answer2 - Second answer
     * @returns {boolean} True if answers match
     */
    compareAnswers(answer1, answer2) {
        return this.normalizeText(answer1) === this.normalizeText(answer2);
    },

    /**
     * Sanitize HTML content
     * @param {string} html - HTML string to sanitize
     * @returns {string} Sanitized HTML
     */
    sanitize(html) {
        if (window.DOMPurify) {
            return DOMPurify.sanitize(html);
        }
        // Fallback simple escape for safety if DOMPurify fails to load
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    },

    /**
     * Export data as JSON file
     * @param {Object} data - Data to export
     * @param {string} filename - Name of file
     */
    exportToJSON(data, filename) {
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Add CSS animation keyframes
     */
    addAnimationStyles() {
        if (!document.getElementById('utils-animations')) {
            const style = document.createElement('style');
            style.id = 'utils-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }
};

// Initialize animation styles
Utils.addAnimationStyles();

// Make Utils available globally
window.Utils = Utils;
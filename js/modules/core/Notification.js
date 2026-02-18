/* ==========================================
   Professional Notification System
   Modern popup notifications with animations
   ========================================== */

const Notification = {
    container: null,
    queue: [],
    activeNotifications: new Set(),
    maxActive: 3,

    /**
     * Initialize notification system
     */
    init() {
        this.createContainer();
        this.addStyles();
    },

    /**
     * Create notification container
     */
    createContainer() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notificationContainer';
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        }
    },

    /**
     * Show notification popup
     * @param {string} message - Message to display
     * @param {string} type - Type: success, error, warning, info
     * @param {number} duration - Duration in milliseconds (0 = permanent)
     */
    show(message, type = 'info', duration = 3000) {
        const notification = {
            id: this.generateId(),
            message,
            type,
            duration
        };

        // If too many active notifications, queue it
        if (this.activeNotifications.size >= this.maxActive) {
            this.queue.push(notification);
            return;
        }

        this.displayNotification(notification);
    },

    /**
     * Display a notification
     * @param {Object} notification - Notification config
     */
    displayNotification(notification) {
        this.createContainer();

        const { id, message, type, duration } = notification;

        // Create notification element
        const element = document.createElement('div');
        element.className = `notification notification-${type}`;
        element.setAttribute('data-id', id);

        // Icon based on type
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        element.innerHTML = `
            <div class="notification-icon">${icons[type] || icons.info}</div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" aria-label="Close">×</button>
        `;

        // Add close button handler
        const closeBtn = element.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => this.hide(id));

        // Add to container
        this.container.appendChild(element);
        this.activeNotifications.add(id);

        // Trigger animation
        setTimeout(() => element.classList.add('show'), 10);

        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => this.hide(id), duration);
        }
    },

    /**
     * Hide notification
     * @param {string} id - Notification ID
     */
    hide(id) {
        const element = this.container?.querySelector(`[data-id="${id}"]`);
        if (!element) return;

        element.classList.remove('show');
        element.classList.add('hide');

        setTimeout(() => {
            element.remove();
            this.activeNotifications.delete(id);

            // Show next queued notification
            if (this.queue.length > 0) {
                const next = this.queue.shift();
                this.displayNotification(next);
            }
        }, 300);
    },

    /**
     * Show success notification
     * @param {string} message - Message
     * @param {number} duration - Duration
     */
    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    },

    /**
     * Show error notification
     * @param {string} message - Message
     * @param {number} duration - Duration
     */
    error(message, duration = 4000) {
        this.show(message, 'error', duration);
    },

    /**
     * Show warning notification
     * @param {string} message - Message
     * @param {number} duration - Duration
     */
    warning(message, duration = 3500) {
        this.show(message, 'warning', duration);
    },

    /**
     * Show info notification
     * @param {string} message - Message
     * @param {number} duration - Duration
     */
    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    },

    /**
     * Clear all notifications
     */
    clearAll() {
        this.activeNotifications.forEach(id => this.hide(id));
        this.queue = [];
    },

    /**
     * Generate unique ID
     * @returns {string} Unique ID
     */
    generateId() {
        return `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * Add notification styles
     */
    addStyles() {
        if (document.getElementById('notification-styles')) return;

        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                pointer-events: none;
                display: flex;
                flex-direction: column;
                gap: 12px;
                max-width: 420px;
            }

            .notification {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px 20px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12),
                           0 2px 8px rgba(0, 0, 0, 0.08);
                pointer-events: all;
                transform: translateX(400px);
                opacity: 0;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border-left: 4px solid;
                min-width: 320px;
                max-width: 420px;
                position: relative;
            }

            .notification.show {
                transform: translateX(0);
                opacity: 1;
            }

            .notification.hide {
                transform: translateX(400px);
                opacity: 0;
            }

            .notification-icon {
                font-size: 24px;
                flex-shrink: 0;
                line-height: 1;
            }

            .notification-content {
                flex: 1;
                min-width: 0;
            }

            .notification-message {
                font-size: 14px;
                font-weight: 500;
                color: #1a202c;
                line-height: 1.5;
                word-wrap: break-word;
            }

            .notification-close {
                background: none;
                border: none;
                font-size: 24px;
                line-height: 1;
                color: #718096;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: all 0.2s;
                flex-shrink: 0;
            }

            .notification-close:hover {
                background: rgba(0, 0, 0, 0.05);
                color: #2d3748;
            }

            /* Type-specific colors */
            .notification-success {
                border-left-color: #28a745;
            }

            .notification-success .notification-icon {
                animation: successPulse 0.5s ease-out;
            }

            .notification-error {
                border-left-color: #dc3545;
            }

            .notification-error .notification-icon {
                animation: errorShake 0.5s ease-out;
            }

            .notification-warning {
                border-left-color: #ffc107;
            }

            .notification-warning .notification-icon {
                animation: warningBounce 0.5s ease-out;
            }

            .notification-info {
                border-left-color: #667eea;
            }

            /* Animations */
            @keyframes successPulse {
                0%, 100% {
                    transform: scale(1);
                }
                50% {
                    transform: scale(1.2);
                }
            }

            @keyframes errorShake {
                0%, 100% {
                    transform: translateX(0);
                }
                25% {
                    transform: translateX(-5px);
                }
                75% {
                    transform: translateX(5px);
                }
            }

            @keyframes warningBounce {
                0%, 100% {
                    transform: translateY(0);
                }
                50% {
                    transform: translateY(-5px);
                }
            }

            /* Mobile responsive */
            @media (max-width: 768px) {
                .notification-container {
                    top: 10px;
                    right: 10px;
                    left: 10px;
                    max-width: none;
                }

                .notification {
                    min-width: auto;
                    max-width: none;
                    padding: 14px 16px;
                }

                .notification-message {
                    font-size: 13px;
                }
            }

            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
                .notification {
                    background: #2d3748;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3),
                               0 2px 8px rgba(0, 0, 0, 0.2);
                }

                .notification-message {
                    color: #e2e8f0;
                }

                .notification-close {
                    color: #cbd5e0;
                }

                .notification-close:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #f7fafc;
                }
            }
        `;
        document.head.appendChild(style);
    }
};

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Notification.init());
} else {
    Notification.init();
}

// Make available globally
window.Notification = Notification;

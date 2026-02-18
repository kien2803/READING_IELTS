/* ==========================================
   Main Application Entry Point (Modular)
   ========================================== */

// Import Core Modules
import './modules/core/Config.js';
import './modules/core/Notification.js';
import './modules/core/Utils.js';
import './modules/core/Storage.js';
import './modules/core/Timer.js';

// Import Services
import './modules/services/FileParser.js';
import './modules/services/TextSelector.js';
import './modules/services/AIProvider.js';
import './modules/services/AIAnalysis.js';
import './modules/services/AIGenerator.js';
import './modules/services/AdaptiveDifficulty.js';

// Import Features
import './modules/features/DashboardCharts.js';
import './modules/features/Dashboard.js';
import './modules/features/Practice.js';
import './modules/features/Vocabulary.js';
import './modules/features/Flashcard.js';
import './modules/features/VocabQuiz.js';
import './modules/features/ErrorTracker.js';
import './modules/features/MiniTest.js';
import './modules/features/Drill.js';
import './modules/features/ManualEntry.js';
import './modules/features/Library.js';

// Import App Controller
import { App } from './modules/core/App.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Bootstrapping Modular App...');
    if (window.App && window.App.init) {
        window.App.init();
    } else {
        console.error('❌ App module not loaded properly!');
    }
});

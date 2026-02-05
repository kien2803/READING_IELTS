/* ==========================================
   Library Module
   Manage and display all tests
   ========================================== */

const Library = {
    currentSource: 'all',

    /**
     * Initialize library
     */
    init() {
        this.bindEvents();
        this.render();
    },

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Source tabs
        document.querySelectorAll('.source-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.filterBySource(e.target.dataset.source);
            });
        });
    },

    /**
     * Filter tests by source
     */
    filterBySource(source) {
        this.currentSource = source;

        // Update tabs
        document.querySelectorAll('.source-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.source === source);
        });

        this.render();
    },

    /**
     * Render library grid
     */
    render() {
        const container = document.getElementById('libraryGrid');
        if (!container) return;

        const allTests = this.getAllTests();
        const filteredTests = this.currentSource === 'all' 
            ? allTests 
            : allTests.filter(t => t.source === this.currentSource);

        if (filteredTests.length === 0) {
            container.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <p>Không có đề thi nào trong thư viện</p>
                    <button class="btn btn-primary" onclick="App.switchTab('upload')">
                        ➕ Thêm đề thi
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredTests.map(test => this.renderTestCard(test)).join('');
    },

    /**
     * Get all tests from all sources
     */
    getAllTests() {
        const customTests = FileParser.getCustomTests();
        const sampleTests = this.getDefaultTests();
        
        return [...sampleTests, ...customTests].map(test => ({
            ...test,
            source: test.source || 'custom'
        }));
    },

    /**
     * Get default/sample tests
     */
    getDefaultTests() {
        return [
            {
                id: 'sample-cambridge-18-1',
                title: 'Cambridge 18 - Test 1',
                source: 'cambridge',
                level: '7.5',
                passages: [
                    {
                        id: 'p1',
                        title: 'Urban Farming',
                        text: `Urban farming is the practice of cultivating, processing, and distributing food in or around urban areas. It differs from traditional farming in several key ways, including the scale of production and methods used.

In recent years, urban farming has gained popularity as cities look for ways to increase food security and reduce their environmental footprint. Rooftop gardens, vertical farms, and community gardens have sprouted up in cities around the world.

One of the main benefits of urban farming is that it reduces the distance food travels from farm to table. This not only cuts transportation costs and emissions but also means fresher produce for consumers. Additionally, urban farms can make use of underutilized spaces, turning empty lots and rooftops into productive agricultural land.

However, urban farming faces significant challenges. Limited space, soil contamination, and high real estate costs can make it difficult to scale up operations. Water management and pest control also require innovative solutions in urban environments.

Despite these challenges, proponents argue that urban farming will play an increasingly important role in feeding growing city populations sustainably.`,
                        questions: [
                            { id: 'c18-1-1', type: 'tfng', text: 'Urban farming is identical to traditional farming.', answer: 'False', explanation: 'The passage states it "differs from traditional farming in several key ways".' },
                            { id: 'c18-1-2', type: 'tfng', text: 'Rooftop gardens are a form of urban farming.', answer: 'True', explanation: 'The passage mentions "Rooftop gardens, vertical farms, and community gardens".' },
                            { id: 'c18-1-3', type: 'tfng', text: 'Urban farming completely eliminates transportation costs.', answer: 'False', explanation: 'The passage says it "cuts transportation costs" not eliminates them.' },
                            { id: 'c18-1-4', type: 'tfng', text: 'Soil contamination is not a concern for urban farms.', answer: 'False', explanation: 'The passage lists "soil contamination" as one of the challenges.' },
                            { id: 'c18-1-5', type: 'summary', text: 'Urban farming can help cities increase food ______ and reduce their environmental impact.', answer: 'security', wordLimit: 1, explanation: 'The passage mentions "increase food security".' }
                        ]
                    }
                ]
            },
            {
                id: 'sample-british-council-1',
                title: 'British Council Practice Test 1',
                source: 'british-council',
                level: '7.0',
                passages: [
                    {
                        id: 'p1',
                        title: 'The Science of Sleep',
                        text: `Sleep is a fundamental biological process that affects every aspect of our health and well-being. Despite spending roughly a third of our lives asleep, scientists are still uncovering the mysteries of why we sleep and what happens in our brains during this time.

Research has shown that sleep plays a crucial role in memory consolidation. During sleep, the brain processes and stores information gathered throughout the day, transferring it from short-term to long-term memory. This is why students who get adequate sleep often perform better academically than those who don't.

Sleep deprivation, on the other hand, can have serious consequences. Studies have linked insufficient sleep to a range of health problems, including obesity, heart disease, and weakened immune function. Mentally, lack of sleep impairs concentration, decision-making, and emotional regulation.

The recommended amount of sleep varies by age. Adults typically need 7-9 hours per night, while teenagers require 8-10 hours. Children and infants need even more sleep to support their rapid development.

Modern life presents many challenges to healthy sleep patterns. Blue light from screens, irregular work schedules, and high caffeine intake can all disrupt our natural sleep-wake cycles.`,
                        questions: [
                            { id: 'bc-1-1', type: 'tfng', text: 'Scientists have fully understood why humans need sleep.', answer: 'False', explanation: 'The passage says scientists are "still uncovering the mysteries of why we sleep".' },
                            { id: 'bc-1-2', type: 'tfng', text: 'Sleep helps with memory consolidation.', answer: 'True', explanation: 'The passage explicitly states "sleep plays a crucial role in memory consolidation".' },
                            { id: 'bc-1-3', type: 'ynng', text: 'The author believes modern technology negatively impacts sleep.', answer: 'Yes', explanation: 'The author mentions blue light from screens as a challenge to healthy sleep.' },
                            { id: 'bc-1-4', type: 'multiple-choice', text: 'How many hours of sleep do adults typically need?', answer: '7-9 hours', options: ['5-6 hours', '7-9 hours', '10-12 hours', '4-5 hours'], explanation: 'The passage states "Adults typically need 7-9 hours per night".' },
                            { id: 'bc-1-5', type: 'sentence', text: 'During sleep, information is transferred from short-term to _______ memory.', answer: 'long-term', wordLimit: 2, explanation: 'The passage mentions "transferring it from short-term to long-term memory".' }
                        ]
                    }
                ]
            },
            {
                id: 'sample-ielts-official-1',
                title: 'IELTS Official Practice 1',
                source: 'ielts-official',
                level: '8.0',
                passages: [
                    {
                        id: 'p1',
                        title: 'Climate Change and Biodiversity',
                        text: `Climate change is rapidly emerging as one of the most significant threats to global biodiversity. As temperatures rise and weather patterns shift, species around the world are being forced to adapt, migrate, or face extinction.

A. Many species are already responding to changing conditions by shifting their geographical ranges. Some are moving towards the poles or to higher elevations in search of cooler temperatures. However, this option is not available to all species, particularly those already living in polar regions or on mountain peaks.

B. The timing of natural events is also being affected. Many plants are flowering earlier, and animals are adjusting their migration and breeding schedules. When these changes occur at different rates for predators and prey, or for plants and their pollinators, it can disrupt entire ecosystems.

C. Perhaps most concerning is the potential for climate change to push species beyond their physiological limits. Every organism has a range of temperatures it can tolerate. As global temperatures rise, some species may find themselves living in conditions they simply cannot survive.

D. Conservation efforts are now increasingly focused on helping species adapt to climate change. This includes creating wildlife corridors to allow species to migrate, protecting diverse habitats, and in some cases, assisted relocation of vulnerable species.`,
                        questions: [
                            { id: 'io-1-1', type: 'matching-headings', text: 'Which paragraph discusses how species are moving to new locations?', answer: 'A', options: ['A', 'B', 'C', 'D'], explanation: 'Paragraph A discusses species "shifting their geographical ranges".' },
                            { id: 'io-1-2', type: 'matching-headings', text: 'Which paragraph mentions disruption of ecosystem relationships?', answer: 'B', options: ['A', 'B', 'C', 'D'], explanation: 'Paragraph B discusses how timing changes "can disrupt entire ecosystems".' },
                            { id: 'io-1-3', type: 'tfng', text: 'All species can migrate to cooler regions.', answer: 'False', explanation: 'The passage states "this option is not available to all species".' },
                            { id: 'io-1-4', type: 'tfng', text: 'Conservation efforts include creating wildlife corridors.', answer: 'True', explanation: 'The passage explicitly mentions "creating wildlife corridors".' },
                            { id: 'io-1-5', type: 'summary', text: 'Every organism has a range of temperatures it can _______.', answer: 'tolerate', wordLimit: 1, explanation: 'The passage states "Every organism has a range of temperatures it can tolerate".' }
                        ]
                    }
                ]
            }
        ];
    },

    /**
     * Render individual test card
     */
    renderTestCard(test) {
        const totalQuestions = test.passages 
            ? test.passages.reduce((sum, p) => sum + (p.questions?.length || 0), 0) 
            : 0;

        const sourceIcons = {
            'cambridge': '🏛️',
            'british-council': '🇬🇧',
            'ielts-official': '📘',
            'custom': '✨'
        };

        const sourceLabels = {
            'cambridge': 'Cambridge',
            'british-council': 'British Council',
            'ielts-official': 'IELTS Official',
            'custom': 'Custom'
        };

        return `
            <div class="library-card" data-test-id="${test.id}">
                <div class="library-card-header">
                    <span class="source-badge ${test.source}">${sourceIcons[test.source] || '📚'} ${sourceLabels[test.source] || test.source}</span>
                    <span class="level-badge">Band ${test.level}</span>
                </div>
                <h3 class="library-card-title">${test.title}</h3>
                <div class="library-card-meta">
                    <span>📖 ${test.passages?.length || 0} passages</span>
                    <span>❓ ${totalQuestions} questions</span>
                </div>
                <div class="library-card-actions">
                    <button class="btn btn-primary btn-sm" onclick="Library.startTest('${test.id}')">
                        ▶️ Bắt đầu
                    </button>
                    ${test.source === 'custom' ? `
                        <button class="btn btn-danger btn-sm" onclick="Library.deleteTest('${test.id}')">
                            🗑️
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    /**
     * Start a test from library
     */
    startTest(testId) {
        App.switchTab('practice');
        
        // Small delay to ensure practice tab is loaded
        setTimeout(() => {
            if (typeof Practice !== 'undefined') {
                Practice.selectTest(testId);
            }
        }, 100);
    },

    /**
     * Delete a custom test
     */
    deleteTest(testId) {
        if (!confirm('Bạn có chắc muốn xóa đề thi này?')) return;

        FileParser.deleteCustomTest(testId);
        Utils.showNotification('Đã xóa đề thi', 'success');
        this.render();
    }
};

// Make Library available globally
window.Library = Library;

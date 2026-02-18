/* ==========================================
   File Parser Module
   Parse uploaded files to generate tests
   With automatic save functionality
   ========================================== */

const FileParser = {
    /**
     * Parse uploaded file and automatically save to storage
     * @param {File} file - Uploaded file
     * @returns {Promise<Object>} Result with success status and data
     */
    async parseFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        
        try {
            let data;
            
            switch (extension) {
                case 'json':
                    data = await this.parseJSON(file);
                    break;
                case 'txt':
                    data = await this.parseTXT(file);
                    break;
                case 'docx':
                    data = await this.parseDOCX(file);
                    break;
                default:
                    return { success: false, error: 'Định dạng file không được hỗ trợ' };
            }
            
            // Add default title if missing
            if (!data.title) {
                data.title = file.name.replace(/\.[^/.]+$/, '');
            }
            
            // Auto-save the test
            const testId = this.saveTest(data);
            
            console.log(`📁 File parsed and saved: ${file.name} -> ${testId}`);
            
            return { 
                success: true, 
                data: { ...data, id: testId },
                message: `Đã lưu đề thi "${data.title}" thành công!`
            };
            
        } catch (error) {
            console.error('Parse file error:', error);
            return { 
                success: false, 
                error: error.message || 'Lỗi khi đọc file'
            };
        }
    },

    /**
     * Parse JSON file
     * Expected format:
     * {
     *   "title": "Test Title",
     *   "level": "7.0",
     *   "passages": [
     *     {
     *       "title": "Passage 1",
     *       "text": "...",
     *       "questions": [
     *         {
     *           "type": "tfng",
     *           "text": "Question text",
     *           "answer": "True",
     *           "explanation": "..."
     *         }
     *       ]
     *     }
     *   ]
     * }
     */
    async parseJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Validate structure
                    if (!this.validateJSONStructure(data)) {
                        reject(new Error('Invalid JSON structure'));
                        return;
                    }

                    resolve(data);
                } catch (error) {
                    reject(new Error('Invalid JSON format'));
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    },

    /**
     * Validate JSON structure
     * @param {Object} data - JSON data
     * @returns {boolean} Is valid
     */
    validateJSONStructure(data) {
        if (!data.passages || !Array.isArray(data.passages)) {
            return false;
        }

        for (const passage of data.passages) {
            if (!passage.title || !passage.text || !passage.questions) {
                return false;
            }

            if (!Array.isArray(passage.questions)) {
                return false;
            }

            for (const question of passage.questions) {
                if (!question.type || !question.text || !question.answer) {
                    return false;
                }
            }
        }

        return true;
    },

    /**
     * Parse TXT file
     * Expected format:
     * 
     * TITLE: Test Title
     * LEVEL: 7.0
     * 
     * === PASSAGE 1 ===
     * [Passage Title]
     * Passage text here...
     * 
     * === QUESTIONS ===
     * TYPE: tfng
     * Q1: Question text here
     * A1: True
     * E1: Explanation here
     * 
     * Q2: Question text
     * A2: False
     * E2: Explanation
     */
    async parseTXT(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const parsed = this.parseTXTContent(content);
                    resolve(parsed);
                } catch (error) {
                    reject(new Error('Failed to parse TXT file: ' + error.message));
                }
            };

            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    },

    /**
     * Parse TXT content
     * @param {string} content - File content
     * @returns {Object} Parsed data
     */
    parseTXTContent(content) {
        const lines = content.split('\n').map(line => line.trim());
        const data = {
            title: '',
            level: '6.0',
            passages: []
        };

        let currentPassage = null;
        let currentQuestionType = null;
        let inPassageText = false;
        let passageTextBuffer = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Parse title
            if (line.startsWith('TITLE:')) {
                data.title = line.replace('TITLE:', '').trim();
                continue;
            }

            // Parse level
            if (line.startsWith('LEVEL:')) {
                data.level = line.replace('LEVEL:', '').trim();
                continue;
            }

            // New passage
            if (line.startsWith('=== PASSAGE')) {
                if (currentPassage) {
                    data.passages.push(currentPassage);
                }
                currentPassage = {
                    title: '',
                    text: '',
                    questions: []
                };
                inPassageText = true;
                passageTextBuffer = [];
                continue;
            }

            // Questions section
            if (line.startsWith('=== QUESTIONS ===')) {
                if (passageTextBuffer.length > 0) {
                    currentPassage.text = passageTextBuffer.join('\n\n');
                    passageTextBuffer = [];
                }
                inPassageText = false;
                continue;
            }

            // Question type
            if (line.startsWith('TYPE:')) {
                currentQuestionType = line.replace('TYPE:', '').trim();
                continue;
            }

            // Passage title in brackets
            if (line.startsWith('[') && line.endsWith(']') && inPassageText) {
                currentPassage.title = line.slice(1, -1);
                continue;
            }

            // Collect passage text
            if (inPassageText && line && !line.startsWith('===')) {
                passageTextBuffer.push(line);
                continue;
            }

            // Parse questions
            if (line.startsWith('Q')) {
                const match = line.match(/Q(\d+):\s*(.+)/);
                if (match) {
                    const questionNum = parseInt(match[1]);
                    const questionText = match[2];

                    // Look ahead for answer and explanation
                    let answer = '';
                    let explanation = '';
                    let options = [];

                    for (let j = i + 1; j < lines.length; j++) {
                        if (lines[j].startsWith(`A${questionNum}:`)) {
                            answer = lines[j].replace(`A${questionNum}:`, '').trim();
                        }
                        if (lines[j].startsWith(`E${questionNum}:`)) {
                            explanation = lines[j].replace(`E${questionNum}:`, '').trim();
                        }
                        if (lines[j].startsWith('OPTIONS:')) {
                            options = lines[j].replace('OPTIONS:', '').trim().split('|');
                        }
                        if (lines[j].startsWith('Q') && !lines[j].startsWith(`Q${questionNum}`)) {
                            break;
                        }
                    }

                    const question = {
                        type: currentQuestionType || 'tfng',
                        text: questionText,
                        answer: answer,
                        explanation: explanation,
                        id: `q${questionNum}`
                    };

                    if (options.length > 0) {
                        question.options = options;
                    }

                    currentPassage.questions.push(question);
                }
            }
        }

        // Add last passage
        if (currentPassage) {
            data.passages.push(currentPassage);
        }

        return data;
    },

    /**
     * Parse DOCX file (simplified - requires library in real implementation)
     * @param {File} file - DOCX file
     * @returns {Promise} Parsed data
     */
    async parseDOCX(file) {
        // For DOCX, we'd need mammoth.js or similar library
        // For now, show error message
        throw new Error('DOCX parsing requires mammoth.js library. Please use JSON or TXT format for now.');
    },

    /**
     * Generate example file content
     * @param {string} format - File format (json, txt)
     * @returns {string} Example content
     */
    generateExample(format) {
        if (format === 'json') {
            return JSON.stringify({
                "title": "IELTS Reading Practice Test",
                "level": "7.0",
                "passages": [
                    {
                        "title": "The History of Coffee",
                        "text": "Coffee is one of the world's most popular beverages. The origins of coffee can be traced back to the ancient coffee forests on the Ethiopian plateau. According to legend, a goat herder named Kaldi first discovered the potential of these beloved beans.\n\nBy the 15th century, coffee was being grown in the Yemeni district of Arabia. By the 16th century, it was known in Persia, Egypt, Syria, and Turkey.",
                        "questions": [
                            {
                                "type": "tfng",
                                "text": "Coffee was first discovered in Yemen.",
                                "answer": "False",
                                "explanation": "Coffee originated in Ethiopia, not Yemen."
                            },
                            {
                                "type": "tfng",
                                "text": "Kaldi was a goat herder.",
                                "answer": "True",
                                "explanation": "The passage states that Kaldi was a goat herder who discovered coffee."
                            },
                            {
                                "type": "multiple-choice",
                                "text": "By the 16th century, coffee was known in:",
                                "options": [
                                    "Ethiopia only",
                                    "Yemen only",
                                    "Persia and Egypt",
                                    "Only Arabia"
                                ],
                                "answer": "Persia and Egypt",
                                "explanation": "The passage mentions coffee was known in Persia, Egypt, Syria, and Turkey by the 16th century."
                            }
                        ]
                    }
                ]
            }, null, 2);
        } else {
            return `TITLE: IELTS Reading Practice Test
LEVEL: 7.0

=== PASSAGE 1 ===
[The History of Coffee]
Coffee is one of the world's most popular beverages. The origins of coffee can be traced back to the ancient coffee forests on the Ethiopian plateau. According to legend, a goat herder named Kaldi first discovered the potential of these beloved beans.

By the 15th century, coffee was being grown in the Yemeni district of Arabia. By the 16th century, it was known in Persia, Egypt, Syria, and Turkey.

=== QUESTIONS ===
TYPE: tfng
Q1: Coffee was first discovered in Yemen.
A1: False
E1: Coffee originated in Ethiopia, not Yemen.

Q2: Kaldi was a goat herder.
A2: True
E2: The passage states that Kaldi was a goat herder who discovered coffee.

TYPE: multiple-choice
Q3: By the 16th century, coffee was known in:
OPTIONS: Ethiopia only|Yemen only|Persia and Egypt|Only Arabia
A3: Persia and Egypt
E3: The passage mentions coffee was known in Persia, Egypt, Syria, and Turkey by the 16th century.`;
        }
    },

    /**
     * Save parsed test to storage
     * @param {Object} testData - Parsed test data
     * @returns {string} Test ID
     */
    saveTest(testData) {
        // Generate unique ID
        const testId = Utils.generateId();
        
        // Store in custom tests
        const customTests = Storage.get(Storage.KEYS.CUSTOM_TESTS) || [];
        const newTest = {
            id: testId,
            ...testData,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };
        
        customTests.push(newTest);
        Storage.set(Storage.KEYS.CUSTOM_TESTS, customTests);
        
        // Add activity log
        Storage.addActivity({
            type: 'test_uploaded',
            description: `Đã upload đề thi "${testData.title || 'Untitled'}" với ${testData.passages?.length || 0} passages`,
            testId: testId
        });
        
        Utils.showNotification('✅ Đã tạo và autosave đề thi thành công!', 'success');
        console.log(`📚 Test saved: ${testId}`, newTest);
        
        return testId;
    },

    /**
     * Save custom test (from ManualEntry)
     * @param {Object} testData - Test data
     */
    saveCustomTest(testData) {
        const customTests = Storage.get(Storage.KEYS.CUSTOM_TESTS) || [];
        
        // Check if updating existing test
        const existingIndex = customTests.findIndex(t => t.id === testData.id);
        
        if (existingIndex >= 0) {
            // Update existing
            customTests[existingIndex] = {
                ...customTests[existingIndex],
                ...testData,
                lastModified: new Date().toISOString()
            };
        } else {
            // Add new
            customTests.push({
                ...testData,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            });
        }
        
        Storage.set(Storage.KEYS.CUSTOM_TESTS, customTests);
        
        // Add activity log
        Storage.addActivity({
            type: 'test_created',
            description: `Đã tạo đề thi "${testData.title}"`,
            testId: testData.id
        });
        
        console.log(`📚 Custom test saved: ${testData.id}`);
    },

    /**
     * Get all custom tests
     * @returns {Array} Custom tests
     */
    getCustomTests() {
        return Storage.get(Storage.KEYS.CUSTOM_TESTS) || [];
    },

    /**
     * Load custom test
     * @param {string} testId - Test ID
     * @returns {Object} Test data
     */
    loadCustomTest(testId) {
        const tests = this.getCustomTests();
        return tests.find(t => t.id === testId);
    },

    /**
     * Delete custom test
     * @param {string} testId - Test ID
     */
    deleteCustomTest(testId) {
        const tests = this.getCustomTests();
        const testToDelete = tests.find(t => t.id === testId);
        const filtered = tests.filter(t => t.id !== testId);
        Storage.set(Storage.KEYS.CUSTOM_TESTS, filtered);
        
        // Add activity log
        Storage.addActivity({
            type: 'test_deleted',
            description: `Đã xóa đề thi "${testToDelete?.title || testId}"`
        });
        
        Utils.showNotification('Đã xóa đề thi', 'success');
    },
    
    /**
     * Get storage usage info
     * @returns {Object} Storage info
     */
    getStorageInfo() {
        const tests = this.getCustomTests();
        return {
            totalTests: tests.length,
            totalPassages: tests.reduce((sum, t) => sum + (t.passages?.length || 0), 0),
            totalQuestions: tests.reduce((sum, t) => 
                sum + (t.passages?.reduce((ps, p) => ps + (p.questions?.length || 0), 0) || 0), 0
            )
        };
    }
};

// Make FileParser available globally
window.FileParser = FileParser;
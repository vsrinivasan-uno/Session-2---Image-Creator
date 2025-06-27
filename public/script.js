// Professional LLM Education Platform
class LLMEducationPlatform {
    constructor() {
        this.currentStudent = '';
        this.currentModel = null;
        this.progress = {
            playground: false,
            assignment: false,
            gallery: false,
            results: false
        };
        this.classSubmissions = [];
        this.currentAssignment = null;
        this.votingData = {};
        this.assignmentSubmitted = false;
        this.assignmentTechnique = 'zero-shot';
        this.confettiParticles = [];
        this.animationId = null;
        this.canvas = null;
        this.ctx = null;
        // Voter tracking for anonymous voting
        this.voterId = null;
        this.voterFingerprint = null;
        this.votedSubmissions = new Set();
        // User tracking for playground analytics
        this.userSessionId = null;
        this.userFingerprint = null;
        this.browserInfo = null;
    }

    init() {
        this.setupEventListeners();
        this.setupParameterControls();
        this.setupTechniqueBuilders();
        this.setupConfetti();
        this.initializeVoter();
        this.loadProgress();
        this.updateUI();
        this.loadDefaultAssignment();
        this.checkWikiModal();
        
        // Initialize auto-resize for all textareas
        this.initAllAutoResize();
        
        // Initialize playground gallery
        this.initializePlaygroundGallery();
        
        // Initialize user tracking for playground analytics
        this.initializeUserTracking();
        
        // Take over navigation if loaded after minimal script
        if (window.navigationSetup) {
            this.takeOverNavigation();
        }
    }

    takeOverNavigation() {
        // Remove existing listeners and set up new ones with full functionality
        document.querySelectorAll('.nav-btn').forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
            newBtn.addEventListener('click', (e) => this.showSection(e.currentTarget.dataset.section));
        });
    }

    setupEventListeners() {
        // Navigation - only set up if not already handled by minimal script
        if (!window.navigationSetup) {
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.showSection(e.currentTarget.dataset.section));
            });
            window.navigationSetup = true;
        }

        // Technique tabs (including assignment tabs)
        document.querySelectorAll('.technique-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const technique = e.currentTarget.dataset.technique;
                if (technique.includes('-assignment')) {
                    this.switchAssignmentTechnique(technique);
                } else {
                    this.switchTechnique(technique);
                }
            });
        });

        // Generate buttons for playground
        document.getElementById('generateZeroShot')?.addEventListener('click', () => this.generateImage('zero-shot'));
        document.getElementById('generateFewShot')?.addEventListener('click', () => this.generateImage('few-shot'));
        document.getElementById('generateChainThought')?.addEventListener('click', () => this.generateImage('chain-thought'));
        document.getElementById('generateRolePlay')?.addEventListener('click', () => this.generateImage('role-play'));
        document.getElementById('generateStructured')?.addEventListener('click', () => this.generateImage('structured'));

        // Assignment generation button
        document.getElementById('generateAssignment')?.addEventListener('click', () => this.generateAssignmentImage());

        // Setup prompt grading
        this.setupPromptGrading();
    }

    setupParameterControls() {
        const temperature = document.getElementById('temperature');
        const topP = document.getElementById('topP');
        const topK = document.getElementById('topK');

        if (!temperature || !topP || !topK) return;

        const updateValues = () => {
            const temp = parseFloat(temperature.value);
            const p = parseFloat(topP.value);
            const k = parseInt(topK.value);

            document.getElementById('tempValue').textContent = temp;
            document.getElementById('topPValue').textContent = p;
            document.getElementById('topKValue').textContent = k;

            // Update recommendation based on parameter combination
            this.updateParameterRecommendation(temp, p, k);
        };

        temperature.addEventListener('input', updateValues);
        topP.addEventListener('input', updateValues);
        topK.addEventListener('input', updateValues);

        // Initial update
        updateValues();

        // Setup Few-Shot parameter controls
        this.setupFewShotParameterControls();
        
        // Setup Chain-of-Thought parameter controls
        this.setupChainThoughtParameterControls();

        // Setup assignment parameter controls
        this.setupAssignmentParameterControls();
    }

    setupFewShotParameterControls() {
        const fewShotTemp = document.getElementById('fewShotTemperature');
        const fewShotTopP = document.getElementById('fewShotTopP');
        const fewShotTopK = document.getElementById('fewShotTopK');

        if (!fewShotTemp || !fewShotTopP || !fewShotTopK) return;

        const updateFewShotValues = () => {
            const temp = parseFloat(fewShotTemp.value);
            const p = parseFloat(fewShotTopP.value);
            const k = parseInt(fewShotTopK.value);

            document.getElementById('fewShotTempValue').textContent = temp;
            document.getElementById('fewShotTopPValue').textContent = p;
            document.getElementById('fewShotTopKValue').textContent = k;
            
            // Update Few-Shot recommendation
            this.updateFewShotParameterRecommendation(temp, p, k);
        };

        fewShotTemp.addEventListener('input', updateFewShotValues);
        fewShotTopP.addEventListener('input', updateFewShotValues);
        fewShotTopK.addEventListener('input', updateFewShotValues);

        // Initial update
        updateFewShotValues();
    }

    setupChainThoughtParameterControls() {
        const chainThoughtTemp = document.getElementById('chainThoughtTemperature');
        const chainThoughtTopP = document.getElementById('chainThoughtTopP');
        const chainThoughtTopK = document.getElementById('chainThoughtTopK');

        if (!chainThoughtTemp || !chainThoughtTopP || !chainThoughtTopK) return;

        const updateChainThoughtValues = () => {
            const temp = parseFloat(chainThoughtTemp.value);
            const p = parseFloat(chainThoughtTopP.value);
            const k = parseInt(chainThoughtTopK.value);

            document.getElementById('chainThoughtTempValue').textContent = temp;
            document.getElementById('chainThoughtTopPValue').textContent = p;
            document.getElementById('chainThoughtTopKValue').textContent = k;
            
            // Update Chain-of-Thought recommendation
            this.updateChainThoughtParameterRecommendation(temp, p, k);
        };

        chainThoughtTemp.addEventListener('input', updateChainThoughtValues);
        chainThoughtTopP.addEventListener('input', updateChainThoughtValues);
        chainThoughtTopK.addEventListener('input', updateChainThoughtValues);

        // Initial update
        updateChainThoughtValues();
    }

    setupAssignmentParameterControls() {
        const assignmentTemp = document.getElementById('assignmentTemperature');
        const assignmentTopP = document.getElementById('assignmentTopP');
        const assignmentTopK = document.getElementById('assignmentTopK');

        if (!assignmentTemp || !assignmentTopP || !assignmentTopK) return;

        const updateAssignmentValues = () => {
            const temp = parseFloat(assignmentTemp.value);
            const p = parseFloat(assignmentTopP.value);
            const k = parseInt(assignmentTopK.value);

            document.getElementById('assignmentTempValue').textContent = temp;
            document.getElementById('assignmentTopPValue').textContent = p;
            document.getElementById('assignmentTopKValue').textContent = k;

            // Update assignment recommendation
            this.updateAssignmentParameterRecommendation(temp, p, k);
        };

        assignmentTemp.addEventListener('input', updateAssignmentValues);
        assignmentTopP.addEventListener('input', updateAssignmentValues);
        assignmentTopK.addEventListener('input', updateAssignmentValues);

        // Initial update
        updateAssignmentValues();
    }

    updateFewShotParameterRecommendation(temp, topP, topK) {
        const recommendationEl = document.getElementById('fewShotParamRecommendation');
        if (!recommendationEl) return;

        const result = this.getParameterRecommendationText(temp, topP, topK);
        
        const iconEl = recommendationEl.querySelector('.recommendation-icon');
        const textEl = recommendationEl.querySelector('.recommendation-text');
        const tagsContainer = recommendationEl.querySelector('.scenario-tags');
        
        if (textEl) {
            textEl.textContent = result.text;
        }
        
        // Update scenarios
        if (tagsContainer) {
            tagsContainer.innerHTML = result.scenarios.map(scenario => 
                `<span class="scenario-tag"><i class="${scenario.icon}"></i> ${scenario.label}</span>`
            ).join('');
        }
        
        // Update icon based on creativity level
        if (iconEl) {
            if (temp <= 0.3) {
                iconEl.textContent = '🎯';
            } else if (temp <= 0.6) {
                iconEl.textContent = '⚡';
            } else if (temp <= 0.8) {
                iconEl.textContent = '🎨';
            } else {
                iconEl.textContent = '🌟';
            }
        }
    }

    updateChainThoughtParameterRecommendation(temp, topP, topK) {
        const recommendationEl = document.getElementById('chainThoughtParamRecommendation');
        if (!recommendationEl) return;

        const result = this.getParameterRecommendationText(temp, topP, topK);
        
        const iconEl = recommendationEl.querySelector('.recommendation-icon');
        const textEl = recommendationEl.querySelector('.recommendation-text');
        const tagsContainer = recommendationEl.querySelector('.scenario-tags');
        
        if (textEl) {
            textEl.textContent = result.text;
        }
        
        // Update scenarios
        if (tagsContainer) {
            tagsContainer.innerHTML = result.scenarios.map(scenario => 
                `<span class="scenario-tag"><i class="${scenario.icon}"></i> ${scenario.label}</span>`
            ).join('');
        }
        
        // Update icon based on creativity level
        if (iconEl) {
            if (temp <= 0.3) {
                iconEl.textContent = '🎯';
            } else if (temp <= 0.6) {
                iconEl.textContent = '⚡';
            } else if (temp <= 0.8) {
                iconEl.textContent = '🎨';
            } else {
                iconEl.textContent = '🌟';
            }
        }
    }

    updateAssignmentParameterRecommendation(temp, topP, topK) {
        const recommendationEl = document.getElementById('assignmentParamRecommendation');
        if (!recommendationEl) return;

        const result = this.getParameterRecommendationText(temp, topP, topK);
        
        const iconEl = recommendationEl.querySelector('.recommendation-icon');
        const textEl = recommendationEl.querySelector('.recommendation-text');
        const tagsContainer = recommendationEl.querySelector('.scenario-tags');
        
        if (textEl) {
            textEl.textContent = result.text;
        }
        
        // Update scenarios (if the assignment section uses the new structure)
        if (tagsContainer) {
            tagsContainer.innerHTML = result.scenarios.map(scenario => 
                `<span class="scenario-tag"><i class="${scenario.icon}"></i> ${scenario.label}</span>`
            ).join('');
        }
        
        // Update icon based on creativity level
        if (iconEl) {
            if (temp <= 0.3) {
                iconEl.textContent = '🎯';
            } else if (temp <= 0.6) {
                iconEl.textContent = '⚡';
            } else if (temp <= 0.8) {
                iconEl.textContent = '🎨';
            } else {
                iconEl.textContent = '🌟';
            }
        }
    }

    getParameterRecommendationText(temp, topP, topK) {
        let scenarios = [];
        let recommendation = '';

        // Calculate creativity level (0-100)
        const creativityLevel = Math.round(temp * 100);
        
        // Calculate complexity level based on topP and topK
        const complexityLevel = Math.round(((topP * 0.6) + (topK / 100 * 0.4)) * 100);
        
        // Calculate focus level (inverse of complexity for some scenarios)
        const focusLevel = 100 - complexityLevel;

        // Primary scenarios based on creativity level (more granular)
        if (creativityLevel <= 15) {
            scenarios.push(
                { icon: 'fas fa-id-card', label: 'ID Photos' },
                { icon: 'fas fa-building', label: 'Corporate' },
                { icon: 'fas fa-file-alt', label: 'Documentation' }
            );
            recommendation = 'Ultra-consistent outputs ideal for standardized documentation and formal business requirements.';
        } else if (creativityLevel <= 25) {
            scenarios.push(
                { icon: 'fas fa-briefcase', label: 'Business' },
                { icon: 'fas fa-user-tie', label: 'Executive' },
                { icon: 'fas fa-award', label: 'Professional' }
            );
            recommendation = 'Highly reliable professional quality with minimal creative variation.';
        } else if (creativityLevel <= 35) {
            scenarios.push(
                { icon: 'fas fa-camera', label: 'Portfolio' },
                { icon: 'fas fa-newspaper', label: 'Editorial' },
                { icon: 'fas fa-graduation-cap', label: 'Academic' }
            );
            recommendation = 'Controlled creativity maintaining professional standards with subtle artistic elements.';
        } else if (creativityLevel <= 50) {
            scenarios.push(
                { icon: 'fas fa-users', label: 'Social Media' },
                { icon: 'fas fa-star', label: 'Marketing' },
                { icon: 'fas fa-heart', label: 'Lifestyle' }
            );
            recommendation = 'Balanced approach offering creative flexibility while maintaining broad appeal.';
        } else if (creativityLevel <= 65) {
            scenarios.push(
                { icon: 'fas fa-palette', label: 'Creative' },
                { icon: 'fas fa-music', label: 'Artistic' },
                { icon: 'fas fa-lightbulb', label: 'Innovative' }
            );
            recommendation = 'Creative-leaning results with artistic flair and unique interpretations.';
        } else if (creativityLevel <= 80) {
            scenarios.push(
                { icon: 'fas fa-paint-brush', label: 'Artistic' },
                { icon: 'fas fa-magic', label: 'Fantasy' },
                { icon: 'fas fa-rocket', label: 'Experimental' }
            );
            recommendation = 'High creativity producing unique and artistic results with bold interpretations.';
        } else {
            scenarios.push(
                { icon: 'fas fa-fire', label: 'Experimental' },
                { icon: 'fas fa-rainbow', label: 'Abstract' },
                { icon: 'fas fa-bolt', label: 'Avant-garde' }
            );
            recommendation = 'Maximum creativity with highly unpredictable and cutting-edge artistic outcomes.';
        }

        // Add complexity-based scenarios (dynamic based on topP and topK)
        if (complexityLevel >= 85) {
            scenarios.push({ icon: 'fas fa-book', label: 'Detailed' });
            scenarios.push({ icon: 'fas fa-layer-group', label: 'Complex' });
            recommendation += ' Enhanced with rich detail and sophisticated vocabulary.';
        } else if (complexityLevel >= 70) {
            scenarios.push({ icon: 'fas fa-cog', label: 'Technical' });
            scenarios.push({ icon: 'fas fa-chart-line', label: 'Analytical' });
            recommendation += ' Balanced complexity with good technical detail.';
        } else if (complexityLevel >= 50) {
            scenarios.push({ icon: 'fas fa-balance-scale', label: 'Balanced' });
            recommendation += ' Moderate complexity suitable for general use.';
        } else if (complexityLevel >= 30) {
            scenarios.push({ icon: 'fas fa-eye', label: 'Clear' });
            scenarios.push({ icon: 'fas fa-check-circle', label: 'Focused' });
            recommendation += ' Simplified approach with clear, focused descriptions.';
        } else {
            scenarios.push({ icon: 'fas fa-compress', label: 'Minimal' });
            scenarios.push({ icon: 'fas fa-bullseye', label: 'Precise' });
            recommendation += ' Minimal complexity optimized for simplicity and precision.';
        }

        // Special combination scenarios
        if (creativityLevel <= 30 && focusLevel >= 70) {
            scenarios.push({ icon: 'fas fa-shield-alt', label: 'Reliable' });
        }
        
        if (creativityLevel >= 60 && complexityLevel >= 70) {
            scenarios.push({ icon: 'fas fa-infinity', label: 'Limitless' });
        }
        
        if (creativityLevel >= 40 && creativityLevel <= 60 && complexityLevel >= 40 && complexityLevel <= 60) {
            scenarios.push({ icon: 'fas fa-handshake', label: 'Versatile' });
        }

        // Limit to maximum 6 scenarios for clean display
        scenarios = scenarios.slice(0, 6);

        return { text: recommendation, scenarios: scenarios };
    }

    updateParameterRecommendation(temp, topP, topK) {
        const recommendationEl = document.getElementById('paramRecommendation');
        if (!recommendationEl) return;

        const result = this.getParameterRecommendationText(temp, topP, topK);
        
        const iconEl = recommendationEl.querySelector('.recommendation-icon');
        const textEl = recommendationEl.querySelector('.recommendation-text');
        const tagsContainer = recommendationEl.querySelector('.scenario-tags');
        
        if (textEl) {
            textEl.textContent = result.text;
        }
        
        // Update scenarios
        if (tagsContainer) {
            tagsContainer.innerHTML = result.scenarios.map(scenario => 
                `<span class="scenario-tag"><i class="${scenario.icon}"></i> ${scenario.label}</span>`
            ).join('');
        }
        
        // Update icon based on creativity level
        if (iconEl) {
            if (temp <= 0.3) {
                iconEl.textContent = '🎯';
            } else if (temp <= 0.6) {
                iconEl.textContent = '⚡';
            } else if (temp <= 0.8) {
                iconEl.textContent = '🎨';
            } else {
                iconEl.textContent = '🌟';
            }
        }
    }

    setupTechniqueBuilders() {
        // Initialize first technique as active
        this.switchTechnique('zero-shot');
        
        // Setup auto-updating for multi-artifact builders
        this.setupMultiArtifactListeners();
    }
    
    setupMultiArtifactListeners() {
        // Few-Shot listeners
        document.addEventListener('input', (e) => {
            if (e.target.matches('#fewShotExamples .example-input, #fewShotTask')) {
                this.updateFewShotPrompt();
            }
            if (e.target.matches('#chainThoughtSteps .step-input, #chainThoughtFinal')) {
                this.updateChainThoughtPrompt();
            }
            if (e.target.matches('#rolePlayRole, #rolePlayContext, #rolePlayTask, #rolePlayAudience')) {
                this.updateRolePlayPrompt();
            }
            if (e.target.matches('.structured-container .structure-input')) {
                this.updateStructuredPrompt();
            }
        });

        // Setup dropdown click handlers
        document.addEventListener('click', (e) => {
            // Handle dropdown item clicks
            if (e.target.closest('.dropdown-item:not(.disabled)')) {
                const item = e.target.closest('.dropdown-item');
                const structureType = item.getAttribute('data-structure');
                if (structureType) {
                    this.addStructure(structureType);
                }
            }
            
            // Close dropdown when clicking outside
            if (!e.target.closest('.add-structure-control')) {
                const dropdown = document.getElementById('structureDropdown');
                const button = document.querySelector('.add-structure-btn');
                if (dropdown && dropdown.style.display === 'block') {
                    dropdown.style.display = 'none';
                    button?.classList.remove('active');
                }
            }
        });

        // Initialize structured prompt with auto-resize
        this.initializeStructuredBuilder();
    }

    initializeStructuredBuilder() {
        // Ensure the dynamic structures container exists
        const container = document.getElementById('dynamicStructures');
        if (!container) {
            return;
        }

        // Clear any existing content and start fresh
        container.innerHTML = '';

        // Always start with a Subject structure (minimum required)
        this.addStructure('subject');

        // Setup auto-resize for existing textareas
        const existingTextareas = document.querySelectorAll('.structured-container .auto-resize');
        existingTextareas.forEach(textarea => {
            this.setupAutoResize(textarea);
        });

        // Update initial dropdown state
        setTimeout(() => {
            this.updateDropdownOptions();
        }, 100);

        // Initialize with empty prompt display
        this.updateStructuredPrompt();
    }

    setupPromptGrading() {
        // Manual grading only - no automatic grading to avoid rate limits
        // Prompt grading setup
    }

    async testPrompt(textareaId, technique) {
        const textarea = document.getElementById(textareaId);
        if (!textarea) return;
        
        const prompt = textarea.value.trim();
        if (!prompt) {
            this.showNotification('Please enter a prompt to test', 'warning');
            return;
        }

        // Find the test button (it's the button after the textarea)
        const button = textarea.parentElement.querySelector('button');
        if (!button) return;

        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
        button.disabled = true;

        try {
            const grade = await this.calculatePromptGradeWithRetry(prompt, technique);
            this.displayGrade(grade, textareaId);
            this.showNotification(`Prompt tested! Score: ${grade.score}/10 - ${grade.quality}`, 'success');
        } catch (error) {
            this.showNotification('Testing failed - using local evaluation', 'warning');
            
            // Fallback to local grading
            const localScore = this.getLocalScore(prompt);
            const localFeedback = this.getLocalFeedback(prompt, technique);
            
            this.displayGrade({
                score: localScore,
                feedback: `[Local Mode - API Failed] ${localFeedback}`,
                color: this.getGradeColor(localScore),
                quality: this.getQualityText(localScore)
            }, textareaId);
        } finally {
            // Restore button
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    async calculatePromptGradeWithRetry(prompt, technique, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Add delay between attempts to respect rate limits
                if (attempt > 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                }
                
                const result = await this.calculatePromptGradeAdvanced(prompt, technique);
                return result;
                
            } catch (error) {
                lastError = error;
                
                // If it's a rate limit error, wait longer
                if (error.message.includes('429') || error.message.includes('rate limit')) {
                    await new Promise(resolve => setTimeout(resolve, 5000 * attempt));
                }
            }
        }
        
        throw lastError;
    }

    async calculatePromptGradeAdvanced(prompt, technique) {
        // Create a concise grading prompt with better user-agent handling
        const gradingInstruction = `Grade this ${technique} prompt (1-10 scale, be strict):

"${prompt}"

${technique} requires: ${this.getSimplifiedGuidelines(technique)}

Score strictly: 1-2=awful, 3-4=poor, 5-6=basic, 7=decent, 8=good, 9=excellent, 10=perfect.

Respond JSON only: {"score": 5, "feedback": "Add more details about X"}`;

        try {
            // Use fetch with better headers to avoid rate limiting
            const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(gradingInstruction)}?json=true`, {
                method: 'GET',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/plain, */*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const responseText = await response.text();
            
            // Check for error responses
            if (responseText.includes('"error"') && responseText.includes('429')) {
                throw new Error('Rate limit exceeded - please wait before testing again');
            }
            
            let gradeData;
            try {
                gradeData = JSON.parse(responseText);
                
                // Check if it's an error response
                if (gradeData.error) {
                    throw new Error(gradeData.error);
                }
            } catch (parseError) {
                gradeData = this.extractGradeFromText(responseText, prompt);
            }
            
            // Validate and clean the response
            let finalScore = gradeData.score;
            let finalFeedback = gradeData.feedback;
            let isLocalFallback = false;
            
            if (!finalScore || finalScore < 1 || finalScore > 10) {
                finalScore = this.getLocalScore(prompt);
                isLocalFallback = true;
            }
            
            if (!finalFeedback || finalFeedback.trim() === '') {
                finalFeedback = this.getLocalFeedback(prompt, technique);
                isLocalFallback = true;
            }
            
            if (isLocalFallback) {
                finalFeedback = `[Local Mode] ${finalFeedback}`;
            }
            
            return {
                score: Math.min(10, Math.max(1, finalScore)),
                feedback: finalFeedback,
                color: this.getGradeColor(finalScore),
                quality: this.getQualityText(finalScore)
            };
            
        } catch (error) {
            throw error;
        }
    }

    async gradePrompt(prompt, technique, inputId) {
        if (!prompt.trim()) {
            this.hideGradeDisplay(inputId);
            return;
        }

        try {
            const grade = await this.calculatePromptGrade(prompt, technique);
            this.displayGrade(grade, inputId);
        } catch (error) {
            // Use local fallback system instead of error message
            const fallbackScore = this.getLocalScore(prompt);
            const fallbackFeedback = this.getLocalFeedback(prompt, technique);
            
            this.displayGrade({
                score: fallbackScore,
                feedback: `[Local Mode - Function Failed] ${fallbackFeedback}`,
                color: this.getGradeColor(fallbackScore),
                quality: this.getQualityText(fallbackScore)
            }, inputId);
        }
    }

    async calculatePromptGrade(prompt, technique) {
        // Create a concise grading prompt to avoid rate limits
        const gradingInstruction = `Grade this ${technique} prompt (1-10 scale, be strict):

"${prompt}"

${technique} requires: ${this.getSimplifiedGuidelines(technique)}

Score strictly: 1-2=awful, 3-4=poor, 5-6=basic, 7=decent, 8=good, 9=excellent, 10=perfect.

Respond JSON only: {"score": 5, "feedback": "Add more details about X"}`;

        try {
            const response = await fetch(`https://text.pollinations.ai/${encodeURIComponent(gradingInstruction)}?model=openai&json=true&private=true`);
            const responseText = await response.text();
            
            let gradeData;
            try {
                // Try to parse as JSON first
                gradeData = JSON.parse(responseText);
            } catch (parseError) {
                // If JSON parsing fails, try to extract data from text response
                gradeData = this.extractGradeFromText(responseText, prompt);
            }
            
            // Always ensure we have valid feedback
            let finalScore = gradeData.score;
            let finalFeedback = gradeData.feedback;
            let isLocalFallback = false;
            
            // Check if we need local fallbacks
            if (!finalScore || finalScore < 1 || finalScore > 10) {
                finalScore = this.getLocalScore(prompt);
                isLocalFallback = true;
            }
            
            if (!finalFeedback || finalFeedback.trim() === '') {
                finalFeedback = this.getLocalFeedback(prompt, technique);
                isLocalFallback = true;
            }
            
            if (isLocalFallback) {
                finalFeedback = `[Local Mode] ${finalFeedback}`;
            }
            
            return {
                score: Math.min(10, Math.max(1, finalScore)),
                feedback: finalFeedback,
                color: this.getGradeColor(finalScore),
                quality: this.getQualityText(finalScore)
            };
            
        } catch (error) {
            throw error;
        }
    }

    extractGradeFromText(text, prompt) {
        // Try to extract score and feedback from non-JSON responses
        
        const scoreMatch = text.match(/(?:"score":\s*(\d+))|(?:score[":]\s*(\d+))|(?:(\d+)\/10)|(?:rating[":]\s*(\d+))/i);
        const score = scoreMatch ? parseInt(scoreMatch[1] || scoreMatch[2] || scoreMatch[3] || scoreMatch[4]) || 5 : 5;
        
        // Try to extract feedback
        let feedback = '';
        const feedbackMatch = text.match(/(?:"feedback":\s*"([^"]+)")|(?:feedback[":]\s*([^}\n]+))/i);
        
        if (feedbackMatch) {
            feedback = (feedbackMatch[1] || feedbackMatch[2] || '').trim();
            } else {
            // Generate basic feedback if none found
            feedback = this.generateBasicFeedback(text, prompt);
        }
        
        // Ensure we have some feedback
        if (!feedback) {
            feedback = this.getLocalFeedback(prompt, 'general');
        }
        
        return {
            score: Math.min(10, Math.max(1, score)),
            feedback: feedback
        };
    }

    generateBasicFeedback(text, prompt) {
        // Generate specific feedback based on the actual prompt content
        const promptLower = prompt.toLowerCase();
        const textLower = text.toLowerCase();
        
        // Check prompt length and content
        if (prompt.trim().split(' ').length <= 2) {
            return 'Your prompt is too short - add specific details about appearance, style, and setting';
        }
        
        if (promptLower === 'dragon' || promptLower === 'cat' || promptLower === 'house') {
            return 'Single word prompts are inadequate - describe what KIND of dragon, its appearance, setting, and artistic style';
        }
        
        if (!promptLower.includes('style') && !promptLower.includes('art') && !promptLower.includes('photo')) {
            return 'Add artistic style specifications like "digital art", "oil painting", or "photorealistic"';
        }
        
        if (textLower.includes('short') || textLower.includes('brief')) {
            return 'Add more descriptive details about colors, lighting, composition, and technical quality';
        }
        
        if (textLower.includes('vague') || textLower.includes('unclear')) {
            return 'Be more specific about visual elements - add details about colors, textures, and environment';
        }
        
        if (textLower.includes('missing') || textLower.includes('lack')) {
            return 'Include technical specifications like resolution, lighting conditions, and camera details';
        }
        
        return 'Expand your prompt with specific visual details, artistic style, and technical quality terms';
    }

    getLocalScore(prompt) {
        // Local scoring system that works immediately
        const words = prompt.trim().split(/\s+/);
        const wordCount = words.length;
        const promptLower = prompt.toLowerCase();
        
        // Single word prompts get 1
        if (wordCount === 1) return 1;
        
        // Very short prompts get 2-3
        if (wordCount <= 3) return 2;
        if (wordCount <= 5) return 3;
        
        // Start with base score based on length
        let qualityScore = 4;
        if (wordCount >= 8) qualityScore = 5; // Decent length
        if (wordCount >= 12) qualityScore = 6; // Good length
        if (wordCount >= 18) qualityScore = 7; // Very good length
        
        // Style indicators (+1)
        if (promptLower.includes('style') || promptLower.includes('art') || 
            promptLower.includes('photo') || promptLower.includes('painting') ||
            promptLower.includes('digital') || promptLower.includes('artwork')) {
            qualityScore++;
        }
        
        // Technical terms (+1)
        if (promptLower.includes('resolution') || promptLower.includes('detailed') || 
            promptLower.includes('quality') || promptLower.includes('lighting') ||
            promptLower.includes('professional') || promptLower.includes('cinematic') ||
            promptLower.includes('high detail')) {
            qualityScore++;
        }
        
        // Color/visual descriptions (+1)
        if (promptLower.includes('color') || promptLower.includes('blue') || 
            promptLower.includes('red') || promptLower.includes('bright') ||
            promptLower.includes('dark') || promptLower.includes('golden') ||
            promptLower.includes('emerald') || promptLower.includes('silver') ||
            promptLower.includes('scales') || promptLower.includes('fire')) {
            qualityScore++;
        }
        
        // Setting/environment descriptions (+1)
        if (promptLower.includes('forest') || promptLower.includes('setting') ||
            promptLower.includes('background') || promptLower.includes('environment') ||
            promptLower.includes('landscape') || promptLower.includes('mystical') ||
            promptLower.includes('ancient') || promptLower.includes('floating')) {
            qualityScore++;
        }
        
        // Subject descriptors (+1)
        if (promptLower.includes('majestic') || promptLower.includes('breathtaking') ||
            promptLower.includes('elegant') || promptLower.includes('ancient') ||
            promptLower.includes('wise') || promptLower.includes('ethereal') ||
            promptLower.includes('professional') || promptLower.includes('award')) {
            qualityScore++;
        }
        
        // Really long detailed prompts get bonus
        if (wordCount > 30) qualityScore++;
        if (wordCount > 50) qualityScore++;
        
        return Math.min(9, qualityScore); // Cap at 9, reserve 10 for LLM-verified exceptional prompts
    }

    getLocalFeedback(prompt, technique) {
        // Local feedback system that always works
        const words = prompt.trim().split(/\s+/);
        const wordCount = words.length;
        const promptLower = prompt.toLowerCase();
        
        if (wordCount === 1) {
            return `Single word "${prompt}" is completely inadequate - describe what KIND of ${prompt}, its appearance, setting, and artistic style`;
        }
        
        if (wordCount <= 3) {
            return 'Your prompt is too short - add specific details about colors, lighting, composition, and artistic style';
        }
        
        if (wordCount <= 5) {
            return 'Add more visual details like colors, textures, lighting conditions, and technical specifications';
        }
        
        // Check what's missing
        const missing = [];
        
        if (!promptLower.includes('style') && !promptLower.includes('art') && !promptLower.includes('photo')) {
            missing.push('artistic style (e.g., "digital art", "oil painting", "photorealistic")');
        }
        
        if (!promptLower.match(/\b(color|blue|red|green|golden|bright|dark|vibrant)\b/)) {
            missing.push('color descriptions');
        }
        
        if (!promptLower.match(/\b(detailed|quality|resolution|lighting|composition)\b/)) {
            missing.push('technical quality terms');
        }
        
        if (missing.length > 0) {
            return `Add ${missing.join(', ')} to improve your prompt quality`;
        }
        
        if (wordCount > 15) {
            return 'Good detail level! Consider adding specific artist references or technical camera settings for higher scores';
        }
        
        return 'Expand with more specific visual details, professional terminology, and technical specifications';
    }

    getTechniqueGuidelines(technique) {
        const guidelines = {
            'zero-shot': `
ZERO-SHOT REQUIREMENTS (Must have ALL for 7+):
• SUBJECT: Specific, detailed description (not just "dragon" - what KIND of dragon?)
• VISUAL DETAILS: Colors, textures, materials, lighting conditions, atmosphere
• TECHNICAL SPECS: Resolution, quality level, rendering style, camera details
• COMPOSITION: Perspective, framing, focus, depth of field
• STYLE: Specific artistic movement, artist reference, or aesthetic direction
• CONTEXT: Setting, environment, background, mood, time of day
FAILING EXAMPLES: "dragon", "house", "car" (score 1-2)
MINIMUM PASSING: Must have at least subject + 3 visual details + style (score 7)`,

            'few-shot': `
FEW-SHOT REQUIREMENTS (Must have ALL for 7+):
• MULTIPLE EXAMPLES: At least 2-3 numbered examples showing clear pattern
• CONSISTENT FORMAT: Each example follows identical structure/template
• PATTERN DEMONSTRATION: Shows relationship between input and desired output
• CLEAR PROGRESSION: Examples build understanding of the task
• FINAL REQUEST: Explicit ask following the established pattern
• PROPER STRUCTURE: "1. Example... 2. Example... Now create: [request]"
FAILING EXAMPLES: Single example, no pattern, inconsistent format (score 1-4)
MINIMUM PASSING: 2+ consistent examples + clear final request (score 7)`,

            'chain-thought': `
CHAIN-OF-THOUGHT REQUIREMENTS (Must have ALL for 7+):
• EXPLICIT REASONING: "Let me think step by step...", "First I need to..."
• LOGICAL SEQUENCE: Clear step 1, 2, 3... progression with reasoning
• CAUSE-EFFECT CONNECTIONS: "Because X, therefore Y", "Since A, then B"
• DECISION POINTS: "I should consider...", "The best approach is..."
• PROBLEM BREAKDOWN: Complex task split into manageable steps
• THINKING PROCESS: Shows work, not just final answer
FAILING EXAMPLES: Direct requests, no reasoning, no steps (score 1-4)
MINIMUM PASSING: Clear steps + reasoning connections + explicit thinking (score 7)`,

            'role-play': `
ROLE-PLAYING REQUIREMENTS (Must have ALL for 7+):
• CLEAR ROLE DEFINITION: "You are a [specific expert]", "As a [professional]..."
• EXPERTISE LEVEL: Specify knowledge depth, years of experience, specialization
• CONTEXT SETTING: Situation, scenario, constraints, goals
• PROFESSIONAL LANGUAGE: Industry terminology, appropriate tone
• SPECIFIC TASK: Clear instructions relevant to the role
• PERSONA CONSISTENCY: Maintain character throughout interaction
FAILING EXAMPLES: Generic "as an artist", no context, vague roles (score 1-4)
MINIMUM PASSING: Specific role + expertise + context + clear task (score 7)`,

            'structured': `
STRUCTURED PROMPTING REQUIREMENTS (Must have ALL for 7+):
• ORGANIZED SECTIONS: Clear headers like SUBJECT:, STYLE:, LIGHTING:, etc.
• COMPLETE INFORMATION: Each section fully filled with specific details
• LOGICAL HIERARCHY: Information flows logically from general to specific
• COMPREHENSIVE COVERAGE: All aspects of desired output addressed
• PROFESSIONAL FORMAT: Clean, organized, easy to parse
• SECTION CONSISTENCY: Similar detail level across all sections
FAILING EXAMPLES: No sections, incomplete info, poor organization (score 1-4)
MINIMUM PASSING: 4+ complete sections + logical structure + comprehensive coverage (score 7)`
        };

        return guidelines[technique] || 'Evaluate overall prompt quality, specificity, and technique implementation';
    }

    getSimplifiedGuidelines(technique) {
        const simple = {
            'zero-shot': 'specific subject, visual details, style, lighting, quality terms',
            'few-shot': 'multiple examples (1. 2. 3.), consistent pattern, final request',
            'chain-thought': 'step-by-step reasoning, "First... then... because..."',
            'role-play': 'specific expert role, context, professional task',
            'structured': 'organized sections (SUBJECT:, STYLE:, etc.)'
        };
        return simple[technique] || 'clear, specific, detailed prompt';
    }



    getGradeColor(score) {
        if (score >= 8) return '#22c55e'; // Green
        if (score >= 6) return '#eab308'; // Yellow
        if (score >= 4) return '#f97316'; // Orange
        return '#ef4444'; // Red
    }

    getQualityText(score) {
        if (score >= 9) return 'Excellent';
        if (score >= 8) return 'Very Good';
        if (score >= 7) return 'Good';
        if (score >= 6) return 'Fair';
        if (score >= 4) return 'Needs Work';
        return 'Poor';
    }

    displayGrade(grade, inputId) {
        const textarea = document.getElementById(inputId);
        if (!textarea) return;

        // Find or create score display inside textarea
        let scoreEl = textarea.parentNode.querySelector('.grade-score-overlay');
        if (!scoreEl) {
            scoreEl = document.createElement('div');
            scoreEl.className = 'grade-score-overlay';
            textarea.parentNode.style.position = 'relative';
            textarea.parentNode.appendChild(scoreEl);
        }

        // Find or create recommendation display below textarea
        let recommendEl = textarea.parentNode.querySelector('.grade-recommendation');
        if (!recommendEl) {
            recommendEl = document.createElement('div');
            recommendEl.className = 'grade-recommendation';
            textarea.parentNode.appendChild(recommendEl);
        }

        // Update score overlay (top-right corner of textarea)
        scoreEl.innerHTML = `
            <span class="grade-number" style="color: ${grade.color}">${grade.score}</span>
            <span class="grade-text">/10</span>
        `;
        scoreEl.style.display = 'flex';

        // Update recommendation below textarea
        recommendEl.innerHTML = `
            <div class="grade-feedback">
                <strong>💡 ${grade.quality}:</strong> ${grade.feedback}
            </div>
        `;
        recommendEl.style.display = grade.feedback ? 'block' : 'none';
    }

    hideGradeDisplay(inputId) {
        const gradeEl = document.getElementById(`grade-${inputId}`);
        if (gradeEl) {
            gradeEl.style.display = 'none';
        }
    }



    showSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-section="${section}"]`)?.classList.add('active');

        // Update sections
        document.querySelectorAll('.lab-section').forEach(sec => sec.classList.remove('active'));
        document.getElementById(`${section}-section`)?.classList.add('active');

        // Auto-load database submissions when gallery is accessed
        if (section === 'gallery') {
            this.loadDatabaseSubmissions();
        }

        // Update progress
        this.updateProgressTracker();
    }

    switchTechnique(technique) {
        // Update tabs
        document.querySelectorAll('.technique-tab').forEach(tab => tab.classList.remove('active'));
        document.querySelector(`[data-technique="${technique}"]`)?.classList.add('active');

        // Update builders
        document.querySelectorAll('.technique-builder').forEach(builder => builder.classList.remove('active'));
        document.getElementById(`${technique}-build`)?.classList.add('active');
    }

    switchAssignmentTechnique(technique) {
        // Extract the base technique name (remove -assignment suffix)
        const baseTechnique = technique.replace('-assignment', '');
        this.assignmentTechnique = baseTechnique;

        // Update assignment tabs only
        const assignmentSection = document.getElementById('assignment-section');
        if (assignmentSection) {
            assignmentSection.querySelectorAll('.technique-tab').forEach(tab => tab.classList.remove('active'));
            assignmentSection.querySelector(`[data-technique="${technique}"]`)?.classList.add('active');
        }

        // Assignment technique changed
    }

    updateProgressTracker() {
        document.querySelectorAll('.progress-indicator').forEach(indicator => {
            const stepType = indicator.dataset.step;
            if (this.progress[stepType]) {
                indicator.classList.add('completed');
            }
        });
    }

    // Enhanced prompt engineering for PHOTOREALISTIC generation
    enhancePromptWithParameters(basePrompt, temp, topP, topK) {
        // Professional photography modifiers for maximum realism
        const tempModifiers = {
            0.0: 'ultra-sharp focus, clinical precision, technical documentation quality, zero artistic interpretation',
            0.1: 'professional studio photography, controlled lighting, minimal variation, commercial grade quality',
            0.2: 'high-end portrait photography, precise technical execution, professional equipment quality',
            0.3: 'premium commercial photography, refined technical control, professional studio standards',
            0.4: 'expert photographer technique, balanced technical precision, award-winning commercial quality',
            0.5: 'master photographer approach, optimal technical balance, gallery-worthy photographic excellence',
            0.6: 'creative professional photography, artistic technical mastery, museum-quality photographic art',
            0.7: 'visionary photographer style, innovative technical execution, internationally acclaimed quality',
            0.8: 'groundbreaking photographic technique, cutting-edge technical innovation, legendary photographer quality',
            0.9: 'revolutionary photographic vision, unprecedented technical mastery, history-making photography',
            1.0: 'transcendent photographic artistry, impossible technical perfection, reality-defying photographic quality'
        };

        const topPModifiers = {
            0.0: 'basic camera terminology, standard photographic language, conventional technical descriptions',
            0.1: 'professional photography vocabulary, technical precision, industry-standard terminology',
            0.2: 'advanced photographic language, sophisticated technical descriptions, expert terminology',
            0.3: 'master photographer vocabulary, comprehensive technical language, professional excellence',
            0.4: 'virtuoso photographic terminology, elaborate technical descriptions, artistic mastery language',
            0.5: 'legendary photographer vocabulary, transcendent technical language, poetic precision',
            0.6: 'innovative photographic language, revolutionary technical descriptions, visionary terminology',
            0.7: 'groundbreaking photography vocabulary, cutting-edge technical language, paradigm-shifting descriptions',
            0.8: 'transcendent photographic terminology, reality-bending technical language, impossible precision',
            0.9: 'otherworldly photography vocabulary, divine technical descriptions, cosmic photographic language',
            1.0: 'infinite photographic possibilities, unlimited technical vocabulary, universal visual language'
        };

        const topKModifiers = {
            10: 'clean minimalist photography, essential elements only, pure photographic simplicity',
            20: 'refined minimalist composition, selective focus, elegant photographic restraint',
            30: 'sophisticated simplicity, precise photographic elements, refined technical clarity',
            40: 'balanced photographic complexity, professional technical detail, structured visual hierarchy',
            50: 'rich photographic detail, comprehensive technical elements, layered visual sophistication',
            60: 'highly detailed photography, complex technical composition, intricate visual layering',
            70: 'extremely detailed photographic work, elaborate technical composition, maximum visual complexity',
            80: 'hyperdetailed photography, overwhelming technical precision, dense photographic information',
            90: 'impossibly detailed photographic mastery, transcendent technical complexity, reality-surpassing detail',
            100: 'infinite photographic detail, absolute technical perfection, universe-encompassing visual complexity'
        };

        // Find exact parameter matches
        const tempKey = temp.toFixed(1);
        const topPKey = topP.toFixed(1);
        const topKKey = Math.round(topK / 10) * 10;

        const tempMod = tempModifiers[tempKey] || tempModifiers[0.5];
        const topPMod = topPModifiers[topPKey] || topPModifiers[0.5];
        const topKMod = topKModifiers[topKKey] || topKModifiers[50];

        // Photography-focused seed generation
        const tempSeed = Math.floor(temp * 12347);
        const topPSeed = Math.floor(topP * 7919);
        const topKSeed = Math.floor(topK * 337);
        const microSeed = Math.floor((temp * 100 + topP * 100 + topK) * 1291);
        
        // Professional photography enhancement based on parameters
        let photographicEnhancement = '';
        
        // Temperature-based photographic style
        if (temp <= 0.3) {
            photographicEnhancement += ', shot with professional DSLR camera, studio lighting setup, commercial photography quality, crystal clear focus, professional color grading';
        } else if (temp <= 0.6) {
            photographicEnhancement += ', captured with high-end camera equipment, dramatic professional lighting, award-winning photography composition, cinematic quality, perfect exposure';
        } else {
            photographicEnhancement += ', masterpiece photography, legendary photographer technique, museum-quality composition, revolutionary lighting setup, impossible photographic perfection';
        }

        // Top-P based technical specifications
        if (topP <= 0.5) {
            photographicEnhancement += ', 85mm portrait lens, f/2.8 aperture, professional studio backdrop, controlled lighting environment';
        } else if (topP <= 0.8) {
            photographicEnhancement += ', premium lens optics, perfect depth of field, professional color correction, studio-grade lighting equipment, flawless composition';
        } else {
            photographicEnhancement += ', cutting-edge camera technology, impossible optical perfection, divine lighting conditions, transcendent photographic clarity';
        }

        // Top-K based detail level
        if (topK <= 40) {
            photographicEnhancement += ', clean professional photography, sharp focus, minimal post-processing, natural realistic colors';
        } else if (topK <= 70) {
            photographicEnhancement += ', hyperrealistic detail capture, every texture visible, professional retouching, magazine-quality finish';
        } else {
            photographicEnhancement += ', impossible level of detail, every pore and texture captured, supernatural clarity, beyond human vision quality';
        }

        // Core photorealism keywords that MUST be included
        const coreRealism = ', photorealistic, hyperrealistic, ultra-detailed, high resolution, professional photography, studio quality, 8K resolution, perfect lighting, crystal clear, sharp focus, realistic skin texture, natural colors, professional color grading';

        // Combine everything for maximum realism
        return `${basePrompt}${coreRealism}${photographicEnhancement}, technical execution: ${tempMod}, photographic approach: ${topPMod}, detail level: ${topKMod}, photo-seed:${tempSeed}-${topPSeed}-${topKSeed}-${microSeed}`;
    }

    generateParameterSeed(temp, topP, topK) {
        const baseTime = Date.now();
        const parameterInfluence = Math.floor(temp * 1000 + topP * 100 + topK);
        return baseTime + parameterInfluence;
    }

    // Multi-Artifact Builder Methods
    addExample(technique) {
        const container = document.getElementById(`${technique}Examples`);
        const examples = container.querySelectorAll('.example-item');
        const newIndex = examples.length;
        
        const newExample = document.createElement('div');
        newExample.className = 'example-item';
        newExample.dataset.index = newIndex;
        newExample.innerHTML = `
            <div class="example-item-header">
                <label>Example ${newIndex + 1}</label>
                <button class="remove-example" onclick="modelBuilder.removeExample('${technique}', ${newIndex})" title="Remove this example">
                    <i class="fas fa-times"></i>
                </button>
            </div>
                            <textarea class="example-input auto-resize" placeholder="Add another example following the same pattern"></textarea>
        `;
        
        container.appendChild(newExample);
        
        // Setup auto-resize for the new textarea
        const newTextarea = newExample.querySelector('textarea');
        if (newTextarea) {
            this.setupAutoResize(newTextarea);
        }
        
        this.updateFewShotPrompt();
    }
    
    removeExample(technique, index) {
        const container = document.getElementById(`${technique}Examples`);
        const examples = container.querySelectorAll('.example-item');
        
        if (examples.length <= 2) {
            this.showNotification('You need at least 2 examples for few-shot prompting!', 'warning');
            return;
        }
        
        const itemToRemove = container.querySelector(`[data-index="${index}"]`);
        if (itemToRemove) {
            itemToRemove.remove();
            this.renumberItems(container, 'example-item', 'Example');
            this.updateFewShotPrompt();
        }
    }
    
    addStep(technique) {
        const container = document.getElementById(`${technique}Steps`);
        const steps = container.querySelectorAll('.step-item');
        const newIndex = steps.length;
        
        const newStep = document.createElement('div');
        newStep.className = 'step-item';
        newStep.dataset.index = newIndex;
        newStep.innerHTML = `
            <div class="step-item-header">
                <label>Step ${newIndex + 1}</label>
                <button class="remove-step" onclick="modelBuilder.removeStep('${technique}', ${newIndex})" title="Remove this step">
                    <i class="fas fa-times"></i>
                </button>
            </div>
                            <textarea class="step-input auto-resize" placeholder="Add another logical step in your reasoning process"></textarea>
        `;
        
        container.appendChild(newStep);
        
        // Setup auto-resize for the new textarea
        const newTextarea = newStep.querySelector('textarea');
        if (newTextarea) {
            this.setupAutoResize(newTextarea);
        }
        
        this.updateChainThoughtPrompt();
    }
    
    removeStep(technique, index) {
        const container = document.getElementById(`${technique}Steps`);
        const steps = container.querySelectorAll('.step-item');
        
        if (steps.length <= 2) {
            this.showNotification('You need at least 2 steps for chain-of-thought reasoning!', 'warning');
            return;
        }
        
        const itemToRemove = container.querySelector(`[data-index="${index}"]`);
        if (itemToRemove) {
            itemToRemove.remove();
            this.renumberItems(container, 'step-item', 'Step');
            this.updateChainThoughtPrompt();
        }
    }
    
    renumberItems(container, itemClass, labelPrefix) {
        const items = container.querySelectorAll(`.${itemClass}`);
        items.forEach((item, index) => {
            item.dataset.index = index;
            const label = item.querySelector('label');
            const button = item.querySelector('.remove-example, .remove-step');
            if (label) label.textContent = `${labelPrefix} ${index + 1}`;
            if (button) button.setAttribute('onclick', `modelBuilder.${itemClass.includes('example') ? 'removeExample' : 'removeStep'}('${container.id.replace('Examples', '').replace('Steps', '')}', ${index})`);
        });
    }
    
    updateFewShotPrompt() {
        const examples = document.querySelectorAll('#fewShotExamples .example-input');
        const task = document.getElementById('fewShotTask').value.trim();
        const display = document.getElementById('fewShotFinalPrompt');
        
        // Build anti-collage few-shot prompt with explicit single subject focus
        let prompt = 'IMPORTANT: Create ONE single image with ONE individual subject only. Do NOT create a collage or multiple panels.\n\n';
        prompt += 'Style Reference Examples (for learning patterns only):\n\n';
        
        examples.forEach((example, index) => {
            const text = example.value.trim();
            if (text) {
                prompt += `Style Pattern ${index + 1}:\n${text}\n\n`;
            }
        });
        
        if (examples.length > 0) {
            prompt += 'SINGLE IMAGE REQUIREMENT: Learn the professional composition style, lighting approach, and quality standards from these examples, but create ONLY ONE unified image with ONE subject.\n\n';
        }
        
        if (task) {
            prompt += `CREATE ONE SINGLE IMAGE: ${task}\n\nIMPORTANT: Generate ONE cohesive professional portrait, NOT a multi-panel collage or grid of examples.`;
        } else {
            prompt += 'CREATE ONE SINGLE IMAGE: [your specific request]\n\nIMPORTANT: Generate ONE cohesive professional portrait, NOT a multi-panel collage or grid of examples.';
        }
        
        display.textContent = prompt;
    }
    
    updateChainThoughtPrompt() {
        const steps = document.querySelectorAll('#chainThoughtSteps .step-input');
        const final = document.getElementById('chainThoughtFinal').value.trim();
        const display = document.getElementById('chainThoughtFinalPrompt');
        
        let prompt = "Let's think through this step by step:\n\n";
        steps.forEach((step, index) => {
            const text = step.value.trim();
            if (text) {
                prompt += `Step ${index + 1}: ${text}\n`;
            }
        });
        
        prompt += '\n';
        if (final) {
            prompt += final;
        } else {
            prompt += 'Result: Create a [detailed description combining all steps above]';
        }
        
        display.textContent = prompt;
    }
    
    updateRolePlayPrompt() {
        const role = document.getElementById('rolePlayRole').value.trim();
        const context = document.getElementById('rolePlayContext').value.trim();
        const task = document.getElementById('rolePlayTask').value.trim();
        const audience = document.getElementById('rolePlayAudience').value.trim();
        const display = document.getElementById('rolePlayFinalPrompt');
        
        let prompt = '';
        
        if (role) {
            prompt += `You are a ${role}. `;
        } else {
            prompt += 'You are a [specific professional role]. ';
        }
        
        if (context) {
            prompt += `${context} `;
        }
        
        if (task) {
            prompt += `${task}`;
        } else {
            prompt += '[Specific task and requirements]';
        }
        
        if (audience) {
            prompt += ` ${audience}`;
        }
        
        display.textContent = prompt;
    }
    
    // Structure definitions for the dynamic builder
    getStructureDefinitions() {
        return {
            subject: {
                icon: 'fas fa-user',
                title: 'SUBJECT',
                placeholder: 'Main subject/character (e.g., "Professional data engineer with confident expression")'
            },
            style: {
                icon: 'fas fa-palette',
                title: 'STYLE',
                placeholder: 'Art or photography style (e.g., "Commercial photography, documentary style")'
            },
            composition: {
                icon: 'fas fa-crop',
                title: 'COMPOSITION',
                placeholder: 'Framing and layout (e.g., "Professional headshot, rule of thirds")'
            },
            lighting: {
                icon: 'fas fa-lightbulb',
                title: 'LIGHTING',
                placeholder: 'Light setup and mood (e.g., "Natural office lighting, professional setup")'
            },
            mood: {
                icon: 'fas fa-smile',
                title: 'MOOD',
                placeholder: 'Emotional atmosphere (e.g., "Confident, professional, approachable")'
            },
            details: {
                icon: 'fas fa-search',
                title: 'DETAILS',
                placeholder: 'Specific elements (e.g., "Business attire, modern workspace background")'
            },
            technical: {
                icon: 'fas fa-cog',
                title: 'TECHNICAL',
                placeholder: 'Camera specifications (e.g., "Shot with 85mm lens, commercial quality")'
            },
            colors: {
                icon: 'fas fa-fill-drip',
                title: 'COLORS',
                placeholder: 'Color palette and scheme (e.g., "Professional blues and grays, modern colors")'
            },
            background: {
                icon: 'fas fa-mountain',
                title: 'BACKGROUND',
                placeholder: 'Scene environment (e.g., "Modern office environment, city skyline")'
            },
            perspective: {
                icon: 'fas fa-eye',
                title: 'PERSPECTIVE',
                placeholder: 'Viewing angle (e.g., "Eye-level perspective, straight-on view")'
            },
            materials: {
                icon: 'fas fa-cube',
                title: 'MATERIALS',
                placeholder: 'Textures and surfaces (e.g., "Natural skin texture, fabric details")'
            },
            additional: {
                icon: 'fas fa-plus-circle',
                title: 'ADDITIONAL',
                placeholder: 'Extra specifications or requirements'
            }
        };
    }

    // Toggle dropdown visibility
    toggleStructureDropdown() {
        const dropdown = document.getElementById('structureDropdown');
        const button = document.querySelector('.add-structure-btn');
        
        if (dropdown.style.display === 'none' || !dropdown.style.display) {
            dropdown.style.display = 'block';
            button.classList.add('active');
            this.updateDropdownOptions();
        } else {
            dropdown.style.display = 'none';
            button.classList.remove('active');
        }
    }

    // Update dropdown to show only available structures
    updateDropdownOptions() {
        const dropdown = document.getElementById('structureDropdown');
        const container = document.getElementById('dynamicStructures');
        const existingStructures = new Set();
        
        // Get currently added structures
        container.querySelectorAll('.structured-item').forEach(item => {
            const structure = item.getAttribute('data-structure');
            if (structure) {
                existingStructures.add(structure);
            }
        });

        // Update dropdown items
        dropdown.querySelectorAll('.dropdown-item').forEach(item => {
            const structure = item.getAttribute('data-structure');
            if (existingStructures.has(structure)) {
                item.classList.add('disabled');
            } else {
                item.classList.remove('disabled');
            }
        });
    }

    // Add a new structure
    addStructure(structureType) {
        const dropdown = document.getElementById('structureDropdown');
        const item = dropdown.querySelector(`[data-structure="${structureType}"]`);
        
        if (item.classList.contains('disabled')) {
            return; // Already added
        }

        const container = document.getElementById('dynamicStructures');
        const structures = this.getStructureDefinitions();
        const structure = structures[structureType];

        const structureHtml = `
            <div class="structured-item" data-structure="${structureType}">
                <div class="structured-header">
                    <h6><i class="${structure.icon}"></i> ${structure.title}</h6>
                    <button class="remove-structure-btn" onclick="modelBuilder.removeStructure('${structureType}')" title="Remove this structure">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <textarea id="structured${structureType.charAt(0).toUpperCase() + structureType.slice(1)}" 
                         class="structure-input auto-resize" 
                         placeholder="${structure.placeholder}" 
                         rows="2"></textarea>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', structureHtml);
        
        // Setup auto-resize for the new textarea
        const newTextarea = container.lastElementChild.querySelector('textarea');
        this.setupAutoResize(newTextarea);
        
        // Close dropdown and update
        this.toggleStructureDropdown();
        this.updateStructuredPrompt();
        
        // Focus on the new input
        setTimeout(() => newTextarea.focus(), 100);
    }

    // Remove a structure
    removeStructure(structureType) {
        const container = document.getElementById('dynamicStructures');
        const existingItems = container.querySelectorAll('.structured-item');
        
        // Prevent removing the last structure (minimum 1 required)
        if (existingItems.length <= 1) {
            this.showNotification('At least one structure is required for the structured prompt', 'warning');
            return;
        }
        
        const item = container.querySelector(`[data-structure="${structureType}"]`);
        
        if (item) {
            item.remove();
            this.updateStructuredPrompt();
            this.updateDropdownOptions();
        }
    }

    // Setup auto-resize functionality for textareas
    setupAutoResize(textarea) {
        const autoResize = () => {
            // Reset height to auto to get the real scroll height
            textarea.style.height = 'auto';
            textarea.style.overflow = 'hidden';
            
            const scrollHeight = textarea.scrollHeight;
            const minHeight = 60;
            const maxHeight = 300;
            const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
            
            textarea.style.height = newHeight + 'px';
            
            // Show scrollbar if content exceeds max height
            if (scrollHeight > maxHeight) {
                textarea.style.overflow = 'auto';
            } else {
                textarea.style.overflow = 'hidden';
            }
        };

        // Remove existing listeners to avoid duplicates
        textarea.removeEventListener('input', autoResize);
        textarea.removeEventListener('paste', autoResize);
        textarea.removeEventListener('keyup', autoResize);
        
        // Add event listeners
        textarea.addEventListener('input', autoResize);
        textarea.addEventListener('paste', () => {
            setTimeout(autoResize, 10);
        });
        
        // Also listen for keyup to catch any missed changes
        textarea.addEventListener('keyup', autoResize);
        
        // Initial resize with a small delay to ensure DOM is ready
        setTimeout(autoResize, 0);
    }

    // Initialize auto-resize for all textareas with auto-resize class
    initAllAutoResize() {
        const textareas = document.querySelectorAll('textarea.auto-resize, textarea.structure-input');
        textareas.forEach(textarea => {
            this.setupAutoResize(textarea);
            // Trigger initial resize to handle pre-filled content
            const event = new Event('input', { bubbles: true });
            textarea.dispatchEvent(event);
        });
    }

    // Updated structured prompt builder
    updateStructuredPrompt() {
        const container = document.getElementById('dynamicStructures');
        const display = document.getElementById('structuredFinalPrompt');
        const structures = this.getStructureDefinitions();
        
        let prompt = '';
        
        // Iterate through all added structures in order
        container.querySelectorAll('.structured-item').forEach(item => {
            const structureType = item.getAttribute('data-structure');
            const textarea = item.querySelector('textarea');
            const value = textarea ? textarea.value.trim() : '';
            
            if (value && structures[structureType]) {
                prompt += `${structures[structureType].title}: ${value}\n`;
            }
        });
        
        if (!prompt) {
            prompt = 'Add structures above to build your prompt...';
        }
        
        display.textContent = prompt;
    }
    
    // Get the final combined prompt for generation
    buildFinalPrompt(technique) {
        switch(technique) {
            case 'few-shot':
                return document.getElementById('fewShotFinalPrompt').textContent;
            case 'chain-thought':
                return document.getElementById('chainThoughtFinalPrompt').textContent;
            case 'role-play':
                return document.getElementById('rolePlayFinalPrompt').textContent;
            case 'structured':
                return document.getElementById('structuredFinalPrompt').textContent;
            default:
                // Zero-shot uses direct input
                return document.getElementById('zeroShotPrompt')?.value || '';
        }
    }

    async generateImage(technique) {
        // Get the final combined prompt
        const prompt = this.buildFinalPrompt(technique);
        
        if (!prompt.trim() || prompt.includes('[') || prompt === 'Your prompt will appear here as you build it...') {
            this.showNotification('Please complete your prompt components before generating', 'warning');
            return;
        }

        // Get parameter values based on technique
        let temp, topP, topK, selectedModel;
        
        if (technique === 'few-shot') {
            temp = parseFloat(document.getElementById('fewShotTemperature')?.value || 0.3);
            topP = parseFloat(document.getElementById('fewShotTopP')?.value || 0.9);
            topK = parseInt(document.getElementById('fewShotTopK')?.value || 70);
            // Force Turbo for Few-Shot regardless of user selection
            selectedModel = 'turbo';
        } else if (technique === 'chain-thought') {
            temp = parseFloat(document.getElementById('chainThoughtTemperature')?.value || 0.3);
            topP = parseFloat(document.getElementById('chainThoughtTopP')?.value || 0.9);
            topK = parseInt(document.getElementById('chainThoughtTopK')?.value || 70);
            selectedModel = document.getElementById('chainThoughtAiModel')?.value || 'flux';
        } else {
            // Zero-shot and others use default controls
            temp = parseFloat(document.getElementById('temperature')?.value || 0.3);
            topP = parseFloat(document.getElementById('topP')?.value || 0.9);
            topK = parseInt(document.getElementById('topK')?.value || 70);
            selectedModel = document.getElementById('aiModel')?.value || 'flux';
        }

        // Show loading
        const loadingEl = document.getElementById('buildLoading');
        const resultsEl = document.getElementById('buildResults');
        if (loadingEl) loadingEl.style.display = 'block';
        if (resultsEl) resultsEl.style.display = 'none';

        try {
            // Apply parameter-inspired prompt modifications
            const enhancedPrompt = this.enhancePromptWithParameters(prompt, temp, topP, topK);
            
            // Generate with parameter-influenced seed
            const seed = this.generateParameterSeed(temp, topP, topK);

            const encodedPrompt = encodeURIComponent(enhancedPrompt);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&model=${selectedModel}&nologo=true`;
            
            // Create a promise to check when image loads
            const img = new Image();
            img.onload = () => {
                // Display results
                if (loadingEl) loadingEl.style.display = 'none';
                if (resultsEl) resultsEl.style.display = 'block';
                
                const generatedImg = document.getElementById('generatedImage');
                const usedTechEl = document.getElementById('usedTechnique');
                const finalPromptEl = document.getElementById('finalPrompt');
                const parametersEl = document.getElementById('parametersUsed');
                
                if (generatedImg) generatedImg.src = imageUrl;
                if (usedTechEl) usedTechEl.textContent = technique.charAt(0).toUpperCase() + technique.slice(1).replace('-', ' ');
                if (finalPromptEl) finalPromptEl.textContent = prompt;
                if (parametersEl) parametersEl.innerHTML = `
                    <div class="param-display">
                        <span class="param-label">AI Model:</span> <span class="param-value">${selectedModel}</span>
                    </div>
                    <div class="param-display">
                        <span class="param-label">Temperature:</span> <span class="param-value">${temp}</span>
                    </div>
                    <div class="param-display">
                        <span class="param-label">Top-P:</span> <span class="param-value">${topP}</span>
                    </div>
                    <div class="param-display">
                        <span class="param-label">Top-K:</span> <span class="param-value">${topK}</span>
                    </div>
                `;
                
                // Store current result
                this.currentModel = {
                    technique,
                    originalPrompt: prompt,
                    enhancedPrompt,
                    imageUrl,
                    parameters: { temp, topP, topK, seed, model: selectedModel },
                    timestamp: Date.now(),
                    student: this.currentStudent
                };

                // Mark build as completed
                this.progress.build = true;
                this.saveProgress();
                this.updateProgressTracker();

                // Save to playground gallery
                this.saveToPlaygroundGallery(this.currentModel);

                this.showNotification('Image generated successfully!', 'success');
            };
            
            img.onerror = () => {
                if (loadingEl) loadingEl.style.display = 'none';
                this.showNotification('Failed to generate image. Please try again.', 'error');
            };
            
            img.src = imageUrl;

        } catch (error) {
            if (loadingEl) loadingEl.style.display = 'none';
            this.showNotification('Error generating image: ' + error.message, 'error');
        }
    }

    // Zero-Shot Examples
    loadZeroShotGood() {
        const prompt = `Professional corporate headshot of confident technology executive in charcoal business suit, sitting at modern workspace with computer screens background, shot with 85mm portrait lens, studio lighting setup, commercial photography quality, crystal clear focus, realistic skin texture, magazine cover quality`;
        const textarea = document.getElementById('zeroShotPrompt');
        textarea.value = prompt;
        // Trigger auto-resize
        this.setupAutoResize(textarea);
        textarea.dispatchEvent(new Event('input'));
        this.showNotification('Good zero-shot example loaded!', 'success');
    }

    loadZeroShotBad() {
        const prompt = `professional person`;
        const textarea = document.getElementById('zeroShotPrompt');
        textarea.value = prompt;
        // Trigger auto-resize
        this.setupAutoResize(textarea);
        textarea.dispatchEvent(new Event('input'));
        this.showNotification('Poor zero-shot example loaded - notice how vague it is!', 'warning');
    }

    loadZeroShotBest() {
        const prompt = `Create a stunning professional portrait masterpiece: a distinguished senior architect with confident expression and thoughtful demeanor, wearing modern casual business attire with architectural blueprints visible in background, standing in contemporary design studio with natural lighting from large windows. Capture with professional medium format camera using 85mm portrait lens at f/2.8 aperture, studio-quality lighting setup with key light and subtle fill light, achieving crystal-clear focus on subject's eyes and natural skin texture. Render in commercial photography quality with magazine-cover precision, showcasing professional expertise and creative competence in stunning high-resolution detail.`;
        const textarea = document.getElementById('zeroShotPrompt');
        textarea.value = prompt;
        // Trigger auto-resize
        this.setupAutoResize(textarea);
        textarea.dispatchEvent(new Event('input'));
        this.showNotification('Best practice zero-shot example loaded!', 'success');
    }

    // Few-Shot Examples
    loadFewShotGood() {
        // Load examples into the component fields - Single subject focus with consistent pattern
        const examples = [
            'Professional software engineer working alone at modern workstation, focused on coding tasks, wearing contemporary tech company attire, surrounded by development tools and multiple monitors, natural office lighting creates professional atmosphere, technology magazine photography style with clean composition.',
            'Dedicated environmental scientist conducting solo field research, collecting samples in natural outdoor setting, wearing appropriate field gear, surrounded by scientific equipment and natural landscape, golden hour lighting enhances the scene, documentary photography quality with authentic feel.',
            'Expert financial advisor working independently at conference table, reviewing important documents, dressed in professional business attire, modern office environment with city skyline background, corporate lighting setup, business magazine photography standard with executive presence.'
        ];
        
        const task = 'a professional teacher working alone in classroom setting, engaged with educational materials, wearing appropriate teaching attire, surrounded by learning resources and classroom technology, natural lighting from classroom windows, educational magazine photography quality with inspiring composition.';
        
        this.loadFewShotComponents(examples, task);
        this.showNotification('Improved few-shot example loaded - single subject focus!', 'success');
    }

    loadFewShotComponents(examples, task) {
        // Clear existing examples and add new ones
        const container = document.getElementById('fewShotExamples');
        container.innerHTML = '';
        
        examples.forEach((example, index) => {
            const exampleDiv = document.createElement('div');
            exampleDiv.className = 'example-item';
            exampleDiv.dataset.index = index;
            exampleDiv.innerHTML = `
                <div class="example-item-header">
                    <label>Example ${index + 1}</label>
                    <button class="remove-example" onclick="modelBuilder.removeExample('fewShot', ${index})" title="Remove this example">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <textarea class="example-input auto-resize">${example}</textarea>
            `;
            container.appendChild(exampleDiv);
        });
        
        // Set task
        const taskTextarea = document.getElementById('fewShotTask');
        taskTextarea.value = task;
        
        // Setup auto-resize for loaded textareas
        setTimeout(() => {
            container.querySelectorAll('textarea').forEach(textarea => {
                this.setupAutoResize(textarea);
                // Trigger resize for textareas with content
                textarea.dispatchEvent(new Event('input'));
            });
            // Also setup auto-resize for the task textarea
            this.setupAutoResize(taskTextarea);
            // Trigger resize for task textarea with content
            taskTextarea.dispatchEvent(new Event('input'));
        }, 100);
        
        // Update the final prompt display
        this.updateFewShotPrompt();
    }

    loadFewShotBad() {
        const examples = [
            'Engineers work with computers.',
            'Teachers help students.'
        ];
        
        const task = 'Make a professional.';
        
        this.loadFewShotComponents(examples, task);
        this.showNotification('Poor few-shot example loaded - see the inconsistent pattern!', 'warning');
    }

    loadFewShotBest() {
        const examples = [
            'Distinguished senior technology leader working independently at executive workspace, wearing smart casual attire, focused on innovation strategy, surrounded by cutting-edge technology displays and analytical tools, natural office lighting with urban skyline backdrop, technology magazine photography quality with authoritative composition.',
            'Accomplished research scientist working alone in state-of-the-art laboratory, wearing professional lab coat, conducting advanced research with sophisticated scientific equipment, controlled laboratory lighting environment, scientific publication photography standard with precision focus.',
            'Master craftsperson creating individually in traditional workshop, wearing artisan work attire, skillfully using specialized hand tools, surrounded by handcrafted works and natural materials, warm natural lighting from workshop windows, artisan magazine photography style with authentic documentation quality.',
            'Experienced professional educator teaching independently in modern classroom, wearing contemporary professional attire, engaging with educational technology and teaching materials, inspiring natural lighting from classroom environment, education publication photography standard with portfolio-quality composition.'
        ];
        
        const task = 'an expert business consultant working alone in executive office setting, wearing professional business attire, reviewing strategic materials, surrounded by modern business technology and collaborative tools, natural office lighting with corporate atmosphere, business magazine photography quality with executive presence.';
        
        this.loadFewShotComponents(examples, task);
        this.showNotification('Best practice few-shot example loaded - pattern mastery!', 'success');
    }

    // Chain-of-Thought Examples
    loadChainThoughtGood() {
        const steps = [
            'Choose the main subject - A professional data scientist with confident expression, depicting years of analytical expertise and innovation through competent yet approachable features.',
            'Define the setting - A modern technology lab with data visualization screens, analytical tools, and collaborative research environment.',
            'Establish the mood and atmosphere - Professional, innovative, focused atmosphere with a sense of analytical expertise and problem-solving capability, conveying both skill and creativity.',
            'Design the lighting setup - Natural office lighting as primary illumination, with screen glow providing ambient lighting, creating clear visibility and modern professional atmosphere.',
            'Add specific details - Smart casual professional attire, data analysis tools, research materials in background, clean modern appearance reflecting contemporary analytical work.',
            'Ensure technical quality - Professional photography style, commercial composition with proper framing, natural lighting techniques, high-resolution detail.'
        ];
        
        const final = 'Result: Create a professional data scientist in modern tech lab, surrounded by data visualization and analytical tools, achieving commercial photography quality and professional composition.';
        
        this.loadChainThoughtComponents(steps, final);
        this.showNotification('Good chain-of-thought example loaded!', 'success');
    }

    loadChainThoughtComponents(steps, final) {
        // Clear existing steps and add new ones
        const container = document.getElementById('chainThoughtSteps');
        container.innerHTML = '';
        
        steps.forEach((step, index) => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'step-item';
            stepDiv.dataset.index = index;
            stepDiv.innerHTML = `
                <div class="step-item-header">
                    <label>Step ${index + 1}</label>
                    <button class="remove-step" onclick="modelBuilder.removeStep('chainThought', ${index})" title="Remove this step">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <textarea class="step-input auto-resize">${step}</textarea>
            `;
            container.appendChild(stepDiv);
        });
        
        // Set final instruction
        document.getElementById('chainThoughtFinal').value = final;
        
        // Setup auto-resize for loaded textareas
        setTimeout(() => {
            container.querySelectorAll('textarea').forEach(textarea => {
                this.setupAutoResize(textarea);
                // Trigger resize for textareas with content
                textarea.dispatchEvent(new Event('input'));
            });
            // Also setup auto-resize for the final instruction textarea
            const finalTextarea = document.getElementById('chainThoughtFinal');
            if (finalTextarea) {
                this.setupAutoResize(finalTextarea);
                // Trigger resize for textareas with content
                finalTextarea.dispatchEvent(new Event('input'));
            }
        }, 100);
        
        // Update the final prompt display
        this.updateChainThoughtPrompt();
    }

    loadChainThoughtBad() {
        const steps = [
            'I want a professional person.',
            'Make them look smart.'
        ];
        
        const final = 'Add some work stuff.';
        
        this.loadChainThoughtComponents(steps, final);
        this.showNotification('Poor chain-of-thought example loaded - no systematic thinking!', 'warning');
    }

    loadChainThoughtBest() {
        const steps = [
            'Subject Analysis - Distinguished senior research director character study: experienced professional with confident bearing, intelligent eyes reflecting scientific expertise, approachable yet authoritative demeanor, facial features conveying competence and innovation.',
            'Environmental Design - State-of-the-art research facility: modern laboratory with advanced scientific equipment, clean surfaces and professional research instrumentation, contemporary scientific architecture with glass and steel elements.',
            'Atmospheric Engineering - Professional research ambiance: bright, clean laboratory lighting suggesting precision and discovery, sense of cutting-edge scientific practice, atmosphere of competence and innovation, organized yet dynamic environment.',
            'Lighting Architecture - Multi-layered professional illumination: primary bright laboratory overhead lighting establishing clean visibility, secondary equipment accent lighting, tertiary ambient lighting from computer screens, quaternary natural light from windows creating depth.',
            'Detail Specification - Professional elements: contemporary lab coat with proper fit, research materials positioned naturally, scientific instruments authentically arranged, modern professional appearance reflecting current research standards.',
            'Technical Excellence - Commercial photography execution: Shot with professional camera equipment using 85mm portrait lens, studio-quality lighting setup with controlled shadows, magazine-quality composition utilizing rule of thirds, professional color grading maintaining natural tones.'
        ];
        
        const final = 'Final Synthesis: Create a distinguished senior research director in modern laboratory, surrounded by state-of-the-art scientific equipment and bright research lighting, wearing professional lab attire with authentic scientific details, captured with commercial photography quality and professional composition worthy of science publication covers.';
        
        this.loadChainThoughtComponents(steps, final);
        this.showNotification('Best practice chain-of-thought example loaded!', 'success');
    }

    // Role-Play Examples
    loadRolePlayGood() {
        const role = 'professional corporate photographer specializing in technology industry portraits with 15 years of experience creating compelling professional images for major tech companies';
        const context = 'Your portfolio includes award-winning corporate photography for technology firms, business magazines, and innovation campaigns. Create a piece that would impress company executives and industry publications';
        const task = 'A compelling professional portrait of a senior software architect in modern workspace, with authentic technology tools and lighting that conveys both expertise and innovation';
        const audience = 'This piece needs to meet technology magazine publication standards for a major industry feature';
        
        this.loadRolePlayComponents(role, context, task, audience);
        this.showNotification('Good role-play example loaded!', 'success');
    }

    loadRolePlayComponents(role, context, task, audience) {
        document.getElementById('rolePlayRole').value = role;
        document.getElementById('rolePlayContext').value = context;
        document.getElementById('rolePlayTask').value = task;
        document.getElementById('rolePlayAudience').value = audience;
        
        // Setup auto-resize for role-play textareas
        setTimeout(() => {
            ['rolePlayRole', 'rolePlayContext', 'rolePlayTask', 'rolePlayAudience'].forEach(id => {
                const textarea = document.getElementById(id);
                if (textarea) {
                    this.setupAutoResize(textarea);
                    // Trigger resize for textareas with content
                    textarea.dispatchEvent(new Event('input'));
                }
            });
        }, 100);
        
        // Update the final prompt display
        this.updateRolePlayPrompt();
    }

    loadRolePlayBad() {
        const role = 'an artist';
        const context = '';
        const task = 'Draw something nice';
        const audience = '';
        
        this.loadRolePlayComponents(role, context, task, audience);
        this.showNotification('Poor role-play example loaded - too vague and generic!', 'warning');
    }

    loadRolePlayBest() {
        const role = 'lead senior commercial photographer at Getty Images with 20+ years of experience shooting for Fortune 500 companies, educational institutions, and international publications. You\'ve won multiple photography awards for outstanding professional portraiture and your work has been featured in major business magazines worldwide';
        const context = 'Corporate executives specifically request your expertise for the most challenging and prestigious professional portraits. Your current assignment is for the new university campaign "Innovation in Education"';
        const task = 'Create a distinguished portrait of the dean of engineering that will serve as the campaign\'s primary academic authority figure. This portrait must convey decades of educational expertise, professional competence, and inspiring academic leadership';
        const audience = 'Museum-quality professional photography that will be used for university websites, academic publications, and marketing materials. The portrait must be iconic enough to become a symbol of educational excellence while meeting the technical demands of modern commercial photography';
        
        this.loadRolePlayComponents(role, context, task, audience);
        this.showNotification('Best practice role-play example loaded!', 'success');
    }

    // Structured Examples
    loadStructuredGood() {
        const components = {
            subject: 'Professional urban planner with confident expression and thoughtful demeanor, radiating planning expertise and community-focused vision',
            style: 'Architectural documentary photography with commercial elements, reminiscent of professional urban development campaigns but with modern technical execution',
            composition: 'Portrait orientation, direct eye contact angle, rule of thirds positioning with subject\'s eyes at upper intersection point, confident pose with professional presentation',
            lighting: 'Natural office lighting from large windows, gentle rim lighting to separate subject from background, warm key light with cool city view fill light for depth',
            mood: 'Professional and visionary atmosphere, conveying both planning expertise and community focus, confident yet approachable presence',
            details: 'Modern professional attire with architectural plans visible, city planning materials naturally positioned, urban development tools in background, clean contemporary appearance',
            technical: 'Shot with 85mm portrait lens, commercial photography quality, magazine-worthy composition, professional color grading, sharp focus with natural lighting',
            additional: ''
        };
        
        this.loadStructuredComponents(components);
        this.showNotification('Good structured example loaded!', 'success');
    }

    loadStructuredComponents(components) {
        // Clear existing dynamic structures
        const container = document.getElementById('dynamicStructures');
        if (!container) {
            console.error('Dynamic structures container not found!');
            return;
        }
        container.innerHTML = '';
        
        // Mapping of component keys to structure types
        const componentMap = {
            subject: 'subject',
            style: 'style', 
            composition: 'composition',
            lighting: 'lighting',
            mood: 'mood',
            details: 'details',
            technical: 'technical',
            additional: 'additional'
        };
        
        // Add structures that have content
        let addedStructures = 0;
        Object.keys(components).forEach(key => {
            if (components[key] && components[key].trim()) {
                const structureType = componentMap[key];
                if (structureType) {
                    this.addStructure(structureType);
                    addedStructures++;
                    
                    // Find the textarea and set its value
                    const textarea = container.querySelector(`[data-structure="${structureType}"] textarea`);
                    if (textarea) {
                        textarea.value = components[key];
                        // Trigger auto-resize
                        this.setupAutoResize(textarea);
                        textarea.dispatchEvent(new Event('input'));
                    }
                }
            }
        });
        
        // Ensure at least one structure exists (add subject if none were added)
        if (addedStructures === 0) {
            this.addStructure('subject');
        }
        
        // Update the final prompt display
        this.updateStructuredPrompt();
    }

    loadStructuredBad() {
        const components = {
            subject: 'A doctor',
            style: '',
            composition: '',
            lighting: '',
            mood: 'Professional and medical',
            details: '',
            technical: '',
            additional: ''
        };
        
        this.loadStructuredComponents(components);
        this.showNotification('Poor structured example loaded - no organization or detail!', 'warning');
    }

    loadStructuredBest() {
        const components = {
            subject: 'Distinguished senior sustainability consultant with thoughtful expression and confident bearing, hands positioned naturally while reviewing environmental data, embodying decades of environmental expertise and community-focused solutions, wearing contemporary professional attire',
            style: 'Museum-quality commercial photography blending classical portrait technique with cutting-edge environmental documentary artistry, influences from Annie Leibovitz and contemporary sustainability photographers, executed with photographic precision and professional standards',
            composition: 'Professional portrait composition utilizing golden ratio positioning, subject positioned at primary focal intersection, environmental tools creating supporting visual elements leading eye through frame, background elements following rule of thirds, foreground-midground-background clearly defined for maximum professional depth',
            lighting: 'Complex multi-source professional illumination architecture - primary natural window lighting creating authentic visibility, secondary LED accent lighting providing sustainable illumination, tertiary ambient office lighting for depth, quaternary computer screen glow defining modern workspace atmosphere, all balanced for professional yet approachable effect',
            mood: 'Professional excellence combined with environmental consciousness, conveying both sustainability expertise and approachable consultation manner, atmosphere of cutting-edge environmental solutions and trusted guidance, inspiring confidence while maintaining authentic warmth',
            details: 'Individual fabric textures in sustainable professional attire rendered with precision, environmental charts positioned naturally, renewable energy materials ready for presentation, sustainability tools authentically arranged, clean professional appearance, realistic details showing expertise and dedication',
            technical: 'Shot with professional medium format camera using 85mm portrait lens, commercial photography archival quality, magazine cover standard, award-winning professional composition, technical execution rivaling finest commercial portraits, color theory implementing natural harmony, perfect professional authenticity',
            additional: 'Modern sustainability office setting with environmental planning materials, renewable energy displays with proper eco-conscious aesthetics, authentic green technology environment following professional environmental standards, subtle depth of field isolating subject'
        };
        
        this.loadStructuredComponents(components);
        this.showNotification('Best practice structured example loaded!', 'success');
    }

    copyURL() {
        if (this.currentModel?.imageUrl) {
            navigator.clipboard.writeText(this.currentModel.imageUrl).then(() => {
                this.showNotification('URL copied to clipboard!', 'success');
            });
        }
    }

    downloadImage() {
        const img = document.getElementById('generatedImage');
        if (img?.src) {
            const link = document.createElement('a');
            link.download = `ai-artwork-${Date.now()}.png`;
            link.href = img.src;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            this.showNotification('Download started!', 'success');
        }
    }

    saveModel() {
        if (!this.currentModel) {
            this.showNotification('No model to save', 'warning');
            return;
        }

        const notes = document.getElementById('analysisNotes')?.value || '';
        this.currentModel.notes = notes;
        
        // Save to localStorage
        const savedModels = JSON.parse(localStorage.getItem('savedModels') || '[]');
        savedModels.push(this.currentModel);
        localStorage.setItem('savedModels', JSON.stringify(savedModels));

        this.showNotification('Model saved successfully!', 'success');
    }

    shareModel() {
        if (!this.currentModel) {
            this.showNotification('No model to share', 'warning');
            return;
        }

        const notes = document.getElementById('analysisNotes')?.value || '';
        this.currentModel.notes = notes;

        // Create shareable code
        const shareData = {
            ...this.currentModel,
            sharedAt: Date.now()
        };

        const encoded = btoa(JSON.stringify(shareData));
        const shareCodeEl = document.getElementById('shareCode');
        const modalEl = document.getElementById('shareModal');
        
        if (shareCodeEl) shareCodeEl.value = encoded;
        if (modalEl) modalEl.classList.add('active');

        // Mark share as completed
        this.progress.share = true;
        this.saveProgress();
        this.updateProgressTracker();
    }

    closeShareModal() {
        const modalEl = document.getElementById('shareModal');
        if (modalEl) modalEl.classList.remove('active');
    }

    copyShareCode() {
        const code = document.getElementById('shareCode')?.value;
        if (code) {
            navigator.clipboard.writeText(code).then(() => {
                this.showNotification('Sharing code copied to clipboard!', 'success');
                this.closeShareModal();
            });
        }
    }

    exportModel() {
        this.shareModel();
    }

    importModel() {
        const code = prompt('Enter the sharing code from your classmate:');
        if (!code) return;

        try {
            const modelData = JSON.parse(atob(code));
            
            // Add to gallery
            const gallery = document.getElementById('studentGallery');
            if (gallery?.querySelector('.gallery-empty')) {
                gallery.innerHTML = '';
            }

            const modelCard = document.createElement('div');
            modelCard.className = 'student-model-card';
            modelCard.innerHTML = `
                <div class="model-header">
                    <h4>${modelData.student}'s Model</h4>
                    <span class="technique-badge">${modelData.technique}</span>
                </div>
                <img src="${modelData.imageUrl}" alt="Student artwork" class="model-preview">
                <div class="model-details">
                    <p><strong>Technique:</strong> ${modelData.technique}</p>
                    <p><strong>Created:</strong> ${new Date(modelData.timestamp).toLocaleDateString()}</p>
                    ${modelData.notes ? `<p><strong>Notes:</strong> ${modelData.notes}</p>` : ''}
                </div>
                <button class="btn btn-secondary btn-sm" onclick="modelBuilder.testImportedModel('${code}')">
                    <i class="fas fa-play"></i>
                    Test This Model
                </button>
            `;

            gallery?.appendChild(modelCard);
            this.showNotification(`Successfully imported ${modelData.student}'s model!`, 'success');

        } catch (error) {
            this.showNotification('Invalid sharing code', 'error');
        }
    }

    testImportedModel(code) {
        try {
            const modelData = JSON.parse(atob(code));
            
            // Switch to build section and load the model
            this.showSection('build');
            
            // Set the appropriate technique
            this.switchTechnique(modelData.technique);
            
            // Load the prompt
            const promptMap = {
                'zero-shot': 'zeroShotPrompt',
                'few-shot': 'fewShotPrompt',
                'chain-thought': 'chainThoughtPrompt',
                'role-play': 'rolePlayPrompt',
                'structured': 'structuredPrompt'
            };
            
            const promptId = promptMap[modelData.technique];
            if (promptId) {
                document.getElementById(promptId).value = modelData.originalPrompt || modelData.prompt;
            }

            // Set parameters if available
            if (modelData.parameters) {
                const { temp, topP, topK, model } = modelData.parameters;
                if (model !== undefined) {
                    const modelSelector = document.getElementById('aiModel');
                    if (modelSelector) {
                        modelSelector.value = model;
                    }
                }
                if (temp !== undefined) {
                    document.getElementById('temperature').value = temp;
                    document.getElementById('tempValue').textContent = temp;
                }
                if (topP !== undefined) {
                    document.getElementById('topP').value = topP;
                    document.getElementById('topPValue').textContent = topP;
                }
                if (topK !== undefined) {
                    document.getElementById('topK').value = topK;
                    document.getElementById('topKValue').textContent = topK;
                }
            }
            
            this.showNotification(`Loaded ${modelData.student}'s ${modelData.technique} model!`, 'success');
            
        } catch (error) {
            this.showNotification('Error loading model', 'error');
        }
    }

    setChallenge() {
        const prompt = document.getElementById('challengePrompt')?.value.trim();
        if (!prompt) {
            this.showNotification('Please enter a challenge prompt', 'warning');
            return;
        }

        localStorage.setItem('currentChallenge', prompt);
        document.getElementById('challengeDisplay').textContent = prompt;
        document.getElementById('currentChallenge').style.display = 'block';
        
        this.showNotification('Challenge set successfully!', 'success');
    }

    runCompetition() {
        const challenge = localStorage.getItem('currentChallenge');
        if (!challenge) {
            this.showNotification('No challenge set', 'warning');
            return;
        }

        // Mark competition as completed
        this.progress.compete = true;
        this.saveProgress();
        this.updateProgressTracker();

        document.getElementById('competitionResults').style.display = 'block';
        document.getElementById('resultsDisplay').innerHTML = `
            <div class="competition-status">
                <h4>🏁 Competition Started!</h4>
                <p>Challenge: "${challenge}"</p>
                <p>Students can now submit their models using this prompt.</p>
            </div>
        `;
        
        this.showNotification('Competition started!', 'success');
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="${icons[type] || icons.info}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    saveProgress() {
        localStorage.setItem('userProgress', JSON.stringify(this.progress));
        localStorage.setItem('currentStudent', this.currentStudent);
    }

    loadProgress() {
        const savedProgress = localStorage.getItem('userProgress');
        
        if (savedProgress) {
            this.progress = { ...this.progress, ...JSON.parse(savedProgress) };
        }
    }

    updateUI() {
        this.updateProgressTracker();
        this.loadGallery();
        // Load database submissions for gallery if we're on that section
        if (document.getElementById('gallery-section')?.classList.contains('active')) {
            this.loadDatabaseSubmissions();
        }
    }

    loadGallery() {
        const gallery = document.getElementById('studentGallery');
        const savedModels = JSON.parse(localStorage.getItem('savedModels') || '[]');
        
        if (savedModels.length === 0 || !gallery) return;
        
        gallery.innerHTML = '';
        savedModels.forEach((model, index) => {
            const modelCard = document.createElement('div');
            modelCard.className = 'student-model-card';
            modelCard.innerHTML = `
                <div class="model-header">
                    <h4>${model.student}'s Model</h4>
                    <span class="technique-badge">${model.technique}</span>
                </div>
                <img src="${model.imageUrl}" alt="Student artwork" class="model-preview">
                <div class="model-details">
                    <p><strong>Technique:</strong> ${model.technique}</p>
                    <p><strong>Created:</strong> ${new Date(model.timestamp).toLocaleDateString()}</p>
                    ${model.notes ? `<p><strong>Notes:</strong> ${model.notes}</p>` : ''}
                </div>
            `;
            gallery.appendChild(modelCard);
        });
    }

    // ========== NEW EDUCATIONAL FLOW FUNCTIONS ==========

    // Assignment Functions
    setAssignmentRequirements(requirements) {
        this.currentAssignment = requirements;
        const requirementsEl = document.getElementById('imageRequirements');
        if (requirementsEl) {
            requirementsEl.innerHTML = requirements;
        }
        this.showNotification('Assignment requirements updated!', 'success');
    }

    async testAssignmentPrompt() {
        const prompt = document.getElementById('assignmentPrompt').value.trim();
        if (!prompt) {
            this.showNotification('Please enter your assignment prompt first!', 'warning');
            return;
        }

        // Show loading state
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
        button.disabled = true;

        try {
            const grade = await this.calculatePromptGradeWithRetry(prompt, this.assignmentTechnique);
            this.displayGrade(grade, 'assignmentPrompt');
            this.showNotification(`Assignment prompt tested! Score: ${grade.score}/10 - ${grade.quality}`, 'success');
        } catch (error) {
            // Testing failed
            this.showNotification('Testing failed - using local evaluation', 'warning');
            
            const localScore = this.getLocalScore(prompt);
            const localFeedback = this.getLocalFeedback(prompt, this.assignmentTechnique);
            
            this.displayGrade({
                score: localScore,
                feedback: `[Local Mode - API Failed] ${localFeedback}`,
                color: this.getGradeColor(localScore),
                quality: this.getQualityText(localScore)
            }, 'assignmentPrompt');
        } finally {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }

    async generateAssignmentImage() {
        const prompt = document.getElementById('assignmentPrompt').value.trim();
        if (!prompt) {
            this.showNotification('Please enter your assignment prompt first!', 'warning');
            return;
        }

        const temp = parseFloat(document.getElementById('assignmentTemperature').value);
        const topP = parseFloat(document.getElementById('assignmentTopP').value);
        const topK = parseInt(document.getElementById('assignmentTopK').value);
        const selectedModel = document.getElementById('assignmentAiModel')?.value || 'flux';

        // Show loading state and scroll to it
        const loadingEl = document.getElementById('assignmentLoading');
        const resultsEl = document.getElementById('assignmentResults');
        const img = document.getElementById('assignmentImage');
        
        if (loadingEl) {
            loadingEl.style.display = 'block';
            // Scroll to loading section smoothly
            loadingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        if (resultsEl) resultsEl.style.display = 'none';
        img.style.display = 'none';

        try {
            const enhancedPrompt = this.enhancePromptWithParameters(prompt, temp, topP, topK);
            const seed = this.generateParameterSeed(temp, topP, topK);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=768&height=768&seed=${seed}&model=${selectedModel}&nologo=true`;

            // Wait for image to load before showing results
            img.onload = () => {
                if (loadingEl) loadingEl.style.display = 'none';
                if (resultsEl) {
                    resultsEl.style.display = 'block';
                    // Scroll to results section smoothly
                    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            img.style.display = 'block';
            };
            
            img.onerror = () => {
                if (loadingEl) loadingEl.style.display = 'none';
                this.showNotification('Failed to load generated image', 'error');
            };
            
            img.src = imageUrl;

            // Store assignment model (student name will be added at submission)
            this.currentModel = {
                student: '', // Will be filled when submitting
                technique: this.assignmentTechnique,
                prompt: prompt,
                enhancedPrompt: enhancedPrompt,
                parameters: { temp, topP, topK, model: selectedModel },
                imageUrl: imageUrl,
                timestamp: Date.now(),
                isAssignment: true,
                analysis: ''
            };

            this.showNotification('Assignment image generated successfully!', 'success');
            this.progress.assignment = true;
            this.updateProgressTracker();

        } catch (error) {
            // Generation failed
            if (loadingEl) loadingEl.style.display = 'none';
            this.showNotification('Failed to generate assignment image', 'error');
        }
    }

    async submitAssignment() {
        if (!this.currentModel || !this.currentModel.isAssignment) {
            this.showNotification('Please generate your assignment image first!', 'warning');
            return;
        }

        const analysis = document.getElementById('assignmentAnalysis').value.trim();
        if (!analysis) {
            this.showNotification('Please complete your reflection analysis before submitting!', 'warning');
            return;
        }

        // Show submission modal
        this.showSubmissionModal(analysis);
    }

    showSubmissionModal(analysis) {
        // Create submission modal
        const modal = document.createElement('div');
        modal.className = 'modal active submission-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📤 Submit Assignment</h3>
                    <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p><strong>Ready to submit your assignment?</strong></p>
                    <p>Please provide your information to complete the submission:</p>
                    
                    <div class="form-group">
                        <label for="submissionName">Full Name *</label>
                        <input type="text" id="submissionName" class="form-input" placeholder="Enter your full name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="submissionEmail">Email Address *</label>
                        <input type="email" id="submissionEmail" class="form-input" placeholder="Enter your email address" required>
                    </div>
                    
                    <div class="submission-preview">
                        <h4>📋 Submission Summary:</h4>
                        <div class="preview-item">
                            <strong>Technique:</strong> ${this.currentModel.technique}
                        </div>
                        <div class="preview-item">
                            <strong>Analysis:</strong> ${analysis.substring(0, 100)}${analysis.length > 100 ? '...' : ''}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Cancel
                    </button>
                    <button class="btn btn-primary" onclick="modelBuilder.processSubmission('${analysis}')">
                        <i class="fas fa-paper-plane"></i> Submit Assignment
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Focus on name field
        setTimeout(() => {
            document.getElementById('submissionName').focus();
        }, 100);
    }

    async processSubmission(analysis) {
        const studentName = document.getElementById('submissionName').value.trim();
        const studentEmail = document.getElementById('submissionEmail').value.trim();
        
        // Validate input
        if (!studentName) {
            this.showNotification('Please enter your full name!', 'warning');
            return;
        }

        if (!studentEmail || !studentEmail.includes('@')) {
            this.showNotification('Please enter a valid email address!', 'warning');
            return;
        }

        try {
            // Close modal
            document.querySelector('.submission-modal').remove();
            
            // Show loading state
            this.showNotification('Submitting assignment to database...', 'info');

            // Prepare submission data for database
            const submissionData = {
                assignment_id: this.currentAssignmentId || 1, // Will use the default assignment we just created
                student_name: studentName,
                student_email: studentEmail,
                prompt_data: {
                    technique: this.currentModel.technique,
                    prompt: this.currentModel.prompt,
                    enhancedPrompt: this.currentModel.enhancedPrompt,
                    parameters: this.currentModel.parameters,
                    analysis: analysis,
                    submittedAt: new Date().toISOString(),
                    timestamp: this.currentModel.timestamp
                },
                image_url: this.currentModel.imageUrl
            };

            // Submit to database
            const result = await dbHelper.submitAssignment(submissionData);
            
            // Update local state
            this.currentModel.student = studentName;
            this.currentModel.analysis = analysis;
            this.currentModel.submittedAt = new Date().toISOString();
            this.currentModel.submissionId = result.id;
            this.currentModel.submissionCode = result.submission_code;
            
            this.assignmentSubmitted = true;
            this.showNotification(`Assignment submitted successfully! Submission code: ${result.submission_code}`, 'success');
            
            // Update progress
            this.progress.assignment = true;
            this.updateProgressTracker();
            
        } catch (error) {
            // Database submission failed, using local storage
            this.showNotification(`Database submission failed: ${error.message}. Falling back to local storage.`, 'warning');
            
            // Fallback to original method
            this.submitAssignmentLocal(studentName, studentEmail, analysis);
        }
    }

    // Fallback method for local submission
    submitAssignmentLocal(studentName, studentEmail, analysis) {
        // Update model with student info
        this.currentModel.student = studentName;
        this.currentModel.email = studentEmail;
        this.currentModel.analysis = analysis;
        this.currentModel.submittedAt = new Date().toISOString();
        
        // Generate submission code
        const submissionCode = this.generateSubmissionCode(this.currentModel);
        
        this.assignmentSubmitted = true;
        this.showNotification(`Assignment submitted locally! Submission code: ${submissionCode}`, 'success');
        
        // Update progress
        this.progress.assignment = true;
        this.updateProgressTracker();
    }

    generateSubmissionCode(model) {
        const submissionData = {
            type: 'assignment',
            student: model.student,
            technique: model.technique,
            prompt: model.prompt,
            enhancedPrompt: model.enhancedPrompt,
            parameters: model.parameters,
            imageUrl: model.imageUrl,
            analysis: model.analysis,
            submittedAt: model.submittedAt,
            timestamp: model.timestamp
        };
        
        return btoa(JSON.stringify(submissionData));
    }

    showSubmissionCode(code) {
        // Create and show modal with submission code
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📤 Assignment Submission Code</h3>
                    <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p><strong>Your assignment has been submitted!</strong></p>
                    <p>Share this code with your instructor:</p>
                    <textarea class="share-code-input auto-resize" readonly>${code}</textarea>
                    <button class="btn btn-primary" onclick="modelBuilder.copySubmissionCode('${code}', this)">
                        <i class="fas fa-copy"></i> Copy Code
                    </button>
                    <p class="submission-note">Keep this code safe - you'll need it if you want to make changes!</p>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    // Gallery & Voting Functions
    async loadDatabaseSubmissions() {
        try {
            // Notification disabled for better UX
        // this.showNotification('Loading submissions from database...', 'info');
            
            // Get submissions for the default assignment
            const submissions = await dbHelper.getSubmissions(1); // Using default assignment ID
            
            if (submissions.length === 0) {
                // Notification disabled for better UX
            // this.showNotification('No submissions found in database yet', 'info');
                this.updateSubmissionGallery();
                return;
            }

            // Transform database submissions to match expected format with PII protection
            this.classSubmissions = submissions.map((sub, index) => {
                const promptData = typeof sub.prompt_data === 'string' ? 
                    JSON.parse(sub.prompt_data) : sub.prompt_data;
                
                // Ensure votes is a number, defaulting to 0
                const voteCount = parseInt(sub.votes) || 0;
                
                const submission = {
                    id: sub.id,
                    student: sub.student_name,
                    email: sub.student_email, // Store but don't display
                    technique: promptData.technique,
                    prompt: promptData.prompt,
                    enhancedPrompt: promptData.enhancedPrompt,
                    parameters: promptData.parameters,
                    analysis: promptData.analysis,
                    imageUrl: sub.image_url,
                    submittedAt: sub.submitted_at,
                    votes: voteCount,
                    isRevealed: sub.is_revealed || false,
                    submissionCode: sub.submission_code,
                    isAnonymous: true // Flag for anonymous display
                };
                
                return submission;
            });

            // Initialize voting data from database
            this.votingData = {};
            this.classSubmissions.forEach(submission => {
                this.votingData[submission.student] = submission.votes;
                // Vote data loaded
            });

            // Check voting status for all submissions
            const submissionIds = this.classSubmissions.map(sub => sub.id);
            await this.checkVotingStatus(submissionIds);

                this.updateSubmissionGallery();
            this.checkForWinnerReveal(); // Check if winner reveal button should be shown
            // Notification disabled for better UX
            // this.showNotification(`Loaded ${submissions.length} submissions from database`, 'success');

        } catch (error) {
            this.showNotification('Could not load database submissions', 'warning');
            // Keep existing local submissions if any
        }
    }





    updateSubmissionGallery() {
        const gallery = document.getElementById('submissionGallery');
        if (!gallery) return;

        if (this.classSubmissions.length === 0) {
            gallery.innerHTML = '<div class="gallery-empty"><p>No submissions found yet. Students can submit their assignments to populate this gallery!</p></div>';
            return;
        }

        const galleryHTML = this.classSubmissions.map((submission, index) => {
            // Generate anonymous display name if not revealed
            const displayName = submission.isRevealed ? 
                submission.student : 
                `Student ${index + 1}`;
            
            const displayImageAlt = submission.isRevealed ? 
                `${submission.student}'s artwork` : 
                `Anonymous student artwork`;

            return `
                <div class="submission-card ${submission.isRevealed ? 'revealed' : 'anonymous'}" 
                     data-index="${index}" 
                     data-student="${submission.student}">
                    <div class="submission-image" onclick="modelBuilder.showInstagramModal(${index})" style="cursor: pointer;">
                        <img src="${submission.imageUrl}" alt="${displayImageAlt}" loading="lazy">
                    </div>
                    <div class="submission-overlay">
                        <div class="submission-header">
                            <h4 class="submission-title">${displayName}</h4>
                            ${submission.submittedAt ? `<span class="submission-date">${new Date(submission.submittedAt).toLocaleDateString()}</span>` : ''}
                        </div>
                        <div class="submission-actions">
                        <div class="submission-info">
                            <span class="technique-badge">${submission.technique}</span>
                                <div class="vote-counter">❤️ ${submission.votes || this.votingData[submission.student] || 0}</div>
                                ${!submission.isRevealed ? '<div class="anonymous-badge">🎭 Anonymous</div>' : ''}
                        </div>
                            <div class="action-buttons">
                                ${this.hasVoted(submission.id) ? 
                                    `<button class="btn btn-sm btn-voted" onclick="event.stopPropagation(); modelBuilder.toggleVoteForSubmission('${submission.student}')">
                                        <i class="fas fa-heart"></i> Liked
                                    </button>` :
                                    `<button class="btn btn-sm btn-vote" onclick="event.stopPropagation(); modelBuilder.toggleVoteForSubmission('${submission.student}')">
                                        <i class="far fa-heart"></i> Like
                                    </button>`
                                }
                    </div>
                </div>
                </div>
            </div>
            `;
        }).join('');

        gallery.innerHTML = galleryHTML;
    }

    // Instagram/TikTok Style Modal
    showInstagramModal(index) {
        const submission = this.classSubmissions[index];
        if (!submission) return;

        // Create Instagram/TikTok style modal
        const modal = document.createElement('div');
        modal.className = 'instagram-modal active';
        
        const displayName = submission.isRevealed ? submission.student : `Student ${index + 1}`;
        const votes = submission.votes || this.votingData[submission.student] || 0;
        
        modal.innerHTML = `
            <div class="instagram-modal-content">
                <button class="instagram-close" onclick="this.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                
                <div class="instagram-container">
                    <!-- Left side - Image -->
                    <div class="instagram-image-section" id="instagram-image-${index}">
                        <img src="${submission.imageUrl}" alt="Artwork" class="instagram-image">
                        <div class="instagram-overlay-info">
                            <div class="instagram-stats">
                                <div class="stat-item">
                                    <i class="fas fa-heart"></i>
                                    <span>${votes}</span>
                </div>
                                ${submission.isRevealed ? '' : '<div class="anonymous-indicator">🎭 Anonymous</div>'}
                    </div>
                        </div>
                        </div>
                        
                    <!-- Right side - Details -->
                    <div class="instagram-details-section">
                        <div class="instagram-header">
                            <div class="profile-section">
                                <div class="profile-avatar">
                                    ${submission.isRevealed ? '👨‍🎨' : '🎭'}
                                </div>
                                <div class="profile-info">
                                    <h3>${displayName}</h3>
                                    <span class="technique-tag">${submission.technique}</span>
                                </div>
                            </div>
                            ${!submission.isRevealed ? 
                                `<button class="reveal-btn" onclick="modelBuilder.revealInModal(${index}, this)">
                                    <i class="fas fa-eye"></i> Reveal Artist
                                </button>` : ''
                            }
                        </div>
                        
                        <div class="instagram-content">
                            <div class="content-section">
                                <h4>💭 Prompt</h4>
                                <p class="prompt-content">${submission.prompt}</p>
                            </div>
                            
                            <div class="content-section">
                                <h4>⚙️ Settings</h4>
                                <div class="settings-grid">
                                    <div class="setting-item">
                                        <span class="setting-label">Model</span>
                                        <span class="setting-value">${submission.parameters?.model || 'flux'}</span>
                                    </div>
                                    <div class="setting-item">
                                        <span class="setting-label">Temperature</span>
                                        <span class="setting-value">${submission.parameters?.temp || 'N/A'}</span>
                                    </div>
                                    <div class="setting-item">
                                        <span class="setting-label">Top-P</span>
                                        <span class="setting-value">${submission.parameters?.topP || 'N/A'}</span>
                                    </div>
                                    <div class="setting-item">
                                        <span class="setting-label">Top-K</span>
                                        <span class="setting-value">${submission.parameters?.topK || 'N/A'}</span>
                                    </div>
                            </div>
                        </div>
                        
                            ${submission.analysis ? `
                                <div class="content-section">
                                    <h4>✨ Reflection</h4>
                                    <p class="reflection-content">${submission.analysis}</p>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="instagram-actions">
                            ${this.hasVoted(submission.id) ? 
                                `<button class="action-btn voted" onclick="modelBuilder.toggleVoteFromModal('${submission.student}', this)">
                                    <i class="fas fa-heart"></i> Liked
                                </button>` :
                                `<button class="action-btn like-btn" onclick="modelBuilder.toggleVoteFromModal('${submission.student}', this)">
                                    <i class="far fa-heart"></i> Like
                                </button>`
                            }
                            
                            <div class="meta-info">
                                ${submission.submittedAt ? 
                                    `<span class="submit-time">${new Date(submission.submittedAt).toLocaleDateString()}</span>` : ''
                                }
                                ${submission.submissionCode ? 
                                    `<span class="submission-code">#${submission.submissionCode}</span>` : ''
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add double-tap to vote functionality (Instagram style)
        this.setupDoubleTapVote(index, submission);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Add keyboard support
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.removeEventListener('keydown', handleKeyPress);
            }
        };
        document.addEventListener('keydown', handleKeyPress);
    }

    async toggleVoteForSubmission(studentName) {
        // Find the submission by student name
        const submission = this.classSubmissions.find(s => s.student === studentName);
        if (!submission) {
            this.showNotification('Submission not found!', 'error');
            return;
        }

        // Check if already voted to determine action
        if (this.hasVoted(submission.id)) {
            await this.removeVoteForSubmission(studentName);
        } else {
            await this.voteForSubmission(studentName);
        }
    }

    async voteForSubmission(studentName) {
        // Find the submission by student name
        const submission = this.classSubmissions.find(s => s.student === studentName);
        if (!submission) {
            this.showNotification('Submission not found!', 'error');
            return;
        }

        // Check if already voted
        if (this.hasVoted(submission.id)) {
            // Notification disabled for better UX - voting status is shown visually
            // this.showNotification('You have already voted for this submission!', 'warning');
            return;
        }

        try {            
            // Try database voting first
            const voteResult = await dbHelper.voteForSubmission(submission.id, {
                voter_id: this.voterId,
                voter_fingerprint: this.voterFingerprint
            });

            // Update local state
            this.votedSubmissions.add(submission.id);
            this.votingData[studentName] = voteResult.votes;
            
            // Also update the submission object directly
            const submissionIndex = this.classSubmissions.findIndex(s => s.id === submission.id);
            if (submissionIndex !== -1) {
                this.classSubmissions[submissionIndex].votes = voteResult.votes;
            }

            // Update local storage as backup
            const localVotes = Array.from(this.votedSubmissions);
            localStorage.setItem('voted-submissions', JSON.stringify(localVotes));

            // Notification disabled for better UX - vote count is shown visually
            // this.showNotification(`Voted for ${studentName}'s artwork! Total votes: ${voteResult.votes}`, 'success');
            
            // Force refresh the gallery to show updated vote count
            this.updateSubmissionGallery();
            this.checkForWinnerReveal();
            
            // Also reload the submissions from database to ensure we have the latest vote counts
            setTimeout(() => {
                this.loadDatabaseSubmissions();
            }, 500);

        } catch (error) {
            if (error.message.includes('already voted')) {
                this.votedSubmissions.add(submission.id);
                // Notification disabled for better UX - voting status is shown visually
                // this.showNotification('You have already voted for this submission!', 'warning');
            } else {
                // Fallback to local voting
                this.voteForSubmissionLocal(studentName, submission.id);
            }
        }
    }

    voteForSubmissionLocal(studentName, submissionId) {
        // Check local voting record
        if (this.hasVoted(submissionId)) {
            // Notification disabled for better UX - voting status is shown visually
            // this.showNotification('You have already voted for this submission!', 'warning');
            return;
        }

        // Update local state
        if (!this.votingData[studentName]) {
            this.votingData[studentName] = 0;
        }
        this.votingData[studentName]++;
        this.votedSubmissions.add(submissionId);

        // Update local storage
        const localVotes = Array.from(this.votedSubmissions);
        localStorage.setItem('voted-submissions', JSON.stringify(localVotes));
        
        // Notification disabled for better UX - vote count is shown visually
        // this.showNotification(`Voted for ${studentName}'s artwork! Total votes: ${this.votingData[studentName]} (local mode)`, 'success');
        this.updateSubmissionGallery();
        this.checkForWinnerReveal();
    }

    async removeVoteForSubmission(studentName) {
        // Find the submission by student name
        const submission = this.classSubmissions.find(s => s.student === studentName);
        if (!submission) {
            this.showNotification('Submission not found!', 'error');
            return;
        }

        // Check if not voted
        if (!this.hasVoted(submission.id)) {
            return;
        }

        try {
            // Try database unlike first
            const unlikeResult = await dbHelper.removeVoteForSubmission(submission.id, {
                voter_id: this.voterId,
                voter_fingerprint: this.voterFingerprint
            });

            // Update local state
            this.votedSubmissions.delete(submission.id);
            this.votingData[studentName] = unlikeResult.votes;
            
            // Also update the submission object directly
            const submissionIndex = this.classSubmissions.findIndex(s => s.id === submission.id);
            if (submissionIndex !== -1) {
                this.classSubmissions[submissionIndex].votes = unlikeResult.votes;
            }

            // Update local storage as backup
            const localVotes = Array.from(this.votedSubmissions);
            localStorage.setItem('voted-submissions', JSON.stringify(localVotes));
            
            // Force refresh the gallery to show updated vote count
            this.updateSubmissionGallery();
            this.checkForWinnerReveal();
            
            // Also reload the submissions from database to ensure we have the latest vote counts
            setTimeout(() => {
                this.loadDatabaseSubmissions();
            }, 500);

        } catch (error) {
            console.error('Database unlike failed:', error);
            // Fallback to local unlike
            this.removeVoteLocalOnly(studentName, submission.id);
        }
    }

    removeVoteLocalOnly(studentName, submissionId) {
        // Check local voting record
        if (!this.hasVoted(submissionId)) {
            return;
        }

        // Update local state
        if (this.votingData[studentName] > 0) {
            this.votingData[studentName]--;
        }
        this.votedSubmissions.delete(submissionId);

        // Update local storage
        const localVotes = Array.from(this.votedSubmissions);
        localStorage.setItem('voted-submissions', JSON.stringify(localVotes));
        
        this.updateSubmissionGallery();
        this.checkForWinnerReveal();
    }

    // Support functions for Instagram modal
    revealInModal(index, button) {
        const submission = this.classSubmissions[index];
        if (!submission) return;

        // Mark as revealed
        submission.isRevealed = true;

        // Update gallery display
        this.updateSubmissionGallery();

        // Update the modal in real-time
        const modal = button.closest('.instagram-modal');
        if (modal) {
            // Update profile section
            const profileAvatar = modal.querySelector('.profile-avatar');
            const profileName = modal.querySelector('.profile-info h3');
            const anonymousIndicator = modal.querySelector('.anonymous-indicator');
            
            if (profileAvatar) profileAvatar.textContent = '👨‍🎨';
            if (profileName) profileName.textContent = submission.student;
            if (anonymousIndicator) anonymousIndicator.remove();
            
            // Remove reveal button
            button.remove();
        }
    }

    async toggleVoteFromModal(studentName, button) {
        const submission = this.classSubmissions.find(s => s.student === studentName);
        if (!submission) return;

        const wasVoted = this.hasVoted(submission.id);
        
        // Use existing toggle function
        await this.toggleVoteForSubmission(studentName);
        
        // Get the updated submission object after the vote/unlike operation
        const updatedSubmission = this.classSubmissions.find(s => s.student === studentName);
        
        // Update button state based on new vote status
        const isNowVoted = this.hasVoted(submission.id);
        
        if (isNowVoted) {
            button.innerHTML = '<i class="fas fa-heart"></i> Liked';
            button.className = 'action-btn voted';
        } else {
            button.innerHTML = '<i class="far fa-heart"></i> Like';
            button.className = 'action-btn like-btn';
        }
        
        // Update vote count in modal using the updated submission data
        const modal = button.closest('.instagram-modal');
        const voteCount = modal.querySelector('.stat-item span');
        if (voteCount && updatedSubmission) {
            // Use the most recent vote count from the updated submission object or voting data
            const votes = updatedSubmission.votes ?? this.votingData[studentName] ?? 0;
            voteCount.textContent = votes;
        }
    }

    // Legacy function for backward compatibility
    async voteFromModal(studentName, button) {
        return this.toggleVoteFromModal(studentName, button);
    }

    setupDoubleTapVote(index, submission) {
        const imageSection = document.getElementById(`instagram-image-${index}`);
        if (!imageSection) return;

        let lastTap = 0;
        let tapTimeout;

        imageSection.addEventListener('click', async (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            
            clearTimeout(tapTimeout);
            
            if (tapLength < 500 && tapLength > 0) {
                // Double tap detected!
                e.preventDefault();
                
                const wasVoted = this.hasVoted(submission.id);
                
                // Show appropriate animation
                this.showHeartAnimation(e.pageX, e.pageY, !wasVoted);
                
                // Toggle vote for the submission
                await this.toggleVoteForSubmission(submission.student);
                
                // Update the modal UI
                this.updateModalAfterToggle(submission);
                
            } else {
                // Single tap - do nothing (just show image)
                tapTimeout = setTimeout(() => {
                    // Single tap action could go here if needed
                }, 500);
            }
            
            lastTap = currentTime;
        });
    }

    showHeartAnimation(x, y, isLiking) {
        const heart = document.createElement('div');
        heart.className = 'floating-heart';
        
        if (isLiking) {
            // Liking animation - red heart
            heart.innerHTML = '❤️';
            heart.style.animation = 'heartFloat 1.5s ease-out forwards';
        } else {
            // Unliking animation - broken heart
            heart.innerHTML = '💔';
            heart.style.animation = 'heartBreak 1.5s ease-out forwards';
        }
        
        heart.style.left = (x - 25) + 'px';
        heart.style.top = (y - 25) + 'px';
        heart.style.position = 'fixed';
        heart.style.fontSize = '50px';
        heart.style.pointerEvents = 'none';
        heart.style.zIndex = '10002';
        
        document.body.appendChild(heart);
        
        // Remove heart after animation
        setTimeout(() => {
            if (heart.parentNode) {
                heart.parentNode.removeChild(heart);
            }
        }, 1500);
    }

    updateModalAfterToggle(submission) {
        const modal = document.querySelector('.instagram-modal');
        if (!modal) return;
        
        // Get the most current submission data
        const currentSubmission = this.classSubmissions.find(s => s.id === submission.id || s.student === submission.student);
        
        // Update vote count
        const voteCount = modal.querySelector('.stat-item span');
        if (voteCount && currentSubmission) {
            const votes = currentSubmission.votes ?? this.votingData[currentSubmission.student] ?? 0;
            voteCount.textContent = votes;
        }
        
        // Update like button based on current vote status
        const actionBtn = modal.querySelector('.action-btn');
        if (actionBtn && currentSubmission) {
            const isVoted = this.hasVoted(currentSubmission.id);
            if (isVoted) {
                actionBtn.innerHTML = '<i class="fas fa-heart"></i> Liked';
                actionBtn.className = 'action-btn voted';
            } else {
                actionBtn.innerHTML = '<i class="far fa-heart"></i> Like';
                actionBtn.className = 'action-btn like-btn';
            }
        }
    }

    // Legacy function for backward compatibility
    updateModalAfterVote(submission) {
        return this.updateModalAfterToggle(submission);
    }

    // Legacy function - now redirects to Instagram modal
    showRevealModal(submission) {
        const index = this.classSubmissions.findIndex(s => s.id === submission.id || s.student === submission.student);
        if (index >= 0) {
            this.showInstagramModal(index);
        }
    }

    // Results & Competition Functions
    calculateVotingResults() {
        if (Object.keys(this.votingData).length === 0) {
            this.showNotification('No votes cast yet!', 'warning');
            return;
        }

        const sortedResults = Object.entries(this.votingData)
            .sort(([,a], [,b]) => b - a)
            .map(([student, votes]) => ({ student, votes }));

        const winnerDisplay = document.getElementById('winnerDisplay');
        const votingResults = document.getElementById('votingResults');

        if (winnerDisplay && votingResults) {
            const winner = sortedResults[0];
            const winnerSubmission = this.classSubmissions.find(s => s.student === winner.student);

            winnerDisplay.innerHTML = `
                <div class="winner-announcement">
                    <h4>🏆 Winner: ${winner.student}</h4>
                    <div class="winner-artwork">
                        <img src="${winnerSubmission.imageUrl}" alt="Winning artwork" class="winner-image">
                    </div>
                    <p><strong>Total Votes:</strong> ${winner.votes}</p>
                    <p><strong>Technique Used:</strong> ${winnerSubmission.technique}</p>
                </div>
                <div class="full-results">
                    <h5>📊 Complete Results:</h5>
                    <ol>
                        ${sortedResults.map(result => `
                            <li>${result.student}: ${result.votes} votes</li>
                        `).join('')}
                    </ol>
                </div>
            `;
            
            votingResults.style.display = 'block';
        }

        this.showNotification('Voting results calculated!', 'success');
    }

    showAllReveals() {
        const revealDisplay = document.getElementById('revealDisplay');
        if (!revealDisplay) return;

        const revealsHTML = this.classSubmissions.map(submission => `
            <div class="reveal-summary">
                <img src="${submission.imageUrl}" alt="${submission.student}'s work" class="reveal-thumb">
                <div class="reveal-details">
                    <h6>${submission.student}</h6>
                    <p>Technique: ${submission.technique}</p>
                    <p>Votes: ${this.votingData[submission.student] || 0}</p>
                </div>
            </div>
        `).join('');

        revealDisplay.innerHTML = `
            <div class="all-reveals">
                <h4>🎭 All Artist Reveals</h4>
                <div class="reveals-grid">
                    ${revealsHTML}
                </div>
            </div>
        `;

        this.showNotification('All artists revealed!', 'success');
    }

    exportClassResults() {
        const results = {
            submissions: this.classSubmissions,
            votes: this.votingData,
            timestamp: new Date().toISOString(),
            totalStudents: this.classSubmissions.length,
            totalVotes: Object.values(this.votingData).reduce((a, b) => a + b, 0)
        };

        const dataStr = JSON.stringify(results, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `class-results-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.showNotification('Class results exported!', 'success');
    }

    // Copy Helper Functions
    copySubmissionCode(code, button) {
        navigator.clipboard.writeText(code).then(() => {
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Copied!';
            button.style.background = '#059669';
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.background = '';
            }, 2000);
        }).catch(err => {
                            // Copy failed
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = code;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            
            const originalHTML = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i> Copied!';
            button.style.background = '#059669';
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.style.background = '';
            }, 2000);
        });
    }

    // Instructor Helper Functions
    setAssignmentFromPrompt() {
        const requirements = prompt('Enter assignment requirements for students:');
        if (requirements) {
            this.setAssignmentRequirements(requirements);
        }
    }

    loadDefaultAssignment() {
        // Create properly formatted HTML content
        const assignmentElement = document.getElementById('imageRequirements');
        if (!assignmentElement) return;
        
        assignmentElement.innerHTML = `
            <div class="assignment-header">
                <h3>ASSIGNMENT: "The Impossible Restaurant"</h3>
            </div>
            
            <div class="assignment-section">
                <h4>Your Challenge:</h4>
                <p>Design a restaurant that could never exist in real life - but make it look absolutely believable and professionally photographed. You must combine impossible elements with realistic execution.</p>
            </div>
            
            <div class="assignment-section">
                <h4>Mandatory Requirements:</h4>
                <ul class="requirement-list">
                    <li><strong>Impossible Physics:</strong> Floating tables, upside-down dining, gravity-defying elements</li>
                    <li><strong>Impossible Scale:</strong> Tiny giant furniture OR giant tiny people OR impossible size relationships</li>
                    <li><strong>Impossible Materials:</strong> Glass made of water, solid air, liquid metal, crystallized light</li>
                    <li><strong>Realistic Execution:</strong> Professional photography quality, proper lighting, believable textures</li>
                    <li><strong>Clear Atmosphere:</strong> Customers should look natural despite the impossible setting</li>
                </ul>
            </div>
            
            <div class="assignment-section">
                <h4>Technical Requirements:</h4>
                <ul class="requirement-list">
                    <li>Use <strong>advanced prompting techniques</strong> - Zero-shot won't be enough!</li>
                    <li>Experiment with <strong>parameter combinations</strong> for maximum creativity</li>
                    <li><strong>Quality threshold:</strong> Must look like a real architectural photography shoot</li>
                    <li>Include <strong>human elements</strong> (customers, staff) for scale and believability</li>
                </ul>
            </div>
            
            <div class="assignment-section">
                <h4>Judging Criteria:</h4>
                <ul class="scoring-list">
                    <li><strong>Impossibility Factor (30%):</strong> How mind-bending is your concept?</li>
                    <li><strong>Technical Execution (30%):</strong> Professional quality and realism</li>
                    <li><strong>Creative Integration (25%):</strong> How well impossible + realistic blend</li>
                    <li><strong>Prompting Mastery (15%):</strong> Evidence of advanced techniques</li>
                </ul>
            </div>
            
            <div class="assignment-section examples-section">
                <h4>Examples of Impossible Restaurants:</h4>
                <ul class="examples-list">
                    <li>A restaurant inside a soap bubble floating in space</li>
                    <li>Dining room where each table exists in a different season</li>
                    <li>Restaurant with edible architecture (chocolate walls, bread floor)</li>
                    <li>Underwater restaurant with air-breathing fish as waiters</li>
                    <li>Restaurant existing in multiple dimensions simultaneously</li>
                </ul>
            </div>
            
            <div class="assignment-footer">
                <div class="challenge-note">
                    <h4>Challenge Level:</h4>
                    <p>This requires creativity, technical skill, and prompting mastery. Basic prompts will fail. You'll need to combine techniques and experiment with parameters!</p>
                </div>
                <div class="ready-note">
                    <h4>Ready?</h4>
                    <p>Start in the <strong>Playground</strong> to experiment, then submit your masterpiece!</p>
                </div>
            </div>
        `;
    }

    // Winner Reveal System with Confetti
    async revealWinners() {
        if (this.classSubmissions.length < 3) {
            this.showNotification('Need at least 3 submissions to reveal winners!', 'warning');
            return;
        }

        // Refresh submissions from database to get latest vote counts
        try {
            await this.loadDatabaseSubmissions();
        } catch (error) {
            // Could not refresh from database, using current data
        }

        // Check if we have any votes (either in database or local)
        const totalDatabaseVotes = this.classSubmissions.reduce((sum, sub) => sum + (parseInt(sub.votes) || 0), 0);
        const totalLocalVotes = Object.values(this.votingData).reduce((sum, votes) => sum + votes, 0);
        
        if (totalDatabaseVotes === 0 && totalLocalVotes === 0) {
            this.showNotification('No votes cast yet! Cast some votes first.', 'warning');
            return;
        }

        // Calculate top 3 using DATABASE vote counts (primary) with local fallback
        const sortedResults = this.classSubmissions
            .map(submission => {
                const databaseVotes = parseInt(submission.votes) || 0;
                const localVotes = this.votingData[submission.student] || 0;
                const finalVotes = databaseVotes > 0 ? databaseVotes : localVotes; // Prefer database votes
                
                return {
                    student: submission.student,
                    votes: finalVotes,
                    submission: submission,
                    source: databaseVotes > 0 ? 'database' : 'local'
                };
            })
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 3);

        // Start confetti
        this.startConfetti();

        // Show winner modal
        setTimeout(() => {
            this.showWinnerModal(sortedResults);
        }, 500);

        this.showNotification(`🎉 Winners revealed with confetti celebration! Using ${sortedResults[0]?.source} vote data. 🎉`, 'success');
    }

    showWinnerModal(winners) {
        const modal = document.getElementById('winnerModal');
        if (!modal) return;

        // Populate winner data
        const [first, second, third] = winners;

        if (first) {
            document.getElementById('firstPlaceImage').src = first.submission.imageUrl;
            document.getElementById('firstPlaceName').textContent = first.student;
            document.getElementById('firstPlaceVotes').textContent = `${first.votes} votes`;
            document.getElementById('firstPlaceTechnique').textContent = first.submission.technique;
        }

        if (second) {
            document.getElementById('secondPlaceImage').src = second.submission.imageUrl;
            document.getElementById('secondPlaceName').textContent = second.student;
            document.getElementById('secondPlaceVotes').textContent = `${second.votes} votes`;
            document.getElementById('secondPlaceTechnique').textContent = second.submission.technique;
        }

        if (third) {
            document.getElementById('thirdPlaceImage').src = third.submission.imageUrl;
            document.getElementById('thirdPlaceName').textContent = third.student;
            document.getElementById('thirdPlaceVotes').textContent = `${third.votes} votes`;
            document.getElementById('thirdPlaceTechnique').textContent = third.submission.technique;
        }

        modal.classList.add('active');
    }

    closeWinnerModal() {
        const modal = document.getElementById('winnerModal');
        if (modal) {
            modal.classList.remove('active');
        }
        this.stopConfetti();
    }

    // Confetti System
    setupConfetti() {
        this.canvas = document.getElementById('confettiCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.confettiParticles = [];
        this.animationId = null;

        // Resize canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    startConfetti() {
        if (!this.canvas || !this.ctx) {
            this.setupConfetti();
        }

        // Create confetti particles
        this.confettiParticles = [];
        for (let i = 0; i < 150; i++) {
            this.confettiParticles.push(this.createConfettiParticle());
        }

        // Start animation
        this.animateConfetti();
    }

    createConfettiParticle() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
        return {
            x: Math.random() * this.canvas.width,
            y: -10,
            width: Math.random() * 10 + 5,
            height: Math.random() * 10 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            speed: Math.random() * 3 + 2,
            angle: Math.random() * 360,
            spin: Math.random() * 10 - 5,
            gravity: 0.1
        };
    }

    animateConfetti() {
        if (!this.ctx || !this.canvas) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.confettiParticles.length - 1; i >= 0; i--) {
            const particle = this.confettiParticles[i];

            // Update particle
            particle.y += particle.speed;
            particle.x += Math.sin(particle.angle) * 2;
            particle.angle += particle.spin;
            particle.speed += particle.gravity;

            // Draw particle
            this.ctx.save();
            this.ctx.translate(particle.x + particle.width / 2, particle.y + particle.height / 2);
            this.ctx.rotate(particle.angle * Math.PI / 180);
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(-particle.width / 2, -particle.height / 2, particle.width, particle.height);
            this.ctx.restore();

            // Remove particles that are off screen
            if (particle.y > this.canvas.height + 10) {
                this.confettiParticles.splice(i, 1);
            }
        }

        // Continue animation if particles exist
        if (this.confettiParticles.length > 0) {
            this.animationId = requestAnimationFrame(() => this.animateConfetti());
        }
    }

    stopConfetti() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.confettiParticles = [];
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    // Show winner reveal button when submissions are loaded and votes are cast
    checkForWinnerReveal() {
        const winnerSection = document.getElementById('winnerRevealSection');
        const hasEnoughSubmissions = this.classSubmissions.length >= 3;
        
        // Check for votes in database OR local voting data
        const totalDatabaseVotes = this.classSubmissions.reduce((sum, sub) => sum + (parseInt(sub.votes) || 0), 0);
        const totalLocalVotes = Object.values(this.votingData).reduce((sum, votes) => sum + votes, 0);
        const hasVotes = totalDatabaseVotes > 0 || totalLocalVotes > 0;
        
        // Check winner reveal criteria
        
        if (winnerSection && hasEnoughSubmissions && hasVotes) {
            winnerSection.style.display = 'block';
        } else if (winnerSection) {
            winnerSection.style.display = 'none';
        }
    }

    // Anonymous Voter System
    initializeVoter() {
        // Get or create a unique voter ID
        this.voterId = localStorage.getItem('ai-prompt-voter-id');
        if (!this.voterId) {
            this.voterId = this.generateVoterId();
            localStorage.setItem('ai-prompt-voter-id', this.voterId);
        }

        // Generate browser fingerprint for additional protection
        this.voterFingerprint = this.generateFingerprint();
        
        // Voter initialized
    }

    generateVoterId() {
        // Create a unique voter ID based on timestamp, random values, and browser characteristics
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        const browserInfo = navigator.userAgent.substring(0, 20);
        const screenInfo = `${screen.width}x${screen.height}`;
        
        return btoa(`${timestamp}-${random}-${browserInfo}-${screenInfo}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
    }

    generateFingerprint() {
        // Create a browser fingerprint for backup duplicate protection
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Browser fingerprint', 2, 2);
        
        const fingerprint = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
            screen: `${screen.width}x${screen.height}x${screen.colorDepth}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            canvas: canvas.toDataURL(),
            timestamp: Date.now()
        };
        
        return btoa(JSON.stringify(fingerprint)).substring(0, 100);
    }

    async checkVotingStatus(submissionIds) {
        try {
            const result = await dbHelper.checkVotes(this.voterId, submissionIds);
            this.votedSubmissions = new Set(result.voted_submissions);
            return result.voted_submissions;
        } catch (error) {
            // Could not check voting status from database, using local storage
            // Fallback to local storage
            const localVotes = JSON.parse(localStorage.getItem('voted-submissions') || '[]');
            this.votedSubmissions = new Set(localVotes);
            return localVotes;
        }
    }

    hasVoted(submissionId) {
        return this.votedSubmissions.has(submissionId);
    }

    // User Tracking for Playground Analytics
    initializeUserTracking() {
        // Generate session ID if not exists
        if (!this.userSessionId) {
            this.userSessionId = this.generateSessionId();
            sessionStorage.setItem('user-session-id', this.userSessionId);
        }
        
        // Generate comprehensive browser fingerprint
        this.userFingerprint = this.generateBrowserFingerprint();
        
        // Collect detailed browser information
        this.browserInfo = this.collectBrowserInfo();
        
        // Store in session storage for consistency during session
        sessionStorage.setItem('user-fingerprint', this.userFingerprint);
        sessionStorage.setItem('browser-info', JSON.stringify(this.browserInfo));
    }

    generateSessionId() {
        // Check session storage first
        const existing = sessionStorage.getItem('user-session-id');
        if (existing) {
            this.userSessionId = existing;
            return existing;
        }
        
        // Generate new session ID
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `session_${timestamp}_${random}`;
    }

    generateBrowserFingerprint() {
        // Check session storage first
        const existing = sessionStorage.getItem('user-fingerprint');
        if (existing) {
            this.userFingerprint = existing;
            return existing;
        }
        
        // Collect fingerprint components
        const components = [];
        
        // Screen information
        components.push(screen.width);
        components.push(screen.height);
        components.push(screen.colorDepth);
        components.push(screen.pixelDepth);
        
        // Browser information
        components.push(navigator.userAgent);
        components.push(navigator.language);
        components.push(navigator.languages?.join(',') || '');
        components.push(navigator.platform);
        components.push(navigator.cookieEnabled);
        components.push(navigator.doNotTrack);
        
        // Timezone
        components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);
        
        // Browser features
        components.push(typeof localStorage !== 'undefined');
        components.push(typeof sessionStorage !== 'undefined');
        components.push(typeof indexedDB !== 'undefined');
        components.push(typeof WebGL2RenderingContext !== 'undefined');
        
        // Canvas fingerprinting (basic)
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            ctx.textBaseline = 'top';
            ctx.font = '14px Arial';
            ctx.fillText('Browser fingerprint', 2, 2);
            components.push(canvas.toDataURL());
        } catch (e) {
            components.push('canvas-error');
        }
        
        // WebGL fingerprinting (basic)
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (gl) {
                components.push(gl.getParameter(gl.VENDOR));
                components.push(gl.getParameter(gl.RENDERER));
            }
        } catch (e) {
            components.push('webgl-error');
        }
        
        // Hash all components
        const fingerprint = this.hashString(components.join('|'));
        return fingerprint;
    }

    collectBrowserInfo() {
        return {
            userAgent: navigator.userAgent,
            language: navigator.language,
            languages: navigator.languages || [],
            platform: navigator.platform,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            features: {
                localStorage: typeof localStorage !== 'undefined',
                sessionStorage: typeof sessionStorage !== 'undefined',
                indexedDB: typeof indexedDB !== 'undefined',
                webGL: typeof WebGL2RenderingContext !== 'undefined',
                touchSupport: 'ontouchstart' in window,
                geolocation: 'geolocation' in navigator
            },
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null,
            timestamp: new Date().toISOString()
        };
    }

    hashString(str) {
        let hash = 0;
        if (str.length === 0) return hash.toString();
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }

    // Wiki Modal Functions
    checkWikiModal() {
        const wikiShown = localStorage.getItem('ai-prompt-master-wiki-shown');
        if (!wikiShown) {
            // Show wiki modal on first visit
            this.openWikiModal();
        } else {
            // Hide wiki modal if already shown
            const wikiModal = document.getElementById('wikiModal');
            if (wikiModal) {
                wikiModal.classList.remove('active');
            }
        }
    }

    openWikiModal() {
        const wikiModal = document.getElementById('wikiModal');
        if (wikiModal) {
            wikiModal.classList.add('active');
        }
    }

    closeWikiModal() {
        const wikiModal = document.getElementById('wikiModal');
        if (wikiModal) {
            wikiModal.classList.remove('active');
            // Remember that user has seen the wiki
            localStorage.setItem('ai-prompt-master-wiki-shown', 'true');
        }
    }

    // Playground Gallery Methods
    initializePlaygroundGallery() {
        this.galleryCurrentPage = 1;
        this.galleryLoading = false;
        this.galleryHasMore = true;
        
        // Setup filter change handler
        const filterSelect = document.getElementById('galleryTechniqueFilter');
        if (filterSelect) {
            filterSelect.addEventListener('change', () => {
                this.filterGallery();
            });
        }
        
        // Load initial gallery count
        this.updateGalleryCount();
    }

    async saveToPlaygroundGallery(model) {
        if (!model || !model.imageUrl || !model.originalPrompt || !model.technique) {
            return;
        }

        try {
            // Initialize user tracking if not already done
            if (!this.userFingerprint || !this.userSessionId) {
                this.initializeUserTracking();
            }

            // Prepare user tracking data
            const userTracking = {
                fingerprint: this.userFingerprint || 'unknown',
                session_id: this.userSessionId || 'unknown',
                browser_info: this.browserInfo || {}
            };

            const response = await fetch('/api/playground-gallery', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    image_url: model.imageUrl,
                    prompt: model.originalPrompt,
                    technique: model.technique,
                    parameters: {
                        temperature: model.parameters.temp,
                        topP: model.parameters.topP,
                        topK: model.parameters.topK,
                        model: model.parameters.model,
                        seed: model.parameters.seed
                    },
                    user_tracking: userTracking
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.exists) {
                this.updateGalleryCount();
            }
        } catch (error) {
            console.error('Error saving to playground gallery:', error);
        }
    }

    async updateGalleryCount() {
        // Gallery count badge has been removed - this function is kept for compatibility
        // but no longer displays the count
    }

    async togglePlaygroundGallery() {
        const gallery = document.getElementById('playgroundGallery');
        if (!gallery) {
            console.error('Gallery element not found');
            return;
        }
        
        const isVisible = gallery.classList.contains('active');
        
        if (isVisible) {
            gallery.classList.remove('active');
            setTimeout(() => {
                gallery.style.display = 'none';
            }, 400);
            
            // Stop auto-refresh when gallery is closed
            this.stopAutoRefresh();
        } else {
            gallery.style.display = 'block';
            setTimeout(() => {
                gallery.classList.add('active');
            }, 10);
            
            // Initialize gallery if not already loaded
            if (!this.galleryLoaded) {
                await this.initializeCreativeGallery();
                this.galleryLoaded = true;
            } else {
                // Always restart auto-refresh when reopening gallery
                this.stopAutoRefresh(); // Stop any existing interval
                this.setupAutoRefresh(); // Start fresh
                
                // Also update the gallery count and check for new images immediately
                await this.updateGalleryCount();
                await this.checkForNewImages();
            }
        }
    }

    async initializeCreativeGallery() {
        // Initialize gallery state
        this.galleryCurrentPage = 1;
        this.galleryHasMore = true;
        this.galleryImages = [];
        this.filteredImages = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.lastImageCount = 0;
        
        // Setup search functionality
        this.setupGallerySearch();
        
        // Setup filter pills
        this.setupFilterPills();
        
        // Setup intersection observer for infinite scroll
        this.setupInfiniteScroll();
        
        // Setup auto-refresh for new images
        this.setupAutoRefresh();
        
        // Load initial images
        await this.loadGalleryImages();
    }

    setupGallerySearch() {
        const searchInput = document.getElementById('gallerySearchInput');
        const clearBtn = document.getElementById('clearSearchBtn');
        
        if (!searchInput) return;
        
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.filterGalleryImages();
                
                // Show/hide clear button
                clearBtn.style.display = this.searchQuery ? 'block' : 'none';
            }, 300);
        });
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                this.searchQuery = '';
                clearBtn.style.display = 'none';
                this.filterGalleryImages();
            });
        }
    }

    setupFilterPills() {
        const pills = document.querySelectorAll('.filter-pill');
        pills.forEach(pill => {
            pill.addEventListener('click', () => {
                // Remove active class from all pills
                pills.forEach(p => p.classList.remove('active'));
                
                // Add active class to clicked pill
                pill.classList.add('active');
                
                // Update filter
                this.currentFilter = pill.dataset.filter;
                this.filterGalleryImages();
            });
        });
    }

    setupInfiniteScroll() {
        const trigger = document.getElementById('galleryLoadTrigger');
        if (!trigger) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && this.galleryHasMore && !this.galleryLoading) {
                    this.loadMoreGalleryImages();
                }
            });
        }, {
            rootMargin: '100px'
        });
        
        observer.observe(trigger);
    }

    setupAutoRefresh() {
        // Stop any existing interval first
        this.stopAutoRefresh();
        
        // Initialize countdown
        this.refreshCountdown = 10;
        
        // Auto-refresh gallery every 10 seconds to check for new images
        this.autoRefreshInterval = setInterval(async () => {
            try {
                await this.refreshGalleryData();
                await this.updateGalleryCount();
                this.refreshCountdown = 10; // Reset countdown after refresh
            } catch (error) {
                console.log('Auto-refresh check failed:', error);
            }
        }, 10000); // 10 seconds
        
        // Update countdown timer every second
        this.countdownInterval = setInterval(() => {
            this.refreshCountdown--;
            this.updateCountdownDisplay();
            
            if (this.refreshCountdown <= 0) {
                this.refreshCountdown = 10; // Reset for next cycle
            }
        }, 1000);
        
        // Add visual indicator that auto-refresh is active
        this.showAutoRefreshIndicator(true);
    }

    async checkForNewImages() {
        if (this.galleryLoading) {
            return;
        }
        
        try {
            // Get current total count from server
            const response = await fetch('/api/playground-gallery?page=1&limit=1');
            const data = await response.json();
            
            const currentTotal = data.pagination.total;
            
            // Initialize lastImageCount if not set
            if (this.lastImageCount === 0 && currentTotal > 0) {
                this.lastImageCount = currentTotal;
                return;
            }
            
            // Always refresh to catch any changes
            if (this.lastImageCount > 0) {
                await this.refreshGalleryData();
                
                // If we have new images, show notification
                if (currentTotal > this.lastImageCount) {
                    const newImageCount = currentTotal - this.lastImageCount;
                    this.showNewImageNotification(newImageCount);
                }
            }
            
            this.lastImageCount = currentTotal;
            this.updateGalleryCount();
            
        } catch (error) {
            console.error('Error checking for new images:', error);
        }
    }

    async refreshGalleryData() {
        // Store current scroll position
        const container = document.querySelector('.masonry-gallery-container');
        const scrollTop = container ? container.scrollTop : 0;
        
        try {
            // Fetch fresh data from API
            const response = await fetch('/api/playground-gallery?page=1&limit=100');
            const data = await response.json();
            
            // Replace gallery data completely
            this.galleryImages = data.images || [];
            this.galleryCurrentPage = 1;
            this.galleryHasMore = data.pagination?.hasMore || false;
            
            // Update filter counts and display
            this.updateFilterCounts();
            this.filterGalleryImages();
            
            // Restore scroll position
            if (container) {
                setTimeout(() => {
                    container.scrollTop = scrollTop;
                }, 100);
            }
            
        } catch (error) {
            console.error('Error refreshing gallery:', error);
        }
    }

    showNewImageNotification(count) {
        // Create a subtle floating notification
        const notification = document.createElement('div');
        notification.className = 'new-image-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-palette"></i>
                <span>${count} new artwork${count > 1 ? 's' : ''} added!</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('visible');
        }, 100);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 4000);
    }

    // Clean up auto-refresh when gallery is closed
    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
        
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        
        // Remove visual indicator
        this.showAutoRefreshIndicator(false);
    }

    showAutoRefreshIndicator(show) {
        const galleryTitle = document.querySelector('.gallery-title-section p');
        if (!galleryTitle) return;
        
        if (show) {
            if (!galleryTitle.textContent.includes('Live Updates')) {
                galleryTitle.innerHTML = galleryTitle.innerHTML + ' <span class="auto-refresh-indicator">• Live Updates Active <span class="countdown-timer">(10s)</span> <button class="manual-refresh-btn" onclick="modelBuilder.manualRefresh()">🔄</button></span>';
                // Start countdown display immediately
                this.updateCountdownDisplay();
            }
        } else {
            const indicator = galleryTitle.querySelector('.auto-refresh-indicator');
            if (indicator) {
                indicator.remove();
            }
        }
    }

    async manualRefresh() {
        this.refreshCountdown = 10; // Reset countdown
        
        // Direct refresh without checking for new images first
        await this.refreshGalleryData();
        await this.updateGalleryCount();
        
        this.updateCountdownDisplay();
    }

    updateCountdownDisplay() {
        const countdownElement = document.querySelector('.countdown-timer');
        if (countdownElement) {
            countdownElement.textContent = `(${this.refreshCountdown}s)`;
        }
    }

    async loadGalleryImages(page = 1, reset = false) {
        if (this.galleryLoading) return;
        
        this.galleryLoading = true;
        const loadingEl = document.getElementById('galleryLoading');
        const triggerEl = document.getElementById('galleryLoadTrigger');
        
        if (loadingEl) loadingEl.style.display = 'block';
        if (triggerEl) triggerEl.style.display = 'none';

        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20'
            });

            const response = await fetch(`/api/playground-gallery?${params}`);
            const data = await response.json();

            if (reset) {
                this.galleryImages = [];
            }

            if (data.images && data.images.length > 0) {
                this.galleryImages.push(...data.images);
            }

            // Update pagination
            this.galleryCurrentPage = page;
            this.galleryHasMore = data.pagination.hasMore;
            
            // Update filter counts and display images
            this.updateFilterCounts();
            this.filterGalleryImages();
            
            if (this.galleryHasMore) {
                if (triggerEl) triggerEl.style.display = 'block';
            }

        } catch (error) {
            console.error('Error loading gallery images:', error);
            this.showNotification('Error loading gallery images', 'error');
        } finally {
            this.galleryLoading = false;
            if (loadingEl) loadingEl.style.display = 'none';
        }
    }

    updateFilterCounts() {
        const counts = {
            all: this.galleryImages.length,
            'zero-shot': 0,
            'few-shot': 0,
            'chain-thought': 0,
            'role-play': 0,
            'structured': 0
        };
        
        this.galleryImages.forEach(image => {
            if (counts.hasOwnProperty(image.technique)) {
                counts[image.technique]++;
            }
        });
        
        // Update pill counts
        Object.keys(counts).forEach(key => {
            const countEl = document.getElementById(`count${key.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)).join('')}`);
            if (countEl) {
                countEl.textContent = counts[key];
            }
        });
    }

    filterGalleryImages() {
        let filtered = this.galleryImages;
        
        // Apply technique filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(image => image.technique === this.currentFilter);
        }
        
        // Apply search filter
        if (this.searchQuery) {
            filtered = filtered.filter(image => {
                const searchText = `${image.prompt} ${image.technique}`.toLowerCase();
                return searchText.includes(this.searchQuery);
            });
        }
        
        this.filteredImages = filtered;
        this.renderGalleryGrid();
    }

    renderGalleryGrid() {
        const grid = document.getElementById('playgroundGalleryGrid');
        const emptyState = document.getElementById('galleryEmptyState');
        
        if (!grid) {
            console.error('Gallery grid element not found');
            return;
        }
        
        // Clear existing content
        grid.innerHTML = '';
        
        if (this.filteredImages.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        // Render each image item
        this.filteredImages.forEach((image, index) => {
            try {
                const item = this.createModernGalleryItem(image, index);
                grid.appendChild(item);
            } catch (error) {
                console.error('Error creating gallery item:', error, image);
            }
        });
    }

    createModernGalleryItem(image, index) {
        const item = document.createElement('div');
        item.className = 'modern-gallery-item';
        
        const params = typeof image.parameters === 'string' ? 
            JSON.parse(image.parameters) : image.parameters;
        
        const createdDate = new Date(image.created_at);
        const formattedDate = createdDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        
        item.innerHTML = `
            <img src="${image.image_url}" alt="Generated artwork" class="modern-gallery-image" loading="lazy">
            <div class="modern-gallery-content">
                <div class="modern-gallery-technique">${this.formatTechnique(image.technique)}</div>
                <div class="modern-gallery-prompt">${image.prompt}</div>
                <div class="modern-gallery-meta">
                    <div class="modern-gallery-date">
                        <i class="fas fa-calendar-alt"></i>
                        <span>${formattedDate}</span>
                    </div>
                    <div class="modern-gallery-model">${params.model || 'flux'}</div>
                </div>
            </div>
        `;

        // Add staggered animation delay
        item.style.animationDelay = `${(index % 20) * 0.1}s`;

        // Add click handler for modal
        item.addEventListener('click', () => {
            this.showCreativeGalleryModal(image);
        });

        return item;
    }

    // Keep legacy function for compatibility
    createGalleryItem(image) {
        return this.createModernGalleryItem(image, 0);
    }

    formatTechnique(technique) {
        const techniqueMap = {
            'zero-shot': 'Zero-Shot',
            'few-shot': 'Few-Shot',
            'chain-thought': 'Chain-of-Thought',
            'role-play': 'Role-Play',
            'structured': 'Structured'
        };
        return techniqueMap[technique] || technique;
    }

    showCreativeGalleryModal(image) {
        const params = typeof image.parameters === 'string' ? 
            JSON.parse(image.parameters) : image.parameters;
        
        // Create enhanced creative gallery modal
        const modal = document.createElement('div');
        modal.className = 'instagram-modal active';
        
        const createdDate = new Date(image.created_at);
        const formattedDateTime = createdDate.toLocaleDateString('en-US', { 
            year: 'numeric',
            month: 'long', 
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
        
        modal.innerHTML = `
            <div class="instagram-modal-content">
                <button class="instagram-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
                
                <div class="instagram-container">
                    <!-- Left side - Image -->
                    <div class="instagram-image-section">
                        <img src="${image.image_url}" alt="Generated artwork" class="instagram-image">
                        <div class="instagram-overlay-info">
                            <div class="instagram-stats">
                                <div class="stat-item">
                                    <i class="fas fa-palette"></i>
                                    <span>Creative Gallery</span>
                                </div>
                                <div class="anonymous-indicator">✨ Community Masterpiece</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Right side - Details -->
                    <div class="instagram-details-section">
                        <div class="instagram-header">
                            <div class="profile-section">
                                <div class="profile-avatar">
                                    🎨
                                </div>
                                <div class="profile-info">
                                    <h3>Anonymous Creator</h3>
                                    <span class="technique-tag">${this.formatTechnique(image.technique)} Technique</span>
                                </div>
                            </div>
                            <div class="technique-badge-modal">
                                <i class="fas fa-magic"></i>
                                ${this.formatTechnique(image.technique)}
                            </div>
                        </div>
                        
                        <div class="instagram-content">
                            <div class="content-section">
                                <h4>💭 Creative Prompt</h4>
                                <p class="prompt-content">${image.prompt}</p>
                            </div>
                            
                            <div class="content-section">
                                <h4>🎛️ Generation Settings</h4>
                                <div class="settings-grid">
                                    <div class="setting-item">
                                        <span class="setting-label">AI Model</span>
                                        <span class="setting-value">${(params.model || 'flux').toUpperCase()}</span>
                                    </div>
                                    <div class="setting-item">
                                        <span class="setting-label">Temperature</span>
                                        <span class="setting-value">${params.temperature}</span>
                                    </div>
                                    <div class="setting-item">
                                        <span class="setting-label">Top-P</span>
                                        <span class="setting-value">${params.topP}</span>
                                    </div>
                                    <div class="setting-item">
                                        <span class="setting-label">Top-K</span>
                                        <span class="setting-value">${params.topK}</span>
                                    </div>
                                    ${params.seed ? `
                                    <div class="setting-item">
                                        <span class="setting-label">Seed</span>
                                        <span class="setting-value">${params.seed}</span>
                                    </div>
                                    ` : ''}
                                </div>
                            </div>

                            <div class="content-section">
                                <h4>🏷️ Artwork Details</h4>
                                <div class="artwork-metadata">
                                    <div class="metadata-item">
                                        <i class="fas fa-clock"></i>
                                        <span>Created: ${formattedDateTime}</span>
                                    </div>
                                    <div class="metadata-item">
                                        <i class="fas fa-brain"></i>
                                        <span>Technique: ${this.formatTechnique(image.technique)}</span>
                                    </div>
                                    <div class="metadata-item">
                                        <i class="fas fa-users"></i>
                                        <span>Community Gallery</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="instagram-actions">
                            <button class="action-btn creative-action" onclick="navigator.clipboard.writeText('${image.prompt}').then(() => modelBuilder.showNotification('Prompt copied to clipboard!', 'success'))">
                                <i class="fas fa-copy"></i> Copy Prompt
                            </button>
                            
                            <div class="meta-info">
                                <span class="submit-time">
                                    <i class="fas fa-palette"></i>
                                    Part of ${this.galleryImages.length} community artworks
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Add enhanced modal animations
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.style.opacity = '1';
        }, 10);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeCreativeModal(modal);
            }
        });

        // Add keyboard support
        const handleKeyPress = (e) => {
            if (e.key === 'Escape') {
                this.closeCreativeModal(modal);
                document.removeEventListener('keydown', handleKeyPress);
            }
        };
        document.addEventListener('keydown', handleKeyPress);
    }

    closeCreativeModal(modal) {
        modal.style.opacity = '0';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }

    // Keep legacy function for compatibility
    showGalleryModal(image) {
        this.showCreativeGalleryModal(image);
    }

    async loadMoreGalleryImages() {
        await this.loadGalleryImages(this.galleryCurrentPage + 1, false);
    }

    async filterGallery() {
        // This function is kept for backward compatibility
        // New filtering is handled by filterGalleryImages()
        this.filterGalleryImages();
    }
}

// Global functions for HTML onclick handlers
function openWikiModal() {
    if (window.modelBuilder) {
        window.modelBuilder.openWikiModal();
    }
}

function closeWikiModal() {
    if (window.modelBuilder) {
        window.modelBuilder.closeWikiModal();
    }
}

// Initialize the platform
window.modelBuilder = new LLMEducationPlatform();
const modelBuilder = window.modelBuilder;

// Start when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    modelBuilder.init();
}); 
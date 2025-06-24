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
    }

    init() {
        this.setupEventListeners();
        this.setupParameterControls();
        this.setupTechniqueBuilders();
        this.setupConfetti();
        this.loadProgress();
        this.updateUI();
        this.loadDefaultAssignment();
        this.checkWikiModal();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.showSection(e.currentTarget.dataset.section));
        });

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
            if (e.target.matches('#structuredSubject, #structuredStyle, #structuredComposition, #structuredLighting, #structuredMood, #structuredDetails, #structuredTechnical, #structuredAdditional')) {
                this.updateStructuredPrompt();
            }
        });
    }

    setupPromptGrading() {
        // Manual grading only - no automatic grading to avoid rate limits
        console.log('Prompt grading setup - manual testing only');
    }

    async testPrompt(textareaId, technique) {
        const textarea = document.getElementById(textareaId);
        const prompt = textarea.value.trim();
        
        if (!prompt) {
            this.showNotification('Please enter a prompt first!', 'warning');
            return;
        }

        // Show loading state
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing...';
        button.disabled = true;

        try {
            const grade = await this.calculatePromptGradeWithRetry(prompt, technique);
            this.displayGrade(grade, textareaId);
            this.showNotification(`Prompt tested! Score: ${grade.score}/10 - ${grade.quality}`, 'success');
        } catch (error) {
            console.error('Testing failed:', error);
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
                console.log(`🔄 Attempt ${attempt}/${maxRetries} to grade prompt`);
                
                // Add delay between attempts to respect rate limits
                if (attempt > 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                }
                
                const result = await this.calculatePromptGradeAdvanced(prompt, technique);
                console.log(`✅ Success on attempt ${attempt}`);
                return result;
                
            } catch (error) {
                console.log(`❌ Attempt ${attempt} failed:`, error.message);
                lastError = error;
                
                // If it's a rate limit error, wait longer
                if (error.message.includes('429') || error.message.includes('rate limit')) {
                    console.log('Rate limit detected, waiting longer...');
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
            console.log('Raw LLM response:', responseText);
            
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
                console.log('JSON parse failed, trying to extract from text:', parseError);
                gradeData = this.extractGradeFromText(responseText, prompt);
            }
            
            // Validate and clean the response
            let finalScore = gradeData.score;
            let finalFeedback = gradeData.feedback;
            let isLocalFallback = false;
            
            if (!finalScore || finalScore < 1 || finalScore > 10) {
                finalScore = this.getLocalScore(prompt);
                isLocalFallback = true;
                console.log('🔄 Switched to local scoring fallback');
            }
            
            if (!finalFeedback || finalFeedback.trim() === '') {
                finalFeedback = this.getLocalFeedback(prompt, technique);
                isLocalFallback = true;
                console.log('🔄 Switched to local feedback fallback');
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
            console.error('LLM grading failed:', error);
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
            console.error('Grading error:', error);
            console.log('🔄 Grading function failed - switching to full local mode');
            
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
            
            console.log('Raw LLM response:', responseText); // Debug logging
            
            let gradeData;
            try {
                // Try to parse as JSON first
                gradeData = JSON.parse(responseText);
            } catch (parseError) {
                console.log('JSON parse failed, trying to extract from text:', parseError);
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
                console.log('🔄 Switched to local scoring fallback');
            }
            
            if (!finalFeedback || finalFeedback.trim() === '') {
                finalFeedback = this.getLocalFeedback(prompt, technique);
                isLocalFallback = true;
                console.log('🔄 Switched to local feedback fallback');
            }
            
            // Add fallback indicator to feedback if local mode was used
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
            console.error('LLM grading failed:', error);
            console.log('🔄 LLM completely failed - switching to full local mode');
            
            // Return local fallback instead of throwing error
            const fallbackScore = this.getLocalScore(prompt);
            const fallbackFeedback = this.getLocalFeedback(prompt, technique);
            
            return {
                score: fallbackScore,
                feedback: `[Local Mode - LLM Failed] ${fallbackFeedback}`,
                color: this.getGradeColor(fallbackScore),
                quality: this.getQualityText(fallbackScore)
            };
        }
    }

    extractGradeFromText(text, prompt) {
        // Fallback method to extract grade info from non-JSON response
        console.log('🔄 LLM returned non-JSON response, extracting manually:', text);
        
        const scoreMatch = text.match(/score[":]\s*(\d+)/i);
        const feedbackMatch = text.match(/feedback[":]\s*["']([^"']+)["']/i) || 
                            text.match(/suggestion[":]\s*["']([^"']+)["']/i) ||
                            text.match(/improve[":]\s*["']([^"']+)["']/i) ||
                            text.match(/add[^.]*[.]/i);
        
        // Create smart fallback scoring for basic prompts
        let fallbackScore = 2;
        let usedLocalScoring = false;
        
        if (!scoreMatch) {
            if (prompt.trim().split(' ').length <= 2) {
                fallbackScore = prompt.toLowerCase() === 'dragon' ? 1 : 2;
            } else if (prompt.trim().split(' ').length <= 5) {
                fallbackScore = 3;
            } else {
                fallbackScore = 4;
            }
            usedLocalScoring = true;
            console.log('🔄 No score found in LLM response, using local scoring');
        }
        
        let usedLocalFeedback = false;
        let extractedFeedback = feedbackMatch ? feedbackMatch[1] : null;
        
        if (!extractedFeedback) {
            extractedFeedback = this.generateBasicFeedback(text, prompt);
            usedLocalFeedback = true;
            console.log('🔄 No feedback found in LLM response, using local feedback');
        }
        
        // Add indicators for what was locally generated
        let feedbackPrefix = '';
        if (usedLocalScoring && usedLocalFeedback) {
            feedbackPrefix = '[Local Mode] ';
        } else if (usedLocalScoring) {
            feedbackPrefix = '[Local Scoring] ';
        } else if (usedLocalFeedback) {
            feedbackPrefix = '[Local Feedback] ';
        }
        
        return {
            score: scoreMatch ? parseInt(scoreMatch[1]) : fallbackScore,
            feedback: feedbackPrefix + extractedFeedback
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

        console.log('Assignment technique changed to:', baseTechnique);
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
            <textarea class="example-input" placeholder="Add another example following the same pattern"></textarea>
        `;
        
        container.appendChild(newExample);
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
            <textarea class="step-input" placeholder="Add another logical step in your reasoning process"></textarea>
        `;
        
        container.appendChild(newStep);
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
        
        let prompt = 'Examples:\n';
        examples.forEach((example, index) => {
            const text = example.value.trim();
            if (text) {
                prompt += `${index + 1}. ${text}\n`;
            }
        });
        
        if (task) {
            prompt += `\nFollowing this pattern, ${task}`;
        } else {
            prompt += '\nFollowing this pattern, create: [your specific request]';
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
    
    updateStructuredPrompt() {
        const subject = document.getElementById('structuredSubject').value.trim();
        const style = document.getElementById('structuredStyle').value.trim();
        const composition = document.getElementById('structuredComposition').value.trim();
        const lighting = document.getElementById('structuredLighting').value.trim();
        const mood = document.getElementById('structuredMood').value.trim();
        const details = document.getElementById('structuredDetails').value.trim();
        const technical = document.getElementById('structuredTechnical').value.trim();
        const additional = document.getElementById('structuredAdditional').value.trim();
        const display = document.getElementById('structuredFinalPrompt');
        
        let prompt = '';
        
        if (subject) prompt += `SUBJECT: ${subject}\n`;
        if (style) prompt += `STYLE: ${style}\n`;
        if (composition) prompt += `COMPOSITION: ${composition}\n`;
        if (lighting) prompt += `LIGHTING: ${lighting}\n`;
        if (mood) prompt += `MOOD: ${mood}\n`;
        if (details) prompt += `DETAILS: ${details}\n`;
        if (technical) prompt += `TECHNICAL: ${technical}\n`;
        if (additional) prompt += `ADDITIONAL: ${additional}\n`;
        
        if (!prompt) {
            prompt = 'SUBJECT: [Main subject]\nSTYLE: [Art style]\nCOMPOSITION: [Framing]\nLIGHTING: [Light setup]\nMOOD: [Atmosphere]\nDETAILS: [Specific elements]\nTECHNICAL: [Quality specs]';
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
            selectedModel = document.getElementById('fewShotAiModel')?.value || 'flux';
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
        document.getElementById('zeroShotPrompt').value = prompt;
        this.showNotification('Good zero-shot example loaded!', 'success');
    }

    loadZeroShotBad() {
        const prompt = `professional person`;
        document.getElementById('zeroShotPrompt').value = prompt;
        this.showNotification('Poor zero-shot example loaded - notice how vague it is!', 'warning');
    }

    loadZeroShotBest() {
        const prompt = `Create a stunning professional portrait masterpiece: a distinguished senior architect with confident expression and thoughtful demeanor, wearing modern casual business attire with architectural blueprints visible in background, standing in contemporary design studio with natural lighting from large windows. Capture with professional medium format camera using 85mm portrait lens at f/2.8 aperture, studio-quality lighting setup with key light and subtle fill light, achieving crystal-clear focus on subject's eyes and natural skin texture. Render in commercial photography quality with magazine-cover precision, showcasing professional expertise and creative competence in stunning high-resolution detail.`;
        document.getElementById('zeroShotPrompt').value = prompt;
        this.showNotification('Best practice zero-shot example loaded!', 'success');
    }

    // Few-Shot Examples
    loadFewShotGood() {
        // Load examples into the component fields
        const examples = [
            'Software Engineer: Focused developer at modern workstation with multiple monitors displaying code, wearing casual tech company attire, natural office lighting, professional technology magazine photography style.',
            'Environmental Scientist: Dedicated researcher in field gear collecting samples outdoors, surrounded by natural landscape with scientific equipment, golden hour lighting, documentary photography quality.',
            'Financial Advisor: Professional consultant in business attire reviewing documents at polished conference table, modern office setting with city views, corporate photography standard.'
        ];
        
        const task = 'create a professional teacher in classroom setting with educational materials and natural teaching environment, inspiring educational magazine photography quality.';
        
        this.loadFewShotComponents(examples, task);
        this.showNotification('Good few-shot example loaded!', 'success');
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
                <textarea class="example-input">${example}</textarea>
            `;
            container.appendChild(exampleDiv);
        });
        
        // Set task
        document.getElementById('fewShotTask').value = task;
        
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
            'Distinguished Technology Leader: Senior software architect in smart casual attire at modern tech workspace, surrounded by multiple monitors and innovation tools, natural office lighting with urban backdrop, technology magazine photography quality.',
            'Expert Research Scientist: Accomplished laboratory researcher in professional lab coat, working with advanced scientific equipment in modern research facility, controlled lighting environment, scientific publication photography standard.',
            'Master Craftsperson Profile: Skilled artisan in workshop setting with traditional tools and handcrafted works, natural lighting from workshop windows, artisan magazine photography style, authentic documentation quality.',
            'Professional Educator Portrait: Experienced instructor in classroom environment with teaching materials and educational technology, inspiring natural lighting, education publication photography standard, portfolio-quality composition.'
        ];
        
        const task = 'create a professional consultant in modern office setting with business materials and collaborative workspace, natural lighting and corporate magazine photography quality.';
        
        this.loadFewShotComponents(examples, task);
        this.showNotification('Best practice few-shot example loaded!', 'success');
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
                <textarea class="step-input">${step}</textarea>
            `;
            container.appendChild(stepDiv);
        });
        
        // Set final instruction
        document.getElementById('chainThoughtFinal').value = final;
        
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
        document.getElementById('structuredSubject').value = components.subject || '';
        document.getElementById('structuredStyle').value = components.style || '';
        document.getElementById('structuredComposition').value = components.composition || '';
        document.getElementById('structuredLighting').value = components.lighting || '';
        document.getElementById('structuredMood').value = components.mood || '';
        document.getElementById('structuredDetails').value = components.details || '';
        document.getElementById('structuredTechnical').value = components.technical || '';
        document.getElementById('structuredAdditional').value = components.additional || '';
        
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
            console.error('Testing failed:', error);
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

        // Show loading
        const results = document.getElementById('assignmentResults');
        results.style.display = 'block';
        const img = document.getElementById('assignmentImage');
        img.style.display = 'none';

        try {
            const enhancedPrompt = this.enhancePromptWithParameters(prompt, temp, topP, topK);
            const seed = this.generateParameterSeed(temp, topP, topK);
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?width=768&height=768&seed=${seed}&model=${selectedModel}&nologo=true`;

            img.src = imageUrl;
            img.style.display = 'block';

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
            console.error('Generation failed:', error);
            this.showNotification('Failed to generate assignment image', 'error');
        }
    }

    submitAssignment() {
        if (!this.currentModel || !this.currentModel.isAssignment) {
            this.showNotification('Please generate your assignment image first!', 'warning');
            return;
        }

        const analysis = document.getElementById('assignmentAnalysis').value.trim();
        if (!analysis) {
            this.showNotification('Please complete your reflection analysis before submitting!', 'warning');
            return;
        }

        // Ask for student name before submission
        const studentName = prompt('Enter your full name for the submission:');
        if (!studentName || !studentName.trim()) {
            this.showNotification('Name is required for submission!', 'warning');
            return;
        }

        // Update model with student info
        this.currentModel.student = studentName.trim();
        this.currentModel.analysis = analysis;
        this.currentModel.submittedAt = new Date().toISOString();
        
        // Generate submission code
        const submissionCode = this.generateSubmissionCode(this.currentModel);
        
        this.assignmentSubmitted = true;
        this.showNotification('Assignment submitted successfully! Share your submission code with the instructor.', 'success');
        
        // Show submission code
        this.showSubmissionCode(submissionCode);
        
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
                    <textarea class="share-code-input" readonly>${code}</textarea>
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
    importClassModel() {
        const code = prompt('Enter student submission code:');
        if (!code) return;

        try {
            const modelData = JSON.parse(atob(code));
            
            if (modelData.type !== 'assignment') {
                this.showNotification('Invalid submission code format!', 'error');
                return;
            }

            // Add to class submissions
            if (!this.classSubmissions.find(s => s.student === modelData.student)) {
                this.classSubmissions.push(modelData);
                this.showNotification(`Added ${modelData.student}'s submission to gallery!`, 'success');
                this.updateSubmissionGallery();
                this.checkForWinnerReveal();
            } else {
                this.showNotification(`${modelData.student}'s submission already exists!`, 'warning');
            }

        } catch (error) {
            this.showNotification('Invalid submission code!', 'error');
            console.error('Import error:', error);
        }
    }



    updateSubmissionGallery() {
        const gallery = document.getElementById('submissionGallery');
        if (!gallery) return;

        if (this.classSubmissions.length === 0) {
            gallery.innerHTML = '<div class="gallery-empty"><p>No submissions loaded yet. Import student models to view their artwork!</p></div>';
            return;
        }

        const galleryHTML = this.classSubmissions.map((submission, index) => `
            <div class="submission-card" data-student="${submission.student}" onclick="modelBuilder.viewSubmission(${index})">
                <div class="submission-image">
                    <img src="${submission.imageUrl}" alt="${submission.student}'s artwork" loading="lazy">
                    <div class="submission-overlay">
                        <div class="submission-info">
                            <span class="technique-badge">${submission.technique}</span>
                            <div class="vote-counter">${this.votingData[submission.student] || 0} votes</div>
                        </div>
                    </div>
                </div>
                <div class="submission-actions">
                    <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); modelBuilder.voteForSubmission('${submission.student}')">
                        <i class="fas fa-thumbs-up"></i> Vote
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); modelBuilder.revealArtist('${submission.student}')">
                        <i class="fas fa-eye"></i> Reveal
                    </button>
                </div>
            </div>
        `).join('');

        gallery.innerHTML = galleryHTML;
    }

    viewSubmission(index) {
        const submission = this.classSubmissions[index];
        if (!submission) return;

        // Show detailed view
        this.showNotification(`Viewing ${submission.technique} submission with ${this.votingData[submission.student] || 0} votes`, 'info');
    }

    voteForSubmission(studentName) {
        if (!this.votingData[studentName]) {
            this.votingData[studentName] = 0;
        }
        this.votingData[studentName]++;
        
        this.showNotification(`Voted for ${studentName}'s artwork! Total votes: ${this.votingData[studentName]}`, 'success');
        this.updateSubmissionGallery();
        this.checkForWinnerReveal(); // Check if we should show winner reveal button
    }

    revealArtist(studentName) {
        const submission = this.classSubmissions.find(s => s.student === studentName);
        if (!submission) return;

        // Create reveal modal
        this.showRevealModal(submission);
        this.showNotification(`Revealed: This artwork was created by ${studentName}!`, 'info');
    }

    showRevealModal(submission) {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'modal active reveal-modal';
        modal.innerHTML = `
            <div class="modal-content reveal-modal-content">
                <div class="modal-header">
                    <h3>🎭 Artist Revealed!</h3>
                    <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body reveal-modal-body">
                    <div class="reveal-artwork-display">
                        <img src="${submission.imageUrl}" alt="Artwork" class="reveal-modal-image">
                    </div>
                    <div class="reveal-details-panel">
                        <div class="artist-info">
                            <h4>👨‍🎨 ${submission.student}</h4>
                            <span class="technique-badge-large">${submission.technique}</span>
                        </div>
                        
                        <div class="prompt-section">
                            <h5>📝 Original Prompt</h5>
                            <div class="prompt-text">${submission.prompt}</div>
                        </div>
                        
                        <div class="parameters-section">
                            <h5>⚙️ Parameters Used</h5>
                            <div class="param-pills">
                                <span class="param-pill">🤖 Model: ${submission.parameters.model || 'flux'}</span>
                                <span class="param-pill">🌡️ Temp: ${submission.parameters.temp}</span>
                                <span class="param-pill">🎯 Top-P: ${submission.parameters.topP}</span>
                                <span class="param-pill">🔢 Top-K: ${submission.parameters.topK}</span>
                            </div>
                        </div>
                        
                        <div class="analysis-section">
                            <h5>💭 Student's Reflection</h5>
                            <div class="analysis-text">${submission.analysis}</div>
                        </div>
                        
                        <div class="submission-meta">
                            <p><i class="fas fa-clock"></i> Submitted: ${new Date(submission.submittedAt).toLocaleString()}</p>
                            <p><i class="fas fa-thumbs-up"></i> Votes: ${this.votingData[submission.student] || 0}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
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
            console.error('Failed to copy:', err);
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
    revealWinners() {
        if (this.classSubmissions.length < 3) {
            this.showNotification('Need at least 3 submissions to reveal winners!', 'warning');
            return;
        }

        if (Object.keys(this.votingData).length === 0) {
            this.showNotification('No votes cast yet! Cast some votes first.', 'warning');
            return;
        }

        // Calculate top 3
        const sortedResults = Object.entries(this.votingData)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([student, votes]) => ({ 
                student, 
                votes, 
                submission: this.classSubmissions.find(s => s.student === student) 
            }));

        // Start confetti
        this.startConfetti();

        // Show winner modal
        setTimeout(() => {
            this.showWinnerModal(sortedResults);
        }, 500);

        this.showNotification('🎉 Winners revealed with confetti celebration! 🎉', 'success');
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
        const hasVotes = Object.keys(this.votingData).length > 0;
        
        if (winnerSection && hasEnoughSubmissions && hasVotes) {
            winnerSection.style.display = 'block';
        } else if (winnerSection) {
            winnerSection.style.display = 'none';
        }
    }

    // Generate test data for demonstration
    generateTestData() {
        // Clear existing data
        this.classSubmissions = [];
        this.votingData = {};

        // Sample student submissions
        const testSubmissions = [
            {
                type: 'assignment',
                student: 'Alice Chen',
                technique: 'Structured',
                prompt: 'SUBJECT: Professional female surgeon in scrubs STYLE: Medical documentary photography LIGHTING: Hospital operating room lighting COMPOSITION: Medium shot, confident pose TECHNICAL: Shot with 85mm lens, shallow depth of field, clinical precision',
                imageUrl: 'https://image.pollinations.ai/prompt/professional%20female%20surgeon%20scrubs%20medical%20documentary%20photography%20hospital%20operating%20room%20lighting?width=512&height=512&seed=12345&nologo=true',
                parameters: { temp: 0.7, topP: 0.9, topK: 50, model: 'flux' },
                analysis: 'Used structured prompting to create photorealistic medical professional portrait with technical specifications.',
                submittedAt: new Date().toISOString()
            },
            {
                type: 'assignment',
                student: 'Bob Martinez',
                technique: 'Few-Shot',
                prompt: 'Professional headshots pattern: 1. Corporate CEO in navy suit, office background 2. Chef in white uniform, restaurant kitchen 3. Architect with blueprints, modern building site. Now create: Mountain climber with professional gear and weathered face, shot at alpine base camp with dramatic mountain backdrop',
                imageUrl: 'https://image.pollinations.ai/prompt/mountain%20climber%20professional%20gear%20weathered%20face%20alpine%20base%20camp%20dramatic%20mountain%20backdrop?width=512&height=512&seed=67890&nologo=true',
                parameters: { temp: 0.8, topP: 0.8, topK: 60, model: 'flux' },
                analysis: 'Applied few-shot learning with consistent professional portrait examples, achieving photorealistic quality.',
                submittedAt: new Date().toISOString()
            },
            {
                type: 'assignment',
                student: 'Carol Zhang',
                technique: 'Role Playing',
                prompt: 'You are a world-renowned fashion photographer shooting for Vogue magazine cover. Your portfolio includes iconic portraits of celebrities and models. Create a stunning portrait of an elegant ballet dancer in flowing white tutu, captured mid-performance leap with dramatic stage lighting, shot with medium format camera for maximum detail and professional magazine quality',
                imageUrl: 'https://image.pollinations.ai/prompt/elegant%20ballet%20dancer%20white%20tutu%20mid%20performance%20leap%20dramatic%20stage%20lighting%20medium%20format%20camera?width=512&height=512&seed=13579&nologo=true',
                parameters: { temp: 0.6, topP: 0.9, topK: 70, model: 'flux' },
                analysis: 'Role-played as professional fashion photographer to achieve magazine-quality portrait with technical specifications.',
                submittedAt: new Date().toISOString()
            },
            {
                type: 'assignment',
                student: 'David Kim',
                technique: 'Chain-of-Thought',
                prompt: 'Let me think step by step about creating a professional portrait: Step 1: Choose subject - Distinguished elderly businessman with silver hair and sharp features. Step 2: Consider setting - Modern glass office with city skyline background. Step 3: Plan lighting - Professional studio lighting with key light and fill light. Step 4: Camera specs - Shot with 85mm portrait lens, shallow depth of field. Step 5: Quality requirements - Commercial photography standard with perfect exposure. Result: Distinguished elderly CEO with silver hair in perfectly tailored charcoal suit, standing confidently in modern glass office with city skyline background, shot with professional studio lighting and 85mm lens for commercial photography quality',
                imageUrl: 'https://image.pollinations.ai/prompt/distinguished%20elderly%20CEO%20silver%20hair%20charcoal%20suit%20modern%20glass%20office%20city%20skyline%20professional%20studio%20lighting?width=512&height=512&seed=24680&nologo=true',
                parameters: { temp: 0.5, topP: 0.7, topK: 40, model: 'turbo' },
                analysis: 'Used systematic chain-of-thought reasoning to build photorealistic business portrait with technical specifications.',
                submittedAt: new Date().toISOString()
            },
            {
                type: 'assignment',
                student: 'Emma Wilson',
                technique: 'Zero-Shot',
                prompt: 'Professional headshot of confident young chef in pristine white uniform with chef hat, standing in modern restaurant kitchen with stainless steel surfaces and professional equipment in background, natural lighting from large windows, shot with professional DSLR camera, commercial photography quality, sharp focus, realistic skin texture, magazine cover quality',
                imageUrl: 'https://image.pollinations.ai/prompt/professional%20headshot%20confident%20young%20chef%20white%20uniform%20modern%20restaurant%20kitchen%20stainless%20steel%20professional%20DSLR?width=512&height=512&seed=97531&nologo=true',
                parameters: { temp: 0.9, topP: 0.8, topK: 80, model: 'flux' },
                analysis: 'Created detailed zero-shot prompt with professional photography specifications and technical quality requirements.',
                submittedAt: new Date().toISOString()
            }
        ];

        // Add submissions
        this.classSubmissions = testSubmissions;

        // Add some initial votes (simulating some voting already happened)
        this.votingData = {
            'Alice Chen': 3,
            'Bob Martinez': 5,
            'Carol Zhang': 8,
            'David Kim': 2,
            'Emma Wilson': 6
        };

        // Update the gallery
        this.updateSubmissionGallery();
        this.checkForWinnerReveal();

        this.showNotification('Generated 5 test submissions with votes! Try voting more and then reveal winners!', 'success');
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
const modelBuilder = new LLMEducationPlatform();
window.modelBuilder = modelBuilder; // Make it globally accessible

// Start when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    modelBuilder.init();
}); 
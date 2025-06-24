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

        // Setup assignment parameter controls
        this.setupAssignmentParameterControls();
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

    updateAssignmentParameterRecommendation(temp, topP, topK) {
        const recommendationEl = document.getElementById('assignmentParamRecommendation');
        if (!recommendationEl) return;

        let recommendation = this.getParameterRecommendationText(temp, topP, topK);
        
        const iconEl = recommendationEl.querySelector('.recommendation-icon');
        const textEl = recommendationEl.querySelector('.recommendation-text');
        
        if (textEl) {
            textEl.textContent = recommendation;
        } else {
            recommendationEl.textContent = recommendation;
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
        let recommendation = '';

        // Temperature-based recommendations (same logic as main)
        if (temp === 0.0) {
            recommendation = 'Ultra-conservative: Identical results every time, perfect for templates';
        } else if (temp === 0.1) {
            recommendation = 'Minimal variation: Slight differences while maintaining core consistency';
        } else if (temp === 0.2) {
            recommendation = 'Low creativity: Predictable outputs with minor artistic variations';
        } else if (temp === 0.3) {
            recommendation = 'Controlled creativity: Safe artistic choices with reliable quality';
        } else if (temp === 0.4) {
            recommendation = 'Moderate precision: Professional results with some creative flexibility';
        } else if (temp === 0.5) {
            recommendation = 'Balanced approach: Equal parts reliability and creative expression';
        } else if (temp === 0.6) {
            recommendation = 'Creative leaning: More artistic freedom while maintaining coherence';
        } else if (temp === 0.7) {
            recommendation = 'High creativity: Varied artistic interpretations with good control';
        } else if (temp === 0.8) {
            recommendation = 'Very creative: Bold artistic choices with surprising elements';
        } else if (temp === 0.9) {
            recommendation = 'Experimental mode: Highly unpredictable, innovative results';
        } else if (temp === 1.0) {
            recommendation = 'Maximum chaos: Completely unpredictable, avant-garde outcomes';
        }

        // Add Top-P influence
        if (topP <= 0.3) {
            recommendation += ' | Conservative vocabulary choices';
        } else if (topP <= 0.5) {
            recommendation += ' | Standard word selection';
        } else if (topP <= 0.7) {
            recommendation += ' | Diverse language options';
        } else if (topP <= 0.9) {
            recommendation += ' | Rich vocabulary variety';
        } else {
            recommendation += ' | Maximum linguistic diversity';
        }

        // Add Top-K influence
        if (topK <= 20) {
            recommendation += ' | Simple, focused expressions';
        } else if (topK <= 40) {
            recommendation += ' | Moderate complexity';
        } else if (topK <= 60) {
            recommendation += ' | Rich detailed descriptions';
        } else if (topK <= 80) {
            recommendation += ' | Complex, layered language';
        } else {
            recommendation += ' | Maximum expressive complexity';
        }

        return recommendation;
    }

    updateParameterRecommendation(temp, topP, topK) {
        const recommendationEl = document.getElementById('paramRecommendation');
        if (!recommendationEl) return;

        let recommendation = this.getParameterRecommendationText(temp, topP, topK);

        const iconEl = recommendationEl.querySelector('.recommendation-icon');
        const textEl = recommendationEl.querySelector('.recommendation-text');
        
        if (textEl) {
            textEl.textContent = recommendation;
        } else {
            recommendationEl.textContent = recommendation;
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

    // Enhanced prompt engineering based on parameters
    enhancePromptWithParameters(basePrompt, temp, topP, topK) {
        // Ultra-granular modifiers that create dramatic visual differences for small parameter changes
        const tempModifiers = {
            0.0: 'absolutely identical replication, zero variation, template mode, clinical precision',
            0.1: 'microscopic variation only, nearly identical outputs, ultra-conservative, photorealistic accuracy',
            0.2: 'minimal artistic liberty, slight texture variations, highly constrained, technical illustration style',
            0.3: 'subtle creative touches, minor style adjustments, controlled enhancement, professional photography quality',
            0.4: 'moderate artistic interpretation, noticeable style choices, professional flexibility, refined artwork',
            0.5: 'balanced creative expression, clear artistic vision, optimal creativity, polished digital art',
            0.6: 'enhanced artistic freedom, bold style choices, creative interpretation, stylized rendering',
            0.7: 'high creative liberty, dramatic artistic flair, expressive interpretation, dynamic composition',
            0.8: 'very bold artistic choices, surprising elements, highly creative, experimental artistic style',
            0.9: 'extreme creative interpretation, unpredictable results, experimental approach, avant-garde aesthetics',
            1.0: 'maximum chaos, completely unpredictable, avant-garde experimentation, surreal abstraction'
        };

        const topPModifiers = {
            0.0: 'extremely limited vocabulary, repetitive elements, ultra-conservative styling',
            0.1: 'very restricted selection, traditional terminology only, classic art approaches',
            0.2: 'limited variety, conventional descriptors, standard artistic techniques',
            0.3: 'moderate word variety, standard artistic language, established art styles',
            0.4: 'good vocabulary diversity, expanded descriptive range, mixed artistic approaches',
            0.5: 'balanced linguistic choices, rich descriptive vocabulary, versatile art styles',
            0.6: 'diverse language options, creative terminology, eclectic artistic fusion',
            0.7: 'rich vocabulary variety, innovative descriptive language, experimental art mixing',
            0.8: 'extensive linguistic diversity, unique combinations, avant-garde style fusion',
            0.9: 'maximum vocabulary range, experimental linguistic fusion, radical style combinations',
            1.0: 'unlimited linguistic possibilities, completely experimental language, chaotic style mixing'
        };

        const topKModifiers = {
            10: 'ultra-minimalist, stark simplicity, bare essentials only, clean geometric forms',
            20: 'very simple composition, basic elements, minimal detail, pure geometric shapes',
            30: 'simple but complete, essential details, clean approach, refined minimalism',
            40: 'moderate complexity, balanced detail, good foundation, structured composition',
            50: 'well-detailed, comprehensive elements, rich foundation, layered artistic depth',
            60: 'highly detailed, complex composition, layered elements, intricate artistic details',
            70: 'very complex, intricate details, sophisticated layering, elaborate visual complexity',
            80: 'extremely detailed, elaborate composition, maximum complexity, dense visual information',
            90: 'overwhelming detail, ultra-complex, intricate mastery, hyperealistic elaboration',
            100: 'absolutely maximum complexity, every possible detail, complete elaboration, photorealistic hyperdetail'
        };

        // Find exact parameter matches
        const tempKey = temp.toFixed(1);
        const topPKey = topP.toFixed(1);
        const topKKey = Math.round(topK / 10) * 10; // Round to nearest 10

        const tempMod = tempModifiers[tempKey] || tempModifiers[0.5];
        const topPMod = topPModifiers[topPKey] || topPModifiers[0.5];
        const topKMod = topKModifiers[topKKey] || topKModifiers[50];

        // Create highly sensitive seeds that change dramatically with small parameter changes
        const tempSeed = Math.floor(temp * 12347);  // Large prime multiplier for temperature
        const topPSeed = Math.floor(topP * 7919);   // Different large prime for top-p
        const topKSeed = Math.floor(topK * 337);    // Different multiplier for top-k
        const microSeed = Math.floor((temp * 100 + topP * 100 + topK) * 1291); // Combined micro-sensitivity
        
        // Add parameter-specific style instructions that force dramatic visual changes
        let styleInstructions = '';
        
        // Temperature-based visual style forcing
        if (temp <= 0.2) {
            styleInstructions += ', hyperrealistic photography style, clinical documentation quality, technical precision rendering';
        } else if (temp <= 0.4) {
            styleInstructions += ', professional digital art, polished commercial quality, refined artistic technique';
        } else if (temp <= 0.6) {
            styleInstructions += ', artistic interpretation, stylized rendering, creative lighting effects, dynamic composition';
        } else if (temp <= 0.8) {
            styleInstructions += ', bold artistic style, experimental composition, dramatic visual effects, creative abstraction';
        } else {
            styleInstructions += ', completely experimental art style, surreal visual elements, chaotic composition, abstract expressionism';
        }

        // Top-P based vocabulary/style complexity
        if (topP <= 0.3) {
            styleInstructions += ', traditional classical art style, conventional composition rules, timeless aesthetic';
        } else if (topP <= 0.5) {
            styleInstructions += ', established art style, proven composition techniques, refined artistic approach';
        } else if (topP <= 0.7) {
            styleInstructions += ', modern contemporary art style, innovative composition, creative artistic fusion';
        } else if (topP <= 0.9) {
            styleInstructions += ', avant-garde artistic style, experimental composition, radical artistic innovation';
        } else {
            styleInstructions += ', completely experimental art form, revolutionary composition, chaotic artistic fusion';
        }

        // Top-K based visual complexity
        if (topK <= 30) {
            styleInstructions += ', minimalist composition, clean simple lines, pure geometric forms, stark visual simplicity';
        } else if (topK <= 50) {
            styleInstructions += ', moderate visual complexity, balanced detailed composition, structured artistic elements';
        } else if (topK <= 70) {
            styleInstructions += ', detailed rich composition, complex layered textures, intricate visual patterns';
        } else if (topK <= 90) {
            styleInstructions += ', highly complex detailed composition, elaborate intricate textures, maximum visual density';
        } else {
            styleInstructions += ', overwhelmingly complex composition, hyperdetailed intricate textures, maximum possible visual complexity';
        }

        // Combine with dramatic parameter-influenced seed
        return `${basePrompt}${styleInstructions}, rendering style: ${tempMod}, artistic approach: ${topPMod}, composition complexity: ${topKMod}, parameter-seed:${tempSeed}-${topPSeed}-${topKSeed}-${microSeed}`;
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

        // Get parameter values
        const temp = parseFloat(document.getElementById('temperature')?.value || 0.7);
        const topP = parseFloat(document.getElementById('topP')?.value || 0.9);
        const topK = parseInt(document.getElementById('topK')?.value || 50);
        const selectedModel = document.getElementById('aiModel')?.value || 'flux';

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
        const prompt = `Create a professional digital artwork of a majestic dragon with emerald scales, breathing golden fire, in a mystical forest setting with cinematic lighting, high detail, fantasy art style`;
        document.getElementById('zeroShotPrompt').value = prompt;
        this.showNotification('Good zero-shot example loaded!', 'success');
    }

    loadZeroShotBad() {
        const prompt = `dragon`;
        document.getElementById('zeroShotPrompt').value = prompt;
        this.showNotification('Poor zero-shot example loaded - notice how vague it is!', 'warning');
    }

    loadZeroShotBest() {
        const prompt = `Create a breathtaking digital masterpiece: an ancient emerald dragon with iridescent scales reflecting ethereal moonlight, breathing luminous golden flames that dance through a mystical enchanted forest. Feature dramatic cinematic lighting with volumetric god rays piercing through magical mists, hyperrealistic detail with every scale meticulously rendered, atmospheric perspective creating depth, award-winning fantasy concept art quality, trending on ArtStation, 8K resolution, museum-quality detail level, professional game industry standard`;
        document.getElementById('zeroShotPrompt').value = prompt;
        this.showNotification('Best practice zero-shot example loaded!', 'success');
    }

    // Few-Shot Examples
    loadFewShotGood() {
        // Load examples into the component fields
        const examples = [
            'Ancient Fire Dragon: Massive crimson dragon with weathered obsidian scales, breathing intense golden flames while perched on volcanic rocks, dramatic backlighting, cinematic composition, hyperrealistic detail.',
            'Ice Phoenix: Elegant white phoenix with crystalline feathers that refract light like prisms, surrounded by swirling frost magic and aurora-like energy, ethereal atmosphere, professional fantasy art quality.',
            'Forest Unicorn: Graceful silver unicorn with flowing pearl-white mane, standing in an enchanted grove with magical fireflies and glowing mushrooms, soft rim lighting, mystical ambiance, portfolio-quality artwork.'
        ];
        
        const task = 'create a storm griffin with lightning-infused feathers, commanding thunder clouds from a mountain peak during an epic thunderstorm, with dramatic lighting and cinematic composition.';
        
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
            'Dragons are cool.',
            'Unicorns are pretty.'
        ];
        
        const task = 'Make a griffin.';
        
        this.loadFewShotComponents(examples, task);
        this.showNotification('Poor few-shot example loaded - see the inconsistent pattern!', 'warning');
    }

    loadFewShotBest() {
        const examples = [
            'Celestial Dragon Lord: Majestic platinum dragon with constellation patterns etched into cosmic scales, commanding stellar energy while floating through nebula clouds, divine backlighting creating sacred atmosphere, museum-quality hyperrealistic rendering, trending on ArtStation.',
            'Shadowmere Phoenix: Ethereal dark phoenix with obsidian feathers edged in violet flame, rising from mystical shadowlands with trailing starfire, dramatic chiaroscuro lighting, professional concept art for AAA gaming, award-winning composition.',
            'Crystal Stag Guardian: Ancient stag with translucent antlers containing miniature galaxies, standing sentinel in enchanted crystal caverns with prismatic light reflections, soft volumetric lighting, portfolio masterpiece quality, cinema-grade visual effects standard.',
            'Primal Earth Elemental: Colossal humanoid figure composed of living mountain stone and molten magma veins, wielding forests as armor and waterfalls as flowing robes, epic scale demonstration with tectonic power, award-winning environmental concept art for blockbuster films.'
        ];
        
        const task = 'create a tempest leviathan with storm-cloud hide and lightning coursing through translucent fins, emerging from hurricane seas with dramatic atmospheric effects and professional cinematography quality.';
        
        this.loadFewShotComponents(examples, task);
        this.showNotification('Best practice few-shot example loaded!', 'success');
    }

    // Chain-of-Thought Examples
    loadChainThoughtGood() {
        const steps = [
            'Choose the main subject - A wise ancient wizard, depicting years of magical knowledge and experience through weathered yet noble features.',
            'Define the setting - A grand mystical library with floating ancient tomes, glowing magical circles, and towering bookshelves filled with arcane knowledge.',
            'Establish the mood and atmosphere - Warm, scholarly ambiance with a sense of ancient wisdom and magical power, conveying both serenity and immense knowledge.',
            'Design the lighting setup - Golden candlelight as primary illumination, with magical sparkles and glowing runes providing accent lighting, creating depth and mystical atmosphere.',
            'Add specific details - Elaborate star-covered robes, an ornate crystal staff emanating soft light, ancient leather-bound tomes with glowing text, mystical symbols floating in the air.',
            'Ensure technical quality - Hyperrealistic digital painting style, cinematic composition with rule of thirds, professional lighting techniques, 8K resolution detail.'
        ];
        
        const final = 'Result: Create a wise ancient wizard in his grand mystical library, surrounded by floating magical tomes and golden candlelight, wearing elaborate star-covered robes and holding a glowing crystal staff, with hyperrealistic detail and cinematic composition.';
        
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
            'I want a wizard.',
            'Make it look cool.'
        ];
        
        const final = 'Add some magic stuff.';
        
        this.loadChainThoughtComponents(steps, final);
        this.showNotification('Poor chain-of-thought example loaded - no systematic thinking!', 'warning');
    }

    loadChainThoughtBest() {
        const prompt = `Let's architect this masterpiece through systematic analysis for professional portfolio quality:

Step 1: Subject Analysis - Ancient archmage character study: weathered sage with millennia of wisdom, piercing ethereal eyes reflecting cosmic knowledge, noble bearing despite advanced age, facial features telling stories of magical mastery.

Step 2: Environmental Design - Sacred mystical sanctum: vast circular library with impossible architecture defying physics, floating islands of books connected by bridges of pure light, walls lined with knowledge spanning dimensions, central altar of crystalline formation.

Step 3: Atmospheric Engineering - Transcendent scholarly ambiance: warm golden illumination suggesting eternal study, whispers of ancient magic in the air, sense of timeless sanctuary where reality bends to wisdom, peaceful yet overwhelmingly powerful presence.

Step 4: Lighting Architecture - Multi-layered illumination system: primary warm candlelight establishing base mood, secondary magical glow from runes and tomes providing accent lighting, tertiary starlight filtering through mystical windows, quaternary staff luminescence as focal point.

Step 5: Detail Specification - Hyperrealistic elements: robes woven from starlight and midnight, staff carved from world-tree heartwood with embedded constellation gems, tomes with living text that shifts and glows, floating magical symbols writing themselves in luminous script.

Step 6: Technical Excellence - Museum-quality execution: 8K hyperrealistic digital painting with photographic detail, cinematic composition utilizing golden ratio and rule of thirds, professional color grading with warm/cool balance, award-winning concept art standard.

Final Synthesis: Create an ancient archmage in his transcendent mystical sanctum, surrounded by impossible architecture of floating books and crystalline formations, bathed in layered golden and magical lighting, wearing starlight robes while wielding a cosmic staff, rendered with museum-quality hyperrealistic detail and cinematic composition worthy of the finest fantasy art galleries.`;
        document.getElementById('chainThoughtPrompt').value = prompt;
        this.showNotification('Best practice chain-of-thought example loaded!', 'success');
    }

    // Role-Play Examples
    loadRolePlayGood() {
        const role = 'master concept artist for blockbuster fantasy films with 15 years of experience creating iconic creatures for major studios';
        const context = 'Your portfolio includes award-winning designs for dragons, magical beasts, and mystical beings that have become cultural icons. Create a piece that would impress directors and producers';
        const task = 'A breathtaking landscape showing an ancient floating city among the clouds, with intricate architecture and dramatic lighting that conveys both majesty and mystery';
        const audience = 'This piece needs to meet Hollywood production standards for a big-budget fantasy epic';
        
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
        const role = 'lead senior concept artist at Industrial Light & Magic with 20+ years of experience designing for Star Wars, Marvel, and other legendary franchises. You\'ve won multiple VES Awards for outstanding visual effects artistry and your creature designs have been featured in museums worldwide';
        const context = 'Studio executives specifically request your expertise for the most challenging and iconic character designs. Your current assignment is for the new fantasy epic "Chronicles of the Celestial Realm"';
        const task = 'Design an ancient dragon emperor that will serve as the film\'s primary mystical guardian. This character must convey 10,000 years of wisdom, cosmic power, and benevolent protection of the realm';
        const audience = 'Museum-quality concept art that will be used for toy lines, promotional materials, and art books. The design must be iconic enough to become a cultural symbol while meeting the technical demands of modern VFX production';
        
        this.loadRolePlayComponents(role, context, task, audience);
        this.showNotification('Best practice role-play example loaded!', 'success');
    }

    // Structured Examples
    loadStructuredGood() {
        const components = {
            subject: 'Ethereal fairy queen with delicate translucent wings and flowing silver hair, radiating otherworldly beauty and ancient wisdom',
            style: 'Hyperrealistic digital painting with fantasy art elements, reminiscent of classic Pre-Raphaelite paintings but with modern technical execution',
            composition: 'Portrait orientation, three-quarter view angle, rule of thirds positioning with subject\'s eyes at upper intersection point, elegant pose with graceful hand positioning',
            lighting: 'Soft magical glow emanating from the subject\'s skin, gentle rim lighting to separate subject from background, warm golden key light with cool blue fill light for depth',
            mood: 'Serene and mystical atmosphere, conveying both ethereal beauty and ancient power, peaceful yet commanding presence',
            details: 'Gossamer-thin wings with intricate vein patterns, crown of living flowers that seem to bloom in real-time, flowing gown that appears to be made of starlight and morning mist, subtle magical particles floating around the figure',
            technical: '8K resolution, professional artwork quality, trending on ArtStation, award-winning composition, museum-quality detail level, perfect color harmony and balance',
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
            subject: 'A fairy',
            style: '',
            composition: '',
            lighting: '',
            mood: 'Pretty and magical',
            details: '',
            technical: '',
            additional: ''
        };
        
        this.loadStructuredComponents(components);
        this.showNotification('Poor structured example loaded - no organization or detail!', 'warning');
    }

    loadStructuredBest() {
        const components = {
            subject: 'Celestial phoenix empress with wings spanning cosmic dimensions, feathers composed of living starfire and nebula dust, ancient entity embodying rebirth and cosmic cycles, bearing crown of crystallized supernovas',
            style: 'Museum-quality hyperrealistic digital painting blending classical academic technique with cutting-edge fantasy artistry, influences from Baroque masters and contemporary concept art legends, executed with photographic precision yet maintaining painterly soul',
            composition: 'Dramatic diagonal composition utilizing golden ratio spiral, subject positioned at primary focal intersection, wings creating dynamic S-curve leading eye through frame, secondary elements following rule of thirds, foreground-midground-background clearly defined for maximum depth',
            lighting: 'Complex multi-source illumination architecture - primary cosmic radiation from subject creating warm luminosity, secondary starfield providing cool accent lighting, tertiary atmospheric scattering for depth, quaternary rim lighting defining subject silhouette, all balanced for dramatic chiaroscuro effect',
            mood: 'Transcendent majesty combined with primordial power, conveying both nurturing maternal energy and awesome cosmic force, atmosphere of rebirth and eternal cycles, inspiring awe while maintaining approachable beauty',
            details: 'Individual feathers rendered with microscopic detail showing internal flame structures, eyes reflecting entire galaxies with swirling spiral arms, crown jewels each containing miniature stellar formations, trailing cosmic dust particles with physically accurate light scattering, background nebulae with authentic astronomical color palettes',
            technical: '8K resolution with 16-bit color depth, professional museum archival quality, trending #1 on all major art platforms, award-winning international competition standard, technical execution rivaling finest classical paintings, color theory implementing advanced harmony principles, perfect anatomical accuracy despite fantastical subject matter',
            additional: 'Deep space setting with accurately rendered star clusters, distant galaxies visible with proper atmospheric perspective, floating cosmic debris following orbital mechanics, aurora-like energy fields creating depth layers'
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
                prompt: 'SUBJECT: Majestic dragon with emerald scales STYLE: Fantasy digital art LIGHTING: Dramatic golden hour MOOD: Powerful and ancient',
                imageUrl: 'https://image.pollinations.ai/prompt/majestic%20emerald%20dragon%20fantasy%20digital%20art%20golden%20hour%20lighting?width=512&height=512&seed=12345&nologo=true',
                parameters: { temp: 0.7, topP: 0.9, topK: 50, model: 'flux' },
                analysis: 'Used structured prompting to create a detailed fantasy dragon with professional lighting.',
                submittedAt: new Date().toISOString()
            },
            {
                type: 'assignment',
                student: 'Bob Martinez',
                technique: 'Few-Shot',
                prompt: 'Following the pattern of mythical creatures: Ancient phoenix with crystalline feathers, surrounded by ethereal flames, mystical forest setting',
                imageUrl: 'https://image.pollinations.ai/prompt/ancient%20phoenix%20crystalline%20feathers%20ethereal%20flames%20mystical%20forest?width=512&height=512&seed=67890&nologo=true',
                parameters: { temp: 0.8, topP: 0.8, topK: 60, model: 'flux-realism' },
                analysis: 'Applied few-shot learning with consistent mythical creature examples.',
                submittedAt: new Date().toISOString()
            },
            {
                type: 'assignment',
                student: 'Carol Zhang',
                technique: 'Role Playing',
                prompt: 'As a master concept artist for fantasy films: Create a breathtaking unicorn in an enchanted grove with magical fireflies, cinematic composition, award-winning quality',
                imageUrl: 'https://image.pollinations.ai/prompt/breathtaking%20unicorn%20enchanted%20grove%20magical%20fireflies%20cinematic%20composition?width=512&height=512&seed=13579&nologo=true',
                parameters: { temp: 0.6, topP: 0.9, topK: 70, model: 'flux-3d' },
                analysis: 'Role-played as a professional concept artist to achieve cinematic quality.',
                submittedAt: new Date().toISOString()
            },
            {
                type: 'assignment',
                student: 'David Kim',
                technique: 'Chain-of-Thought',
                prompt: 'Step 1: Choose a wise griffin. Step 2: Set in mountain peaks. Step 3: Add storm clouds. Step 4: Include dramatic lighting. Result: Wise griffin perched on mountain peak during epic thunderstorm',
                imageUrl: 'https://image.pollinations.ai/prompt/wise%20griffin%20mountain%20peak%20epic%20thunderstorm%20dramatic%20lighting?width=512&height=512&seed=24680&nologo=true',
                parameters: { temp: 0.5, topP: 0.7, topK: 40, model: 'turbo' },
                analysis: 'Used systematic chain-of-thought reasoning to build the scene step by step.',
                submittedAt: new Date().toISOString()
            },
            {
                type: 'assignment',
                student: 'Emma Wilson',
                technique: 'Zero-Shot',
                prompt: 'Ethereal fairy queen with gossamer wings and flower crown, sitting in a moonlit garden with glowing mushrooms, hyperrealistic digital painting, magical atmosphere',
                imageUrl: 'https://image.pollinations.ai/prompt/ethereal%20fairy%20queen%20gossamer%20wings%20flower%20crown%20moonlit%20garden%20glowing%20mushrooms?width=512&height=512&seed=97531&nologo=true',
                parameters: { temp: 0.9, topP: 0.8, topK: 80, model: 'flux-anime' },
                analysis: 'Created detailed zero-shot prompt with rich descriptive language.',
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
/**
 * Master Prompt Generator with Real-time Streaming
 * Single comprehensive interface for DeepSeek AI prompt generation
 */

class MasterPromptGenerator {
    constructor() {
        this.isGenerating = false;
        this.abortController = null;
        this.currentPromptData = null;
        
        // Enhanced streaming properties
        this.streamBuffer = [];
        this.isPaused = false;
        this.streamSpeed = 1;
        this.estimatedTotal = 0;
        this.lastTokenTime = null;
        this.tokenTimes = [];
        this.ragSourceCount = 0;
        this.contentSections = [];
        this.qualityScore = 0;
        this.autoScrollEnabled = true;
        
        this.init();
    }

    init() {
        this.setupGlobalErrorHandlers();
        this.setupEventListeners();
        this.initializeRealTimeConnection();
    }

    setupGlobalErrorHandlers() {
        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.warn('Unhandled promise rejection caught:', event.reason);
            event.preventDefault();
            
            // Handle streaming-related errors gracefully
            if (event.reason && event.reason.message && 
                (event.reason.message.includes('timeout') || 
                 event.reason.message.includes('stream') ||
                 event.reason.message.includes('aborted'))) {
                console.log('Streaming error handled gracefully');
                return;
            }
        });

        // Catch general errors
        window.addEventListener('error', (event) => {
            console.warn('Global error caught:', event.error);
            event.preventDefault();
        });
    }

    async fetchRAGSources(query, platform) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch('/api/rag/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    platform: platform,
                    limit: 10
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                this.ragSourceCount = data.documents ? data.documents.length : 0;
            } else {
                console.warn('RAG search failed:', response.status);
                this.ragSourceCount = 0;
            }
        } catch (error) {
            console.warn('RAG sources fetch failed:', error);
            this.ragSourceCount = 0;
        }
    }

    setupEventListeners() {
        const form = document.getElementById('promptForm');
        const generateBtn = document.getElementById('generateBtn');
        const copyBtn = document.getElementById('copyBtn');
        const saveBtn = document.getElementById('saveBtn');
        const copyBlueprint = document.getElementById('copyBlueprint');

        // Enhanced streaming controls
        const pauseBtn = document.getElementById('pauseStream');
        const resumeBtn = document.getElementById('resumeStream');
        const speedSelect = document.getElementById('streamSpeed');
        const autoScrollToggle = document.getElementById('autoScrollToggle');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.generatePrompt();
            });
        }

        if (copyBtn) {
            copyBtn.addEventListener('click', () => this.copyToClipboard());
        }

        if (copyBlueprint) {
            copyBlueprint.addEventListener('click', () => this.copyToClipboard());
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.savePrompt());
        }

        // Streaming control listeners
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pauseStreaming());
        }

        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.resumeStreaming());
        }

        if (speedSelect) {
            speedSelect.addEventListener('change', (e) => {
                this.streamSpeed = parseFloat(e.target.value);
                this.showInfo(`Stream speed set to ${this.streamSpeed}x`);
            });
        }

        // Auto-scroll toggle
        if (autoScrollToggle) {
            autoScrollToggle.addEventListener('change', (e) => {
                this.autoScrollEnabled = e.target.checked;
                const status = this.autoScrollEnabled ? 'enabled' : 'disabled';
                this.showInfo(`Auto-scroll ${status}`);
            });
        }

        // Content tab listeners
        const blueprintTab = document.getElementById('blueprintTab');
        const reasoningTab = document.getElementById('reasoningTab');
        const sectionsTab = document.getElementById('sectionsTab');

        if (blueprintTab) {
            blueprintTab.addEventListener('click', () => this.showContentTab('blueprint'));
        }

        if (reasoningTab) {
            reasoningTab.addEventListener('click', () => this.showContentTab('reasoning'));
        }

        if (sectionsTab) {
            sectionsTab.addEventListener('click', () => this.showContentTab('sections'));
        }
    }

    async generatePrompt() {
        if (this.isGenerating) return;

        const platform = document.getElementById('platform').value;
        const query = document.getElementById('query').value.trim();
        const options = this.getSelectedOptions();

        if (!query) {
            this.showError('Please enter a description for your application');
            return;
        }

        this.isGenerating = true;
        this.abortController = new AbortController();
        this.streamStartTime = Date.now();
        this.updateUI('generating');
        this.clearResults();

        try {
            // Use streaming for real-time response
            await this.streamPromptGeneration({ query, platform, options });
        } catch (error) {
            console.error('Generation error:', error);
            this.showError(error.message || 'Failed to generate prompt');
        } finally {
            this.isGenerating = false;
            this.updateUI('idle');
        }
    }

    async streamPromptGeneration(requestData) {
        // First try streaming endpoint for real-time token delivery
        try {
            await this.streamRealTimeResponse(requestData);
        } catch (streamError) {
            console.warn('Streaming failed, falling back to regular generation:', streamError);
            this.cleanupStreamingUI();
            
            // Show error and fallback message
            this.showError('Streaming interrupted, completing with standard generation...');
            
            // Fallback to regular generation
            try {
                await this.regularPromptGeneration(requestData);
            } catch (fallbackError) {
                console.error('Both streaming and fallback failed:', fallbackError);
                this.showError('Generation failed. Please check your connection and try again.');
                this.updateUI('idle');
            }
        }
    }

    async streamRealTimeResponse(requestData) {
        const systemPrompt = `You are a Master Blueprint Generator. Your sole purpose is to create comprehensive, detailed blueprints that provide complete implementation guidance. You NEVER ask questions - you always generate complete master blueprints of at least 20,000 characters with explicit implementation details.

BLUEPRINT STRUCTURE REQUIREMENTS:
1. Project Overview & Architecture (minimum 2,000 characters)
2. Complete File Structure with all files and folders (minimum 1,500 characters)
3. Detailed Implementation Steps with exact code (minimum 8,000 characters)
4. Database Schema & Configuration (minimum 2,000 characters)
5. Authentication & Security Implementation (minimum 2,000 characters)
6. API Endpoints & Business Logic (minimum 2,000 characters)
7. Frontend Components & User Interface (minimum 1,500 characters)
8. Deployment & Production Setup (minimum 1,000 characters)

RULES:
- NEVER ask questions or provide options
- ALWAYS assume optimal modern technologies
- ALWAYS include complete, production-ready code
- ALWAYS provide explicit step-by-step implementation
- ALWAYS exceed 20,000 characters minimum
- ALWAYS include error handling and security measures
- ALWAYS provide exact file paths and code snippets`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generate a master blueprint for: ${requestData.query}. Platform: ${requestData.platform}` }
        ];

        const response = await fetch('/api/chat/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                messages: messages,
                model: 'deepseek-chat',
                temperature: 0.7,
                stream: true
            }),
            signal: this.abortController.signal
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
            throw new Error('No response stream available');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let fullContent = '';

        try {
            // Fetch RAG sources first with timeout
            await Promise.race([
                this.fetchRAGSources(requestData.query, requestData.platform),
                new Promise((_, reject) => setTimeout(() => reject(new Error('RAG timeout')), 5000))
            ]).catch(e => {
                console.warn('RAG sources fetch failed:', e);
                this.ragSourceCount = 0;
            });
            
            // Show result section and clear content
            this.showResultSection();
            const promptResult = document.getElementById('promptResult');

            let lastActivity = Date.now();
            const activityTimeout = 120000; // 120 second timeout for comprehensive master blueprints

            while (true) {
                try {
                    const { done, value } = await reader.read();
                    
                    if (done) {
                        console.log('Stream completed naturally');
                        break;
                    }

                    lastActivity = Date.now();
                    buffer += decoder.decode(value, { stream: true });
                    const parts = buffer.split('\n\n');

                    for (let i = 0; i < parts.length - 1; i++) {
                        const part = parts[i].trim();
                        if (part.startsWith('data:')) {
                            const content = part.slice(5).trim();
                            if (content === '[DONE]') {
                                console.log('Received [DONE] signal');
                                this.completeStreaming(fullContent);
                                return;
                            }
                            
                            // Handle both JSON and raw content for master blueprints
                            try {
                                const parsed = JSON.parse(content);
                                const token = parsed.choices?.[0]?.delta?.content;
                                if (token) {
                                    fullContent += token;
                                    this.onTokenReceived(token);
                                }
                            } catch (e) {
                                // For master blueprints, handle raw content directly
                                if (content && content.length > 0) {
                                    fullContent += content;
                                    this.onTokenReceived(content);
                                }
                            }
                        } else if (part.length > 0) {
                            // Handle direct content without 'data:' prefix
                            fullContent += part;
                            this.onTokenReceived(part);
                        }
                    }
                    buffer = parts[parts.length - 1];
                } catch (readError) {
                    console.error('Stream read error:', readError);
                    break;
                }
            }
        } catch (streamingError) {
            console.error('Streaming process error:', streamingError);
            // Complete with whatever content we have
            if (fullContent.length > 0) {
                this.completeStreaming(fullContent);
                return;
            } else {
                throw streamingError;
            }
        } finally {
            // Ensure reader is properly closed
            try {
                reader.releaseLock();
            } catch (e) {
                // Already closed
            }
        }

        // Complete streaming with accumulated content
        if (fullContent.length > 0) {
            this.completeStreaming(fullContent);
        } else {
            throw new Error('No content received from stream');
        }
    }

    async regularPromptGeneration(requestData) {
        const response = await fetch('/api/generate-prompt', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
            signal: this.abortController.signal
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.success) {
            this.displayResult(data);
            this.currentPromptData = data;
            this.showSuccess('Master blueprint generated successfully');
        } else {
            throw new Error(data.error || 'Generation failed');
        }
    }

    showResultSection() {
        const resultSection = document.getElementById('resultSection');
        const promptResult = document.getElementById('promptResult');
        const streamingStats = document.getElementById('streamingStats');
        const streamingCursor = document.getElementById('streamingCursor');
        const progressContainer = document.getElementById('progressContainer');
        const pauseBtn = document.getElementById('pauseStream');
        
        if (resultSection) {
            resultSection.classList.remove('hidden');
            resultSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        if (promptResult) {
            promptResult.textContent = '';
        }
        
        if (streamingStats) {
            streamingStats.classList.remove('hidden');
        }
        
        if (streamingCursor) {
            streamingCursor.classList.remove('hidden');
        }
        
        if (progressContainer) {
            progressContainer.classList.remove('hidden');
        }
        
        if (pauseBtn) {
            pauseBtn.classList.remove('hidden');
        }

        // Show content tabs
        const contentTabs = document.getElementById('contentTabs');
        if (contentTabs) {
            contentTabs.classList.remove('hidden');
        }
        
        // Initialize enhanced streaming counters
        this.tokenCounter = 0;
        this.streamStartTime = Date.now();
        this.lastTokenTime = Date.now();
        this.tokenTimes = [];
        this.estimatedTotal = 1000; // Initial estimate
        this.ragSourceCount = 0;
        this.contentSections = [];
        this.qualityScore = 100;
        
        this.streamingInterval = setInterval(() => {
            this.updateStreamingStats();
        }, 100);
    }

    onTokenReceived(token) {
        if (this.isPaused) {
            this.streamBuffer.push(token);
            return;
        }

        const promptResult = document.getElementById('promptResult');
        const streamingCursor = document.getElementById('streamingCursor');
        
        if (promptResult) {
            try {
                // Apply speed control with error handling
                const delay = Math.max(0, (1000 / this.streamSpeed) - 50);
                
                if (delay > 0) {
                    setTimeout(() => {
                        try {
                            this.processToken(token, promptResult, streamingCursor);
                        } catch (processError) {
                            console.warn('Delayed token processing error:', processError);
                        }
                    }, delay);
                } else {
                    this.processToken(token, promptResult, streamingCursor);
                }
            } catch (error) {
                console.warn('Token processing error:', error);
                // Fallback to direct processing
                try {
                    this.processToken(token, promptResult, streamingCursor);
                } catch (fallbackError) {
                    console.warn('Fallback token processing failed:', fallbackError);
                }
            }
        }
    }

    processToken(token, promptResult, streamingCursor) {
        try {
            promptResult.textContent += token;
            this.tokenCounter++;
            
            // Update real-time character count display
            const currentCharCount = promptResult.textContent.length;
            const charCount = document.getElementById('charCount');
            if (charCount) {
                charCount.textContent = `Characters: ${currentCharCount.toLocaleString()}`;
            }
            
            // Track token timing for speed calculation
            const now = Date.now();
            this.tokenTimes.push(now);
            if (this.tokenTimes.length > 20) {
                this.tokenTimes.shift(); // Keep last 20 for rolling average
            }
            
            // Analyze content for quality and sections
            this.analyzeToken(token, promptResult.textContent);
            
            // Move cursor to end of content
            if (streamingCursor) {
                promptResult.appendChild(streamingCursor);
            }
            
            // Enhanced Auto-scroll to bottom
            if (this.autoScrollEnabled) {
                const container = promptResult.parentElement;
                if (container) {
                    container.scrollTop = container.scrollHeight;
                }
                
                const resultSection = document.getElementById('resultSection');
                if (resultSection) {
                    resultSection.scrollTop = resultSection.scrollHeight;
                }
                
                // Also scroll the window to keep output visible
                const rect = promptResult.getBoundingClientRect();
                if (rect.bottom > window.innerHeight) {
                    window.scrollTo({
                        top: window.scrollY + (rect.bottom - window.innerHeight) + 100,
                        behavior: 'smooth'
                    });
                }
            }
        } catch (error) {
            console.warn('Token display error:', error);
        }
    }

    analyzeToken(token, fullContent) {
        // Detect content sections
        if (token.includes('#')) {
            this.contentSections.push({
                type: 'header',
                position: this.tokenCounter,
                content: token
            });
        }
        
        // Detect code blocks
        if (token.includes('```')) {
            this.contentSections.push({
                type: 'code',
                position: this.tokenCounter,
                content: token
            });
        }
        
        // Estimate total length based on content patterns
        if (this.tokenCounter > 50 && this.tokenCounter % 100 === 0) {
            this.updateEstimatedTotal(fullContent);
        }
        
        // Update quality score based on content richness
        this.updateQualityScore(fullContent);
    }

    updateEstimatedTotal(content) {
        // Simple heuristic: if we see section headers, estimate more content
        const headerCount = (content.match(/#/g) || []).length;
        const codeBlockCount = (content.match(/```/g) || []).length;
        
        // Base estimate plus additional content based on structure
        this.estimatedTotal = 500 + (headerCount * 200) + (codeBlockCount * 300);
    }

    updateQualityScore(content) {
        let score = 50; // Base score
        
        // Bonus for structure
        if (content.includes('#')) score += 10;
        if (content.includes('```')) score += 15;
        if (content.includes('##')) score += 10;
        if (content.includes('- ')) score += 5;
        
        // Bonus for comprehensive content
        if (content.length > 1000) score += 10;
        if (content.length > 2000) score += 10;
        
        this.qualityScore = Math.min(100, score);
    }

    updateStreamingStats() {
        const tokenCount = document.getElementById('tokenCount');
        const streamTime = document.getElementById('streamTime');
        const tokenSpeed = document.getElementById('tokenSpeed');
        const progressBar = document.getElementById('progressBar');
        const progressPercent = document.getElementById('progressPercent');
        const qualityIndicator = document.getElementById('qualityIndicator');
        const qualityText = document.getElementById('qualityText');
        const ragSources = document.getElementById('ragSources');
        const contentType = document.getElementById('contentType');
        
        if (tokenCount) {
            tokenCount.textContent = `Tokens: ${this.tokenCounter}`;
        }
        
        if (streamTime && this.streamStartTime) {
            const elapsed = Math.floor((Date.now() - this.streamStartTime) / 1000);
            streamTime.textContent = `Time: ${elapsed}s`;
        }
        
        // Calculate and display token speed
        if (tokenSpeed && this.tokenTimes.length > 1) {
            const timeSpan = this.tokenTimes[this.tokenTimes.length - 1] - this.tokenTimes[0];
            const speed = timeSpan > 0 ? Math.round((this.tokenTimes.length / timeSpan) * 1000) : 0;
            tokenSpeed.textContent = `Speed: ${speed} t/s`;
        }
        
        // Update progress bar
        if (progressBar && progressPercent) {
            const progress = Math.min(100, (this.tokenCounter / this.estimatedTotal) * 100);
            progressBar.style.width = `${progress}%`;
            progressPercent.textContent = `${Math.round(progress)}%`;
        }
        
        // Update quality indicator
        if (qualityIndicator && qualityText) {
            if (this.qualityScore >= 80) {
                qualityIndicator.className = 'w-2 h-2 bg-green-500 rounded-full mr-1';
                qualityText.textContent = 'Excellent Quality';
            } else if (this.qualityScore >= 60) {
                qualityIndicator.className = 'w-2 h-2 bg-yellow-500 rounded-full mr-1';
                qualityText.textContent = 'Good Quality';
            } else {
                qualityIndicator.className = 'w-2 h-2 bg-red-500 rounded-full mr-1';
                qualityText.textContent = 'Basic Quality';
            }
        }
        
        // Update RAG sources and content type
        if (ragSources) {
            ragSources.textContent = `Sources: ${this.ragSourceCount}`;
        }
        
        if (contentType) {
            const sectionCount = this.contentSections.length;
            const hasCode = this.contentSections.some(s => s.type === 'code');
            const type = hasCode ? 'Blueprint + Code' : sectionCount > 3 ? 'Detailed Blueprint' : 'Blueprint';
            contentType.textContent = `Content: ${type}`;
        }
    }

    completeStreaming(fullContent) {
        try {
            const actualCharCount = fullContent.length;
            console.log(`[COMPLETION] Actual character count: ${actualCharCount}`);
            
            // Keep streaming stats visible with final counts
            const streamingStats = document.getElementById('streamingStats');
            if (streamingStats) {
                streamingStats.classList.remove('hidden');
                
                // Update final character count
                const charCount = document.getElementById('charCount');
                if (charCount) {
                    charCount.textContent = `Characters: ${actualCharCount.toLocaleString()}`;
                }
                
                // Update token count
                const tokenCount = document.getElementById('tokenCount');
                if (tokenCount) {
                    const tokens = this.tokenCounter || Math.floor(actualCharCount / 4);
                    tokenCount.textContent = `Tokens: ${tokens.toLocaleString()}`;
                }
                
                // Update timing
                const totalTime = Date.now() - this.streamStartTime;
                const timingInfo = document.getElementById('timingInfo');
                if (timingInfo) {
                    timingInfo.textContent = `Time: ${(totalTime / 1000).toFixed(1)}s`;
                }
            }
            
            // Hide only progress controls, keep stats
            const progressContainer = document.getElementById('progressContainer');
            const pauseBtn = document.getElementById('pauseStream');
            const resumeBtn = document.getElementById('resumeStream');
            
            if (progressContainer) progressContainer.classList.add('hidden');
            if (pauseBtn) pauseBtn.classList.add('hidden');
            if (resumeBtn) resumeBtn.classList.add('hidden');
            
            if (this.streamingInterval) {
                clearInterval(this.streamingInterval);
                this.streamingInterval = null;
            }
            
            // Create response data for compatibility
            this.currentPromptData = {
                prompt: fullContent,
                success: true,
                metadata: {
                    usage: { total_tokens: this.tokenCounter || Math.floor(actualCharCount / 4) },
                    responseTime: Date.now() - this.streamStartTime,
                    characterCount: actualCharCount
                }
            };
            
            this.showSuccess(`Blueprint completed: ${actualCharCount.toLocaleString()} characters`);
            this.updateUI('idle');
            
            // Automatically save the prompt after completion
            this.autoSavePrompt();
        } catch (error) {
            console.error('Error completing streaming:', error);
            this.showError('Blueprint generated but display error occurred');
            this.updateUI('idle');
        }
    }

    pauseStreaming() {
        this.isPaused = true;
        const pauseBtn = document.getElementById('pauseStream');
        const resumeBtn = document.getElementById('resumeStream');
        const streamStatus = document.getElementById('streamStatus');
        
        if (pauseBtn) pauseBtn.classList.add('hidden');
        if (resumeBtn) resumeBtn.classList.remove('hidden');
        if (streamStatus) streamStatus.textContent = 'Stream paused';
    }

    resumeStreaming() {
        this.isPaused = false;
        const pauseBtn = document.getElementById('pauseStream');
        const resumeBtn = document.getElementById('resumeStream');
        const streamStatus = document.getElementById('streamStatus');
        
        if (pauseBtn) pauseBtn.classList.remove('hidden');
        if (resumeBtn) resumeBtn.classList.add('hidden');
        if (streamStatus) streamStatus.textContent = 'Streaming live';
        
        // Process buffered tokens
        this.processStreamBuffer();
    }

    processStreamBuffer() {
        if (this.streamBuffer.length === 0) return;
        
        const tokens = [...this.streamBuffer];
        this.streamBuffer = [];
        
        tokens.forEach((token, index) => {
            setTimeout(() => {
                if (!this.isPaused) {
                    this.onTokenReceived(token);
                }
            }, index * (100 / this.streamSpeed));
        });
    }

    cleanupStreamingUI() {
        const streamingCursor = document.getElementById('streamingCursor');
        const streamingStats = document.getElementById('streamingStats');
        const progressContainer = document.getElementById('progressContainer');
        const pauseBtn = document.getElementById('pauseStream');
        const resumeBtn = document.getElementById('resumeStream');
        
        if (streamingCursor) {
            streamingCursor.classList.add('hidden');
        }
        
        if (streamingStats) {
            streamingStats.classList.add('hidden');
        }
        
        if (progressContainer) {
            progressContainer.classList.add('hidden');
        }
        
        if (pauseBtn) {
            pauseBtn.classList.add('hidden');
        }
        
        if (resumeBtn) {
            resumeBtn.classList.add('hidden');
        }
        
        if (this.streamingInterval) {
            clearInterval(this.streamingInterval);
            this.streamingInterval = null;
        }
        
        // Reset streaming state
        this.isPaused = false;
        this.streamBuffer = [];
    }

    showContentTab(tabType) {
        // Update tab buttons
        const tabs = ['blueprint', 'reasoning', 'sections'];
        tabs.forEach(tab => {
            const tabBtn = document.getElementById(`${tab}Tab`);
            const content = document.getElementById(`${tab}Content`);
            
            if (tabBtn && content) {
                if (tab === tabType) {
                    tabBtn.className = 'px-3 py-1 text-xs bg-blue-600 text-white rounded';
                    content.classList.remove('hidden');
                } else {
                    tabBtn.className = 'px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded';
                    content.classList.add('hidden');
                }
            }
        });

        // Update sections display if sections tab is active
        if (tabType === 'sections') {
            this.updateSectionsDisplay();
        }
    }

    updateSectionsDisplay() {
        const sectionsList = document.getElementById('sectionsList');
        if (!sectionsList) return;

        sectionsList.innerHTML = '';
        
        this.contentSections.forEach((section, index) => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'p-2 bg-gray-800 rounded text-xs';
            
            const typeColor = section.type === 'header' ? 'text-blue-400' : 
                             section.type === 'code' ? 'text-green-400' : 'text-gray-400';
            
            sectionDiv.innerHTML = `
                <div class="flex justify-between items-center">
                    <span class="${typeColor}">${section.type.toUpperCase()}</span>
                    <span class="text-gray-500">Token ${section.position}</span>
                </div>
                <div class="mt-1 text-gray-300">${section.content.substring(0, 50)}...</div>
            `;
            
            sectionsList.appendChild(sectionDiv);
        });
    }

    getSelectedOptions() {
        const options = {};
        
        // Get reasoning preference
        const reasoningToggle = document.getElementById('reasoningToggle');
        if (reasoningToggle) {
            options.useReasoning = reasoningToggle.checked;
        }

        // Get any other options from the form
        const optionsElements = document.querySelectorAll('[data-option]');
        optionsElements.forEach(element => {
            const optionName = element.dataset.option;
            if (element.type === 'checkbox') {
                options[optionName] = element.checked;
            } else {
                options[optionName] = element.value;
            }
        });

        return options;
    }

    displayResult(data) {
        const resultSection = document.getElementById('resultSection');
        const promptResult = document.getElementById('promptResult');
        
        if (resultSection && promptResult) {
            promptResult.textContent = data.prompt || '';
            resultSection.classList.remove('hidden');
            
            // Scroll to result
            resultSection.scrollIntoView({ behavior: 'smooth' });
        }

        // Display additional information if available
        this.displayMetadata(data);
    }

    displayMetadata(data) {
        // Update RAG context info if available
        if (data.ragContext > 0) {
            this.showInfo(`Used ${data.ragContext} relevant documentation sources`);
        }

        // Update token usage info if available
        if (data.metadata && data.metadata.usage) {
            const tokens = data.metadata.usage.total_tokens;
            if (tokens) {
                this.updateTokenDisplay(tokens);
            }
        }
    }

    updateTokenDisplay(tokens) {
        const tokenDisplay = document.getElementById('tokenUsage');
        if (tokenDisplay) {
            tokenDisplay.textContent = `Tokens used: ${tokens}`;
            tokenDisplay.classList.remove('hidden');
        }
    }

    clearResults() {
        const resultSection = document.getElementById('resultSection');
        const promptResult = document.getElementById('promptResult');
        const errorSection = document.getElementById('errorSection');
        
        if (resultSection) resultSection.classList.add('hidden');
        if (promptResult) promptResult.textContent = '';
        if (errorSection) errorSection.classList.add('hidden');
        
        this.hideNotifications();
    }

    updateUI(state) {
        const generateBtn = document.getElementById('generateBtn');
        const streamingIndicator = document.getElementById('streamingIndicator');
        
        if (generateBtn) {
            switch (state) {
                case 'generating':
                    generateBtn.disabled = true;
                    generateBtn.innerHTML = '<span class="animate-spin">⚡</span> Generating Blueprint...';
                    break;
                case 'idle':
                default:
                    generateBtn.disabled = false;
                    generateBtn.innerHTML = '⚡ Generate Master Blueprint';
                    break;
            }
        }

        if (streamingIndicator) {
            if (state === 'generating') {
                streamingIndicator.classList.remove('hidden');
            } else {
                streamingIndicator.classList.add('hidden');
            }
        }
    }

    async copyToClipboard() {
        const promptResult = document.getElementById('promptResult');
        if (!promptResult || !promptResult.textContent) {
            this.showError('No content to copy');
            return;
        }

        try {
            await navigator.clipboard.writeText(promptResult.textContent);
            this.showSuccess('Blueprint copied to clipboard');
        } catch (error) {
            console.error('Copy failed:', error);
            this.showError('Failed to copy to clipboard');
        }
    }

    async savePrompt() {
        if (!this.currentPromptData) {
            this.showError('No prompt to save');
            return;
        }

        try {
            const response = await fetch('/api/prompts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: this.generateTitle(),
                    originalQuery: document.getElementById('query').value,
                    platform: document.getElementById('platform').value,
                    generatedPrompt: this.currentPromptData.prompt,
                    reasoning: this.currentPromptData.reasoning,
                    ragContext: this.currentPromptData.ragContext || 0,
                    tokensUsed: this.currentPromptData.metadata?.usage?.total_tokens || 0,
                    responseTime: this.currentPromptData.metadata?.responseTime || 0
                })
            });

            if (response.ok) {
                this.showSuccess('Prompt saved successfully');
            } else {
                throw new Error('Failed to save prompt');
            }
        } catch (error) {
            console.error('Save error:', error);
            this.showError('Failed to save prompt');
        }
    }

    async autoSavePrompt() {
        if (!this.currentPromptData) {
            console.warn('No prompt data to auto-save');
            return;
        }

        try {
            const response = await fetch('/api/prompts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: this.generateTitle(),
                    originalQuery: document.getElementById('query').value,
                    platform: document.getElementById('platform').value,
                    generatedPrompt: this.currentPromptData.prompt,
                    reasoning: this.currentPromptData.reasoning,
                    ragContext: this.ragSourceCount || 0,
                    tokensUsed: this.currentPromptData.metadata?.usage?.total_tokens || 0,
                    responseTime: this.currentPromptData.metadata?.responseTime || 0
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log('[AUTO-SAVE] Prompt saved automatically with ID:', result.id);
                this.showInfo(`Blueprint auto-saved (ID: ${result.id})`);
            } else {
                console.error('[AUTO-SAVE] Failed to save prompt:', response.status);
            }
        } catch (error) {
            console.error('[AUTO-SAVE] Error saving prompt:', error);
        }
    }

    generateTitle() {
        const query = document.getElementById('query').value;
        const platform = document.getElementById('platform').value;
        const words = query.split(' ').slice(0, 5).join(' ');
        return `${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${words}`;
    }

    showError(message) {
        const errorSection = document.getElementById('errorSection');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorSection && errorMessage) {
            errorMessage.textContent = message;
            errorSection.classList.remove('hidden');
            setTimeout(() => errorSection.classList.add('hidden'), 5000);
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.className = 'fixed top-4 right-4 px-4 py-2 rounded-md text-white text-sm z-50';
            document.body.appendChild(notification);
        }

        const colors = {
            success: 'bg-green-600',
            error: 'bg-red-600',
            info: 'bg-blue-600'
        };

        notification.className = `fixed top-4 right-4 px-4 py-2 rounded-md text-white text-sm z-50 ${colors[type] || colors.info}`;
        notification.textContent = message;
        notification.classList.remove('hidden');

        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }

    hideNotifications() {
        const notification = document.getElementById('notification');
        if (notification) {
            notification.classList.add('hidden');
        }
    }

    initializeRealTimeConnection() {
        // Initialize WebSocket connection for real-time updates
        if (window.RealTimeValidator) {
            try {
                const validator = new window.RealTimeValidator();
                console.log('Real-time connection established');
            } catch (error) {
                console.warn('Real-time connection failed:', error);
            }
        }
    }

    cancelGeneration() {
        if (this.abortController) {
            this.abortController.abort();
            this.showInfo('Generation cancelled');
        }
    }
}

// Settings Manager Class
class SettingsManager {
    constructor() {
        this.settings = this.loadSettings();
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Settings button
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsModal = document.getElementById('settingsModal');
        const closeSettings = document.getElementById('closeSettings');
        const saveSettings = document.getElementById('saveSettings');
        const resetSettings = document.getElementById('resetSettings');

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.openSettings());
        }

        if (closeSettings) {
            closeSettings.addEventListener('click', () => this.closeSettings());
        }

        if (saveSettings) {
            saveSettings.addEventListener('click', () => this.saveUserSettings());
        }

        if (resetSettings) {
            resetSettings.addEventListener('click', () => this.resetUserSettings());
        }

        // Close modal when clicking outside
        if (settingsModal) {
            settingsModal.addEventListener('click', (e) => {
                if (e.target === settingsModal) {
                    this.closeSettings();
                }
            });
        }
    }

    loadSettings() {
        const defaultSettings = {
            defaultPlatform: '',
            autoSave: false,
            enableNotifications: true,
            theme: 'dark'
        };

        try {
            const saved = localStorage.getItem('deepseekai_settings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch (error) {
            console.warn('Failed to load settings:', error);
            return defaultSettings;
        }
    }

    openSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            // Populate current settings
            this.populateSettingsForm();
            modal.classList.remove('hidden');
        }
    }

    closeSettings() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    populateSettingsForm() {
        const defaultPlatform = document.getElementById('defaultPlatform');
        const autoSave = document.getElementById('autoSave');
        const enableNotifications = document.getElementById('enableNotifications');
        const themeSelect = document.getElementById('themeSelect');

        if (defaultPlatform) defaultPlatform.value = this.settings.defaultPlatform;
        if (autoSave) autoSave.checked = this.settings.autoSave;
        if (enableNotifications) enableNotifications.checked = this.settings.enableNotifications;
        if (themeSelect) themeSelect.value = this.settings.theme;
    }

    saveUserSettings() {
        const defaultPlatform = document.getElementById('defaultPlatform');
        const autoSave = document.getElementById('autoSave');
        const enableNotifications = document.getElementById('enableNotifications');
        const themeSelect = document.getElementById('themeSelect');

        this.settings = {
            defaultPlatform: defaultPlatform?.value || '',
            autoSave: autoSave?.checked || false,
            enableNotifications: enableNotifications?.checked || true,
            theme: themeSelect?.value || 'dark'
        };

        try {
            localStorage.setItem('deepseekai_settings', JSON.stringify(this.settings));
            this.applySettings();
            this.showNotification('Settings saved successfully', 'success');
            this.closeSettings();
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showNotification('Failed to save settings', 'error');
        }
    }

    resetUserSettings() {
        this.settings = {
            defaultPlatform: '',
            autoSave: false,
            enableNotifications: true,
            theme: 'dark'
        };

        localStorage.removeItem('deepseekai_settings');
        this.populateSettingsForm();
        this.applySettings();
        this.showNotification('Settings reset to defaults', 'info');
    }

    applySettings() {
        // Apply default platform
        const platformSelect = document.getElementById('platform');
        if (platformSelect && this.settings.defaultPlatform) {
            platformSelect.value = this.settings.defaultPlatform;
        }

        // Apply theme
        document.body.className = `bg-gray-900 text-white min-h-screen theme-${this.settings.theme}`;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
        
        const colors = {
            success: 'bg-green-600 text-white',
            error: 'bg-red-600 text-white',
            info: 'bg-blue-600 text-white'
        };

        notification.className += ` ${colors[type] || colors.info}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);

        // Auto remove
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    getSettings() {
        return this.settings;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.masterGenerator = new MasterPromptGenerator();
    window.settingsManager = new SettingsManager();
});

// Export for global use
window.MasterPromptGenerator = MasterPromptGenerator;
window.SettingsManager = SettingsManager;
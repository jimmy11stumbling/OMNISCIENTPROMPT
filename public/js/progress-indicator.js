class ProgressIndicator {
    constructor() {
        this.container = null;
        this.timer = null;
        this.startTime = null;
        this.currentStage = 0;
        this.isActive = false;
        
        this.stages = [
            { id: 'analyzing', label: 'Analyzing Query', duration: 3000 },
            { id: 'rag', label: 'Searching RAG Database', duration: 2000 },
            { id: 'reasoning', label: 'AI Reasoning Process', duration: 15000 },
            { id: 'generating', label: 'Generating Response', duration: 8000 },
            { id: 'finalizing', label: 'Finalizing Output', duration: 2000 }
        ];
    }

    show(targetElement, options = {}) {
        if (this.isActive) return;
        
        this.isActive = true;
        this.startTime = Date.now();
        this.currentStage = 0;
        
        const config = {
            title: options.title || 'Generating AI Response',
            platform: options.platform || 'DeepSeek',
            query: options.query || '',
            ...options
        };

        this.container = this.createProgressHTML(config);
        
        if (targetElement) {
            targetElement.appendChild(this.container);
        } else {
            document.body.appendChild(this.container);
        }

        this.startProgress();
    }

    createProgressHTML(config) {
        const progressDiv = document.createElement('div');
        progressDiv.className = 'progress-container';
        progressDiv.id = 'aiProgressIndicator';
        
        progressDiv.innerHTML = `
            <div class="progress-header">
                <div class="progress-title">
                    <svg class="progress-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                    </svg>
                    ${config.title}
                </div>
                <div class="progress-timer" id="progressTimer">00:00</div>
            </div>
            
            <div class="progress-bar-container">
                <div class="progress-bar" id="progressBar" style="width: 0%"></div>
            </div>
            
            <div class="progress-stages" id="progressStages">
                ${this.stages.map((stage, index) => `
                    <div class="progress-stage" data-stage="${index}">
                        <div class="stage-icon ${index === 0 ? 'active' : 'pending'}" id="stage-${index}">
                            ${this.getStageIcon(stage.id, index === 0)}
                        </div>
                        <div class="stage-label ${index === 0 ? 'active' : ''}" id="label-${index}">
                            ${stage.label}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="progress-details" id="progressDetails">
                <div id="currentActivity">Initializing AI processing pipeline...</div>
                <div class="progress-metrics">
                    <div class="metric-item">
                        <div class="metric-value" id="platformMetric">${config.platform}</div>
                        <div>Platform</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value" id="stageMetric">1/${this.stages.length}</div>
                        <div>Stage</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value" id="tokensMetric">~</div>
                        <div>Est. Tokens</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-value" id="modelMetric">deepseek-reasoner</div>
                        <div>Model</div>
                    </div>
                </div>
            </div>
        `;
        
        return progressDiv;
    }

    getStageIcon(stageId, isActive = false) {
        const icons = {
            analyzing: isActive ? '🔍' : '○',
            rag: isActive ? '📚' : '○',
            reasoning: isActive ? '🧠' : '○',
            generating: isActive ? '✨' : '○',
            finalizing: isActive ? '📝' : '○'
        };
        return icons[stageId] || '○';
    }

    startProgress() {
        this.updateTimer();
        this.processStages();
        this.animateProgress();
    }

    updateTimer() {
        if (!this.isActive) return;
        
        const elapsed = Date.now() - this.startTime;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const displaySeconds = seconds % 60;
        
        const timerElement = document.getElementById('progressTimer');
        if (timerElement) {
            timerElement.textContent = 
                `${minutes.toString().padStart(2, '0')}:${displaySeconds.toString().padStart(2, '0')}`;
        }
        
        setTimeout(() => this.updateTimer(), 1000);
    }

    processStages() {
        if (!this.isActive || this.currentStage >= this.stages.length) return;
        
        const stage = this.stages[this.currentStage];
        this.updateCurrentStage();
        
        // Simulate stage completion
        setTimeout(() => {
            this.completeCurrentStage();
            this.currentStage++;
            this.processStages();
        }, stage.duration + Math.random() * 2000); // Add some randomness
    }

    updateCurrentStage() {
        const stageElement = document.getElementById(`stage-${this.currentStage}`);
        const labelElement = document.getElementById(`label-${this.currentStage}`);
        const activityElement = document.getElementById('currentActivity');
        const stageMetricElement = document.getElementById('stageMetric');
        
        if (stageElement) {
            stageElement.className = 'stage-icon active';
            stageElement.innerHTML = this.getStageIcon(this.stages[this.currentStage].id, true);
        }
        
        if (labelElement) {
            labelElement.className = 'stage-label active';
        }
        
        if (activityElement) {
            activityElement.textContent = this.getStageActivity(this.stages[this.currentStage].id);
        }
        
        if (stageMetricElement) {
            stageMetricElement.textContent = `${this.currentStage + 1}/${this.stages.length}`;
        }
        
        this.updateTokenEstimate();
    }

    completeCurrentStage() {
        const stageElement = document.getElementById(`stage-${this.currentStage}`);
        const labelElement = document.getElementById(`label-${this.currentStage}`);
        
        if (stageElement) {
            stageElement.className = 'stage-icon completed';
            stageElement.innerHTML = '✓';
        }
        
        if (labelElement) {
            labelElement.className = 'stage-label completed';
        }
    }

    getStageActivity(stageId) {
        const activities = {
            analyzing: 'Parsing input query and identifying key requirements...',
            rag: 'Searching platform documentation for relevant context...',
            reasoning: 'DeepSeek AI is processing your request with advanced reasoning...',
            generating: 'Constructing comprehensive response with platform specifics...',
            finalizing: 'Formatting output and preparing final response...'
        };
        return activities[stageId] || 'Processing...';
    }

    updateTokenEstimate() {
        const tokensElement = document.getElementById('tokensMetric');
        if (tokensElement) {
            const baseTokens = 150;
            const stageMultiplier = (this.currentStage + 1) * 50;
            const estimate = baseTokens + stageMultiplier + Math.floor(Math.random() * 100);
            tokensElement.textContent = `~${estimate}`;
        }
    }

    animateProgress() {
        if (!this.isActive) return;
        
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            const elapsed = Date.now() - this.startTime;
            const totalDuration = this.stages.reduce((sum, stage) => sum + stage.duration, 0);
            const progress = Math.min((elapsed / totalDuration) * 100, 95); // Cap at 95% until completion
            
            progressBar.style.width = `${progress}%`;
        }
        
        setTimeout(() => this.animateProgress(), 100);
    }

    complete(result = {}) {
        if (!this.isActive) return;
        
        this.isActive = false;
        
        // Complete all remaining stages
        for (let i = this.currentStage; i < this.stages.length; i++) {
            const stageElement = document.getElementById(`stage-${i}`);
            const labelElement = document.getElementById(`label-${i}`);
            
            if (stageElement) {
                stageElement.className = 'stage-icon completed';
                stageElement.innerHTML = '✓';
            }
            
            if (labelElement) {
                labelElement.className = 'stage-label completed';
            }
        }
        
        // Complete progress bar
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = '100%';
        }
        
        // Update final metrics
        if (result.tokensUsed) {
            const tokensElement = document.getElementById('tokensMetric');
            if (tokensElement) {
                tokensElement.textContent = result.tokensUsed;
            }
        }
        
        // Update activity
        const activityElement = document.getElementById('currentActivity');
        if (activityElement) {
            activityElement.textContent = result.success 
                ? 'Response generated successfully!' 
                : 'Processing completed.';
        }
        
        // Auto-hide after delay
        setTimeout(() => this.hide(), 2000);
    }

    hide() {
        if (this.container && this.container.parentNode) {
            this.container.style.opacity = '0';
            this.container.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (this.container && this.container.parentNode) {
                    this.container.parentNode.removeChild(this.container);
                }
            }, 300);
        }
        
        this.isActive = false;
        this.container = null;
        this.currentStage = 0;
    }

    updateStatus(message, details = {}) {
        if (!this.isActive) return;
        
        const activityElement = document.getElementById('currentActivity');
        if (activityElement && message) {
            activityElement.textContent = message;
        }
        
        // Update any specific metrics
        Object.keys(details).forEach(key => {
            const element = document.getElementById(`${key}Metric`);
            if (element) {
                element.textContent = details[key];
            }
        });
    }
}

// Global instance
window.ProgressIndicator = new ProgressIndicator();
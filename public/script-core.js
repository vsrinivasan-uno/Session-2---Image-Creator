// Core Essential JavaScript - Loaded immediately for critical functionality
// This module contains only the essential functions needed for immediate interactivity

class CoreLLMPlatform {
    constructor() {
        this.initialized = false;
        this.currentSection = 'playground';
        this.modules = new Map();
        
        // Initialize core functionality immediately
        this.init();
    }

    init() {
        if (this.initialized) return;
        
        // Essential DOM ready handlers
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeCore());
        } else {
            this.initializeCore();
        }
        
        this.initialized = true;
    }

    initializeCore() {
        // Core navigation functionality
        this.setupNavigation();
        
        // Essential event listeners only
        this.setupCriticalEvents();
        
        // Lazy load full functionality after critical path
        this.loadFullPlatform();
    }

    setupNavigation() {
        // Basic navigation switching
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });
    }

    setupCriticalEvents() {
        // Only essential events that must work immediately
        const helpIcon = document.querySelector('.help-icon');
        if (helpIcon) {
            helpIcon.addEventListener('click', () => {
                this.loadModule('wiki').then(module => {
                    if (module && module.openWikiModal) {
                        module.openWikiModal();
                    }
                });
            });
        }
    }

    showSection(section) {
        // Hide all sections
        document.querySelectorAll('.lab-section').forEach(s => {
            s.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(section + '-section');
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = section;
        }
        
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-section="${section}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        // Load section-specific functionality on demand
        this.loadSectionModule(section);
    }

    // Async module loading system
    async loadModule(moduleName) {
        if (this.modules.has(moduleName)) {
            return this.modules.get(moduleName);
        }

        try {
            let module;
            switch (moduleName) {
                case 'full':
                    // Load the full script.js functionality
                    module = await this.loadScript('script.js');
                    break;
                case 'wiki':
                    // Load wiki functionality
                    module = { 
                        openWikiModal: () => {
                            const modal = document.getElementById('wikiModal');
                            if (modal) modal.classList.add('active');
                        }
                    };
                    break;
                default:
                    console.warn('Unknown module:', moduleName);
                    return null;
            }
            
            this.modules.set(moduleName, module);
            return module;
        } catch (error) {
            console.error('Failed to load module:', moduleName, error);
            return null;
        }
    }

    async loadScript(src) {
        return new Promise((resolve, reject) => {
            // Check if script already exists
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve(window.modelBuilder || {});
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => resolve(window.modelBuilder || {});
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async loadSectionModule(section) {
        // Load section-specific functionality on demand
        switch (section) {
            case 'playground':
            case 'assignment':
            case 'gallery':
                // These need full functionality
                await this.loadFullPlatform();
                break;
        }
    }

    async loadFullPlatform() {
        // Load the full platform functionality after critical path
        if (!this.modules.has('full')) {
            setTimeout(async () => {
                await this.loadModule('full');
                console.log('Full platform functionality loaded');
            }, 100); // Small delay to not block critical rendering
        }
    }

    // Utility method for performance monitoring
    measurePerformance() {
        if (window.performance && window.performance.getEntriesByType) {
            const perfData = window.performance.getEntriesByType('navigation')[0];
            if (perfData) {
                console.log('Core Performance Metrics:', {
                    domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
                    loadComplete: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
                    domInteractive: Math.round(perfData.domInteractive - perfData.navigationStart)
                });
            }
        }
    }
}

// Initialize core platform immediately
const corePlatform = new CoreLLMPlatform();

// Expose for debugging
window.corePlatform = corePlatform;

// Global functions that might be called before full load
window.openWikiModal = function() {
    corePlatform.loadModule('wiki').then(module => {
        if (module && module.openWikiModal) {
            module.openWikiModal();
        }
    });
};

window.closeWikiModal = function() {
    const modal = document.getElementById('wikiModal');
    if (modal) modal.classList.remove('active');
};

// Measure performance after load
window.addEventListener('load', () => {
    setTimeout(() => corePlatform.measurePerformance(), 0);
}); 
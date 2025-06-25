// Ultra-minimal JavaScript - Essential functionality only (< 2KB)
(function() {
    'use strict';
    
    // Essential DOM helpers
    const $ = id => document.getElementById(id);
    const $$ = sel => document.querySelectorAll(sel);
    
    // Critical sections to keep immediately
    const criticalSections = ['playground-section'];
    
    // Lazy load non-critical DOM sections
    function hideLazyContent() {
        const sections = $$('.lab-section');
        sections.forEach(section => {
            if (!criticalSections.includes(section.id)) {
                section.style.display = 'none';
                section.dataset.lazyLoad = 'true';
            }
        });
        
        // Hide non-essential technique builders initially
        const builders = $$('.technique-builder');
        builders.forEach((builder, index) => {
            if (index > 0) { // Keep only first builder (zero-shot)
                builder.style.display = 'none';
                builder.dataset.lazyLoad = 'true';
            }
        });
    }
    
    // Load section when needed
    function loadSection(sectionId) {
        const section = $(sectionId + '-section');
        if (section && section.dataset.lazyLoad) {
            section.style.display = 'block';
            section.dataset.lazyLoad = 'false';
        }
    }
    
    // Load technique builder when needed
    function loadTechniqueBuilder(technique) {
        const builder = $(technique + '-build');
        if (builder && builder.dataset.lazyLoad) {
            builder.style.display = 'block';
            builder.dataset.lazyLoad = 'false';
        }
    }
    
    // Basic navigation switching
    function showSection(section) {
        // Load section if lazy loaded
        loadSection(section);
        
        $$('.lab-section').forEach(s => s.classList.remove('active'));
        $$('.nav-btn').forEach(btn => btn.classList.remove('active'));
        
        const target = $(section + '-section');
        const btn = document.querySelector(`[data-section="${section}"]`);
        
        if (target) target.classList.add('active');
        if (btn) btn.classList.add('active');
        
        // Load full functionality on interaction
        if (!window.fullPlatformLoaded) {
            loadFullPlatform();
        }
    }
    
    // Show technique builder
    function showTechnique(technique) {
        // Load technique if lazy loaded
        loadTechniqueBuilder(technique);
        
        $$('.technique-builder').forEach(b => b.classList.remove('active'));
        $$('.technique-tab').forEach(t => t.classList.remove('active'));
        
        const target = $(technique + '-build');
        const tab = document.querySelector(`[data-technique="${technique}"]`);
        
        if (target) target.classList.add('active');
        if (tab) tab.classList.add('active');
    }
    
    // Load full platform asynchronously
    function loadFullPlatform() {
        if (window.fullPlatformLoaded) return;
        
        const script = document.createElement('script');
        script.src = 'script.js';
        script.async = true;
        script.onload = () => {
            window.fullPlatformLoaded = true;
            // Show all lazy loaded content
            $$('[data-lazy-load="true"]').forEach(el => {
                el.style.display = 'block';
                el.dataset.lazyLoad = 'false';
            });
            console.log('Full platform loaded');
        };
        document.head.appendChild(script);
    }
    
    // Service Worker registration
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(console.error);
        });
    }
    
    // Load full stylesheet asynchronously
    function loadFullStyles() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'styles.css';
        link.media = 'print';
        link.onload = () => link.media = 'all';
        document.head.appendChild(link);
    }
    
    // Initialize when DOM is ready
    function init() {
        // Hide non-critical content immediately
        hideLazyContent();
        
        // Setup navigation
        $$('.nav-btn').forEach(btn => {
            btn.addEventListener('click', e => {
                e.preventDefault();
                showSection(e.target.closest('.nav-btn').dataset.section);
            });
        });
        
        // Setup technique tabs
        $$('.technique-tab').forEach(tab => {
            tab.addEventListener('click', e => {
                e.preventDefault();
                showTechnique(e.target.dataset.technique);
            });
        });
        
        // Setup help icon
        const helpIcon = document.querySelector('.help-icon');
        if (helpIcon) {
            helpIcon.addEventListener('click', () => {
                const modal = $('wikiModal');
                if (modal) modal.classList.add('active');
                loadFullPlatform();
            });
        }
        
        // Load full styles
        loadFullStyles();
        
        // Load external resources with delay
        setTimeout(() => {
            const loadFont = href => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = href;
                link.media = 'print';
                link.onload = () => link.media = 'all';
                document.head.appendChild(link);
            };
            
            loadFont('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
            setTimeout(() => loadFont('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'), 100);
        }, 200);
        
        // WebP detection and lazy load backgrounds
        setTimeout(() => {
            // Check WebP support
            const webpTest = new Image();
            webpTest.onload = webpTest.onerror = () => {
                if (webpTest.height === 2) {
                    document.documentElement.classList.add('webp');
                } else {
                    document.documentElement.classList.add('no-webp');
                }
                
                // Load appropriate background images
                const img = new Image();
                img.src = webpTest.height === 2 ? 'ai-ccore-owl-logo.webp' : 'ai-ccore-owl-logo.png';
                img.onload = () => document.body.classList.add('backgrounds-loaded');
            };
            webpTest.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
        }, 300);
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    // Global functions for backwards compatibility
    window.openWikiModal = () => {
        const modal = $('wikiModal');
        if (modal) modal.classList.add('active');
        loadFullPlatform();
    };
    
    window.closeWikiModal = () => {
        const modal = $('wikiModal');
        if (modal) modal.classList.remove('active');
    };
    
    window.showSection = showSection;
    window.showTechnique = showTechnique;
})(); 
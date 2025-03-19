// Main JavaScript file for LeetCode2Anki Plus website

document.addEventListener('DOMContentLoaded', function() {
    // Initialize particle background
    initParticles();
    
    // Initialize 3D tilt effect for cards
    initTilt();
    
    // Initialize demo steps
    initDemoSteps();
    
    // Initialize installation tabs with fix for content visibility
    initInstallationTabs();
    
    // Initialize copy code functionality
    initCodeCopy();
    
    // Initialize animations
    initAnimations();
    
    // Initialize new responsive helpers
    addResponsiveHelpers();
    
    // Initialize enhanced features
    initEnhancedFeatures();
    
    // Fix learning resources section positioning
    fixLearningResourcesPosition();
    
    // Handle window resize events for responsive adjustments
    window.addEventListener('resize', fixLearningResourcesPosition);
});

// Particle background - Update to be more efficient on mobile
function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let particles = [];
    
    // Reduce particle count on mobile devices for better performance
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 20 : 50;
    const connectionDistance = isMobile ? 80 : 150;
    
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        // Re-create particles when resizing to avoid layout issues
        createParticles();
    }
    
    function createParticles() {
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 2 + 1,
                color: `rgba(20, 184, 166, ${Math.random() * 0.3 + 0.1})`,
                speedX: Math.random() * 0.5 - 0.25,
                speedY: Math.random() * 0.5 - 0.25
            });
        }
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // This will also create particles
    
    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        for (const particle of particles) {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fillStyle = particle.color;
            ctx.fill();
            
            // Update position
            particle.x += particle.speedX;
            particle.y += particle.speedY;
            
            // Bounce off edges
            if (particle.x < 0 || particle.x > canvas.width) {
                particle.speedX = -particle.speedX;
            }
            
            if (particle.y < 0 || particle.y > canvas.height) {
                particle.speedY = -particle.speedY;
            }
        }
        
        // Only draw connections between particles if not on a low-end device
        if (!isMobile || particles.length < 30) {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < connectionDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(20, 184, 166, ${0.1 * (1 - distance / connectionDistance)})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }
        }
        
        requestAnimationFrame(drawParticles);
    }
    
    drawParticles();
}

// 3D tilt effect for cards
function initTilt() {
    const tiltElements = document.querySelectorAll('.js-tilt');
    if (tiltElements.length === 0) return;
    
    VanillaTilt.init(tiltElements, {
        max: 15,
        speed: 400,
        glare: true,
        "max-glare": 0.3,
        scale: 1.05
    });
}

// Demo steps functionality
function initDemoSteps() {
    const demoNavButtons = document.querySelectorAll('.demo-nav-btn');
    const demoSteps = document.querySelectorAll('.demo-step');
    const stepCards = document.querySelectorAll('.step-card');
    let currentStepIndex = 0;
    let autoPlayInterval;
    
    if (demoNavButtons.length === 0 || demoSteps.length === 0) return;
    
    function showStep(index) {
        // Update buttons
        demoNavButtons.forEach((btn, i) => {
            btn.classList.toggle('active', i === index);
        });
        
        // Update demo screens
        demoSteps.forEach((step, i) => {
            step.classList.toggle('active', i === index);
            step.classList.toggle('hidden', i !== index);
        });
        
        // Update step cards
        stepCards.forEach((card, i) => {
            card.classList.toggle('active', i === index);
        });
        
        currentStepIndex = index;
    }
    
    function nextStep() {
        let nextIndex = (currentStepIndex + 1) % demoSteps.length;
        showStep(nextIndex);
    }
    
    // Add click event to nav buttons
    demoNavButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            showStep(index);
            resetAutoPlay();
        });
    });
    
    // Auto play steps
    function startAutoPlay() {
        autoPlayInterval = setInterval(nextStep, 5000);
    }
    
    function resetAutoPlay() {
        clearInterval(autoPlayInterval);
        startAutoPlay();
    }
    
    startAutoPlay();
}

// Installation tab functionality - Updated with fixes for tab visibility
function initInstallationTabs() {
    const tabButtons = document.querySelectorAll('.installation-tab');
    const tabPanels = document.querySelectorAll('.installation-panel');
    
    if (tabButtons.length === 0 || tabPanels.length === 0) return;
    
    // Fix: Make sure all panels except the first one are explicitly hidden
    tabPanels.forEach((panel, idx) => {
        if (idx !== 0) {
            panel.classList.add('hidden');
        }
        panel.classList.remove('active');
    });
    
    // Activate the first tab and panel by default
    if (tabButtons.length > 0 && tabPanels.length > 0) {
        tabButtons[0].classList.add('active');
        tabPanels[0].classList.remove('hidden');
        tabPanels[0].classList.add('active');
    }
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panels
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => {
                panel.classList.remove('active');
                panel.classList.add('hidden'); // Ensure all panels are hidden first
            });
            
            // Add active class to current button
            button.classList.add('active');
            
            // Show current panel
            const target = button.getAttribute('data-target');
            const panel = document.getElementById(target);
            if (panel) {
                panel.classList.add('active');
                panel.classList.remove('hidden'); // Unhide the active panel
                
                // Force a reflow to ensure CSS transitions work
                panel.offsetHeight;
                
                // Create a target for page jump if necessary
                if (panel.offsetTop < window.pageYOffset) {
                    window.scrollTo({
                        top: document.querySelector('#installation').offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Add swipe support for mobile devices
    const installationContent = document.querySelector('.installation-content');
    if (installationContent && window.innerWidth < 768) {
        let startX, startY;
        let threshold = 50; // minimum distance for swipe
        
        installationContent.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, false);
        
        installationContent.addEventListener('touchend', (e) => {
            if (!startX || !startY) return;
            
            let diffX = startX - e.changedTouches[0].clientX;
            let diffY = Math.abs(startY - e.changedTouches[0].clientY);
            
            // Only process horizontal swipes (not vertical scrolling)
            if (Math.abs(diffX) > diffY && Math.abs(diffX) > threshold) {
                // Find current active tab
                const activeTab = document.querySelector('.installation-tab.active');
                const tabs = Array.from(document.querySelectorAll('.installation-tab'));
                const currentIndex = tabs.indexOf(activeTab);
                
                if (diffX > 0) {
                    // Swipe left, go to next tab if possible
                    const nextTab = tabs[currentIndex + 1];
                    if (nextTab) nextTab.click();
                } else {
                    // Swipe right, go to previous tab if possible
                    const prevTab = tabs[currentIndex - 1];
                    if (prevTab) prevTab.click(); // FIXED: Changed nextTab to prevTab
                }
            }
            
            startX = null;
            startY = null;
        }, false);
    }
    
    // Add progress bar functionality
    initInstallProgressBar();
}

// Installation progress bar functionality
function initInstallProgressBar() {
    const installationTabs = document.querySelectorAll('.installation-tab');
    if (installationTabs.length === 0) return;
    
    // Create progress bar container if it doesn't exist
    let progressBarContainer = document.querySelector('.installation-progress');
    if (!progressBarContainer) {
        progressBarContainer = document.createElement('div');
        progressBarContainer.classList.add('installation-progress', 'w-full', 'bg-gray-700', 'h-1', 'mt-4');
        
        const progressBar = document.createElement('div');
        progressBar.classList.add('progress-bar', 'bg-primary-500', 'h-full', 'transition-all', 'duration-500');
        progressBar.style.width = '25%'; // Start with first step
        progressBarContainer.appendChild(progressBar);
        
        // Insert after the tabs
        const tabsContainer = installationTabs[0].closest('nav');
        if (tabsContainer) {
            tabsContainer.after(progressBarContainer);
        }
    }
    
    const progressBar = progressBarContainer.querySelector('.progress-bar');
    
    // Update progress when tab is clicked
    installationTabs.forEach((tab, index) => {
        tab.addEventListener('click', function() {
            const progress = ((index + 1) / installationTabs.length) * 100;
            progressBar.style.width = `${progress}%`;
        });
    });
}

// Copy code functionality
function initCodeCopy() {
    const copyButtons = document.querySelectorAll('.copy-code-btn');
    
    if (copyButtons.length === 0) return;
    
    copyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            const codeId = button.getAttribute('data-code-id');
            const codeBlock = document.getElementById(codeId);
            
            if (codeBlock) {
                const codeText = codeBlock.querySelector('code').textContent;
                navigator.clipboard.writeText(codeText).then(() => {
                    // Show success feedback
                    const originalText = button.textContent;
                    button.textContent = 'Copied!';
                    setTimeout(() => {
                        button.textContent = originalText;
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy: ', err);
                });
            }
        });
    });
}

// GSAP animations - Fixed selectors
function initAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    
    gsap.registerPlugin(ScrollTrigger);
    
    // Reduce animation complexity on mobile
    const isMobile = window.innerWidth < 768;
    const animationDuration = isMobile ? 0.5 : 0.8;
    
    // Feature cards animation with updated duration - Fix selector
    const featureCards = document.querySelectorAll('.feature-card');
    if (featureCards.length > 0) {
        gsap.from(featureCards, {
            y: 50,
            opacity: 0,
            duration: animationDuration,
            ease: "power3.out",
            stagger: isMobile ? 0.05 : 0.1,
            scrollTrigger: {
                trigger: featureCards[0].parentElement,
                start: "top 85%",
                toggleActions: "play none none none"
            }
        });
    }
    
    // Installation steps animation - Fix selector
    const installationTabs = document.querySelectorAll('.installation-tab');
    if (installationTabs.length > 0) {
        gsap.from(installationTabs, {
            y: 20,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: '#installation',
                start: "top 60%",
                toggleActions: "play none none none"
            },
            delay: 0.2
        });
    }
    
    // FAQ items animation - Fix selector
    const faqItems = document.querySelectorAll('#faq .faq-item');
    if (faqItems.length > 0) {
        gsap.from(faqItems, {
            y: 30,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power2.out",
            scrollTrigger: {
                trigger: '#faq',
                start: "top 85%",
                toggleActions: "play none none none"
            }
        });
    }
}

// Add this function to improve responsiveness
function addResponsiveHelpers() {
    // Enable proper viewport height on mobile browsers
    function setVhProperty() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    window.addEventListener('resize', setVhProperty);
    window.addEventListener('orientationchange', setVhProperty);
    setVhProperty();
    
    // Fix for iOS Safari overscroll
    document.addEventListener('touchmove', function(e) {
        if (e.target.closest('.demo-container, pre, table')) {
            // Allow scrolling in specific containers
            return;
        }
    }, { passive: true });
    
    // Improve FAQ animations
    initFaqAnimations();
}

// Fix learning resources section positioning to avoid overlaps
function fixLearningResourcesPosition() {
    const learningSection = document.querySelector('.learning-resources-section');
    const floatingCards = document.querySelector('.floating-cards');
    
    if (!learningSection) return;
    
    // Default margin for the learning section
    let marginTop = '3.3rem'; // Increased by 10% from 3rem
    
    // On smaller screens or when floating cards aren't visible, keep default margin
    if (window.innerWidth < 1024 || !floatingCards) {
        learningSection.style.marginTop = marginTop;
        return;
    }
    
    // Get the height of the floating cards container
    const floatingCardsHeight = floatingCards.offsetHeight;
    
    // Calculate appropriate margin based on the cards' height and position
    if (window.innerWidth >= 1280) {
        marginTop = Math.max(floatingCardsHeight - 90, 176) + 'px'; // Increased by 10%
    } else {
        marginTop = Math.max(floatingCardsHeight - 180, 132) + 'px'; // Increased by 10%
    }
    
    // Apply the adjusted margin with an extra buffer
    learningSection.style.marginTop = marginTop;
    
    // Add a bit of animation for smooth transition
    learningSection.style.transition = 'margin-top 0.3s ease-in-out';
}

// New function to specifically handle FAQ animations
function initFaqAnimations() {
    // Wait for Alpine.js to be ready
    document.addEventListener('alpine:initialized', () => {
        // Find all FAQ items
        const faqItems = document.querySelectorAll('.faq-item');
        
        faqItems.forEach(item => {
            const button = item.querySelector('button');
            const content = item.querySelector('[x-collapse]');
            
            if (button && content) {
                // Make opening/closing smoother
                button.addEventListener('click', () => {
                    // Add animation classes to content children for smooth transition
                    const contentElements = content.querySelectorAll('p, code, ul, ol, li');
                    
                    // Check if this item is opening or closing based on Alpine's data state
                    setTimeout(() => {
                        // Alpine.js needs a moment to update its internal state
                        const isOpening = content.style.height !== '0px';
                        
                        if (isOpening) {
                            // When opening, fade and slide in the content
                            contentElements.forEach((el, i) => {
                                el.style.opacity = '0';
                                el.style.transform = 'translateY(20px)'; // Start from further down
                                
                                // Stagger the animations for a nicer effect
                                setTimeout(() => {
                                    el.style.opacity = '1';
                                    el.style.transform = 'translateY(0)';
                                }, 100 + (i * 100)); // Slower animation with more delay
                            });
                            
                            // Add a nice box shadow effect when open
                            item.style.boxShadow = '0 10px 25px -5px rgba(20, 184, 166, 0.1), 0 10px 10px -5px rgba(20, 184, 166, 0.04)';
                            
                            // Ensure proper height before animation starts
                            // This prevents the jumping effect during transition
                            setTimeout(() => {
                                content.style.height = content.scrollHeight + 'px';
                            }, 50);
                        } else {
                            // Reset box shadow when closing
                            item.style.boxShadow = '';
                            
                            // Fade out content for smoother closing
                            contentElements.forEach(el => {
                                el.style.opacity = '0';
                                el.style.transform = 'translateY(10px)';
                            });
                        }
                    }, 50); // Slightly longer delay to ensure Alpine has updated
                });
                
                // Observe content height changes to adjust spacing
                const observer = new MutationObserver((mutations) => {
                    // Add a slight delay to let the animation complete
                    setTimeout(() => {
                        document.dispatchEvent(new CustomEvent('faq-expanded'));
                    }, 500); // Increase delay to match slower transitions
                });
                
                observer.observe(content, { attributes: true });
            }
        });
        
        // Listen for the custom event to handle smooth transitions
        document.addEventListener('faq-expanded', () => {
            // Smooth scroll to the currently open FAQ item if it's not fully visible
            const openItem = document.querySelector('.faq-item[x-data] [x-show]:not([x-show="false"])');
            if (openItem) {
                const rect = openItem.getBoundingClientRect();
                const isFullyVisible = 
                    rect.top >= 0 &&
                    rect.bottom <= window.innerHeight;
                
                if (!isFullyVisible) {
                    const headerOffset = 100; // Adjust for fixed header
                    const itemPosition = rect.top + window.pageYOffset;
                    window.scrollTo({
                        top: itemPosition - headerOffset,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// Initialize enhanced interactive features
function initEnhancedFeatures() {
    // Import and initialize enhanced features if the script is loaded
    if (typeof initTypeWriter === 'function') {
        initTypeWriter();
    }
    
    if (typeof initSmoothScroll === 'function') {
        initSmoothScroll();
    }
    
    if (typeof initNumberCounters === 'function') {
        initNumberCounters();
    }
    
    if (typeof initRevealOnScroll === 'function') {
        initRevealOnScroll();
    }
    
    // Initialize learning resources section special effects
    initLearningResourcesSection();
    
    // Add download statistics counters
    initDownloadStats();
    
    // Add video player functionality
    initVideoPlayer();
}

// Special effects for the learning resources section
function initLearningResourcesSection() {
    const section = document.querySelector('.learning-resources-section');
    if (!section) return;
    
    // Add the animated border effect
    section.classList.add('animated-border');
    
    // Add rainbow hover effect to the icon
    const icon = section.querySelector('.animated-icon');
    if (icon) {
        icon.classList.add('animate-glow');
    }
    
    // Add hover effect to the link
    const link = section.querySelector('a');
    if (link) {
        link.classList.add('link-underline');
    }
}

// Initialize fake download stats with animated counters
function initDownloadStats() {
    const counters = document.querySelectorAll('.counter');
    if (!counters.length) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'));
                let current = 0;
                const increment = Math.ceil(target / 50);
                const timer = setInterval(() => {
                    current += increment;
                    if (current > target) {
                        current = target;
                        clearInterval(timer);
                    }
                    counter.textContent = current;
                }, 30);
                
                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.1 });
    
    counters.forEach(counter => {
        observer.observe(counter);
    });
}

// Initialize video player for demo section
function initVideoPlayer() {
    const playButton = document.querySelector('.play-button');
    if (!playButton) return;
    
    playButton.addEventListener('click', function() {
        const videoPlaceholder = this.closest('.video-placeholder');
        if (videoPlaceholder) {
            // Replace placeholder with embedded video
            const videoContainer = videoPlaceholder.parentElement;
            
            // Create iframe with YouTube embed
            const iframe = document.createElement('iframe');
            iframe.setAttribute('src', 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1'); // Replace with actual video ID
            iframe.setAttribute('frameborder', '0');
            iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
            iframe.setAttribute('allowfullscreen', '');
            iframe.style.position = 'absolute';
            iframe.style.top = '0';
            iframe.style.left = '0';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            
            // Clear placeholder and add iframe
            videoContainer.innerHTML = '';
            videoContainer.appendChild(iframe);
        }
    });
}

// Add highlight effect to active features when scrolling
function initActiveFeatureHighlight() {
    const features = document.querySelectorAll('.feature-card');
    if (features.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('border-primary-500');
                entry.target.classList.add('shadow-lg');
                
                // Highlight icon
                const icon = entry.target.querySelector('.absolute');
                if (icon) {
                    icon.classList.add('bg-primary-500');
                    icon.classList.add('scale-110');
                }
                
                // Remove highlight after 1.5 seconds
                setTimeout(() => {
                    entry.target.classList.remove('border-primary-500');
                    entry.target.classList.remove('shadow-lg');
                    
                    if (icon) {
                        icon.classList.remove('bg-primary-500');
                        icon.classList.remove('scale-110');
                    }
                }, 1500);
            }
        });
    }, { threshold: 0.7 });
    
    features.forEach(feature => {
        observer.observe(feature);
    });
}

// Add scroll-triggered animations for installation steps
document.addEventListener('DOMContentLoaded', function() {
    if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);
        
        // Create timeline for installation section - Fix selector
        const installationPanels = document.querySelectorAll('.installation-panel');
        
        installationPanels.forEach((panel) => {
            const cards = panel.querySelectorAll('.bg-darkcard');
            if (cards.length > 0) {
                gsap.timeline({
                    scrollTrigger: {
                        trigger: panel,
                        start: "top 80%",
                        toggleActions: "play none none none",
                        markers: false
                    }
                })
                .from(cards, {
                    y: 30,
                    opacity: 0,
                    stagger: 0.15,
                    duration: 0.6,
                    ease: "power2.out"
                });
            }
        });
    }
});

// Use MutationObserver to detect active tab changes and animate content
function initTabContentAnimations() {
    const tabContent = document.querySelector('.installation-content');
    if (!tabContent) return;
    
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const panel = mutation.target;
                if (panel.classList.contains('active') && !panel.classList.contains('animated')) {
                    panel.classList.add('animated');
                    
                    // Animate content
                    const elements = panel.querySelectorAll('h3, p, ol, ul, .bg-darkcard');
                    elements.forEach((el, i) => {
                        el.style.opacity = '0';
                        el.style.transform = 'translateY(20px)';
                        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                        el.style.transitionDelay = `${i * 0.1}s`;
                        
                        setTimeout(() => {
                            el.style.opacity = '1';
                            el.style.transform = 'translateY(0)';
                        }, 50);
                    });
                }
            }
        });
    });
    
    const panels = document.querySelectorAll('.installation-panel');
    panels.forEach(panel => {
        observer.observe(panel, { attributes: true });
    });
}

// Call the new initialization functions
window.addEventListener('load', function() {
    initActiveFeatureHighlight();
    initTabContentAnimations();
    
    // Add "animated" class to elements that should be animated on page load
    document.querySelectorAll('.feature-card, .learning-resources-section').forEach(el => {
        el.classList.add('animate-on-scroll');
    });
    
    // Ensure the first installation panel is visible
    const firstPanel = document.getElementById('anki-step');
    if (firstPanel) {
        firstPanel.classList.add('active');
        firstPanel.classList.remove('hidden');
        firstPanel.style.display = 'block'; // Force display to be visible
        
        // Force reflow for CSS transitions to work
        firstPanel.offsetHeight;
    }
    
    // Ensure the first tab button is highlighted
    const firstTab = document.querySelector('.installation-tab');
    if (firstTab) {
        firstTab.classList.add('active');
    }
});

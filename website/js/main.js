// Main JavaScript file for LeetCode2Anki Plus website

document.addEventListener('DOMContentLoaded', function() {
    // Initialize particle background
    initParticles();
    
    // Initialize 3D tilt effect for cards
    initTilt();
    
    // Initialize demo steps
    initDemoSteps();
    
    // Initialize installation tabs
    initInstallationTabs();
    
    // Initialize copy code functionality
    initCodeCopy();
    
    // Initialize animations
    initAnimations();
    
    // Initialize new responsive helpers
    addResponsiveHelpers();
    
    // Initialize enhanced features
    initEnhancedFeatures();
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

// Installation tab functionality
function initInstallationTabs() {
    const tabButtons = document.querySelectorAll('.installation-tab');
    const tabPanels = document.querySelectorAll('.installation-panel');
    
    if (tabButtons.length === 0 || tabPanels.length === 0) return;
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panels
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanels.forEach(panel => panel.classList.remove('active'));
            
            // Add active class to current button
            button.classList.add('active');
            
            // Show current panel
            const target = button.getAttribute('data-target');
            const panel = document.getElementById(target);
            if (panel) {
                panel.classList.add('active');
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
            let diffY = startY - e.changedTouches[0].clientY;
            
            // If horizontal swipe is more prominent than vertical
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
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
                    if (prevTab) prevTab.click();
                }
            }
            
            startX = null;
            startY = null;
        }, false);
    }
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

// GSAP animations
function initAnimations() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    
    gsap.registerPlugin(ScrollTrigger);
    
    // Reduce animation complexity on mobile
    const isMobile = window.innerWidth < 768;
    const animationDuration = isMobile ? 0.5 : 0.8;
    
    // Feature cards animation with updated duration
    gsap.utils.toArray('.feature-card').forEach((card, i) => {
        gsap.from(card, {
            y: 50,
            opacity: 0,
            duration: animationDuration,
            ease: "power3.out",
            scrollTrigger: {
                trigger: card,
                start: "top 85%", // Show animations earlier on mobile
                toggleActions: "play none none none"
            },
            delay: isMobile ? (i * 0.05) : (i * 0.1) // Shorter delays on mobile
        });
    });
    
    // Installation steps animation
    gsap.utils.toArray('.installation-tab').forEach((tab, i) => {
        gsap.from(tab, {
            y: 20,
            opacity: 0,
            duration: 0.5,
            ease: "power2.out",
            scrollTrigger: {
                trigger: '#installation',
                start: "top 60%",
                toggleActions: "play none none none"
            },
            delay: 0.2 + i * 0.1
        });
    });
    
    // FAQ items animation
    gsap.utils.toArray('#faq .bg-darkcard').forEach((item, i) => {
        gsap.from(item, {
            y: 30,
            opacity: 0,
            duration: 0.6,
            ease: "power2.out",
            scrollTrigger: {
                trigger: item,
                start: "top 85%",
                toggleActions: "play none none none"
            },
            delay: i * 0.1
        });
    });
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
        
        // Create timeline for installation section
        gsap.utils.toArray('.installation-panel').forEach((panel, i) => {
            const cards = panel.querySelectorAll('.bg-darkcard');
            
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
});

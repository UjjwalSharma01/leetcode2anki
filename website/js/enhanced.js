/**
 * Enhanced interactive features for LeetCode2Anki Plus website
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize more advanced features
    initTypeWriter();
    initSmoothScroll();
    initNumberCounters();
    initRevealOnScroll();
    initDarkModeToggle();
    initInteractiveFeatureCards();
    initInstallProgressBar();
    customCarouselInit();
    addFAQInteractions();
    
    // Hide preloader after everything has loaded
    setTimeout(hidePreloader, 1000);
});

// Typewriter effect for landing title
function initTypeWriter() {
    const textElement = document.querySelector('.typed-text-container');
    if (!textElement) return;

    const textContent = textElement.textContent;
    textElement.textContent = '';
    
    let i = 0;
    const typingSpeed = 100; // milliseconds per character
    
    function type() {
        if (i < textContent.length) {
            textElement.textContent += textContent.charAt(i);
            i++;
            setTimeout(type, typingSpeed);
        }
    }
    
    // Start typing animation after a short delay
    setTimeout(type, 500);
}

// Smooth scrolling for anchor links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            
            // Check if this is a mobile menu link that should close the menu
            const isMobileLink = this.closest('.md\\:hidden');
            
            const targetId = this.getAttribute('href');
            if (targetId === "#") return; // Ignore empty anchors
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Calculate header height to offset scroll position
                const header = document.querySelector('nav');
                const headerOffset = header ? header.offsetHeight : 0;
                
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerOffset - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Animated number counters
function initNumberCounters() {
    const counters = document.querySelectorAll('.counter');
    
    if (counters.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-target'), 10);
                const duration = 2000; // milliseconds for animation
                const startTime = Date.now();
                const startValue = 0;
                
                function updateCounter() {
                    const elapsedTime = Date.now() - startTime;
                    const progress = Math.min(elapsedTime / duration, 1);
                    const easedProgress = easeOutQuad(progress); // Apply easing function
                    const currentValue = Math.floor(startValue + easedProgress * (target - startValue));
                    
                    counter.textContent = currentValue;
                    
                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                        observer.unobserve(counter);
                    }
                }
                
                updateCounter();
            }
        });
    }, { threshold: 0.1 });
    
    counters.forEach(counter => {
        observer.observe(counter);
    });
    
    // Easing function for smoother animation
    function easeOutQuad(t) {
        return t * (2 - t);
    }
}

// Reveal elements on scroll
function initRevealOnScroll() {
    const revealElements = document.querySelectorAll('.animate-on-scroll');
    
    if (revealElements.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });
    
    revealElements.forEach(element => {
        element.classList.add('reveal');
        observer.observe(element);
    });
}

// Dark mode toggle functionality
function initDarkModeToggle() {
    const darkModeToggle = document.querySelector('.theme-switch button');
    if (!darkModeToggle) return;
    
    darkModeToggle.addEventListener('click', function() {
        document.documentElement.classList.toggle('dark');
        const isDarkMode = document.documentElement.classList.contains('dark');
        
        // Store preference in localStorage
        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
        
        // Update background colors and text accordingly
        applyDarkModeStyles(isDarkMode);
    });
    
    // Check for saved user preference
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode === 'enabled') {
        document.documentElement.classList.add('dark');
        applyDarkModeStyles(true);
    } else if (savedMode === 'disabled') {
        document.documentElement.classList.remove('dark');
        applyDarkModeStyles(false);
    } else {
        // Check system preference if no saved preference
        const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.classList.toggle('dark', prefersDarkMode);
        applyDarkModeStyles(prefersDarkMode);
    }
}

function applyDarkModeStyles(isDark) {
    if (isDark) {
        document.body.classList.add('bg-darkbg');
        document.body.classList.add('text-gray-100');
    } else {
        document.body.classList.remove('bg-darkbg');
        document.body.classList.remove('text-gray-100');
        document.body.classList.add('bg-gray-50');
        document.body.classList.add('text-gray-900');
    }
}

// Interactive feature cards with hover effects
function initInteractiveFeatureCards() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            // Find icon in the card
            const iconContainer = this.querySelector('div.absolute');
            if (iconContainer) {
                iconContainer.classList.add('animate-bounce');
            }
        });
        
        card.addEventListener('mouseleave', function() {
            const iconContainer = this.querySelector('div.absolute');
            if (iconContainer) {
                iconContainer.classList.remove('animate-bounce');
            }
        });
    });
}

// Installation step progress visualization
function initInstallProgressBar() {
    const installationTabs = document.querySelectorAll('.installation-tab');
    if (installationTabs.length === 0) return;
    
    // Create progress bar container if it doesn't exist
    let progressBarContainer = document.querySelector('.installation-progress');
    if (!progressBarContainer) {
        progressBarContainer = document.createElement('div');
        progressBarContainer.classList.add('installation-progress', 'w-full', 'bg-gray-700', 'h-1', 'mt-4');
        
        const progressBar = document.createElement('div');
        progressBar.classList.add('progress-bar');
        progressBarContainer.appendChild(progressBar);
        
        // Insert after the tabs
        const tabsContainer = installationTabs[0].closest('nav');
        tabsContainer.after(progressBarContainer);
    }
    
    const progressBar = progressBarContainer.querySelector('.progress-bar');
    
    // Update progress when tab is clicked
    installationTabs.forEach((tab, index) => {
        tab.addEventListener('click', function() {
            const progress = ((index + 1) / installationTabs.length) * 100;
            progressBar.style.width = `${progress}%`;
        });
    });
    
    // Set initial progress based on active tab
    const activeTabIndex = Array.from(installationTabs).findIndex(tab => tab.classList.contains('active'));
    if (activeTabIndex !== -1) {
        const initialProgress = ((activeTabIndex + 1) / installationTabs.length) * 100;
        progressBar.style.width = `${initialProgress}%`;
    }
}

// Custom interactive carousel
function customCarouselInit() {
    const carousel = document.querySelector('.custom-carousel');
    if (!carousel) return;
    
    const slides = carousel.querySelectorAll('.carousel-slide');
    const totalSlides = slides.length;
    let currentSlide = 0;
    
    // Create navigation dots
    const dotsContainer = document.createElement('div');
    dotsContainer.classList.add('flex', 'justify-center', 'mt-4', 'space-x-2');
    
    slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.classList.add('w-3', 'h-3', 'rounded-full', 'bg-gray-400', 'transition-all');
        if (i === 0) dot.classList.add('bg-primary-500', 'w-6');
        
        dot.addEventListener('click', () => {
            goToSlide(i);
        });
        
        dotsContainer.appendChild(dot);
    });
    
    carousel.appendChild(dotsContainer);
    
    // Add left and right navigation buttons
    const prevButton = document.createElement('button');
    prevButton.classList.add('absolute', 'left-4', 'top-1/2', 'transform', '-translate-y-1/2', 'bg-darkcard', 'rounded-full', 'p-2', 'text-white', 'shadow-lg', 'hover:bg-gray-700', 'focus:outline-none', 'z-10');
    prevButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>';
    
    const nextButton = document.createElement('button');
    nextButton.classList.add('absolute', 'right-4', 'top-1/2', 'transform', '-translate-y-1/2', 'bg-darkcard', 'rounded-full', 'p-2', 'text-white', 'shadow-lg', 'hover:bg-gray-700', 'focus:outline-none', 'z-10');
    nextButton.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>';
    
    carousel.appendChild(prevButton);
    carousel.appendChild(nextButton);
    
    prevButton.addEventListener('click', () => {
        goToSlide(currentSlide - 1);
    });
    
    nextButton.addEventListener('click', () => {
        goToSlide(currentSlide + 1);
    });
    
    // Add swipe support
    let startX;
    carousel.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
    }, { passive: true });
    
    carousel.addEventListener('touchend', (e) => {
        const diffX = startX - e.changedTouches[0].clientX;
        
        if (Math.abs(diffX) > 50) { // Minimum swipe distance
            if (diffX > 0) {
                goToSlide(currentSlide + 1);
            } else {
                goToSlide(currentSlide - 1);
            }
        }
    }, { passive: true });
    
    // Slide navigation function
    function goToSlide(index) {
        // Handle wraparound
        if (index < 0) {
            index = totalSlides - 1;
        } else if (index >= totalSlides) {
            index = 0;
        }
        
        // Update slide positions
        slides.forEach((slide, i) => {
            slide.style.transform = `translateX(${(i - index) * 100}%)`;
            slide.style.opacity = i === index ? '1' : '0.6';
            slide.style.transition = 'transform 0.5s ease, opacity 0.5s ease';
        });
        
        // Update dot indicators
        const dots = dotsContainer.querySelectorAll('button');
        dots.forEach((dot, i) => {
            if (i === index) {
                dot.classList.add('bg-primary-500', 'w-6');
                dot.classList.remove('bg-gray-400');
            } else {
                dot.classList.add('bg-gray-400');
                dot.classList.remove('bg-primary-500', 'w-6');
                dot.classList.add('w-3');
            }
        });
        
        currentSlide = index;
    }
    
    // Auto-advance the carousel
    let interval = setInterval(() => {
        goToSlide(currentSlide + 1);
    }, 5000);
    
    // Pause auto-advance on hover
    carousel.addEventListener('mouseenter', () => {
        clearInterval(interval);
    });
    
    carousel.addEventListener('mouseleave', () => {
        interval = setInterval(() => {
            goToSlide(currentSlide + 1);
        }, 5000);
    });
    
    // Initialize slide positions
    goToSlide(0);
}

// Enhanced FAQ interactions
function addFAQInteractions() {
    const faqItems = document.querySelectorAll('.faq-item');
    if (faqItems.length === 0) return;
    
    faqItems.forEach(item => {
        const button = item.querySelector('button');
        const content = item.querySelector('[x-show]');
        
        if (!button || !content) return;
        
        // Add hover effect
        item.addEventListener('mouseenter', function() {
            this.classList.add('bg-gray-800/30', 'transform', 'scale-[1.02]');
            this.style.transition = 'all 0.3s ease';
            
            // Highlight the icon inside button if any
            const icon = button.querySelector('svg');
            if (icon) {
                icon.classList.add('text-primary-400');
            }
        });
        
        item.addEventListener('mouseleave', function() {
            // Only remove effects if not selected/open
            if (!this.classList.contains('border-primary-500')) {
                this.classList.remove('bg-gray-800/30', 'transform', 'scale-[1.02]');
            }
            
            // Reset icon if not selected
            if (!button.getAttribute('aria-expanded')) {
                const icon = button.querySelector('svg');
                if (icon) {
                    icon.classList.remove('text-primary-400');
                }
            }
        });
    });
}

// Hide preloader when page is ready
function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
    }
}

// Add particles.js initialization
function initParticlesJS() {
    if (typeof particlesJS !== 'undefined' && document.getElementById('particles-js')) {
        particlesJS('particles-js', {
            "particles": {
                "number": {
                    "value": 80,
                    "density": {
                        "enable": true,
                        "value_area": 800
                    }
                },
                "color": {
                    "value": "#14b8a6"
                },
                "shape": {
                    "type": "circle",
                    "stroke": {
                        "width": 0,
                        "color": "#000000"
                    },
                    "polygon": {
                        "nb_sides": 5
                    }
                },
                "opacity": {
                    "value": 0.5,
                    "random": false,
                    "anim": {
                        "enable": false,
                        "speed": 1,
                        "opacity_min": 0.1,
                        "sync": false
                    }
                },
                "size": {
                    "value": 3,
                    "random": true,
                    "anim": {
                        "enable": false,
                        "speed": 40,
                        "size_min": 0.1,
                        "sync": false
                    }
                },
                "line_linked": {
                    "enable": true,
                    "distance": 150,
                    "color": "#14b8a6",
                    "opacity": 0.4,
                    "width": 1
                },
                "move": {
                    "enable": true,
                    "speed": 2,
                    "direction": "none",
                    "random": false,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false,
                    "attract": {
                        "enable": false,
                        "rotateX": 600,
                        "rotateY": 1200
                    }
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": {
                        "enable": true,
                        "mode": "grab"
                    },
                    "onclick": {
                        "enable": true,
                        "mode": "push"
                    },
                    "resize": true
                },
                "modes": {
                    "grab": {
                        "distance": 140,
                        "line_linked": {
                            "opacity": 1
                        }
                    },
                    "bubble": {
                        "distance": 400,
                        "size": 40,
                        "duration": 2,
                        "opacity": 8,
                        "speed": 3
                    },
                    "repulse": {
                        "distance": 200,
                        "duration": 0.4
                    },
                    "push": {
                        "particles_nb": 4
                    },
                    "remove": {
                        "particles_nb": 2
                    }
                }
            },
            "retina_detect": true
        });
    }
}

// Call the initialization functions not called in DOMContentLoaded
window.addEventListener('load', function() {
    // Initialize particles.js if available
    initParticlesJS();
    
    // Add scroll indicator
    addScrollIndicator();
});

// Add scroll indicator to hero section
function addScrollIndicator() {
    const heroSection = document.querySelector('section.relative.pt-24');
    if (!heroSection) return;
    
    const scrollIndicator = document.createElement('div');
    scrollIndicator.classList.add('scroll-indicator');
    scrollIndicator.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
        <span>Scroll down</span>
    `;
    
    heroSection.appendChild(scrollIndicator);
    
    // Hide scroll indicator on scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            scrollIndicator.style.opacity = '0';
            setTimeout(() => {
                if (scrollIndicator.parentNode) {
                    scrollIndicator.parentNode.removeChild(scrollIndicator);
                }
            }, 500);
        }
    });
}

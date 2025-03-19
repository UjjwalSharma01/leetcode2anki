/**
 * Enhanced interactive particle background for LeetCode2Anki Plus website
 */

class ParticleBackground {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mousePosition = {
            x: null,
            y: null,
            radius: 100
        };

        // Configuration
        this.isMobile = window.innerWidth < 768;
        this.particleCount = this.isMobile ? 30 : 80;
        this.connectionDistance = this.isMobile ? 100 : 180;
        this.particleColor = '#14b8a6'; // Teal color
        this.lineColor = 'rgba(20, 184, 166, '; // Teal color with dynamic opacity

        // Setup
        this.resizeCanvas();
        this.createParticles();
        this.animate();
        
        // Event listeners
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('mousemove', (event) => this.trackMouse(event));
        window.addEventListener('touchmove', (event) => this.trackTouch(event), { passive: true });
        window.addEventListener('mouseout', () => this.resetMouse());
        window.addEventListener('touchend', () => this.resetMouse());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.isMobile = window.innerWidth < 768;
        this.particleCount = this.isMobile ? 30 : 80;
        this.connectionDistance = this.isMobile ? 100 : 180;
        
        // Recreate particles when resizing to avoid layout issues
        this.createParticles();
    }

    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 2.5 + 0.5,
                color: this.particleColor,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                lastDrawn: Date.now()
            });
        }
    }

    trackMouse(event) {
        this.mousePosition.x = event.clientX;
        this.mousePosition.y = event.clientY;
    }

    trackTouch(event) {
        if (event.touches.length > 0) {
            this.mousePosition.x = event.touches[0].clientX;
            this.mousePosition.y = event.touches[0].clientY;
        }
    }

    resetMouse() {
        this.mousePosition.x = null;
        this.mousePosition.y = null;
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.updateParticles();
        this.drawConnections();
        requestAnimationFrame(() => this.animate());
    }

    updateParticles() {
        for (const particle of this.particles) {
            // Draw the particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.fill();

            // Update position
            particle.x += particle.speedX;
            particle.y += particle.speedY;

            // Mouse interaction
            if (this.mousePosition.x) {
                const dx = particle.x - this.mousePosition.x;
                const dy = particle.y - this.mousePosition.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.mousePosition.radius) {
                    const forceFactor = (this.mousePosition.radius - distance) / this.mousePosition.radius;
                    const pushX = dx * forceFactor * 0.05;
                    const pushY = dy * forceFactor * 0.05;
                    
                    particle.x += pushX;
                    particle.y += pushY;
                }
            }

            // Bounce off edges with damping
            if (particle.x < 0 || particle.x > this.canvas.width) {
                particle.speedX = -particle.speedX * 0.9;
                particle.x = particle.x < 0 ? 0 : this.canvas.width;
            }
            
            if (particle.y < 0 || particle.y > this.canvas.height) {
                particle.speedY = -particle.speedY * 0.9;
                particle.y = particle.y < 0 ? 0 : this.canvas.height;
            }
            
            // Apply slight gravity towards center for particles that drift too far
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            const distanceToCenter = Math.sqrt(
                Math.pow(particle.x - centerX, 2) + Math.pow(particle.y - centerY, 2)
            );
            
            if (distanceToCenter > this.canvas.width / 2) {
                particle.speedX += (centerX - particle.x) * 0.00005;
                particle.speedY += (centerY - particle.y) * 0.00005;
            }

            // Apply friction to prevent particles from moving too fast
            particle.speedX *= 0.99;
            particle.speedY *= 0.99;
        }
    }

    drawConnections() {
        // Only draw connections between particles if not on a low-end device
        if (this.isMobile && this.particles.length > 40) return;
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.connectionDistance) {
                    // Calculate opacity based on distance
                    const opacity = 1 - distance / this.connectionDistance;
                    
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = this.lineColor + opacity * 0.2 + ')';
                    this.ctx.lineWidth = 0.6;
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    const particleCanvas = document.getElementById('particle-canvas');
    if (particleCanvas) {
        new ParticleBackground('particle-canvas');
    } else {
        console.warn('Particle canvas element not found');
    }
});

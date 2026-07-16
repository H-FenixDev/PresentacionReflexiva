/* ==========================================================================
   CYBERPUNK PRESENTATION ENGINE - LOGIC SYSTEM
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    const container = document.getElementById('presentation-container');
    const slides = document.querySelectorAll('.slide');
    const hudDots = document.querySelectorAll('.hud-dot');
    const currentSlideNumSpan = document.getElementById('current-slide-num');
    const elapsedTimeSpan = document.getElementById('elapsed-time');
    const scrollPrompt = document.getElementById('scroll-prompt');
    const debateCards = document.querySelectorAll('.debate-card');

    let currentSlideIndex = 0;
    const totalSlides = slides.length;

    // Logic variables for slide animations
    window.customEndLoaded = false;
    let flipTimeouts = [];

    function fadeVolume(audio, targetVolume, duration) {
        if (!audio) return;
        if (audio.fadeInterval) clearInterval(audio.fadeInterval);
        
        const steps = 20;
        const stepTime = duration / steps;
        const volumeStep = (targetVolume - audio.volume) / steps;
        
        audio.fadeInterval = setInterval(() => {
            let newVolume = audio.volume + volumeStep;
            if (newVolume > 1) newVolume = 1;
            if (newVolume < 0) newVolume = 0;
            audio.volume = newVolume;
            
            if (Math.abs(audio.volume - targetVolume) < 0.02) {
                audio.volume = targetVolume;
                clearInterval(audio.fadeInterval);
            }
        }, stepTime);
    }
    let gridInterval = null;
    let gridStep = 0;
    const circularOrder = [0, 1, 3, 5, 4, 2];
    const gridCells = document.querySelectorAll('.grid-cell');

    function clearFlipTimeouts() {
        flipTimeouts.forEach(t => clearTimeout(t));
        flipTimeouts = [];
    }

    /* ==========================================================================
       1. INTERSECTION OBSERVER FOR ACTIVE SLIDE DETECTION & FLOW ANIMATION
       ========================================================================== */
    const observerOptions = {
        root: container,
        threshold: 0.5, // Slide is active when 50% visible
        rootMargin: "0px"
    };

    const slideObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const slideId = entry.target.id;
                const slideIndex = parseInt(slideId.split('-')[1]);
                
                setActiveSlide(slideIndex);
            }
        });
    }, observerOptions);

    slides.forEach((slide) => slideObserver.observe(slide));

    function setActiveSlide(index) {
        currentSlideIndex = index;

        // Update slides active state (triggers CSS transitions)
        slides.forEach((s, idx) => {
            if (idx === index) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });

        // Update HUD dots active state
        hudDots.forEach((dot, idx) => {
            if (idx === index) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });

        // Update current slide number in HUD
        const slideNumStr = String(index + 1).padStart(2, '0');
        currentSlideNumSpan.textContent = slideNumStr;

        // Toggle scroll prompt visibility (hide on last slide)
        if (index === totalSlides - 1) {
            scrollPrompt.style.opacity = '0';
        } else {
            scrollPrompt.style.opacity = '0.7';
        }

        // Slide 4: Circular Highlight Logic (Recuerdos Editados)
        clearInterval(gridInterval);
        gridCells.forEach(cell => cell.classList.remove('active-glow'));

        if (index === 3) {
            gridStep = 0;
            if (gridCells.length > 0) {
                gridCells[circularOrder[0]].classList.add('active-glow');
                
                gridInterval = setInterval(() => {
                    gridCells.forEach(cell => cell.classList.remove('active-glow'));
                    gridStep++;
                    const targetCellIndex = circularOrder[gridStep % circularOrder.length];
                    gridCells[targetCellIndex].classList.add('active-glow');
                }, 2000);
            }
        }

        // Slide 9: Auto-Flip Cards Logic (Conversación Brígida)
        clearFlipTimeouts();
        if (index === 8) {
            if (debateCards.length >= 3) {
                flipTimeouts.push(setTimeout(() => {
                    debateCards[0].classList.add('flipped');
                }, 2000));

                flipTimeouts.push(setTimeout(() => {
                    debateCards[1].classList.add('flipped');
                }, 6000));

                flipTimeouts.push(setTimeout(() => {
                    debateCards[2].classList.add('flipped');
                }, 10000));
            }
        } else {
            // Reset cards state when navigating away
            debateCards.forEach(card => card.classList.remove('flipped'));
        }

        // Slide 10: Play ending audio and trigger Fade Sequence
        const endAudio = document.getElementById('ending-audio');
        const bgAudio = document.getElementById('bg-audio');
        const cierreContent = document.getElementById('cierre-content');
        const theEndSequence = document.getElementById('the-end-sequence');
        clearTimeout(window.theEndTimeOut);

        if (index === 9) {
            if (window.customEndLoaded) {
                if (bgAudio) bgAudio.pause();
                if (endAudio) endAudio.play().catch(e => console.log('Audio autoplay blocked', e));
            } else {
                if (bgAudio) {
                    fadeVolume(bgAudio, 1.0, 2000); // fade up to 100% over 2s
                }
            }
            if (cierreContent && theEndSequence) {
                window.theEndTimeOut = setTimeout(() => {
                    cierreContent.classList.add('fade-out');
                    theEndSequence.classList.add('show');
                }, 12000); // 12 seconds before the sequence starts
            }
        } else {
            if (window.customEndLoaded && endAudio) {
                endAudio.pause();
                endAudio.currentTime = 0;
            }
            if (bgAudio) {
                if (bgAudio.volume > 0.4) {
                    fadeVolume(bgAudio, 0.3, 1000);
                } else {
                    bgAudio.volume = 0.3;
                }
                bgAudio.play().catch(e => console.log('Audio autoplay blocked', e));
            }
            if (cierreContent && theEndSequence) {
                cierreContent.classList.remove('fade-out');
                theEndSequence.classList.remove('show');
            }
        }
    }

    /* ==========================================================================
       2. HUD NAVIGATION DOT CLICKS
       ========================================================================== */
    hudDots.forEach((dot) => {
        dot.addEventListener('click', () => {
            const targetIndex = parseInt(dot.getAttribute('data-slide'));
            scrollToSlide(targetIndex);
        });
    });

    function scrollToSlide(index) {
        if (index >= 0 && index < totalSlides) {
            const targetSlide = document.getElementById(`slide-${index}`);
            targetSlide.scrollIntoView({ behavior: 'smooth' });
        }
    }

    /* ==========================================================================
       3. KEYBOARD NAVIGATION
       ========================================================================== */
    window.addEventListener('keydown', (e) => {
        // Space, PageDown, ArrowDown, ArrowRight -> Next slide
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
            if (currentSlideIndex < totalSlides - 1) {
                e.preventDefault();
                scrollToSlide(currentSlideIndex + 1);
            }
        }
        // PageUp, ArrowUp, ArrowLeft -> Previous slide
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
            if (currentSlideIndex > 0) {
                e.preventDefault();
                scrollToSlide(currentSlideIndex - 1);
            }
        }
    });

    /* ==========================================================================
       4. INTERACTIVE DEBATE CARDS (Flip on click)
       ========================================================================== */
    debateCards.forEach((card) => {
        card.addEventListener('click', () => {
            card.classList.toggle('flipped');
        });
    });

    /* ==========================================================================
       5. ELAPSED TIME HUD CLOCK
       ========================================================================== */
    let startTime = Date.now();
    setInterval(() => {
        const elapsedMs = Date.now() - startTime;
        const totalSecs = Math.floor(elapsedMs / 1000);
        const mins = String(Math.floor(totalSecs / 60)).padStart(2, '0');
        const secs = String(totalSecs % 60).padStart(2, '0');
        elapsedTimeSpan.textContent = `${mins}:${secs}`;
    }, 1000);

    /* ==========================================================================
       6. INTERACTIVE BACKGROUND CANVAS (Quantum Nodes / Star Field)
       ========================================================================== */
    const canvas = document.getElementById('cyber-canvas');
    const ctx = canvas.getContext('2d');

    let particles = [];
    const maxParticles = 60;
    const connectionDistance = 120;

    let mouse = {
        x: null,
        y: null,
        radius: 150
    };

    // Track mouse coordinates
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mouseout', () => {
        mouse.x = null;
        mouse.y = null;
    });

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        initParticles();
    }

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.vx = (Math.random() - 0.5) * 0.4;
            this.vy = (Math.random() - 0.5) * 0.4;
            this.radius = Math.random() * 2 + 1;
            // Theme colors: cian, pink, purple
            const colors = ['#00f2fe', '#ff007f', '#9b51e0'];
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }

        update() {
            this.x += this.vx;
            this.y += this.vy;

            // Bounce off edges
            if (this.x < 0 || this.x > canvas.width) this.vx = -this.vx;
            if (this.y < 0 || this.y > canvas.height) this.vy = -this.vy;

            // Mouse interaction (push away slightly)
            if (mouse.x !== null && mouse.y !== null) {
                let dx = this.x - mouse.x;
                let dy = this.y - mouse.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouse.radius) {
                    let force = (mouse.radius - dist) / mouse.radius;
                    this.x += (dx / dist) * force * 1.5;
                    this.y += (dy / dist) * force * 1.5;
                }
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = this.color;
            ctx.fill();
        }
    }

    function initParticles() {
        particles = [];
        const numParticles = Math.min(maxParticles, Math.floor((canvas.width * canvas.height) / 25000));
        for (let i = 0; i < numParticles; i++) {
            particles.push(new Particle());
        }
    }

    function drawLines() {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const p1 = particles[i];
                const p2 = particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < connectionDistance) {
                    // Line opacity based on distance
                    const alpha = (1 - (dist / connectionDistance)) * 0.15;
                    ctx.strokeStyle = `rgba(0, 242, 254, ${alpha})`;
                    ctx.lineWidth = 0.8;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        particles.forEach((p) => {
            p.update();
            p.draw();
        });

        drawLines();
        requestAnimationFrame(animate);
    }

    // Custom Audio Uploader Logic
    const audioUploader = document.getElementById('audio-uploader');
    const endingAudio = document.getElementById('ending-audio');
    const bgAudioUploader = document.getElementById('bg-audio-uploader');
    const bgAudio = document.getElementById('bg-audio');
    
    if (audioUploader && endingAudio) {
        audioUploader.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                window.customEndLoaded = true;
                const objectUrl = URL.createObjectURL(file);
                endingAudio.src = objectUrl;
                document.querySelector('.end-audio-btn').textContent = '[ END LOADED ]';
                document.querySelector('.end-audio-btn').style.color = 'var(--neon-green)';
            }
        });
    }

    const playBgBtn = document.getElementById('play-bg-btn');

    if (bgAudioUploader && bgAudio) {
        bgAudioUploader.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const objectUrl = URL.createObjectURL(file);
                bgAudio.src = objectUrl;
                document.querySelector('.bg-audio-btn').textContent = '[ BG LOADED ]';
                document.querySelector('.bg-audio-btn').style.color = 'var(--neon-green)';
                
                // Show play button, don't autoplay
                if (playBgBtn) {
                    playBgBtn.style.display = 'inline-block';
                }
            }
        });
    }

    if (playBgBtn && bgAudio) {
        playBgBtn.addEventListener('click', () => {
            if (bgAudio.paused) {
                const activeDot = document.querySelector('.hud-dot.active');
                const currentIndex = activeDot ? parseInt(activeDot.getAttribute('data-slide')) : 0;
                bgAudio.volume = (currentIndex === 9) ? 1.0 : 0.3;
                bgAudio.play().catch(err => console.log('Play blocked:', err));
            } else {
                bgAudio.pause();
            }
        });

        bgAudio.addEventListener('play', () => {
            playBgBtn.textContent = '[ ⏸ PAUSE ]';
            playBgBtn.style.color = 'var(--neon-pink)';
        });

        bgAudio.addEventListener('pause', () => {
            playBgBtn.textContent = '[ ▶ PLAY ]';
            playBgBtn.style.color = 'var(--neon-cyan)';
        });
    }

    window.addEventListener('resize', resizeCanvas);

    resizeCanvas();
    animate();
});

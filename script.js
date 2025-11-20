// Prevent layout issues
document.addEventListener('DOMContentLoaded', function() {
    // Force redraw to fix initial rendering issues
    setTimeout(() => {
        document.body.style.overflowX = 'hidden';
    }, 100);
});

// Audio Player functionality
class AudioPlayer {
    constructor() {
        this.currentAudio = null;
        this.isPlaying = false;
        this.init();
    }

    init() {
        const playButtons = document.querySelectorAll('.play-btn');
        
        playButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const audioId = e.target.getAttribute('data-audio');
                const audio = document.getElementById(audioId);
                this.togglePlay(audio, e.target);
            });
        });

        // Initialize progress bars and time updates
        document.querySelectorAll('audio').forEach(audio => {
            this.setupAudioListeners(audio);
        });
    }

    togglePlay(audio, button) {
        // Stop currently playing audio
        if (this.currentAudio && this.currentAudio !== audio) {
            this.currentAudio.pause();
            const prevButton = document.querySelector(`[data-audio="${this.currentAudio.id}"]`);
            if (prevButton) {
                prevButton.textContent = '▶️';
                prevButton.classList.remove('playing');
                // Reset progress for previous audio
                const prevProgress = prevButton.closest('.player-controls').querySelector('.progress');
                if (prevProgress) prevProgress.style.width = '0%';
                const prevTime = prevButton.closest('.player-controls').querySelector('.time');
                if (prevTime) prevTime.textContent = '0:00';
            }
        }

        if (audio.paused) {
            audio.play().catch(error => {
                console.log('Audio play failed:', error);
                // Fallback for autoplay restrictions
                button.textContent = '▶️';
                button.classList.remove('playing');
            });
            button.textContent = '⏸️';
            button.classList.add('playing');
            this.currentAudio = audio;
            this.isPlaying = true;
        } else {
            audio.pause();
            button.textContent = '▶️';
            button.classList.remove('playing');
            this.isPlaying = false;
        }
    }

    setupAudioListeners(audio) {
        const button = document.querySelector(`[data-audio="${audio.id}"]`);
        if (!button) return;

        const progressBar = button.closest('.player-controls').querySelector('.progress');
        const timeDisplay = button.closest('.player-controls').querySelector('.time');

        // Reset audio to beginning when loaded
        audio.addEventListener('loadedmetadata', () => {
            if (timeDisplay) timeDisplay.textContent = '0:00';
            if (progressBar) progressBar.style.width = '0%';
        });

        audio.addEventListener('timeupdate', () => {
            if (audio.duration) {
                const percent = (audio.currentTime / audio.duration) * 100;
                if (progressBar) progressBar.style.width = percent + '%';
                
                // Update time display
                const currentTime = this.formatTime(audio.currentTime);
                if (timeDisplay) timeDisplay.textContent = `${currentTime}`;
            }
        });

        audio.addEventListener('ended', () => {
            button.textContent = '▶️';
            button.classList.remove('playing');
            if (progressBar) progressBar.style.width = '0%';
            if (timeDisplay) timeDisplay.textContent = '0:00';
            this.isPlaying = false;
        });

        // Click on progress bar to seek
        const progressContainer = button.closest('.player-controls').querySelector('.progress-bar');
        if (progressContainer) {
            progressContainer.addEventListener('click', (e) => {
                const rect = progressContainer.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                audio.currentTime = percent * audio.duration;
            });
        }
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
}

// Fullscreen Image Viewer functionality
class ImageViewer {
    constructor() {
        this.currentIndex = 0;
        this.images = [];
        this.init();
    }

    init() {
        this.viewer = document.getElementById('fullscreenViewer');
        this.fullscreenImage = document.getElementById('fullscreenImage');
        this.closeBtn = document.getElementById('closeViewer');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.imageCounter = document.getElementById('imageCounter');

        // Collect all gallery images in correct order
        this.collectImages();
        
        // Add click listeners to gallery images
        this.images.forEach((img, index) => {
            img.addEventListener('click', () => {
                this.openViewer(index);
            });
        });

        // Viewer controls
        this.closeBtn.addEventListener('click', () => this.closeViewer());
        this.prevBtn.addEventListener('click', () => this.showPrevious());
        this.nextBtn.addEventListener('click', () => this.showNext());

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.viewer.classList.contains('active')) return;
            
            switch(e.key) {
                case 'Escape':
                    this.closeViewer();
                    break;
                case 'ArrowLeft':
                    this.showPrevious();
                    break;
                case 'ArrowRight':
                    this.showNext();
                    break;
            }
        });

        // Swipe support for mobile
        this.setupSwipe();
    }

    collectImages() {
        // Get all gallery items and sort them by their order in DOM
        const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
        this.images = galleryItems.map(item => item.querySelector('img'));
    }

    openViewer(index) {
        this.currentIndex = index;
        this.updateViewer();
        this.viewer.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Force reflow to ensure smooth animation
        setTimeout(() => {
            this.viewer.style.opacity = '1';
        }, 10);
    }

    closeViewer() {
        this.viewer.style.opacity = '0';
        setTimeout(() => {
            this.viewer.classList.remove('active');
            document.body.style.overflow = '';
        }, 300);
    }

    showPrevious() {
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.updateViewer();
    }

    showNext() {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.updateViewer();
    }

    updateViewer() {
        if (this.images[this.currentIndex]) {
            const imgSrc = this.images[this.currentIndex].src;
            this.fullscreenImage.src = imgSrc;
            this.fullscreenImage.alt = this.images[this.currentIndex].alt;
            this.imageCounter.textContent = `${this.currentIndex + 1} / ${this.images.length}`;
        }
    }

    setupSwipe() {
        let startX = 0;
        let endX = 0;

        this.viewer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        });

        this.viewer.addEventListener('touchmove', (e) => {
            endX = e.touches[0].clientX;
        });

        this.viewer.addEventListener('touchend', () => {
            const diffX = startX - endX;
            const minSwipeDistance = 50;

            if (Math.abs(diffX) > minSwipeDistance) {
                if (diffX > 0) {
                    this.showNext();
                } else {
                    this.showPrevious();
                }
            }
        });
    }
}

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
    // Password check
    const passwordModal = document.getElementById('passwordModal');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const mainContent = document.getElementById('mainContent');
    const passwordInput = document.getElementById('passwordInput');
    const submitPassword = document.getElementById('submitPassword');
    
    submitPassword.addEventListener('click', function() {
        if (passwordInput.value.toLowerCase() === 'deluxe') {
            passwordModal.style.opacity = '0';
            setTimeout(() => {
                passwordModal.style.display = 'none';
                welcomeScreen.style.display = 'flex';
                
                setTimeout(() => {
                    welcomeScreen.style.opacity = '0';
                    setTimeout(() => {
                        welcomeScreen.style.display = 'none';
                        mainContent.style.display = 'block';
                        
                        // Initialize components after content is shown
                        setTimeout(() => {
                            new AudioPlayer();
                            new ImageViewer();
                        }, 100);
                    }, 800);
                }, 2500);
            }, 500);
        } else {
            passwordInput.value = '';
            passwordInput.placeholder = 'Попробуй ещё раз, Любовь моя...';
            passwordInput.style.borderColor = '#ff4d4d';
            setTimeout(() => {
                passwordInput.style.borderColor = '#ffb7c5';
                passwordInput.placeholder = 'Это наше общее слово...';
            }, 1500);
        }
    });
    
    // Allow Enter key to submit password
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitPassword.click();
        }
    });
    
    // Tab switching
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === targetTab) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Expandable love letter
    const loveLetter = document.getElementById('loveLetter');
    loveLetter.addEventListener('click', function() {
        this.classList.toggle('expanded');
    });
    
    // Add floating decorative elements
    function addFloatingElements() {
        for (let i = 0; i < 15; i++) {
            const heart = document.createElement('div');
            heart.classList.add('heart');
            heart.innerHTML = '❤️';
            heart.style.left = Math.random() * 100 + '%';
            heart.style.top = Math.random() * 100 + '%';
            heart.style.animationDelay = Math.random() * 5 + 's';
            document.body.appendChild(heart);
        }
        
        for (let i = 0; i < 5; i++) {
            const teddy = document.createElement('div');
            teddy.classList.add('teddy-bear');
            teddy.innerHTML = '🧸';
            teddy.style.left = Math.random() * 100 + '%';
            teddy.style.top = Math.random() * 100 + '%';
            teddy.style.animationDelay = Math.random() * 5 + 's';
            document.body.appendChild(teddy);
        }
    }
    
    addFloatingElements();
});

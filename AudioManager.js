class AudioManager {
    constructor() {
        this.audio = null;
        this.isMuted = false;
        this.volume = 0.5;
    }

    loadAudio(url) {
        // Stop any existing audio
        this.stop();
        
        // Create new audio element
        this.audio = new Audio(url);
        this.audio.loop = true;
        this.audio.volume = this.volume;
        
        // Start playing when loaded
        this.audio.addEventListener('canplaythrough', () => {
            this.play();
        });
        
        // Error handling
        this.audio.addEventListener('error', (e) => {
            console.error('Error loading audio:', e);
        });
        
        // Load the audio file
        this.audio.load();
    }

    play() {
        if (this.audio && !this.isMuted) {
            // Use a promise to handle autoplay restrictions
            const playPromise = this.audio.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Autoplay prevented:', error);
                    // Create a play button for user interaction
                    this.createPlayButton();
                });
            }
        }
    }

    createPlayButton() {
        // Check if button already exists
        if (document.getElementById('audio-play-button')) return;
        
        const button = document.createElement('button');
        button.id = 'audio-play-button';
        button.textContent = 'Play Music';
        button.style.position = 'absolute';
        button.style.top = '20px';
        button.style.right = '20px';
        button.style.zIndex = '1000';
        
        button.addEventListener('click', () => {
            if (this.audio) {
                this.audio.play();
                this.isMuted = false;
                button.remove();
            }
        });
        
        document.body.appendChild(button);
    }

    stop() {
        if (this.audio) {
            this.audio.pause();
            this.audio.currentTime = 0;
            this.audio = null;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.audio) {
            if (this.isMuted) {
                this.audio.pause();
            } else {
                this.audio.play().catch(error => {
                    console.log('Play prevented:', error);
                    this.createPlayButton();
                });
            }
        }
        
        return this.isMuted;
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        if (this.audio) {
            this.audio.volume = this.volume;
        }
    }
}

export default AudioManager;


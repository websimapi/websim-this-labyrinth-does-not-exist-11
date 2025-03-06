class MobileControls {
    constructor(labyrinthEngine) {
        this.engine = labyrinthEngine;
        this.touchButtons = {};
        this.container = null;
        this.controlsContainer = null;
        this.touchActive = false;
        this.touchId = null;
    }

    init(container) {
        this.container = container;
        
        // Create mobile controls container
        this.controlsContainer = document.createElement('div');
        this.controlsContainer.className = 'mobile-controls';
        this.container.appendChild(this.controlsContainer);
        
        // Create control buttons
        this.createControlButtons();
        
        // Add audio control button
        this.createAudioControls();
        
        // Add event listeners
        this.addEventListeners();
    }

    createControlButtons() {
        // Top row (forward button)
        const topRow = document.createElement('div');
        topRow.className = 'mobile-controls-row';
        
        const forwardButton = this.createButton('▲', 'forward');
        topRow.appendChild(forwardButton);
        
        // Middle row (left, stop, right buttons)
        const middleRow = document.createElement('div');
        middleRow.className = 'mobile-controls-row';
        
        const leftButton = this.createButton('◀', 'left');
        const stopButton = this.createButton('■', 'stop');
        const rightButton = this.createButton('▶', 'right');
        
        middleRow.appendChild(leftButton);
        middleRow.appendChild(stopButton);
        middleRow.appendChild(rightButton);
        
        // Bottom row (backward button)
        const bottomRow = document.createElement('div');
        bottomRow.className = 'mobile-controls-row';
        
        const backwardButton = this.createButton('▼', 'backward');
        bottomRow.appendChild(backwardButton);
        
        // Add rows to container
        this.controlsContainer.appendChild(topRow);
        this.controlsContainer.appendChild(middleRow);
        this.controlsContainer.appendChild(bottomRow);
    }

    createButton(label, action) {
        const button = document.createElement('div');
        button.className = 'mobile-button';
        button.textContent = label;
        button.dataset.action = action;
        
        // Store button reference
        this.touchButtons[action] = button;
        
        return button;
    }

    createAudioControls() {
        const audioControls = document.createElement('div');
        audioControls.className = 'audio-controls';
        
        const audioLabel = document.createElement('span');
        audioLabel.textContent = 'Music:';
        
        const audioButton = document.createElement('button');
        audioButton.textContent = '🔊';
        audioButton.addEventListener('click', () => {
            if (this.engine.audioManager) {
                const isMuted = this.engine.audioManager.toggleMute();
                audioButton.textContent = isMuted ? '🔇' : '🔊';
            }
        });
        
        audioControls.appendChild(audioLabel);
        audioControls.appendChild(audioButton);
        
        this.container.appendChild(audioControls);
    }

    addEventListeners() {
        // Touch events for all buttons
        for (const action in this.touchButtons) {
            const button = this.touchButtons[action];
            
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleButtonAction(action, true);
            });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleButtonAction(action, false);
            });
            
            button.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                this.handleButtonAction(action, false);
            });
        }
    }

    handleButtonAction(action, isPressed) {
        switch (action) {
            case 'forward':
                this.engine.moveForward = isPressed;
                break;
            case 'backward':
                this.engine.moveBackward = isPressed;
                break;
            case 'left':
                this.engine.moveLeft = isPressed;
                break;
            case 'right':
                this.engine.moveRight = isPressed;
                break;
            case 'stop':
                // Stop all movement
                this.engine.moveForward = false;
                this.engine.moveBackward = false;
                this.engine.moveLeft = false;
                this.engine.moveRight = false;
                break;
        }
    }

    cleanup() {
        // Remove control elements
        if (this.controlsContainer && this.controlsContainer.parentNode) {
            this.controlsContainer.parentNode.removeChild(this.controlsContainer);
        }
        
        // Remove audio controls
        const audioControls = this.container.querySelector('.audio-controls');
        if (audioControls) {
            audioControls.parentNode.removeChild(audioControls);
        }
        
        // Clear references
        this.touchButtons = {};
        this.container = null;
        this.controlsContainer = null;
    }
}

export default MobileControls;


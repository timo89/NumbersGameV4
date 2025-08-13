// Utility to toggle visibility of in-game DOM UI from any scene
function setInGameUIVisible(visible) {
    const controls = document.querySelector('.controls');
    const header = document.querySelector('.game-header');
    const pathInfo = document.getElementById('pathInfo');
    const method = visible ? 'remove' : 'add';
    if (controls) controls.classList[method]('hidden');
    if (header) header.classList[method]('hidden');
    if (pathInfo) pathInfo.classList[method]('hidden');
}


// Main Menu Scene
class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        // Ensure in-game UI is hidden while on the menu
        setInGameUIVisible(false);

        const { width, height } = this.scale;

        // Create animated background with floating numbers
        this.createAnimatedBackground();

        // Create main title with gradient effect and animation
        this.createTitle(width, height);

        // Create simple solid buttons (no hover effects)
        this.createMenuButtons(width, height);
    }

    createAnimatedBackground() {
        const { width, height } = this.scale;
        // Dark blue background with subtle vertical gradient (darker at bottom)
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x001f3f, 0x001f3f, 0x000b1a, 0x000b1a, 1);
        bg.fillRect(0, 0, width, height);

        // Floating numbers: multiples of 5, mix positive (green) and negative (red)
        const values = [];
        for (let v = 5; v <= 50; v += 5) { values.push(v, -v); }

        const makeNumber = (fontSize, alpha, drift, durMin, durMax) => {
            const raw = values[Phaser.Math.Between(0, values.length - 1)];
            const val = raw.toString();
            const color = raw >= 0 ? '#00ff00' : '#ff0000';
            // Compute exclusion band around title/subtitle/buttons
            const titleY = Math.round(height / 3);
            const buttonsBaseY = titleY + 60 + 100;
            const excludeTop = titleY - 60;
            const excludeBottom = buttonsBaseY + 60;

            let rx = Phaser.Math.Between(20, width - 20);
            let ry = Phaser.Math.Between(20, height - 20);
            let attempts = 0;
            while (ry >= excludeTop && ry <= excludeBottom && attempts < 10) {
                ry = Phaser.Math.Between(20, height - 20);
                attempts++;
            }

            const n = this.add.text(
                rx,
                ry,
                val,
                { fontFamily: 'Arial, Helvetica, sans-serif', fontSize: `${fontSize}px`, color }
            ).setAlpha(alpha).setOrigin(0.5);
            if (n.setResolution) n.setResolution(2);
            n.setShadow(0, 2, '#000000', 6, false, true);
            n.setPosition(Math.round(n.x), Math.round(n.y));

            this.tweens.add({
                targets: n,
                y: n.y - drift,
                angle: { from: -2, to: 2 },
                alpha: { from: alpha * 0.9, to: Math.min(1, alpha + 0.15) },
                duration: Phaser.Math.Between(durMin, durMax),
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 1200)
            });
        };

        // 12-15 numbers total for subtle motion
        for (let i = 0; i < 8; i++) makeNumber(26, 0.10, 60, 4500, 7000);
        for (let i = 0; i < 6; i++) makeNumber(32, 0.12, 80, 4000, 6500);
    }

    createTitle(width, height) {
        // Position near top-third
        const titleY = Math.round(height / 3);

        const title = this.add.text(width / 2, titleY, 'NUMBERS GAME', {
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: '80px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#FFA500',
            strokeThickness: 2
        }).setOrigin(0.5);
        if (title.setResolution) title.setResolution(2);
        title.setShadow(0, 6, '#000000', 12, false, true);

        // Subtitle directly below the title
        const subtitle = this.add.text(width / 2, titleY + 60 + 20, 'Connect • Calculate • Conquer', {
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: '30px',
            color: '#FFD700'
        }).setOrigin(0.5);
        if (subtitle.setResolution) subtitle.setResolution(2);
        subtitle.setShadow(0, 2, '#000000', 6, false, true);

        // Entrance animations
        title.setAlpha(0);
        this.tweens.add({ targets: title, alpha: 1, duration: 1000, ease: 'Power2' });

        const targetY = subtitle.y;
        subtitle.setAlpha(0);
        subtitle.setY(targetY + 20);
        this.tweens.add({ targets: subtitle, alpha: 1, y: targetY, duration: 800, delay: 300, ease: 'Power2' });

        // Gentle pulsing for title
        this.tweens.add({ targets: title, scale: 1.02, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }

    createMenuButtons(width, height) {
        const centerX = width / 2;

        // Base Y uses subtitle area: spaced below the title/subtitle stack
        const baseY = Math.round(height / 3) + 60 + 100; // titleY + subtitle offset + padding

        const startText = this.add.text(centerX, baseY, 'START GAME', {
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: '28px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        const optionsText = this.add.text(centerX, baseY + 50, 'OPTIONS', {
            fontFamily: 'Arial, Helvetica, sans-serif',
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Semi-transparent rounded rectangle backgrounds sized to text
        const drawButton = (textObj) => {
            const paddingX = 26;
            const paddingY = 14;
            const w = Math.ceil(textObj.width) + paddingX * 2;
            const h = Math.ceil(textObj.height) + paddingY * 2;
            const bg = this.add.graphics();
            bg.fillStyle(0xffffff, 0.25);
            bg.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
            bg.lineStyle(2, 0xffffff, 0.8);
            bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
            bg.x = textObj.x;
            bg.y = textObj.y;
            bg.setPosition(Math.round(bg.x), Math.round(bg.y));
            textObj.setPosition(Math.round(textObj.x), Math.round(textObj.y));
            return bg;
        };

        const startBg = drawButton(startText);
        const optionsBg = drawButton(optionsText);

        startBg.setDepth((startText.depth || 0) - 1);
        optionsBg.setDepth((optionsText.depth || 0) - 1);

        // Entrance: fade-in
        [startText, optionsText, startBg, optionsBg].forEach(obj => obj.setAlpha(0));
        this.tweens.add({ targets: [startBg, startText], alpha: 1, duration: 400, ease: 'Power1' });
        this.tweens.add({ targets: [optionsBg, optionsText], alpha: 1, duration: 400, delay: 120, ease: 'Power1' });

        // Hover effects
        this.setupButtonEffects(startText, startBg, '#ffffff');
        this.setupButtonEffects(optionsText, optionsBg, '#ffffff');

        // Removed constant pulsing to keep motion calm; hover provides feedback

        // Click handlers
        startText.on('pointerup', () => {
            this.playButtonSound();
            this.cameras.main.fade(200, 0, 0, 0);
            this.time.delayedCall(200, () => this.scene.start('NumbersGameScene'));
        });
        optionsText.on('pointerup', () => {
            this.playButtonSound();
            this.cameras.main.fade(200, 0, 0, 0);
            this.time.delayedCall(200, () => this.scene.start('OptionsScene'));
        });
    }

    setupButtonEffects(button, background, hoverColor) {
        const hoverIn = () => {
            this.tweens.add({ targets: button, scale: 1.1, duration: 120, ease: 'Power2' });
            background.clear();
            // Brighten background slightly on hover
            const paddingX = 26;
            const paddingY = 14;
            const w = Math.ceil(button.width) + paddingX * 2;
            const h = Math.ceil(button.height) + paddingY * 2;
            background.fillStyle(0xffffff, 0.38);
            background.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
            background.lineStyle(2, 0xffffff, 1);
            background.strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
        };
        const hoverOut = () => {
            this.tweens.add({ targets: button, scale: 1.0, duration: 120, ease: 'Power2' });
            background.clear();
            const paddingX = 26;
            const paddingY = 14;
            const w = Math.ceil(button.width) + paddingX * 2;
            const h = Math.ceil(button.height) + paddingY * 2;
            background.fillStyle(0xffffff, 0.25);
            background.fillRoundedRect(-w / 2, -h / 2, w, h, 18);
            background.lineStyle(2, 0xffffff, 0.8);
            background.strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
        };

        button.on('pointerover', hoverIn);
        button.on('pointerout', hoverOut);
        button.on('pointerdown', () => this.tweens.add({ targets: button, scale: 0.96, duration: 80, ease: 'Power2' }));
        button.on('pointerup', () => this.tweens.add({ targets: button, scale: 1.1, duration: 80, ease: 'Power2' }));
    }

    createParticleEffects() {
        const { width, height } = this.scale;
        
        // Create sparkle particles
        for (let i = 0; i < 8; i++) {
            const sparkle = this.add.graphics();
            sparkle.fillStyle(0xffd700, 0.8);
            sparkle.fillCircle(0, 0, 2);
            sparkle.x = Phaser.Math.Between(50, width - 50);
            sparkle.y = Phaser.Math.Between(50, height - 50);
            
            this.tweens.add({
                targets: sparkle,
                alpha: 0,
                scaleX: 2,
                scaleY: 2,
                duration: Phaser.Math.Between(1500, 3000),
                ease: 'Power2.easeOut',
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 2000)
            });
        }
    }

    createMusicIndicator(width, height) {
        const musicNote = this.add.text(width - 40, 40, '♪', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#ffd700',
            alpha: 0.6
        }).setOrigin(0.5);

        this.tweens.add({
            targets: musicNote,
            y: musicNote.y - 10,
            alpha: 0.9,
            duration: 1500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }

    playButtonSound() {
        // Simple button click sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            // Silently fail if audio context is not available
        }
    }
}

// Options Scene
class OptionsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'OptionsScene' });
    }

    create() {
        setInGameUIVisible(false);

        const { width, height } = this.scale;
        
        // Create the same animated background as main menu
        this.createAnimatedBackground();
        
        // Create title with animation
        this.createTitle(width, height);
        
        // Create options controls
        this.createOptionsControls(width, height);
        
        // Add subtle particle effects
        this.createParticleEffects();
    }
    
    createAnimatedBackground() {
        const { width, height } = this.scale;
        
        // Create gradient background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x1a1a2e, 0x16213e, 0x0f3460, 0x533483, 1);
        bg.fillRect(0, 0, width, height);

        // Add floating settings icons in background
        const icons = ['⚙️', '🔊', '🎵', '⚡', '🎮'];
        for (let i = 0; i < 10; i++) {
            const icon = this.add.text(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Utils.Array.GetRandom(icons),
                {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: '20px',
                    alpha: 0.08
                }
            );
            
            // Animate floating icons
            this.tweens.add({
                targets: icon,
                y: icon.y - 80,
                alpha: 0.2,
                rotation: 0.5,
                duration: Phaser.Math.Between(4000, 7000),
                ease: 'Sine.easeInOut',
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 3000)
            });
        }
    }
    
    createTitle(width, height) {
        // Title shadow
        const titleShadow = this.add.text(width / 2 + 2, height / 2 - 118, 'OPTIONS', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '42px',
            color: '#000000',
            alpha: 0.3,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const title = this.add.text(width / 2, height / 2 - 120, 'OPTIONS', {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '42px',
            color: '#ffffff',
            fontStyle: 'bold',
            stroke: '#ff6b35',
            strokeThickness: 2
        }).setOrigin(0.5);

        // Animate title entrance
        title.setScale(0);
        this.tweens.add({
            targets: title,
            scaleX: 1,
            scaleY: 1,
            duration: 600,
            ease: 'Back.easeOut'
        });
    }
    
    createOptionsControls(width, height) {
        // Local helper to compute a slightly darker color for borders
        const darker = (c) => {
            const r = Math.max(0, ((c >> 16) & 0xff) - 30);
            const g = Math.max(0, ((c >> 8) & 0xff) - 30);
            const b = Math.max(0, (c & 0xff) - 30);
            return (r << 16) | (g << 8) | b;
        };
        // Audio toggle
        const audioKey = 'numbersGameAudio';
        const isAudioOn = (localStorage.getItem(audioKey) ?? '1') !== '0';
        
        // Audio button background
        const audioBtnBg = this.add.graphics();
        const audioColor = isAudioOn ? 0x4CAF50 : 0xF44336;
        audioBtnBg.fillStyle(audioColor, 1);
        audioBtnBg.fillRoundedRect(-100, -20, 200, 40, 20);
        audioBtnBg.lineStyle(4, 0xffffff, 0.95);
        audioBtnBg.strokeRoundedRect(-100, -20, 200, 40, 20);
        audioBtnBg.x = width / 2;
        audioBtnBg.y = height / 2 - 20;

        let audioLabel = this.add.text(width / 2, height / 2 - 20, `🔊 Audio: ${isAudioOn ? 'ON' : 'OFF'}`, {
            fontFamily: 'Arial Black, Arial, sans-serif',
            fontSize: '22px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Back button background
        const backBtnBg = this.add.graphics();
        backBtnBg.fillStyle(0x607D8B, 1);
        backBtnBg.fillRoundedRect(-60, -18, 120, 36, 18);
        backBtnBg.lineStyle(4, 0xffffff, 0.95);
        backBtnBg.strokeRoundedRect(-60, -18, 120, 36, 18);
        backBtnBg.x = width / 2;
        backBtnBg.y = height / 2 + 60;

        const backBtn = this.add.text(width / 2, height / 2 + 60, '← BACK', {
            fontFamily: 'Arial, sans-serif',
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Setup button effects
        this.setupButtonEffects(audioLabel, audioBtnBg, isAudioOn ? 0x66BB6A : 0xEF5350, true);
        this.setupButtonEffects(backBtn, backBtnBg, 0x78909C, false);

        // Button entrance animations
        audioLabel.setAlpha(0).setY(height / 2 + 10);
        audioBtnBg.setAlpha(0).setY(height / 2 + 10);
        backBtn.setAlpha(0).setY(height / 2 + 90);
        backBtnBg.setAlpha(0).setY(height / 2 + 90);

        this.tweens.add({
            targets: [audioLabel, audioBtnBg],
            alpha: 1,
            y: '-=30',
            duration: 600,
            delay: 400,
            ease: 'Back.easeOut'
        });

        this.tweens.add({
            targets: [backBtn, backBtnBg],
            alpha: 1,
            y: '-=30',
            duration: 600,
            delay: 600,
            ease: 'Back.easeOut'
        });

        // Button click handlers
        audioLabel.on('pointerup', () => {
            this.playButtonSound();
            const current = localStorage.getItem(audioKey) !== '0';
            const next = current ? '0' : '1';
            localStorage.setItem(audioKey, next);
            const newIsAudioOn = next !== '0';
            audioLabel.setText(`🔊 Audio: ${newIsAudioOn ? 'ON' : 'OFF'}`);
            
            // Update button color
            audioBtnBg.clear();
            const newAudioColor = newIsAudioOn ? 0x4CAF50 : 0xF44336;
            audioBtnBg.fillStyle(newAudioColor, 1);
            audioBtnBg.fillRoundedRect(-100, -20, 200, 40, 20);
            audioBtnBg.lineStyle(4, 0xffffff, 0.95);
            audioBtnBg.strokeRoundedRect(-100, -20, 200, 40, 20);
        });

        backBtn.on('pointerup', () => {
            this.playButtonSound();
            this.cameras.main.fade(300, 0, 0, 0);
            this.time.delayedCall(300, () => {
                this.scene.start('MainMenuScene');
            });
        });
    }
    
    setupButtonEffects(button, background, hoverColor, isAudioButton) {
        // No-op on options scene as well
    }
    
    createParticleEffects() {
        const { width, height } = this.scale;
        
        // Create fewer, more subtle sparkles for options screen
        for (let i = 0; i < 5; i++) {
            const sparkle = this.add.graphics();
            sparkle.fillStyle(0xffd700, 0.6);
            sparkle.fillCircle(0, 0, 1.5);
            sparkle.x = Phaser.Math.Between(50, width - 50);
            sparkle.y = Phaser.Math.Between(50, height - 50);
            
            this.tweens.add({
                targets: sparkle,
                alpha: 0,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: Phaser.Math.Between(2000, 4000),
                ease: 'Power2.easeOut',
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 2000)
            });
        }
    }
    
    playButtonSound() {
        // Simple button click sound using Web Audio API
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            // Silently fail if audio context is not available
        }
    }
}

// Expose legacy scenes to window for ES module bootstrap compatibility
window.OptionsScene = OptionsScene;

class NumbersGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'NumbersGameScene' });

        // Game constants
        this.GRID_SIZE = 6;

        // Calculate dynamic sizing based on viewport
        this.calculateDynamicSizing();

        this.TILE_SPACING = 5;         // Deprecated - using cell-based positioning now

        // Game state
        this.grid = [];
        this.selectedPath = [];
        this.currentSum = 0;
        this.score = 0;
        this.gameTime = 0;
        this.level = 1;
        this.highScore = parseInt(localStorage.getItem('numbersGameHighScore') || '0');
        this.isPaused = false;
        this.isFlipMode = false;
        this.gameStarted = false;
        this.isDragging = false;
        this.dragStarted = false;
        this.handledByPhaser = false;
        this.lastFlipTime = 0;
        this.flipDebounceMs = 100;
        this.isProcessingValidPath = false;
        this.isShowingMistakeEffect = false;

        // Phaser objects
        this.tileSprites = [];
        this.pathGraphics = null;

        // Timer
        this.gameTimer = null;

        // Audio context for sound effects
        this.audioContext = null;
        // Respect persisted audio option (default on)
        this.audioEnabled = (localStorage.getItem('numbersGameAudio') ?? '1') !== '0';
        this.audioContextResumed = false;
    }

    /**
     * Calculate dynamic sizing based on viewport dimensions
     */
    calculateDynamicSizing() {
        // Get viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Account for UI elements (controls, header, path info) - approximately 200px
        const availableHeight = viewportHeight - 200;

        // Use smaller dimension but leave some margin (20px each side)
        const availableSize = Math.min(viewportWidth - 40, availableHeight - 40);

        // Ensure minimum and maximum sizes
        const minSize = 280; // Minimum for usability
        const maxSize = 530; // Current size as maximum

        const gameSize = Math.max(minSize, Math.min(maxSize, availableSize));

        // Calculate cell and tile sizes based on game size
        // Game size = (GRID_SIZE * CELL_SIZE) + (2 * CANVAS_PADDING)
        // So CELL_SIZE = (gameSize - 2 * CANVAS_PADDING) / GRID_SIZE
        this.CANVAS_PADDING = Math.round(gameSize * 0.047); // Proportional padding (25/530 ≈ 0.047)
        this.CELL_SIZE = Math.round((gameSize - 2 * this.CANVAS_PADDING) / this.GRID_SIZE);
        this.TILE_SIZE = Math.round(this.CELL_SIZE * 0.875); // 70/80 = 0.875

        // Store calculated dimensions
        this.GAME_WIDTH = gameSize;
        this.GAME_HEIGHT = gameSize;

        // Calculate font size proportionally
        this.FONT_SIZE = Math.round(this.TILE_SIZE * 0.50); // Increased from 0.34 to make numbers bigger
    }

    preload() {
        // No assets to preload for this simple game
    }

    create() {
        // Show in-game UI when entering the game scene
        setInGameUIVisible(true);
        // Initialize audio context for sound effects
        this.initializeAudio();

        // Initialize UI elements
        this.scoreEl = document.getElementById('score');
        this.levelEl = document.getElementById('level');
        this.timeEl = document.getElementById('time');
        this.highScoreEl = document.getElementById('highScore');
        this.sumEl = document.getElementById('sum');
        this.lengthEl = document.getElementById('length');
        this.pathInfoEl = document.querySelector('.path-info');

        // Controls
        this.pauseBtn = document.getElementById('pauseBtn');
        this.flipBtn = document.getElementById('flipBtn');
        this.resetBtn = document.getElementById('resetBtn');

        // Setup input and controls
        this.setupEventListeners();

        // Initialize graphics object for path lines
        this.pathGraphics = this.add.graphics();
        this.pathGraphics.setDepth(1000); // Ensure path lines are above tiles

        // Initialize graphics object for grid lines
        this.gridGraphics = this.add.graphics();
        this.gridGraphics.setDepth(-1); // Ensure grid lines are behind tiles

        // Initialize graphics object for mistake effects
        this.mistakeGraphics = this.add.graphics();
        this.mistakeGraphics.setDepth(1500); // Above everything, including path lines

        // Initialize game
        this.generateGrid();
        this.drawGrid();
        this.createTileSprites();
        this.updateDisplay();
        this.startGame();
    }

    setupEventListeners() {
        // Control buttons
        this.pauseBtn.addEventListener('click', () => {
            this.resumeAudioContext();
            this.togglePause();
        });
        this.flipBtn.addEventListener('click', () => {
            this.resumeAudioContext();
            this.toggleFlipMode();
        });
        this.resetBtn.addEventListener('click', () => {
            this.resumeAudioContext();
            this.resetGame();
        });

        // Phaser input events
        this.input.on('pointerdown', (pointer) => this.handlePointerDown(pointer));
        this.input.on('pointermove', (pointer) => this.handlePointerMove(pointer));
        this.input.on('pointerup', (pointer) => this.handlePointerUp(pointer));

        // Alternative: Add direct mouse/touch events to the canvas
        const canvas = this.sys.game.canvas;

        // Mouse events
        canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));

        // Touch events for mobile
        canvas.addEventListener('touchstart', (e) => this.handleCanvasTouchStart(e));
        canvas.addEventListener('touchmove', (e) => this.handleCanvasTouchMove(e));
        canvas.addEventListener('touchend', (e) => this.handleCanvasTouchEnd(e));
    }

    generateGrid() {
        this.grid = [];
        for (let row = 0; row < this.GRID_SIZE; row++) {
            this.grid[row] = [];
            for (let col = 0; col < this.GRID_SIZE; col++) {
                this.grid[row][col] = this.generateTileValue();
            }
        }
    }

    generateTileValue() {
        let value;
        do {
            value = Math.floor(Math.random() * 19) - 9; // -9 to 9
        } while (value === 0);
        return value;
    }

    drawGrid() {
        if (!this.gridGraphics) return;

        this.gridGraphics.clear();
        this.gridGraphics.lineStyle(2, 0x000000, 1); // Black grid lines, 2px thick

        // Calculate grid dimensions
        const gridWidth = this.GRID_SIZE * this.CELL_SIZE;
        const gridHeight = this.GRID_SIZE * this.CELL_SIZE;
        const startX = this.CANVAS_PADDING;
        const startY = this.CANVAS_PADDING;

        // Draw vertical lines
        for (let i = 0; i <= this.GRID_SIZE; i++) {
            const x = startX + i * this.CELL_SIZE;
            this.gridGraphics.moveTo(x, startY);
            this.gridGraphics.lineTo(x, startY + gridHeight);
        }

        // Draw horizontal lines
        for (let i = 0; i <= this.GRID_SIZE; i++) {
            const y = startY + i * this.CELL_SIZE;
            this.gridGraphics.moveTo(startX, y);
            this.gridGraphics.lineTo(startX + gridWidth, y);
        }

        this.gridGraphics.strokePath();
    }

    createTileSprites() {
        // Clear existing sprites
        if (this.tileSprites.length > 0) {
            this.tileSprites.forEach(row => {
                row.forEach(tile => {
                    if (tile && tile.bg) tile.bg.destroy();
                    if (tile && tile.text) tile.text.destroy();
                });
            });
        }

        this.tileSprites = [];

        for (let row = 0; row < this.GRID_SIZE; row++) {
            this.tileSprites[row] = [];
            for (let col = 0; col < this.GRID_SIZE; col++) {
                // Calculate cell position
                const cellX = this.CANVAS_PADDING + col * this.CELL_SIZE;
                const cellY = this.CANVAS_PADDING + row * this.CELL_SIZE;

                // Center tile within cell with padding
                const tilePadding = (this.CELL_SIZE - this.TILE_SIZE) / 2;
                const tileX = cellX + tilePadding;
                const tileY = cellY + tilePadding;

                const value = this.grid[row][col];

                // If tile is empty (null), create invisible placeholder
                if (value === null) {
                    this.tileSprites[row][col] = null;
                    continue;
                }

                // Create tile background rectangle
                const bg = this.add.rectangle(
                    Math.round(tileX + this.TILE_SIZE / 2),
                    Math.round(tileY + this.TILE_SIZE / 2),
                    this.TILE_SIZE,
                    this.TILE_SIZE,
                    this.getTileColor(value)
                );
                bg.setStrokeStyle(1, 0x333333);
                bg.setInteractive();

                // Create tile text with proper contrast color
                const textColor = this.getContrastTextColorString(value);
                const text = this.add.text(
                    Math.round(tileX + this.TILE_SIZE / 2),
                    Math.round(tileY + this.TILE_SIZE / 2),
                    value.toString(),
                    {
                        fontSize: `${this.FONT_SIZE}px`,
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
                        fontStyle: 'bold',
                        color: textColor,
                        align: 'center',
                        resolution: 2
                    }
                );
                text.setOrigin(0.5, 0.5);
                if (text.setResolution) text.setResolution(2);

                // Store references with row/col data
                bg.setData('row', row);
                bg.setData('col', col);
                text.setData('row', row);
                text.setData('col', col);

                this.tileSprites[row][col] = { bg, text, row, col };
            }
        }
    }

    /**
     * Eye-friendly color palette for tile magnitudes 1-10
     * Includes green, yellow, pink, and orange among the hues with accessible contrast
     */
    getPositiveColors() {
        return [
            0x10B981, // magnitude 1: green-500
            0x22C55E, // magnitude 2: green-400  
            0xFDE047, // magnitude 3: yellow-300
            0xFCD34D, // magnitude 4: yellow-400
            0xF59E0B, // magnitude 5: amber-500
            0xF97316, // magnitude 6: orange-500
            0xEF4444, // magnitude 7: red-500
            0xEC4899, // magnitude 8: pink-500
            0xA855F7, // magnitude 9: purple-500
            0x3B82F6, // magnitude 10: blue-500
        ];
    }

    /**
     * Utility function to map numeric values to colors
     * Positive values (1-10) use eye-friendly palette
     * Negative values use white-complement rule: negativeColor = 0xFFFFFF - positiveColor
     */
    valueToColor(value) {
        // Ensure value is in expected range
        const absValue = Math.abs(value);
        const magnitude = Math.min(Math.max(absValue, 1), 10);

        // Get base color for magnitude (1-indexed, so subtract 1 for array access)
        const positiveColors = this.getPositiveColors();
        const positiveColor = positiveColors[magnitude - 1];

        if (value > 0) {
            return positiveColor;
        } else {
            // Negative color is complement to white: 0xFFFFFF - positiveColor
            return 0xFFFFFF - positiveColor;
        }
    }

    /**
     * Convert hex color to CSS string for React Native components
     */
    valueToColorString(value) {
        const hexColor = this.valueToColor(value);
        return `#${hexColor.toString(16).padStart(6, '0')}`;
    }

    /**
     * Get text color that contrasts well with the background color
     * Uses luminance calculation for better contrast determination
     */
    getContrastTextColor(value) {
        const backgroundColor = this.valueToColor(value);

        // Extract RGB components
        const r = (backgroundColor >> 16) & 0xFF;
        const g = (backgroundColor >> 8) & 0xFF;
        const b = backgroundColor & 0xFF;

        // Calculate relative luminance using WCAG formula
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Use white text for dark backgrounds, dark text for light backgrounds
        return luminance > 0.5 ? 0x374151 : 0xffffff;
    }

    /**
     * Get text color string for React Native components
     */
    getContrastTextColorString(value) {
        const color = this.getContrastTextColor(value);
        return `#${color.toString(16).padStart(6, '0')}`;
    }

    /**
     * Darken a color by reducing its RGB components by a percentage
     * Preserves the original hue while making it darker
     */
    darkenColor(color, factor = 0.7) {
        // Extract RGB components
        const r = (color >> 16) & 0xFF;
        const g = (color >> 8) & 0xFF;
        const b = color & 0xFF;

        // Apply darkening factor (0.7 means 70% of original brightness)
        const newR = Math.floor(r * factor);
        const newG = Math.floor(g * factor);
        const newB = Math.floor(b * factor);

        // Recombine into hex color
        return (newR << 16) | (newG << 8) | newB;
    }

    getTileColor(value) {
        return this.valueToColor(value);
    }

    getTileAt(x, y) {
        // Calculate which cell the click is in
        const col = Math.floor((x - this.CANVAS_PADDING) / this.CELL_SIZE);
        const row = Math.floor((y - this.CANVAS_PADDING) / this.CELL_SIZE);

        if (row >= 0 && row < this.GRID_SIZE && col >= 0 && col < this.GRID_SIZE) {
            // Calculate cell position
            const cellX = this.CANVAS_PADDING + col * this.CELL_SIZE;
            const cellY = this.CANVAS_PADDING + row * this.CELL_SIZE;

            // Calculate tile position within cell
            const tilePadding = (this.CELL_SIZE - this.TILE_SIZE) / 2;
            const tileX = cellX + tilePadding;
            const tileY = cellY + tilePadding;

            // Check if click is within tile bounds (not just cell bounds)
            if (x >= tileX && x <= tileX + this.TILE_SIZE &&
                y >= tileY && y <= tileY + this.TILE_SIZE) {
                return { row, col };
            }
        }
        return null;
    }

    handlePointerDown(pointer) {
        if (this.isPaused || this.isShowingMistakeEffect) return;

        // Resume audio context on first user interaction
        this.resumeAudioContext();

        const tile = this.getTileAt(pointer.x, pointer.y);
        if (!tile) return;

        // Check if tile has a value (not empty)
        if (this.grid[tile.row][tile.col] === null) return;

        // Set flag to prevent canvas events from processing the same interaction
        this.handledByPhaser = true;
        setTimeout(() => { this.handledByPhaser = false; }, 50);

        if (this.isFlipMode) {
            this.flipTile(tile.row, tile.col);
        } else {
            // Set a custom dragging flag only for path selection
            this.isDragging = true;
            this.dragStarted = true;
            this.startPath(tile.row, tile.col);
        }

        this.updateTileDisplay();
    }

    handlePointerMove(pointer) {
        if (this.isPaused || this.isFlipMode || !this.isDragging || this.isShowingMistakeEffect) return;

        const tile = this.getTileAt(pointer.x, pointer.y);
        if (!tile) return;

        // Check if tile has a value (not empty)
        if (this.grid[tile.row][tile.col] === null) return;

        if (this.canAddToPath(tile.row, tile.col)) {
            this.addToPath(tile.row, tile.col);
            this.updateTileDisplay();
        }
    }

    handlePointerUp(pointer) {
        if (this.isPaused || this.isShowingMistakeEffect) return;

        if (!this.isFlipMode) {
            // Reset our custom dragging flag
            this.isDragging = false;
            this.dragStarted = false;

            this.finalizePath();
        }
    }

    // Canvas mouse event handlers (alternative to Phaser pointer events)
    handleCanvasMouseDown(e) {
        if (this.isPaused || this.isShowingMistakeEffect) return;

        // Resume audio context on first user interaction
        this.resumeAudioContext();

        // Check if this event was already handled by Phaser
        if (this.handledByPhaser) {
            return;
        }

        const tile = this.getTileAt(e.offsetX, e.offsetY);
        if (!tile) return;

        // Check if tile has a value (not empty)
        if (this.grid[tile.row][tile.col] === null) return;

        if (this.isFlipMode) {
            this.flipTile(tile.row, tile.col);
        } else {
            this.isDragging = true;
            this.dragStarted = true;
            this.startPath(tile.row, tile.col);
        }

        this.updateTileDisplay();
        e.preventDefault();
    }

    handleCanvasMouseMove(e) {
        if (this.isPaused || this.isFlipMode || !this.isDragging || this.isShowingMistakeEffect) return;

        const tile = this.getTileAt(e.offsetX, e.offsetY);
        if (!tile) return;

        // Check if tile has a value (not empty)
        if (this.grid[tile.row][tile.col] === null) return;

        if (this.canAddToPath(tile.row, tile.col)) {
            this.addToPath(tile.row, tile.col);
            this.updateTileDisplay();
        }
        e.preventDefault();
    }

    handleCanvasMouseUp(e) {
        if (this.isPaused || this.isShowingMistakeEffect) return;

        if (!this.isFlipMode) {
            this.isDragging = false;
            this.dragStarted = false;

            this.finalizePath();
        }
        e.preventDefault();
    }

    // Touch event handlers
    handleCanvasTouchStart(e) {
        const touch = e.touches[0];
        const rect = e.target.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        // Create a mock mouse event
        const mockEvent = { offsetX: x, offsetY: y, preventDefault: () => e.preventDefault() };
        this.handleCanvasMouseDown(mockEvent);
    }

    handleCanvasTouchMove(e) {
        const touch = e.touches[0];
        const rect = e.target.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        const mockEvent = { offsetX: x, offsetY: y, preventDefault: () => e.preventDefault() };
        this.handleCanvasMouseMove(mockEvent);
    }

    handleCanvasTouchEnd(e) {
        if (!this.isFlipMode) {
            const mockEvent = { offsetX: 0, offsetY: 0, preventDefault: () => e.preventDefault() };
            this.handleCanvasMouseUp(mockEvent);
        }
    }

    startPath(row, col) {
        this.clearPath();
        this.addToPath(row, col);
        // Show path info when dragging starts
        this.pathInfoEl.classList.add('dragging');
    }

    canAddToPath(row, col) {
        // Check if tile is already in path
        if (this.selectedPath.some(tile => tile.row === row && tile.col === col)) {
            return false;
        }

        // If path is empty, can add any tile
        if (this.selectedPath.length === 0) return true;

        // Check if tile is adjacent to the last tile in path
        const lastTile = this.selectedPath[this.selectedPath.length - 1];
        const rowDiff = Math.abs(row - lastTile.row);
        const colDiff = Math.abs(col - lastTile.col);

        // Only orthogonally adjacent (not diagonal)
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }

    addToPath(row, col) {
        this.selectedPath.push({ row, col, value: this.grid[row][col] });
        this.updateCurrentSum();
        this.updatePathDisplay();
    }

    updateCurrentSum() {
        this.currentSum = this.selectedPath.reduce((sum, tile) => sum + tile.value, 0);
    }

    updatePathDisplay() {
        this.sumEl.textContent = this.currentSum;
        this.lengthEl.textContent = this.selectedPath.length;
    }

    clearPath() {
        this.selectedPath = [];
        this.currentSum = 0;
        this.updatePathDisplay();
        // Hide path info when clearing path
        this.pathInfoEl.classList.remove('dragging');
    }

    updateTileDisplay() {
        // Update tile appearances
        for (let row = 0; row < this.GRID_SIZE; row++) {
            for (let col = 0; col < this.GRID_SIZE; col++) {
                const tile = this.tileSprites[row][col];
                const isSelected = this.isSelected(row, col);
                const value = this.grid[row][col];

                // Skip if tile is empty (null)
                if (tile === null || value === null) {
                    continue;
                }

                // If game is paused, gray out all tiles and hide numbers
                if (this.isPaused) {
                    tile.bg.setFillStyle(0x808080); // Gray background
                    tile.bg.setStrokeStyle(1, 0x333333);
                    tile.text.setVisible(false); // Hide the numbers
                } else {
                    // Show the numbers when not paused
                    tile.text.setVisible(true);

                    if (isSelected && this.isDragging) {
                        // Dim the tile by using a darker version of its original color
                        const originalColor = this.getTileColor(value);
                        const dimmedColor = this.darkenColor(originalColor, 0.7);
                        tile.bg.setFillStyle(dimmedColor);
                        tile.bg.setStrokeStyle(3, 0xFF9800); // Orange border for selection
                        // Adjust text color for dimmed background
                        tile.text.setColor(this.getContrastTextColorString(value));
                    } else {
                        tile.bg.setFillStyle(this.getTileColor(value));
                        tile.bg.setStrokeStyle(1, 0x333333);
                        // Update text color for normal state
                        tile.text.setColor(this.getContrastTextColorString(value));
                    }
                }
            }
        }

        // Draw path lines
        this.drawPathLines();
    }

    drawPathLines() {
        this.pathGraphics.clear();

        if (this.selectedPath.length > 1) {
            this.pathGraphics.lineStyle(4, 0xFF9800, 1);

            for (let i = 0; i < this.selectedPath.length; i++) {
                const tile = this.selectedPath[i];

                // Calculate cell position
                const cellX = this.CANVAS_PADDING + tile.col * this.CELL_SIZE;
                const cellY = this.CANVAS_PADDING + tile.row * this.CELL_SIZE;

                // Center of tile within cell
                const tilePadding = (this.CELL_SIZE - this.TILE_SIZE) / 2;
                const tileX = cellX + tilePadding;
                const tileY = cellY + tilePadding;

                const x = tileX + this.TILE_SIZE / 2;
                const y = tileY + this.TILE_SIZE / 2;

                if (i === 0) {
                    this.pathGraphics.beginPath();
                    this.pathGraphics.moveTo(x, y);
                } else {
                    this.pathGraphics.lineTo(x, y);
                }
            }

            this.pathGraphics.strokePath();
        }
    }

    isSelected(row, col) {
        return this.selectedPath.some(tile => tile.row === row && tile.col === col);
    }

    finalizePath() {
        if (this.selectedPath.length === 0) return;

        // Hide path info when dragging ends
        this.pathInfoEl.classList.remove('dragging');

        if (this.isValidPath()) {
            this.processValidPath();
        } else {
            this.processInvalidPath();
        }
    }

    isValidPath() {
        return this.selectedPath.length >= 2 && this.currentSum % 5 === 0;
    }

    /**
     * Calculate the score for a path using the game's scoring formula
     */
    calculatePathScore() {
        let baseScore;
        if (this.currentSum === 0) {
            // For sum of 0, give 1 point
            baseScore = 1;
        } else {
            // For other sums: (absolute value / 5) + 1
            baseScore = Math.abs(this.currentSum) / 5 + 1;
        }

        // Factor in path length by multiplying
        return baseScore * this.selectedPath.length;
    }

    processValidPath() {
        // Prevent multiple executions
        if (this.isProcessingValidPath) return;
        this.isProcessingValidPath = true;

        // Play success sound
        this.playSuccessSound();

        // Clear the path line immediately after win
        this.pathGraphics.clear();

        // Calculate and add score
        const pathScore = this.calculatePathScore();
        this.score += pathScore;

        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('numbersGameHighScore', this.highScore.toString());
        }



        // Animate tiles out then clear and regenerate
        this.animateSelectedTilesOut();
    }

    processInvalidPath() {
        // Calculate penalty using the exact same logic as for getting points, but divide by 2
        const pathScore = this.calculatePathScore();
        this.score = this.score - Math.ceil(pathScore / 2);

        // Update display immediately when score changes
        this.updateDisplay();

        // Play failure sound
        this.playFailureSound();

        // Show red zig-zag mistake effect
        this.showMistakeEffect();

        // Shake the board on failure
        this.cameras.main.shake(300, 0.01);

        // Clear the path
        this.clearPath();
        this.updateTileDisplay();
    }

    /**
     * Draw red zig-zag lines across the board to indicate a mistake
     */
    drawMistakeEffect() {
        if (!this.mistakeGraphics) return;

        this.mistakeGraphics.clear();

        // Calculate board boundaries
        const boardLeft = this.CANVAS_PADDING;
        const boardTop = this.CANVAS_PADDING;
        const boardRight = this.CANVAS_PADDING + (this.GRID_SIZE * this.CELL_SIZE);
        const boardBottom = this.CANVAS_PADDING + (this.GRID_SIZE * this.CELL_SIZE);

        // Set up red color with transparency
        this.mistakeGraphics.lineStyle(4, 0xFF0000, 0.8); // Red, semi-transparent

        // Draw diagonal zig-zag lines from top-left to bottom-right
        const zigzagSpacing = 40; // Distance between zig-zag lines
        const zigzagAmplitude = 20; // Height of zig-zag peaks
        const zigzagFrequency = 30; // Distance between peaks

        // Draw multiple diagonal zig-zag lines
        for (let offset = -boardRight; offset < boardRight + boardBottom; offset += zigzagSpacing) {
            this.mistakeGraphics.beginPath();

            let startX = boardLeft + offset;
            let startY = boardTop;

            // Adjust start position if line starts outside board
            if (startX < boardLeft) {
                const yOffset = (boardLeft - startX);
                startX = boardLeft;
                startY = boardTop + yOffset;
            }

            // Draw zig-zag line
            let currentX = startX;
            let currentY = startY;
            let zigzagUp = true;

            this.mistakeGraphics.moveTo(currentX, currentY);

            while (currentX < boardRight && currentY < boardBottom) {
                const nextX = Math.min(currentX + zigzagFrequency, boardRight);
                const nextY = Math.min(currentY + zigzagFrequency, boardBottom);

                // Add zig-zag pattern
                const midX = currentX + (nextX - currentX) / 2;
                const midY = currentY + (nextY - currentY) / 2;
                const zigzagOffset = zigzagUp ? -zigzagAmplitude : zigzagAmplitude;

                // Calculate perpendicular offset for zig-zag
                const angle = Math.atan2(nextY - currentY, nextX - currentX);
                const perpAngle = angle + Math.PI / 2;
                const zigzagX = midX + Math.cos(perpAngle) * zigzagOffset;
                const zigzagY = midY + Math.sin(perpAngle) * zigzagOffset;

                this.mistakeGraphics.lineTo(zigzagX, zigzagY);
                this.mistakeGraphics.lineTo(nextX, nextY);

                currentX = nextX;
                currentY = nextY;
                zigzagUp = !zigzagUp;
            }

            this.mistakeGraphics.strokePath();
        }

        // Draw additional visual effects - red X pattern in corners
        this.mistakeGraphics.lineStyle(6, 0xFF4444, 0.6);

        // Top-left to bottom-right X
        this.mistakeGraphics.beginPath();
        this.mistakeGraphics.moveTo(boardLeft + 10, boardTop + 10);
        this.mistakeGraphics.lineTo(boardRight - 10, boardBottom - 10);
        this.mistakeGraphics.strokePath();

        // Top-right to bottom-left X
        this.mistakeGraphics.beginPath();
        this.mistakeGraphics.moveTo(boardRight - 10, boardTop + 10);
        this.mistakeGraphics.lineTo(boardLeft + 10, boardBottom - 10);
        this.mistakeGraphics.strokePath();

        // Add red border around the entire board
        this.mistakeGraphics.lineStyle(3, 0xFF0000, 0.7);
        this.mistakeGraphics.strokeRect(boardLeft, boardTop, boardRight - boardLeft, boardBottom - boardTop);
    }

    /**
     * Show mistake effect with animation
     */
    showMistakeEffect() {
        // Set flag to block user interactions during mistake effect
        this.isShowingMistakeEffect = true;

        // Draw the mistake effect
        this.drawMistakeEffect();

        // Start with invisible and scale up
        this.mistakeGraphics.setAlpha(0);
        this.mistakeGraphics.setScale(0.8);

        // Animate in
        this.tweens.add({
            targets: this.mistakeGraphics,
            alpha: 1,
            scaleX: 1,
            scaleY: 1,
            duration: 200,
            ease: 'Back.easeOut',
            onComplete: () => {
                // Hold for a moment, then fade out
                this.time.delayedCall(1000, () => {
                    this.tweens.add({
                        targets: this.mistakeGraphics,
                        alpha: 0,
                        duration: 500,
                        ease: 'Power2.easeOut',
                        onComplete: () => {
                            this.mistakeGraphics.clear();
                            // Clear flag to re-enable user interactions
                            this.isShowingMistakeEffect = false;
                        }
                    });
                });
            }
        });
    }



    animateSelectedTilesOut() {
        const tilesToAnimate = [];

        // Collect tiles to animate
        this.selectedPath.forEach(tile => {
            const tileSprite = this.tileSprites[tile.row][tile.col];
            tilesToAnimate.push(tileSprite);
        });

        // Create animation promises for all tiles
        const animationPromises = tilesToAnimate.map(tileSprite => {
            return new Promise((resolve) => {
                // Animate both background and text simultaneously
                this.tweens.add({
                    targets: [tileSprite.bg, tileSprite.text],
                    alpha: 0,
                    scaleX: 0.3,
                    scaleY: 0.3,
                    duration: 400,
                    ease: 'Back.easeIn',
                    onComplete: resolve
                });
            });
        });

        // Add a timeout fallback to prevent getting stuck
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(resolve, 600); // Give 200ms extra after animation duration
        });

        // Use Promise.race to ensure we don't get stuck waiting for animations
        Promise.race([
            Promise.all(animationPromises),
            timeoutPromise
        ]).then(() => {
            // Clear selected tiles and generate new ones
            this.clearSelectedTiles();

            // Add 2-3 new random tiles on empty spaces
            this.addRandomTilesOnEmptySpaces();

            // Update displays
            this.updateDisplay();
            this.clearPath();
            this.createTileSprites();

            // Reset the processing flag
            this.isProcessingValidPath = false;
        });
    }

    addRandomTilesOnEmptySpaces() {
        // Get all empty positions (including recently cleared tiles)
        const emptyPositions = [];
        for (let row = 0; row < this.GRID_SIZE; row++) {
            for (let col = 0; col < this.GRID_SIZE; col++) {
                if (this.grid[row][col] === null) {
                    emptyPositions.push({ row, col });
                }
            }
        }

        // Generate exactly 2-3 tiles total, never more
        const tilesToGenerate = Math.floor(Math.random() * 2) + 2; // Always 2 or 3
        const tilesToPlace = Math.min(tilesToGenerate, emptyPositions.length);

        // Shuffle empty positions and select random ones for new tiles
        for (let i = 0; i < tilesToPlace; i++) {
            const randomIndex = Math.floor(Math.random() * emptyPositions.length);
            const position = emptyPositions.splice(randomIndex, 1)[0];
            this.grid[position.row][position.col] = this.generateTileValue();
        }
    }

    clearSelectedTiles() {
        // Clear selected tiles (set to null so they become empty spaces)
        this.selectedPath.forEach(tile => {
            this.grid[tile.row][tile.col] = null;
        });
    }

    flipTile(row, col) {
        const currentTime = Date.now();

        // Debounce rapid flip attempts to prevent double-clicking
        if (currentTime - this.lastFlipTime < this.flipDebounceMs) {
            return;
        }

        // Don't flip empty tiles
        if (this.grid[row][col] === null) {
            return;
        }

        this.lastFlipTime = currentTime;

        this.grid[row][col] = -this.grid[row][col];
        const newValue = this.grid[row][col];
        this.tileSprites[row][col].text.setText(newValue.toString());
        this.tileSprites[row][col].bg.setFillStyle(this.getTileColor(newValue));
        this.tileSprites[row][col].text.setColor(this.getContrastTextColorString(newValue));
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseBtn.textContent = this.isPaused ? '▶️' : '⏸️';

        if (this.isPaused) {
            this.scene.pause();
        } else {
            this.scene.resume();
        }

        // Update tile display to show/hide numbers based on pause state
        this.updateTileDisplay();
    }

    toggleFlipMode() {
        this.isFlipMode = !this.isFlipMode;
        this.flipBtn.textContent = this.isFlipMode ? '🎯' : '🔄';
        this.flipBtn.classList.toggle('active', this.isFlipMode);

        if (this.isFlipMode) {
            this.clearPath();
            this.updateTileDisplay();
        }
    }

    resetGame() {
        this.clearPath();
        this.score = 0;
        this.gameTime = 0;
        this.level = 1;
        this.isPaused = false;
        this.isFlipMode = false;
        this.gameStarted = false;
        this.isProcessingValidPath = false;

        // Reset UI
        this.pauseBtn.textContent = '⏸️';
        this.flipBtn.textContent = '🔄';
        this.flipBtn.classList.remove('active');

        // Stop timer
        if (this.gameTimer) {
            this.gameTimer.destroy();
            this.gameTimer = null;
        }

        // Regenerate grid
        this.generateGrid();
        this.drawGrid();
        this.createTileSprites();
        this.updateDisplay();

        this.startGame();
    }

    initializeAudio() {
        try {
            // Initialize Web Audio API context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('Audio context initialized, state:', this.audioContext.state);
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            this.audioContext = null;
            this.audioEnabled = false;
        }
    }

    /**
     * Resume audio context if it's suspended (required by browser audio policies)
     */
    async resumeAudioContext() {
        if (!this.audioContext || this.audioContextResumed) return;

        try {
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('Audio context resumed, state:', this.audioContext.state);
            }
            this.audioContextResumed = true;
        } catch (error) {
            console.warn('Failed to resume audio context:', error);
        }
    }

    playSuccessSound() {
        if (!this.audioContext || !this.audioEnabled) return;

        try {
            // Ensure audio context is running
            if (this.audioContext.state !== 'running') {
                console.warn('Audio context not running, state:', this.audioContext.state);
                return;
            }

            // Create a pleasant ascending chord for success
            const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
            const duration = 0.4;
            const volume = 0.3; // Increased volume

            frequencies.forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();

                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);

                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                oscillator.type = 'sine';

                // Fade in and out for smooth sound
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

                const startTime = this.audioContext.currentTime + index * 0.05;
                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            });

            console.log('Success sound played');
        } catch (error) {
            console.warn('Error playing success sound:', error);
        }
    }

    playFailureSound() {
        if (!this.audioContext || !this.audioEnabled) return;

        try {
            // Ensure audio context is running
            if (this.audioContext.state !== 'running') {
                console.warn('Audio context not running, state:', this.audioContext.state);
                return;
            }

            // Create a short descending buzz for failure
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Start at 200Hz and drop to 100Hz
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
            oscillator.type = 'sawtooth';

            // Quick fade in and out with higher volume
            const volume = 0.25; // Increased volume
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);

            console.log('Failure sound played');
        } catch (error) {
            console.warn('Error playing failure sound:', error);
        }
    }

    updateDisplay() {
        this.scoreEl.textContent = this.score;
        this.levelEl.textContent = this.level;
        this.highScoreEl.textContent = this.highScore;
        this.timeEl.textContent = this.formatTime(this.gameTime);
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }

    startGame() {
        if (this.gameStarted) return;

        this.gameStarted = true;
        this.gameTime = 0;

        // Start timer using Phaser's timer
        this.gameTimer = this.time.addEvent({
            delay: 1000,
            loop: true,
            callback: () => {
                if (!this.isPaused) {
                    this.gameTime++;
                    this.timeEl.textContent = this.formatTime(this.gameTime);

                    // Increase level every 60 seconds
                    if (this.gameTime % 60 === 0) {
                        this.level++;
                        this.levelEl.textContent = this.level;
                    }
                }
            }
        });
    }
}

// Make NumbersGameScene available to ES module bootstrap
window.NumbersGameScene = NumbersGameScene;

// Function to create dynamic Phaser game configuration
function createGameConfig() {
    // Create a temporary scene instance to calculate dimensions
    const tempScene = new NumbersGameScene();

    return {
        type: Phaser.AUTO,
        width: tempScene.GAME_WIDTH,
        height: tempScene.GAME_HEIGHT,
        parent: 'gameContainer',
        backgroundColor: '#ffffff',
        resolution: window.devicePixelRatio || 1,
        scene: [MainMenuScene, OptionsScene, NumbersGameScene],
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        render: {
            antialias: true,
            pixelArt: false,
            roundPixels: true
        },
        physics: {
            default: 'arcade',
            arcade: {
                debug: false
            }
        }
    };
}

// Start the game when the page loads, unless module bootstrap is active
document.addEventListener('DOMContentLoaded', () => {
if (window.__MODULE_BOOTSTRAP__) return;
const config = createGameConfig();
window.game = new Phaser.Game(config);
});
class NumbersGameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'NumbersGameScene' });
        
        // Game constants
        this.GRID_SIZE = 6;
        this.TILE_SIZE = 80;
        this.TILE_SPACING = 5;
        this.CANVAS_PADDING = 15;
        
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
        
        // Phaser objects
        this.tileSprites = [];
        this.pathGraphics = null;
        
        // Timer
        this.gameTimer = null;
    }

    preload() {
        // No assets to preload for this simple game
    }

    create() {
        // Initialize UI elements
        this.scoreEl = document.getElementById('score');
        this.levelEl = document.getElementById('level');
        this.timeEl = document.getElementById('time');
        this.highScoreEl = document.getElementById('highScore');
        this.sumEl = document.getElementById('sum');
        this.lengthEl = document.getElementById('length');
        
        // Controls
        this.pauseBtn = document.getElementById('pauseBtn');
        this.flipBtn = document.getElementById('flipBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // Setup input and controls
        this.setupEventListeners();
        
        // Initialize graphics object for path lines
        this.pathGraphics = this.add.graphics();
        
        // Initialize game
        this.generateGrid();
        this.createTileSprites();
        this.updateDisplay();
        this.startGame();
    }
    
    setupEventListeners() {
        // Control buttons
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.flipBtn.addEventListener('click', () => this.toggleFlipMode());
        this.resetBtn.addEventListener('click', () => this.resetGame());
        
        // Phaser input events
        this.input.on('pointerdown', (pointer) => this.handlePointerDown(pointer));
        this.input.on('pointermove', (pointer) => this.handlePointerMove(pointer));
        this.input.on('pointerup', (pointer) => this.handlePointerUp(pointer));
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

    createTileSprites() {
        // Clear existing sprites
        if (this.tileSprites.length > 0) {
            this.tileSprites.forEach(row => {
                row.forEach(tile => {
                    if (tile.bg) tile.bg.destroy();
                    if (tile.text) tile.text.destroy();
                });
            });
        }
        
        this.tileSprites = [];
        
        for (let row = 0; row < this.GRID_SIZE; row++) {
            this.tileSprites[row] = [];
            for (let col = 0; col < this.GRID_SIZE; col++) {
                const x = this.CANVAS_PADDING + col * (this.TILE_SIZE + this.TILE_SPACING);
                const y = this.CANVAS_PADDING + row * (this.TILE_SIZE + this.TILE_SPACING);
                const value = this.grid[row][col];
                
                // Create tile background rectangle
                const bg = this.add.rectangle(
                    x + this.TILE_SIZE / 2, 
                    y + this.TILE_SIZE / 2, 
                    this.TILE_SIZE, 
                    this.TILE_SIZE, 
                    this.getTileColor(value)
                );
                bg.setStrokeStyle(1, 0x333333);
                bg.setInteractive();
                
                // Create tile text
                const text = this.add.text(
                    x + this.TILE_SIZE / 2, 
                    y + this.TILE_SIZE / 2, 
                    value.toString(), 
                    {
                        fontSize: '24px',
                        fontFamily: 'Arial',
                        fontStyle: 'bold',
                        color: '#ffffff',
                        align: 'center'
                    }
                );
                text.setOrigin(0.5, 0.5);
                
                // Store references with row/col data
                bg.setData('row', row);
                bg.setData('col', col);
                text.setData('row', row);
                text.setData('col', col);
                
                this.tileSprites[row][col] = { bg, text, row, col };
            }
        }
    }

    getTileColor(value) {
        if (value > 0) {
            return 0x4CAF50; // Green for positive
        } else {
            return 0xf44336; // Red for negative
        }
    }

    getTileAt(x, y) {
        const col = Math.floor((x - this.CANVAS_PADDING) / (this.TILE_SIZE + this.TILE_SPACING));
        const row = Math.floor((y - this.CANVAS_PADDING) / (this.TILE_SIZE + this.TILE_SPACING));
        
        if (row >= 0 && row < this.GRID_SIZE && col >= 0 && col < this.GRID_SIZE) {
            // Check if click is within tile bounds
            const tileX = this.CANVAS_PADDING + col * (this.TILE_SIZE + this.TILE_SPACING);
            const tileY = this.CANVAS_PADDING + row * (this.TILE_SIZE + this.TILE_SPACING);
            
            if (x >= tileX && x <= tileX + this.TILE_SIZE &&
                y >= tileY && y <= tileY + this.TILE_SIZE) {
                return { row, col };
            }
        }
        return null;
    }

    handlePointerDown(pointer) {
        if (this.isPaused) return;
        
        const tile = this.getTileAt(pointer.x, pointer.y);
        if (!tile) return;
        
        this.input.setDragState(pointer, true);
        
        if (this.isFlipMode) {
            this.flipTile(tile.row, tile.col);
        } else {
            this.startPath(tile.row, tile.col);
        }
        
        this.updateTileDisplay();
    }

    handlePointerMove(pointer) {
        if (this.isPaused || this.isFlipMode || !pointer.isDragging) return;
        
        const tile = this.getTileAt(pointer.x, pointer.y);
        if (!tile) return;
        
        if (this.canAddToPath(tile.row, tile.col)) {
            this.addToPath(tile.row, tile.col);
            this.updateTileDisplay();
        }
    }

    handlePointerUp(pointer) {
        if (this.isPaused || this.isFlipMode) return;
        
        this.input.setDragState(pointer, false);
        this.finalizePath();
    }

    startPath(row, col) {
        this.clearPath();
        this.addToPath(row, col);
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
    }

    updateTileDisplay() {
        // Update tile appearances
        for (let row = 0; row < this.GRID_SIZE; row++) {
            for (let col = 0; col < this.GRID_SIZE; col++) {
                const tile = this.tileSprites[row][col];
                const isSelected = this.isSelected(row, col);
                const value = this.grid[row][col];
                
                if (isSelected) {
                    tile.bg.setFillStyle(0xFFE082); // Yellow for selected
                    tile.bg.setStrokeStyle(3, 0xFF9800); // Orange border
                } else {
                    tile.bg.setFillStyle(this.getTileColor(value));
                    tile.bg.setStrokeStyle(1, 0x333333);
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
                const x = this.CANVAS_PADDING + tile.col * (this.TILE_SIZE + this.TILE_SPACING) + this.TILE_SIZE / 2;
                const y = this.CANVAS_PADDING + tile.row * (this.TILE_SIZE + this.TILE_SPACING) + this.TILE_SIZE / 2;
                
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
        
        if (this.isValidPath()) {
            this.processValidPath();
        } else {
            this.processInvalidPath();
        }
    }

    isValidPath() {
        return this.currentSum !== 0 && this.currentSum % 5 === 0;
    }

    processValidPath() {
        // Calculate score (absolute value of sum)
        const pathScore = Math.abs(this.currentSum);
        this.score += pathScore;
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('numbersGameHighScore', this.highScore.toString());
        }
        
        // Show success feedback
        this.showFeedback('Success!', 'success');
        
        // Clear selected tiles and generate new ones
        this.clearSelectedTiles();
        
        // Add 2-3 new random tiles
        this.addRandomTiles();
        
        // Update displays
        this.updateDisplay();
        this.clearPath();
        this.createTileSprites();
    }

    processInvalidPath() {
        // Show failure feedback
        this.showFeedback('Invalid path!', 'failure');
        
        // Clear the path
        this.clearPath();
        this.updateTileDisplay();
    }

    showFeedback(message, type) {
        const feedback = document.createElement('div');
        feedback.className = `feedback ${type}`;
        feedback.textContent = message;
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            if (document.body.contains(feedback)) {
                document.body.removeChild(feedback);
            }
        }, 1000);
    }

    clearSelectedTiles() {
        this.selectedPath.forEach(tile => {
            this.grid[tile.row][tile.col] = this.generateTileValue();
        });
    }

    addRandomTiles() {
        const tilesToReplace = Math.floor(Math.random() * 2) + 2; // 2-3 tiles
        
        for (let i = 0; i < tilesToReplace; i++) {
            const row = Math.floor(Math.random() * this.GRID_SIZE);
            const col = Math.floor(Math.random() * this.GRID_SIZE);
            
            // Skip if this tile was just cleared
            if (this.selectedPath.some(tile => tile.row === row && tile.col === col)) {
                continue;
            }
            
            this.grid[row][col] = this.generateTileValue();
        }
    }

    flipTile(row, col) {
        this.grid[row][col] = -this.grid[row][col];
        this.tileSprites[row][col].text.setText(this.grid[row][col].toString());
        this.tileSprites[row][col].bg.setFillStyle(this.getTileColor(this.grid[row][col]));
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseBtn.textContent = this.isPaused ? '▶️ Resume' : '⏸️ Pause';
        
        if (this.isPaused) {
            this.scene.pause();
        } else {
            this.scene.resume();
        }
    }

    toggleFlipMode() {
        this.isFlipMode = !this.isFlipMode;
        this.flipBtn.textContent = this.isFlipMode ? '🎯 Select Mode' : '🔄 Flip Mode';
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
        
        // Reset UI
        this.pauseBtn.textContent = '⏸️ Pause';
        this.flipBtn.textContent = '🔄 Flip Mode';
        this.flipBtn.classList.remove('active');
        
        // Stop timer
        if (this.gameTimer) {
            this.gameTimer.destroy();
            this.gameTimer = null;
        }
        
        // Regenerate grid
        this.generateGrid();
        this.createTileSprites();
        this.updateDisplay();
        
        this.startGame();
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

// Phaser game configuration
const config = {
    type: Phaser.AUTO,
    width: 530,
    height: 530,
    parent: 'gameContainer',
    backgroundColor: '#ffffff',
    scene: NumbersGameScene,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Phaser.Game(config);
});
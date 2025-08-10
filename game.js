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
        this.isDragging = false;
        this.dragStarted = false;
        this.handledByPhaser = false;
        
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
                
                // Create tile text with proper contrast color
                const textColor = this.getContrastTextColorString(value);
                const text = this.add.text(
                    x + this.TILE_SIZE / 2, 
                    y + this.TILE_SIZE / 2, 
                    value.toString(), 
                    {
                        fontSize: '24px',
                        fontFamily: 'Arial',
                        fontStyle: 'bold',
                        color: textColor,
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
        
        // Prevent double handling by canvas events
        this.handledByPhaser = true;
        
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
        if (this.isPaused || this.isFlipMode || !this.isDragging) return;
        
        const tile = this.getTileAt(pointer.x, pointer.y);
        if (!tile) return;
        
        if (this.canAddToPath(tile.row, tile.col)) {
            this.addToPath(tile.row, tile.col);
            this.updateTileDisplay();
        }
    }

    handlePointerUp(pointer) {
        if (this.isPaused) return;
        
        if (!this.isFlipMode) {
            // Reset our custom dragging flag
            this.isDragging = false;
            this.dragStarted = false;
            
            this.finalizePath();
        }
    }

    // Canvas mouse event handlers (alternative to Phaser pointer events)
    handleCanvasMouseDown(e) {
        if (this.isPaused) return;
        
        // Check if this event was already handled by Phaser
        if (this.handledByPhaser) {
            this.handledByPhaser = false;
            return;
        }
        
        const tile = this.getTileAt(e.offsetX, e.offsetY);
        if (!tile) return;
        
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
        if (this.isPaused || this.isFlipMode || !this.isDragging) return;
        
        const tile = this.getTileAt(e.offsetX, e.offsetY);
        if (!tile) return;
        
        if (this.canAddToPath(tile.row, tile.col)) {
            this.addToPath(tile.row, tile.col);
            this.updateTileDisplay();
        }
        e.preventDefault();
    }

    handleCanvasMouseUp(e) {
        if (this.isPaused) return;
        
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
        
        // Hide path info when dragging ends
        this.pathInfoEl.classList.remove('dragging');
        
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
        const newValue = this.grid[row][col];
        this.tileSprites[row][col].text.setText(newValue.toString());
        this.tileSprites[row][col].bg.setFillStyle(this.getTileColor(newValue));
        this.tileSprites[row][col].text.setColor(this.getContrastTextColorString(newValue));
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
    window.game = new Phaser.Game(config);
});
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
                    tileX + this.TILE_SIZE / 2, 
                    tileY + this.TILE_SIZE / 2, 
                    this.TILE_SIZE, 
                    this.TILE_SIZE, 
                    this.getTileColor(value)
                );
                bg.setStrokeStyle(1, 0x333333);
                bg.setInteractive();
                
                // Create tile text with proper contrast color
                const textColor = this.getContrastTextColorString(value);
                const text = this.add.text(
                    tileX + this.TILE_SIZE / 2, 
                    tileY + this.TILE_SIZE / 2, 
                    value.toString(), 
                    {
                        fontSize: `${this.FONT_SIZE}px`,
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
                        fontStyle: 'bold',
                        color: textColor,
                        align: 'center',
                        resolution: window.devicePixelRatio || 1
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
        this.score = Math.max(0, this.score - (pathScore / 2)); // Don't let score go below 0
        
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
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
            this.audioContext = null;
        }
    }

    playSuccessSound() {
        if (!this.audioContext) return;
        
        try {
            // Create a pleasant ascending chord for success
            const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
            const duration = 0.3;
            
            frequencies.forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                oscillator.type = 'sine';
                
                // Fade in and out for smooth sound
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
                
                oscillator.start(this.audioContext.currentTime + index * 0.05);
                oscillator.stop(this.audioContext.currentTime + duration + index * 0.05);
            });
        } catch (error) {
            console.warn('Error playing success sound:', error);
        }
    }

    playFailureSound() {
        if (!this.audioContext) return;
        
        try {
            // Create a short descending buzz for failure
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // Start at 200Hz and drop to 100Hz
            oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
            oscillator.type = 'sawtooth';
            
            // Quick fade in and out
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.3);
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
        scene: NumbersGameScene,
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH
        },
        render: {
            antialias: true,
            pixelArt: false,
            roundPixels: false
        },
        physics: {
            default: 'arcade',
            arcade: {
                debug: false
            }
        }
    };
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const config = createGameConfig();
    window.game = new Phaser.Game(config);
});
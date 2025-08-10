class NumbersGame {
    constructor() {
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
        
        // Canvas and drawing
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // UI elements
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
        
        // Input state
        this.isMouseDown = false;
        this.lastTile = null;
        
        // Timer
        this.gameTimer = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.generateGrid();
        this.updateDisplay();
        this.draw();
        this.startGame();
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleMouseDown(mouseEvent);
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            this.handleMouseMove(mouseEvent);
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handleMouseUp(e);
        });
        
        // Control buttons
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.flipBtn.addEventListener('click', () => this.toggleFlipMode());
        this.resetBtn.addEventListener('click', () => this.resetGame());
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
    
    getTileAt(x, y) {
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = x - rect.left;
        const canvasY = y - rect.top;
        
        const col = Math.floor((canvasX - this.CANVAS_PADDING) / (this.TILE_SIZE + this.TILE_SPACING));
        const row = Math.floor((canvasY - this.CANVAS_PADDING) / (this.TILE_SIZE + this.TILE_SPACING));
        
        if (row >= 0 && row < this.GRID_SIZE && col >= 0 && col < this.GRID_SIZE) {
            // Check if click is within tile bounds
            const tileX = this.CANVAS_PADDING + col * (this.TILE_SIZE + this.TILE_SPACING);
            const tileY = this.CANVAS_PADDING + row * (this.TILE_SIZE + this.TILE_SPACING);
            
            if (canvasX >= tileX && canvasX <= tileX + this.TILE_SIZE &&
                canvasY >= tileY && canvasY <= tileY + this.TILE_SIZE) {
                return { row, col };
            }
        }
        return null;
    }
    
    handleMouseDown(e) {
        if (this.isPaused) return;
        
        const tile = this.getTileAt(e.clientX, e.clientY);
        if (!tile) return;
        
        this.isMouseDown = true;
        
        if (this.isFlipMode) {
            this.flipTile(tile.row, tile.col);
        } else {
            this.startPath(tile.row, tile.col);
        }
        
        this.draw();
    }
    
    handleMouseMove(e) {
        if (this.isPaused || this.isFlipMode || !this.isMouseDown) return;
        
        const tile = this.getTileAt(e.clientX, e.clientY);
        if (!tile) return;
        
        if (this.canAddToPath(tile.row, tile.col)) {
            this.addToPath(tile.row, tile.col);
            this.draw();
        }
    }
    
    handleMouseUp(e) {
        if (this.isPaused || this.isFlipMode) return;
        
        this.isMouseDown = false;
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
        this.draw();
    }
    
    processInvalidPath() {
        // Show failure feedback
        this.showFeedback('Invalid path!', 'failure');
        
        // Clear the path
        this.clearPath();
        this.draw();
    }
    
    showFeedback(message, type) {
        const feedback = document.createElement('div');
        feedback.className = `feedback ${type}`;
        feedback.textContent = message;
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            document.body.removeChild(feedback);
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
        this.draw();
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        this.pauseBtn.textContent = this.isPaused ? '▶️ Resume' : '⏸️ Pause';
    }
    
    toggleFlipMode() {
        this.isFlipMode = !this.isFlipMode;
        this.flipBtn.textContent = this.isFlipMode ? '🎯 Select Mode' : '🔄 Flip Mode';
        this.flipBtn.classList.toggle('active', this.isFlipMode);
        
        if (this.isFlipMode) {
            this.clearPath();
            this.draw();
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
        
        // Regenerate grid
        this.generateGrid();
        this.updateDisplay();
        this.draw();
        
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
        
        // Start timer
        this.gameTimer = setInterval(() => {
            if (!this.isPaused) {
                this.gameTime++;
                this.timeEl.textContent = this.formatTime(this.gameTime);
                
                // Increase level every 60 seconds
                if (this.gameTime % 60 === 0) {
                    this.level++;
                    this.levelEl.textContent = this.level;
                }
            }
        }, 1000);
    }
    
    getTileColor(value) {
        if (value > 0) {
            // Positive tiles - green shades
            return '#4CAF50';
        } else {
            // Negative tiles - red shades
            return '#f44336';
        }
    }
    
    isSelected(row, col) {
        return this.selectedPath.some(tile => tile.row === row && tile.col === col);
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        for (let row = 0; row < this.GRID_SIZE; row++) {
            for (let col = 0; col < this.GRID_SIZE; col++) {
                const x = this.CANVAS_PADDING + col * (this.TILE_SIZE + this.TILE_SPACING);
                const y = this.CANVAS_PADDING + row * (this.TILE_SIZE + this.TILE_SPACING);
                const value = this.grid[row][col];
                const isSelected = this.isSelected(row, col);
                
                // Draw tile background
                this.ctx.fillStyle = isSelected ? '#FFE082' : this.getTileColor(value);
                this.ctx.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
                
                // Draw tile border
                this.ctx.strokeStyle = isSelected ? '#FF9800' : '#333';
                this.ctx.lineWidth = isSelected ? 3 : 1;
                this.ctx.strokeRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
                
                // Draw tile value
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(
                    value.toString(),
                    x + this.TILE_SIZE / 2,
                    y + this.TILE_SIZE / 2
                );
            }
        }
        
        // Draw path lines
        if (this.selectedPath.length > 1) {
            this.ctx.strokeStyle = '#FF9800';
            this.ctx.lineWidth = 4;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            
            for (let i = 0; i < this.selectedPath.length; i++) {
                const tile = this.selectedPath[i];
                const x = this.CANVAS_PADDING + tile.col * (this.TILE_SIZE + this.TILE_SPACING) + this.TILE_SIZE / 2;
                const y = this.CANVAS_PADDING + tile.row * (this.TILE_SIZE + this.TILE_SPACING) + this.TILE_SIZE / 2;
                
                if (i === 0) {
                    this.ctx.moveTo(x, y);
                } else {
                    this.ctx.lineTo(x, y);
                }
            }
            
            this.ctx.stroke();
        }
    }
}

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new NumbersGame();
});
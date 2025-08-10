# NumbersGameV4

A numbers puzzle game built with Phaser.js where players create paths of connected tiles to form sums divisible by 5.

## Features

- **6x6 Grid**: Numbered tiles with positive (green) and negative (red) values
- **Path Selection**: Click and drag to create paths of orthogonally connected tiles
- **Scoring System**: Earn points for valid paths (sums divisible by 5)
- **Game Modes**: 
  - Select Mode: Create paths for scoring
  - Flip Mode: Change tile values by flipping their signs
- **Progress Tracking**: Score, level, time, and high score persistence
- **Pause/Resume**: Game state management

## Technology

Built with:
- **Phaser.js 3.90.0**: Modern 2D game framework
- **HTML5 Canvas**: Via Phaser's rendering system
- **Local Storage**: High score persistence

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:8000 in your browser

## Game Rules

1. Create paths by connecting adjacent tiles (no diagonal connections)
2. Valid paths must have a sum divisible by 5
3. Successful paths clear those tiles and generate new random values
4. Use Flip Mode to change tile signs strategically
5. Level increases every 60 seconds
6. Score is the absolute value of valid path sums

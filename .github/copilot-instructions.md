# NumbersGameV4 - Phaser.js Numbers Puzzle Game

**ALWAYS follow these instructions first and only search or explore further if the information here is incomplete or found to be incorrect.**

NumbersGameV4 is a browser-based numbers puzzle game built with Phaser.js 3.90.0. Players create paths of connected tiles to form sums divisible by 5. The game uses HTML5 Canvas via Phaser's rendering system and stores high scores in localStorage.

## Prerequisites and Environment

Ensure you have these tools installed:
- **Node.js v20+**: For package management (`node --version`)
- **npm v10+**: Comes with Node.js (`npm --version`) 
- **Python 3.12+**: For development server (`python3 --version`)

## Working Effectively

### Bootstrap and Setup
- **Install dependencies**: `npm install` -- takes ~4 seconds. Set timeout to 30+ seconds.
- **Start development server**: `npm run dev` -- starts immediately, serves on http://localhost:8000
- **NEVER CANCEL**: The dev server runs indefinitely. Use Ctrl+C to stop when done.

### Development Workflow
- **Always run setup first**: `npm install` before any development work
- **Test the game**: Open http://localhost:8000 in browser after starting dev server
- **No build process**: This is a simple HTML/JS game with no compilation step
- **No tests**: The repository has no test suite (npm test shows "no test specified")

### File Structure
```
/home/runner/work/NumbersGameV4/NumbersGameV4/
├── .github/                  # GitHub configuration
├── node_modules/             # Dependencies (auto-generated)
├── .gitignore               # Git ignore patterns
├── README.md                # Basic game documentation  
├── package.json             # NPM configuration and scripts
├── package-lock.json        # Locked dependency versions
├── index.html               # Main HTML file (125 lines)
└── game.js                  # Core game logic (500 lines)
```

## Validation and Testing

### Manual Game Testing
**ALWAYS test game functionality after making changes:**

1. **Start the game**: Open http://localhost:8000
2. **Verify UI elements**: Check that Score, Level, Time, High Score display
3. **Test game controls**:
   - Click "⏸️ Pause" button → should change to "▶️ Resume" 
   - Click "🔄 Flip Mode" → should change to "🎯 Select Mode"
   - Click "🔄 Reset" → should reset timer and score
4. **Test game mechanics**:
   - Timer should increment every second
   - Grid should display 6x6 tiles with numbers
   - Tiles should be clickable and show visual feedback
5. **Verify Phaser.js loading**: Check browser console for "Phaser v3.90.0" message

### Server Testing
- **Test file serving**: `curl -I http://localhost:8000/index.html` should return HTTP 200
- **Test JavaScript**: `curl -I http://localhost:8000/game.js` should return HTTP 200  
- **Test Phaser.js**: `curl -I http://localhost:8000/node_modules/phaser/dist/phaser.min.js` should return HTTP 200

## Common Tasks and Timing

### Installing Dependencies
```bash
npm install
```
- **Time**: ~4 seconds for clean install
- **Output**: "added 2 packages, and audited 3 packages"
- **NEVER CANCEL**: Set timeout to 30+ seconds minimum

### Starting Development Server  
```bash
npm run dev
```
- **Time**: Starts immediately, runs indefinitely
- **Output**: "Serving HTTP on 0.0.0.0 port 8000"
- **NEVER CANCEL**: This command runs until manually stopped
- **URL**: http://localhost:8000

### Available NPM Scripts
```bash
npm run dev    # Start Python development server on port 8000
npm test       # Shows "no test specified" error (no tests exist)
```

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Game Engine**: Phaser.js v3.90.0 (WebGL/Canvas rendering)
- **Development Server**: Python 3 http.server 
- **Storage**: Browser localStorage for high scores
- **Dependencies**: Only phaser (via npm)

## Code Organization

### index.html (125 lines)
- Complete HTML structure with embedded CSS
- Game UI: score display, controls, game container
- Links to Phaser.js and game.js

### game.js (500 lines)  
- **NumbersGameScene class**: Main game logic using Phaser Scene
- **Key methods**:
  - `generateGrid()`: Creates 6x6 number grid
  - `handlePointerDown/Move/Up()`: Mouse/touch input handling
  - `processValidPath()`: Scoring logic for valid paths
  - `togglePause/FlipMode()`: Game mode switching

### package.json (16 lines)
- Single dependency: phaser ^3.90.0
- Two scripts: dev (Python server), test (placeholder)

## Development Guidelines

### Making Changes
- **Always start dev server**: `npm run dev` before testing changes
- **Test immediately**: Refresh browser after any code changes
- **No hot reload**: Manually refresh browser to see updates
- **No build step**: Changes to HTML/JS are immediately available

### Code Style
- **JavaScript**: ES6+ class syntax, no transpilation
- **HTML**: Semantic markup with embedded CSS
- **No linting**: Repository has no ESLint or Prettier configuration
- **No formatting tools**: Manual code formatting

### Game-Specific Testing
- **Path mechanics**: Test creating paths by clicking/dragging tiles
- **Scoring system**: Verify paths with sum divisible by 5 score points
- **Tile regeneration**: Check that successful paths regenerate tiles
- **Mode switching**: Test both Select and Flip modes work correctly
- **Persistence**: Verify high score saves to localStorage

## Common Issues and Solutions

### Development Server Issues
- **Port 8000 in use**: Kill other processes using `lsof -ti:8000 | xargs kill`
- **Python not found**: Ensure Python 3 is installed and in PATH
- **File not served**: Check file exists and restart server

### Game Loading Issues  
- **Blank canvas**: Check browser console for JavaScript errors
- **Phaser not loading**: Verify node_modules/phaser exists
- **UI not responsive**: Check that Phaser canvas initialized correctly

### Browser Compatibility
- **Modern browsers**: Requires WebGL support for optimal performance
- **Mobile devices**: Touch input supported via Phaser pointer events
- **Console warnings**: WebGL fallbacks are normal on some systems

## Quick Reference Commands

```bash
# Fresh setup from clone
npm install                                    # 4 seconds
npm run dev                                   # Starts immediately

# Verify installation
node --version                                # Should show v20+  
python3 --version                            # Should show v3.12+
curl -I http://localhost:8000/index.html     # Should return HTTP 200

# File exploration  
ls -la                                        # View repository structure
cat package.json                             # View dependencies and scripts
wc -l *.js *.html                            # Count lines in main files
```

Remember: This is a simple, standalone game with minimal dependencies and no build complexity. Focus on game functionality testing rather than build processes.
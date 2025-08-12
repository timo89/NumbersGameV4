import MainMenuScene from './scenes/MainMenuScene.js';

// Tell legacy game.js not to auto-bootstrap
window.__MODULE_BOOTSTRAP__ = true;

function createGameConfig() {
  // Use NumbersGameScene from legacy global until fully modularized
  const tempScene = new window.NumbersGameScene();

  return {
    type: Phaser.AUTO,
    width: tempScene.GAME_WIDTH,
    height: tempScene.GAME_HEIGHT,
    parent: 'gameContainer',
    backgroundColor: '#ffffff',
    resolution: window.devicePixelRatio || 1,
    scene: [MainMenuScene, window.OptionsScene, window.NumbersGameScene],
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
      arcade: { debug: false }
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const config = createGameConfig();
  window.game = new Phaser.Game(config);
});

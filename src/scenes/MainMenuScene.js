import { setInGameUIVisible } from '../utils/ui.js';

export default class MainMenuScene extends Phaser.Scene {
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

    // Create stylized buttons with hover effects
    this.createMenuButtons(width, height);

    // Add particle effects
    this.createParticleEffects();

    // Add subtle background music indicator
    this.createMusicIndicator(width, height);
  }

  createAnimatedBackground() {
    const { width, height } = this.scale;

    // Create gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a2e, 0x16213e, 0x0f3460, 0x533483, 1);
    bg.fillRect(0, 0, width, height);

    // Edge vignette using gradient strips
    const vignette = this.add.graphics();
    // Top
    vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 1);
    vignette.fillRect(0, 0, width, 60);
    vignette.alpha = 0.15;
    // Bottom
    const vignetteBottom = this.add.graphics();
    vignetteBottom.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 1);
    vignetteBottom.fillRect(0, height - 60, width, 60);
    vignetteBottom.alpha = 0.15;
    // Left
    const vignetteLeft = this.add.graphics();
    vignetteLeft.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 1);
    vignetteLeft.fillRect(0, 0, 60, height);
    vignetteLeft.alpha = 0.12;
    // Right
    const vignetteRight = this.add.graphics();
    vignetteRight.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 1);
    vignetteRight.fillRect(width - 60, 0, 60, height);
    vignetteRight.alpha = 0.12;

    // Parallax floating numbers (far layer)
    for (let i = 0; i < 12; i++) {
      const number = this.add.text(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 9).toString(),
        {
          fontFamily: 'Poppins, Arial, sans-serif',
          fontSize: '22px',
          color: '#ffffff'
        }
      ).setAlpha(0.08);
      if (number.setResolution) number.setResolution(2);
      number.setPosition(Math.round(number.x), Math.round(number.y));
      this.tweens.add({
        targets: number,
        y: number.y - 80,
        alpha: 0.18,
        duration: Phaser.Math.Between(4000, 7000),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000)
      });
    }

    // Parallax floating numbers (near layer)
    for (let i = 0; i < 10; i++) {
      const number = this.add.text(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 9).toString(),
        {
          fontFamily: 'Poppins, Arial, sans-serif',
          fontSize: '28px',
          color: '#ffffff'
        }
      ).setAlpha(0.15);
      if (number.setResolution) number.setResolution(2);
      number.setPosition(Math.round(number.x), Math.round(number.y));
      this.tweens.add({
        targets: number,
        y: number.y - 120,
        alpha: 0.28,
        duration: Phaser.Math.Between(3000, 5500),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 1500)
      });
    }
  }

  createTitle(width, height) {
    const titleShadow = this.add.text(width / 2 + 3, height / 2 - 77, 'NUMBERS GAME', {
      fontFamily: 'Orbitron, Arial, sans-serif',
      fontSize: '52px',
      color: '#000000',
      alpha: 0.3,
      fontStyle: 'bold'
    }).setOrigin(0.5);
    if (titleShadow.setResolution) titleShadow.setResolution(2);
    titleShadow.setPosition(Math.round(titleShadow.x), Math.round(titleShadow.y));

    const title = this.add.text(width / 2, height / 2 - 80, 'NUMBERS GAME', {
      fontFamily: 'Orbitron, Arial, sans-serif',
      fontSize: '52px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#ff6b35',
      strokeThickness: 3
    }).setOrigin(0.5);
    if (title.setResolution) title.setResolution(2);
    title.setPosition(Math.round(title.x), Math.round(title.y));
    title.setShadow(0, 6, '#000000', 12, false, true);

    const subtitle = this.add.text(width / 2, height / 2 - 35, 'Connect • Calculate • Conquer', {
      fontFamily: 'Poppins, Arial, sans-serif',
      fontSize: '18px',
      color: '#ffd700',
      alpha: 0.8
    }).setOrigin(0.5);
    if (subtitle.setResolution) subtitle.setResolution(2);
    subtitle.setPosition(Math.round(subtitle.x), Math.round(subtitle.y));
    subtitle.setShadow(0, 2, '#000000', 6, false, true);

    // Animate title entrance
    title.setScale(0);
    subtitle.setAlpha(0);

    this.tweens.add({ targets: title, scaleX: 1, scaleY: 1, duration: 800, ease: 'Back.easeOut' });
    this.tweens.add({ targets: subtitle, alpha: 0.8, duration: 1000, delay: 400, ease: 'Power2.easeOut' });

    // Pulsing glow
    this.tweens.add({ targets: title, alpha: 0.8, duration: 2000, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
  }

  createMenuButtons(width, height) {
    // Start Game Button
    const startBtnBg = this.add.graphics();
    startBtnBg.fillGradientStyle(0x4CAF50, 0x4CAF50, 0x2E7D32, 0x2E7D32, 1);
    startBtnBg.fillRoundedRect(-80, -20, 160, 40, 20);
    startBtnBg.x = width / 2;
    startBtnBg.y = height / 2 + 20;

    const startBtn = this.add.text(width / 2, height / 2 + 20, '🎮 START GAME', {
      fontFamily: 'Poppins, Arial, sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    startBtn.setShadow(0, 3, '#000000', 6, false, true);

    // Options Button
    const optionsBtnBg = this.add.graphics();
    optionsBtnBg.fillGradientStyle(0x2196F3, 0x2196F3, 0x1565C0, 0x1565C0, 1);
    optionsBtnBg.fillRoundedRect(-60, -18, 120, 36, 18);
    optionsBtnBg.x = width / 2;
    optionsBtnBg.y = height / 2 + 80;

    const optionsBtn = this.add.text(width / 2, height / 2 + 80, '⚙️ OPTIONS', {
      fontFamily: 'Poppins, Arial, sans-serif',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    optionsBtn.setShadow(0, 3, '#000000', 6, false, true);

    // Effects and entrance
    this.setupButtonEffects(startBtn, startBtnBg, 0x66BB6A);
    this.setupButtonEffects(optionsBtn, optionsBtnBg, 0x42A5F5);

    startBtn.setAlpha(0).setY(height / 2 + 50);
    startBtnBg.setAlpha(0).setY(height / 2 + 50);
    optionsBtn.setAlpha(0).setY(height / 2 + 110);
    optionsBtnBg.setAlpha(0).setY(height / 2 + 110);

    this.tweens.add({ targets: [startBtn, startBtnBg], alpha: 1, y: '-=30', duration: 600, delay: 800, ease: 'Back.easeOut' });
    this.tweens.add({ targets: [optionsBtn, optionsBtnBg], alpha: 1, y: '-=30', duration: 600, delay: 1000, ease: 'Back.easeOut' });

    // Click handlers
    startBtn.on('pointerup', () => {
      this.playButtonSound();
      this.cameras.main.fade(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start('NumbersGameScene'));
    });

    optionsBtn.on('pointerup', () => {
      this.playButtonSound();
      this.cameras.main.fade(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start('OptionsScene'));
    });
  }

  setupButtonEffects(button, background, hoverColor) {
    button.on('pointerover', () => {
      this.tweens.add({ targets: [button, background], scaleX: 1.1, scaleY: 1.1, duration: 200, ease: 'Power2.easeOut' });
      background.clear();
      background.fillGradientStyle(hoverColor, hoverColor, hoverColor - 0x222222, hoverColor - 0x222222, 1);
      if (button.text.includes('START')) {
        background.fillRoundedRect(-80, -20, 160, 40, 20);
      } else {
        background.fillRoundedRect(-60, -18, 120, 36, 18);
      }

      // Shine sweep
      const isStart = button.text.includes('START');
      const btnWidth = isStart ? 160 : 120;
      const btnHeight = isStart ? 40 : 36;
      const shine = this.add.rectangle(background.x - btnWidth / 2 - 30, background.y, 40, btnHeight + 10, 0xffffff)
        .setAngle(20)
        .setAlpha(0.0)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.tweens.add({
        targets: shine,
        x: background.x + btnWidth / 2 + 30,
        alpha: { from: 0.0, to: 0.35 },
        duration: 450,
        ease: 'Cubic.easeOut',
        onComplete: () => {
          this.tweens.add({ targets: shine, alpha: 0, duration: 150, onComplete: () => shine.destroy() });
        }
      });
    });

    button.on('pointerout', () => {
      this.tweens.add({ targets: [button, background], scaleX: 1, scaleY: 1, duration: 200, ease: 'Power2.easeOut' });
      background.clear();
      const originalColor = button.text.includes('START') ? 0x4CAF50 : 0x2196F3;
      const darkColor = button.text.includes('START') ? 0x2E7D32 : 0x1565C0;
      background.fillGradientStyle(originalColor, originalColor, darkColor, darkColor, 1);
      if (button.text.includes('START')) {
        background.fillRoundedRect(-80, -20, 160, 40, 20);
      } else {
        background.fillRoundedRect(-60, -18, 120, 36, 18);
      }
    });

    button.on('pointerdown', () => {
      this.tweens.add({ targets: [button, background], scaleX: 0.95, scaleY: 0.95, duration: 100, ease: 'Power2.easeOut', yoyo: true });
    });
  }

  createParticleEffects() {
    const { width, height } = this.scale;
    for (let i = 0; i < 8; i++) {
      const sparkle = this.add.graphics();
      sparkle.fillStyle(0xffd700, 0.8);
      sparkle.fillCircle(0, 0, 2);
      sparkle.x = Phaser.Math.Between(50, width - 50);
      sparkle.y = Phaser.Math.Between(50, height - 50);
      this.tweens.add({ targets: sparkle, alpha: 0, scaleX: 2, scaleY: 2, duration: Phaser.Math.Between(1500, 3000), ease: 'Power2.easeOut', yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 2000) });
    }
  }

  createMusicIndicator(width, height) {
    const musicNote = this.add.text(width - 40, 40, '♪', { fontFamily: 'Arial, sans-serif', fontSize: '24px', color: '#ffd700', alpha: 0.6 }).setOrigin(0.5);
    this.tweens.add({ targets: musicNote, y: musicNote.y - 10, alpha: 0.9, duration: 1500, ease: 'Sine.easeInOut', yoyo: true, repeat: -1 });
  }

  playButtonSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (e) {}
  }
}

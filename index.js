'use strict';

// import 'pixi';
// import 'p2';

const Phaser = require('phaser');

const configurations = {
  type: Phaser.AUTO,
  width: 288,
  height: 512,
  physics: { default: 'arcade', arcade: { gravity: { y: 300 }, debug: false } },
  scene: { preload: preload, create: create, update: update }
};

const assets = {
  assbutt: 'assbutt',
  obstacle: {
    pipe: {
      green: { top: 'pipe-green-top', bottom: 'pipe-green-bottom' },
      red: { top: 'pipe-red-top', bottom: 'pipe-red-bo' }
    }
  },
  scene: {
    width: 144,
    background: ['background-1', 'background-2', 'background-3', 'background-4', 'background-5', 'background-6', 'background-7', 'background-8'],
    ground: 'ground',
    gameOver: 'game-over',
    restart: 'restart-button',
    messageInitial: 'message-initial'
  },
  scoreboard: {
    width: 25,
    base: 'number',
    number0: 'number0',
    number1: 'number1',
    number2: 'number2',
    number3: 'number3',
    number4: 'number4',
    number5: 'number5',
    number6: 'number6',
    number7: 'number7',
    number8: 'number8',
    number9: 'number9'
  },
  animation: {
    assbutt: { clapWings: 'red-clap-wings', stop: 'red-stop' },
    ground: { moving: 'moving-ground', stop: 'stop-ground' }
  }
};

const game = new Phaser.Game(configurations);

let gameOver;
let gameStarted;

let upButton;
let restartButton;
let gameOverBanner;
let messageInitial;

let player;

// Quantity frames to move up.
let framesMoveUp;

let background;
let ground;
let pipesGroup;
let gapsGroup;

let nextPipes;
let currentPipe;

let scoreboardGroup;
let score;

function preload() {
  // Backgrounds and ground
  this.load.image(assets.scene.background[0], 'assets/bg1.png');
  this.load.image(assets.scene.background[1], 'assets/bg2.png');
  this.load.image(assets.scene.background[2], 'assets/bg3.png');
  this.load.image(assets.scene.background[3], 'assets/bg4.png');
  this.load.image(assets.scene.background[4], 'assets/bg5.png');
  this.load.image(assets.scene.background[5], 'assets/bg6.png');
  this.load.image(assets.scene.background[6], 'assets/bg7.png');
  this.load.image(assets.scene.background[7], 'assets/bg8.png');

  // this.load.image(assets.scene.background.day, 'assets/late-morning.png');
  // this.load.image(assets.scene.background.night, 'assets/evening.png');
  this.load.spritesheet(assets.scene.ground, 'assets/ground-sprite.png', { frameWidth: 336, frameHeight: 112 });

  // Pipes
  this.load.image(assets.obstacle.pipe.green.top, 'assets/pipe-green-top.png');
  this.load.image(assets.obstacle.pipe.green.bottom, 'assets/pipe-green-bottom.png');
  this.load.image(assets.obstacle.pipe.red.top, 'assets/pipe-red-top.png');
  this.load.image(assets.obstacle.pipe.red.bottom, 'assets/pipe-red-bottom.png');

  // Start game
  this.load.image(assets.scene.messageInitial, 'assets/message-initial.png');

  // End game
  this.load.image(assets.scene.gameOver, 'assets/gameover.png');
  this.load.image(assets.scene.restart, 'assets/restart-button.png');

  // Assbutt
  this.load.spritesheet(assets.assbutt, 'assets/assbutt-sprite.png', { frameWidth: 64, frameHeight: 64 });

  // Numbers
  this.load.image(assets.scoreboard.number0, 'assets/number0.png');
  this.load.image(assets.scoreboard.number1, 'assets/number1.png');
  this.load.image(assets.scoreboard.number2, 'assets/number2.png');
  this.load.image(assets.scoreboard.number3, 'assets/number3.png');
  this.load.image(assets.scoreboard.number4, 'assets/number4.png');
  this.load.image(assets.scoreboard.number5, 'assets/number5.png');
  this.load.image(assets.scoreboard.number6, 'assets/number6.png');
  this.load.image(assets.scoreboard.number7, 'assets/number7.png');
  this.load.image(assets.scoreboard.number8, 'assets/number8.png');
  this.load.image(assets.scoreboard.number9, 'assets/number9.png');
}

/**
 *   Create the game objects (images, groups, sprites and animations).
 */
function create() {
  background = this.add.image(0, 0, assets.scene.background[0]).setOrigin(0, 0).setInteractive();
  background.on('pointerdown', flap);

  gapsGroup = this.physics.add.group();
  pipesGroup = this.physics.add.group();
  scoreboardGroup = this.physics.add.staticGroup();

  ground = this.physics.add.sprite(assets.scene.width, 458, assets.scene.ground);
  ground.setCollideWorldBounds(true);
  ground.setDepth(10);

  messageInitial = this.add.image(0, 0, assets.scene.messageInitial).setOrigin(0, 0);
  messageInitial.setDepth(30);
  messageInitial.visible = false;

  upButton = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);

  // Ground animations
  this.anims.create({
    key: assets.animation.ground.moving,
    frames: this.anims.generateFrameNumbers(assets.scene.ground, { start: 0, end: 2 }),
    frameRate: 15,
    repeat: -1
  });
  this.anims.create({
    key: assets.animation.ground.stop,
    frames: [{ key: assets.scene.ground, frame: 0 }],
    frameRate: 20
  });

  // Assbutt Animations
  this.anims.create({
    key: assets.animation.assbutt.clapWings,
    frames: this.anims.generateFrameNumbers(assets.assbutt, { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
  });
  this.anims.create({
    key: assets.animation.assbutt.stop,
    frames: this.anims.generateFrameNumbers(assets.assbutt, { start: 0, end: 0 }),
    frameRate: 20
  });

  prepareGame(this);

  gameOverBanner = this.add.image(assets.scene.width, 206, assets.scene.gameOver);
  gameOverBanner.setDepth(20);
  gameOverBanner.visible = false;

  restartButton = this.add.image(assets.scene.width, 300, assets.scene.restart).setInteractive();
  restartButton.on('pointerdown', restartGame);
  restartButton.setDepth(20);
  restartButton.visible = false;
}

/**
 *  Update the scene frame by frame, responsible for move and rotate the bird and to create and move the pipes.
 */
function update() {
  if (gameOver || !gameStarted) {
    return;
  }

  if (framesMoveUp > 0) {
    framesMoveUp--;
  } else if (Phaser.Input.Keyboard.JustDown(upButton)) {
    flap();
  } else {
    player.setVelocityY(120);

    if (player.angle < 90) {
      player.angle += 1;
    }
  }

  pipesGroup.children.iterate(function (child) {
    if (child === undefined) {
      return;
    }
    if (child.x < -50) {
      child.destroy();
    } else {
      child.setVelocityX(-100);
    }
  })

  gapsGroup.children.iterate(function (child) {
    child.body.setVelocityX(-100);
  });

  nextPipes++;
  if (nextPipes === 130) {
    makePipes(game.scene.scenes[0]);
    nextPipes = 0;
  }
}

/**
 *  Bird collision event.
 *  @param {object} player - Game object that collided, in this case the bird.
 */
function hitBird(player) {
  this.physics.pause();

  gameOver = true;
  gameStarted = false;

  player.anims.play(assets.animation.assbutt.stop);
  ground.anims.play(assets.animation.ground.stop);

  gameOverBanner.visible = true;
  restartButton.visible = true;
}

/**
 *   Update the scoreboard.
 *   @param {object} _ - Game object that overlapped, in this case the bird (ignored).
 *   @param {object} gap - Game object that was overlapped, in this case the gap.
 */
function updateScore(_, gap) {
  gap.destroy();

  background.setTexture(assets.scene.background[++score % 8]);
  currentPipe = score % 8 >= 5 && score % 8 <= 7 ? assets.obstacle.pipe.red : assets.obstacle.pipe.green;

  updateScoreboard();
}

/**
 * Create pipes and gap in the game.
 * @param {object} scene - Game scene.
 */
function makePipes(scene) {
  if (!gameStarted || gameOver) {
    return;
  }

  const pipeTopY = Phaser.Math.Between(-120, 120);

  const gap = scene.add.line(288, pipeTopY + 210, 0, 0, 0, 98);
  gapsGroup.add(gap);
  gap.body.allowGravity = false;
  gap.visible = false;

  const pipeTop = pipesGroup.create(288, pipeTopY, currentPipe.top);
  pipeTop.body.allowGravity = false;

  const pipeBottom = pipesGroup.create(288, pipeTopY + 420, currentPipe.bottom);
  pipeBottom.body.allowGravity = false;
}

/**
 * Move the bird in the screen.
 */
function flap() {
  if (gameOver) {
    return;
  }

  if (!gameStarted) {
    startGame(game.scene.scenes[0]);
  }

  player.setVelocityY(-400);
  player.angle = -15;
  framesMoveUp = 5;
}

/**
 * Update the game scoreboard.
 */
function updateScoreboard() {
  scoreboardGroup.clear(true, true);

  const scoreAsString = score.toString();
  if (scoreAsString.length === 1) {
    scoreboardGroup.create(assets.scene.width, 30, assets.scoreboard.base + score).setDepth(10);
  } else {
    let initialPosition = assets.scene.width - ((score.toString().length * assets.scoreboard.width) / 2);

    for (let i = 0; i < scoreAsString.length; i++) {
      scoreboardGroup.create(initialPosition, 30, assets.scoreboard.base + scoreAsString[i]).setDepth(10);
      initialPosition += assets.scoreboard.width;
    }
  }
}

/**
 * Restart the game.
 * Clean all groups, hide game over objects and stop game physics.
 */
function restartGame() {
  pipesGroup.clear(true, true);
  pipesGroup.clear(true, true);
  gapsGroup.clear(true, true);
  scoreboardGroup.clear(true, true);
  player.destroy();
  gameOverBanner.visible = false;
  restartButton.visible = false;

  const gameScene = game.scene.scenes[0];
  prepareGame(gameScene);

  gameScene.physics.resume();
}

/**
 * Restart all variable and configurations, show main and recreate the bird.
 * @param {object} scene - Game scene.
 */
function prepareGame(scene) {
  framesMoveUp = 0;
  nextPipes = 0;
  currentPipe = assets.obstacle.pipe.green;
  score = 0;
  gameOver = false;
  messageInitial.visible = true;
  background.setTexture(assets.scene.background[0]);

  player = scene.physics.add.sprite(60, 265, assets.assbutt);
  const bWidth = 28,
    bHeight = 20;
  player.body.setSize(bWidth, bHeight);
  player.body.setOffset((65 - bWidth) / 2, (64 - bHeight) / 2 + (64 - 57));
  player.setCollideWorldBounds(true);
  player.anims.play(assets.animation.assbutt.clapWings, true);
  player.body.allowGravity = false;

  scene.physics.add.collider(player, ground, hitBird, null, scene);
  scene.physics.add.collider(player, pipesGroup, hitBird, null, scene);

  scene.physics.add.overlap(player, gapsGroup, updateScore, null, scene);

  ground.anims.play(assets.animation.ground.moving, true);
}

/**
 * Start the game, create pipes and hide the main menu.
 * @param {object} scene - Game scene.
 */
function startGame(scene) {
  gameStarted = true;
  messageInitial.visible = false;

  const score0 = scoreboardGroup.create(assets.scene.width, 30, assets.scoreboard.number0);
  score0.setDepth(20);

  makePipes(scene);
}

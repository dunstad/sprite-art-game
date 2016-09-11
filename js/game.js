function makeRequest (method, url) {
  return new Promise(function (resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(xhr.response);
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.send();
  });
}

var spriteData;
var game;
makeRequest("GET", "js/sprites.json").then(function(data){

  spriteData = JSON.parse(data);
  game = new Phaser.Game(
    800, 600, Phaser.AUTO, '',
    {preload: preload, create: create, update: update }
  );

})

function preload() {

  game.load.image('sky', 'assets/sky.png');
  game.load.image('ground', 'assets/platform.png');
  game.load.image('star', 'assets/star.png');
  game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
  game.load.spritesheet(
    'player', spriteData.filename,
    spriteData.frame.width, spriteData.frame.height
  );

}

var platforms;
var player;
var cursors;
var wasd;
var stars;
var score = 0;
var scoreText;
var purpleMonkies;
var eKey;
function create() {

  // turn on physics
  game.physics.startSystem(Phaser.Physics.ARCADE);

  // add the sky
  game.add.sprite(0, 0, 'sky');

  // set properties of ground
  platforms = game.add.group();
  platforms.enableBody = true;

  // make floor
  var ground = platforms.create(0, game.world.height - 64, 'ground');
  ground.scale.setTo(2, 2);
  ground.body.immovable = true;

  // make a couple platforms
  var ledge = platforms.create(400, 400, 'ground');
  ledge.body.immovable = true;

  ledge = platforms.create(-150, 250, 'ground');
  ledge.body.immovable = true;

  // stars
  stars = game.add.group()
  stars.enableBody = true;
  for (var i = 0; i < 12; i++) {
    var star = stars.create(i * 70, 0, 'star');
    star.body.gravity.y = 6;
    star.body.bounce.y = .7 + Math.random() * .2;
  }

  // purple monkeys
  purpleMonkies = game.add.group();
  purpleMonkies.enableBody = true;
  makePurpleMonkey(game, 64, 64);

  createPlayer(game, 32, 100);

  // controls
  cursors = game.input.keyboard.createCursorKeys();

  wasd = {
    up: game.input.keyboard.addKey(Phaser.Keyboard.W),
    down: game.input.keyboard.addKey(Phaser.Keyboard.S),
    left: game.input.keyboard.addKey(Phaser.Keyboard.A),
    right: game.input.keyboard.addKey(Phaser.Keyboard.D),
  };

  eKey = game.input.keyboard.addKey(Phaser.Keyboard.E);

  // score
  scoreText = game.add.text(16, 16, 'score: 0', {fontSize: '32px', fill: '#000'});

}

function update() {

  game.physics.arcade.collide(player, platforms);
  game.physics.arcade.collide(stars, platforms);
  game.physics.arcade.collide(purpleMonkies, platforms);
  game.physics.arcade.collide(player, purpleMonkies);
  game.physics.arcade.overlap(player, stars, collectStar, null, this);

  updatePlayer(player);

  // monkies
  for (var i = 0; i < purpleMonkies.children.length; i++) {
    updatePurpleMonkey(purpleMonkies.children[i]);
  }

}

function createPlayer(game, x, y) {
  player = game.add.sprite(x, y, 'player');
  player.anchor.setTo(spriteData.anchor.x, spriteData.anchor.y);
  game.physics.arcade.enable(player);
  player.body.gravity.y = 300;
  player.body.collideWorldBounds = true;

  // add all animations
  for (var i = 0; i < spriteData.animations.length; i++) {
    var anim = spriteData.animations[i];
    player.animations.add(anim.name, anim.frames, anim.fps, anim.loop);
  }
}

function updatePlayer(player) {

  // stop the player every frame
  player.body.velocity.x = 0;

  // walk around
  if (cursors.left.isDown || wasd.left.isDown) {
    player.body.velocity.x = -150;
    player.scale.x = 1;
    player.animations.play('walk');
  }
  else if (cursors.right.isDown || wasd.right.isDown) {
    player.body.velocity.x = 150;
    player.scale.x = -1;
    player.animations.play('walk');
  }
  // attack
  else if (eKey.isDown) {
    player.animations.play('attack');
  }
  // stand still
  else {
    player.animations.stop();
    player.frame = 6;
  }

  // jump
  if ((cursors.up.isDown || wasd.up.isDown) && player.body.touching.down) {
    player.body.velocity.y = -350;
  }

}

function makePurpleMonkey(game, x, y) {
  var purpleMonkey = purpleMonkies.create(x, y, 'dude');
  purpleMonkey.body.bounce.y = .2;
  purpleMonkey.body.gravity.y = 300;
  purpleMonkey.body.collideWorldBounds = true;
  purpleMonkey.walkRight = true;
  purpleMonkey.animations.add('left', [0, 1, 2, 3], 10, true);
  purpleMonkey.animations.add('right', [5, 6, 7, 8], 10, true);
}

function updatePurpleMonkey(monkey) {

  if (monkey.body.blocked.right || monkey.body.blocked.left) {
    monkey.walkRight = !monkey.walkRight;
  }

  if (monkey.walkRight) {
    monkey.body.velocity.x = 150;
    monkey.animations.play('right');
  }
  else {
    monkey.body.velocity.x = -150;
    monkey.animations.play('left');
  }

}

function collectStar(player, star) {
  star.kill();
  score += 10;
  scoreText.text = 'score: ' + score;
}

// URL to explain PHASER scene: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/scene/

export default class Game extends Phaser.Scene {
  constructor() {
    super("game");
  }

  init() {
    this.score = 0;
  }

  preload() {
    this.load.tilemapTiledJSON("map", "public/assets/tilemap/Mapa.json");
    this.load.image("tileset", "public/assets/Tilemap_Assets.png");
    this.load.image("background", "public/assets/background1.png");
    this.load.image("star", "public/assets/star.png");
    this.load.image("bomb", "public/assets/bomb.png");
    this.load.spritesheet("dude", "./public/assets/dude.png", {
      frameWidth: 32,
      frameHeight: 48,
    });
  }

  create() {
    const map = this.make.tilemap({ key: "map" });

    /* Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
    Phaser's cache (i.e. the name you used in preload)*/
    const background = map.addTilesetImage("Fondo Mapa", "background");
    const tileset = map.addTilesetImage("Tilemap Walls", "tileset");

    // Parameters: layer name (or index) from Tiled, tileset, x, y
    const belowLayer = map.createLayer("Background", background, 0, 0);
    const platformLayer = map.createLayer("Walls", tileset, 0, 0);
    const objectsLayer = map.getObjectLayer("Objetos");

    // Find in the Object Layer, the name "dude" and get position
    const spawnPoint = map.findObject(
      "Objetos",
      (obj) => obj.name === "player"
    );

    this.player = this.physics.add.sprite(spawnPoint.x, spawnPoint.y, "dude");
    this.player.setBounce(0.2);
    this.player.setCollideWorldBounds(false);

    this.anims.create({
      key: "left",
      frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "turn",
      frames: [{ key: "dude", frame: 4 }],
      frameRate: 20,
    });
    this.anims.create({
      key: "right",
      frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
      frameRate: 10,
      repeat: -1,
    });

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.keyC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);

    platformLayer.setCollisionByProperty({ Collisionable: true });
    this.physics.add.collider(this.player, platformLayer);

    //setting camera
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    this.cameras.main.startFollow(this.player);

    // tiles marked as colliding
    /*
    const debugGraphics = this.add.graphics().setAlpha(0.75);
    platformLayer.renderDebug(debugGraphics, {
      tileColor: null, // Color of non-colliding tiles
      collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
      faceColor: new Phaser.Display.Color(40, 39, 37, 255), // Color of colliding face edges
    });
    */

    // Create empty group of starts
    this.stars = this.physics.add.group();

    // find object layer
    // if type is "stars", add to stars group
    objectsLayer.objects.forEach((objData) => {
      const { x = 0, y = 0, name, type } = objData;
      switch (type) {
        case "star": {
          // add star to scene
          // console.log("estrella agregada: ", x, y);
          const star = this.stars.create(x, y, "star");
          star.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
          break;
        }
      }
    });

    // add collision between player and stars
    this.physics.add.collider(
      this.player,
      this.stars,
      this.collectStar,
      null,
      this
    );
    // add overlap between stars and platform layer
    this.physics.add.collider(this.stars, platformLayer);

    this.scoreText = this.add.text(
      this.cameras.main.worldView.x + this.cameras.main.centerX,
      this.cameras.main.worldView.y + this.cameras.main.centerY,
      `Score: ${this.score}`,
      {
        fontSize: "32px",
        fill: "#000",
      }
    );

    //enemy spawning
    this.enemies = this.physics.add.group();

    // find object layer
    // if type is "enemies", add to enemies group
    objectsLayer.objects.forEach((objData) => {
      const { x = 0, y = 0, name, type } = objData;
      switch (type) {
        case "enemies": {
          // add enemy to scene
          const bomb = this.enemies.create(x, y, "bomb");
          bomb.setVelocityX(100);
          bomb.setBounceX(1);
        }
      }
    });

    // add collision between player and bombs
    this.physics.add.collider(
      this.player,
      this.enemies,
      this.hitEnemy,
      null,
      this
    );
    // add overlap between stars and platform layer
    this.physics.add.collider(this.enemies, platformLayer);

    //setting a goal for the labyrinth
    const goalPoint = map.findObject("Objetos", (obj) => obj.name === "goal");
    this.goal = this.physics.add.sprite(goalPoint.x, goalPoint.y, "star");

    const goalTouch = this.physics.add.overlap(
      this.player,
      this.goal,
      this.reachGoal,
      null,
      this
    );
  }

  update() {
    // update game objects
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-200);
      this.player.anims.play("left", true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(200);
      this.player.anims.play("right", true);
    } else {
      this.player.setVelocityX(0);
      this.player.anims.play("turn");
    }

    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-200);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(200);
    } else {
      this.player.setVelocityY(0);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyR)) {
      this.scene.restart();
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyC)) {
      this.scene.restart();
    }

    this.scoreText.setPosition(
      this.cameras.main.worldView.x + 440,
      this.cameras.main.worldView.y + 16
    );
  }

  collectStar(player, star) {
    star.disableBody(true, true);

    this.score += 10;
    this.scoreText.setText(`Score: ${this.score}`);

    if (this.stars.countActive(true) === 0) {
      //  A new batch of stars to collect
      this.stars.children.iterate(function (child) {
        child.enableBody(true, child.x, 0, true, true);
      });
    }
  }

  hitEnemy() {
    this.physics.pause();
    this.add
      .text(
        this.cameras.main.worldView.x + this.cameras.main.centerX,
        this.cameras.main.worldView.y + this.cameras.main.centerY,
        `Perdiste`,
        {
          fontSize: "64px",
          fill: "#ffff",
        }
      )
      .setOrigin(0.5, 0.5);
    this.add
      .text(
        this.cameras.main.worldView.x + this.cameras.main.centerX,
        this.cameras.main.worldView.y + this.cameras.main.centerY + 64,
        `Presiona "R" para empezar de nuevo`,
        {
          fontSize: "32px",
          fill: "#ffff",
        }
      )
      .setOrigin(0.5, 0.5);
  }

  reachGoal() {
    if (this.score > 10) {
      this.physics.pause();
      this.add
        .text(
          this.cameras.main.worldView.x + this.cameras.main.centerX,
          this.cameras.main.worldView.y + this.cameras.main.centerY,
          `¡victoria!`,
          {
            fontSize: "64px",
            fill: "#ffff",
          }
        )
        .setOrigin(0.5, 0.5);
      this.add
        .text(
          this.cameras.main.worldView.x + this.cameras.main.centerX,
          this.cameras.main.worldView.y + this.cameras.main.centerY + 64,
          `Presiona "C" para continuar`,
          {
            fontSize: "32px",
            fill: "#ffff",
          }
        )
        .setOrigin(0.5, 0.5);
    }
  }
}

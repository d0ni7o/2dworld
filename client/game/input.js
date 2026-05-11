
let mousedown = false;
const maxCircleSize = 0;
const minCircleSize = 10;
const maxAttackDist = 40;
const Player = {
    entityBox: null
};
const Mouse = {
    x: 0,
    y: 0
};
let lastEventButton = -1;
document.addEventListener('contextmenu', event => event.preventDefault());
let TileUpdates = {};
const handleTileInput = function (event) {
    const x = clamp(
        event.clientX,
        Player.entityBox.room.x - Player.entityBox.room.width / 2,
        Player.entityBox.room.x + Player.entityBox.room.width / 2,
    );
    const y = clamp(
        event.clientY,
        Player.entityBox.room.y - Player.entityBox.room.height / 2,
        Player.entityBox.room.y + Player.entityBox.room.height / 2,
    );

    // Player.entityBox.x = x;
    // Player.entityBox.y = y;
    // Player.entityBox.updateGeometry();

    const tileX = Math.floor((x) / tileSize);
    const tileY = Math.floor((y) / tileSize);
    if (TileUpdates[`${tileX}-${tileY}`]) return;
    let tile;
    try {
        tile = Player.entityBox.room.TileMap.map[tileX][tileY];
    } catch (error) { };

    if (!tile) return;

    if (lastEventButton == 2) {
        tile.image = null;
        tile.imageIndex = -1;
        tile.updateCollider();
    } else {
        tile.setType(TileSets.Grass);
    };

    Player.entityBox.room.TileMap.optimizeColliders();

    TileUpdates[`${tileX}-${tileY}`] = true;
};
window.addEventListener('mousedown', function (event) {
    mousedown = true;

    const dx = event.clientX - Player.entityBox.x;

    if (event.button == 0) {
        if (Sword.attached && Sword.parent.root.id == Player.entityBox.id) {
            if (Player.entityBox.attacks.some(attack => attack.constructor.name == 'SwordAttack')) return;
            Player.entityBox.attacks.push(
                new SwordAttack(Sword, dx)
            );
        };
    };

    if (event.button == 2) {
        if (Sword2.attached && Sword2.parent.root.id == Player.entityBox.id) {
            if (Player.entityBox.attacks.some(attack => attack.constructor.name == 'SwordAttack')) return;
            Player.entityBox.attacks.push(
                new SwordAttack(Sword2, dx)
            );
        };
    };
    // if (Math.random() < 0.5) {
    //     if (Player.entityBox.attacks.some(attack => attack.constructor.name == 'Thrust1')) return;
    //     Player.entityBox.attacks.push(
    //         new Thrust1(Player.entityBox, dx)
    //     );
    // } else {
    //     if (Player.entityBox.attacks.some(attack => attack.constructor.name == 'Swing1')) return;
    //     Player.entityBox.attacks.push(
    //         new Swing1(Player.entityBox, dx)
    //     );
    // };

    Mouse.x = event.clientX;
    Mouse.y = event.clientY;

    lastEventButton = event.button;
    handleTileInput(event);

});
window.addEventListener('mouseup', function (event) {
    mousedown = false;

    Mouse.x = event.clientX;
    Mouse.y = event.clientY;

    TileUpdates = {};
    // Player.entityBox.x = event.clientX; Player.entityBox.y = event.clientY;
    // spawnCircle(event.clientX, event.clientY, minCircleSize);
});
window.addEventListener('mousemove', function (event) {
    Mouse.x = event.clientX;
    Mouse.y = event.clientY;

    if (!mousedown) return;

    handleTileInput(event);

    // const dx = event.clientX - Player.entityBox.x;
    // if (Math.random() < 0.5) {
    //     if(Player.entityBox.attacks.some(attack => attack.constructor.name == 'Thrust1')) return;
    //     Player.entityBox.attacks.push(
    //         new Thrust1(Player.entityBox, dx)
    //     );
    // } else {
    //     if(Player.entityBox.attacks.some(attack => attack.constructor.name == 'Swing1')) return;
    //     Player.entityBox.attacks.push(
    //         new Swing1(Player.entityBox, dx)
    //     );
    // };
    // spawnCircle(event.clientX, event.clientY, minCircleSize);
});
window.addEventListener('resize', function (event) {
    Screen.resize();
});
const Keys = {};
window.addEventListener('keydown', function (event) {
    Keys[event.code] = true;
});
window.addEventListener('keyup', function (event) {
    delete Keys[event.code];
    handleKeyup(event.code);

    if (event.code == 'Space') pausePhysics = !pausePhysics;
    if (event.code == 'ShiftLeft') World.rooms[0].circles = [];
});

const inputForce = 300;
const jumpForce = 700;
const handleInput = function () {
    if (Keys.KeyD) {
        Player.entityBox.dx = 0;
        Player.entityBox.dx += inputForce;
        Player.entityBox.flipX = false;
    };
    if (Keys.KeyA) {
        Player.entityBox.dx = 0;
        Player.entityBox.dx -= inputForce;
        Player.entityBox.flipX = true;
    };
    if (Keys.KeyW && Player.entityBox.Floor.collision) {
        Player.entityBox.dy -= jumpForce;
        Player.entityBox.jumping = true;
    };
    if (Keys.ShiftLeft) {
        if (!Player.entityBox.crouch) {
            Player.entityBox.crouch = true;
            Player.entityBox.height /= 2;
            Player.entityBox.y += Player.entityBox.height / 2;
            Player.entityBox.updateGeometry();
        };
    };
    if (Keys.KeyE) {
        Player.entityBox.interact = true;
    };
};
const handleKeyup = function (key) {
    if (pausePhysics) return;
    if (key == 'ShiftLeft') {
        Player.entityBox.crouch = false;
        Player.entityBox.height *= 2;
        Player.entityBox.updateGeometry();
    };
    if (key == 'KeyE') {
        Player.entityBox.interact = false;
    };
};
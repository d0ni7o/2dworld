import { ITEM_INVENTORY, CONTEXT_MENU, HotbarInventory } from "../animation/skeletons/skeleton.js";
import { clamp } from "../utils/utils.js";
import { tileSize, TileSets } from "../world/tilemap/tilemap.js";
// let mousedown = false;
// const maxCircleSize = 0;
// const minCircleSize = 10;
// const maxAttackDist = 40;
// export const Player = {
//     entityBox: null
// };
// export const Mouse = {
//     x: 0,
//     y: 0
// };

// let lastEventButton = -1;
// let TileUpdates = {};
// const handleTileInput = function (event) {
//     if (Keys.renderInventory || ITEM_INVENTORY.render || CONTEXT_MENU.render) return;
//     const x = clamp(
//         event.clientX + TestCamera.x - Screen.cameraView.width / 2,
//         Player.entityBox.room.x - Player.entityBox.room.width / 2,
//         Player.entityBox.room.x + Player.entityBox.room.width / 2,
//     );
//     const y = clamp(
//         event.clientY + TestCamera.y - Screen.cameraView.height / 2,
//         Player.entityBox.room.y - Player.entityBox.room.height / 2,
//         Player.entityBox.room.y + Player.entityBox.room.height / 2,
//     );

//     // Player.entityBox.x = x;
//     // Player.entityBox.y = y;
//     // Player.entityBox.updateGeometry();

//     const tileX = Math.floor((x - Player.entityBox.room.x + Player.entityBox.room.width / 2) / tileSize);
//     const tileY = Math.floor((y - Player.entityBox.room.y + Player.entityBox.room.height / 2) / tileSize);

//     // console.log({ tileX, tileY, x, y });
//     if (TileUpdates[`${tileX}-${tileY}`] && lastEventButton != 1) return;
//     let tile;
//     try {
//         tile = Player.entityBox.room.TileMap.map[tileX][tileY];
//     } catch (error) { };

//     if (!tile) return;

//     if (lastEventButton == 2) {
//         tile.image = null;
//         tile.imageIndex = -1;
//         tile.updateCollider();
//     } else if (lastEventButton == 0) {
//         tile.setType(TileSets.Grass);
//     } else {
//         tile.waterInstance.addWater(1);
//     };

//     Player.entityBox.room.TileMap.optimizeColliders();

//     TileUpdates[`${tileX}-${tileY}`] = true;
// };
// window.addEventListener('mousedown', function (event) {
//     mousedown = true;

//     const dx = event.clientX - Player.entityBox.x;
//     const attackWeapons = Player.entityBox.getChildren((bone) => {
//         if (bone.weaponAttacks) {
//             return true;
//         };
//     });
//     for (const weapon of attackWeapons) {
//         if (Player.entityBox.attacks.some(attack => attack.Owner.id == weapon.id)) continue;//attack.constructor.name == weapon.weaponAttacks[0].name)) continue;
//         Player.entityBox.attacks.push(new weapon.weaponAttacks[0](weapon, dx));
//         break;
//     };

//     Mouse.x = event.clientX + TestCamera.x - Screen.cameraView.width / 2;
//     Mouse.y = event.clientY + TestCamera.y - Screen.cameraView.height / 2;

//     lastEventButton = event.button;
//     handleTileInput(event);

// });
// window.addEventListener('mouseup', function (event) {
//     mousedown = false;

//     Mouse.x = event.clientX + TestCamera.x - Screen.cameraView.width / 2;
//     Mouse.y = event.clientY + TestCamera.y - Screen.cameraView.height / 2;

//     TileUpdates = {};

//     HumanInventory.handleInventoryInput();
//     // Player.entityBox.x = event.clientX; Player.entityBox.y = event.clientY;
//     // spawnCircle(event.clientX, event.clientY, minCircleSize);
// });
// window.addEventListener('mousemove', function (event) {
//     Mouse.x = event.clientX + TestCamera.x - Screen.cameraView.width / 2;
//     Mouse.y = event.clientY + TestCamera.y - Screen.cameraView.height / 2;

//     if (!mousedown) return;

//     const dx = event.clientX - Player.entityBox.x;

//     handleTileInput(event);
// });
// window.addEventListener('keyup', function (event) {
//     delete Keys[event.code];
//     handleKeyup(event.code);
// });

document.addEventListener('contextmenu', event => event.preventDefault());

const inputForce = 300;
const jumpForce = 700;

export const MouseButtonMap = {
    0: "LMB",
    1: "MMB",
    2: "RMB"
};
const Listener = {};

export class Input {
    constructor(Game) {
        this.Game = Game;
        this.Game.Input = this;

        this.initialize();
    };

    isTouchEnabled() {
        this.touchEnabled = ('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0);
        return this.touchEnabled;
    }

    resetListener() {
        Object.keys(Listener).forEach(key => {
            document.body.removeEventListener(key, Listener[key]);
            delete Listener[key];
        });
    };

    initialize() {
        this.Keys = {};
        this.Mouse = {
            clicked: false,
            wheel: 0,
            x: 0,
            y: 0,
            dx: 0,
            dy: 0
        };
        this.Player = {
            entityBox: null
        };
        this.TileUpdates = {};
        this.lastEventButton = -1;
        const thisRef = this;
        if (this.isTouchEnabled()) {
            if (!Listener.touchstart) {
                Listener.touchstart = function (event = TouchEvent) {
                    delete thisRef.Keys.ShiftLeft;
                    thisRef.Mouse[MouseButtonMap[0]] = true;
                    thisRef.Mouse.x = event.targetTouches[0].clientX;
                    thisRef.Mouse.y = event.targetTouches[0].clientY;
                };
                document.body.addEventListener('touchstart', Listener.touchstart);
            }
            if (!Listener.touchmove) {
                Listener.touchmove = function (event = TouchEvent) {
                    thisRef.Mouse[MouseButtonMap[0]] = true;
                    thisRef.Mouse.x = event.targetTouches[0].clientX;
                    thisRef.Mouse.y = event.targetTouches[0].clientY;
                };
                document.body.addEventListener('touchmove', Listener.touchmove);
            }
            if (!Listener.touchend) {
                Listener.touchend = function (event = TouchEvent) {
                    delete thisRef.Mouse[MouseButtonMap[0]];
                    delete thisRef.Keys.ShiftLeft;
                    thisRef.Mouse.x = event.changedTouches[0].clientX;
                    thisRef.Mouse.y = event.changedTouches[0].clientY;
                };
                document.body.addEventListener('touchend', Listener.touchend);
            }
        } else {
            if (!Listener.keydown) {
                Listener.keydown = function (event) {
                    thisRef.Keys[event.code] = true;
                };
                document.body.addEventListener('keydown', Listener.keydown);
            };
            if (!Listener.keyup) {
                Listener.keyup = function (event) {
                    delete thisRef.Keys[event.code];
                    thisRef.handleKeyup.call(thisRef, event.code);
                };
                document.body.addEventListener('keyup', Listener.keyup);
            };
            if (!Listener.wheel) {
                Listener.wheel = function (event) {
                    thisRef.Mouse.wheel += event.deltaY / 100;
                };
                document.body.addEventListener('wheel', Listener.wheel);
            };
            if (!Listener.mousedown) {
                Listener.mousedown = function (event) {
                    thisRef.Mouse.down = true;
                    thisRef.Mouse[MouseButtonMap[event.button]] = true;
                    thisRef.Mouse.x = event.clientX;
                    thisRef.Mouse.y = event.clientY;
                    thisRef.Mouse.worldX = event.clientX + thisRef.Game.MainCamera.x - thisRef.Game.Screen.cameraView.width / 2;
                    thisRef.Mouse.worldY = event.clientY + thisRef.Game.MainCamera.y - thisRef.Game.Screen.cameraView.height / 2;
                    const dx = thisRef.Mouse.worldX - thisRef.Player.entityBox.x;
                    const attackWeapons = thisRef.Player.entityBox.getChildren((bone) => {
                        if (bone.weaponAttacks) {
                            return true;
                        };
                    });
                    for (const weapon of attackWeapons) {
                        if (thisRef.Player.entityBox.attacks.some(attack => attack.Owner.id == weapon.id)) continue;//attack.constructor.name == weapon.weaponAttacks[0].name)) continue;
                        thisRef.Player.entityBox.attacks.push(new weapon.weaponAttacks[0](weapon, dx));
                        break;
                    };

                    thisRef.lastEventButton = event.button;
                    thisRef.handleTileInput.call(thisRef, event);


                    if (event.button == 0) {
                    } else if (event.button == 1) {
                        // document.body.requestPointerLock({ unadjustedMovement: true });
                    } else if (event.button == 2) {
                        event.preventDefault();
                    };
                };
                document.body.addEventListener('mousedown', Listener.mousedown);
            };
            if (!Listener.mouseup) {
                Listener.mouseup = function (event) {
                    delete thisRef.Mouse[MouseButtonMap[event.button]];
                    thisRef.Mouse.down = false;
                    if (event.button == 1) {
                        // document.exitPointerLock()
                    };
                    if (event.button == 0) {
                        thisRef.Mouse.clicked = true;
                    };

                    thisRef.Mouse.x = event.clientX;
                    thisRef.Mouse.y = event.clientY;
                    thisRef.Mouse.worldX = event.clientX + thisRef.Game.MainCamera.x - thisRef.Game.Screen.cameraView.width / 2;
                    thisRef.Mouse.worldY = event.clientY + thisRef.Game.MainCamera.y - thisRef.Game.Screen.cameraView.height / 2;

                    thisRef.TileUpdates = {};

                    thisRef.Game.HumanInventory.handleInventoryInput(thisRef);
                };
                document.body.addEventListener('mouseup', Listener.mouseup);
            };
            if (!Listener.mousemove) {
                Listener.mousemove = function (event) {
                    thisRef.Mouse.x = event.clientX;
                    thisRef.Mouse.y = event.clientY;
                    thisRef.Mouse.worldX = event.clientX + thisRef.Game.MainCamera.x - thisRef.Game.Screen.cameraView.width / 2;
                    thisRef.Mouse.worldY = event.clientY + thisRef.Game.MainCamera.y - thisRef.Game.Screen.cameraView.height / 2;
                    // thisRef.Mouse.dx = event.movementX;
                    // thisRef.Mouse.dy = event.movementY;
                    if (!thisRef.Mouse.down) return;
                    thisRef.handleTileInput.call(thisRef, event);
                };
                document.body.addEventListener('mousemove', Listener.mousemove);
            };
        };
    };
    handleKeyup(key) {
        if (key == 'Space') this.pausePhysics = !this.pausePhysics;
        // if (key == 'ShiftLeft') this.Game.World.rooms[0].circles = [];
        if (key == 'KeyI') {
            this.Keys.renderInventory = !this.Keys.renderInventory;
        };

        if (this.pausePhysics) return;
        if (key == 'ShiftLeft') {
            this.Player.entityBox.crouch = false;
            this.Player.entityBox.height *= 2;
            this.Player.entityBox.updateGeometry();
        };
        if (key == 'KeyE') {
            this.Player.entityBox.interact = false;
        };

        if (key.includes('Digit')) {
            const slot = HotbarInventory.slots[Number(key.split('Digit')[1]) - 1];
            if (slot) slot.active = false;
        };
    };
    handleInput() {
        if (this.Keys.KeyD) {
            this.Player.entityBox.dx = 0;
            this.Player.entityBox.dx += inputForce;
            this.Player.entityBox.flipX = false;
        };
        if (this.Keys.KeyA) {
            this.Player.entityBox.dx = 0;
            this.Player.entityBox.dx -= inputForce;
            this.Player.entityBox.flipX = true;
        };
        if (this.Keys.KeyW) {
            if (this.Player.entityBox.Floor.collision && !this.Player.entityBox.Ceiling.collision) {
                this.Player.entityBox.dy -= jumpForce;
                this.Player.entityBox.jumping = true;
            };
            if (this.Player.entityBox.waterCollision) {
                this.Player.entityBox.dy -= jumpForce / 50;
                // Player.entityBox.jumping = true;
            };
        };
        if (this.Keys.KeyS) {
            if (this.Player.entityBox.waterCollision) {
                this.Player.entityBox.dy += jumpForce / 50;
                // Player.entityBox.jumping = true;
            };
        };
        if (this.Keys.ShiftLeft) {
            if (!this.Player.entityBox.crouch) {
                this.Player.entityBox.crouch = true;
                this.Player.entityBox.height /= 2;
                this.Player.entityBox.y += this.Player.entityBox.height / 2;
                this.Player.entityBox.updateGeometry();
            };
        };
        if (this.Keys.KeyE) {
            this.Player.entityBox.interact = true;
        };
        for (let i = 0; i < HotbarInventory.slots.length; i++) {
            if (this.Keys[`Digit${i + 1}`]) {
                if (!HotbarInventory.slots[i].active) {
                    HotbarInventory.slots[i].active = true;
                    if (HotbarInventory.slots[i].item) {
                        if (HotbarInventory.slots[i].item.onUse) {
                            HotbarInventory.slots[i].item.onUse(this.Player.entityBox.skeleton.character);
                        } else if (HotbarInventory.slots[i].item.attach) {
                            // HotbarInventory.slots[i].item.attach(this.Player.entityBox.skeleton);
                            // HotbarInventory.slots[i].item.currentInventorySlot.item = null;
                        };
                    };
                };
            };
        };
    };
    handleTileInput(event) {
        if (this.Keys.renderInventory || ITEM_INVENTORY.render || CONTEXT_MENU.render) return;
        const x = clamp(
            this.Mouse.worldX,
            this.Player.entityBox.room.x - this.Player.entityBox.room.width / 2,
            this.Player.entityBox.room.x + this.Player.entityBox.room.width / 2,
        );
        const y = clamp(
            this.Mouse.worldY,
            this.Player.entityBox.room.y - this.Player.entityBox.room.height / 2,
            this.Player.entityBox.room.y + this.Player.entityBox.room.height / 2,
        );

        // Player.entityBox.x = x;
        // Player.entityBox.y = y;
        // Player.entityBox.updateGeometry();

        const tileX = Math.floor((x - this.Player.entityBox.room.x + this.Player.entityBox.room.width / 2) / tileSize);
        const tileY = Math.floor((y - this.Player.entityBox.room.y + this.Player.entityBox.room.height / 2) / tileSize);
        // console.log(`HANDLE TILE INPUT`, tileX, tileY, this.lastEventButton);

        // console.log({ tileX, tileY, x, y });
        if (this.TileUpdates[`${tileX}-${tileY}`] && this.lastEventButton != 1) return;
        let tile;
        try {
            tile = this.Player.entityBox.room.TileMap.map[tileX][tileY];
        } catch (error) { };

        if (!tile) return;

        if (this.lastEventButton == 2) {
            // tile.image = null;
            // tile.imageIndex = -1;
            tile.setImageIndex(-1);
            // tile.updateCollider();
            this.Player.entityBox.room.TileMap.updateColliders(tile);
        } else if (this.lastEventButton == 0) {
            tile.setType(TileSets.Grass);
            this.Player.entityBox.room.TileMap.updateColliders(tile);
        } else {
            tile.waterInstance.addWater(1);
        };

        // this.Player.entityBox.room.TileMap.optimizeColliders();

        this.TileUpdates[`${tileX}-${tileY}`] = true;
    };
};
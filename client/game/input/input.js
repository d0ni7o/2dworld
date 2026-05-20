import { CONTEXT_MENU } from "../ui/context_menu.js";
import { ITEM_INVENTORY } from "../ui/item_inventory.js";
import { HotbarInventory } from "../ui/hotbar.js";
import { clamp } from "../utils/utils.js";
import { tileSize, TileSets } from "../world/tilemap/tilemap.js";

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
                    thisRef.Player.entityBox.skeleton.character.attack(dx);

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
            this.Player.entityBox.skeleton.character.crouch(false);
            this.Player.entityBox.skeleton.character.walk(false);
        };
        if (key == 'KeyE') {
            this.Player.entityBox.skeleton.character.interact(false);
        };
        if (key == 'KeyS') {
            this.Player.entityBox.skeleton.character.moveDown(false);
        };
        if (key == 'KeyD') {
            this.Player.entityBox.skeleton.character.moveRight(false);
        };
        if (key == 'KeyA') {
            this.Player.entityBox.skeleton.character.moveLeft(false);
        };

        if (key.includes('Digit')) {
            const slot = HotbarInventory.slots[Number(key.split('Digit')[1]) - 1];
            if (slot) slot.active = false;
        };
    };
    handleInput() {
        if (this.Keys.KeyD) {
            this.Player.entityBox.skeleton.character.moveRight(true);
        };
        if (this.Keys.KeyA) {
            this.Player.entityBox.skeleton.character.moveLeft(true);
        };
        if (this.Keys.KeyW) {
            this.Player.entityBox.skeleton.character.jump();
        };
        if (this.Keys.KeyS) {
            this.Player.entityBox.skeleton.character.moveDown(true);
        };
        if (this.Keys.ShiftLeft) {
            this.Player.entityBox.skeleton.character.crouch(true);
            this.Player.entityBox.skeleton.character.walk(true);
        };
        if (this.Keys.KeyE) {
            this.Player.entityBox.skeleton.character.interact(true);
        };
        for (let i = 0; i < HotbarInventory.slots.length; i++) {
            if (this.Keys[`Digit${i + 1}`]) {
                if (!HotbarInventory.slots[i].active) {
                    HotbarInventory.slots[i].active = true;
                    if (HotbarInventory.slots[i].item) {
                        this.Player.entityBox.skeleton.character.use(HotbarInventory.slots[i].item);
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
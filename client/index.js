import { Screen } from "./game/screen/screen.js";
import { Box } from "./game/physics/geometry.js"
import { Room } from "./game/world/room/room.js";
import { loadTileSets, tileSize } from "./game/world/tilemap/tilemap.js";
import { loadAnimationSets } from "./game/animation/animation.js";
import { Camera } from "./game/screen/camera.js";
import { WorldGenerator } from "./game/world/generator/world-generator.js";
import { isLoading, randomInt } from "./game/utils/utils.js";
import { CONTEXT_MENU } from "./game/ui/context_menu.js";
import { CRAFTING_MENU } from "./game/ui/crafting_menu.js";
import { ITEM_INVENTORY } from "./game/ui/item_inventory.js";
import { HumanInventorySkeleton } from "./game/animation/skeletons/human/human.skeleton.js";
import { Human } from "./game/entities/characters/human/human.character.js";
import { Chest } from "./game/entities/characters/chest/chest.character.js";
import { Rabbit } from "./game/entities/characters/rabbit/rabbit.character.js";
import { Input } from "./game/input/input.js";
import { spawnItem } from "./game/entities/items/items.js";
import { Campfire } from "./game/entities/characters/campfire/campfire.character.js";
import { initializeInventorySkeletons } from "./game/animation/skeletons/inventories/inventory-skeletons.js";
import { Tree } from "./game/entities/characters/tree/tree.character.js";

let pausePhysics = false;

class Door extends Box {
    constructor(x, y, width, height) {
        super(x, y, width, height, 0);
    };

    link(Door) {
        this.otherDoor = Door;
        Door.otherDoor = this;
    };

    onCollision(dt, entityBox) {
        if (!entityBox.interact) return;
        if (entityBox.doorCooldown < 1) return;
        entityBox.doorCooldown = 0;
        entityBox.room.entityBoxes = entityBox.room.entityBoxes.filter(({ id }) => id != entityBox.id);
        if (entityBox.root?.skeleton?.character) {
            entityBox.room.characters = entityBox.room.characters.filter(({ id }) => id != entityBox.root.skeleton.character.id);
            this.otherDoor.room.addGeometry('character', entityBox.root.skeleton.character, true);
            entityBox.root.skeleton.Controller.x = this.otherDoor.x + entityBox.root.skeleton.Controller.x - this.x;
            entityBox.root.skeleton.Controller.y = this.otherDoor.y + entityBox.root.skeleton.Controller.y - this.y;
            entityBox.root.skeleton.Controller.updateGeometry();
        } else {
            this.otherDoor.room.addGeometry('entityBox', entityBox, true);
            entityBox.x = this.otherDoor.x + entityBox.x - this.x;
            entityBox.y = this.otherDoor.y + entityBox.y - this.y;
            entityBox.updateGeometry();
        };
        // entityBox.room = this.otherDoor.room;
        // entityBox.room.entityBoxes.push(entityBox);
        // entityBox.x = this.otherDoor.x + entityBox.x - this.x;
        // entityBox.y = this.otherDoor.y + entityBox.y - this.y;
        // entityBox.updateGeometry();
    };
};

class Gate extends Box {
    constructor(x, y, width, height) {
        super(x, y, width, height, 0);

        this.open = false;
        this.openSpeed = 100;

        this.offsetY = 0;

        // this.interactionCooldown = 0;
        // this.interactedIds = [];
    };

    updateGeometry() {
        super.updateGeometry();

        this.minOffsetY = -this.height;
        this.maxOffsetY = 0;
    };

    updatePos(dt) {
        super.updatePos(dt);
        // this.interactionCooldown += dt;
        // if (this.interactionCooldown > 5) {
        //     this.interactedIds = [];
        // };

        const oldOffsetY = this.offsetY;

        if (this.open) {
            this.offsetY = Math.max(this.minOffsetY, this.offsetY - dt * this.openSpeed);
            if (this.offsetY == this.minOffsetY) {
                this.moving = false;
            };
        } else {
            this.offsetY = Math.min(this.maxOffsetY, this.offsetY + dt * this.openSpeed);
            if (this.offsetY == this.maxOffsetY) {
                this.moving = false;
            };
        };

        if (oldOffsetY) this.y = this.ogY + this.offsetY;
    }

    onCollision(dt, entityBox) {
        Physics.checkEntityBoxBox(dt, entityBox, this);
        if (!entityBox.interact || this.moving) return;
        this.moving = true;
        this.open = !this.open;
        if (this.open) this.ogY = this.y;
        // this.interactionCooldown = 0;
        // this.interactedIds.push(entityBox.id);
    };
};

const doors = [
    new Door(-Screen.main.width / 4 + 25, Screen.main.height / 4 - 25, 50, 50),
    new Door(100, Screen.main.height / 4 - 25, 50, 50),
    new Door(25, Screen.main.height / 4 - 25, 50, 50),
    new Door(25, Screen.main.height / 4 - 25, 50, 50),
    new Door(125, Screen.main.height / 4 - 25, 50, 50),
    new Door(125, Screen.main.height / 4 - 25, 50, 50),
    new Door(-Screen.main.width / 4 + 25, -Screen.main.height / 4 + 25, 50, 50),
    new Door(-Screen.main.width / 4 + 25, - Screen.main.height / 4 + 25, 50, 50),
];

doors[0].link(doors[1]);
doors[2].link(doors[3]);
doors[4].link(doors[5]);
doors[6].link(doors[7]);

const World = {
    rooms: [],
    update(dt) {
        for (const room of this.rooms) {
            room.update(dt);
        };
    },
    initialize() { },
};

let Sword;
let Sword2;
let Mask;
let Shirt;
let Helm;
let Gloves;

let TestSkeleton;

let tileChange = 0;
let itemsSpawned = false;

let TestCamera = new Camera(null, Screen);
let PlayerCharacter;

let HumanInventory;
let timeScale = 1;

class Game {
    constructor() {
        World.Game = this;
        this.World = World;

        this.Screen = Screen;
    };
    update(dt = 0) {
        if (isLoading()) return;
        if (!itemsSpawned) {
            for (const room of World.rooms) {
                WorldGenerator.generate(room.TileMap, Math.floor(0 + 1 * (room.TileMap.map[0].length - 1) / 2));
                room.TileMap.optimizeColliders();
            };

            itemsSpawned = true;

            PlayerCharacter = new Human(100, 100, 4);

            this.Input.Player.entityBox = PlayerCharacter.skeleton.Controller;
            this.MainCamera.setTarget(PlayerCharacter.skeleton.Controller);

            // World.rooms[0].addGeometry('character', new Human(200, 100, 1));
            // World.rooms[0].addGeometry('character', new Human(400, 100, 2));
            // World.rooms[0].addGeometry('character', new Human(600, 100, 3));

            for (let i = 0; i < 1; i++) {
                spawnItem('Sword', 100, 100, this.Input.Player.entityBox.room);
                spawnItem('Sword', 150, 100, this.Input.Player.entityBox.room);
                spawnItem('Mask', 200, 100, this.Input.Player.entityBox.room);
                spawnItem('Shirt', 250, 100, this.Input.Player.entityBox.room);
                spawnItem('Helm', 300, 100, this.Input.Player.entityBox.room);
                spawnItem('Gloves', 350, 100, this.Input.Player.entityBox.room);
            };


            for (let i = 0; i < 20; i++) {
                spawnItem('Apple', randomInt(0, World.rooms[0].width), 0, this.Input.Player.entityBox.room);
                spawnItem('Wood', randomInt(0, World.rooms[0].width), 0, this.Input.Player.entityBox.room);
                World.rooms[0].addGeometry('character', new Rabbit(randomInt(0, World.rooms[0].width), 0, 2));
            };
            
            World.rooms[0].addGeometry('character', new Tree(randomInt(0, World.rooms[0].width), 100));

            World.rooms[0].addGeometry('character', new Chest(500, 100, 4));
            World.rooms[0].addGeometry('character', new Campfire(600, 100, 2));

            World.rooms[0].addGeometry('character', PlayerCharacter);
        }
        // tileChange += dt;
        // if (tileChange >= 1) {
        //     tileChange = 0;
        //     for (let i = 0; i < 20; i++) {
        //         lastEventButton = Math.random() < 0.5 ? 0 : 2;
        //         handleTileInput({ clientX: Math.floor(Math.random() * window.innerWidth), clientY: Math.floor(Math.random() * window.innerHeight) });
        //     };
        // };

        if (!this.Input.pausePhysics) this.Input.handleInput();

        World.update(dt * timeScale);

        this.Input.Player.entityBox.room.render();

        Screen.renderStats();

        if (this.Input.Keys.renderInventory) Screen.renderInventory(this.Input.Player.entityBox.skeleton.character);
        if (ITEM_INVENTORY.render) {
            if (Math.pow(ITEM_INVENTORY.target.x - this.Input.Player.entityBox.x, 2) + Math.pow(ITEM_INVENTORY.target.y - this.Input.Player.entityBox.y, 2) >= Math.pow(ITEM_INVENTORY.range, 2)) {
                ITEM_INVENTORY.close();
            } else {
                Screen.renderItemInventory();
            };
        };
        if (CONTEXT_MENU.render) {
            if (Math.pow(CONTEXT_MENU.target.x - this.Input.Player.entityBox.x, 2) + Math.pow(CONTEXT_MENU.target.y - this.Input.Player.entityBox.y, 2) >= Math.pow(CONTEXT_MENU.range, 2)) {
                CONTEXT_MENU.close();
            } else {
                Screen.renderContextMenu();
            };
        };
        if (CRAFTING_MENU.render) Screen.renderCraftingMenu();
        Screen.renderHotbar();
        Screen.renderUnstackSlot();



        // for (let i = 0; i < TileSets.Grass.images?.length; i++) {
        //     Screen.renderPng({
        //         drawing: TileSets.Grass.images[i],
        //         x: (i % 4) * tileSize,
        //         y: Math.floor(i / 4) * tileSize,
        //         width: tileSize,
        //         height: tileSize
        //     })
        // };
    };
    async initialize() {
        this.isRunning = false;
        this.then = 0;
        this.deltaTime = 0;

        Screen.resize();
        Screen.resize(Screen.cameraView);

        await loadAnimationSets();
        await loadTileSets();

        this.MainCamera = new Camera(null, Screen);
        this.HumanInventory = new HumanInventorySkeleton(0, 0, 10);
        initializeInventorySkeletons(this);
        Screen.INVENTORY_SKELETON = this.INVENTORY_SKELETON;
        new Input(this);

        Screen.Input = this.Input;
        Screen.Camera = this.MainCamera;
        Screen.HumanInventory = this.HumanInventory;
        Screen.setup();

        World.rooms = [
            new Room(World,
                0,
                0,
                tileSize * 100,
                tileSize * 50,
                [
                    // new Box(-Screen.main.width / 8, 0, Screen.main.width / 4, Screen.main.height / 4),
                    // new Box(0, Screen.main.height / 8 + 100, 50, 100),
                ],
                [
                    // new Vector(-Screen.main.width / 4, Screen.main.height / 4, Screen.main.width / 8, Screen.main.height / 4),
                    // new Vector(Screen.main.width / 8, Screen.main.height / 8, Screen.main.width / 2, Screen.main.height / 2),
                ],
                [
                    // new EntityBox(0, -40, 13 * 4, 18 * 4, 0, 'blue'),
                    // new EntityBox(20, -40, 40, 80, 0, 'blue')
                ],
                [
                    // doors[0],
                    // doors[6],
                    // new Gate(0, Screen.main.height / 8, 50, 100)
                ]
            ),
            // new Room(World,
            //     Screen.main.width / 4 + Screen.main.width / 2,
            //     Screen.main.height / 4,
            //     Screen.main.width / 2,
            //     Screen.main.height * 2,
            //     [
            //     ],
            //     [
            //     ],
            //     [],
            //     [
            //         doors[1],
            //         doors[2],
            //     ]
            // ),
            // new Room(World,
            //     Screen.main.width / 4,
            //     Screen.main.height / 4 + Screen.main.height / 2,
            //     Screen.main.width / 2,
            //     Screen.main.height / 2,
            //     [
            //     ],
            //     [
            //     ],
            //     [
            //     ],
            //     [
            //         doors[3],
            //         doors[4],
            //     ]
            // ),
            // new Room(World,
            //     Screen.main.width / 4 + Screen.main.width / 2,
            //     Screen.main.height / 4 + Screen.main.height / 2,
            //     Screen.main.width / 2,
            //     Screen.main.height / 2,
            //     [
            //     ],
            //     [
            //     ],
            //     [
            //     ],
            //     [
            //         doors[5],
            //         doors[7],
            //     ]
            // ),
        ];

        console.log(`INIT READY...`);
    };
    start() {
        console.log(`START`);
        this.isRunning = true;
        requestAnimationFrame(this.loop.bind(this))
    };
    stop() {
        this.isRunning = false;
    };
    loop(now) {
        now *= 0.001; // convert to seconds
        this.deltaTime = now - this.then;
        this.then = now;
        if (tabActive) this.update(Math.min(this.deltaTime, 1 / 60));
        if (!this.isRunning) { return };
        requestAnimationFrame(this.loop.bind(this))
    };
};
let tabActive = true;
window.onfocus = function (event) {
    tabActive = true;
};
window.onblur = function (event) {
    tabActive = false;
};

const GameInstance = new Game();
window.Game = GameInstance;
(async () => {
    await GameInstance.initialize();
    GameInstance.start();
})();

import { TileMap, tileSize } from "../tilemap/tilemap.js";
import { Water } from "../fluids/water.js";
import { Vector } from "../../physics/geometry.js";
import { gForce, Physics } from "../../physics/physics.js";
import { MAX_WATER_PER_TILE } from "../fluids/water.js";
import { clamp } from "../../utils/utils.js";

class SpatialGridCell {
    constructor(grid, x, y, width, height) {
        this.grid = grid;

        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.circles = [];
        this.boxes = [];
        this.rays = [];
        this.ramps = [];
        this.entityBoxes = [];
        this.hitBoxes = [];
        this.doors = [];

        this.Ramps = {};
        this.EntityBoxes = {};
        this.HitBoxes = {};
        this.Doors = {};

        this.calculatePosition();

        this.tiles = [];
    };

    calculatePosition() {
        this.Position = {
            x: this.x * this.width + this.grid.room.x - this.grid.room.width / 2 + this.width / 2,
            y: this.y * this.height + this.grid.room.y - this.grid.room.height / 2 + this.height / 2,
        };
    };

    reset() {
        this.circles = [];
        this.boxes = [];
        this.rays = [];
        this.ramps = [];
        this.entityBoxes = [];
        this.hitBoxes = [];
        this.doors = [];

        this.Ramps = {};
        this.EntityBoxes = {};
        this.HitBoxes = {};
        this.Doors = {};
    };
};

class SpatialGrid {
    constructor(room) {
        this.room = room;

        const cellWidth = Math.min(this.room.width, 10 * tileSize);
        const cellHeight = Math.min(this.room.height, 10 * tileSize);

        const cellsX = this.room.width / cellWidth;
        const cellsY = this.room.height / cellHeight;

        this.cells = [];
        for (let x = 0; x < cellsX; x++) {
            this.cells.push([])
            for (let y = 0; y < cellsY; y++) {
                this.cells[x].push(new SpatialGridCell(this, x, y, cellWidth, cellHeight));
            };
        };

        this.tilesPerX = cellWidth / tileSize;
        this.tilesPerY = cellHeight / tileSize;

        for (let tileX = 0; tileX < this.room.TileMap.map.length; tileX++) {
            for (let tileY = 0; tileY < this.room.TileMap.map[tileX].length; tileY++) {
                const gridX = Math.floor(tileX / this.tilesPerX);
                const gridY = Math.floor(tileY / this.tilesPerY);

                this.cells[gridX][gridY].tiles.push(this.room.TileMap.map[tileX][tileY]);
            };
        };

        this.Ramps = {};
        this.EntityBoxes = {};
        this.HitBoxes = {};
        this.Doors = {};
    };

    partition() {
        // if(this.partitioned) return;
        // this.partitioned = true;
        // const resetMap = {};
        for (const ramp of this.room.ramps) {
            if (ramp.partitioned) continue;
            const tileX = clamp(Math.floor((ramp.p0.x - this.room.x + this.room.width / 2) / tileSize), 0, this.room.TileMap.map.length - 1);
            const tileY = clamp(Math.floor((ramp.p0.y - this.room.y + this.room.height / 2) / tileSize), 0, this.room.TileMap.map[0].length - 1);
            const gridX = Math.floor(tileX / this.tilesPerX);
            const gridY = Math.floor(tileY / this.tilesPerY);
            if (this.Ramps[ramp.id]) {
                delete this.cells[gridX][gridY].Ramps[ramp.id];
            };
            this.Ramps[ramp.id] = { gridX, gridY };
            this.cells[gridX][gridY].Ramps[ramp.id] = ramp;
            ramp.partitioned = true;
            // if (!resetMap[`${gridX}-${gridY}`]) {
            //     resetMap[`${gridX}-${gridY}`] = true;
            //     this.cells[gridX][gridY].ramps = [];
            // };
            // this.cells[gridX][gridY].ramps.push(ramp);
        };
        for (const entityBox of this.room.entityBoxes) {
            if (entityBox.partitioned) continue;
            const tileX = clamp(Math.floor((entityBox.x - this.room.x + this.room.width / 2) / tileSize), 0, this.room.TileMap.map.length - 1);
            const tileY = clamp(Math.floor((entityBox.y - this.room.y + this.room.height / 2) / tileSize), 0, this.room.TileMap.map[0].length - 1);
            // const tile = this.room.TileMap.getTile(tileX, tileY);
            // if(!tile) continue;
            const gridX = Math.floor(tileX / this.tilesPerX);
            const gridY = Math.floor(tileY / this.tilesPerY);
            if (this.EntityBoxes[entityBox.id]) {
                delete this.cells[gridX][gridY].EntityBoxes[entityBox.id];
            };
            this.EntityBoxes[entityBox.id] = { gridX, gridY };
            this.cells[gridX][gridY].EntityBoxes[entityBox.id] = entityBox;
            entityBox.partitioned = true;
            // if (!resetMap[`${gridX}-${gridY}`]) {
            //     resetMap[`${gridX}-${gridY}`] = true;
            //     this.cells[gridX][gridY].entityBoxes = [];
            // };
            // this.cells[gridX][gridY].entityBoxes.push(entityBox);
        };
    };

    parseCollisions(dt) {
        for (let x = 1; x < this.cells.length - 1; x++) {
            for (let y = 1; y < this.cells[x].length - 1; y++) {
                const cells = [];
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        cells.push(this.cells[x + dx][y + dy]);
                    };
                };

                const tiles = [];
                const ramps = [];
                const entityBoxes = [];
                const hitBoxes = [];
                const doors = [];

                for (let i = 0; i < cells.length; i++) {
                    tiles.push(...cells[i].tiles);
                    ramps.push(...Object.values(cells[i].Ramps));
                    entityBoxes.push(...Object.values(cells[i].EntityBoxes));
                    hitBoxes.push(...cells[i].hitBoxes);
                    doors.push(...cells[i].doors);
                };

                this.handleCollisions(dt, tiles, ramps, entityBoxes, hitBoxes, doors);
            };
        };
    };


    handleCollisions(dt, tiles, ramps, entityBoxes, hitBoxes, doors) {
        const passes = 1;
        for (let p = 0; p < passes; p++) {
            for (let i = 0; i < ramps.length; i++) {
                for (let j = 0; j < entityBoxes.length; j++) {
                    if (ramps[i].collisionCondition && !ramps[i].collisionCondition(entityBoxes[j])) continue;
                    Physics.checkEntityBoxRamp(dt, entityBoxes[j], ramps[i]);
                };
            };
            for (let i = 0; i < doors.length; i++) {
                doors[i].updatePos(dt);
                for (let j = 0; j < entityBoxes.length; j++) {
                    if (Physics.checkBoxBox(entityBoxes[j], doors[i])) {
                        doors[i].onCollision(dt, entityBoxes[j]);
                    };
                };
            };
            for (let i = 0; i < entityBoxes.length; i++) {
                for (let j = i + 1; j < entityBoxes.length; j++) {
                    // Physics.checkEntityBoxEntityBox(dt, entityBoxes[i], entityBoxes[j]);

                    if (Physics.checkBoxBox(entityBoxes[i], entityBoxes[j])) {
                        if (entityBoxes[i].onCollision) {
                            entityBoxes[i].onCollision(dt, entityBoxes[j]);
                        } else if (entityBoxes[j].onCollision) {
                            entityBoxes[j].onCollision(dt, entityBoxes[i]);
                        };

                        if (entityBoxes[i].interact && entityBoxes[j].interactable) {
                            entityBoxes[j].interactable(entityBoxes[i]);
                            continue;
                        } else if (entityBoxes[j].interact && entityBoxes[i].interactable) {
                            entityBoxes[i].interactable(entityBoxes[j]);
                            continue;
                        };

                        if (entityBoxes[i].interact && entityBoxes[j].attach) {
                            entityBoxes[j].attach(entityBoxes[i].skeleton);
                        } else if (entityBoxes[j].interact && entityBoxes[i].attach) {
                            entityBoxes[i].attach(entityBoxes[j].skeleton);
                        };
                    };
                };
            };
            for (let i = 0; i < entityBoxes.length; i++) {
                for (let j = 0; j < hitBoxes.length; j++) {
                    if (Physics.checkBoxBox(entityBoxes[i], hitBoxes[j])) {
                        hitBoxes[j].registerHit(dt, entityBoxes[i]);
                    };
                };

                Physics.checkRoomOOB(this.room, entityBoxes[i]);
            };
        };

        tiles.sort((a, b) => a.waterInstance.amount - b.waterInstance.amount);
        for (const tile of tiles) {
            const waterInstance = tile.waterInstance;

            if (!waterInstance.amount) continue;
            waterInstance.flow(dt);
            if (!waterInstance.amount) continue;
            if (!waterInstance) continue;
            for (let j = 0; j < entityBoxes.length; j++) {
                if (!waterInstance.amount) continue;
                const waterCollider = waterInstance.getCollider();
                if (!waterCollider) continue;
                if (entityBoxes[j].noWaterCollision) continue;
                if (Physics.checkBoxBox(entityBoxes[j], waterCollider)) {
                    const dx = entityBoxes[j].x - entityBoxes[j].lastX;
                    const dy = entityBoxes[j].y - entityBoxes[j].lastY;

                    const waterDy = entityBoxes[j].y - waterInstance.tile.y * tileSize;

                    entityBoxes[j].dx += waterInstance.dx * waterInstance.amount * dt * 1000;
                    entityBoxes[j].dy += waterInstance.dy * waterInstance.amount * dt * 1000;
                    entityBoxes[j].lastX = entityBoxes[j].x;
                    entityBoxes[j].lastY = entityBoxes[j].y;


                    if (entityBoxes[j].waterCollision) continue;
                    if (entityBoxes[j].skeleton?.character?.Stats?.Breath && waterInstance.amount == MAX_WATER_PER_TILE) {
                        entityBoxes[j].skeleton.character.Stats.Breath.update(-20 * dt, dt);
                    };
                    entityBoxes[j].waterCollision = true;
                    entityBoxes[j].ddy -= 1.1 * (this.room.gForce || gForce) * (Math.min(MAX_WATER_PER_TILE - 1, waterInstance.amount)) / (MAX_WATER_PER_TILE - 1);
                    if (dy > dt * 600) {
                        waterInstance.splash(dx, dy / (dt * 600));
                    };
                };
            };
        };
    };
};

export class Room {
    constructor(
        World,
        x,
        y,
        width,
        height,
        boxes = [],
        ramps = [],
        entityBoxes = [],
        doors = []
    ) {
        this.World = World;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.totalDt = 0;

        new TileMap(this);
        this.water = new Water(this);

        this.circles = [];
        this.boxes = boxes;
        this.rays = [];
        this.points = [];
        this.ramps = [
            /* ROOM BORDERS */
            // new Vector(
            //     -this.width / 2,
            //     -this.height / 2,
            //     this.TileMap.maxX,
            //     -this.height / 2
            // ),
            new Vector(
                this.TileMap.maxX,
                -this.height / 2,
                this.TileMap.maxX,
                this.TileMap.maxY,
            ),
            new Vector(
                this.TileMap.maxX,
                this.TileMap.maxY,
                -this.width / 2,
                this.TileMap.maxY,
            ),
            new Vector(
                -this.width / 2,
                this.TileMap.maxY,
                -this.width / 2,
                -this.height / 2,
            ),
            ...ramps
            /**/
        ];
        this.characters = [];
        this.entityBoxes = entityBoxes;
        this.hitBoxes = [];
        this.doors = doors;

        for (let i = 0; i < this.circles.length; i++) this.circles[i].room = this;
        for (let i = 0; i < this.boxes.length; i++) {
            this.boxes[i].room = this;
            this.boxes[i].x += this.x;
            this.boxes[i].y += this.y;
            this.boxes[i].updateGeometry();
        };
        for (let i = 0; i < this.rays.length; i++) this.rays[i].room = this;
        for (let i = 0; i < this.points.length; i++) this.points[i].room = this;
        for (let i = 0; i < this.ramps.length; i++) {
            this.ramps[i].room = this;
            this.ramps[i].p0.x += this.x;
            this.ramps[i].p0.y += this.y;
            this.ramps[i].p.x += this.x;
            this.ramps[i].p.y += this.y;
        };
        for (let i = 0; i < this.entityBoxes.length; i++) {
            this.entityBoxes[i].room = this;
            this.entityBoxes[i].x += this.x;
            this.entityBoxes[i].y += this.y;
            this.entityBoxes[i].updateGeometry();
        };
        for (let i = 0; i < this.hitBoxes.length; i++) this.hitBoxes[i].room = this;
        for (let i = 0; i < this.doors.length; i++) {
            this.doors[i].room = this;
            this.doors[i].x += this.x;
            this.doors[i].y += this.y;
            this.doors[i].updateGeometry();
        };

        this.spatialGrid = new SpatialGrid(this);
    };

    addGeometry(type, geometry, skipTranslation) {
        switch (type) {
            case 'circle':
                this.circles.push(geometry);
                break;
            case 'box':
                this.boxes.push(geometry);
                break;
            case 'ramp':
                this.ramps.push(geometry);
                break;
            case 'character':
                this.characters.push(geometry);
                this.entityBoxes.push(geometry.skeleton.Controller);
                if (geometry.skeleton.onAddGeometry) {
                    geometry.skeleton.onAddGeometry(this)
                };
                break;
            case 'entityBox':
                this.entityBoxes.push(geometry);
                break;
            case 'door':
                this.doors.push(geometry);
                break;
        };

        switch (type) {
            case 'ramp':
                geometry.room = this;
                if (skipTranslation) return;
                geometry.p0.x += this.x - this.width / 2;
                geometry.p0.y += this.y - this.height / 2;
                geometry.p.x += this.x - this.width / 2;
                geometry.p.y += this.y - this.height / 2;
                break;
            case 'character':
                geometry.skeleton.Controller.room = this;
                if (skipTranslation) return;
                geometry.skeleton.Controller.x += this.x - this.width / 2;
                geometry.skeleton.Controller.y += this.y - this.height / 2;
                geometry.skeleton.Controller.updateGeometry();
                break;
            default:
                geometry.room = this;
                if (skipTranslation) return;
                geometry.x += this.x - this.width / 2;
                geometry.y += this.y - this.height / 2;
                geometry.updateGeometry();
                break;
        };
    };

    update(dt) {
        dt = dt || 0;

        if (!this.World.Game.Input.pausePhysics) {
            this.rays = [];
            this.points = [];

            const partitionRamps = [];
            const partitionEntityBoxes = [];
            // const partition

            for (const circle of this.circles) {
                circle.collision = false;

                this.gravity(circle);
            };
            for (const box of this.boxes) {
                box.collision = false;
                for (const side of box.sides) {
                    side.collision = false;
                };
                if (box.isStatic) continue;
                this.gravity(box);
            };
            for (const ramp of this.ramps) {
                ramp.collision = false;
            };
            for (const entityBox of this.entityBoxes) {
                entityBox.collision = false;
                for (const side of entityBox.sides) {
                    side.collision = false;
                };
                if (entityBox.isStatic) {
                    entityBox.resetCollisions(dt);
                    continue;
                };
                this.gravity(entityBox);

                if (entityBox.animate) {
                    if (entityBox.Ceiling.collision) entityBox.jumping = false;
                    entityBox.animate(dt);
                };

                entityBox.updatePos(dt);

                entityBox.resetCollisions(dt);

                // if (Math.round(entityBox.x) != Math.round(entityBox.lastX) || Math.round(entityBox.y) != Math.round(entityBox.lastY)) entityBox.partitioned = false;
            };

            // this.spatialGrid.partition();
            // this.spatialGrid.parseCollisions(dt);
            const passes = 1;
            for (let p = 0; p < passes; p++) {
                for (let i = 0; i < this.circles.length; i++) {
                    if (!p) this.circles[i].updatePos(dt);

                    Physics.checkOOB(this.circles[i]);

                    for (let j = i + 1; j < this.circles.length; j++) {
                        if (Physics.checkCircleCircle(dt, this.circles[i], this.circles[j])) {
                            // collisions = true;
                        };
                    };
                    for (let j = 0; j < this.entityBoxes.length; j++) {
                        Physics.checkCircleBox(dt, this.circles[i], this.entityBoxes[j]);
                    };
                };
                for (let i = 0; i < this.boxes.length; i++) {
                    if (this.boxes[i].isStatic) {
                        for (let j = 0; j < this.circles.length; j++) {
                            Physics.checkCircleBox(dt, this.circles[j], this.boxes[i]);
                        };
                        for (let j = 0; j < this.entityBoxes.length; j++) {
                            if (Physics.checkBoxBox(this.entityBoxes[j], this.boxes[i])) {
                                Physics.checkEntityBoxBox(dt, this.entityBoxes[j], this.boxes[i]);
                            };
                        };
                        continue;
                    };
                    this.boxes[i].updatePos(dt);
                };
                for (let i = 0; i < this.ramps.length; i++) {
                    for (let j = 0; j < this.circles.length; j++) {
                        Physics.checkCircleRamp(dt, this.circles[j], this.ramps[i]);
                    };
                    for (let j = 0; j < this.entityBoxes.length; j++) {
                        if (this.ramps[i].collisionCondition && !this.ramps[i].collisionCondition(this.entityBoxes[j])) continue;
                        Physics.checkEntityBoxRamp(dt, this.entityBoxes[j], this.ramps[i]);
                    };
                };
                for (let i = 0; i < this.doors.length; i++) {
                    this.doors[i].updatePos(dt);
                    for (let j = 0; j < this.entityBoxes.length; j++) {
                        if (Physics.checkBoxBox(this.entityBoxes[j], this.doors[i])) {
                            this.doors[i].onCollision(dt, this.entityBoxes[j]);
                        };
                    };
                };
                for (let i = 0; i < this.entityBoxes.length; i++) {
                    for (let j = i + 1; j < this.entityBoxes.length; j++) {
                        // Physics.checkEntityBoxEntityBox(dt, this.entityBoxes[i], this.entityBoxes[j]);

                        if (Physics.checkBoxBox(this.entityBoxes[i], this.entityBoxes[j])) {
                            if (this.entityBoxes[i].onCollision) {
                                this.entityBoxes[i].onCollision(dt, this.entityBoxes[j]);
                            } else if (this.entityBoxes[j].onCollision) {
                                this.entityBoxes[j].onCollision(dt, this.entityBoxes[i]);
                            };

                            if (this.entityBoxes[i].interact && this.entityBoxes[j].interactable) {
                                this.entityBoxes[j].interactable(this.entityBoxes[i]);
                                continue;
                            } else if (this.entityBoxes[j].interact && this.entityBoxes[i].interactable) {
                                this.entityBoxes[i].interactable(this.entityBoxes[j]);
                                continue;
                            };

                            if (this.entityBoxes[i].interact && this.entityBoxes[j].attach) {
                                this.entityBoxes[j].attach(this.entityBoxes[i].skeleton);
                            } else if (this.entityBoxes[j].interact && this.entityBoxes[i].attach) {
                                this.entityBoxes[i].attach(this.entityBoxes[j].skeleton);
                            };
                        };
                    };
                };
                for (let i = 0; i < this.entityBoxes.length; i++) {
                    for (let j = 0; j < this.hitBoxes.length; j++) {
                        if (Physics.checkBoxBox(this.entityBoxes[i], this.hitBoxes[j])) {
                            this.hitBoxes[j].registerHit(dt, this.entityBoxes[i]);
                        };
                    };

                    Physics.checkRoomOOB(this, this.entityBoxes[i]);
                };
            };

            this.water.instances = this.water.instances.sort((a, b) => a.amount - b.amount);
            for (let i = 0; i < this.water.instances.length; i++) {
                // if (this.water.instances[i].tile.waterSink) {
                //     this.water.instances[i].amount = 0;
                // } else if (this.water.instances[i].tile.waterSource) {
                //     this.water.instances[i].amount = this.water.instances[i].getWaterCapacity();
                // };
                if (!this.water.instances[i].amount) continue;
                this.water.instances[i].flow(dt);
                if (!this.water.instances[i].amount) continue;
                if (!this.water.instances[i]) continue;
                for (let j = 0; j < this.entityBoxes.length; j++) {
                    if (!this.water.instances[i].amount) continue;
                    const waterCollider = this.water.instances[i].getCollider();
                    if (!waterCollider) continue;
                    if (this.entityBoxes[j].noWaterCollision) continue;
                    if (Physics.checkBoxBox(this.entityBoxes[j], waterCollider)) {
                        const dx = this.entityBoxes[j].x - this.entityBoxes[j].lastX;
                        const dy = this.entityBoxes[j].y - this.entityBoxes[j].lastY;

                        const waterDy = this.entityBoxes[j].y - this.water.instances[i].tile.y * tileSize;

                        this.entityBoxes[j].dx += this.water.instances[i].dx * this.water.instances[i].amount * dt * 1000;
                        this.entityBoxes[j].dy += this.water.instances[i].dy * this.water.instances[i].amount * dt * 1000;
                        this.entityBoxes[j].lastX = this.entityBoxes[j].x;
                        this.entityBoxes[j].lastY = this.entityBoxes[j].y;


                        if (this.entityBoxes[j].waterCollision) continue;
                        if (this.entityBoxes[j].skeleton?.character?.Stats?.Breath && this.water.instances[i].amount == MAX_WATER_PER_TILE) {
                            this.entityBoxes[j].skeleton.character.Stats.Breath.update(-20 * dt, dt);
                        };
                        this.entityBoxes[j].waterCollision = true;
                        this.entityBoxes[j].ddy -= 1.1 * (this.gForce || gForce) * (Math.min(MAX_WATER_PER_TILE - 1, this.water.instances[i].amount)) / (MAX_WATER_PER_TILE - 1);
                        if (dy > dt * 600) {
                            this.water.instances[i].splash(dx, dy / (dt * 600));
                        };
                    };
                };
            };
            for (let i = 0; i < this.water.instances.length; i++) {
                if (this.water.instances[i].tile.waterSink) {
                    this.water.instances[i].amount = Math.max(0, this.water.instances[i].amount - 1);
                } else if (this.water.instances[i].tile.waterSource) {
                    this.water.instances[i].amount = this.water.instances[i].getWaterCapacity();
                };
            };

            for (const entityBox of this.entityBoxes) {
                const tileX = Math.floor((entityBox.x - this.x + this.width / 2) / tileSize);
                const tileY = Math.floor((entityBox.y - this.y + this.height / 2) / tileSize);
                const tile = this.TileMap.getTile(tileX, tileY);
                if (!tile) continue;
                if (this.TileMap.map[tileX][tileY].boxCollider) {
                    if (Physics.checkEntityBoxBox2(dt, entityBox, this.TileMap.map[tileX][tileY].boxCollider)) {
                        this.TileMap.map[tileX][tileY].image = null;
                        this.TileMap.map[tileX][tileY].imageIndex = -1;
                        this.TileMap.updateColliders(this.TileMap.map[tileX][tileY]);
                        // this.TileMap.optimizeColliders();
                    };
                };
            };

            for (const character of this.characters) {
                character.update(dt);
                if(character.AI) character.AI.update(dt);
            };

            // this.totalDt += dt;
            // if (this.totalDt > FLOW_TICK_S * 2 && !Player.stopTestWater) {
            //     this.totalDt = 0;
            //     this.water.addWaterInstance(
            //         this.TileMap.map[
            //         Math.floor(Math.random() * this.TileMap.map.length)
            //         ][
            //         Math.floor(0)
            //         ]
            //     );
            //     // this.water.addWaterInstance(
            //     //     this.TileMap.map[
            //     //     Math.floor((this.TileMap.map.length - 1) / 2)
            //     //     ][
            //     //     Math.floor((this.TileMap.map[0].length - 1 - 2))
            //     //     ]
            //     // );
            //     // this.water.addWaterInstance(
            //     //     this.TileMap.map[
            //     //     -1 + Math.floor((this.TileMap.map.length) / 2)
            //     //     ][
            //     //     Math.floor((this.TileMap.map[0].length - 1 - 2))
            //     //     ]
            //     // );
            //     // this.water.addWaterInstance(
            //     //     this.TileMap.map[
            //     //     1 + Math.floor((this.TileMap.map.length) / 2)
            //     //     ][
            //     //     Math.floor((this.TileMap.map[0].length - 1 - 2))
            //     //     ]
            //     // );
            // };
            // this.TileMap.map[0][this.TileMap.map[0].length - 1].waterInstance.amount = Math.max(0, this.TileMap.map[0][this.TileMap.map[0].length - 1].waterInstance.amount - 7);
            // this.TileMap.map[this.TileMap.map.length - 1][this.TileMap.map[0].length - 1].waterInstance.amount = Math.max(0, this.TileMap.map[this.TileMap.map.length - 1][this.TileMap.map[0].length - 1].waterInstance.amount - 7);

            /** ANIMATE ? */
            // for (const entityBox of this.entityBoxes) {
            //     if (entityBox.animate) entityBox.animate(dt);
            // };
        };

        this.World.Game.MainCamera.updatePos(dt);
    };

    render() {
        // this.World.Game.Screen.ctx.clearRect(0, 0, this.World.Game.Screen.main.width, this.World.Game.Screen.main.height);
        this.World.Game.Screen.cameraCtx.clearRect(0, 0, this.World.Game.Screen.cameraView.width, this.World.Game.Screen.cameraView.height);

        for (const column of this.TileMap.map) {
            for (const tile of column) {
                if (this.World.Game.MainCamera.checkBoxRender({ x: tile.Position.x, y: tile.Position.y, width: tileSize, height: tileSize })) {
                    this.World.Game.Screen.renderTile(this.World.Game.MainCamera.getTileImage(tile), this.TileMap, this.World.Game.Screen.cameraCtx);
                };
            };
        };

        this.World.Game.Screen.renderMouse(this.World.Game.Screen.cameraCtx);

        for (const box of this.boxes) {
            if (this.World.Game.MainCamera.checkBoxRender(box)) {
                this.World.Game.Screen.renderBox(this.World.Game.MainCamera.getBoxImage(box), this.World.Game.Screen.cameraCtx);
            };
        };
        for (const circle of this.circles) {
            this.World.Game.Screen.renderCircle(circle);
        };
        for (const ramp of this.ramps) {
            if (this.World.Game.MainCamera.checkRayRender(ramp)) {
                this.World.Game.Screen.renderRay(this.World.Game.MainCamera.getRayImage(ramp), this.World.Game.Screen.cameraCtx);
            };
        };
        for (const entityBox of this.entityBoxes) {
            if (this.World.Game.MainCamera.checkBoxRender(entityBox)) {
                this.World.Game.Screen.renderEntityBox(this.World.Game.MainCamera.getBoxImage(entityBox), this.World.Game.Screen.cameraCtx);
            };
        };
        for (const hitbox of this.hitBoxes) {
            if (this.World.Game.MainCamera.checkBoxRender(hitbox)) {
                this.World.Game.Screen.renderBox(this.World.Game.MainCamera.getBoxImage(hitbox), this.World.Game.Screen.cameraCtx);
            };
        };
        for (const door of this.doors) {
            if (this.World.Game.MainCamera.checkBoxRender(door)) {
                this.World.Game.Screen.renderBox(this.World.Game.MainCamera.getBoxImage(door), this.World.Game.Screen.cameraCtx);
            };
        };
        // for (const character of this.characters) {
        //     this.World.Game.Screen.renderSkeleton(character.skeleton);
        // };
        for (const character of this.characters) {
            if (this.World.Game.MainCamera.checkSkeletonRender(character.skeleton)) {
                this.World.Game.Screen.renderSkeleton(character.skeleton, this.World.Game.Screen.cameraCtx);
                this.World.Game.Screen.renderHp(character, this.World.Game.Screen.cameraCtx);
            };
        };
        for (const waterInstance of this.water.instances) {
            waterInstance.updateDimensions();
            if (this.World.Game.MainCamera.checkWaterRender(waterInstance)) {
                this.World.Game.Screen.renderWaterInstance(this.World.Game.MainCamera.getWaterImage(waterInstance), this.World.Game.Screen.cameraCtx);
            };

        };

        // for (const column of this.spatialGrid.cells) {
        //     for (const cell of column) {
        //         // if (this.World.Game.MainCamera.checkBoxRender({ x: cell.Position.x, y: cell.Position.y, width: cell.width, height: cell.height })) {
        //         this.World.Game.Screen.renderCell(this.World.Game.MainCamera.getCellImage(cell), this.World.Game.Screen.cameraCtx);
        //         // };
        //     };
        // };
        // this.World.Game.Screen.renderWater(this.water);
        // for (const ray of this.rays) {
        //     this.World.Game.Screen.renderRay(ray);
        // };
        // for (const point of this.points) {
        //     this.World.Game.Screen.renderCircle({ color: 'red', radius: 10, ...point });
        // };

        // this.World.Game.MainCamera.updateView();
        // this.World.Game.MainCamera.render();
    };

    gravity(entity) {
        entity.ddy += entity.gForce || this.gForce || gForce;
    };

    removeRamp(ramp) {
        this.ramps = this.ramps.filter(({ id }) => id != ramp.id);
        if (this.spatialGrid.Ramps[ramp.id]) {
            delete this.spatialGrid.cells[this.spatialGrid.Ramps[ramp.id].gridX][this.spatialGrid.Ramps[ramp.id].gridY].Ramps[ramp.id];
        };
    };
    removeEntityBox(entityBox) {
        this.entityBoxes = this.entityBoxes.filter(({ id }) => id != entityBox.id);
        if (this.spatialGrid.EntityBoxes[entityBox.id]) {
            delete this.spatialGrid.cells[this.spatialGrid.EntityBoxes[entityBox.id].gridX][this.spatialGrid.EntityBoxes[entityBox.id].gridY].EntityBoxes[entityBox.id];
        };
    };
    removeHitBox() { };
    removeDoor() { };
};
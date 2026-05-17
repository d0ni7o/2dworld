const MAX_WATER_PER_TILE = 8;

const WATER_FLOW_OFFSETS = [
    [
        { x: 0, y: 1 }
    ],
    [
        { x: 1, y: 1 },
        { x: -1, y: 1 }
    ],
    [
        { x: 1, y: 0 },
        { x: -1, y: 0 }
    ],
];

const FLOW_TICK_S = 0.05;

class WaterInstance {
    constructor(water, tile, amount) {
        this.id = getId();
        this.water = water;
        this.tile = tile;
        this.amount = amount === undefined ? 1 : amount;
        this.flowT = 0;
        this.splitT = 0;
        this.lastFlowT = 0;
        this.stagnationLimit = 10 + randomInt(10);

        this.dx = 0;
        this.dy = 0;

        this.totalDx = 0;
        this.totalDy = 0;

        this.Collider = {};
        this.ColliderDy = {};
        for (let a = 1; a <= MAX_WATER_PER_TILE; a++) {
            const waterHeight = a * tileSize / MAX_WATER_PER_TILE;
            this.Collider[a] = new Box(
                this.tile.x * tileSize + tileSize / 2 + this.tile.TileMap.room.x - this.tile.TileMap.room.width / 2,
                this.tile.y * tileSize + tileSize / 2 + (tileSize - waterHeight) / 2 + this.tile.TileMap.room.y - this.tile.TileMap.room.height / 2,
                tileSize,
                waterHeight
            );
            this.ColliderDy[a] = new Box(
                this.tile.x * tileSize + tileSize / 2 + this.tile.TileMap.room.x - this.tile.TileMap.room.width / 2,// + (tileSize - waterHeight) / 2,
                this.tile.y * tileSize + tileSize / 2 + this.tile.TileMap.room.y - this.tile.TileMap.room.height / 2,
                waterHeight,
                tileSize
            );
        };
        // this.collider = new Box(this.tile.x * tileSize + tileSize / 2, this.tile.y * tileSize + tileSize / 2, tileSize, tileSize);
        // this.timeOffset = Math.random();
    };

    getDimensions() {
        let waterWidth;
        let waterHeight;
        if (this.dy != 0) {
            waterWidth = this.amount * tileSize / MAX_WATER_PER_TILE;
            waterHeight = tileSize;
        } else {
            waterWidth = tileSize;
            waterHeight = this.amount * tileSize / MAX_WATER_PER_TILE;
        };
        const x = this.tile.x * tileSize + this.tile.TileMap.room.x - this.tile.TileMap.room.width / 2 + tileSize / 2 - Math.floor(tileSize / 2) + (tileSize - waterWidth) / 2;
        const y = this.tile.y * tileSize + this.tile.TileMap.room.y - this.tile.TileMap.room.height / 2 + tileSize / 2 - Math.floor(tileSize / 2) + (tileSize - waterHeight);

        return {
            x, y, width: waterWidth, height: waterHeight
        };
    };

    updateDimensions() {
        this.dimensions = this.getDimensions();
    };

    getCollider() {
        if (this.dy != 0) {
            return this.ColliderDy[this.amount];
        };

        return this.Collider[this.amount];
    };

    getWaterCapacity() {
        switch (this.tile.imageIndex) {
            case 2:
            case 3:
            case 4:
            case 5:
                return MAX_WATER_PER_TILE / 2;
            default:
                return MAX_WATER_PER_TILE;
        };
    };

    add(waterInstance) {
        const extraWater = Math.max(0, this.amount + waterInstance.amount - MAX_WATER_PER_TILE);
        this.amount += Math.min(MAX_WATER_PER_TILE, waterInstance.amount) - extraWater;
        waterInstance.amount = extraWater;

        this.dx += waterInstance.dx || 0;
        this.dy += waterInstance.dy || 0;

        if (waterInstance.amount) {
            // return waterInstance;
            const topTile = this.tile.getNeighbour(0, -1);
            if (!topTile || topTile.image) return waterInstance;
            return this.water.addWaterInstance(topTile, null, extraWater).waterInstance;
            // if (!result.waterInstance && result.remove) {
            //     // this.water.removeWaterInstance(waterInstance);
            // };
        };
        return null;
    };

    addWater(amount) {
        const waterCapacity = this.getWaterCapacity();
        const extraWater = Math.max(0, this.amount + amount - waterCapacity);
        this.amount += Math.min(waterCapacity, amount) - extraWater;
        return extraWater;
    };

    flow(dt) {
        this.flowT += dt;
        this.lastFlowT += dt;
        const speed = 0;//Math.sqrt(Math.pow(this.dx, 2) + Math.pow(this.dy, 2));
        if ((this.flowT < (FLOW_TICK_S) / (1 + speed))/* && !this.tile.waterSource*/) return;
        if(this.lastFlowT > (this.stagnationLimit) && this.amount > 0 && this.amount <= this.getWaterCapacity() / 2) {
            this.lastFlowT = 0;
            this.amount--;
            return;
        }
        this.flowT = 0;
        this.dx *= 0.5;
        if (Math.abs(this.dx) < 0.5) this.dx = 0;
        if (this.amount <= 0) {
            this.dx = 0;
            this.dy = 0;
            return;
        };
        const bottomTile = this.tile.getNeighbour(0, 1);
        if (this.flowToTile(bottomTile)) {
            if (Math.abs(this.dx) < 4) this.dx = 0;
            this.lastFlowT = 0;
            return true;
        };

        const leftTile = this.tile.getNeighbour(-1, 0);
        // const leftWaterInstance = this.water.getWaterInstance(leftTile);
        const rightTile = this.tile.getNeighbour(1, 0);
        // const rightWaterInstance = this.water.getWaterInstance(rightTile);
        const tiles = [];
        // if (leftTile) tiles.push(leftTile);
        // if (rightTile) tiles.push(rightTile);

        let nextTile;
        if (this.dx > 0 && this.amount > 1) {
            nextTile = rightTile;
        } else if (this.dx < 0 && this.amount > 1) {
            nextTile = leftTile;
        } else {
            let hasFlow = false;
            if (leftTile && (leftTile.waterInstance.amount < this.amount && this.amount > 1)) {
                tiles.push(leftTile);
                hasFlow = true;
            };
            if (rightTile && (rightTile.waterInstance.amount < this.amount && this.amount > 1)) {
                tiles.push(rightTile);
                hasFlow = true;
            };
            if (hasFlow || this.dy != 0) {
                nextTile = randomEl(tiles);
            };
        };
        if (this.flowToTile(nextTile)) {
            this.dy = 0;
            if (Math.abs(this.dx) < 4) this.dx = 0;
            this.lastFlowT = 0;
            return true;
        };
        this.dx = 0;
        const topTile = this.tile.getNeighbour(0, -Math.abs(this.dy));
        this.dy = 0;
        // if (this.flowToTile(topTile)) {
            // this.lastFlowT = 0;
        //     return true;
        // };

        return false;
        // if (!bottomTile || bottomTile.image) {
        //     this.dy = 0;
        //     // this.split();
        //     return;
        // };
        // const bottomWaterInstance = this.water.getWaterInstance(bottomTile);
        // if (bottomWaterInstance && bottomWaterInstance.amount == MAX_WATER_PER_TILE) {
        //     this.dy = 0;
        //     // this.split();
        //     return;
        // };
        // this.dy++;
        // const result = this.water.addWaterInstance(bottomTile, this);
        // if (!result.waterInstance && result.remove) {
        //     this.water.removeWaterInstance(this.id);
        // };
    };

    splash(dx, dy) {
        let tile = this.tile.getNeighbour(Math.sign(dx), -1 * Math.ceil(dy));
        if (this.amount <= 0) return;
        if (this.flowToTile(tile)) {
            return true;
        };

        if (!dx) return false;

        tile = this.tile.getNeighbour(-Math.sign(dx), -1 * Math.ceil(dy));
        if (this.flowToTile(tile)) {
            return true;
        };

        tile = this.tile.getNeighbour(0, -1 * Math.ceil(dy));
        if (this.flowToTile(tile)) {
            return true;
        };

        return false;
    };

    flowToTile(tile) {
        if (!tile) return false;
        const flowX = tile.x - this.tile.x;
        const flowY = tile.y - this.tile.y;
        if (tile.image) {
            if (flowY > 0 && tile.topCollider) return false;
            if (flowY < 0 && tile.bottomCollider) return false;
            if (flowX > 0 && tile.leftCollider) return false;
            if (flowX < 0 && tile.rightCollider) return false;
            // return false;
        };
        if (this.tile.image) {
            if (flowY > 0 && (this.tile.bottomCollider || this.tile.GhostCollider.bottom)) return false;
            if (flowY < 0 && (this.tile.topCollider || this.tile.GhostCollider.top)) return false;
            if (flowX > 0 && (this.tile.rightCollider || this.tile.GhostCollider.right)) return false;
            if (flowX < 0 && (this.tile.leftCollider || this.tile.GhostCollider.left)) return false;
            // return false;
        };
        const waterInstance = tile.waterInstance;
        if (waterInstance) {
            this.amount -= 1;
            const extraWater = waterInstance.addWater(1);
            if (extraWater) {
                this.amount += extraWater;
                return false;
            };
            const dx = waterInstance.tile.x - this.tile.x;
            const dy = waterInstance.tile.y - this.tile.y;
            waterInstance.dx += dx;
            waterInstance.dy += dy;
            if (this.amount <= 0) {
                this.dx = 0;
                this.dy = 0;
                // this.water.removeWaterInstance(this.id);
            } else {
                this.dx = dx;
                this.dy = dy;
            };
            return true;
        };

        if (this.amount == 1) {
            this.moveToTile(tile);
        } else {
            this.amount -= 1;
            this.water.addWaterInstance(tile);
            if (this.amount <= 0) {
                this.dx = 0;
                this.dy = 0;
                // this.water.removeWaterInstance(this.id);
            } else {
                this.dx = tile.x - this.tile.x;
                this.dy = tile.y - this.tile.y;
            };
        };

        return true;
    };

    moveToTile(tile) {
        const dx = tile.x - this.tile.x;
        const dy = tile.y - this.tile.y;
        this.dx += dx;
        this.dy += dy;
        this.tile = tile;
    };

    // flow(dt) {
    //     this.flowT += dt;
    //     const speed = 0;//Math.sqrt(Math.pow(this.dx, 2) + Math.pow(this.dy, 2));
    //     if (this.flowT < (FLOW_TICK_S) / (1 + speed)) return;
    //     this.flowT = 0;
    //     const bottomTile = this.tile.getNeighbour(0, 1);
    //     if (!bottomTile || bottomTile.image) {
    //         this.dy = 0;
    //         this.split();
    //         return;
    //     };
    //     const bottomWaterInstance = this.water.getWaterInstance(bottomTile);
    //     if (bottomWaterInstance && bottomWaterInstance.amount == MAX_WATER_PER_TILE) {
    //         this.dy = 0;
    //         this.split();
    //         return;
    //     };
    //     this.dy++;
    //     const result = this.water.addWaterInstance(bottomTile, this);
    //     if (!result.waterInstance && result.remove) {
    //         this.water.removeWaterInstance(this.id);
    //     };
    // };


    split() {
        if (this.amount <= 1) {
            return;
        };
        const leftTile = this.tile.getNeighbour(-1, 0);
        const leftWaterInstance = this.water.getWaterInstance(leftTile);
        const rightTile = this.tile.getNeighbour(1, 0);
        const rightWaterInstance = this.water.getWaterInstance(rightTile);
        const half = 1;//Math.floor(this.amount / 2);

        const candidateTiles = [];
        if (leftTile && !leftTile.image && (!leftWaterInstance || leftWaterInstance.amount < this.amount)) {
            candidateTiles.push({
                tile: leftTile,
                waterInstance: leftWaterInstance
            });
        };
        if (rightTile && !rightTile.image && (!rightWaterInstance || rightWaterInstance.amount < this.amount)) {
            candidateTiles.push({
                tile: rightTile,
                waterInstance: rightWaterInstance
            });
        };

        let directionIndex;
        if (!this.dx) {
            // if (this.amount <= 2) {
            //     return;
            // };
            directionIndex = Math.random() < 0.5 ? 0 : 1;
        } else {
            directionIndex = this.dx < 0 ? 0 : 1;
        };

        let nextTile;
        if (candidateTiles.length == 2) {
            nextTile = candidateTiles[directionIndex];
        } else {
            nextTile = candidateTiles[0];
        };

        if (!nextTile || nextTile.image) {
            return;
        };

        // if(!this.dx && !this.dy) return;


        this.amount -= half;
        if (nextTile.waterInstance) {
            // if (!this.dx && (nextTile.waterInstance.amount) >= this.amount) {
            //     this.amount += half;
            //     return;
            // };
            const result = this.water.addWaterInstance(nextTile.tile, null, half);
            if (!result.waterInstance) return;
            // console.log(result.waterInstance.tile.x - this.tile.x, this.dx);
            // result.waterInstance.dx = result.waterInstance.tile.x - this.tile.x;
            // result.waterInstance.dy = result.waterInstance.tile.y - this.tile.y;
            this.dx = 0;
            this.amount += result.waterInstance.amount;
            return;
        };

        const result = this.water.addWaterInstance(nextTile.tile, null, half);
        // this.dx = 0;
        // console.log(result.waterInstance.tile.x - this.tile.x, this.dx);
        result.waterInstance.dx = result.waterInstance.tile.x - this.tile.x;
        result.waterInstance.dy = result.waterInstance.tile.y - this.tile.y;
    };
};

class Water {
    constructor(room) {
        this.room = room;

        this.instances = [];

        this.initializeWaterInstances();
    };

    initializeWaterInstances() {
        for (let x = 0; x < this.room.TileMap.map.length; x++) {
            for (let y = 0; y < this.room.TileMap.map[x].length; y++) {
                const newWaterInstance = new WaterInstance(this, this.room.TileMap.map[x][y]);
                newWaterInstance.amount = y >= this.room.TileMap.map[x].length - 3 ? 0 : 0;
                this.room.TileMap.map[x][y].waterInstance = newWaterInstance
                this.instances.push(newWaterInstance);
            };
        };
    };

    getBoundaries() {
        let vertices = [];
        for (let x = -1; x < this.room.TileMap.map.length; x++) {
            for (let y = -1; y < this.room.TileMap.map[0].length; y++) {
                vertices.push(...getVertices([
                    this.room.TileMap.getTile(x, y),
                    this.room.TileMap.getTile(x + 1, y),
                    this.room.TileMap.getTile(x, y + 1),
                    this.room.TileMap.getTile(x + 1, y + 1)
                ]));
            };
        };
        return vertices;
    };

    addWaterInstance(tile) {
        if (!tile) return null;
        const waterInstance = this.getWaterInstance(tile);
        if (waterInstance) {
            waterInstance.addWater(1);
            return;
        };
        const newWaterInstance = new WaterInstance(this, tile);
        this.instances.push(newWaterInstance);
        return newWaterInstance;
    };

    // addWaterInstance(tile, existingWaterInstance, amount = 1) {
    //     const waterInstance = this.getWaterInstance(tile);
    //     if (!waterInstance) {
    //         if (existingWaterInstance) {
    //             existingWaterInstance.tile = tile;
    //             return {
    //                 waterInstance: existingWaterInstance,
    //                 flow: false,
    //                 remove: false,
    //             };
    //         } else {
    //             const newWaterInstance = new WaterInstance(this, tile, amount);
    //             this.instances.push(newWaterInstance);
    //             return {
    //                 waterInstance: newWaterInstance,
    //                 flow: false,
    //                 remove: false,
    //             };
    //         };
    //     };
    //     if (existingWaterInstance) {
    //         return {
    //             waterInstance: waterInstance.add(existingWaterInstance),
    //             flow: true,
    //             remove: true,
    //         };
    //     };
    //     return {
    //         waterInstance: waterInstance.add(new WaterInstance(this, tile, amount)),
    //         flow: true,
    //         remove: false,
    //     };
    // };

    removeWaterInstance(id) {
        return;
        this.instances = this.instances.filter((waterInstance) => waterInstance.id != id);
    };

    getWaterInstance(tile) {
        if (!tile) return null;
        return this.instances.find((waterInstance) => waterInstance.tile.x == tile.x && waterInstance.tile.y == tile.y);
    };
};
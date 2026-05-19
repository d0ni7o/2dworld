let rendered = false;

class Room {
    constructor(
        x,
        y,
        width,
        height,
        boxes = [],
        ramps = [],
        entityBoxes = [],
        doors = []
    ) {
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

        if (!pausePhysics) {
            this.rays = [];
            this.points = [];

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
                    entityBox.resetCollisions();
                    continue;
                };
                this.gravity(entityBox);

                if (entityBox.animate) {
                    if (entityBox.Ceiling.collision) entityBox.jumping = false;
                    entityBox.animate(dt);
                };

                entityBox.updatePos(dt);

                entityBox.resetCollisions();
            };
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
                    if (Physics.checkBoxBox(this.entityBoxes[j], waterCollider)) {
                        const dx = this.entityBoxes[j].x - this.entityBoxes[j].lastX;
                        const dy = this.entityBoxes[j].y - this.entityBoxes[j].lastY;

                        const waterDy = this.entityBoxes[j].y - this.water.instances[i].tile.y * tileSize;

                        this.entityBoxes[j].dx += this.water.instances[i].dx * this.water.instances[i].amount * dt * 2000;
                        this.entityBoxes[j].dy += this.water.instances[i].dy * this.water.instances[i].amount * dt * 2000;
                        this.entityBoxes[j].lastX = this.entityBoxes[j].x;
                        this.entityBoxes[j].lastY = this.entityBoxes[j].y;


                        if (this.entityBoxes[j].waterCollision) continue;
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
                        this.TileMap.optimizeColliders();
                    };
                };
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

        TestCamera.updatePos(dt);
    };

    render() {
        if (!rendered) {
            console.log(`FIRST RENDER`);
            rendered = true;
        };
        // Screen.ctx.clearRect(0, 0, Screen.main.width, Screen.main.height);
        Screen.cameraCtx.clearRect(0, 0, Screen.cameraView.width, Screen.cameraView.height);

        for (const column of this.TileMap.map) {
            for (const tile of column) {
                if (TestCamera.checkBoxRender({ x: tile.Position.x, y: tile.Position.y, width: tileSize, height: tileSize })) {
                    Screen.renderTile(TestCamera.getTileImage(tile), this.TileMap, Screen.cameraCtx);
                };
            };
        };

        Screen.renderMouse(Screen.cameraCtx);

        for (const box of this.boxes) {
            if (TestCamera.checkBoxRender(box)) {
                Screen.renderBox(TestCamera.getBoxImage(box), Screen.cameraCtx);
            };
        };
        for (const circle of this.circles) {
            Screen.renderCircle(circle);
        };
        for (const ramp of this.ramps) {
            if (TestCamera.checkRayRender(ramp)) {
                Screen.renderRay(TestCamera.getRayImage(ramp), Screen.cameraCtx);
            };
        };
        for (const entityBox of this.entityBoxes) {
            if (TestCamera.checkBoxRender(entityBox)) {
                Screen.renderEntityBox(TestCamera.getBoxImage(entityBox), Screen.cameraCtx);
            };
        };
        for (const hitbox of this.hitBoxes) {
            if (TestCamera.checkBoxRender(hitbox)) {
                Screen.renderBox(TestCamera.getBoxImage(hitbox), Screen.cameraCtx);
            };
        };
        for (const door of this.doors) {
            if (TestCamera.checkBoxRender(door)) {
                Screen.renderBox(TestCamera.getBoxImage(door), Screen.cameraCtx);
            };
        };
        // for (const character of this.characters) {
        //     Screen.renderSkeleton(character.skeleton);
        // };
        for (const character of this.characters) {
            if (TestCamera.checkBoxRender(character.skeleton.Controller)) {
                Screen.renderSkeleton(character.skeleton, Screen.cameraCtx);
            };
        };
        for (const waterInstance of this.water.instances) {
            waterInstance.updateDimensions();
            if (TestCamera.checkWaterRender(waterInstance)) {
                Screen.renderWaterInstance(TestCamera.getWaterImage(waterInstance), Screen.cameraCtx);
            };

        };
        // Screen.renderWater(this.water);
        // for (const ray of this.rays) {
        //     Screen.renderRay(ray);
        // };
        // for (const point of this.points) {
        //     Screen.renderCircle({ color: 'red', radius: 10, ...point });
        // };

        // TestCamera.updateView();
        // TestCamera.render();
    };

    gravity(entity) {
        entity.ddy += this.gForce || gForce;
    };
};
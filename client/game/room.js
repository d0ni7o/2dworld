
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

        new TileMap(this);

        this.circles = [];
        this.boxes = boxes;
        this.rays = [];
        this.points = [];
        this.ramps = [
            /* ROOM BORDERS */
            new Vector(
                -this.width / 2,
                -this.height / 2,
                (this.TileMap.map.length - 1) * (tileSize + 1 / 2) / 2,
                -this.height / 2
            ),
            new Vector(
                (this.TileMap.map.length - 1) * (tileSize + 1 / 2) / 2,
                -this.height / 2,
                (this.TileMap.map.length - 1) * (tileSize + 1 / 2) / 2,
                (this.TileMap.map[0].length - 1) * (tileSize + 1) / 2,
            ),
            new Vector(
                (this.TileMap.map.length - 1) * (tileSize + 1 / 2) / 2,
                (this.TileMap.map[0].length - 1) * (tileSize + 1) / 2,
                -this.width / 2,
                (this.TileMap.map[0].length - 1) * (tileSize + 1) / 2,
            ),
            new Vector(
                -this.width / 2,
                (this.TileMap.map[0].length - 1) * (tileSize + 1) / 2,
                -this.width / 2,
                -this.height / 2,
            ),
            ...ramps
            /**/
        ];
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
                    if(entityBox.Ceiling.collision) entityBox.jumping = false;
                    entityBox.animate(dt);
                };

                entityBox.updatePos(dt);

                entityBox.resetCollisions();
            };
            const passes = 5;
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
                            if (this.entityBoxes[i].interact && this.entityBoxes[j].attach) {
                                this.entityBoxes[j].attach(this.entityBoxes[i].skeleton);
                                return;
                            };
                            if (this.entityBoxes[j].interact && this.entityBoxes[i].attach) {
                                this.entityBoxes[i].attach(this.entityBoxes[j].skeleton);
                            };
                        };
                    };
                };
                for (let i = 0; i < this.entityBoxes.length; i++) {
                    for (let j = 0; j < this.hitBoxes.length; j++) {
                        if (Physics.checkBoxBox(this.entityBoxes[i], this.hitBoxes[j])) {
                            this.hitBoxes[j].registerHit(this.entityBoxes[i]);
                        };
                    };
                };
            };

            /** ANIMATE ? */
            // for (const entityBox of this.entityBoxes) {
            //     if (entityBox.animate) entityBox.animate(dt);
            // };
        };
    };

    render() {
        Screen.ctx.clearRect(0, 0, Screen.main.width, Screen.main.height);

        Screen.renderTileMap(this.TileMap);
        Screen.renderMouse(this.TileMap);

        for (const box of this.boxes) {
            Screen.renderBox(box);
        };
        for (const circle of this.circles) {
            Screen.renderCircle(circle);
        };
        for (const ramp of this.ramps) {
            Screen.renderRay(ramp);
        };
        for (const ray of this.rays) {
            Screen.renderRay(ray);
        };
        for (const entityBox of this.entityBoxes) {
            Screen.renderEntityBox(entityBox);
        };
        for (const hitbox of this.hitBoxes) {
            Screen.renderBox(hitbox);
        };
        TestSkeleton.bones[0].updateGeometry();
        Screen.renderSkeleton(TestSkeleton);
        for (const door of this.doors) {
            Screen.renderBox(door);
        };
        for (const point of this.points) {
            Screen.renderCircle({ color: 'red', radius: 10, ...point });
        };
    };

    gravity(entity) {
        entity.ddy += this.gForce || gForce;
    };
};
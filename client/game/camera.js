class Camera extends Box {
    constructor(Target) {
        super(Screen.cameraView.width / 2, Screen.cameraView.height / 2, Screen.cameraView.width, Screen.cameraView.height);

        this.canvas = document.createElement('canvas');
        this.canvas.width = Screen.cameraView.width;
        this.canvas.height = Screen.cameraView.height;

        this.ctx = this.canvas.getContext('2d');
    };

    setTarget(Target) {
        if (this.Target) this.Target.Camera = null;

        this.Target = Target;
        this.Target.Camera = this;
    };

    updatePos(dt) {
        super.updatePos(dt);
        if (!this.Target) return;
        if (this.Target.room.width < Screen.cameraView.width) {
            this.x = this.Target.room.x;
        } else {
            this.x = this.Target.x;
            this.x = clamp(this.x, this.Target.room.x - this.Target.room.width / 2 + Screen.cameraView.width / 2, this.Target.room.x + this.Target.room.width / 2 - Screen.cameraView.width / 2);
        };

        if (this.Target.room.height < Screen.cameraView.height) {
            this.y = this.Target.room.y;
        } else {
            this.y = this.Target.y;
            this.y = clamp(this.y, this.Target.room.y - this.Target.room.height / 2 + Screen.cameraView.height / 2, this.Target.room.y + this.Target.room.height / 2 - Screen.cameraView.height / 2);
        };
        // const dx = (this.Target.x - this.x);
        // const dy = (this.Target.y - this.y);
        // if (Math.abs(dx) < 1 / dt / 10) {
        //     this.x = this.Target.x;
        // } else {
        //     this.x += dx * dt;
        // };
        // if (Math.abs(dy) < 1 / dt / 10) {
        //     this.y = this.Target.y;
        // } else {
        //     this.y += dy * dt;
        // };
    };

    updateView() {
        const newImageData = Screen.ctx.getImageData(this.x - Screen.cameraView.width / 2, this.y - Screen.cameraView.height / 2, Screen.main.width, Screen.main.height);

        const drawing = document.createElement('canvas');
        const drawingCtx = drawing.getContext("2d");

        this.canvas.width = Screen.cameraView.width;
        this.canvas.height = Screen.cameraView.height;

        this.ctx.putImageData(newImageData, 0, 0);
    };

    render() {
        Screen.renderPng({
            x: Screen.cameraView.width / 2,
            y: Screen.cameraView.height / 2,
            width: Screen.cameraView.width,
            height: Screen.cameraView.height,
            drawing: Screen.cameraView,
        }, Screen.cameraCtx);
    };


    checkBoxRender(box) {
        // return true;
        const xCheck = (box.x - box.width / 2 <= this.x + Screen.cameraView.width / 2) && (box.x + box.width / 2 >= this.x - Screen.cameraView.width / 2);
        const yCheck = (box.y - box.height / 2 <= this.y + Screen.cameraView.height / 2) && (box.y + box.height / 2 >= this.y - Screen.cameraView.height / 2);
        // const xCheck = ((this.x - box.width / 2 - Screen.cameraView.width / 2) >= box.x) && (this.x - box.width <= box.x);
        // const yCheck = ((Screen.cameraView.height + this.y + box.height) >= box.y) && (this.y - box.height <= box.y);

        return xCheck && yCheck;
    };

    getBoxImage(box) {
        return {
            animator: box.animator,
            x: Math.floor(box.x - this.x + Screen.cameraView.width / 2),
            y: Math.floor(box.y - this.y + Screen.cameraView.height / 2),
            width: box.width,
            height: box.height,
            flipX: box.flipX,
            rotation: box.rotation,
            rotationOffsetX: box.rotationOffsetX,
            rotationOffsetY: box.rotationOffsetY,
            offsetX: Math.floor(box.offsetX),
            offsetY: Math.floor(box.offsetY),
            sides: box.sides.map(side => {
                return this.getRayImage(side);
            }),
        };
    };

    checkRayRender(ray) {
        return true;
        const xCheck = ((Screen.cameraView.width / 2 + this.x) >= ray.x) && (this.x <= ray.x);
        const yCheck = ((Screen.cameraView.height / 2 + this.y) >= ray.y) && (this.y <= ray.y);

        return xCheck && yCheck;
    };

    getRayImage(ray) {
        return {
            p0: {
                x: Math.floor(ray.p0.x - this.x + Screen.cameraView.width / 2),
                y: Math.floor(ray.p0.y - this.y + Screen.cameraView.height / 2)
            },
            p: {
                x: Math.floor(ray.p.x - this.x + Screen.cameraView.width / 2),
                y: Math.floor(ray.p.y - this.y + Screen.cameraView.height / 2)
            },
            collision: ray.collision,
            color: ray.color
        };
    };


    checkWaterRender(waterInstance) {
        return true;
        const xCheck = ((Screen.cameraView.width + this.x + waterInstance.dimensions.width) >= waterInstance.x) && (this.x - waterInstance.dimensions.width <= waterInstance.dimensions.x);
        const yCheck = ((Screen.cameraView.height + this.y + waterInstance.dimensions.height) >= waterInstance.y) && (this.y - waterInstance.dimensions.height <= waterInstance.dimensions.y);

        return xCheck && yCheck;
    };

    getWaterImage(waterInstance) {
        return {
            x: Math.floor(waterInstance.dimensions.x - this.x + Screen.cameraView.width / 2),
            y: Math.floor(waterInstance.dimensions.y - this.y + Screen.cameraView.height / 2),
            width: waterInstance.dimensions.width,
            height: waterInstance.dimensions.height,
            amount: waterInstance.amount,
            getCollider: waterInstance.getCollider.bind(waterInstance)
        };
    };

    getTileImage(tile) {
        return {
            x: Math.floor(tile.x),
            y: Math.floor(tile.y),
            Position: {
                x: Math.floor(tile.Position.x - this.x + Screen.cameraView.width / 2),
                y: Math.floor(tile.Position.y - this.y + Screen.cameraView.height / 2),
            }
        }
    };
};
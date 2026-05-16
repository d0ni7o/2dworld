
class Attack {
    constructor(Owner, dx = 0, dy = 0, hitboxes = [], durationFrames = 20) {
        this.id = getId();

        this.Owner = Owner;

        this.dx = dx;
        this.dy = dy;

        this.hitboxes = hitboxes;

        this.frame = 0;
        this.durationFrames = durationFrames;

        this.speed = 1;

        this.updateGeometry();

        for (const hitbox of this.hitboxes) {
            hitbox.box.attack = this;
        };
    };

    updateGeometry(dt) {
        for (let i = 0; i < this.hitboxes.length; i++) {
            this.hitboxes[i].box.x = this.Owner.x + Math.sign(this.dx) * this.hitboxes[i].xOffset;
            this.hitboxes[i].box.y = this.Owner.y + Math.sign(this.dy) * this.hitboxes[i].yOffset;
            this.hitboxes[i].box.updateGeometry();
        };
    }

    onStart(dt) {
        this.Owner.parent.attacking = true;
    }
    onEnd(dt) {
        this.Owner.parent.attacking = false;
    }

    onCollision(dt, entityBox) { }
};
class Swing1 extends Attack {
    constructor(Owner, dx) {
        super(
            Owner,
            dx,
            -1,
            [
                {
                    xOffset: maxAttackDist,
                    yOffset: Owner.height / 2,
                    box: new HitBox(Owner, Owner.x, Owner.y, Owner.width * 2, Owner.height * 1.5)
                }
            ],
            10
        );
    };

    updateGeometry() {
        for (let i = 0; i < this.hitboxes.length; i++) {
            this.hitboxes[i].box.x = this.Owner.x + Math.sign(this.dx) * this.hitboxes[i].xOffset;
            this.hitboxes[i].box.y = this.Owner.y + Math.sign(this.dy) * this.hitboxes[i].yOffset + 4 * this.frame;
            this.hitboxes[i].box.height = this.Owner.height + 8 * this.frame;
            this.hitboxes[i].box.updateGeometry();
        };
    }
};
class Thrust1 extends Attack {
    constructor(Owner, dx, dy = 0) {
        super(
            Owner,
            dx,
            0,
            [
                {
                    xOffset: Owner.width,
                    yOffset: 0,
                    box: new HitBox(Owner, Owner.x, Owner.y, Owner.width * 2, Owner.height / 2)
                }
            ],
            10
        );

        this.blastSpeed = 10;
    };

    updateGeometry() {
        for (let i = 0; i < this.hitboxes.length; i++) {
            this.hitboxes[i].box.x = this.Owner.x + Math.sign(this.dx) * (this.hitboxes[i].xOffset + this.frame * this.blastSpeed);
            this.hitboxes[i].box.y = this.Owner.y + Math.sign(this.dy) * this.hitboxes[i].yOffset;
            this.hitboxes[i].box.width = (this.Owner.width + this.frame * this.blastSpeed) * 2
            this.hitboxes[i].box.updateGeometry();
        };
    }
};

class SwordAttack extends Attack {
    constructor(Owner, dx) {
        super(
            Owner,
            dx,
            -1,
            [
                {
                    xOffset: 0,
                    yOffset: Owner.height,
                    box: new HitBox(Owner, Owner.x, Owner.y, Owner.width, 3 * Owner.height)
                }
            ],
            20
        );

        this.animationT = 0;
        this.lastAngleOffset = 0;
        this.maxAngleOffset = Math.PI;

        this.speed = 50;
    };

    updateGeometry(dt) {
        if (!dt) return;
        this.Owner.parent.unRotate();
        if (this.frame < (7 * this.durationFrames / 10)) {
            this.Owner.parent.rescale(this.Owner.parent.root.skeleton.ogScale + this.animationT * 4);
            this.Owner.parent.rotate(this.frame * this.maxAngleOffset / (this.durationFrames / 2));
            for (let i = 0; i < this.hitboxes.length; i++) {
                this.hitboxes[i].box.x = -2;
                this.hitboxes[i].box.y = -2;
                this.hitboxes[i].box.width = 1;
                this.hitboxes[i].box.height = 1;
                this.hitboxes[i].box.updateGeometry();
            };
            if (this.frame > (6 * this.durationFrames / 10)) {
                this.Owner.parent.physOffsetX += this.Owner.parent.dirX * dt * this.Owner.width;
                this.Owner.physOffsetX += this.Owner.parent.dirX * dt * this.Owner.width;
            };
        } else if (this.frame < (9 * this.durationFrames / 10)) {
            this.Owner.parent.rescale(this.Owner.parent.root.skeleton.ogScale + this.animationT * 4);
            this.Owner.parent.rotate(this.maxAngleOffset - (this.frame * this.maxAngleOffset / (this.durationFrames / 2)));
            this.Owner.parent.physOffsetX += this.Owner.parent.dirX * dt * this.Owner.width;
            this.Owner.physOffsetX += this.Owner.parent.dirX * dt * this.Owner.width;
            for (let i = 0; i < this.hitboxes.length; i++) {
                this.hitboxes[i].box.width = this.Owner.width;
                this.hitboxes[i].box.height = this.Owner.height * 3;
                this.hitboxes[i].box.x = this.Owner.x + Math.sign(this.dx) * this.hitboxes[i].xOffset;
                this.hitboxes[i].box.y = this.Owner.y + Math.sign(this.dy) * this.hitboxes[i].yOffset;
                this.hitboxes[i].box.updateGeometry();
            };
        } else {
            this.Owner.parent.rotate(this.maxAngleOffset - (this.frame * this.maxAngleOffset / (this.durationFrames / 2)));
            this.Owner.parent.resetScale();
            for (let i = 0; i < this.hitboxes.length; i++) {
                this.hitboxes[i].box.x = -2;
                this.hitboxes[i].box.y = -2;
                this.hitboxes[i].box.width = 1;
                this.hitboxes[i].box.height = 1;
                this.hitboxes[i].box.updateGeometry();
            };
        };

        this.animationT += dt;
    }

    onStart(dt) {
        super.onStart(dt);
        this.Owner.parent.animationT = 0;
        this.Owner.parent.unRotate();
        this.Owner.parent.animationState = 'pose';
    }

    onEnd(dt) {
        super.onEnd(dt);
        this.Owner.parent.resetScale();
        this.Owner.parent.unRotate();
        this.Owner.parent.updateGeometry();
        this.Owner.parent.skeleton.resetAnimationTime();
        this.Owner.parent.physOffsetX = 0;
        this.Owner.parent.physOffsetY = 0;
        this.Owner.physOffsetX = 0;
        this.Owner.physOffsetY = 0;
    }

    onCollision(dt, entityBox) { }
};
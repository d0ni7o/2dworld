class Bone extends EntityBox {
    constructor(
        animationSet,
        parent,
        init,
    ) {
        super(init.x || 0, init.y || 0, init.width, init.height, init.rotation || 0, init.color || 'blue');

        this.slots = [];

        this.animation = init.animation;
        this.animationT = 0;

        this.animationSet = animationSet;
        this.children = [];
        this.isBone = true;

        this.attachments = [];

        this.minRotation = init.minRotation || -2 * Math.PI;
        this.maxRotation = init.maxRotation || 2 * Math.PI;
        this.rotationOffsetX = init.rotationOffsetX || 0;
        this.rotationOffsetY = init.rotationOffsetY || 0;

        this.attachmentFirst = init.attachmentFirst;

        if (parent) {
            this.parent = parent.bone;
            this.parentX = parent.parentX;
            this.parentY = parent.parentY;
            this.childX = parent.childX;
            this.childY = parent.childY;

            this.parent.children.push(this);
        };

        this.setRoot();
    };

    setRoot() {
        this.root = this.getRoot();
    };

    getRoot() {
        if (!this.parent) return this;
        return this.parent.getRoot();
    };

    updatePos(dt) {
        super.updatePos(dt);
    };

    animate(dt) {
        if (this.animation) {
            this.animation(dt);
            this.updateGeometry();
        };

        for (const child of this.children) {
            child.animate(dt);
        };
    };

    updateGeometry() {
        // this.dirX = this.root.flipX ? -1 : 1;
        this.flipX = this.root.flipX;
        if (this.parent) {
            this.x = this.parent.x +
                (this.parentX * this.parent.width + this.childX * this.width) * Math.cos(this.parent.rotation) +
                (this.parentY * this.parent.height + this.childY * this.height) * Math.sin(this.parent.rotation);
            this.y = this.parent.y +
                (this.parentY * this.parent.height + this.childY * this.height) * Math.cos(this.parent.rotation) +
                (this.parentX * this.parent.width + this.childX * this.width) * Math.sin(this.parent.rotation);
        };

        super.updateGeometry();

        for (const child of this.children) {
            child.updateGeometry();
        };
        for (const child of this.attachments) {
            child.updateGeometry();
        };

        if (!this.parent) {
            this.skeleton.calculateSize();
        };
    };

    rotate(dR) {
        const oldRotation = this.rotation;
        this.rotation = clamp(this.rotation + dR, this.minRotation, this.maxRotation);

        for (const child of this.attachments) {
            child.rotate(this.rotation - oldRotation);
        };
    };
};

class Skeleton {
    constructor(bones) {
        this.bones = bones;

        for (const bone of this.bones) {
            bone.skeleton = this;
        };
    };

    calculateSize() {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;
        for (let i = 1; i < this.bones.length; i++) {
            if (this.bones[i].AB.p0.x < minX) {
                minX = this.bones[i].AB.p0.x;
            };
            if (this.bones[i].AB.p.x > maxX) {
                maxX = this.bones[i].AB.p.x;
            };
            if (this.bones[i].BC.p0.y < minY) {
                minY = this.bones[i].BC.p0.y;
            };
            if (this.bones[i].BC.p.y > maxY) {
                maxY = this.bones[i].BC.p.y;
            };
        };
        this.bones[0].width = maxX - minX;
        this.bones[0].height = maxY - minY;


        this.bones[0].children[0].parentX = (this.bones[0].children[0].x - minX - this.bones[0].width / 2) / this.bones[0].width;
        this.bones[0].children[0].parentY = (this.bones[0].children[0].y - minY - this.bones[0].height / 2) / this.bones[0].height;
    };

    removeBone(index) {
        this.bones.splice(index, 1);
        this.renderIndex = this.renderIndex.filter(i => i != index).map(i => i < index ? i : (i - 1));
        this.reverseRenderIndex = this.reverseRenderIndex.filter(i => i != index).map(i => i < index ? i : (i - 1));
    };
};

class HumanSkeleton extends Skeleton {
    constructor(x, y, scale) {
        const Controller = new Bone(null, null, { width: 30, height: 60, x, y });
        const Torso = new Bone(AnimationSets.Torso, {
            bone: Controller,
            parentX: 0,
            parentY: 0,
            childX: 0,
            childY: 0//-1 / 2 + 1 / 12,
        }, {
            width: 7 * scale,
            height: 8 * scale,
            x,
            y,
        });
        const Head = new Bone(AnimationSets.Head, {
            bone: Torso,
            parentX: 0,
            parentY: -1 / 2,
            childX: 0,
            childY: -1 / 2 + 3 / 11,
        }, {
            width: 8 * scale,
            height: 11 * scale,
            animation: function (dt) {
                let baseAnimationDir = -1;

                if (this.root.x - this.root.lastX == 0 || !this.root.Floor.collision) {
                    this.offsetY = 0;
                    this.animationT = 0;
                    return;
                };

                if (this.animationT >= 1 / 5 && this.animationT < 2 / 5) {
                    baseAnimationDir *= -1;
                } else if (this.animationT >= 2 / 5) {
                    this.offsetY = 0;
                    this.animationT = 0;
                    return;
                };

                this.offsetY = clamp(this.offsetY + baseAnimationDir * dt * 20, -10, 0);
                this.animationT += dt;
            },
        });
        const RightArm = new Bone(AnimationSets.RightArm, {
            bone: Torso,
            parentX: -1 / 2,
            parentY: -1 / 2,
            childX: -1 / 2 + 2 / 5,
            childY: 1 / 2,
        }, {
            width: 5 * scale,
            height: 9 * scale,
            minRotation: -Math.PI / 4,
            maxRotation: Math.PI + Math.PI / 8,
            rotationOffsetY: -1 / 2 + 2 / 7,
            attachmentFirst: true,
            animation: function (dt) {
                let baseAnimationDir = -1;

                if (this.root.jumping) {
                    this.rotate((Math.PI / 4 - this.rotation) * dt * 10);
                    return;
                };

                if (this.root.x - this.root.lastX == 0 || !this.root.Floor.collision) {
                    this.rotate(-this.rotation);
                    this.animationT = 0;
                    return;
                };

                if (this.animationT >= 0.5 / 5 && this.animationT <= 1.5 / 5) {
                    baseAnimationDir *= -1;
                } else if (this.animationT >= 2 / 5) {
                    this.rotate(-this.rotation);
                    this.animationT = 0;
                    return;
                };

                this.rotate(baseAnimationDir * dt * Math.PI / 2);
                this.animationT += dt;
            },
        });
        const LeftArm = new Bone(AnimationSets.LeftArm, {
            bone: Torso,
            parentX: 1 / 2,
            parentY: -1 / 2,
            childX: 1 / 2 - 2 / 5,
            childY: 1 / 2,
        }, {
            width: 5 * scale,
            height: 9 * scale,
            minRotation: -Math.PI / 4,
            maxRotation: Math.PI + Math.PI / 8,
            rotationOffsetY: -1 / 2 + 2 / 7,
            animation: function (dt) {
                let baseAnimationDir = 1;

                if (this.root.jumping) {
                    this.rotate((Math.PI / 4 - this.rotation) * dt * 10);
                    return;
                };

                if (this.root.x - this.root.lastX == 0 || !this.root.Floor.collision) {
                    this.rotate(-this.rotation);
                    this.animationT = 0;
                    return;
                };

                if (this.animationT >= 0.5 / 5 && this.animationT <= 1.5 / 5) {
                    baseAnimationDir *= -1;
                } else if (this.animationT >= 2 / 5) {
                    this.rotate(-this.rotation);
                    this.animationT = 0;
                    return;
                };

                this.rotate(baseAnimationDir * dt * Math.PI / 2);
                this.animationT += dt;
            },
        });
        const RightLeg = new Bone(AnimationSets.RightLeg, {
            bone: Torso,
            parentX: -1 / 2,
            parentY: 1 / 2,
            childX: -1 / 2 + 4 / 5,
            childY: 1 / 2 - 3 / 5,
        }, {
            width: 5 * scale,
            height: 5 * scale,
            animation: function (dt) {
                let baseAnimationDir = -1;

                if (this.root.x - this.root.lastX == 0 || !this.root.Floor.collision) {
                    this.offsetY = 0;
                    this.animationT = 0;
                    return;
                };

                if (this.animationT >= 1 / 10 && this.animationT < 2 / 10) {
                    baseAnimationDir *= -1;
                } else if (this.animationT >= 2 / 10) {
                    this.offsetY = 0;
                    this.animationT = 0;
                    return;
                };

                this.offsetY = clamp(this.offsetY + baseAnimationDir * dt * 20, -10, 0);
                this.animationT += dt;
            },
        });
        const LeftLeg = new Bone(AnimationSets.LeftLeg, {
            bone: Torso,
            parentX: 1 / 2,
            parentY: 1 / 2,
            childX: 1 / 2 - 4 / 5,
            childY: 1 / 2 - 3 / 5,
        }, {
            width: 5 * scale,
            height: 5 * scale,
            animation: function (dt) {
                let baseAnimationDir = -1;

                if (this.root.x - this.root.lastX == 0 || !this.root.Floor.collision) {
                    this.offsetY = 0;
                    this.animationT = 0;
                    return;
                };

                if (this.animationT < 1 / 10) {
                    this.animationT += dt;
                    return;
                };

                if (this.animationT >= 2 / 10 && this.animationT < 3 / 10) {
                    baseAnimationDir *= -1;
                } else if (this.animationT >= 4 / 10) {
                    this.offsetY = 0;
                    this.animationT = 1 / 10;
                    return;
                };

                this.offsetY = clamp(this.offsetY + baseAnimationDir * dt * 20, -10, 0);
                this.animationT += dt;
            },
        });
        super([
            Controller,
            LeftArm,
            LeftLeg,
            Torso,
            Head,
            RightLeg,
            RightArm,
        ]);

        this.Controller = Controller;
        this.LeftArm = LeftArm;
        this.LeftLeg = LeftLeg;
        this.Torso = Torso;
        this.Head = Head;
        this.RightLeg = RightLeg;
        this.RightArm = RightArm;

        this.renderIndex = [1, 2, 3, 4, 5, 6];
        this.reverseRenderIndex = [6, 5, 3, 4, 2, 1];
    };
};

// const TestSkeleton = new Skeleton([
//     Controller,
//     LeftArm,
//     LeftLeg,
//     Torso,
//     Head,
//     RightLeg,
//     RightArm,
// ]);
const TestSkeleton = new HumanSkeleton(100, 100, 4);
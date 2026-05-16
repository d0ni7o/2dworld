class Bone extends EntityBox {
    constructor(
        animationSet,
        parent,
        init,
    ) {
        super(init.x || 0, init.y || 0, init.width, init.height, init.rotation || 0, init.color || 'blue');

        this.slots = [];

        this.initParent = parent;
        this.init = init;

        this.animation = init.animation;
        this.animationStates = init.animationStates || {};
        for (const animationState of Object.keys(this.animationStates)) {
            this.animationStates[animationState] = this.animationStates[animationState].bind(this);
        };
        this.animationState = init.animationState || 'pose';
        this.animationT = 0;

        if (animationSet) {
            this.animator = new Animator(animationSet, this);
        };
        this.children = [];
        this.isBone = true;

        this.attachments = [];

        init.rotationOffsetX = init.rotationOffsetX || 0;
        init.rotationOffsetY = init.rotationOffsetY || 0;

        this.physOffsetX = 0;
        this.physOffsetY = 0;

        this.minRotation = init.minRotation || -2 * Math.PI;
        this.maxRotation = init.maxRotation || 2 * Math.PI;
        this.rotationOffsetX = init.rotationOffsetX;
        this.rotationOffsetY = init.rotationOffsetY;

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
        if (this.attacking) return;
        if (this.animation) {
            this.animation(dt);
            this.updateGeometry();
        };

        if (this.animator) this.animator.update(dt)

        for (const child of this.children) {
            child.animate(dt);
        };
    };

    updateGeometry() {
        this.dirX = this.root.flipX ? -1 : 1;
        this.flipX = this.root.flipX;
        if (this.parent) {
            /** */
            const cx = this.parent.x;
            const cy = this.parent.y;

            // const px = this.parent.x + this.physOffsetX + this.parent.offsetX + (this.parentX * this.parent.width + this.childX * this.width);
            // const py = this.parent.y + this.physOffsetY + this.parent.offsetY + (this.parentY * this.parent.height + this.childY * this.height);
            const px = this.parent.x + this.physOffsetX + (this.parentX * this.parent.width + this.childX * this.width);
            const py = this.parent.y + this.physOffsetY + (this.parentY * this.parent.height + this.childY * this.height);

            const pivotX = this.rotationOffsetX * this.width;
            const pivotY = this.rotationOffsetY * this.height;

            const pivotOffsetX = pivotX - Math.cos(-this.dirX * this.parent.rotation) * pivotX + Math.sin(-this.dirX * this.parent.rotation) * pivotY;
            const pivotOffsetY = pivotY - Math.sin(-this.dirX * this.parent.rotation) * pivotX - Math.cos(-this.dirX * this.parent.rotation) * pivotY;

            this.x = cx + Math.cos(-this.dirX * this.parent.rotation) * (px - cx) - Math.sin(-this.dirX * this.parent.rotation) * (py - cy) - pivotOffsetX;
            this.y = cy + Math.sin(-this.dirX * this.parent.rotation) * (px - cx) + Math.cos(-this.dirX * this.parent.rotation) * (py - cy) - pivotOffsetY;

            /** */
            // this.parent.root.room.points.push({
            //     x: this.x + this.rotationOffsetX * this.width,
            //     y: this.y + this.rotationOffsetY * this.height,
            //     color: 'red',
            //     radius: 2
            // });

            // this.parent.root.room.points.push({
            //     x: this.x + rX,
            //     y: this.y + rY,
            //     color: 'red',
            //     radius: 2
            // });

            // this.parent.root.room.points.push({
            //     x: cx,
            //     y: cy,
            //     color: 'orange',
            //     radius: 2
            // });
            // this.parent.root.room.points.push({
            //     x: px,
            //     y: py,
            //     color: 'blue',
            //     radius: 2
            // });
            // this.parent.root.room.points.push({
            //     x: this.x,
            //     y: this.y,
            //     color: 'green',
            //     radius: 2
            // });
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
        this.rotation = clamp(oldRotation + dR, this.minRotation, this.maxRotation);

        for (const child of this.children) {
            child.propagateRotation(this.rotation - oldRotation);
        };

        for (const child of this.attachments) {
            child.propagateRotation(this.rotation - oldRotation);
        };

        this.updateGeometry();
    };

    unRotate() {
        this.rotation = 0;
        if (this.parent) {
            this.rotation += this.parent.rotation;
        }

        for (const child of this.children) {
            child.propagateUnRotation();
        };

        for (const child of this.attachments) {
            child.propagateUnRotation();
        };
    };

    propagateRotation(dR) {
        this.minRotation += dR;
        this.maxRotation += dR;

        const oldRotation = this.rotation;
        this.rotation = clamp(oldRotation + dR, this.minRotation, this.maxRotation);

        for (const child of this.children) {
            child.propagateRotation(this.rotation - oldRotation);
        };

        for (const child of this.attachments) {
            child.propagateRotation(this.rotation - oldRotation);
        };

        this.updateGeometry();
    };

    propagateUnRotation() {
        this.rotation = 0;
        if (this.parent) {
            this.rotation += this.parent.rotation;
        }

        this.minRotation = this.init.minRotation || -2 * Math.PI;
        this.maxRotation = this.init.maxRotation || 2 * Math.PI;
        this.rotationOffsetX = this.init.rotationOffsetX || 0;
        this.rotationOffsetY = this.init.rotationOffsetY || 0;

        for (const child of this.children) {
            child.propagateUnRotation();
        };

        for (const child of this.attachments) {
            child.propagateUnRotation();
        };
    };

    getChild(match) {
        if (match(this)) return this;

        for (const attachment of this.attachments) {
            if (match(attachment)) return attachment;
        };

        for (const child of this.children) {
            const childMatch = child.getChild(match);
            if (childMatch) return childMatch;
        };

        return false;
    };

    getChildren(match) {
        const children = [];
        if (match(this)) children.push(this);

        for (const attachment of this.attachments) {
            if (match(attachment)) children.push(attachment);
        };

        for (const child of this.children) {
            children.push(...child.getChildren(match));
        };

        return children;
    };

    rescale(newScale) {
        this.width = this.width * newScale / this.scale;
        this.height = this.height * newScale / this.scale;
        this.scale = newScale;

        for (const attachment of this.attachments) {
            attachment.rescale(newScale);
        };

        for (const child of this.children) {
            child.rescale(newScale);
        };

        this.updateGeometry();
    };

    resetScale() {
        this.width = this.width * this.root.skeleton.ogScale / this.scale;
        this.height = this.height * this.root.skeleton.ogScale / this.scale;
        this.scale = this.root.skeleton.ogScale;

        for (const attachment of this.attachments) {
            attachment.rescale(this.scale);
        };
    };

    resetAnimationTime() {
        this.animationT = 0;

        for (const child of this.children) {
            child.resetAnimationTime();
        };
    };
};

class Skeleton {
    constructor(bones, scale) {
        this.bones = bones;

        for (const bone of this.bones) {
            bone.skeleton = this;
            bone.scale = scale;
        };

        this.scale = scale;
        this.ogScale = scale;
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
        this.maxX = maxX;
        this.maxY = maxY;
        this.minX = minX;
        this.minY = minY;
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

    rescale(newScale) { };

    resetAnimationTime() {
        this.bones[0].resetAnimationTime();
    };
};

let testTorsoAngle = Math.PI;
const breathingScale = 1.2;
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
            animationStates: {
                pose: function (dt) {
                    if (this.root.x - this.root.lastX == 0) {
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'idle';
                        return;
                    };

                    if (this.root.jumping) {
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'jump';
                        return;
                    };

                    this.offsetY = 0;
                    this.animationT = 0;
                },
                jump: function (dt) {
                    if (!this.root.jumping) {
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'pose';
                        this.unRotate();
                        return;
                    };

                    this.rotate(-dt * 35);
                },
                idle: function (dt) {
                    let baseAnimationDir = -1 / 10;

                    if (this.root.jumping) {
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'jump';
                        return;
                    };

                    if (this.animationT >= 1 / breathingScale && this.animationT < 2 / breathingScale) {
                        baseAnimationDir *= -1;
                    } else if (this.animationT >= 2 / breathingScale) {
                        this.offsetY = 0;
                        this.animationT = 0;
                        return;
                    };

                    this.offsetY = clamp(this.offsetY + baseAnimationDir * dt * 15, -this.height / 10, 0);
                    this.animationT += dt;
                },
            },
            animation: function (dt) {
                this.animationStates[this.animationState](dt);
            },
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
            animationStates: {
                pose: function (dt) {
                    this.offsetY = 0;
                    this.animationT = 0;

                    if (this.root.x - this.root.lastX == 0) {
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'idle';
                        return;
                    };

                    if (this.root.x - this.root.lastX != 0) {
                        this.animationState = 'walk'
                        this.offsetY = 0;
                        this.animationT = 0;
                        return;
                    };
                },
                idle: function (dt) {
                    let baseAnimationDir = -1 / 15;

                    if (!this.root.Floor.collision) {
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'pose';
                        return;
                    };

                    if (this.root.x - this.root.lastX != 0) {
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'walk'
                        return;
                    };

                    if (this.animationT >= 1 / breathingScale && this.animationT < 2 / breathingScale) {
                        baseAnimationDir *= -1;
                    } else if (this.animationT >= 2 / breathingScale) {
                        this.offsetY = 0;
                        this.animationT = 0;
                        return;
                    };

                    this.offsetY = clamp(this.offsetY + baseAnimationDir * dt * 20, -5, 0);
                    this.animationT += dt;
                },
                walk: function (dt) {
                    let baseAnimationDir = -1;

                    if (!this.root.Floor.collision) {
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'pose';
                        return;
                    };

                    if (this.root.x - this.root.lastX == 0) {
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'idle';
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
            },
            animation: function (dt) {
                this.animationStates[this.animationState](dt);
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
            animationStates: {
                idle: function (dt) {
                    let baseAnimationDir = -1 / 10;

                    if (this.root.jumping) {
                        this.unRotate();
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'jump';
                        return;
                    };

                    if (this.root.x - this.root.lastX != 0 && this.root.Floor.collision) {
                        this.unRotate();
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'walk';
                        return;
                    };

                    if (this.animationT >= 1 / breathingScale && this.animationT < 2 / breathingScale) {
                        baseAnimationDir *= -1;
                    } else if (this.animationT >= 2 / breathingScale) {
                        this.offsetY = 0;
                        this.animationT = 0;
                        return;
                    };

                    this.offsetY = clamp(this.offsetY + baseAnimationDir * dt * 20, -5, 0);
                    this.animationT += dt;
                },
                walk: function (dt) {
                    let baseAnimationDir = -1;

                    if (this.root.jumping) {
                        this.unRotate();
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'jump';
                        return;
                    };

                    if (this.root.x - this.root.lastX == 0) {
                        this.unRotate();
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'idle';
                        return;
                    };

                    if (this.animationT >= 0.5 / 5 && this.animationT <= 1.5 / 5) {
                        baseAnimationDir *= -1;
                    } else if (this.animationT >= 2 / 5) {
                        this.unRotate();
                        this.animationT = 0;
                        return;
                    };

                    this.rotate(baseAnimationDir * dt * Math.PI / 2);
                    this.animationT += dt;
                },
                jump: function (dt) {
                    if (!this.root.jumping) {
                        this.unRotate();
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'idle';
                        return;
                    };

                    this.rotate((Math.PI / 4 - this.rotation) * dt * 10);
                },
                pose: function (dt) {
                    this.offsetY = 0;
                    this.animationT = 0;
                    this.unRotate();

                    if (this.root.jumping) {
                        this.unRotate();
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'jump';
                        return;
                    };

                    if (this.root.x - this.root.lastX == 0) {
                        this.unRotate();
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'idle';
                        return;
                    };

                    if (this.root.x - this.root.lastX != 0 && this.root.Floor.collision) {
                        this.unRotate();
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'walk';
                        return;
                    };
                },
            },
            animation: function (dt) {
                this.animationStates[this.animationState](dt);
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
            animationStates: {
                idle: function (dt) {
                    let baseAnimationDir = -1 / 10;

                    if (this.root.jumping) {
                        this.unRotate();
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'jump';
                        return;
                    };

                    if (this.root.x - this.root.lastX != 0 && this.root.Floor.collision) {
                        this.unRotate();
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'walk';
                        return;
                    };

                    if (this.animationT >= 1 / breathingScale && this.animationT < 2 / breathingScale) {
                        baseAnimationDir *= -1;
                    } else if (this.animationT >= 2 / breathingScale) {
                        this.offsetY = 0;
                        this.animationT = 0;
                        return;
                    };

                    this.offsetY = clamp(this.offsetY + baseAnimationDir * dt * 20, -5, 0);
                    this.animationT += dt;
                },
                walk: function (dt) {
                    let baseAnimationDir = 1;

                    if (this.root.jumping) {
                        this.unRotate();
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'jump';
                        return;
                    };

                    if (this.root.x - this.root.lastX == 0) {
                        this.unRotate();
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'idle';
                        return;
                    };

                    if (this.animationT >= 0.5 / 5 && this.animationT <= 1.5 / 5) {
                        baseAnimationDir *= -1;
                    } else if (this.animationT >= 2 / 5) {
                        this.unRotate();
                        this.animationT = 0;
                        return;
                    };

                    this.rotate(baseAnimationDir * dt * Math.PI / 2);
                    this.animationT += dt;
                },
                jump: function (dt) {
                    if (!this.root.jumping) {
                        this.unRotate();
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'idle';
                        return;
                    };

                    this.rotate((Math.PI / 4 - this.rotation) * dt * 10);
                },
                pose: function (dt) {
                    this.offsetY = 0;
                    this.animationT = 0;
                    this.unRotate();

                    if (this.root.jumping) {
                        this.unRotate();
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'jump';
                        return;
                    };

                    if (this.root.x - this.root.lastX == 0) {
                        this.unRotate();
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'idle';
                        return;
                    };

                    if (this.root.x - this.root.lastX != 0 && this.root.Floor.collision) {
                        this.unRotate();
                        this.offsetY = 0;
                        this.animationT = 0;
                        this.animationState = 'walk';
                        return;
                    };
                },
            },
            animation: function (dt) {
                this.animationStates[this.animationState](dt);
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
                    this.parentY = this.initParent.parentY;
                    return;
                };

                if (this.animationT >= 1 / 10 && this.animationT < 2 / 10) {
                    baseAnimationDir *= -1;
                } else if (this.animationT >= 2 / 10) {
                    this.offsetY = 0;
                    this.animationT = 0;
                    this.parentY = this.initParent.parentY;
                    return;
                };

                this.offsetY = clamp(this.offsetY + baseAnimationDir * dt * 20, -10, 0);
                this.parentY = this.parentY + baseAnimationDir * dt;
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
                    this.parentY = this.initParent.parentY;
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
                    this.parentY = this.initParent.parentY;
                    return;
                };

                this.offsetY = clamp(this.offsetY + baseAnimationDir * dt * 20, -10, 0);
                this.parentY = this.parentY + baseAnimationDir * dt;
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
        ], scale);

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

class HumanInventorySkeleton extends HumanSkeleton {
    constructor(x, y, scale) {
        super(x, y, scale);

        this.Head.initParent.parentY = - 1 / 2;
        this.Head.initParent.childY = -1 / 2;

        this.RightArm.initParent.parentX = -1 / 2;
        this.RightArm.initParent.childX = -1 / 2;

        this.LeftArm.initParent.parentX = 1 / 2;
        this.LeftArm.initParent.childX = 1 / 2;

        this.RightLeg.initParent.parentX = -1 / 2;
        this.RightLeg.initParent.parentY = 1 / 2;
        this.RightLeg.initParent.childY = 1 / 2;

        this.LeftLeg.initParent.parentX = 1 / 2;
        this.LeftLeg.initParent.parentY = 1 / 2;
        this.LeftLeg.initParent.childY = 1 / 2;

        this.Head.parentY = - 1 / 2;
        this.Head.childY = -11 / 20;
        this.RightArm.parentX = -1 / 2;
        this.RightArm.childX = -3 / 4;
        this.LeftArm.parentX = 1 / 2;
        this.LeftArm.childX = 3 / 4;
        this.RightLeg.parentX = - 3 / this.RightLeg.parent.width;
        this.RightLeg.parentY = 1 / 2;
        this.RightLeg.childX = -1 / 2;
        this.RightLeg.childY = 1;
        this.LeftLeg.parentX = 3 / this.RightLeg.parent.width;
        this.LeftLeg.parentY = 1 / 2;
        this.LeftLeg.childX = 1 / 2;
        this.LeftLeg.childY = 1;

        this.Head.animator.setAnimation('closeEyes');

        this.Slots = {
            LeftArm: [
                {
                    parentX: 1,
                    parentY: 0,
                },
                {
                    parentX: 0,
                    parentY: -1,
                },
                {
                    parentX: 0,
                    parentY: 0,
                }
            ],
            RightArm: [
                {
                    parentX: -1,
                    parentY: 0,
                },
                {
                    parentX: 0,
                    parentY: -1,
                },
                {
                    parentX: 0,
                    parentY: 0,
                }
            ],
            Head: [
                {
                    parentX: 0,
                    parentY: -1
                },
                {
                    parentX: 0,
                    parentY: 0,
                }
            ],
            Torso: [
                {
                    parentX: 0,
                    parentY: 0,
                }
            ],
            RightLeg: [
                {
                    parentX: -1,
                    parentY: 0,
                },
                {
                    parentX: 0,
                    parentY: 0,
                }
            ],
            LeftLeg: [
                {
                    parentX: 1,
                    parentY: 0,
                },
                {
                    parentX: 0,
                    parentY: 0,
                }
            ]
        }
    };

    handleInventoryInput() {
        if (!this.selectedSlot && !this.targetSlot) {
            return;
        };

        if (!this.selectedSlot) {
            this.selectedSlot = this.targetSlot?.item ? this.targetSlot : null;
            return;
        };
        if (!this.selectedSlot.item || this.selectedSlot.item.parent?.attacking) {
            this.selectedSlot = null;
            return;
        };


        const dropItem = !this.targetSlot;
        if (dropItem) {
            this.selectedSlot.item.unRotate();
            if (this.selectedSlot.item.currentInventorySlot) {
                this.selectedSlot.item.currentInventorySlot.item = null;
                this.selectedSlot.item.currentInventorySlot.inventory.character.skeleton.Controller.room.entityBoxes.push(this.selectedSlot.item);
                this.selectedSlot.item.x = this.selectedSlot.item.currentInventorySlot.inventory.character.skeleton.Controller.x;
                this.selectedSlot.item.y = this.selectedSlot.item.currentInventorySlot.inventory.character.skeleton.Controller.y;
                this.selectedSlot.item.currentInventorySlot = null;
                this.selectedSlot.item.updateGeometry();
            } else {
                this.selectedSlot.item.parent.skeleton.Controller.room.entityBoxes.push(this.selectedSlot.item);
                this.selectedSlot.item.x = this.selectedSlot.item.parent.skeleton.Controller.x;
                this.selectedSlot.item.y = this.selectedSlot.item.parent.skeleton.Controller.y;
                this.selectedSlot.item.updateGeometry();
                this.selectedSlot.item.detach();
            };

            if (this.selectedSlot.item.skeleton) {
                Player.entityBox.room.characters.push(this.selectedSlot.item.skeleton.character);
            };
            // this.selectedSlot.item.flipX = false;
            this.selectedSlot = null;

            return;
        };

        const sameSlot = this.targetSlot.name == this.selectedSlot.name
        if (sameSlot) {
            this.selectedSlot = null;
            return;
        };

        const equipItem = this.selectedSlot.item && this.targetSlot.isBone;
        if (equipItem) {
            const ogParent = this.selectedSlot.item.parent;
            this.selectedSlot.item.detach();
            if (this.selectedSlot.item.attach(this.targetSlot.slot.skeleton, this.targetSlot.slot.id)) {
                if (this.selectedSlot.item.currentInventorySlot) {
                    this.selectedSlot.item.currentInventorySlot.item = null;
                    this.selectedSlot.item.currentInventorySlot = null;
                };
            } else {
                if (ogParent) {
                    this.selectedSlot.item.attach(this.targetSlot.slot.skeleton, ogParent.id);
                };
            };
            this.selectedSlot = null;
            return;
        };

        const moveItem = this.selectedSlot.item && !this.targetSlot.isBone;
        if (moveItem) {
            if (this.targetSlot.slot.item) {
                return;
            };
            this.selectedSlot.item.detach();
            this.targetSlot.slot.add(this.selectedSlot.item);
            this.selectedSlot = null;
            return;
        };

        this.selectedSlot = null;

        return;
    };
};

const CONTEXT_MENU = {
    name: 'CONTEXT_MENU_NAME',
    options: [],
    render: false,
    target: null,
    select: (option) => {
        CONTEXT_MENU.render = false;
        option.callback();
    },
    range: 100,
};

const ITEM_INVENTORY = {
    name: 'ITEM_INVENTORY',
    target: null,
    render: false,
    open: function (target) {
        ITEM_INVENTORY.target = target;
        ITEM_INVENTORY.render = true;
    },
    close: function () {
        ITEM_INVENTORY.render = false;
        ITEM_INVENTORY.target = null;
    },
    range: 100,
};

class ChestSkeleton extends Skeleton {
    constructor(x, y, scale) {
        const Controller = new Bone(AnimationSets.Chest, null, {
            width: 9 * scale,
            height: 11 * scale,
            x,
            y
        });
        const Chest = new Bone(AnimationSets.Chest, {
            bone: Controller,
            parentX: 0,
            parentY: 0,
            childX: 0,
            childY: 0//-1 / 2 + 1 / 12,
        }, {
            width: 9 * scale,
            height: 11 * scale,
            animation: function (dt) { }
        });
        super([
            Controller,
            Chest
        ], scale);

        this.Controller = Controller;
        this.Chest = Chest;

        this.renderIndex = [1];

        const ogResetCollisions = this.Controller.resetCollisions.bind(this.Controller);
        this.Controller.resetCollisions = () => {
            ogResetCollisions();
            // this.Controller.waterCollision = false;
            this.Controller.interact = this.Chest.open;
        };

        this.Controller.attach = (skeleton) => {
            // console.log(`ATTACH CHEST??`, this);
            if (!CONTEXT_MENU.render) {
                CONTEXT_MENU.target = Controller;
                CONTEXT_MENU.render = true;
                CONTEXT_MENU.options = [];
                // if (Chest.open && !ITEM_INVENTORY.render) {
                //     CONTEXT_MENU.options.push({
                //         name: 'Look',
                //         callback: () => {
                //             ITEM_INVENTORY.open(Controller);
                //         }
                //     });
                // };
                CONTEXT_MENU.options.push(...[
                    {
                        name: Chest.open ? 'Close' : 'Open', callback: () => {
                            Chest.open = !Chest.open;
                            if (Chest.open && !ITEM_INVENTORY.render) {
                                ITEM_INVENTORY.open(Controller);
                            } else if (!Chest.open && ITEM_INVENTORY.render) {
                                ITEM_INVENTORY.close();
                            };
                        }
                    },
                    {
                        name: 'Take', callback: () => {
                            if (skeleton.character.pickup(Controller)) {
                                Chest.open = false;
                                if (!Chest.open && ITEM_INVENTORY.render) {
                                    ITEM_INVENTORY.close();
                                };
                                skeleton.Controller.room.characters = skeleton.Controller.room.characters.filter(({ id }) => id != Controller.skeleton.character.id);
                            };
                        }
                    }
                ]);
            };
        };

        this.Controller.detach = (skeleton) => { };
    };
};
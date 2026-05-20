import { Bone, Skeleton } from "../skeleton.js";
import { AnimationSets } from "../../animation.js";
import { Punch } from "../../attacks/attacks.js";
import { clamp } from "../../../utils/utils.js";

let testTorsoAngle = Math.PI;
const breathingScale = 1.2;
export class HumanSkeleton extends Skeleton {
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
            meleeAttacks: [Punch],
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
            meleeAttacks: [Punch],
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

export class HumanInventorySkeleton extends HumanSkeleton {
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

    handleInventoryInput(Input) {
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

        console.log(Input, this.selectedSlot, this.targetSlot);

        const dropItem = !this.targetSlot;
        if (dropItem) {
            this.selectedSlot.item.unRotate();
            if (this.selectedSlot.item.currentInventorySlot) {
                this.selectedSlot.item.currentInventorySlot.item = null;
                if (this.selectedSlot.item.currentInventorySlot.inventory.character.skeleton) {
                    this.selectedSlot.item.currentInventorySlot.inventory.character.skeleton.Controller.room.entityBoxes.push(this.selectedSlot.item);
                    this.selectedSlot.item.x = this.selectedSlot.item.currentInventorySlot.inventory.character.skeleton.Controller.x;
                    this.selectedSlot.item.y = this.selectedSlot.item.currentInventorySlot.inventory.character.skeleton.Controller.y;
                } else {
                    Input.Player.entityBox.room.entityBoxes.push(this.selectedSlot.item);
                    this.selectedSlot.item.x = Input.Player.entityBox.x;
                    this.selectedSlot.item.y = Input.Player.entityBox.y;
                };
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
                Input.Player.entityBox.room.characters.push(this.selectedSlot.item.skeleton.character);
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
                if (!this.targetSlot.slot.add(this.selectedSlot.slot.item)) {
                    return;
                } else {
                    this.selectedSlot = null;
                    return;
                };
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
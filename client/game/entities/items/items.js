import { EntityBox } from "../entities.js";
import { AnimationSets } from "../../animation/animation.js";
import { SwordAttack } from "../../animation/attacks/attacks.js";
import { Animator } from "../../animation/animation.js";
import { clamp } from "../../utils/utils.js";

export class Attachment extends EntityBox {
    constructor(scale, name, animationSet, init) {
        super(init.x || 0, init.y || 0, init.width * scale, init.height * scale, init.rotation || 0, init.color || 'blue');

        this.init = init;

        this.scale = scale;
        this.ogScale = scale;

        this.attached = false;

        this.animation = init.animation;
        this.animationT = 0;

        this.name = name;
        this.animator = new Animator(animationSet, this);

        this.isBone = true;

        this.attachments = [];

        this.minRotation = init.minRotation || -2 * Math.PI;
        this.maxRotation = init.maxRotation || 2 * Math.PI;
        this.rotationOffsetX = init.rotationOffsetX || 0;
        this.rotationOffsetY = init.rotationOffsetY || 0;

        this.attachmentOrder = init.attachmentOrder || 0;

        this.weaponAttacks = init.weaponAttacks;

        if (init.interactable) {
            this.interactable = init.interactable.bind(this);
        };

        if (ITEM[this.name].init.onUse) {
            this.onUse = ITEM[this.name].init.onUse.bind(this);
        };

        this.stack = 1;
        this.stackedInstances = [];
    };

    setParent(parent) {
        if (this.attached) return;
        this.attached = true;

        this.parent = parent.bone;
        this.parentX = parent.parentX;
        this.parentY = parent.parentY;
        this.childX = parent.childX;
        this.childY = parent.childY;

        this.parent.attachments.push(this);
        this.parent.attachments = this.parent.attachments.sort((a, b) => {
            return b.attachmentDef.slots[0] - a.attachmentDef.slots[0];
        });

        this.parent.root.room.entityBoxes = this.parent.root.room.entityBoxes.filter(({ id }) => this.id != id);
    };

    attach(skeleton, targetBoneId) {
        const skeletonName = skeleton.constructor.name;
        skeleton.bones[0].unRotate();
        this.unRotate();

        // console.log(`ATTACH`, this, targetBoneId);

        if (ITEM[this.name].init.attachment) {
            for (const attachmentDef of ITEM[this.name].init.attachment[skeletonName] || []) {
                const bone = skeleton[attachmentDef.bone];
                if (targetBoneId && bone.id != targetBoneId) continue;
                const occupied = bone.slots.some(slot => attachmentDef.slots.includes(slot));
                if (!occupied) {
                    this.attachmentOrder = attachmentDef.attachmentOrder || 0;
                    bone.slots.push(...attachmentDef.slots);
                    this.attachmentDef = attachmentDef;
                    this.setParent({
                        bone,
                        parentX: attachmentDef.parentX || 0,
                        parentY: attachmentDef.parentY || 0,
                        childX: attachmentDef.childX,
                        childY: attachmentDef.childY,
                    });
                    this.rescale(skeleton.scale);
                    return true;
                };
            };
        };

        if (targetBoneId) return;
        skeleton.character.pickup(this);
    };

    detach() {
        if (!this.attached) return;
        this.attached = false;
        this.parent.slots = this.parent.slots.filter(slot => !this.attachmentDef.slots.includes(slot));
        this.parent.attachments = this.parent.attachments.filter(({ id }) => id != this.id);
        this.parent = null;
        this.resetScale();
    };

    updateGeometry() {
        if (this.parent) {
            this.dirX = this.parent.root.flipX ? -1 : 1;
            this.flipX = this.parent.root.flipX;

            const cx = this.parent.x + this.parent.rotationOffsetX * this.parent.width;
            const cy = this.parent.y + this.parent.rotationOffsetY * this.parent.height;

            const px = this.parent.x + this.parent.offsetX + this.dirX * (this.parentX * this.parent.width + this.childX * this.width);
            const py = this.parent.y + this.parent.offsetY + (this.parentY * this.parent.height + this.childY * this.height);

            this.x = cx + Math.cos(-this.dirX * this.rotation) * (px - cx) - Math.sin(-this.dirX * this.rotation) * (py - cy);
            this.y = cy + Math.sin(-this.dirX * this.rotation) * (px - cx) + Math.cos(-this.dirX * this.rotation) * (py - cy);
        };

        super.updateGeometry();

        for (const child of this.attachments) {
            child.updateGeometry();
        };
    };

    rotate(dR) {
        this.rotation = clamp(this.rotation + dR, this.minRotation, this.maxRotation);

        for (const child of this.attachments) {
            child.rotate(dR);
        };
    };

    unRotate() {
        this.rotation = 0;

        for (const child of this.attachments) {
            child.unRotate();
        };
    };

    propagateRotation(dR) {
        this.minRotation += dR;
        this.maxRotation += dR;

        const oldRotation = this.rotation;
        this.rotation = clamp(oldRotation + dR, this.minRotation, this.maxRotation);

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

        for (const child of this.attachments) {
            child.propagateUnRotation();
        };
    };

    rescale(newScale) {
        this.width *= newScale / this.scale;
        this.height *= newScale / this.scale;
        this.scale = newScale;
    };

    resetScale() {
        this.width *= this.ogScale / this.scale;
        this.height *= this.ogScale / this.scale;
        this.scale = this.ogScale;
    };
};

class ItemDefinition {
    constructor(name, animationSet, init) {
        this.animationSet = animationSet;
        this.init = init;
    };
};

const ITEM = {
    Wood: new ItemDefinition('Wood', AnimationSets.Wood, {
        scale: 2,
        width: 18,
        height: 7,
        maxStack: 16
    }),
    Meat: new ItemDefinition('Meat', AnimationSets.Meat, {
        scale: 2,
        width: 19,
        height: 9,
        maxStack: 16,
        onUse: function (character) {
            this.stack--;
            if(this.cooked) {
                character.Stats.Hp.update(60);
            } else {
                character.Stats.Hp.update(-10);
            };
            if (this.stack <= 0) {
                this.currentInventorySlot.item = null;
                character.skeleton.Controller.room.entityBoxes = character.skeleton.Controller.room.entityBoxes.filter(({ id }) => id != this.id);
                character.inventory.removeItem(this.id);
            } else {
                this.stackedInstances = this.stackedInstances.slice(1);
            };
        },
    }),
    Apple: new ItemDefinition('Apple', AnimationSets.Apple, {
        scale: 2,
        width: 14,
        height: 14,
        maxStack: 16,
        onUse: function (character) {
            this.stack--;
            character.Stats.Hp.update(20);
            if (this.stack <= 0) {
                this.currentInventorySlot.item = null;
                character.skeleton.Controller.room.entityBoxes = character.skeleton.Controller.room.entityBoxes.filter(({ id }) => id != this.id);
                character.inventory.removeItem(this.id);
            } else {
                this.stackedInstances = this.stackedInstances.slice(1);
            };
        },
    }),
    Sword: new ItemDefinition('Sword', AnimationSets.Sword, {
        width: 27,
        height: 11,
        attachment: {
            "HumanSkeleton": [
                {
                    attachmentOrder: -1,
                    slots: [0],
                    bone: 'RightArm',
                    parentX: 0,
                    parentY: 1 / 2 - 3 / 9,
                    childX: 1 / 2 - 4 / 27,
                    childY: 0
                },
                {
                    attachmentOrder: 1,
                    slots: [0],
                    bone: 'LeftArm',
                    parentX: 0,
                    parentY: 1 / 2 - 3 / 9,
                    childX: 1 / 2 - 4 / 27,
                    childY: 0,
                },
            ]
        },
        weaponAttacks: [
            SwordAttack
        ]
    }),
    Mask: new ItemDefinition('Mask', AnimationSets.Mask, {
        width: 8,
        height: 11,
        attachment: {
            "HumanSkeleton": [
                {
                    slots: [1],
                    bone: 'Head',
                    parentX: 0,
                    parentY: 0,
                    childX: 0,
                    childY: 0,
                },
            ]
        }
    }),
    Helm: new ItemDefinition('Helm', AnimationSets.Helm, {
        width: 14,
        height: 9,
        attachment: {
            "HumanSkeleton": [
                {
                    slots: [0],
                    bone: 'Head',
                    parentX: 0,
                    parentY: -1 / 2,
                    childX: 0,
                    childY: -1 / 2 + 5 / 9
                },
            ]
        }
    }),
    Shirt: new ItemDefinition('Shirt', AnimationSets.Shirt, {
        width: 7,
        height: 8,
        attachment: {
            "HumanSkeleton": [
                {
                    slots: [0],
                    bone: 'Torso',
                    parentX: 0,
                    parentY: 0,
                    childX: 0,
                    childY: 0
                },
            ]
        }
    }),
    Gloves: new ItemDefinition('Gloves', AnimationSets.Gloves, {
        width: 7,
        height: 8,
        minRotation: -Math.PI / 4,
        maxRotation: Math.PI + Math.PI / 8,
        rotationOffsetY: 0,
        attachment: {
            "HumanSkeleton": [
                {
                    slots: [1],
                    bone: 'RightArm',
                    parentX: 0,
                    parentY: -1 / 2,
                    childX: 0,
                    childY: 1 / 2 - 1 / 8
                },
                {
                    slots: [1],
                    bone: 'LeftArm',
                    parentX: 0,
                    parentY: -1 / 2,
                    childX: 0,
                    childY: 1 / 2 - 1 / 8
                },
            ]
        }
    })
};

export const spawnItem = function (name, x, y, room) {
    const itemDef = ITEM[name];
    if (!itemDef) return;
    const newItem = new Attachment(itemDef.init.scale || 4, name, itemDef.animationSet, {
        x,
        y,
        width: itemDef.init.width,
        height: itemDef.init.height,
        weaponAttacks: itemDef.init.weaponAttacks || null,
        scale: itemDef.init.scale,
        maxStack: itemDef.init.maxStack
    });
    if(room) room.addGeometry('entityBox', newItem);
    return newItem;
};


const scale = 4;
class Attachment extends EntityBox {
    constructor(name, animationSet, init) {
        super(init.x || 0, init.y || 0, init.width * scale, init.height * scale, init.rotation || 0, init.color || 'blue');

        this.attached = false;

        this.animation = init.animation;
        this.animationT = 0;

        this.name = name;
        this.animationSet = animationSet;
        this.isBone = true;

        this.attachments = [];

        this.minRotation = init.minRotation || -2 * Math.PI;
        this.maxRotation = init.maxRotation || 2 * Math.PI;
        this.rotationOffsetX = init.rotationOffsetX || 0;
        this.rotationOffsetY = init.rotationOffsetY || 0;

        this.attachmentOrder = init.attachmentOrder || 0;
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

        this.parent.root.room.entityBoxes = this.parent.root.room.entityBoxes.filter(({ id }) => this.id != id);
    };

    attach(skeleton) {
        const skeletonName = skeleton.constructor.name;
        const itemDef = ITEM[this.name];
        
        for (const attachmentDef of itemDef.init.attachment[skeletonName]) {
            const bone = skeleton[attachmentDef.bone];
            const occupied = bone.slots.some(slot => attachmentDef.slots.includes(slot));
            if(!occupied) {
                this.setParent({
                    bone,
                    parentX: attachmentDef.parentX || 0,
                    parentY: attachmentDef.parentY || 0,
                    childX: attachmentDef.childX,
                    childY: attachmentDef.childY,
                });
                this.attachmentOrder = attachmentDef.attachmentOrder || 0;
                bone.slots.push(...attachmentDef.slots);
                return;
            };
        };
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
};

class ItemDefinition {
    constructor(name, animationSet, init) {
        this.animationSet = animationSet;
        this.init = init;
    };
};

const ITEM = {
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
        }
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
    }),
};

const spawnItem = function (name, x, y) {
    const itemDef = ITEM[name];
    if (!itemDef) return;
    const newItem = new Attachment(name, itemDef.animationSet, {
        x,
        y,
        width: itemDef.init.width,
        height: itemDef.init.height,
    });
    Player.entityBox.room.entityBoxes.push(newItem);
    return newItem;
};
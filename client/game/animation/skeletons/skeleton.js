import { EntityBox } from "../../entities/entities.js";
import { AnimationSets, Animator } from "../animation.js";
import { clamp, getId } from "../../utils/utils.js";
import { Punch } from "../attacks/attacks.js";
import { CONTEXT_MENU } from "../../ui/context_menu.js";
import { ITEM_INVENTORY } from "../../ui/item_inventory.js";

export class Bone extends EntityBox {
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

        this.meleeAttacks = init.meleeAttacks;

        if (parent) {
            this.parent = parent.bone;
            this.parentX = parent.parentX;
            this.parentY = parent.parentY;
            this.childX = parent.childX;
            this.childY = parent.childY;

            this.parent.children.push(this);
        };

        this.unaffectSize = init.unaffectSize;

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

            if (this.mirrorX && this.parent && this.parent.id != this.root.id) {
                this.parentX = this.initParent.parentX * this.dirX;
                this.childX = this.initParent.childX * this.dirX;
            };

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

export class Skeleton {
    constructor(bones, scale) {
        this.id = getId()
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
            if (this.bones[i].unaffectSize) continue;
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

        this.renderSize = this.getRenderSize();
    };

    getRenderSize() {
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
        return { 
            width: maxX - minX, 
            height: maxY - minY 
        };
    };

    removeBone(index, bone) {
        this.bones.splice(index, 1);
        this.renderIndex = this.renderIndex.filter(i => i != index).map(i => i < index ? i : (i - 1));
        this.reverseRenderIndex = this.reverseRenderIndex.filter(i => i != index).map(i => i < index ? i : (i - 1));

        if(bone && bone.parent) {
            bone.parent.children = bone.parent.children.filter(({ id }) => id != bone.id);
        };
    };

    rescale(newScale) { };

    resetAnimationTime() {
        this.bones[0].resetAnimationTime();
    };
};
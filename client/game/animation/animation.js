import { startLoading, stopLoading } from "../utils/utils.js";
import { AssetManager } from "../asset-manager/asset-manager.js";

const DEFAULT_ANIMATION_THRESHOLD_S = 0.15;

class AnimationSet {
    constructor(imageSource, name, animations) {
        this.imageSource = imageSource;
        this.name = name;
        this.animations = animations?.animations;
        if (animations?.updateState) {
            this.updateState = animations.updateState;
        } else {
            this.updateState = () => { };
        };
    };

    async load() {
        console.log(`LOAD`, this);
        this.image = await AssetManager.loadImage(this.name, this.imageSource);
        await this.loadAnimations();
    };

    async loadAnimations() {
        if (!this.animations) return;
        this.Animation = {};
        for (const animation of Object.keys(this.animations)) {
            console.log(`LOAD ANIMATION ${this.name}_${animation}`);
            if (this.animations[animation].parentAnimation) {
                this.Animation[animation] = {
                    canvas: this.Animation[this.animations[animation].parentAnimation].canvas,
                    frameData: this.Animation[this.animations[animation].parentAnimation].frameData.filter((frame, index) => this.animations[animation].parentAnimationFrames.includes(index))
                };
                console.log(`LOADED PARENT ANIMATION ${this.name}_${animation}`);
                continue;
            };

            const imageNames = await AssetManager.getFolderContent(this.animations[animation].path);
            const images = [];
            for (let i = 0; i < imageNames.length; i++) {
                const imageId = `${this.animations[animation].path}/${imageNames[i]}`;
                const image = await AssetManager.loadImage(imageId, `./${imageId}`, true);
                images.push(image);
            };
            this.Animation[animation] = await AssetManager.getSpritesheet(`${this.name}_${animation}`, images);
            console.log(`LOADED ANIMATION ${this.name}_${animation}`);
            // this.Animation[animation].images = images;
        };
    };
};

export class Animator {
    constructor(animationSet, bone) {
        this.currentFrame = 0;
        this.prevFrame = this.currentFrame;
        this.speed = 1;
        this.counter = 0;

        this.animationSet = animationSet;
        this.image = animationSet.image;
        this.bone = bone;

        if (!animationSet.updateState) {
            this.update = () => { };
        } else {
            this.updateState = animationSet.updateState;
        }

        this.setupImageCanvas();
    };

    setupImageCanvas() {
        if (this.animationSet.updateState && this.animationSet.Animation?.pose) {
            this.imageCanvas = document.createElement('canvas');
            this.imageCanvas.width = this.animationSet.Animation.pose.frameData[0].width;
            this.imageCanvas.height = this.animationSet.Animation.pose.frameData[0].height;

            this.imageCtx = this.imageCanvas.getContext('2d');
            this.animationSet.Animation.pose.frameData[0].getImage(this.animationSet.Animation.pose.canvas, this.imageCtx);
            this.image = this.imageCanvas;

            this.setAnimation('pose');
        };
    };

    setAnimation(name) {
        this.currentAnimationName = name;
        this.currentAnimation = this.animationSet.Animation[name];
        this.currentFrame = 0;

        this.updateImage();
    };

    update(dt) {
        this.prevFrame = this.currentFrame;
        this.counter += dt * this.speed;
        if (this.counter >= DEFAULT_ANIMATION_THRESHOLD_S) {
            this.counter = 0;
            this.currentFrame = (this.currentFrame + 1) % (this.currentAnimation?.frameData.length || 1);

            this.updateImage();
        };

        this.updateState(this, dt);
    };

    updateImage() {
        if (!this.currentAnimation) return;
        this.currentAnimation.frameData[this.currentFrame].getImage(this.currentAnimation.canvas, this.imageCtx);
    };
}

export const AnimationSets = {
    Chest: new AnimationSet('./assets/animations/Chest/base/chest_0001.png', 'Chest', {
        animations: {
            base: { path: 'assets/animations/Chest/base' },
            pose: { parentAnimation: 'base', parentAnimationFrames: [0] },
            open: { parentAnimation: 'base', parentAnimationFrames: [1] },
        },
        updateState: (animator, dt) => {
            switch (animator.currentAnimationName) {
                case 'base':
                    animator.setAnimation('pose');
                    break;
                case 'open':
                    if (!animator.bone.open) {
                        animator.setAnimation('pose');
                    };
                    break;
                case 'pose':
                default:
                    if (animator.bone.open) {
                        animator.setAnimation('open');
                    };
                    break;
            };
        }
    }),
    Human: new AnimationSet('./assets/human_male.png', 'Human'),
    Head: new AnimationSet('./assets/head.png', 'Head', {
        animations: {
            blink: { path: 'assets/animations/Human_Head/blink' },
            pose: { parentAnimation: 'blink', parentAnimationFrames: [0] },
            closeEyes: { parentAnimation: 'blink', parentAnimationFrames: [6] },
        },
        updateState: (animator, dt) => {
            switch (animator.currentAnimationName) {
                case 'blink':
                    if (animator.bone.root.Ceiling.collision || (!animator.bone.root.jumping && !animator.bone.root.Floor.collision)) {
                        animator.setAnimation('closeEyes');
                    } else if (animator.currentFrame == (animator.currentAnimation.frameData.length - 2)) {
                        animator.setAnimation('pose');
                    };
                    break;
                case 'closeEyes':
                    if (!animator.bone.root.Ceiling.collision && !(!animator.bone.root.jumping && !animator.bone.root.Floor.collision)) {
                        animator.setAnimation('pose');
                    };
                    break;
                case 'pose':
                default:
                    if (animator.bone.root.Ceiling.collision || (!animator.bone.root.jumping && !animator.bone.root.Floor.collision)) {
                        animator.setAnimation('closeEyes');
                    } else if (Math.random() < dt) {
                        animator.setAnimation('blink');
                    };
                    break;
            };
        },
    }),
    Torso: new AnimationSet('./assets/torso.png', 'Torso'),
    LeftArm: new AnimationSet('./assets/left_arm.png', 'LeftArm'),
    LeftLeg: new AnimationSet('./assets/left_leg.png', 'LeftLeg'),
    RightArm: new AnimationSet('./assets/right_arm.png', 'RightArm'),
    RightLeg: new AnimationSet('./assets/right_leg.png', 'RightLeg'),
    Sword: new AnimationSet('./assets/sword.png', 'Sword'),
    Mask: new AnimationSet('./assets/mask.png', 'Mask'),
    Shirt: new AnimationSet('./assets/shirt.png', 'Shirt'),
    Helm: new AnimationSet('./assets/helm.png', 'Helm'),
    Gloves: new AnimationSet('./assets/gloves.png', 'Gloves'),
    Apple: new AnimationSet('./assets/apple.png', 'Apple'),
};

export const loadAnimationSets = async function () {
    startLoading('ANIMATION SETS');
    for (const animationSet of Object.values(AnimationSets)) {
        await animationSet.load();
    };
    stopLoading('ANIMATION SETS');
};
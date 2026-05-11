class AnimationSet {
    constructor(imageSource, name) {
        this.imageSource = imageSource;
        this.name = name;
    };

    async load() {
        console.log(`LOAD`, this);
        this.image = await AssetManager.loadImage(this.name, this.imageSource);
        
        // const canvas = document.createElement('canvas');
        // canvas.width = this.sourceImage.width;
        // canvas.height = this.sourceImage.height;
        // const ctx = canvas.getContext('2d');
        // ctx.drawImage(this.sourceImage, 0, 0);

        // this.image = canvas;

        // document.getElementById('images').appendChild(this.image);
    };
};

class HitBox extends Box {
    constructor(Owner, x, y, width = 10, height = 10, rotation, color) {
        super(x, y, width, height, rotation, color);

        this.Owner = Owner;
        this.targets = [];
    };

    registerHit(newTarget) {
        if (newTarget.id == this.Owner.id) return;
        if (!this.targets.some(target => target.id == newTarget.id)) {
            this.targets.push(newTarget);
        };
        this.collision = true;
    };
};

const collisionSideOrder = [0, 2, 1, 3];
const entityBoxDirectionOffsets = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
];
class EntityBox extends Box {
    constructor(x, y, width = 10, height = 10, rotation, color) {
        super(x, y, width, height, rotation, color, false);

        this.airResistanceX = 0;
        this.airResistanceY = 0.99;

        this.Floor = new Vector(x, y, x, y + height, 'green');
        this.Ceiling = new Vector(x, y, x, y - height, 'green');
        this.Left = new Vector(x, y, x - width, y, 'green');
        this.Right = new Vector(x, y, x + width, y, 'green');

        this.directions = [this.Floor, this.Left, this.Ceiling, this.Right];

        this.attacks = [];
    };

    updatePos(dt) {
        super.updatePos(dt);

        this.doorCooldown += dt;

        for (let i = 0; i < this.attacks.length; i++) {
            const attack = this.attacks[i];
            if (attack.frame == 0) {
                this.room.hitBoxes.push(...attack.hitboxes.map(({ box }) => box));
            };
            attack.updateGeometry(dt);
            attack.frame++;
            if (attack.durationFrames == attack.frame) {
                this.room.hitBoxes = this.room.hitBoxes.filter(box => !attack.hitboxes.some(hitbox => hitbox.box.id == box.id));
                this.attacks = this.attacks.filter(checkAttack => {
                    if (checkAttack.id != attack.id) return true;
                    i--;
                    return false;
                });
            };
        };

        if(this.y - this.lastY >= 0) {
            this.jumping = false;
        };
    }

    updateGeometry() {
        super.updateGeometry();

        this.Floor.p0.x = this.x;
        this.Floor.p0.y = this.y;
        this.Floor.p.x = this.x;
        this.Floor.p.y = this.y + this.height;

        this.Ceiling.p0.x = this.x;
        this.Ceiling.p0.y = this.y;
        this.Ceiling.p.x = this.x;
        this.Ceiling.p.y = this.y - this.height;

        this.Left.p0.x = this.x;
        this.Left.p0.y = this.y;
        this.Left.p.x = this.x - this.width;
        this.Left.p.y = this.y;

        this.Right.p0.x = this.x;
        this.Right.p0.y = this.y;
        this.Right.p.x = this.x + this.width;
        this.Right.p.y = this.y;

        this.directions = [this.Floor, this.Left, this.Ceiling, this.Right];
    };

    resetCollisions() {
        this.Floor.collision = false;
        this.Ceiling.collision = false;
        this.Left.collision = false;
        this.Right.collision = false;
    };
};


const AnimationSets = {
    Human: new AnimationSet('./assets/human_male.png', 'Human'),
    Head: new AnimationSet('./assets/head.png', 'Head'),
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
};

const loadAnimationSets = async function () {
    loading++;
    for (animationSet of Object.values(AnimationSets)) {
        await animationSet.load();
    };
    loading--;
};
loadAnimationSets();
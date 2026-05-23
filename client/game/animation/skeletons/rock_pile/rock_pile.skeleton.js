import { Bone, Skeleton } from "../skeleton.js";
import { AnimationSets } from "../../animation.js";
import { spawnItem } from "../../../entities/items/items.js";

const baseRock = {
    width: 18,
    height: 12
};

export class RockPileSkeleton extends Skeleton {
    constructor(x, y, scale) {
        const Controller = new Bone(null, null, {
            width: baseRock.width,
            height: baseRock.height,
            x,
            y
        });

        const Rock = new Bone(AnimationSets.Rock, {
            bone: Controller,
            parentX: 0,
            parentY: 0,
            childX: 0,
            childY: 0
        }, {
            x,
            y,
            width: baseRock.width * scale,
            height: baseRock.height * scale
        });

        const Rock1 = new Bone(AnimationSets.Rock, {
            bone: Rock,
            parentX: 1 / 3,
            parentY: 1 / 2,
            childX: 0,
            childY: 0
        }, {
            width: baseRock.width * scale,
            height: baseRock.height * scale
        });

        const Rock2 = new Bone(AnimationSets.Rock, {
            bone: Rock,
            parentX: -1 / 3,
            parentY: 1 / 2,
            childX: 0,
            childY: 0
        }, {
            width: baseRock.width * scale,
            height: baseRock.height * scale
        });

        const bones = [
            Controller,
            Rock,
            Rock1,
            Rock2
        ];

        super(bones);

        this.Controller = Controller;

        this.renderIndex = [1, 2, 3];
        this.reverseRenderIndex = [];

        let destroyRocks = [Rock1, Rock2].sort((a, b) => Math.random() - 0.5);
        destroyRocks.push(Rock);

        let hitCounter = 0;


        Controller.onAttackCollision = ((attack) => {
            if (!destroyRocks.length) return;
            hitCounter++;
            if (!(hitCounter % 3)) {
                hitCounter = 0;
                let destroyRockIndex = -1;
                for (let i = 0; i < bones.length; i++) {
                    if (bones[i].id == destroyRocks[0].id) {
                        destroyRockIndex = i;
                        break;
                    };
                };
                Controller.room.addGeometry('entityBox', spawnItem('Rock', Controller.x, Controller.y), true);
                if (destroyRocks.length == 1) {
                    this.character.die();
                } else {
                    this.removeBone(destroyRockIndex, destroyRocks[0]);
                    destroyRocks = destroyRocks.slice(1);
                };
            };
        }).bind(this);
    };
};
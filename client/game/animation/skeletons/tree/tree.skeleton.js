import { Bone, Skeleton } from "../skeleton.js";
import { AnimationSets } from "../../animation.js";
import { clamp, randomInt } from "../../../utils/utils.js";
import { Physics } from "../../../physics/physics.js";

const baseTrunk = {
    width: 14,
    height: 17,
    scale: 4
};
const baseBranch = {
    width: 7,
    height: 1,
    scale: 4
};
const baseLeaves = {
    width: 13,
    height: 13,
    scale: 4
};



const onCollision = function (dt, entityBox) {
    if (entityBox.skeleton && entityBox.skeleton.constructor.name == 'TreeSkeleton') return;
    Physics.checkEntityBoxBox2(dt, entityBox, this);
};

export class TreeSkeleton extends Skeleton {
    constructor(x, y, scale) {
        const Controller = new Bone(null, null, {
            width: baseTrunk.width * scale,
            height: baseTrunk.height * scale,
            x,
            y
        });

        const BaseTrunk = new Bone(AnimationSets.Trunk, {
            bone: Controller,
            parentX: 0,
            parentY: 0,
            childX: 0,
            childY: 0//-1 / 2 + 1 / 12,
        }, {
            width: baseTrunk.width * scale,
            height: baseTrunk.height * scale,
            animation: function (dt) { }
        });

        const Trunks = [];

        for (let i = 0; i < randomInt(12, 4); i++) {
            Trunks.push(new Bone(AnimationSets.Trunk, {
                bone: !i ? BaseTrunk : Trunks[i - 1],
                parentX: 0,
                parentY: -1 / 2,
                childX: 0,
                childY: -1 / 2//-1 / 2 + 1 / 12,
            }, {
                width: baseTrunk.width * scale,
                height: randomInt(2 * baseTrunk.height, baseTrunk.height) * scale,
                animation: function (dt) { }
            }));
        };

        const Branches = [];

        for (let i = 0; i < Trunks.length; i++) {
            let lastBranchLeft = null;
            let lastBranchRight = null;
            for (let j = 0; j < randomInt(12, 3); j++) {
                const branchLeft = new Bone(AnimationSets.Branch, {
                    bone: lastBranchLeft ? lastBranchLeft : Trunks[i],
                    parentX: -1 / 2,
                    parentY: 0,
                    childX: 0,
                    childY: 0//-1 / 2 + 1 / 12,
                }, {
                    width: baseBranch.width * scale,
                    height: baseBranch.height * scale,
                    unaffectSize: true,
                    animation: function (dt) { }
                });
                const branchRight = new Bone(AnimationSets.Branch, {
                    bone: lastBranchRight ? lastBranchRight : Trunks[i],
                    parentX: 1 / 2,
                    parentY: 0,
                    childX: 0,
                    childY: 0//-1 / 2 + 1 / 12,
                }, {
                    width: baseBranch.width * scale,
                    height: baseBranch.height * scale,
                    unaffectSize: true,
                    animation: function (dt) { }
                });

                branchLeft.onCollision = onCollision.bind(branchLeft);
                branchRight.onCollision = onCollision.bind(branchRight);

                Branches.push(branchLeft);
                Branches.push(branchRight);

                lastBranchLeft = branchLeft;
                lastBranchRight = branchRight;
            };
        };

        const Leaves = [];
        for (let i = 0; i < Branches.length; i++) {
            // if (Branches[i].children.length) continue;
            Leaves.push(new Bone(AnimationSets.Leaves, {
                bone: Branches[i],
                parentX: (1 / 2) * Math.sign(Branches[i].parentX),
                parentY: (1 / 2) * Math.sign(Math.random() - 0.5),
                childX: 0,
                childY: (1 / 4) * Math.sign(Math.random() - 0.5)
            }, {
                width: baseLeaves.width * scale,
                height: baseLeaves.height * scale,
                unaffectSize: true,
            }));
        };

        super([
            Controller,
            BaseTrunk,
            ...Trunks,
            ...Branches,
            ...Leaves
        ]);

        this.Controller = Controller;
        this.BaseTrunk = BaseTrunk;

        this.renderIndex = [1];
        for (let i = 0; i < (Trunks.length + Branches.length + Leaves.length); i++) {
            this.renderIndex.push(i + 2);
        };

        this.addEntityBoxes = Branches;
    };
}
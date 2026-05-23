import { Bone, Skeleton } from "../skeleton.js";
import { AnimationSets } from "../../animation.js";
import { clamp, randomEl, randomInt } from "../../../utils/utils.js";
import { Physics } from "../../../physics/physics.js";
import { Vector } from "../../../physics/geometry.js";
import { tileSize } from "../../../world/tilemap/tilemap.js";
import { spawnItem } from "../../../entities/items/items.js";

const baseTrunk = {
    width: 14,
    height: 17 * 2,
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

class BranchCollider extends Vector {
    constructor(branch, width, x0, y0, x1, y1) {
        super(x0, y0, x1, y1);

        this.branch = branch;
        this.width = width;
    };

    updateGeometry() {
        this.p0.x = this.branch.x - this.width / 2;
        this.p0.y = this.branch.y;
        this.p.x = this.branch.x + this.width / 2;
        this.p.y = this.branch.y;
    };
}

class BranchController extends Bone {
    constructor(animationSet, parent, init) {
        super(animationSet, parent, init);

        this.Colliders = [];
    };

    updateGeometry() {
        super.updateGeometry();


        for (const branchCollider of this.Colliders) {
            branchCollider.updateGeometry();
            branchCollider.collisionCondition = ((entity) => {
                if (entity.skeleton?.constructor.name == 'TreeSkeleton') return false;
                return true;
            }).bind(branchCollider);
        };
    };
};

export class TreeSkeleton extends Skeleton {
    constructor(x, y, scale) {
        const Controller = new BranchController(null, null, {
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

        for (let i = 0; i < randomInt(4, 1); i++) {
            Trunks.push(new Bone(AnimationSets.Trunk, {
                bone: !i ? BaseTrunk : Trunks[i - 1],
                parentX: 0,
                parentY: -1 / 2 + 1 / tileSize,
                childX: 0,
                childY: -1 / 2//-1 / 2 + 1 / 12,
            }, {
                width: baseTrunk.width * scale,
                height: baseTrunk.height * scale,
                animation: function (dt) { }
            }));
        };

        const Branches = [];

        const BranchCollisionData = [];

        for (let i = 0; i < Trunks.length; i++) {
            let lastBranchLeft = null;
            let lastBranchRight = null;
            let firstBranchLeft = null;
            let firstBranchRight = null;
            const branchN = (2 * randomInt(Math.max(1, -Math.pow(i - Math.floor(Trunks.length / 2), 2) + 4), 1) - 1);
            const leftCenterIndex = Branches.length + 2 * Math.floor(branchN / 2);
            const rightCenterIndex = Branches.length + 1 + 2 * Math.floor(branchN / 2);

            for (let j = 0; j < branchN; j++) {
                const branchLeft = new Bone(AnimationSets.Branch, {
                    bone: lastBranchLeft ? lastBranchLeft : Trunks[i],
                    parentX: lastBranchLeft ? -1 : (-1 / 2),
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
                    parentX: lastBranchRight ? 1 : (1 / 2),
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

                if (!lastBranchLeft) firstBranchLeft = branchLeft;
                if (!lastBranchRight) firstBranchRight = branchRight;

                lastBranchLeft = branchLeft;
                lastBranchRight = branchRight;
            };

            BranchCollisionData.push({
                centerBranch: Branches[leftCenterIndex],
                lastBranchLeft: lastBranchLeft,
                firstBranchLeft: firstBranchLeft
            });

            BranchCollisionData.push({
                centerBranch: Branches[rightCenterIndex],
                lastBranchLeft: lastBranchLeft,
                firstBranchLeft: firstBranchLeft
            });
            // const colliderWidth = Math.abs(lastBranchLeft.p0.x - firstBranchLeft.p.x);
            // Controller.Colliders.push(
            //     new BranchCollider(Branches[leftCenterIndex], colliderWidth)
            // );
            // Controller.Colliders.push(
            //     new BranchCollider(Branches[rightCenterIndex], colliderWidth)
            // );
        };

        const Leaves = [];
        const leavedBranchIndices = [];
        for (let i = 0; i < Branches.length; i++) {
            // if (Branches[i].children.length) continue;
            // if(Math.floor(i / 2) % 2) continue;
            leavedBranchIndices.push(i);
        };
        for (let i = 0; i < leavedBranchIndices.length; i++) {
            let childY = 0;
            if ((Math.floor(i / 2)) % 2) {
                childY = 1 / 2;
                Leaves.push(new Bone(AnimationSets.Leaves, {
                    bone: Branches[leavedBranchIndices[i]],
                    parentX: (1 / 2) * Math.sign(Branches[leavedBranchIndices[i]].parentX),
                    parentY: 0,
                    childX: 0,
                    childY: -childY
                }, {
                    width: baseLeaves.width * scale,
                    height: baseLeaves.height * scale,
                    unaffectSize: true,
                }));
            };
            Leaves.push(new Bone(AnimationSets.Leaves, {
                bone: Branches[leavedBranchIndices[i]],
                parentX: (1 / 2) * Math.sign(Branches[leavedBranchIndices[i]].parentX),
                parentY: 0,
                childX: 0,
                childY
            }, {
                width: baseLeaves.width * scale,
                height: baseLeaves.height * scale,
                unaffectSize: true,
            }));
        };
        for (let i = 0; i < Leaves.length; i++) {
            Leaves[i].isLeaf = true;
        };

        const bones = [
            Controller,
            BaseTrunk,
            ...Trunks,
            ...Branches,
            ...Leaves
        ];

        super(bones);

        this.Controller = Controller;
        this.BaseTrunk = BaseTrunk;
        this.Trunks = Trunks;
        this.Branches = Branches;
        this.Leaves = Leaves;

        this.renderIndex = [1];
        this.reverseRenderIndex = [];
        for (let i = 0; i < (Trunks.length + Branches.length + Leaves.length); i++) {
            this.renderIndex.push(i + 2);
        };

        Controller.noWaterCollision = true;

        Controller.updateGeometry();

        for (let i = 0; i < BranchCollisionData.length; i++) {
            const leftX = BranchCollisionData[i].lastBranchLeft.x - BranchCollisionData[i].lastBranchLeft.width / 2;
            const rightX = BranchCollisionData[i].firstBranchLeft.x + BranchCollisionData[i].firstBranchLeft.width / 2;
            const colliderWidth = Math.abs(leftX - rightX);
            const Collider = new BranchCollider(BranchCollisionData[i].centerBranch, colliderWidth);
            Collider.updateGeometry();
            Controller.Colliders.push(Collider);
        };

        Controller.onAttackCollision = ((attack) => {
            const randomBranch = randomEl(this.Branches.filter(branch => branch.children.some(child => child.isLeaf)));
            if (!randomBranch) return;

            if (Math.random() < 0.5) {
                let itemName;
                if (Math.random() < 0.05) {
                    itemName = 'Apple';
                } else {
                    itemName = 'Wood';
                };
                Controller.room.addGeometry('entityBox', spawnItem(itemName, randomBranch.x, randomBranch.y), true);
            };
            const randomLeaf = randomEl(randomBranch.children.filter(child => child.isLeaf));
            let randomLeafIndex = -1;
            for (let i = 0; i < bones.length; i++) {
                if (bones[i].id == randomLeaf.id) {
                    randomLeafIndex = i;
                    break;
                };
            };
            if (randomLeafIndex > -1) this.removeBone(randomLeafIndex, randomLeaf);
        }).bind(this);
    };

    onAddGeometry(room) {
        for (let i = 0; i < this.Controller.Colliders.length; i++) {
            room.addGeometry('ramp', this.Controller.Colliders[i], true);
        };
    };
}
import { Bone, Skeleton } from "../skeleton.js";
import { AnimationSets } from "../../animation.js";
import { clamp } from "../../../utils/utils.js";

export class RabbitSkeleton extends Skeleton {
    constructor(x, y, scale) {
        const Controller = new Bone(null, null, { width: 30, height: 60, x, y });
        const Torso = new Bone(AnimationSets.RabbitTorso, {
            bone: Controller,
            parentX: 0,
            parentY: 0,
            childX: 0,
            childY: 0//-1 / 2 + 1 / 12,
        }, {
            width: 12 * scale,
            height: 10 * scale,
            x,
            y,
        });
        const Head = new Bone(AnimationSets.RabbitHead, {
            bone: Torso,
            parentX: 3 / 12,
            parentY: - 7 / 10,
            childX:  0,
            childY: 0,
        }, {
            width: 15 * scale,
            height: 19 * scale,
        });
        const Tail = new Bone(AnimationSets.RabbitTail, {
            bone: Torso,
            parentX: -5/12,
            parentY: -4/10,
            childX: 0,
            childY: 0,
        }, {
            width: 4 * scale,
            height: 4 * scale,
        });
        super([
            Controller,
            Torso,
            Head,
            Tail
        ], scale);

        this.Controller = Controller;
        this.Torso = Torso;
        this.Head = Head;
        this.Tail = Tail;

        this.renderIndex = [1, 2, 3];
        this.reverseRenderIndex = [1, 2, 3];
    };
};
import { CampfireSkeleton } from "./campfire.skeleton.js";

export class CampfireInventorySkeleton extends CampfireSkeleton {
    constructor(x, y, scale) {
        super(x, y, scale);

        this.Slots = {
            Fire: [
                {
                    parentX: 1,
                    parentY: 0,
                },
            ],
            Campfire: [
                {
                    parentX: -1,
                    parentY: 0,
                },
            ]
        };

        this.Craft = {
            bone: 'Fire',
            parentX: 0,
            parentY: 0,
        };
    };
};
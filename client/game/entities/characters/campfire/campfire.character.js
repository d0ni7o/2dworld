import { Character, Inventory } from "../character.js";
import { CampfireSkeleton } from "../../../animation/skeletons/campfire/campfire.skeleton.js";

export class Campfire extends Character {
    constructor(x, y, scale = 2) {
        super(new CampfireSkeleton(x, y, scale));

        this.inventory = new Inventory(this, 1);
    };
};
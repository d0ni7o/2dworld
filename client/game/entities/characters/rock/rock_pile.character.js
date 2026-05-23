import { Character, Inventory } from "../character.js";
import { RockPileSkeleton } from "../../../animation/skeletons/rock_pile/rock_pile.skeleton.js";

export class RockPile extends Character {
    constructor(x, y, scale = 2) {
        super(new RockPileSkeleton(x, y, scale));

        this.inventory = new Inventory(this, 1);
    };
};
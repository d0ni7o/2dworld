import { Character } from "../character.js";
import { ChestSkeleton } from "../../../animation/skeletons/chest/chest.skeleton.js";

export class Chest extends Character {
    constructor(x, y, scale) {
        super(new ChestSkeleton(x, y, scale));
    };
};
import { Character, Inventory } from "../character.js";
import { TreeSkeleton } from "../../../animation/skeletons/tree/tree.skeleton.js";

export class Tree extends Character {
    constructor(x, y, scale = 4) {
        super(new TreeSkeleton(x, y, scale));
    };
};
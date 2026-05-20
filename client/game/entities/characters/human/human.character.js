import { Character } from "../character.js";
import { HumanSkeleton } from "../../../animation/skeletons/human/human.skeleton.js";
import { CharacterStats } from "../../stats/stats.js";

export class Human extends Character {
    constructor(x, y, scale) {
        super(new HumanSkeleton(x, y, scale));

        new CharacterStats(this);
    };
};
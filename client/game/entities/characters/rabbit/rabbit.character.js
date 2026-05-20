import { Character } from "../character.js";
import { RabbitSkeleton } from "../../../animation/skeletons/rabbit/rabbit.skeleton.js";
import { CharacterStats } from "../../stats/stats.js";
import { spawnItem } from "../../items/items.js";
import { randomInt } from "../../../utils/utils.js";

export class Rabbit extends Character {
    constructor(x, y, scale) {
        super(new RabbitSkeleton(x, y, scale));

        new CharacterStats(this);

        for (let i = 0; i < randomInt(3, 1); i++) {
            this.inventory.add(spawnItem('Meat', x, y));
        };
    };
};
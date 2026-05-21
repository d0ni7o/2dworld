import { AnimationSets } from "../animation/animation.js";
import { Campfire } from "./characters/campfire/campfire.character.js";
import { Inventory } from "./characters/character.js";

export class Recipe {
    constructor(name, builder, input, output, init = {}) {
        this.input = input;
        this.output = output;

        this.builder = builder;

        this.craftT = 0;
        this.maxCraftT = init.maxCraftT || 1;

        this.inventory = new Inventory(this, input.length + output.length);

        const recipeItems = [...output, ...input];

        for (let i = 0; i < this.inventory.slots.length; i++) {
            this.inventory.slots[i].requiredItem = (item) => {
                return item.animator.animationSet.name == recipeItems[i];
            };
            this.inventory.slots[i].stackable = false;
            this.inventory.slots[i].backgroundAnimationSet = AnimationSets[recipeItems[i]];
        };

        this.inventory.slots.reverse();
    };
};

export const Recpies = {
    Campfire: new Recipe('Campfire', (x, y) => new Campfire(x, y).skeleton.Controller, ['Wood', 'Wood'], ['Campfire']),
};
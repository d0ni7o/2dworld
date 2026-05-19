import { getId } from "../../utils/utils.js";
import { HumanSkeleton, ChestSkeleton } from "../../animation/skeletons/skeleton.js";
import { CharacterStats } from "../stats/stats.js";

class InventorySlot {
    constructor(inventory) {
        this.item = null;
        this.id = getId();
        this.inventory = inventory;
    };

    add(item) {
        if (this.item) return false;
        if (item.currentInventorySlot) {
            item.currentInventorySlot.item = null;
        };
        this.item = item;
        item.currentInventorySlot = this;
        return true;
    };
};

export class Inventory {
    constructor(character, slots = 10) {
        this.character = character;

        this.slots = new Array(slots).fill(0).map(_ => new InventorySlot(this));
    };

    add(item) {
        for (const slot of this.slots) {
            if (slot.add(item)) return true;
        };

        return false;
    };

    removeItem(id) {
        for(let i = 0; i < this.slots.length; i++) {
            if(this.slots[i].item && this.slots[i].item.id == id) {
                this.slots[i].item = null;
                break;
            };
        };
    };
};

class Character {
    constructor(skeleton) {
        this.id = getId();
        this.skeleton = skeleton;
        this.skeleton.character = this;
        this.inventory = new Inventory(this);

        this.Stats = {};
    };

    pickup(item) {
        if (this.inventory.add(item)) {
            this.skeleton.Controller.room.entityBoxes = this.skeleton.Controller.room.entityBoxes.filter(({ id }) => id != item.id);
            return true;
        };
        return false;
    };
};

export class Human extends Character {
    constructor(x, y, scale) {
        super(new HumanSkeleton(x, y, scale));

        new CharacterStats(this);
    };
};

export class Chest extends Character {
    constructor(x, y, scale) {
        super(new ChestSkeleton(x, y, scale));
    }
}
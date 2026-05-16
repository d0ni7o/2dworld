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

class Inventory {
    constructor(character) {
        this.character = character;

        this.slots = new Array(10).fill(0).map(_ => new InventorySlot(this));
    };

    add(item) {
        for (const slot of this.slots) {
            if (slot.add(item)) return true;
        };

        return false;
    };
};

class Character {
    constructor(skeleton) {
        this.id = getId();
        this.skeleton = skeleton;
        this.skeleton.character = this;
        this.inventory = new Inventory(this);
    };

    pickup(item) {
        if (this.inventory.add(item)) {
            this.skeleton.Controller.room.entityBoxes = this.skeleton.Controller.room.entityBoxes.filter(({ id }) => id != item.id);
            return true;
        };
        return false;
    };
};

class Human extends Character {
    constructor(x, y, scale) {
        super(new HumanSkeleton(x, y, scale));
    };
};

class Chest extends Character {
    constructor(x, y, scale) {
        super(new ChestSkeleton(x, y, scale));
    }
}
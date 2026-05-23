import { getId } from "../../utils/utils.js";
import { spawnItem } from "../items/items.js";

export class InventorySlot {
    constructor(inventory) {
        this.item = null;
        this.id = getId();
        this.inventory = inventory;
        this.stackable = true;
    };

    add(item) {
        if (this.requiredItem && !this.requiredItem(item)) return;
        if (this.item) {
            if (this.item.isStackable && this.item.isStackable(item) && this.stackable) {
                this.item.stack += item.stack;
                this.item.stackedInstances.push(...[item, ...item.stackedInstances]);
                if (item.currentInventorySlot) {
                    item.currentInventorySlot.item = null;
                };
                item.currentInventorySlot = this;
                item.stack = 1;
                item.stackedInstances = [];
                return true;
            };
            return false;
        };

        if (!this.stackable && item.stack > 1) {
            this.item = item.stackedInstances[0];
            this.item.stack = 1;
            this.item.stackedInstances = [];
            this.item.currentInventorySlot = this;

            item.stackedInstances = item.stackedInstances.slice(1);
            item.stack--;
            return false;
        } else {
            if (item.currentInventorySlot) {
                item.currentInventorySlot.item = null;
            };
            this.item = item;
            item.currentInventorySlot = this;
            return true;
        };
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
        for (let i = 0; i < this.slots.length; i++) {
            if (this.slots[i].item && this.slots[i].item.id == id) {
                /** ENTITY POOL */
                this.slots[i].item = null;
                break;
            };
        };
    };

    isFull(item) {
        for (let i = 0; i < this.slots.length; i++) {
            if(!this.slots[i].item) return false;
            if(this.slots[i].item.isStackable && this.slots[i].item.isStackable(item)) return false;
        };
        return true;
    };
};

export const baseMovementForce = 300;
export const baseJumpForce = 700;

export class Character {
    constructor(skeleton) {
        this.id = getId();
        this.skeleton = skeleton;
        this.skeleton.character = this;
        this.inventory = new Inventory(this);

        this.Stats = {};
        this.statNames = [];
    };

    update(dt) {
        for(const statName of this.statNames) {
            this.Stats[statName].tick(dt);
        };

        this.craft(dt);
    };

    startCraft(recipe) {
        for (let i = 0; i < recipe.input.length; i++) {
            if (!recipe.inventory.slots[i].item) return;
        };
        for (let i = 0; i < recipe.output.length; i++) {
            if (recipe.inventory.slots[i + recipe.input.length].item) return;
        };

        this.craftT = 0;
        this.craftingRecipe = recipe;
        this.crafting = true;
    };

    craft(dt) {
        if (this.crafting) {
            this.craftT += dt;
            if (this.craftT >= this.craftingRecipe.maxCraftT) {
                for (let i = 0; i < this.craftingRecipe.input.length; i++) {
                    const craftingResult = this.craftingRecipe.builder(
                        this.skeleton.Controller.x,
                        this.skeleton.Controller.y
                    );
                    /** ENTITY POOL */
                    this.craftingRecipe.inventory.slots[i].item = null;
                };
                for (let i = 0; i < this.craftingRecipe.output.length; i++) {
                    const craftingResult = this.craftingRecipe.builder(
                        this.skeleton.Controller.x,
                        this.skeleton.Controller.y
                    );
                    craftingResult.room = this.skeleton.Controller.room;
                    this.craftingRecipe.inventory.slots[i + this.craftingRecipe.input.length].add(craftingResult);
                };

                this.craftT = 0;
                this.crafting = false;
                this.craftingRecipe = null;
            };
        }
    };

    pickup(item) {
        if (this.inventory.add(item)) {
            // this.skeleton.Controller.room.entityBoxes = this.skeleton.Controller.room.entityBoxes.filter(({ id }) => id != item.id);
            this.skeleton.Controller.room.removeEntityBox(item);
            return true;
        };
        return false;
    };

    use(item) {
        if (item.onUse) {
            item.onUse(this, item);
        };
    };

    isMoving() {
        return !this.walking && (this.movingDown || this.movingLeft || this.movingRight);
    };

    moveLeft(state) {
        if (state) {
            this.skeleton.Controller.dx = 0;
            this.skeleton.Controller.dx -= baseMovementForce * this.Stats.MovementSpeed.currentValue;
            this.skeleton.Controller.flipX = true;
            this.movingLeft = true;
        } else {
            this.skeleton.Controller.dx = 0;
            this.movingLeft = false;
        };
    };

    moveRight(state) {
        if (state) {
            this.skeleton.Controller.dx = 0;
            this.skeleton.Controller.dx += baseMovementForce * this.Stats.MovementSpeed.currentValue;
            this.skeleton.Controller.flipX = false;
            this.movingRight = true;
        } else {
            this.skeleton.Controller.dx = 0;
            this.movingRight = false;
        }
    };

    moveDown(state) {
        if (state) {
            if (this.skeleton.Controller.waterCollision) {
                this.movingDown = true;
                this.skeleton.Controller.dy += this.Stats.Jump.currentValue * baseJumpForce / 50;
            };
        } else {
            this.movingDown = false;
        };
    };

    jump() {
        if (this.Stats.Stamina.currentValue <= 10) return;
        if (this.skeleton.Controller.Floor.collision && !this.skeleton.Controller.Ceiling.collision) {
            if (!this.skeleton.Controller.jumping) {
                this.Stats.Stamina.update(-10);
            };
            this.skeleton.Controller.dy -= this.Stats.Jump.currentValue * baseJumpForce;
            this.skeleton.Controller.jumping = true;
        };
        if (this.skeleton.Controller.waterCollision) {
            this.skeleton.Controller.dy -= this.Stats.Jump.currentValue * baseJumpForce / 50;
        };
    };

    interact(state) {
        this.skeleton.Controller.interact = state;
    };

    crouch(state) {
        if (state) {
            if (!this.skeleton.Controller.crouch) {
                this.skeleton.Controller.crouch = true;
                this.skeleton.Controller.height /= 2;
                this.skeleton.Controller.y += this.skeleton.Controller.height / 2;
                this.skeleton.Controller.updateGeometry();
            };
        } else {
            this.skeleton.Controller.crouch = false;
            this.skeleton.Controller.height *= 2;
            this.skeleton.Controller.updateGeometry();
        };
    };

    walk(state) {
        if (state) {
            this.walking = true;
            this.Stats.MovementSpeed.currentValue = this.Stats.MovementSpeed.max / 2;
        } else {
            this.walking = false;
            this.Stats.MovementSpeed.currentValue = this.Stats.MovementSpeed.max;
        };
    };

    attack(dx) {
        const attackWeapons = this.skeleton.Controller.getChildren((bone) => {
            if (bone.weaponAttacks) {
                return true;
            };
        });
        for (const weapon of attackWeapons) {
            if (this.skeleton.Controller.attacks.some(attack => attack.Owner.id == weapon.id)) continue;
            this.skeleton.Controller.attacks.push(new weapon.weaponAttacks[0](weapon, dx));
            return;
        };
        // if (attackWeapons.length) return;

        const meleeBones = this.skeleton.Controller.getChildren((bone) => {
            if (bone.meleeAttacks) {
                return true;
            };
        });
        for (const meleeBone of meleeBones) {
            if (attackWeapons.some(weapon => weapon.parent.id == meleeBone.id)) continue;
            if (this.skeleton.Controller.attacks.some(attack => attack.Owner.id == meleeBone.id)) continue;
            this.skeleton.Controller.attacks.push(new meleeBone.meleeAttacks[0](meleeBone, dx));
            return;
        };
    };

    die() {
        for (let i = 0; i < this.inventory.slots.length; i++) {
            if (this.inventory.slots[i].item) {
                this.inventory.slots[i].item.x = this.skeleton.Controller.x;
                this.inventory.slots[i].item.y = this.skeleton.Controller.y;
                this.skeleton.Controller.room.addGeometry('entityBox', this.inventory.slots[i].item, true);
                this.inventory.slots[i].item = null;
            };
        };

        this.skeleton.Controller.room.characters = this.skeleton.Controller.room.characters.filter(char => char.id != this.id);
        this.skeleton.Controller.room.entityBoxes = this.skeleton.Controller.room.entityBoxes.filter(box => box.id != this.skeleton.Controller.id);
    };
};
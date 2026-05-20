import { Inventory } from "../entities/characters/character.js";

export const HOTBAR = {
    name: 'HOTBAR',
    render: true,
    slots: 5,
    targetSlot: null,
    addItem: function (item, slotIndex) {
        HOTBAR.slots[slotIndex] = item;
    },
    removeItem: function (slotIndex) {
        HOTBAR.slots[slotIndex] = null;
    },
    activate: function (slotIndex) {
        if (!HOTBAR.slots[slotIndex]) return;

        HOTBAR.slots[slotIndex].use();
    },
};
export const HotbarInventory = new Inventory(HOTBAR, HOTBAR.slots);
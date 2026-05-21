import { CampfireInventorySkeleton } from "../campfire/campfire.inventory.skeleton.js";

export const initializeInventorySkeletons = function (Game) {
    Game.INVENTORY_SKELETON = {
        'Campfire': new CampfireInventorySkeleton(0, 0, 10)
    };
};
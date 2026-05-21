export const CRAFTING_MENU = {
    render: false,
    recipe: null,
    craftT: 0,
    maxCraftT: 10,
    close: () => {
        CRAFTING_MENU.render = false;
        CRAFTING_MENU.recipe = null;
        CRAFTING_MENU.craftT = 0;
        CRAFTING_MENU.maxCraftT = 10;
    },
    open: (recipe) => {
        CRAFTING_MENU.render = true;
        CRAFTING_MENU.recipe = recipe;
        CRAFTING_MENU.craftT = 0;
        CRAFTING_MENU.maxCraftT = recipe.maxCraftT;
    },
    craft: (character) => {
        character.startCraft(CRAFTING_MENU.recipe);
    }
};
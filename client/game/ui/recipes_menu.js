import { Recipes } from "../entities/recipes.js";

export const RECIPES_MENU = {
    render: false,
    scroll: 0,
    recipes: Object.values(Recipes),
    open: () => {
        RECIPES_MENU.scroll = 0
    },
}
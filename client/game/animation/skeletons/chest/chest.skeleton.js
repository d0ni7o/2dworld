import { Bone, Skeleton } from "../skeleton.js";
import { AnimationSets } from "../../animation.js";
import { clamp } from "../../../utils/utils.js";
import { CONTEXT_MENU } from "../../../ui/context_menu.js";
import { ITEM_INVENTORY } from "../../../ui/item_inventory.js";

export class ChestSkeleton extends Skeleton {
    constructor(x, y, scale) {
        const Controller = new Bone(AnimationSets.Chest, null, {
            width: 9 * scale,
            height: 11 * scale,
            x,
            y
        });
        const Chest = new Bone(AnimationSets.Chest, {
            bone: Controller,
            parentX: 0,
            parentY: 0,
            childX: 0,
            childY: 0//-1 / 2 + 1 / 12,
        }, {
            width: 9 * scale,
            height: 11 * scale,
            animation: function (dt) { }
        });
        super([
            Controller,
            Chest
        ], scale);

        this.Controller = Controller;
        this.Chest = Chest;

        this.renderIndex = [1];

        const ogResetCollisions = this.Controller.resetCollisions.bind(this.Controller);
        this.Controller.resetCollisions = () => {
            ogResetCollisions();
            // this.Controller.waterCollision = false;
            this.Controller.interact = this.Chest.open;
        };

        this.Controller.attach = (skeleton) => {
            // console.log(`ATTACH CHEST??`, this);
            if (!CONTEXT_MENU.render) {
                CONTEXT_MENU.target = Controller;
                CONTEXT_MENU.render = true;
                CONTEXT_MENU.options = [];
                // if (Chest.open && !ITEM_INVENTORY.render) {
                //     CONTEXT_MENU.options.push({
                //         name: 'Look',
                //         callback: () => {
                //             ITEM_INVENTORY.open(Controller);
                //         }
                //     });
                // };
                CONTEXT_MENU.options.push(...[
                    {
                        name: Chest.open ? 'Close' : 'Open', callback: () => {
                            Chest.open = !Chest.open;
                            if (Chest.open && !ITEM_INVENTORY.render) {
                                ITEM_INVENTORY.open(Controller);
                            } else if (!Chest.open && ITEM_INVENTORY.render) {
                                ITEM_INVENTORY.close();
                            };
                        }
                    },
                    {
                        name: 'Take', callback: () => {
                            if (skeleton.character.pickup(Controller)) {
                                Chest.open = false;
                                if (!Chest.open && ITEM_INVENTORY.render) {
                                    ITEM_INVENTORY.close();
                                };
                                skeleton.Controller.room.characters = skeleton.Controller.room.characters.filter(({ id }) => id != Controller.skeleton.character.id);
                            };
                        }
                    }
                ]);
            };
        };

        this.Controller.detach = (skeleton) => { };
    };
};
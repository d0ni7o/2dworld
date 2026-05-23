import { Bone, Skeleton } from "../skeleton.js";
import { AnimationSets } from "../../animation.js";
import { clamp } from "../../../utils/utils.js";
import { CONTEXT_MENU } from "../../../ui/context_menu.js";
import { ITEM_INVENTORY } from "../../../ui/item_inventory.js";

export class CampfireSkeleton extends Skeleton {
    constructor(x, y, scale) {
        const Controller = new Bone(AnimationSets.Campfire, null, {
            width: 17 * scale,
            height: 11 * scale,
            x,
            y
        });
        const Campfire = new Bone(AnimationSets.Campfire, {
            bone: Controller,
            parentX: 0,
            parentY: -1 / 2,
            childX: 0,
            childY: 0//-1 / 2 + 1 / 12,
        }, {
            width: 17 * scale,
            height: 11 * scale,
            animation: function (dt) { }
        });
        const Fire = new Bone(AnimationSets.Fire, {
            bone: Campfire,
            parentX: 0,
            parentY: -1 / 2,
            childX: 0,
            childY: -1 / 4
        }, {
            width: 15 * scale,
            height: 29 * scale,
            animation: function (dt) { }
        });

        Controller.closeOnContextMenu = Campfire;

        Fire.unaffectSize = true;
        Fire.craftT = 0;
        Fire.maxCraftT = 10;
        Fire.craftIndex = 0;

        super([
            Controller,
            Campfire,
            Fire
        ], scale);

        this.Controller = Controller;
        this.Campfire = Campfire;
        this.Fire = Fire;

        this.renderIndex = [1, 2];

        const ogResetCollisions = this.Controller.resetCollisions.bind(this.Controller);
        this.Controller.resetCollisions = (dt) => {
            ogResetCollisions();

            if (!Campfire.attachments.length) {
                this.renderIndex = [1];
                return;
            };

            if (
                Fire.attachments.length && 
                (
                    !this.character.inventory.slots[0].item || 
                    (
                        this.character.inventory.slots[0].item.animator.animationSet.name == Fire.attachments[0].animator.animationSet.name &&
                        this.character.inventory.slots[0].item.stack < this.character.inventory.slots[0].item.init.maxStack
                    )
                )
            ) {
                Fire.craftT += dt;
                this.renderIndex = [1, 2];
                if (Fire.craftT >= Fire.maxCraftT) {
                    if (Fire.attachments[0].stack == 1) {
                        Fire.attachments[0].cooked = true;
                        Fire.attachments[0].animator.update();
                        this.character.pickup(Fire.attachments[0]);
                        Fire.attachments[0].detach();
                    } else {
                        const cookedItem = Fire.attachments[0].stackedInstances[0];
                        Fire.attachments[0].stack--;
                        Fire.attachments[0].stackedInstances = Fire.attachments[0].stackedInstances.slice(1);

                        cookedItem.cooked = true;
                        cookedItem.animator.update();
                        this.character.pickup(cookedItem);
                    };
                    Fire.craftT = 0;
                    Fire.craftIndex++;
                    if (Fire.craftIndex % 2 == 0) {
                        if (Campfire.attachments[0].stack == 1) {
                            Campfire.attachments[0].detach();
                        } else {
                            Campfire.attachments[0].stack--;
                            Campfire.attachments[0].stackedInstances = Campfire.attachments[0].stackedInstances.slice(1);
                        };
                    };
                };
            } else {
                this.renderIndex = [1];
            };
            // this.Controller.waterCollision = false;
            // this.Controller.interact = this.Chest.open;
        };

        this.Controller.attach = (skeleton) => {
            // console.log(`ATTACH CHEST??`, this);
            if (!CONTEXT_MENU.render) {
                CONTEXT_MENU.target = Controller;
                CONTEXT_MENU.render = true;
                CONTEXT_MENU.options = [];

                CONTEXT_MENU.options.push(...[
                    {
                        name: Campfire.open ? 'Close' : 'Open', callback: () => {
                            Campfire.open = !Campfire.open;
                            if (Campfire.open && !ITEM_INVENTORY.render) {
                                ITEM_INVENTORY.open(Controller);
                            } else if (!Campfire.open && ITEM_INVENTORY.render) {
                                ITEM_INVENTORY.close();
                            };
                        }
                    },
                    {
                        name: 'Take', callback: () => {
                            if (skeleton.character.pickup(Controller)) {
                                Campfire.open = false;
                                if (!Campfire.open && ITEM_INVENTORY.render) {
                                    ITEM_INVENTORY.close();
                                };
                                /** ENTITY POOL */
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
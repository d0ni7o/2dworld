import { tileSize } from "../world/tilemap/tilemap.js";
import { CONTEXT_MENU } from "../ui/context_menu.js";
import { ITEM_INVENTORY } from "../ui/item_inventory.js";
import { HOTBAR, HotbarInventory } from "../ui/hotbar.js";
import { clamp } from "../utils/utils.js";
import { Physics } from "../physics/physics.js";
import { CRAFTING_MENU } from "../ui/crafting_menu.js";

window.addEventListener('resize', function (event) {
    Screen.resize();
    Screen.resize(Screen.cameraView);
    Screen.ctx.font = '16px Arial'
    Screen.cameraCtx.font = '16px Arial'
});

export const Screen = {
    main: document.getElementById('main'),
    cameraView: document.getElementById('camera-view'),
    setup: function () {
        this.ctx = this.main.getContext('2d', { willReadFrequently: true });
        this.cameraCtx = this.cameraView.getContext('2d', { willReadFrequently: true });
        this.resize();
        this.resize(this.cameraView);
        this.ctx.font = '16px Arial'
        this.cameraCtx.font = '16px Arial'
    },
    renderCircle: function (circle, ctx = this.ctx) {
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fillStyle = /*circle.collision ? 'red' : */circle.color;
        ctx.fill();
    },
    renderEntityBox: function (box, ctx = this.ctx) {
        this.renderBox(box, ctx);
        return;
        for (const ray of box.directions) {
            this.renderRay(ray, ctx);
        };
    },
    renderRect: function (box, ctx = this.ctx) {
        ctx.rotate((box.rotation * Math.PI) / 180);
        ctx.fillStyle = box.collision ? 'red' : box.color;
        ctx.fillRect(box.x - Math.floor(box.width / 2), box.y - Math.floor(box.height / 2), box.width, box.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
    renderBox: function (box, ctx = this.ctx) {
        // ctx.rotate((box.rotation * Math.PI) / 180);
        // ctx.fillStyle = box.collision ? 'red' : box.color;
        // ctx.fillRect(box.x - Math.floor(box.width / 2), box.y - Math.floor(box.height / 2), box.width, box.height);
        // ctx.setTransform(1, 0, 0, 1, 0, 0);
        if (box.animator) {
            try {
                // if(!box.isBone && ctx.canvas.id == 'camera-view') console.log(`BOX ANIMATOR!!!`, box);
                this.renderPng({
                    x: box.x,
                    y: box.y,
                    width: box.width,
                    height: box.height,
                    drawing: box.animator.image,
                    flipHorizontal: box.flipX,
                    rotation: box.rotation,
                    rotationOffsetX: box.rotationOffsetX,
                    rotationOffsetY: box.rotationOffsetY,
                    offsetX: box.offsetX || 0,
                    offsetY: box.offsetY || 0,
                }, ctx);
            } catch (error) {
                console.error(box);
                throw (error);
            }
            return;
        } else if (!box.isBone) {
            // this.renderPng({
            //     x: box.x,
            //     y: box.y,
            //     width: box.width,
            //     height: box.height,
            //     drawing: AnimationSets.Human.image,
            //     flipHorizontal: box.flipX
            // });
        };

        for (const side of box.sides) {
            ctx.beginPath();
            ctx.moveTo(side.p0.x, side.p0.y);
            ctx.lineTo(side.p.x, side.p.y);
            ctx.closePath();

            ctx.lineWidth = 1;
            ctx.strokeStyle = side.collision ? 'red' : side.color;
            ctx.stroke();
        };
        // ctx.beginPath();
        // ctx.moveTo(box.AB.p0.x, box.AB.p0.y);
        // ctx.lineTo(box.AB.p.x, box.AB.p.y);
        // ctx.lineTo(box.CD.p0.x, box.CD.p0.y);
        // ctx.lineTo(box.CD.p.x, box.CD.p.y);
        // ctx.lineTo(box.AB.p0.x, box.AB.p0.y);
        // ctx.closePath();

        // ctx.lineWidth = 5;
        // ctx.strokeStyle = box.collision ? 'red' : 'blue';
        // ctx.stroke();
    },
    renderRay2: function (ray, ctx = this.ctx) {
        // ctx.beginPath();
        ctx.moveTo(ray.p0.x, ray.p0.y);
        ctx.bezierCurveTo(
            (ray.p0.x + ray.p.x) / 2,
            (ray.p0.y + ray.p.y) / 2,
            (ray.p0.x + ray.p.x) / 2,
            (ray.p0.y + ray.p.y + 50) / 2,
            ray.p.x,
            ray.p.y
        );
        // ctx.closePath();

        ctx.lineWidth = 1;
        ctx.strokeStyle = ray.collision ? 'red' : ray.color;
        ctx.stroke();
    },
    renderRay: function (ray, ctx = this.ctx) {
        ctx.beginPath();
        ctx.moveTo(ray.p0.x, ray.p0.y);
        ctx.lineTo(ray.p.x, ray.p.y);
        ctx.closePath();

        ctx.lineWidth = 1;
        ctx.strokeStyle = ray.collision ? 'red' : ray.color;
        ctx.stroke();
    },
    renderBone: function (bone, ctx) {
        ctx.rotate((bone.rotation * Math.PI) / 180);
        ctx.fillStyle = bone.color || "blue";
        ctx.fillRect(bone.x - Math.floor(bone.width / 2), bone.y - Math.floor(bone.height / 2), bone.width, bone.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        for (const childBone of bone.children) {
            Screen.renderBone(childBone, ctx)
        };
    },
    renderEntity: function (entity, ctx = this.ctx) {
        for (const bone of entity.bones) {
            Screen.renderBone(bone, ctx);
        };
    },
    renderMouse: function (ctx = this.cameraCtx) {
        this.renderCircle({
            x: this.Input.Mouse.x,
            y: this.Input.Mouse.y,
            radius: 10,
            color: 'red'
        }, ctx);
    },
    renderPng: function (Image, ctx = this.ctx) {
        // console.log(`RENDER PNG`, Image);
        ctx.imageSmoothingEnabled = false;
        ctx.imageSmoothingQuality = "high";
        ctx.setTransform(
            Image.flipHorizontal ? -1 : 1,
            Image.Transform?.skewX || 0,
            Image.Transform?.skewY || 0,
            Image.flipVertical ? -1 : 1,
            Image.x + (Image.offsetX || 0),
            Image.y + (Image.offsetY || 0)
        );
        ctx.translate(Image.width * (Image.rotationOffsetX || 0), Image.height * (Image.rotationOffsetY || 0));
        ctx.rotate(-Image.rotation || 0);
        ctx.translate(-Image.width * (Image.rotationOffsetX || 0), -Image.height * (Image.rotationOffsetY || 0));
        ctx.drawImage(
            Image.drawing,
            -Image.width / 2,
            -Image.height / 2,
            Image.width,
            Image.height
        );
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
    renderHp(character, ctx = this.cameraCtx) {
        if (!character.Stats?.Hp) return;
        const characterController = this.Camera.getBoxImage(character.skeleton.Controller);
        if (character.Stats.Breath.currentValue < character.Stats.Breath.max) {
            ctx.fillStyle = 'blue';
            ctx.fillRect(
                characterController.x - characterController.width / 2,
                characterController.y - characterController.height / 2 - tileSize - 2 * tileSize / 4,
                characterController.width * character.Stats.Breath.currentValue / character.Stats.Breath.max,
                tileSize / 4
            );
        };
        if (character.Stats.Stamina.currentValue < character.Stats.Stamina.max) {
            ctx.fillStyle = 'green';
            ctx.fillRect(
                characterController.x - characterController.width / 2,
                characterController.y - characterController.height / 2 - tileSize - tileSize / 4,
                characterController.width * character.Stats.Stamina.currentValue / character.Stats.Stamina.max,
                tileSize / 4
            );
        };
        ctx.fillStyle = 'red';
        ctx.fillRect(
            characterController.x - characterController.width / 2,
            characterController.y - characterController.height / 2 - tileSize,
            characterController.width * character.Stats.Hp.currentValue / character.Stats.Hp.max,
            tileSize / 4
        );
    },
    renderStats(stats = this.Input.Player.entityBox.skeleton.character.Stats, ctx = this.cameraCtx) {
        const padding = 5;
        ctx.fillStyle = 'gray';
        ctx.fillRect(0, 0, this.cameraView.width, 2 * tileSize + padding * 2);
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'darkgray';
        ctx.strokeRect(0, 0, this.cameraView.width, 2 * tileSize + padding * 2);

        const statW = 3 * tileSize;
        const statH = tileSize;
        let totalH = padding;
        let totalW = padding;
        let x = 0;
        let y = 0;
        let counter = 0;

        ctx.fillStyle = 'black';
        for (const stat of Object.values(stats)) {
            if (stat.color2) {
                ctx.fillStyle = stat.color2;
                ctx.fillRect(totalW, totalH, statW, statH);

                ctx.fillStyle = stat.color || 'black';
                ctx.fillRect(totalW, totalH, statW * stat.currentValue / stat.max, statH);
            } else {
                ctx.fillStyle = stat.color || 'black';
                ctx.fillRect(totalW, totalH, statW, statH);
            };
            ctx.fillStyle = 'white';
            const text = `${stat.name}: ${stat.currentValue.toFixed(2)} / ${stat.max}`;
            const measure = ctx.measureText(text);
            ctx.fillText(text, totalW + statW / 2 - measure.width / 2, totalH + statH / 2);

            totalH += statH;
            counter++;

            if ((counter % 2) == 0) {
                totalW += statW;
                totalH = padding;
            };
        };
    },
    renderSkeleton(skeleton, ctx = this.ctx) {
        // console.log(`RENDER SKELETON`, skeleton);


        if (skeleton.bones[0].flipX) {
            for (const i of skeleton.reverseRenderIndex) {
                for (const attachment of skeleton.bones[i].attachments || []) {
                    if (attachment.attachmentOrder == 1) {
                        this.renderBox(this.Camera.getBoxImage(attachment), ctx);
                    };
                };
                this.renderEntityBox(this.Camera.getBoxImage(skeleton.bones[i]), ctx);
                for (const attachment of skeleton.bones[i].attachments || []) {
                    if (attachment.attachmentOrder <= 0) {
                        this.renderBox(this.Camera.getBoxImage(attachment), ctx);
                    };
                };
            };
        } else {
            for (const i of skeleton.renderIndex) {
                for (const attachment of skeleton.bones[i].attachments || []) {
                    if (attachment.attachmentOrder == -1) {
                        this.renderBox(this.Camera.getBoxImage(attachment), ctx);
                    };
                };
                this.renderEntityBox(this.Camera.getBoxImage(skeleton.bones[i]), ctx);
                for (const attachment of skeleton.bones[i].attachments || []) {
                    if (attachment.attachmentOrder >= 0) {
                        this.renderBox(this.Camera.getBoxImage(attachment), ctx);
                    };
                };
            };
        };
    },
    renderTileMap(tileMap, ctx) {
        for (let x = 0; x < tileMap.map.length; x++) {
            for (let y = 0; y < tileMap.map[x].length; y++) {
                this.renderTile(tileMap.map[x][y], tileMap, ctx);
                // Screen.renderRect({
                //     x: x * tileSize + tileMap.room.x - tileMap.room.width / 2 + tileSize / 2,
                //     y: y * tileSize + tileMap.room.y - tileMap.room.height / 2 + tileSize / 2,
                //     width: tileSize,
                //     height: tileSize,
                //     color: tileMap.map[x][y].color || 'lightblue'
                // }, ctx)
                // if (!tileMap.map[x][y].image) {
                //     continue;
                // };
                // Screen.renderPng({
                //     drawing: tileMap.map[x][y].image,
                //     x: x * tileSize + tileMap.room.x - tileMap.room.width / 2 + tileSize / 2,
                //     y: y * tileSize + tileMap.room.y - tileMap.room.height / 2 + tileSize / 2,
                //     width: tileSize,
                //     height: tileSize
                // }, ctx)
            };
        };
    },
    renderTile(tile, tileMap, ctx) {
        Screen.renderRect({
            x: tile.Position.x,// * tileSize + tileMap.room.x - tileMap.room.width / 2 + tileSize / 2,
            y: tile.Position.y,// * tileSize + tileMap.room.y - tileMap.room.height / 2 + tileSize / 2,
            width: tileSize,
            height: tileSize,
            color: tileMap.map[tile.x][tile.y].color || 'lightblue'
        }, ctx)
        if (!tileMap.map[tile.x][tile.y].image) {
            return;
        };
        // console.log(`RENDER TILE IMAGE`, tileSize, tileSize);
        Screen.renderPng({
            drawing: tileMap.map[tile.x][tile.y].image,
            x: tile.Position.x,// * tileSize + tileMap.room.x - tileMap.room.width / 2 + tileSize / 2,
            y: tile.Position.y,// * tileSize + tileMap.room.y - tileMap.room.height / 2 + tileSize / 2,
            width: tileSize,
            height: tileSize
        }, ctx)
    },
    renderWaterInstance(waterInstance, ctx) {
        if (!waterInstance.amount) return;

        ctx.fillStyle = `rgba(0, ${140 - waterInstance.amount * 5}, 255, 0.6)`;
        ctx.fillRect(
            waterInstance.x,// + slot.padding / 2, 
            waterInstance.y,// + slot.padding / 2, 
            waterInstance.width,
            waterInstance.height
        );
    },
    renderWater(water, ctx = this.ctx) {
        for (let i = 0; i < water.instances.length; i++) {
            this.renderWaterInstance(water.instances[i], ctx);
        };
    },
    resize: function (screen = this.main) {
        screen.width = window.innerWidth;
        screen.height = window.innerHeight;
        if (this.HumanInventory) {
            this.HumanInventory.Controller.x = this.cameraView.width / 2;
            this.HumanInventory.Controller.y = this.cameraView.height / 2;
            this.HumanInventory.Controller.updateGeometry();
            this.HumanInventory.calculateSize();
        };
    },
    renderItemInventory: function (item = ITEM_INVENTORY.target, screen = this.cameraView, ctx = this.cameraCtx) {
        if (!this.Input.Keys.renderInventory) this.HumanInventory.targetSlot = null;

        let slotSelected = false;
        const padding = 5;
        const totalPaddingWidth = padding * this.HumanInventory.Torso.width;
        const totalPaddingHeight = padding
        const perRow = item.skeleton.character.inventory.slots.length;//item.skeleton.character.inventory.slots.length / 2;
        const nRows = Math.ceil(item.skeleton.character.inventory.slots.length / perRow);
        const slotSize = this.HumanInventory.Torso.width;
        const slotSizePadded = (slotSize + padding + 1)
        const iWidth = perRow * slotSizePadded;
        const minX = clamp(
            item.x - iWidth / 2 + slotSizePadded / 2 - this.Camera.x + Screen.cameraView.width / 2,
            slotSize / 2,
            Screen.cameraView.width - iWidth + slotSize / 2
        );
        const minY = clamp(
            item.y - nRows * slotSize - this.Camera.y + Screen.cameraView.height / 2,
            slotSize / 2,
            Screen.cameraView.height - nRows * slotSize + slotSize / 2
        );
        const slotsY = this.HumanInventory.maxY + this.HumanInventory.Torso.width / 2;

        const InventorySkeleton = this.INVENTORY_SKELETON[item.skeleton.character.constructor.name];

        if (InventorySkeleton) {
            InventorySkeleton.Controller.x = item.x - iWidth / 2 + slotSizePadded / 2 - this.Camera.x + Screen.cameraView.width / 2;
            InventorySkeleton.Controller.y = item.y - nRows * slotSize - this.Camera.y + Screen.cameraView.height / 2;

            const x = minX;
            const y = minY + slotSizePadded - 2 * slotSizePadded;

            if (InventorySkeleton.Craft) {
                const bone = item.skeleton[InventorySkeleton.Craft.bone];

                ctx.fillStyle = 'red';
                ctx.fillRect(
                    x - slotSize / 2,
                    y - slotSize / 8,
                    slotSize * bone.craftT / bone.maxCraftT,
                    slotSize / 4
                );
            };

            for (const i of InventorySkeleton.renderIndex) {
                const coords = {
                    x: InventorySkeleton.bones[i].x,
                    y: InventorySkeleton.bones[i].y,
                    rotation: 0,
                    flipX: false,
                    offsetX: 0,
                    offsetY: 0,
                    width: slotSize,
                    height: slotSize
                };
                const boneName = InventorySkeleton.bones[i].animator.animationSet.name;

                for (const slotIndex in InventorySkeleton.Slots[boneName]) {
                    const slotOffsetX = slotSize * InventorySkeleton.Slots[boneName][slotIndex].parentX;;
                    const slotOffsetY = slotSize * InventorySkeleton.Slots[boneName][slotIndex].parentY;

                    const attachment = item.skeleton.bones[i].getChild((bone) => {
                        if (bone.parent.id != item.skeleton.bones[i].id) return false;
                        if (bone.attachmentDef) {
                            return bone.attachmentDef.slots.includes(Number(slotIndex));
                        };
                        return false;
                    });

                    this.renderEntityBox({
                        ...item.skeleton.bones[i],
                        ...coords,
                        animator: { ...item.skeleton.bones[i].animator, image: InventorySkeleton.bones[i].animator.image },
                        x: x + slotOffsetX + (Math.sign(slotOffsetX)) * (padding + 1),
                        y: y + slotOffsetY + (Math.sign(slotOffsetY)) * (padding + 1),
                    });


                    slotSelected = this.renderInventorySlot({
                        name: `${boneName}_${slotIndex}`,
                        item: attachment || null,
                        x: x + slotOffsetX + (Math.sign(slotOffsetX)) * (padding + 1),
                        y: y + slotOffsetY + (Math.sign(slotOffsetY)) * (padding + 1),
                        width: slotSize,
                        height: slotSize,
                        padding,
                        color: 'darkgray',
                        backgroundAnimationSet: InventorySkeleton.bones[i].animator.animationSet
                    }, slotSelected);

                    if (!this.HumanInventory.targetSlot && slotSelected) {
                        this.HumanInventory.targetSlot = {
                            isBone: true,
                            name: `${boneName}_${slotIndex}`,
                            item: attachment || null,
                            slot: item.skeleton.bones[i]
                        };
                    };
                };
            };
        }

        for (let i = 0; i < item.skeleton.character.inventory.slots.length; i++) {
            const slot = item.skeleton.character.inventory.slots[i];

            const x = minX + (i % perRow) * slotSizePadded;
            const y = minY + Math.floor(i / perRow) * slotSizePadded;

            slotSelected = this.renderInventorySlot({
                name: `${item.id}-${i}`,
                item: slot.item,
                x,
                y,
                width: slotSize,
                height: slotSize,
                padding,
                color: 'darkgray'
            }, slotSelected);

            if (!this.HumanInventory.targetSlot && slotSelected) {
                this.HumanInventory.targetSlot = {
                    isBone: false,
                    name: `${item.id}-${i}`,
                    item: slot.item,
                    slot: item.skeleton.character.inventory.slots[i]
                };
            };
        };

        // if (!slotSelected) HumanInventory.targetSlot = null;
    },
    renderCraftingMenu: function (menu = CRAFTING_MENU, screen = this.cameraView, ctx = this.cameraCtx) {
        if (!this.Input.Keys.renderInventory) this.HumanInventory.targetSlot = null;
        let targetButton = null;


        let slotSelected = false;
        const padding = 5;
        const totalPaddingWidth = padding * this.HumanInventory.Torso.width;
        const totalPaddingHeight = padding
        const perRow = menu.recipe.inventory.slots.length + 1;
        const slotSize = this.HumanInventory.Torso.width;
        const slotSizePadded = (slotSize + padding + 1)
        const iWidth = perRow * slotSizePadded;
        const minX = slotSizePadded / 2;//this.HumanInventory.Controller.x - iWidth / 2 + slotSizePadded / 2;
        const slotsY = screen.height - slotSizePadded / 2 - padding * 2;//this.HumanInventory.maxY + this.HumanInventory.Torso.width / 2;

        let extraIndex = 0;

        for (let i = 0; i < menu.recipe.inventory.slots.length; i++) {
            if (i == menu.recipe.input.length) extraIndex = 1;
            const slot = menu.recipe.inventory.slots[i];

            slotSelected = this.renderInventorySlot({
                name: `CRAFTING_MENU_${i}`,
                item: slot.item,
                x: minX + ((i + extraIndex) % perRow) * slotSizePadded,
                y: slotsY + slotSizePadded * Math.floor((i + extraIndex) / perRow) + padding * 2,
                width: slotSize,
                height: slotSize,
                padding,
                color: 'darkgray',
                backgroundAnimationSet: slot.backgroundAnimationSet
            }, slotSelected);

            if (!this.HumanInventory.targetSlot && slotSelected) {
                this.HumanInventory.targetSlot = {
                    isBone: false,
                    name: `CRAFTING_MENU_${i}`,
                    item: slot.item,
                    slot: menu.recipe.inventory.slots[i]
                };
            };
        };


        const x = slotSizePadded / 2;
        const y = slotsY + slotSizePadded * Math.floor((extraIndex) / perRow) + padding * 2 - slotSizePadded;
        slotSelected = this.renderInventorySlot({
            x,
            y,
            width: slotSize,
            height: slotSize,
            padding,
            color: 'darkgray'
        }, false);

        const textMeasure = ctx.measureText('CRAFT');
        ctx.fillStyle = 'black';
        ctx.fillText('CRAFT', x - textMeasure.width / 2, y);

        if (slotSelected && this.Input.Mouse.down) {
            menu.craft(this.Input.Player.entityBox.skeleton.character);
        };

        if (this.Input.Player.entityBox.skeleton.character.crafting) {
            // const bone = item.skeleton[InventorySkeleton.Craft.bone];

            ctx.fillStyle = 'red';
            ctx.fillRect(
                x - slotSize / 2 + (menu.recipe.output.length + 1) * slotSizePadded,
                y - slotSize / 8 + slotSizePadded,
                slotSize * this.Input.Player.entityBox.skeleton.character.craftT / this.Input.Player.entityBox.skeleton.character.craftingRecipe.maxCraftT,
                slotSize / 4
            );
        };
    },
    renderContextMenu: function (menu = CONTEXT_MENU, screen = this.cameraView, ctx = this.cameraCtx) {
        const padding = 5;
        const totalPaddingWidth = padding * tileSize;
        const totalPaddingHeight = padding;
        const perRow = menu.options.length;
        const slotSize = tileSize;
        const slotSizePadded = (slotSize + padding + 1)
        const iWidth = perRow * slotSizePadded;
        const minX = clamp(
            screen.width / 2 - iWidth / 2 + slotSizePadded / 2 - screen.width / 2 + menu.target.x - this.Camera.x + Screen.cameraView.width / 2,
            slotSize / 2,
            Screen.cameraView.width - iWidth + slotSize / 2
        );

        let slotSelected = false;
        menu.targetOption = null;

        for (let i = 0; i < menu.options.length; i++) {
            const option = menu.options[i];

            const x = minX + (i % perRow) * slotSizePadded;
            const y = clamp(
                menu.target.y - menu.target.height - this.Camera.y + Screen.cameraView.height / 2,
                slotSize / 2,
                Screen.cameraView.height - slotSizePadded + slotSize / 2
            );
            slotSelected = this.renderInventorySlot({
                x,
                y: y,
                width: slotSize,
                height: slotSize,
                padding,
                color: 'darkgray'
            }, slotSelected);

            ctx.fillStyle = 'black';
            ctx.fillText(option.name, x - slotSize / 4, y);

            if (!menu.targetOption && slotSelected && this.Input.Mouse.down) {
                menu.targetOption = option;
                menu.select(option);
                return;
            };
        };
    },
    renderUnstackSlot: function () {
        if (!this.HumanInventory.unstackSlot.item) return;
        this.renderInventorySlot({
            ...this.HumanInventory.unstackSlot,
            width: this.HumanInventory.Torso.width,
            height: this.HumanInventory.Torso.height
        });
    },
    renderInventory: function (character, screen = this.cameraView, ctx = this.cameraCtx) {
        this.HumanInventory.Controller.updateGeometry();
        this.HumanInventory.calculateSize();
        this.HumanInventory.targetSlot = null;

        let slotSelected = false;
        const padding = 5;
        const totalPaddingWidth = padding * this.HumanInventory.Torso.width;
        const totalPaddingHeight = padding
        const perRow = character.inventory.slots.length / 2;
        const slotSize = this.HumanInventory.Torso.width;
        const slotSizePadded = (slotSize + padding + 1)
        const iWidth = perRow * slotSizePadded;
        const minX = screen.width - iWidth + slotSizePadded / 2;//this.HumanInventory.Controller.x - iWidth / 2 + slotSizePadded / 2;
        const slotsY = screen.height - 3 * slotSizePadded / 2 - padding * 2;//this.HumanInventory.maxY + this.HumanInventory.Torso.width / 2;

        this.HumanInventory.Controller.x = screen.width - this.HumanInventory.Controller.width;
        this.HumanInventory.Controller.y = screen.height - 2 * slotSizePadded - padding * 2 - this.HumanInventory.Controller.height / 2;

        for (const i of this.HumanInventory.renderIndex) {
            const coords = {
                x: this.HumanInventory.bones[i].x,
                y: this.HumanInventory.bones[i].y,
                rotation: 0,
                flipX: false,
                offsetX: 0,
                offsetY: 0,
                width: this.HumanInventory.bones[i].width,
                height: this.HumanInventory.bones[i].height
            };
            const boneName = this.HumanInventory.bones[i].animator.animationSet.name;

            for (const slotIndex in this.HumanInventory.Slots[boneName]) {
                const slotOffsetX = this.HumanInventory.bones[i].width * this.HumanInventory.Slots[boneName][slotIndex].parentX;;
                const slotOffsetY = this.HumanInventory.bones[i].height * this.HumanInventory.Slots[boneName][slotIndex].parentY;

                const attachment = character.skeleton.bones[i].getChild((bone) => {
                    if (bone.parent.id != character.skeleton.bones[i].id) return false;
                    if (bone.attachmentDef) {
                        return bone.attachmentDef.slots.includes(Number(slotIndex));
                    };
                    return false;
                });

                this.renderEntityBox({
                    ...character.skeleton.bones[i],
                    ...coords,
                    animator: { ...character.skeleton.bones[i].animator, image: this.HumanInventory.bones[i].animator.image },
                    x: this.HumanInventory.bones[i].x + slotOffsetX + (Math.sign(slotOffsetX)) * (padding + 1),
                    y: this.HumanInventory.bones[i].y + slotOffsetY + (Math.sign(slotOffsetY)) * (padding + 1),
                }, ctx);


                slotSelected = this.renderInventorySlot({
                    name: `${boneName}_${slotIndex}`,
                    item: attachment || null,
                    x: this.HumanInventory.bones[i].x + slotOffsetX + (Math.sign(slotOffsetX)) * (padding + 1),
                    y: this.HumanInventory.bones[i].y + slotOffsetY + (Math.sign(slotOffsetY)) * (padding + 1),
                    width: this.HumanInventory.bones[i].width,
                    height: this.HumanInventory.bones[i].height,
                    padding,
                    color: 'darkgray'
                }, slotSelected);

                if (!this.HumanInventory.targetSlot && slotSelected) {
                    this.HumanInventory.targetSlot = {
                        isBone: true,
                        name: `${boneName}_${slotIndex}`,
                        item: attachment || null,
                        slot: character.skeleton.bones[i]
                    };
                };
            };
        };

        for (let i = 0; i < character.inventory.slots.length; i++) {
            const slot = character.inventory.slots[i];

            slotSelected = this.renderInventorySlot({
                name: i,
                item: slot.item,
                x: minX + (i % perRow) * slotSizePadded,
                y: slotsY + slotSizePadded * Math.floor(i / perRow) + padding * 2,
                width: slotSize,
                height: slotSize,
                padding,
                color: 'darkgray'
            }, slotSelected);

            if (!this.HumanInventory.targetSlot && slotSelected) {
                this.HumanInventory.targetSlot = {
                    isBone: false,
                    name: i,
                    item: slot.item,
                    slot: character.inventory.slots[i]
                };
            };
        };

        if (!slotSelected) this.HumanInventory.targetSlot = null;
    },
    renderInventorySlot(slot, slotSelected, ctx = this.cameraCtx) {
        let isSlotSelected = slotSelected;

        if (slot.backgroundAnimationSet) {
            let x = slot.x;
            let y = slot.y;
            
            this.renderBox({
                x: x,
                y: y,
                width: slot.width,
                height: slot.height,
                sides: [],
                animator: {
                    image: slot.backgroundAnimationSet.image
                }
            }, ctx);
        };

        if (!isSlotSelected && Physics.checkCircleBox2(0, {
            x: this.Input.Mouse.x,
            y: this.Input.Mouse.y,
            radius: 1,
        }, slot)) {
            isSlotSelected = true;
            ctx.fillStyle = `rgba(255, 117, 25, 0.8)`;
            ctx.fillRect(
                slot.x - Math.floor(slot.width / 2),// + slot.padding / 2, 
                slot.y - Math.floor(slot.height / 2),// + slot.padding / 2, 
                slot.width,
                slot.height
            );
        } else if (slot.highlighted) {
            ctx.fillStyle = `rgba(255, 117, 25, 0.8)`;
            ctx.fillRect(
                slot.x - Math.floor(slot.width / 2),// + slot.padding / 2, 
                slot.y - Math.floor(slot.height / 2),// + slot.padding / 2, 
                slot.width,
                slot.height
            );
        } else {
            ctx.fillStyle = `rgba(128, 128, 128, 0.8)`;
            ctx.fillRect(
                slot.x - Math.floor(slot.width / 2),// + slot.padding / 2, 
                slot.y - Math.floor(slot.height / 2),// + slot.padding / 2, 
                slot.width,
                slot.height
            );

        };

        if (slot.item) {
            let x = slot.x;
            let y = slot.y;
            if (this.HumanInventory.selectedSlot?.name == slot.name) {
                x = this.Input.Mouse.x;
                y = this.Input.Mouse.y;
            };
            this.renderBox({
                x: x,
                y: y,
                width: slot.width,
                height: slot.height,
                sides: [],
                animator: {
                    image: slot.item.animator.image
                }
            }, ctx);

            if (slot.item.init.maxStack > 1) {
                // ctx.font = '16px Arial'
                ctx.fillStyle = 'white';
                const metrics = ctx.measureText(slot.item.stack);
                ctx.fillText(slot.item.stack, x - this.HumanInventory.Torso.width / 2 + (metrics.width / 2) / (1 + Math.floor(Math.log10(slot.item.stack))), y - this.HumanInventory.Torso.width / 4);
                // const metrics = ctx.measureText(slot.item.stack);
            };
        };

        ctx.lineWidth = slot.padding || 1;
        ctx.strokeStyle = slot.color;
        ctx.strokeRect(slot.x - Math.floor(slot.width / 2), slot.y - Math.floor(slot.height / 2), slot.width, slot.height);

        return isSlotSelected;
    },
    renderHotbar(hotbar = HOTBAR, ctx = this.cameraCtx) {
        hotbar.targetSlot = null;

        let slotSelected = false;
        const padding = 5;
        const totalPaddingWidth = padding * this.HumanInventory.Torso.width;
        const totalPaddingHeight = padding
        const perRow = 5;//item.skeleton.character.inventory.slots.length / 2;
        const nRows = 1;
        const slotSize = this.HumanInventory.Torso.width;
        const slotSizePadded = (slotSize + padding + 1)
        const iWidth = perRow * slotSizePadded;
        const minX = clamp(
            Screen.cameraView.width / 2 - iWidth / 2 + slotSizePadded / 2,
            slotSize / 2,
            Screen.cameraView.width - iWidth + slotSize / 2
        );
        const minY = clamp(
            Screen.cameraView.height / 2 - nRows * slotSize,
            slotSize / 2,
            Screen.cameraView.height - nRows * slotSize + slotSize / 2
        );
        const slotsY = this.HumanInventory.maxY + this.HumanInventory.Torso.width / 2;

        for (let i = 0; i < HotbarInventory.slots.length; i++) {
            const slot = HotbarInventory.slots[i];

            const x = minX + (i % perRow) * slotSizePadded;
            const y = Screen.cameraView.height - slotSizePadded / 2;

            slotSelected = this.renderInventorySlot({
                name: `HOTBAR-${i}`,
                item: slot.item,
                x,
                y,
                width: slotSize,
                height: slotSize,
                padding,
                color: 'darkgray',
                highlighted: HotbarInventory.slots[i].active
            }, slotSelected);

            if (!this.HumanInventory.targetSlot && slotSelected) {
                hotbar.targetSlot = {
                    isBone: false,
                    name: `HOTBAR-${i}`,
                    item: slot.item,
                    slot: HotbarInventory.slots[i]
                };
                this.HumanInventory.targetSlot = {
                    isBone: false,
                    name: `HOTBAR-${i}`,
                    item: slot.item,
                    slot: HotbarInventory.slots[i]
                };
            };
        };

        if (!hotbar.targetSlot && !this.Input.Keys.renderInventory && !ITEM_INVENTORY.render) {
            this.HumanInventory.targetSlot = null;
        }
    },
};
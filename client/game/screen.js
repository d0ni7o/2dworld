

const Screen = {
    main: document.getElementById('main'),
    cameraView: document.getElementById('camera-view'),
    setup: function () {
        this.ctx = this.main.getContext('2d', { willReadFrequently: true });
        this.cameraCtx = this.cameraView.getContext('2d', { willReadFrequently: true });
        this.resize();
        this.resize(this.cameraView);
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
            x: Mouse.x - TestCamera.x + Screen.cameraView.width / 2,
            y: Mouse.y - TestCamera.y + Screen.cameraView.height / 2,
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
    renderSkeleton(skeleton, ctx = this.ctx) {
        // console.log(`RENDER SKELETON`, skeleton);


        if (skeleton.bones[0].flipX) {
            for (const i of skeleton.reverseRenderIndex) {
                for (const attachment of skeleton.bones[i].attachments || []) {
                    if (attachment.attachmentOrder == 1) {
                        this.renderBox(TestCamera.getBoxImage(attachment), ctx);
                    };
                };
                this.renderEntityBox(TestCamera.getBoxImage(skeleton.bones[i]), ctx);
                for (const attachment of skeleton.bones[i].attachments || []) {
                    if (attachment.attachmentOrder <= 0) {
                        this.renderBox(TestCamera.getBoxImage(attachment), ctx);
                    };
                };
            };
        } else {
            for (const i of skeleton.renderIndex) {
                for (const attachment of skeleton.bones[i].attachments || []) {
                    if (attachment.attachmentOrder == -1) {
                        this.renderBox(TestCamera.getBoxImage(attachment), ctx);
                    };
                };
                this.renderEntityBox(TestCamera.getBoxImage(skeleton.bones[i]), ctx);
                for (const attachment of skeleton.bones[i].attachments || []) {
                    if (attachment.attachmentOrder >= 0) {
                        this.renderBox(TestCamera.getBoxImage(attachment), ctx);
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
        // Screen.renderRect({
        //     x: waterInstance.tile.x * tileSize + water.room.x - water.room.width / 2 + tileSize / 2,
        //     y: waterInstance.tile.y * tileSize + water.room.y - water.room.height / 2 + tileSize / 2,
        //     width: tileSize,
        //     height: tileSize,
        //     color: 'rgba(0, 140, 255, 0.5)'
        // })
        // let waterWidth;
        // let waterHeight;// = waterInstance.amount * tileSize / MAX_WATER_PER_TILE;
        // if (waterInstance.dy != 0) {
        //     waterWidth = waterInstance.amount * tileSize / MAX_WATER_PER_TILE;
        //     waterHeight = tileSize;
        // } else {
        //     waterWidth = tileSize;
        //     waterHeight = waterInstance.amount * tileSize / MAX_WATER_PER_TILE;
        // };
        // const x = waterInstance.tile.x * tileSize + waterInstance.tile.TileMap.room.x - waterInstance.tile.TileMap.room.width / 2 + tileSize / 2 - Math.floor(tileSize / 2) + (tileSize - waterWidth) / 2;
        // let y = waterInstance.tile.y * tileSize + waterInstance.tile.TileMap.room.y - waterInstance.tile.TileMap.room.height / 2 + tileSize / 2 - Math.floor(tileSize / 2) + (tileSize - waterHeight);

        // const bottomNeighbour = waterInstance.tile.getNeighbour(0, 1);
        // if(bottomNeighbour) {
        //     if(bottomNeighbour.imageIndex == 2 || bottomNeighbour.imageIndex == 4) {
        //         y += tileSize / 2;
        //     }
        // };

        ctx.fillStyle = `rgba(0, ${140 - waterInstance.amount * 5}, 255, 0.6)`;
        ctx.fillRect(
            waterInstance.x,// + slot.padding / 2, 
            waterInstance.y,// + slot.padding / 2, 
            waterInstance.width,
            waterInstance.height
        );


        // ctx.setTransform(1, 0, 0, 1, 0, 0);
        // ctx.fillStyle = 'black';
        // ctx.font = '16px Arial'
        // ctx.fillText(waterInstance.amount, x + tileSize / 2, y + tileSize / 2);

        if (waterInstance.amount) {
            ctx.strokeStyle = 'blue';
            ctx.strokeRect(waterInstance.x, waterInstance.y, waterInstance.width, waterInstance.height);
            // this.renderBox(waterInstance);
        };
        // if (!tileMap.map[x][y].image) {
        //     continue;
        // };
    },
    renderWater(water, ctx = this.ctx) {
        // const boundaries = water.getBoundaries();
        // ctx.beginPath();
        // ctx.moveTo(boundaries[0].p0.x, boundaries[0].p0.y);
        // for (let i = 0; i < boundaries.length; i++) {
        //     this.renderRay2(boundaries[i]);
        // };
        // ctx.closePath();
        // ctx.fillStyle = `rgba(0, 100, 255, 0.5)`;
        // ctx.fill();
        // return;
        for (let i = 0; i < water.instances.length; i++) {
            this.renderWaterInstance(water.instances[i], ctx);
        };
    },
    resize: function (screen = this.main) {
        screen.width = window.innerWidth;
        screen.height = window.innerHeight;
    },
    renderItemInventory: function (item = ITEM_INVENTORY.target, screen = this.cameraView, ctx = this.cameraCtx) {
        if (!Keys.renderInventory) HumanInventory.targetSlot = null;

        let slotSelected = false;
        const padding = 5;
        const totalPaddingWidth = padding * HumanInventory.Torso.width;
        const totalPaddingHeight = padding
        const perRow = 5;//item.skeleton.character.inventory.slots.length / 2;
        const nRows = Math.ceil(item.skeleton.character.inventory.slots.length / perRow);
        const slotSize = HumanInventory.Torso.width;
        const slotSizePadded = (slotSize + padding + 1)
        const iWidth = perRow * slotSizePadded;
        const minX = clamp(
            item.x - iWidth / 2 + slotSizePadded / 2 - TestCamera.x + Screen.cameraView.width / 2,
            slotSize / 2,
            Screen.cameraView.width - iWidth + slotSize / 2
        );
        const minY = clamp(
            item.y - nRows * slotSize - TestCamera.y + Screen.cameraView.height / 2,
            slotSize / 2,
            Screen.cameraView.height - nRows * slotSize + slotSize / 2
        );
        const slotsY = HumanInventory.maxY + HumanInventory.Torso.width / 2;

        // for (const i of HumanInventory.renderIndex) {
        //     const coords = {
        //         x: HumanInventory.bones[i].x,
        //         y: HumanInventory.bones[i].y,
        //         rotation: 0,
        //         flipX: false,
        //         offsetX: 0,
        //         offsetY: 0,
        //         width: HumanInventory.bones[i].width,
        //         height: HumanInventory.bones[i].height
        //     };
        //     const boneName = HumanInventory.bones[i].animator.animationSet.name;

        //     for (const slotIndex in HumanInventory.Slots[boneName]) {
        //         const slotOffsetX = HumanInventory.bones[i].width * HumanInventory.Slots[boneName][slotIndex].parentX;;
        //         const slotOffsetY = HumanInventory.bones[i].height * HumanInventory.Slots[boneName][slotIndex].parentY;

        //         const attachment = character.skeleton.bones[i].getChild((bone) => {
        //             if (bone.parent.id != character.skeleton.bones[i].id) return false;
        //             if (bone.attachmentDef) {
        //                 return bone.attachmentDef.slots.includes(Number(slotIndex));
        //             };
        //             return false;
        //         });

        //         this.renderEntityBox({
        //             ...character.skeleton.bones[i],
        //             ...coords,
        //             animator: { ...character.skeleton.bones[i].animator, image: HumanInventory.bones[i].animator.image },
        //             x: HumanInventory.bones[i].x + slotOffsetX + (Math.sign(slotOffsetX)) * (padding + 1),
        //             y: HumanInventory.bones[i].y + slotOffsetY + (Math.sign(slotOffsetY)) * (padding + 1),
        //         });


        //         slotSelected = this.renderInventorySlot({
        //             name: `${boneName}_${slotIndex}`,
        //             item: attachment || null,
        //             x: HumanInventory.bones[i].x + slotOffsetX + (Math.sign(slotOffsetX)) * (padding + 1),
        //             y: HumanInventory.bones[i].y + slotOffsetY + (Math.sign(slotOffsetY)) * (padding + 1),
        //             width: HumanInventory.bones[i].width,
        //             height: HumanInventory.bones[i].height,
        //             padding,
        //             color: 'darkgray'
        //         }, slotSelected);

        //         if (!HumanInventory.targetSlot && slotSelected) {
        //             HumanInventory.targetSlot = {
        //                 isBone: true,
        //                 name: `${boneName}_${slotIndex}`,
        //                 item: attachment || null,
        //                 slot: character.skeleton.bones[i]
        //             };
        //         };
        //     };
        // };

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

            if (!HumanInventory.targetSlot && slotSelected) {
                HumanInventory.targetSlot = {
                    isBone: false,
                    name: `${item.id}-${i}`,
                    item: slot.item,
                    slot: item.skeleton.character.inventory.slots[i]
                };
            };
        };

        // if (!slotSelected) HumanInventory.targetSlot = null;
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
            screen.width / 2 - iWidth / 2 + slotSizePadded / 2 - screen.width / 2 + menu.target.x - TestCamera.x + Screen.cameraView.width / 2,
            slotSize / 2,
            Screen.cameraView.width - iWidth + slotSize / 2
        );

        let slotSelected = false;
        menu.targetOption = null;

        for (let i = 0; i < menu.options.length; i++) {
            const option = menu.options[i];

            const x = minX + (i % perRow) * slotSizePadded;
            const y = clamp(
                menu.target.y - menu.target.height - TestCamera.y + Screen.cameraView.height / 2,
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

            ctx.font = '16px Arial'
            ctx.fillStyle = 'black';
            ctx.fillText(option.name, x - slotSize / 4, y);

            if (!menu.targetOption && slotSelected && mousedown) {
                menu.targetOption = option;
                menu.select(option);
                return;
            };
        };
    },
    renderInventory: function (character, screen = this.cameraView, ctx = this.cameraCtx) {
        HumanInventory.Controller.x = screen.width / 2;
        HumanInventory.Controller.y = screen.height / 2;
        HumanInventory.Controller.updateGeometry();
        HumanInventory.calculateSize();

        HumanInventory.targetSlot = null;
        let slotSelected = false;
        const padding = 5;
        const totalPaddingWidth = padding * HumanInventory.Torso.width;
        const totalPaddingHeight = padding
        const perRow = character.inventory.slots.length / 2;
        const slotSize = HumanInventory.Torso.width;
        const slotSizePadded = (slotSize + padding + 1)
        const iWidth = perRow * slotSizePadded;
        const minX = HumanInventory.Controller.x - iWidth / 2 + slotSizePadded / 2;
        const slotsY = HumanInventory.maxY + HumanInventory.Torso.width / 2;

        for (const i of HumanInventory.renderIndex) {
            const coords = {
                x: HumanInventory.bones[i].x,
                y: HumanInventory.bones[i].y,
                rotation: 0,
                flipX: false,
                offsetX: 0,
                offsetY: 0,
                width: HumanInventory.bones[i].width,
                height: HumanInventory.bones[i].height
            };
            const boneName = HumanInventory.bones[i].animator.animationSet.name;

            for (const slotIndex in HumanInventory.Slots[boneName]) {
                const slotOffsetX = HumanInventory.bones[i].width * HumanInventory.Slots[boneName][slotIndex].parentX;;
                const slotOffsetY = HumanInventory.bones[i].height * HumanInventory.Slots[boneName][slotIndex].parentY;

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
                    animator: { ...character.skeleton.bones[i].animator, image: HumanInventory.bones[i].animator.image },
                    x: HumanInventory.bones[i].x + slotOffsetX + (Math.sign(slotOffsetX)) * (padding + 1),
                    y: HumanInventory.bones[i].y + slotOffsetY + (Math.sign(slotOffsetY)) * (padding + 1),
                }, ctx);


                slotSelected = this.renderInventorySlot({
                    name: `${boneName}_${slotIndex}`,
                    item: attachment || null,
                    x: HumanInventory.bones[i].x + slotOffsetX + (Math.sign(slotOffsetX)) * (padding + 1),
                    y: HumanInventory.bones[i].y + slotOffsetY + (Math.sign(slotOffsetY)) * (padding + 1),
                    width: HumanInventory.bones[i].width,
                    height: HumanInventory.bones[i].height,
                    padding,
                    color: 'darkgray'
                }, slotSelected);

                if (!HumanInventory.targetSlot && slotSelected) {
                    HumanInventory.targetSlot = {
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

            if (!HumanInventory.targetSlot && slotSelected) {
                HumanInventory.targetSlot = {
                    isBone: false,
                    name: i,
                    item: slot.item,
                    slot: character.inventory.slots[i]
                };
            };
        };

        if (!slotSelected) HumanInventory.targetSlot = null;
    },
    renderInventorySlot(slot, slotSelected, ctx = this.cameraCtx) {
        let isSlotSelected = slotSelected;

        if (!isSlotSelected && Physics.checkCircleBox2(0, {
            x: Mouse.x - TestCamera.x + Screen.cameraView.width / 2,
            y: Mouse.y - TestCamera.y + Screen.cameraView.height / 2,
            radius: 1,
        }, slot)) {
            isSlotSelected = true;
            ctx.fillStyle = `rgba(255, 117, 25, 0.9)`;
            ctx.fillRect(
                slot.x - Math.floor(slot.width / 2),// + slot.padding / 2, 
                slot.y - Math.floor(slot.height / 2),// + slot.padding / 2, 
                slot.width,
                slot.height
            );
        } else {
            ctx.fillStyle = `rgba(128, 128, 128, 0.9)`;
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
            if (HumanInventory.selectedSlot?.name == slot.name) {
                x = Mouse.x - TestCamera.x + Screen.cameraView.width / 2;
                y = Mouse.y - TestCamera.y + Screen.cameraView.height / 2;
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
        };

        ctx.lineWidth = slot.padding || 1;
        ctx.strokeStyle = slot.color;
        ctx.strokeRect(slot.x - Math.floor(slot.width / 2), slot.y - Math.floor(slot.height / 2), slot.width, slot.height);

        return isSlotSelected;
    },
};
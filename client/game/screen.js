

const Screen = {
    main: document.getElementById('main'),
    setup: function () {
        this.ctx = this.main.getContext('2d');
        this.resize();
    },
    renderCircle: function (circle) {
        this.ctx.beginPath();
        this.ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
        this.ctx.closePath();
        this.ctx.fillStyle = /*circle.collision ? 'red' : */circle.color;
        this.ctx.fill();
    },
    renderEntityBox: function (box, ctx = this.ctx) {
        this.renderBox(box);
        return;
        for (const ray of box.directions) {
            this.renderRay(ray);
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
        if (box.animationSet) {
            this.renderPng({
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height,
                drawing: box.animationSet.image,
                flipHorizontal: box.flipX,
                rotation: box.rotation,
                rotationOffsetX: box.rotationOffsetX,
                rotationOffsetY: box.rotationOffsetY,
                offsetX: box.offsetX || 0,
                offsetY: box.offsetY || 0,
            });
            return;
        } else if (!box.isBone) {
            this.renderPng({
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height,
                drawing: AnimationSets.Human.image,
                flipHorizontal: box.flipX
            });
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
    renderMouse: function (ctx = this.ctx) {
        this.renderCircle({ ...Mouse, radius: 10, color: 'red' });
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
    renderSkeleton(skeleton) {
        // console.log(`RENDER SKELETON`, skeleton);


        if (skeleton.bones[0].flipX) {
            for (const i of skeleton.reverseRenderIndex) {
                for (const attachment of skeleton.bones[i].attachments || []) {
                    if (attachment.attachmentOrder == 1) {
                        this.renderBox(attachment);
                    };
                };
                this.renderEntityBox(skeleton.bones[i]);
                for (const attachment of skeleton.bones[i].attachments || []) {
                    if (attachment.attachmentOrder <= 0) {
                        this.renderBox(attachment);
                    };
                };
            };
        } else {
            for (const i of skeleton.renderIndex) {
                for (const attachment of skeleton.bones[i].attachments || []) {
                    if (attachment.attachmentOrder == -1) {
                        this.renderBox(attachment);
                    };
                };
                this.renderEntityBox(skeleton.bones[i]);
                for (const attachment of skeleton.bones[i].attachments || []) {
                    if (attachment.attachmentOrder >= 0) {
                        this.renderBox(attachment);
                    };
                };
            };
        };
    },
    renderTileMap(tileMap) {
        for (let x = 0; x < tileMap.map.length; x++) {
            for (let y = 0; y < tileMap.map[x].length; y++) {
                Screen.renderRect({
                    x: x * tileSize + tileMap.room.x - tileMap.room.width / 2 + tileSize / 2,
                    y: y * tileSize + tileMap.room.y - tileMap.room.height / 2 + tileSize / 2,
                    width: tileSize,
                    height: tileSize,
                    color: tileMap.map[x][y].color || 'lightblue'
                })
                if (!tileMap.map[x][y].image) {
                    continue;
                };
                Screen.renderPng({
                    drawing: tileMap.map[x][y].image,
                    x: x * tileSize + tileMap.room.x - tileMap.room.width / 2 + tileSize / 2,
                    y: y * tileSize + tileMap.room.y - tileMap.room.height / 2 + tileSize / 2,
                    width: tileSize,
                    height: tileSize
                })
            };
        };
    },
    resize: function (screen = this.main) {
        screen.width = window.innerWidth;
        screen.height = window.innerHeight;
    },
};
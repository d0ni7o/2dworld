const SPRITESHEET_DIMENSIONS = {
    frameWidth: 10,
};

class SpriteSheetFrame {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    };

    getImage(spritesheet, imageCtx) {
        imageCtx.putImageData(spritesheet.getImageData(this.x, this.y, this.width, this.height), 0, 0);
    };
};

const loadedSpriteSheets = {};

const AssetManager = {
    async loadImage(id, source, loadDimensions = false) {
        return new Promise(async (resolve, reject) => {
            if (document.getElementById(id)) {
                resolve(document.getElementById(id));
                return;
            };

            if (!source) {
                // console.error(`Image ${id} not found and passed with no source`);
                resolve(undefined);
                return;
            };

            const imgHtml = document.createElement("img");
            imgHtml.id = id;
            document.getElementById('images').appendChild(imgHtml);

            const img = new Image();
            // img.setAttribute('crossOrigin', '')
            // img.crossOrigin = 'Anonymous'
            img.onload = function () {
                imgHtml.src = img.src;
                if (loadDimensions) {
                    imgHtml.width = Number(img.width);
                    imgHtml.height = Number(img.height);
                    resolve(img);
                    return
                };
                resolve(imgHtml);
            };
            img.src = source;
        });
    },
    async getSpritesheet(animationId, animationFrames) {
        console.log(`LOAD SPRITESHEET`, animationId);
        if (loadedSpriteSheets[animationId]) return loadedSpriteSheets[animationId];
        return await new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            canvas.width = SPRITESHEET_DIMENSIONS.frameWidth * animationFrames[0].width;
            canvas.height = Math.ceil(animationFrames.length / SPRITESHEET_DIMENSIONS.frameWidth) * animationFrames[0].height;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const frameData = [];
            for (let frame = 0; frame < animationFrames.length; frame++) {
                const image = animationFrames[frame];
                const x = (frame % SPRITESHEET_DIMENSIONS.frameWidth) * image.width;
                const y = Math.floor(frame / SPRITESHEET_DIMENSIONS.frameWidth) * image.height;
                ctx.drawImage(image, x, y);
                console.log(image, frame);
                frameData.push(new SpriteSheetFrame(x, y, image.width, image.height));
            };

            console.log(frameData);
            loadedSpriteSheets[animationId] = { canvas: ctx, frameData };
            resolve({ canvas: ctx, frameData });
        });
    },
    async getFolderContent(path) {
        return await new Promise(async (resolve, reject) => {
            return resolve(JSON.parse(await Ajax.request("GET", `http://localhost:8081/readFolderContents/${path}`)));
        });
    },
}
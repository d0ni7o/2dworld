
let tileSize = 64;
const baseTileSize = 16;

class TileSet {
    constructor(imageSource, name) {
        this.name = name;
        this.imageSource = imageSource;
    };

    async load() {
        console.log(`LOAD`, this);
        this.setImage = await AssetManager.loadImage(this.name, this.imageSource);

        const setCanvas = document.createElement('canvas');
        setCanvas.width = this.setImage.width;
        setCanvas.height = this.setImage.height;
        const setCtx = setCanvas.getContext('2d', { willReadFrequently: true });
        setCtx.drawImage(this.setImage, 0, 0);
        document.getElementById("images").appendChild(setCanvas);

        this.images = [];
        for (let i = 0; i < 6; i++) {
            const x = (i % 4) * baseTileSize;
            const y = Math.floor(i / 4) * baseTileSize;

            const canvas = document.createElement('canvas');
            canvas.width = baseTileSize;
            canvas.height = baseTileSize;

            const ctx = canvas.getContext('2d');
            ctx.putImageData(
                setCtx.getImageData(x, y, baseTileSize, baseTileSize),
                0,
                0
            );
            this.images.push(canvas);
            document.getElementById("images").appendChild(canvas);
        };
    };
};

const getTileImageIndex = function (tile) {
    if (tile.getNeighbour(0, -1)?.image) return 1;
};

class Tile {
    constructor(tileMap, x, y) {
        this.TileMap = tileMap;
        this.x = x;
        this.y = y;

        this.colliders = [];

        this.imageCycle = -1;
    };

    getNeighbour(offsetX, offsetY = 0) {
        let neighbour;
        try {
            neighbour = this.TileMap.map[this.x + offsetX][this.y + offsetY];
        } catch (error) { };
        return neighbour;
    };

    setType(tileSet, imageIndex = 0, calc = false) {
        const nTopLeft = this.getNeighbour(-1, -1);
        const nTop = this.getNeighbour(0, -1);
        const nTopRight = this.getNeighbour(1, -1);
        const nRight = this.getNeighbour(1, 0);
        const nBottomRight = this.getNeighbour(1, 1);
        const nBottom = this.getNeighbour(0, 1);
        const nBottomLeft = this.getNeighbour(-1, 1);
        const nLeft = this.getNeighbour(-1, 0);

        if (!calc) {
            this.imageCycle = (this.imageCycle + 1) % 3;
            if (nTop?.image) {
                imageIndex = 2 * this.imageCycle + 1;
            } else {
                imageIndex = 2 * this.imageCycle;
            };
        } else {
            if (nTop?.image) {
                switch (nTop.imageIndex) {
                    case 0:
                    case 1:
                        imageIndex = 1;
                        break;
                    case 2:
                        imageIndex = 3;
                        break;
                    case 4:
                        imageIndex = 5;
                        break;
                };
            };
            if (nLeft?.image && nBottomRight?.image) {
                if ((nLeft.imageIndex == 0 || nLeft.imageIndex == 5) && (nBottomRight.imageIndex == 0 || nBottomRight.imageIndex == 4)) {
                    imageIndex = 4;
                };
            };
            if (nRight?.image && nBottomLeft?.image) {
                if ((nRight.imageIndex == 0 || nRight.imageIndex == 3) && (nBottomLeft.imageIndex == 0 || nBottomLeft.imageIndex == 2)) {
                    imageIndex = 2;
                };
            };
        };


        this.tileSet = tileSet;
        this.image = tileSet.images[imageIndex];
        this.imageIndex = imageIndex;


        if (nBottom?.image) {
            if (imageIndex == 0 || imageIndex == 1) {
                nBottom.setType(nBottom.tileSet, 1, true);
            };
            if (imageIndex == 2) {
                nBottom.setType(nBottom.tileSet, 3, true);
            };
            if (imageIndex == 4) {
                nBottom.setType(nBottom.tileSet, 5, true);
            };
        };

        this.updateCollider();
    };

    destroyCollider() {
        if (this.collider) {
            const type = this.collider.constructor.name;
            if (type == 'Vector') {
                this.TileMap.room.ramps = this.TileMap.room.ramps.filter(ramp => ramp.id != this.collider.id);
            } else {
                this.TileMap.room.boxes = this.TileMap.room.boxes.filter(box => box.id != this.collider.id);
            };
            this.collider = null;
        };
        if (this.leftCollider) {
            const type = this.leftCollider.constructor.name;
            if (type == 'Vector') {
                this.TileMap.room.ramps = this.TileMap.room.ramps.filter(ramp => ramp.id != this.leftCollider.id);
            } else {
                this.TileMap.room.boxes = this.TileMap.room.boxes.filter(box => box.id != this.leftCollider.id);
            };
            this.leftCollider = null;
        };
        if (this.topCollider) {
            const type = this.topCollider.constructor.name;
            if (type == 'Vector') {
                this.TileMap.room.ramps = this.TileMap.room.ramps.filter(ramp => ramp.id != this.topCollider.id);
            } else {
                this.TileMap.room.boxes = this.TileMap.room.boxes.filter(box => box.id != this.topCollider.id);
            };
            this.topCollider = null;
        };
        if (this.rightCollider) {
            const type = this.rightCollider.constructor.name;
            if (type == 'Vector') {
                this.TileMap.room.ramps = this.TileMap.room.ramps.filter(ramp => ramp.id != this.rightCollider.id);
            } else {
                this.TileMap.room.boxes = this.TileMap.room.boxes.filter(box => box.id != this.rightCollider.id);
            };
            this.rightCollider = null;
        };
        if (this.bottomCollider) {
            const type = this.bottomCollider.constructor.name;
            if (type == 'Vector') {
                this.TileMap.room.ramps = this.TileMap.room.ramps.filter(ramp => ramp.id != this.bottomCollider.id);
            } else {
                this.TileMap.room.boxes = this.TileMap.room.boxes.filter(box => box.id != this.bottomCollider.id);
            };
            this.bottomCollider = null;
        };

    };

    updateCollider() {
        this.destroyCollider();

        if (this.imageIndex == 0 || this.imageIndex == 1) {
            this.collider = new Box(
                this.x * tileSize + this.TileMap.room.x - this.TileMap.room.width / 2 + tileSize / 2,
                this.y * tileSize + this.TileMap.room.y - this.TileMap.room.height / 2 + tileSize / 2,
                tileSize,
                tileSize
            );
            this.TileMap.room.boxes.push(this.collider);
        } else if (this.imageIndex == 2 || this.imageIndex == 3) {
            this.collider = new Vector(
                this.x * tileSize + this.TileMap.room.x - this.TileMap.room.width / 2,
                this.y * tileSize + this.TileMap.room.y - this.TileMap.room.height / 2 + tileSize,
                this.x * tileSize + this.TileMap.room.x - this.TileMap.room.width / 2 + tileSize,
                this.y * tileSize + this.TileMap.room.y - this.TileMap.room.height / 2,
            );
            this.TileMap.room.ramps.push(this.collider);
        } else if (this.imageIndex == 4 || this.imageIndex == 5) {
            this.collider = new Vector(
                this.x * tileSize + this.TileMap.room.x - this.TileMap.room.width / 2 + tileSize,
                this.y * tileSize + this.TileMap.room.y - this.TileMap.room.height / 2 + tileSize,
                this.x * tileSize + this.TileMap.room.x - this.TileMap.room.width / 2,
                this.y * tileSize + this.TileMap.room.y - this.TileMap.room.height / 2,
            );
            this.TileMap.room.ramps.push(this.collider);
        };
    };
}

class TileMap {
    constructor(room) {
        const tilesX = Math.floor(room.width / tileSize);
        const tilesY = Math.floor(room.height / tileSize);

        this.map = [];

        for (let x = 0; x < tilesX; x++) {
            this.map.push([]);
            for (let y = 0; y < tilesY; y++) {
                this.map[x].push(new Tile(this, x, y));
            };
        };

        this.room = room;
        this.room.TileMap = this;
    };

    optimizeColliders() {
        for (let x = 0; x < this.map.length; x++) {
            for (let y = 0; y < this.map[x].length; y++) {
                this.map[x][y].destroyCollider();
            };
        };
        for (let x = 0; x < this.map.length; x++) {
            for (let y = 0; y < this.map[x].length; y++) {
                const tile = this.map[x][y];
                if (!tile.image) continue;
                const nLeft = tile.getNeighbour(-1, 0);
                const nTop = tile.getNeighbour(0, -1);
                const nRight = tile.getNeighbour(1, 0);
                const nBottom = tile.getNeighbour(0, 1);

                const nBottomLeft = tile.getNeighbour(-1, 1);

                if (tile.imageIndex == 0 || tile.imageIndex == 1) {
                    if (!nLeft?.image || nLeft.imageIndex == 3 || nLeft.imageIndex == 4) {
                        tile.leftCollider = new Vector(
                            tile.x * tileSize + this.room.x - this.room.width / 2,
                            tile.y * tileSize + this.room.y - this.room.height / 2,
                            tile.x * tileSize + this.room.x - this.room.width / 2,
                            tile.y * tileSize + this.room.y - this.room.height / 2 + tileSize,
                        );
                        this.room.ramps.push(tile.leftCollider);
                        tile.leftCollider.tile = tile;
                    };
                    if (!nRight?.image || nRight.imageIndex == 2 || nRight.imageIndex == 5) {
                        tile.rightCollider = new Vector(
                            tile.x * tileSize + this.room.x - this.room.width / 2 + tileSize,
                            tile.y * tileSize + this.room.y - this.room.height / 2,
                            tile.x * tileSize + this.room.x - this.room.width / 2 + tileSize,
                            tile.y * tileSize + this.room.y - this.room.height / 2 + tileSize,
                        );
                        this.room.ramps.push(tile.rightCollider);
                        tile.rightCollider.tile = tile;
                    };
                    if (!nTop?.image || nTop.imageIndex == 3 || nTop.imageIndex == 5) {
                        tile.topCollider = new Vector(
                            tile.x * tileSize + this.room.x - this.room.width / 2,
                            tile.y * tileSize + this.room.y - this.room.height / 2,
                            tile.x * tileSize + this.room.x - this.room.width / 2 + tileSize,
                            tile.y * tileSize + this.room.y - this.room.height / 2,
                        );
                        this.room.ramps.push(tile.topCollider);
                        tile.topCollider.tile = tile;
                    };
                    if (!nBottom?.image || nBottom.imageIndex == 2 || nBottom.imageIndex == 4) {
                        tile.bottomCollider = new Vector(
                            tile.x * tileSize + this.room.x - this.room.width / 2,
                            tile.y * tileSize + this.room.y - this.room.height / 2 + tileSize,
                            tile.x * tileSize + this.room.x - this.room.width / 2 + tileSize,
                            tile.y * tileSize + this.room.y - this.room.height / 2 + tileSize,
                        );
                        this.room.ramps.push(tile.bottomCollider);
                        tile.bottomCollider.tile = tile;
                    };
                } else if (tile.imageIndex == 2 || tile.imageIndex == 3) {
                    tile.collider = new Vector(
                        tile.x * tileSize + this.room.x - this.room.width / 2,
                        tile.y * tileSize + this.room.y - this.room.height / 2 + tileSize,
                        tile.x * tileSize + this.room.x - this.room.width / 2 + tileSize,
                        tile.y * tileSize + this.room.y - this.room.height / 2,
                    );
                    this.room.ramps.push(tile.collider);
                    tile.collider.tile = tile;
                    if (tile.imageIndex == 2) {
                        if (!nBottom?.image || nBottom.imageIndex == 2 || nBottom.imageIndex == 4) {
                            tile.bottomCollider = new Vector(
                                tile.x * tileSize + this.room.x - this.room.width / 2,
                                tile.y * tileSize + this.room.y - this.room.height / 2 + tileSize,
                                tile.x * tileSize + this.room.x - this.room.width / 2 + tileSize,
                                tile.y * tileSize + this.room.y - this.room.height / 2 + tileSize,
                            );
                            this.room.ramps.push(tile.bottomCollider);
                            tile.bottomCollider.tile = tile;
                        };
                        if (!nRight?.image || nRight.imageIndex == 2 || nRight.imageIndex == 5) {
                            tile.rightCollider = new Vector(
                                tile.x * tileSize + this.room.x - this.room.width / 2 + tileSize,
                                tile.y * tileSize + this.room.y - this.room.height / 2,
                                tile.x * tileSize + this.room.x - this.room.width / 2 + tileSize,
                                tile.y * tileSize + this.room.y - this.room.height / 2 + tileSize,
                            );
                            this.room.ramps.push(tile.rightCollider);
                            tile.rightCollider.tile = tile;
                        };
                    } else {
                        if (!nLeft?.image || nLeft.imageIndex == 3 || nLeft.imageIndex == 4) {
                            tile.leftCollider = new Vector(
                                tile.x * tileSize + this.room.x - this.room.width / 2,
                                tile.y * tileSize + this.room.y - this.room.height / 2,
                                tile.x * tileSize + this.room.x - this.room.width / 2,
                                tile.y * tileSize + this.room.y - this.room.height / 2 + tileSize,
                            );
                            this.room.ramps.push(tile.leftCollider);
                            tile.leftCollider.tile = tile;
                        };
                        if (!nTop?.image || nTop.imageIndex == 3 || nTop.imageIndex == 5) {
                            tile.topCollider = new Vector(
                                tile.x * tileSize + this.room.x - this.room.width / 2,
                                tile.y * tileSize + this.room.y - this.room.height / 2,
                                tile.x * tileSize + this.room.x - this.room.width / 2 + tileSize,
                                tile.y * tileSize + this.room.y - this.room.height / 2,
                            );
                            this.room.ramps.push(tile.topCollider);
                            tile.topCollider.tile = tile;
                        };
                    }
                } else if (tile.imageIndex == 4 || tile.imageIndex == 5) {
                    tile.collider = new Vector(
                        tile.x * tileSize + this.room.x - this.room.width / 2 + tileSize,
                        tile.y * tileSize + this.room.y - this.room.height / 2 + tileSize,
                        tile.x * tileSize + this.room.x - this.room.width / 2,
                        tile.y * tileSize + this.room.y - this.room.height / 2,
                    );
                    this.room.ramps.push(tile.collider);
                    tile.collider.tile = tile;
                    if (tile.imageIndex == 4) {
                        if (!nBottom?.image || nBottom.imageIndex == 2 || nBottom.imageIndex == 4) {
                            tile.bottomCollider = new Vector(
                                tile.x * tileSize + this.room.x - this.room.width / 2,
                                tile.y * tileSize + this.room.y - this.room.height / 2 + tileSize,
                                tile.x * tileSize + this.room.x - this.room.width / 2 + tileSize,
                                tile.y * tileSize + this.room.y - this.room.height / 2 + tileSize,
                            );
                            this.room.ramps.push(tile.bottomCollider);
                            tile.bottomCollider.tile = tile;
                        };
                        if (!nLeft?.image || nLeft.imageIndex == 3 || nLeft.imageIndex == 4) {
                            tile.leftCollider = new Vector(
                                tile.x * tileSize + this.room.x - this.room.width / 2,
                                tile.y * tileSize + this.room.y - this.room.height / 2,
                                tile.x * tileSize + this.room.x - this.room.width / 2,
                                tile.y * tileSize + this.room.y - this.room.height / 2 + tileSize,
                            );
                            this.room.ramps.push(tile.leftCollider);
                            tile.leftCollider.tile = tile;
                        };
                    } else {
                        if (!nTop?.image || nTop.imageIndex == 3 || nTop.imageIndex == 5) {
                            tile.topCollider = new Vector(
                                tile.x * tileSize + this.room.x - this.room.width / 2,
                                tile.y * tileSize + this.room.y - this.room.height / 2,
                                tile.x * tileSize + this.room.x - this.room.width / 2 + tileSize,
                                tile.y * tileSize + this.room.y - this.room.height / 2,
                            );
                            this.room.ramps.push(tile.topCollider);
                            tile.topCollider.tile = tile;
                        };
                        if (!nRight?.image || nRight.imageIndex == 2 || nRight.imageIndex == 5) {
                            tile.rightCollider = new Vector(
                                tile.x * tileSize + this.room.x - this.room.width / 2 + tileSize,
                                tile.y * tileSize + this.room.y - this.room.height / 2,
                                tile.x * tileSize + this.room.x - this.room.width / 2 + tileSize,
                                tile.y * tileSize + this.room.y - this.room.height / 2 + tileSize,
                            );
                            this.room.ramps.push(tile.rightCollider);
                            tile.rightCollider.tile = tile;
                        };
                    }
                };
            };
        };
    };
};

const TileSets = {
    Grass: new TileSet('./assets/grass_tileset.png', 'Grass'),
};

const loadTileSets = async function () {
    loading++;
    for (tileSet of Object.values(TileSets)) {
        await tileSet.load();
    };
    loading--;
};
loadTileSets();
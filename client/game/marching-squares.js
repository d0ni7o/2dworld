const MARCHIN_SQUARE_LOOKUP_TABLE = {
    0: [],
    1: [
        {
            p0: { index: 2, offsetX: 0, offsetY: -1 / 2 },
            p: { index: 2, offsetX: 1 / 2, offsetY: 0 }
        }
    ],
    2: [
        {
            p0: { index: 3, offsetX: 0, offsetY: -1 / 2 },
            p: { index: 3, offsetX: -1 / 2, offsetY: 0 }
        }
    ],
    3: [
        {
            p0: { index: 2, offsetX: 0, offsetY: -1 / 2 },
            p: { index: 3, offsetX: 0, offsetY: -1 / 2 }
        }
    ],
    4: [
        {
            p0: { index: 1, offsetX: -1 / 2, offsetY: 0 },
            p: { index: 1, offsetX: 0, offsetY: 1 / 2 }
        }
    ],
    5: [
        {
            p0: { index: 1, offsetX: -1 / 2, offsetY: 0 },
            p: { index: 2, offsetX: 0, offsetY: -1 / 2 }
        },
        {
            p0: { index: 1, offsetX: 0, offsetY: 1 / 2 },
            p: { index: 2, offsetX: 1 / 2, offsetY: 0 }
        }
    ],
    6: [
        {
            p0: { index: 1, offsetX: -1 / 2, offsetY: 0 },
            p: { index: 3, offsetX: -1 / 2, offsetY: 0 }
        },
    ],
    7: [
        {
            p0: { index: 1, offsetX: -1 / 2, offsetY: 0 },
            p: { index: 2, offsetX: 0, offsetY: -1 / 2 }
        },
    ],
    8: [
        {
            p0: { index: 0, offsetX: 1 / 2, offsetY: 0 },
            p: { index: 0, offsetX: 0, offsetY: 1 / 2 }
        },
    ],
    9: [
        {
            p0: { index: 0, offsetX: 1 / 2, offsetY: 0 },
            p: { index: 2, offsetX: 1 / 2, offsetY: 0 }
        },
    ],
    10: [
        {
            p0: { index: 0, offsetX: 1 / 2, offsetY: 0 },
            p: { index: 3, offsetX: 0, offsetY: -1 / 2 }
        },
        {
            p0: { index: 0, offsetX: 0, offsetY: 1 / 2 },
            p: { index: 3, offsetX: -1 / 2, offsetY: 0 }
        },
    ],
    11: [
        {
            p0: { index: 0, offsetX: 1 / 2, offsetY: 0 },
            p: { index: 3, offsetX: 0, offsetY: -1 / 2 }
        },
    ],
    12: [
        {
            p0: { index: 0, offsetX: 0, offsetY: 1 / 2 },
            p: { index: 1, offsetX: 0, offsetY: 1 / 2 }
        },
    ],
    13: [
        {
            p0: { index: 1, offsetX: 0, offsetY: 1 / 2 },
            p: { index: 2, offsetX: 1 / 2, offsetY: 0 }
        },
    ],
    14: [
        {
            p0: { index: 0, offsetX: 0, offsetY: 1 / 2 },
            p: { index: 3, offsetX: -1 / 2, offsetY: 0 }
        },
    ],
    15: [],
};

const getVertices = function (tiles) {
    if (tiles.length != 4) throw new Error('Incorrect number of tiles passed');
    const code = 8 * Number(Boolean(tiles[0]) && tiles[0].waterInstance.amount > 0) +
        4 * Number(Boolean(tiles[1]) && tiles[1].waterInstance.amount > 0) +
        2 * Number(Boolean(tiles[3]) && tiles[3].waterInstance.amount > 0) +
        1 * Number(Boolean(tiles[2]) && tiles[2].waterInstance.amount > 0);

    return MARCHIN_SQUARE_LOOKUP_TABLE[code].map(vertex => {
        const t0 = tiles[vertex.p0.index];
        const t = tiles[vertex.p.index];
        let t0WaterHeight = t0.waterInstance.amount * tileSize / MAX_WATER_PER_TILE;
        let tWaterHeight = t.waterInstance.amount * tileSize / MAX_WATER_PER_TILE;
        if (t0.waterInstance.dy != 0) t0WaterHeight = tileSize;
        if (t.waterInstance.dy != 0) tWaterHeight = tileSize;
        return new Vector(
            tileSize * t0.x + tileSize * vertex.p0.offsetX + t.TileMap.room.x - t.TileMap.room.width / 2 + tileSize / 2,
            tileSize * t0.y + tileSize * vertex.p0.offsetY + t.TileMap.room.y - t.TileMap.room.height / 2 + tileSize / 2 + (tileSize - t0WaterHeight),
            tileSize * t.x + tileSize * vertex.p.offsetX + t.TileMap.room.x - t.TileMap.room.width / 2 + tileSize / 2,
            tileSize * t.y + tileSize * vertex.p.offsetY + t.TileMap.room.y - t.TileMap.room.height / 2 + tileSize / 2 + (tileSize - tWaterHeight)
        );
    });
};
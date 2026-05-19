import { perlin1D, perlin } from "../../rng/perlin.js";
import { TileSets } from "../tilemap/tilemap.js";
import { MAX_WATER_PER_TILE } from "../fluids/water.js";
import { randomInt, getId, randomEl } from "../../utils/utils.js";

export const WorldGenerator = {
    generate: function (tileMap, seaLevel = 10) {

        this.generateGround(tileMap, seaLevel);
        this.generateCaves2(tileMap, seaLevel);
        this.addRivers(tileMap, seaLevel);
        // this.generateHills(tileMap, seaLevel);
        // this.addMountainRivers(tileMap, seaLevel);

        console.log(tileMap.Caves);

        // for (let x = 0; x < tileMap.map.length; x++) {
        //     tileMap.map[x][tileMap.map[x].length - 1].waterSink = true;
        // };
    },
    generateGround: function (tileMap, seaLevel) {
        let heightMap = [];
        let extra = 0;
        tileMap.map.forEach((column, x) => {
            if (x % 50 == 0) {
                // if (x % Math.floor(tileMap.map.length / 8) == 0) {
                // if (x > 0) extra = heightMap[x - 1];
                heightMap[x] = extra + Math.floor(perlin1D(x + 0.5, 10) * 1);// + Math.floor((x - (tileMap.map.length / 2)) / 8);

                // heightMap[x] = 2 * Math.pow(Math.sin(3 * x * Math.PI / 4), 2) + Math.floor(perlin1D(x + 0.5, 10) * 1) + Math.floor((x - (tileMap.map.length / 2)) / 8);
            } else {
                heightMap[x] = heightMap[x - 1] + (Math.random() - 0.5) * Math.floor(perlin1D(x + 0.5, 10) * 1);
            };
        });

        // heightMap = heightMap.map(h => h + 4);
        heightMap = heightMap.map(h => h * h * Math.sign(h));
        // heightMap = heightMap.map(h => Math.sqrt(Math.abs(h)) * Math.sign(h));

        for (let x = 0; x < tileMap.map.length; x++) {
            for (let y = 0; y < tileMap.map[x].length; y++) {
                if (y >= tileMap.map[x].length - 1 - (seaLevel - 1 + heightMap[x])) {
                    tileMap.map[x][y].setType(TileSets.Grass);
                };
            };
            for (let y = 0; y < tileMap.map[x].length; y++) {
                if (y >= tileMap.map[x].length - 1 - (seaLevel - 1) && !tileMap.map[x][y].image) {
                    tileMap.map[x][y].waterInstance.amount = MAX_WATER_PER_TILE;
                };
            };
        };

        console.log({ heightMap });
    },
    generateHills: function (tileMap, seaLevel) {
        const seaLevelY = tileMap.map[0].length - 1 - seaLevel;

        let g_maxTerrainY = tileMap.map[0].length - 1;
        let maxTerrainX = 0;
        for (let x = 0; x < tileMap.map.length; x++) {
            for (let y = 0; y < tileMap.map[x].length; y++) {
                if (tileMap.map[x][y].image && y < g_maxTerrainY) {
                    g_maxTerrainY = y;
                    maxTerrainX = x;
                    // break;
                };
            };
        };
        const mountainHeight = Math.max(0, tileMap.map[0].length - seaLevel - g_maxTerrainY);

        let heightMap = [];
        let extra = 0;
        tileMap.map.forEach((column, x) => {
            if (x % 50 == 0) {
                // if (x % Math.floor(tileMap.map.length / 8) == 0) {
                // if (x > 0) extra = heightMap[x - 1];
                heightMap[x] = extra + Math.floor(perlin1D(x + 0.5, 5) * 1);// + Math.floor((x - (tileMap.map.length / 2)) / 8);

                // heightMap[x] = 2 * Math.pow(Math.sin(3 * x * Math.PI / 4), 2) + Math.floor(perlin1D(x + 0.5, 10) * 1) + Math.floor((x - (tileMap.map.length / 2)) / 8);
            } else {
                heightMap[x] = heightMap[x - 1] + (Math.random() - 0.5) * Math.floor(perlin1D(x + 0.5, 5) * 1);
            };
        });

        heightMap = heightMap.map(h => h + 4);

        console.log(`HILL HEIGHT MAP`, heightMap);

        let heightMap2 = [];
        extra = 0;
        tileMap.map.forEach((column, x) => {
            if (x % 50 == 0) {
                // if (x % Math.floor(tileMap.map.length / 8) == 0) {
                // if (x > 0) extra = heightMap[x - 1];
                heightMap2[x] = extra + Math.floor(perlin1D(x + 0.5, 5) * 1);// + Math.floor((x - (tileMap.map.length / 2)) / 8);

                // heightMap[x] = 2 * Math.pow(Math.sin(3 * x * Math.PI / 4), 2) + Math.floor(perlin1D(x + 0.5, 10) * 1) + Math.floor((x - (tileMap.map.length / 2)) / 8);
            } else {
                heightMap2[x] = heightMap2[x - 1] + (Math.random() - 0.5) * Math.floor(perlin1D(x + 0.5, 5) * 1);
            };
        });

        heightMap2 = heightMap2.map(h => h);

        // for (let x = 0; x < tileMap.map.length; x++) {
        //     const seaLevelTile = tileMap.getTile(x, seaLevelY);
        //     if (!seaLevelTile) continue;
        //     const hillTile = tileMap.getTile(x, seaLevelY - 2 * mountainHeight - Math.round(heightMap[x]));
        //     if (!hillTile) continue;
        //     hillTile.setType(TileSets.Grass);
        // };

        let lastY;
        let startY;
        let dy = -1;
        let hillPoints = [];
        let maxHillX = 0;
        let minHillX = tileMap.map.length - 1;
        let maxHillY = 0;
        let minHillY = tileMap.map[0].length - 1;
        for (let x = 1; x < tileMap.map.length - 2; x++) {
            let maxTerrainY = tileMap.map.length - 1;
            let testTile;
            for (let y = 0; y < maxTerrainY; y++) {
                testTile = tileMap.getTile(x, y + 1);
                if (!testTile) break;
                if (testTile.caveId) break;
                if (testTile.image) maxTerrainY = y;
            };

            if (!testTile) continue;
            if (testTile.caveId) {
                maxTerrainY = g_maxTerrainY;
            };

            if (!startY) {
                lastY = g_maxTerrainY - 4;
                startY = g_maxTerrainY - 4;
            };
            // const hillTile = tileMap.getTile(x, lastY + dy);
            const hillTile = tileMap.getTile(x, Math.max(0, maxTerrainY - mountainHeight - Math.round(heightMap[x])));//Math.max(maxTerrainY - 1 - x, seaLevelY - 2 * mountainHeight)));
            if (!hillTile || hillTile.y >= seaLevelY) continue;
            lastY = hillTile.y;
            hillTile.setType(TileSets.Grass);
            // hillTile.imageIndex = dy < 0 ? 2 : 4;
            // hillTile.image = hillTile.tileSet.images[hillTile.imageIndex];
            hillPoints.push({ x, y: lastY, dy });
            if (minHillX > x) minHillX = x;
            if (maxHillX < x) maxHillX = x;
            if (minHillY > lastY) maxHillY = lastY;
            if (maxHillY < lastY) minHillY = lastY;
            // if (hillTile.y == seaLevelY - 2 * mountainHeight || hillTile.y == startY || !lastY) {
            //     dy *= -1;
            // };
        };

        let totalHillWidth = 0;
        let hillWidth = 0;
        let hillHeight = 0;
        let hillTopWidth = 0;
        dy = -1;
        for (let i = 0; i < hillPoints.length; i += (hillWidth + 3)) {
            if (hillPoints[i].x + (hillWidth + 3) >= maxHillX) continue;

            hillWidth = randomInt((maxHillX - minHillX) / 3, 7);
            hillHeight = Math.floor(hillWidth / 3);
            hillTopWidth = hillWidth - 2 * hillHeight;

            totalHillWidth += hillWidth

            if (totalHillWidth >= (maxHillX - minHillX)) break;
            if (i + hillWidth >= hillPoints.length) break;
            if (Math.random() < 0.1 || i == 0) continue;

            let imageIndex = 2;
            let offsetY = -1;
            const hillEndY = hillPoints[i + hillWidth].y;
            let flipX = Math.random() < 0.5;
            let offsetX = 0;
            for (let j = 0; j < hillWidth; j++) {
                if (flipX) {
                    offsetX = hillWidth - j;
                } else {
                    offsetX = j;
                };
                const slopeTile = tileMap.getTile(hillPoints[i + offsetX].x, hillPoints[i].y + offsetY);
                if (!slopeTile) continue;


                slopeTile.setType(TileSets.Grass);
                slopeTile.setImageIndex(imageIndex);
                // slopeTile.color = 'red';
                for (let oy = 1; oy < tileMap.map[0].length; oy++) {
                    const nextTileUnder = tileMap.getTile(slopeTile.x, slopeTile.y + oy);
                    // if (!nextTileUnder || nextTileUnder.image || nextTileUnder.waterInstance.amount || nextTileUnder.y >= hillPoints[i + offsetX].y) break;
                    if (
                        !nextTileUnder ||
                        (
                            // !(j == 0 || j == hillWidth - 1) &&
                            (nextTileUnder.y - 1) >= maxHillY - heightMap2[nextTileUnder.x]
                        ) ||
                        nextTileUnder.waterInstance.amount
                    ) break;
                    nextTileUnder.setType(TileSets.Grass);
                    // nextTileUnder.color = 'red';
                };
                console.log(`SLOPE X: ${slopeTile.x} Y: ${slopeTile.y}`, hillWidth);
                if (flipX) {
                    if (!j) {
                        // slopeTile.color = 'red';
                        dy = -1;
                        slopeTile.setImageIndex(4);
                        imageIndex = 4;
                        offsetY += dy;
                        continue;
                    };
                    if (j < hillHeight) {
                        dy = -1;
                        imageIndex = 4;
                        offsetY += dy;
                    } else if (j < hillHeight + hillTopWidth) {
                        dy = 0;
                        imageIndex = 0;
                        offsetY += dy;
                    } else {
                        offsetY += dy;
                        dy = 1;
                        imageIndex = 2;
                    };
                } else {
                    if (offsetX < hillHeight) {
                        dy = -1;
                        imageIndex = 2;
                        offsetY += dy;
                    } else if (offsetX < hillHeight + hillTopWidth) {
                        dy = 0;
                        imageIndex = 0;
                        offsetY += dy;
                    } else {
                        offsetY += dy;
                        dy = 1;
                        imageIndex = 4;
                    };
                }
            };
        };
        // for (const hillPoint of hillPoints) {
        //     const hillTile = tileMap.getTile(hillPoint.x, hillPoint.y - Math.round(heightMap[hillPoint.x]));
        //     if (!hillTile) continue;
        //     hillTile.setType(TileSets.Grass);
        //     hillTile.imageIndex = hillPoint.dy < 0 ? 2 : 4;
        //     hillTile.image = hillTile.tileSet.images[hillTile.imageIndex];
        //     const underHillTile = tileMap.getTile(hillTile.x, hillTile.y + 1);
        //     if (!underHillTile) continue;
        //     underHillTile.setType(TileSets.Grass);
        // };
    },
    addMountainRivers: function (tileMap, seaLevel) {
        const chunkSize = 100;
        for (let startX = 0; startX < tileMap.map.length; startX += chunkSize) {
            let maxTerrainY = tileMap.map[0].length - 1;
            let maxTerrainX = 0;
            for (let x = startX; x < Math.min(startX + chunkSize, tileMap.map.length); x++) {
                for (let y = 0; y < tileMap.map[x].length; y++) {
                    if (tileMap.map[x][y].image && y < maxTerrainY) {
                        maxTerrainY = y;
                        maxTerrainX = x;
                        break;
                    };
                };
            };
            const mountainHeight = tileMap.map[0].length - seaLevel - maxTerrainY;
            console.log({ maxTerrainY, mountainHeight, maxTerrainX });

            const sourceTile = tileMap.getTile(maxTerrainX, maxTerrainY - 1);
            if (!sourceTile || mountainHeight < 6) return;

            for (let ox = 1; ox < Math.max(maxTerrainX, tileMap.map.length - 1 - maxTerrainX); ox++) {
                const tiles = [];
                for (let y = 0; y < tileMap.map[0].length; y++) {
                    const tileLeft = tileMap.getTile(maxTerrainX - ox, y);
                    const tileRight = tileMap.getTile(maxTerrainX + ox, y);
                    if (tileLeft && tileLeft.waterInstance.amount) {
                        tiles.push(tileLeft);
                    };
                    if (tileRight && tileRight.waterInstance.amount) {
                        tiles.push(tileRight);
                    };
                };
                if (tiles.length) {
                    const tile = randomEl(tiles);
                    const dx = tile.x - sourceTile.x;
                    // let failRiver = false;
                    // let offsetY = 0;
                    // for (let offsetX = 1; offsetX < Math.abs(dx); offsetX++) {
                    //     if(failRiver) break;
                    //     const testTileX = tileMap.getTile(sourceTile.x + offsetX * Math.sign(dx), sourceTile.y + offsetY);
                    //     const testTileY = tileMap.getTile(sourceTile.x + (offsetX - 1) * Math.sign(dx), sourceTile.y + offsetY + 1);
                    //     // if() offsetY
                    //     if(!testTileY.waterInstance.amount || !testTileY.image || !testTileX || testTileX.image) offsetY++;
                    //     testTileX.color = 'red';
                    //     testTileY.color = 'red';
                    //     if(testTileX.image && testTileY.image) failRiver = true;
                    // };
                    // if(failRiver) break;
                    const path = aStar(sourceTile, tile, tileMap);
                    if (Math.abs(dx) < 16 || !path.length || path.length > (Math.abs(dx) + Math.abs(tile.y - sourceTile.y))) continue;
                    const blockTile = tileMap.getTile(sourceTile.x - Math.sign(dx), sourceTile.y);
                    if (blockTile) blockTile.setType(TileSets.Grass);
                    const blockTile2 = tileMap.getTile(sourceTile.x, sourceTile.y - 1);
                    if (blockTile2) blockTile2.setType(TileSets.Grass);
                    tile.waterSink = true;
                    const blockTile3 = tileMap.getTile(tile.x, tile.y - 2);
                    if (blockTile3) {
                        // tileMap.map[tile.x][tile.y - 1].waterSource = true;
                        blockTile3.setType(TileSets.Grass);
                    };
                    sourceTile.waterSource = true;

                    for (let x = sourceTile.x; x != tile.x; x += Math.sign(dx)) {
                        tileMap.map[x][sourceTile.y].waterInstance.amount = tileMap.map[x][sourceTile.y].waterInstance.getWaterCapacity();
                        for (let y = sourceTile.y; y < tileMap.map[x].length; y++) {
                            // if (tileMap.map[x][y].caveId) {
                            //     // for (let i = 0; i < tileMap.map[x][y].Caves.length; i++) {
                            //     //     const caveId = tileMap.map[x][y].Caves[i];
                            //     // };
                            //     for (let j = 0; j < tileMap.Caves[tileMap.map[x][y].caveId].tiles.length; j++) {
                            //         tileMap.Caves[tileMap.map[x][y].caveId].tiles[j].waterInstance.amount = tileMap.Caves[tileMap.map[x][y].caveId].tiles[j].waterInstance.getWaterCapacity();
                            //     };
                            //     continue;
                            // };
                            if (tileMap.map[x][y].image) {
                                if (tileMap.map[x + Math.sign(dx)][y].image) {
                                    tileMap.map[x][y].setImageIndex(-1);
                                } else {
                                    tileMap.map[x][y].setImageIndex(1);
                                    // tileMap.map[x][y].imageIndex = 1;
                                    // tileMap.map[x][y].image = tileMap.map[x][y].tileSet.images[tileMap.map[x][y].imageIndex];
                                };
                                break;
                            };
                        };

                        for (let y = sourceTile.y; y < tileMap.map[x].length; y++) {
                            if (tileMap.map[x][y].image) {
                                break;
                            };
                            if (tileMap.map[x][y].caveId) {
                                // for (let i = 0; i < tileMap.map[x][y].Caves.length; i++) {
                                //     const caveId = tileMap.map[x][y].Caves[i];
                                // };
                                for (let j = 0; j < tileMap.Caves[tileMap.map[x][y].caveId].tiles.length; j++) {
                                    tileMap.Caves[tileMap.map[x][y].caveId].tiles[j].waterInstance.amount = tileMap.Caves[tileMap.map[x][y].caveId].tiles[j].waterInstance.getWaterCapacity();
                                };
                                continue;
                            };
                        };
                    };
                    const blockTile4 = tileMap.getTile(sourceTile.x - Math.sign(dx), sourceTile.y + 1);
                    if (blockTile4) blockTile4.setType(TileSets.Grass);
                    const blockTile5 = tileMap.getTile(tile.x, tile.y + 1);
                    if (blockTile5 && !blockTile5.waterInstance.amount) blockTile5.setType(TileSets.Grass);
                    break;
                };
            };
        };
    },
    addRivers: function (tileMap, seaLevel) {
        const chunkSize = 100;
        for (let startX = 0; startX < tileMap.map.length; startX += chunkSize) {
            let maxTerrainY = tileMap.map[0].length - 1;
            let maxTerrainX = 0;
            for (let x = startX; x < Math.min(startX + chunkSize, tileMap.map.length); x++) {
                for (let y = 0; y < tileMap.map[x].length; y++) {
                    if (tileMap.map[x][y].image && y < maxTerrainY) {
                        maxTerrainY = y;
                        maxTerrainX = x;
                        break;
                    };
                };
            };
            const mountainHeight = tileMap.map[0].length - seaLevel - maxTerrainY;
            console.log({ maxTerrainY, mountainHeight, maxTerrainX });

            const sourceTile = tileMap.getTile(maxTerrainX, maxTerrainY - 1);
            if (!sourceTile || mountainHeight < 6) return;

            for (let ox = 1; ox < Math.max(maxTerrainX, tileMap.map.length - 1 - maxTerrainX); ox++) {
                const tiles = [];
                for (let y = 0; y < tileMap.map[0].length; y++) {
                    const tileLeft = tileMap.getTile(maxTerrainX - ox, y);
                    const tileRight = tileMap.getTile(maxTerrainX + ox, y);
                    if (tileLeft && tileLeft.waterInstance.amount) {
                        tiles.push(tileLeft);
                    };
                    if (tileRight && tileRight.waterInstance.amount) {
                        tiles.push(tileRight);
                    };
                };
                if (tiles.length) {
                    const tile = randomEl(tiles);
                    const dx = tile.x - sourceTile.x;
                    if (Math.abs(dx) < 16) continue;
                    const blockTile = tileMap.getTile(sourceTile.x - Math.sign(dx), sourceTile.y);
                    if (blockTile) blockTile.setType(TileSets.Grass);
                    const blockTile2 = tileMap.getTile(sourceTile.x, sourceTile.y - 1);
                    if (blockTile2) blockTile2.setType(TileSets.Grass);
                    tile.waterSink = true;
                    const blockTile3 = tileMap.getTile(tile.x, tile.y - 2);
                    if (blockTile3) {
                        // tileMap.map[tile.x][tile.y - 1].waterSource = true;
                        blockTile3.setType(TileSets.Grass);
                    };
                    sourceTile.waterSource = true;

                    for (let x = sourceTile.x; x != tile.x; x += Math.sign(dx)) {
                        tileMap.map[x][sourceTile.y].waterInstance.amount = tileMap.map[x][sourceTile.y].waterInstance.getWaterCapacity();
                        for (let y = sourceTile.y; y < tileMap.map[x].length; y++) {
                            // if (tileMap.map[x][y].caveId) {
                            //     // for (let i = 0; i < tileMap.map[x][y].Caves.length; i++) {
                            //     //     const caveId = tileMap.map[x][y].Caves[i];
                            //     // };
                            //     for (let j = 0; j < tileMap.Caves[tileMap.map[x][y].caveId].tiles.length; j++) {
                            //         tileMap.Caves[tileMap.map[x][y].caveId].tiles[j].waterInstance.amount = tileMap.Caves[tileMap.map[x][y].caveId].tiles[j].waterInstance.getWaterCapacity();
                            //     };
                            //     continue;
                            // };
                            if (tileMap.map[x][y].image) {
                                if (tileMap.map[x + Math.sign(dx)][y].image) {
                                    tileMap.map[x][y].setImageIndex(-1);
                                } else {
                                    tileMap.map[x][y].setImageIndex(1);
                                    // tileMap.map[x][y].imageIndex = 1;
                                    // tileMap.map[x][y].image = tileMap.map[x][y].tileSet.images[tileMap.map[x][y].imageIndex];
                                };
                                break;
                            };
                        };

                        for (let y = sourceTile.y; y < tileMap.map[x].length; y++) {
                            if (tileMap.map[x][y].image) {
                                break;
                            };
                            if (tileMap.map[x][y].caveId) {
                                // for (let i = 0; i < tileMap.map[x][y].Caves.length; i++) {
                                //     const caveId = tileMap.map[x][y].Caves[i];
                                // };
                                for (let j = 0; j < tileMap.Caves[tileMap.map[x][y].caveId].tiles.length; j++) {
                                    tileMap.Caves[tileMap.map[x][y].caveId].tiles[j].waterInstance.amount = tileMap.Caves[tileMap.map[x][y].caveId].tiles[j].waterInstance.getWaterCapacity();
                                };
                                continue;
                            };
                        };
                    };
                    const blockTile4 = tileMap.getTile(sourceTile.x - Math.sign(dx), sourceTile.y + 1);
                    if (blockTile4) blockTile4.setType(TileSets.Grass);
                    const blockTile5 = tileMap.getTile(tile.x, tile.y + 1);
                    if (blockTile5 && !blockTile5.waterInstance.amount) blockTile5.setType(TileSets.Grass);
                    break;
                };
            };
        };
    },

    generateCaves2(tileMap, seaLevel) {
        tileMap.Caves = {};
        let chunkSizeY = 20;
        for (let startY = tileMap.map[0].length - 1 - seaLevel; startY < tileMap.map[0].length; startY += chunkSizeY) {
            if (startY > 0) chunkSizeY = 20 + randomInt(30);
            let chunkSizeX = 25;
            const chunkPadding = 0;
            let lastCavePoint;
            for (let startX = 0; startX < tileMap.map.length; startX += chunkSizeX) {
                if (startX > 0) chunkSizeX = 25 + randomInt(25);
                console.log({ startX });

                const maxWaterY = tileMap.map.reduce((maxWaterY, col, x) => {
                    if (x < startX || x > startX + chunkSizeX) return maxWaterY;
                    for (let y = col.length - 1; y > 0; y--) {
                        if (col[y].waterInstance.amount) {
                            if (y > maxWaterY) return y;
                            break;
                        };
                    };
                    return maxWaterY;
                }, 0);

                console.log({ maxWaterY });

                const cavePoints = [];
                if (lastCavePoint) cavePoints.push(lastCavePoint);
                const noise = tileMap.map.map(col => col.map(_ => 0));
                for (let x = startX + chunkPadding; x < Math.min(startX + chunkSizeX - chunkPadding, tileMap.map.length) - 3; x++) {
                    for (let y = Math.max(startY + chunkPadding, maxWaterY) + 3; y < Math.min(startY + chunkSizeY - chunkPadding, tileMap.map.length) - 3; y++) {
                        if (x % 8 == 0 || y % 8 == 0) {
                            noise[x][y] = Math.abs(perlin(x + 0.5, y + 0.5)) >= 0.6 ? 1 : 0;
                        } else {
                            noise[Math.floor(x / 8)][Math.floor(y / 8)];
                        };
                        const tile = WorldGenerator.getTile(tileMap.map, x, y);
                        if (!tile) continue;
                        if (noise[x][y] && y < tileMap.map[0].length - 2) {
                            cavePoints.push({ x, y });
                        };
                    };
                };

                if (cavePoints.length <= 4) {
                    continue;
                };

                const caveId = getId();
                console.log(`GENERATE CAVE ${caveId}`);
                tileMap.Caves[caveId] = {
                    tiles: [],
                    color: `rgba(${randomInt(255)}, ${randomInt(255)}, ${randomInt(255)})`
                };

                const randomCavePoint = randomEl(cavePoints);
                const surfaceConnectionPoints = [];
                if (Math.random() < 0.5) {
                    for (let y = 0; y < randomCavePoint.y; y++) {
                        const tile = tileMap.getTile(randomCavePoint.x, y);
                        // if(!tile) continue;
                        // if (tile.waterInstance.amount) break;
                        if (tile.imageIndex > -1) {
                            surfaceConnectionPoints.push(randomCavePoint);
                            surfaceConnectionPoints.push({ x: randomCavePoint.x + Math.round((chunkSizeX / 2) * (Math.random() * 2 - 1)), y });
                            // console.log({ randomCavePoint, x: randomCavePoint.x, y });
                            break;
                        };
                    };
                };

                console.log({ noise });

                for (let i = 0; i < cavePoints.length; i++) {
                    const p0 = cavePoints[i];
                    let p = cavePoints[i + 1];
                    if (i == cavePoints.length - 1) {
                        p = cavePoints[0];
                        // break;
                        if (Math.random() < 0.5) {
                            lastCavePoint = p0;
                        } else {
                            lastCavePoint = null;
                        };
                    };
                    if (WorldGenerator.getTile(tileMap.map, p0.x, p0.y - 1)?.waterInstance.amount) continue;
                    if (WorldGenerator.getTile(tileMap.map, p.x, p.y - 1)?.waterInstance.amount) continue;

                    // if (Math.floor(cavePoints.length / 4) >= Math.floor(i / 4)) {
                    //     if (!(i % 4)) continue;
                    // };
                    // if (cavePoints.length > 2) {
                    //     if (i == Math.floor(cavePoints.length / 2)) continue;
                    // };


                    let radius = 1;
                    let size = radius;
                    let maxSkip = 0;//Math.pow(2 * size + 1, 2) / 4;
                    let skipCount = 0;

                    // if (!(i % 5)) {
                    //     radius = 2;
                    //     size = radius;
                    //     maxSkip = 0;//Math.pow(2 * size + 1, 2) / 4;
                    // };

                    // const pStartY = Math.max(tileMap.map[p.x].length - 1 - (seaLevel - 5), maxWaterY) + 1;
                    // const p0StartY = Math.max(tileMap.map[p0.x].length - 1 - (seaLevel - 5), maxWaterY) + 1;
                    // if (p0.y - radius <= p0StartY || p.y - radius <= pStartY) continue;

                    const dx = p.x - p0.x;
                    const dy = p.y - p0.y;

                    let x = p0.x;
                    let y = p0.y;
                    for (let j = 0; j < Math.max(Math.abs(dx), Math.abs(dy)); j++) {
                        if (j <= Math.abs(dx)) {
                            x += Math.sign(dx);
                        };
                        if (j <= Math.abs(dy)) {
                            y += Math.sign(dy);
                        };

                        for (let xO = -size; xO <= size; xO++) {
                            for (let yO = -size; yO <= size; yO++) {
                                // if (Math.sqrt(Math.pow(xO, 2) + Math.pow(yO, 2)) > radius) {
                                //     continue;
                                // };
                                if (skipCount < maxSkip && Math.random() < 0.5) {
                                    skipCount++;
                                    continue;
                                };
                                const tile = WorldGenerator.getTile(tileMap.map, x + xO, y + yO);
                                if (!tile) continue;
                                if (tileMap.map[x + xO][y + yO - 1].waterInstance.amount) continue;
                                const leftTile = WorldGenerator.getTile(tileMap.map, x + xO - 1, y + yO);
                                const rightTile = WorldGenerator.getTile(tileMap.map, x + xO + 1, y + yO);
                                if (leftTile && leftTile.waterInstance.amount) continue;
                                if (rightTile && rightTile.waterInstance.amount) continue;
                                // tileMap.map[x + xO][y + yO].imageIndex = -1;
                                // tileMap.map[x + xO][y + yO].image = null;
                                // tileMap.Caves[caveId].tiles.push(tileMap.map[x + xO][y + yO]);
                                // if (!tile.Caves) {
                                //     tile.Caves = [];
                                // };
                                // tile.Caves.push(caveId);
                                // tileMap.map[x + xO][y + yO].color = 'black';
                                WorldGenerator.registerCaveTile(tileMap, tileMap.map[x + xO][y + yO], caveId);
                            };
                        };
                    };
                };
                for (let i = 0; i < surfaceConnectionPoints.length; i++) {
                    const p0 = surfaceConnectionPoints[i];
                    let p = surfaceConnectionPoints[i + 1];
                    if (i == surfaceConnectionPoints.length - 1) {
                        p = surfaceConnectionPoints[0];
                        continue;
                        // if (Math.random() < 0.5) {
                        //     lastCavePoint = p0;
                        // } else {
                        //     lastCavePoint = null;
                        // };
                    };

                    // if (Math.floor(surfaceConnectionPoints.length / 4) >= Math.floor(i / 4)) {
                    //     if (!(i % 4)) continue;
                    // };
                    // if (surfaceConnectionPoints.length > 2) {
                    //     if (i == Math.floor(surfaceConnectionPoints.length / 2)) continue;
                    // };


                    let radius = 1;
                    let size = radius;
                    let maxSkip = 0;//Math.pow(2 * size + 1, 2) / 4;
                    let skipCount = 0;

                    // if (!(i % 5)) {
                    //     radius = 2;
                    //     size = radius;
                    //     maxSkip = 0;//Math.pow(2 * size + 1, 2) / 4;
                    // };

                    // const pStartY = Math.max(tileMap.map[p.x].length - 1 - (seaLevel - 5), maxWaterY) + 1;
                    // const p0StartY = Math.max(tileMap.map[p0.x].length - 1 - (seaLevel - 5), maxWaterY) + 1;
                    // if (p0.y - radius <= p0StartY || p.y - radius <= pStartY) continue;

                    const dx = p.x - p0.x;
                    const dy = p.y - p0.y;

                    let x = p0.x;
                    let y = p0.y;
                    let reachWater = false;
                    for (let j = 0; j < Math.max(Math.abs(dx), Math.abs(dy)); j++) {
                        if (j <= Math.abs(dx)) {
                            x += Math.sign(dx);
                        };
                        if (j <= Math.abs(dy)) {
                            y += Math.sign(dy);
                        };

                        for (let xO = -size; xO <= size; xO++) {
                            for (let yO = -size; yO <= size; yO++) {
                                if (reachWater) break;
                                // if (Math.sqrt(Math.pow(xO, 2) + Math.pow(yO, 2)) > radius) {
                                //     continue;
                                // };
                                if (skipCount < maxSkip && Math.random() < 0.5) {
                                    skipCount++;
                                    continue;
                                };
                                const tile = WorldGenerator.getTile(tileMap.map, x + xO, y + yO);
                                if (!tile) continue;
                                const topTile = WorldGenerator.getTile(tileMap.map, x + xO, y + yO - 1);
                                if (topTile && topTile.waterInstance.amount) {
                                    reachWater = true;
                                    continue;
                                };
                                const leftTile = WorldGenerator.getTile(tileMap.map, x + xO - 1, y + yO);
                                if (leftTile && leftTile.waterInstance.amount) {
                                    reachWater = true;
                                    continue;
                                };
                                const rightTile = WorldGenerator.getTile(tileMap.map, x + xO + 1, y + yO);
                                if (rightTile && rightTile.waterInstance.amount) {
                                    reachWater = true;
                                    continue;
                                };
                                // tileMap.map[x + xO][y + yO].imageIndex = -1;
                                // tileMap.map[x + xO][y + yO].image = null;
                                // tileMap.Caves[caveId].tiles.push(tileMap.map[x + xO][y + yO]);
                                // if (!tile.Caves) {
                                //     tile.Caves = [];
                                // };
                                // tile.Caves.push(caveId);
                                // tileMap.map[x + xO][y + yO].color = 'black';
                                WorldGenerator.registerCaveTile(tileMap, tileMap.map[x + xO][y + yO], caveId);
                            };
                        };
                    };
                };
            };
        };

        this.mergeOverlappingCaves(tileMap);
    },
    getWaterDepth(tileMap, x, startY) {
        if (tileMap.map[x][startY].waterInstance.amount == 0) return 0;
        let depth = 0;
        for (let y = startY + 1; y < tileMap.map[0].length - 1; y++) {
            if (tileMap.map[x][y].waterInstance.amount > 0) {
                depth++;
            } else {
                return depth;
            };
        };
        return depth;
    },
    getTile(map, x, y) {
        let tile;
        try {
            tile = map[x][y];
        } catch (error) {
            return null;
        };
        return tile;
    },
    registerCaveTile(tileMap, tile, caveId) {
        tileMap.Caves[caveId].tiles.push(tile);
        // tile.color = tileMap.Caves[caveId].color;
        tile.caveId = caveId;
        // tile.imageIndex = -1;
        // tile.image = null;
        tile.setImageIndex(-1);
    },
    mergeOverlappingCaves(tileMap) {
        let cavesMerged = false;
        let mergedCycle = 0;
        do {
            mergedCycle++;
            console.log({ mergedCycle });
            cavesMerged = false;
            let caveIds = Object.keys(tileMap.Caves);
            if (caveIds.length < 2) return;
            const removedCaveIds = [];
            for (let i = 0; i < caveIds.length; i++) {
                for (let j = i + 1; j < caveIds.length; j++) {
                    if (removedCaveIds.some(removedId => removedId == caveIds[i] || removedId || caveIds[j])) continue;
                    const cave1 = tileMap.Caves[caveIds[i]];
                    const cave2 = tileMap.Caves[caveIds[j]];
                    if (
                        cave1.tiles.some(tile1 => cave2.tiles.some(tile2 => tile1.x == tile2.x && tile1.y == tile2.y)) ||
                        cave1.tiles.some(tile1 => {
                            for (let oX = -1; oX <= 1; oX++) {
                                for (let oY = -1; oY <= 1; oY++) {
                                    const nTile = tileMap.getTile(tileMap, tile1.x + oX, tile1.y + oY);
                                    if (!nTile) continue;
                                    if (cave2.tiles.some(tile2 => tile2.x == nTile.x && tile2.y == nTile.y)) return true;
                                };
                            };
                            return false;
                        })
                    ) {
                        cavesMerged = true;
                        const mergedTileArray = [];
                        for (let k = 0; k < cave1.tiles.length; k++) {
                            mergedTileArray.push(cave1.tiles[k]);
                        };
                        for (let k = 0; k < cave2.tiles.length; k++) {
                            if (mergedTileArray.some(mergedTile => mergedTile.x == cave2.tiles[k].x && mergedTile.y == cave2.tiles[k].y)) {
                                // cave2.tiles[k].color = cave1.color;
                                cave2.tiles[k].caveId = caveIds[i];
                                continue;
                            };
                            mergedTileArray.push(cave2.tiles[k]);
                            // cave2.tiles[k].color = cave1.color;
                            cave2.tiles[k].caveId = caveIds[i];
                        };

                        cave1.tiles = mergedTileArray;
                        removedCaveIds.push(caveIds[j]);
                    };
                };
            };

            for (const caveId of removedCaveIds) {
                delete tileMap.Caves[caveId];
            };
        } while (cavesMerged);
    },
};

class Node {
    constructor(tile, targetTile, parentNode, extraG = 0) {
        const pathWeight = 1;
        this.tile = tile;
        this.parentNode = parentNode;

        if(parentNode) {
            this.g = parentNode.g + (1 + extraG) * pathWeight;
        } else {
            this.g = 0;
        };

        this.h = Math.abs(tile.x - targetTile.x) + Math.abs(tile.y - targetTile.y);
        this.f = this.g + this.h;

        this.tile.node = this;
    };
};

const aStar = function(startingTile, targetTile, TileMap) {
    let currentNode = new Node(startingTile, targetTile);
    let finalNode;

    let open = [currentNode];
    let closed = [];

    while(open.length) {
        let smallestF = Infinity;
        for(let i = 0; i < open.length; i++) {
            if(open[i].f < smallestF) {
                smallestF = open[i].f;
                currentNode = open[i];
            };
        };
        open = open.filter(openNode => !(openNode.tile.x == currentNode.tile.x && openNode.tile.y == currentNode.tile.y));
        closed.push(currentNode);
        if(currentNode.tile.x == targetTile.x && currentNode.tile.y == targetTile.y) {
            finalNode = currentNode;
            break;
        };

        for(let xOffset = -1; xOffset <= 1; xOffset++) {
            for(let yOffset = -1; yOffset <= 1; yOffset++) {
                if(Math.abs(xOffset) == Math.abs(yOffset)) continue;
                // if(xOffset == 0 && yOffset == 0) continue;
                if(closed.find(closedNode => closedNode.tile.x == (currentNode.tile.x + xOffset) && closedNode.tile.y == (currentNode.tile.y + yOffset))) continue;
                const newTile = TileMap.getTile(currentNode.tile.x + xOffset, currentNode.tile.y + yOffset);
                if(!newTile || newTile.image || newTile.y < startingTile.y) continue;
                const newNode = new Node(newTile, targetTile, currentNode);//, Math.abs(xOffset) + Math.abs(yOffset) - 1);
                const existingOpenNode = open.find(openNode => openNode.tile.x == newTile.x && openNode.tile.y == newTile.y)
                if(!existingOpenNode) {
                    open.push(newNode);
                } else {
                    if(newNode.g < existingOpenNode.g) {
                        existingOpenNode.parentNode = currentNode;
                        existingOpenNode.g = newNode.g;
                        existingOpenNode.f = newNode.f;
                    };
                };
            };
        };
    };

    if(!finalNode) {
        return [];
    };
    let path = [];
    while(finalNode.parentNode) {
        path.push(finalNode);
        finalNode = finalNode.parentNode;
    };
    // for(const node of path) node.tile.color = 'red';
    // startingTile.color = 'black';
    // targetTile.color = 'black';
    return path.map(node => node.tile).reverse();
};
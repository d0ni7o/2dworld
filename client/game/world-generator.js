const WorldGenerator = {
    generate: function (tileMap, seaLevel = 10) {

        this.generateGround(tileMap, seaLevel);
        this.generateCaves2(tileMap, seaLevel);
        this.addMountainRivers(tileMap, seaLevel);
        // this.generateHills(tileMap, seaLevel);

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

        heightMap = heightMap.map(h => h + 4);

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
                heightMap[x] = extra + Math.floor(perlin1D(x + 0.5, 2) * 1);// + Math.floor((x - (tileMap.map.length / 2)) / 8);

                // heightMap[x] = 2 * Math.pow(Math.sin(3 * x * Math.PI / 4), 2) + Math.floor(perlin1D(x + 0.5, 10) * 1) + Math.floor((x - (tileMap.map.length / 2)) / 8);
            } else {
                heightMap[x] = heightMap[x - 1] + (Math.random() - 0.5) * Math.floor(perlin1D(x + 0.5, 2) * 1);
            };
        });

        // heightMap = heightMap.map(h => h + 4);

        console.log(`HILL HEIGHT MAP`, heightMap);

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
            // hillPoints.push({ x, y: lastY, dy });
            // if (hillTile.y == seaLevelY - 2 * mountainHeight || hillTile.y == startY || !lastY) {
            //     dy *= -1;
            // };
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
                                    tileMap.map[x][y].image = null;
                                    tileMap.map[x][y].imageIndex = -1;
                                } else {
                                    tileMap.map[x][y].imageIndex = 1;
                                    tileMap.map[x][y].image = tileMap.map[x][y].tileSet.images[tileMap.map[x][y].imageIndex];
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
        const y = tileMap.map[0].length - 1 - (seaLevel - 1);
        let lastWaterX = 0;
        let waterSurfaceLength = 0;
        let maxWaterDepth = 0;
        let totalDepth = 0;
        for (let x = 1; x < tileMap.map.length - 1; x++) {
            if (!lastWaterX) {
                if (tileMap.map[x][y].waterInstance.amount) {
                    lastWaterX = x;
                };
                continue;
            };
            maxWaterDepth = Math.max(maxWaterDepth, WorldGenerator.getWaterDepth(tileMap, x, y));
            totalDepth += WorldGenerator.getWaterDepth(tileMap, x, y);
            if (!tileMap.map[x][y].waterInstance.amount) {
                waterSurfaceLength = x - 1 - lastWaterX;
                if (waterSurfaceLength >= 16 && (totalDepth / waterSurfaceLength) < 6) {
                    if (Math.random() < 0.5) {
                        tileMap.map[lastWaterX][y].waterSource = true;
                        // tileMap.map[lastWaterX][y - 1].waterSource = true;
                        tileMap.map[x - 1][y].waterSink = true;
                    } else {
                        tileMap.map[lastWaterX][y].waterSink = true;
                        tileMap.map[x - 1][y].waterSource = true;
                        // tileMap.map[x - 1][y - 1].waterSource = true;
                    };
                };
                lastWaterX = 0;
                // maxWaterDepth = 0;
                totalDepth = 0;
            };
        };

        return { maxWaterDepth }
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
        tile.imageIndex = -1;
        tile.image = null;
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

const Old = {
    generateCaves(tileMap, seaLevel) {
        const maxWaterY = tileMap.map.reduce((maxWaterY, col, x) => {
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
        const noise = tileMap.map.map(col => col.map(_ => 0));
        for (let x = 2; x < tileMap.map.length - 3; x++) {
            for (let y = Math.max(tileMap.map[x].length - 1 - (seaLevel - 5), maxWaterY) + 3; y < tileMap.map.length - 3; y++) {
                if (x % 8 == 0 || y % 8 == 0) {
                    noise[x][y] = Math.abs(perlin(x + 0.5, y + 0.5)) >= 0.6 ? 1 : 0;
                } else {
                    noise[Math.floor(x / 8)][Math.floor(y / 8)];
                };
                const tile = WorldGenerator.getTile(tileMap.map, x, y);
                if (!tile) continue;
                if (noise[x][y]) {
                    cavePoints.push({ x, y });
                };
            };
        };

        if (cavePoints.length == 1) {
            return;
        };

        console.log({ noise });

        for (let i = 0; i < cavePoints.length; i++) {
            let p = cavePoints[i + 1];
            if (i == cavePoints.length - 1) {
                p = cavePoints[0];
                // break;
            };
            const p0 = cavePoints[i];
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

            const pStartY = Math.max(tileMap.map[p.x].length - 1 - (seaLevel - 5), maxWaterY) + 1;
            const p0StartY = Math.max(tileMap.map[p0.x].length - 1 - (seaLevel - 5), maxWaterY) + 1;
            if (p0.y - radius <= p0StartY || p.y - radius <= pStartY) continue;

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
                        tileMap.map[x + xO][y + yO].imageIndex = -1;
                        tileMap.map[x + xO][y + yO].image = null;
                    };
                };
            };

            if (x != p.x || y != p.y) {
                console.log(`ENDED`, { x, y, p0, p, dx, dy });
            };
        };

        for (let x = 0; x < tileMap.map.length; x++) {
            tileMap.map[x][tileMap.map[x].length - 1].waterSink = true;
        };
    },
    generateCaves2(tileMap, seaLevel) {
        const chunkSize = 50;
        const chunkPadding = 5;
        let lastCavePoint;
        for (let startX = 0; startX < tileMap.map.length; startX += chunkSize) {
            console.log({ startX });

            const maxWaterY = tileMap.map.reduce((maxWaterY, col, x) => {
                if (x < startX || x > startX + chunkSize) return maxWaterY;
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
            for (let x = startX + chunkPadding; x < Math.min(startX + chunkSize - chunkPadding, tileMap.map.length) - 3; x++) {
                for (let y = Math.max(tileMap.map[x].length - 1 - (seaLevel - 5), maxWaterY) + 3; y < tileMap.map.length - 3; y++) {
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

            const randomCavePoint = randomEl(cavePoints);
            const surfaceConnectionPoints = [];
            if (Math.random() < 0.5) {
                for (let y = 0; y < randomCavePoint.y; y++) {
                    const tile = tileMap.getTile(randomCavePoint.x, y);
                    // if(!tile) continue;
                    // if (tile.waterInstance.amount) break;
                    if (tile.imageIndex > -1) {
                        surfaceConnectionPoints.push(randomCavePoint);
                        surfaceConnectionPoints.push({ x: randomCavePoint.x + Math.round((chunkSize / 2) * (Math.random() * 2 - 1)), y });
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

                const pStartY = Math.max(tileMap.map[p.x].length - 1 - (seaLevel - 5), maxWaterY) + 1;
                const p0StartY = Math.max(tileMap.map[p0.x].length - 1 - (seaLevel - 5), maxWaterY) + 1;
                if (p0.y - radius <= p0StartY || p.y - radius <= pStartY) continue;

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
                            tileMap.map[x + xO][y + yO].imageIndex = -1;
                            tileMap.map[x + xO][y + yO].image = null;
                            // tileMap.map[x + xO][y + yO].color = 'black';
                        };
                    };
                };

                if (x != p.x || y != p.y) {
                    console.log(`ENDED`, { x, y, p0, p, dx, dy });
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
                            const topTile = WorldGenerator.getTile(tileMap.map, x + xO, y + yO - 1);
                            if (topTile && topTile.waterInstance.amount) continue;
                            const leftTile = WorldGenerator.getTile(tileMap.map, x + xO - 1, y + yO);
                            if (leftTile && leftTile.waterInstance.amount) continue;
                            const rightTile = WorldGenerator.getTile(tileMap.map, x + xO + 1, y + yO);
                            if (rightTile && rightTile.waterInstance.amount) continue;
                            tileMap.map[x + xO][y + yO].imageIndex = -1;
                            tileMap.map[x + xO][y + yO].image = null;
                            // tileMap.map[x + xO][y + yO].color = 'black';
                        };
                    };
                };

                if (x != p.x || y != p.y) {
                    console.log(`ENDED`, { x, y, p0, p, dx, dy });
                };
            };
        };

        for (let x = 0; x < tileMap.map.length; x++) {
            tileMap.map[x][tileMap.map[x].length - 1].waterSink = true;
        };
    },
    generateCaves3(tileMap, seaLevel) {
        const chunkSize = 40;
        const chunkPadding = 5;
        let lastCavePoint;
        const halfH = Math.floor(tileMap.map[0].length / 2)
        for (let startY = halfH; startY < tileMap.map[0].length; startY += chunkSize) {
            for (let startX = 0; startX < tileMap.map.length; startX += chunkSize) {
                console.log({ startX, startY });

                const maxWaterY = tileMap.map.reduce((maxWaterY, col, x) => {
                    if (x < startX || x > startX + chunkSize) return maxWaterY;
                    for (let y = col.length - 1; y > startY; y--) {
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
                for (let x = startX + chunkPadding; x < Math.min(startX + chunkSize - chunkPadding, tileMap.map.length) - 3; x++) {
                    for (let y = startY + chunkPadding + 3; y < Math.min(startY + chunkSize - chunkPadding, tileMap.map[x].length) - 3; y++) {
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
                    return;
                };

                const randomCavePoint = randomEl(cavePoints);
                const surfaceConnectionPoints = [];
                if (Math.random() < 0.5) {
                    for (let y = 0; y < randomCavePoint.y; y++) {
                        const tile = tileMap.getTile(randomCavePoint.x, y);
                        // if(!tile) continue;
                        if (tile.waterInstance.amount) break;
                        if (tile.imageIndex > -1) {
                            surfaceConnectionPoints.push(randomCavePoint);
                            surfaceConnectionPoints.push({ x: randomCavePoint.x, y });
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

                    const pStartY = Math.max(tileMap.map[p.x].length - 1 - (seaLevel - 5), maxWaterY) + 1;
                    const p0StartY = Math.max(tileMap.map[p0.x].length - 1 - (seaLevel - 5), maxWaterY) + 1;
                    if (p0.y - radius <= p0StartY || p.y - radius <= pStartY) continue;

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
                                tileMap.map[x + xO][y + yO].imageIndex = -1;
                                tileMap.map[x + xO][y + yO].image = null;
                                // tileMap.map[x + xO][y + yO].color = 'black';
                            };
                        };
                    };

                    if (x != p.x || y != p.y) {
                        console.log(`ENDED`, { x, y, p0, p, dx, dy });
                    };
                };
                for (let i = 0; i < surfaceConnectionPoints.length; i++) {
                    const p0 = surfaceConnectionPoints[i];
                    let p = surfaceConnectionPoints[i + 1];
                    if (i == surfaceConnectionPoints.length - 1) {
                        p = surfaceConnectionPoints[0];
                        // break;
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
                                tileMap.map[x + xO][y + yO].imageIndex = -1;
                                tileMap.map[x + xO][y + yO].image = null;
                                // tileMap.map[x + xO][y + yO].color = 'black';
                            };
                        };
                    };

                    if (x != p.x || y != p.y) {
                        console.log(`ENDED`, { x, y, p0, p, dx, dy });
                    };
                };
            };
        };

        for (let x = 0; x < tileMap.map.length; x++) {
            tileMap.map[x][tileMap.map[x].length - 1].waterSink = true;
        };
    },
};
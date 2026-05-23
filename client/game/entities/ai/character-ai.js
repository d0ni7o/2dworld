import { clamp } from "../../utils/utils.js";
import { tileSize } from "../../world/tilemap/tilemap.js";

class Node {
    constructor(tile, targetTile, parentNode, extraG = 0) {
        const pathWeight = 1;
        this.tile = tile;
        this.parentNode = parentNode;

        if (parentNode) {
            this.g = parentNode.g + (1 + extraG) * pathWeight;
        } else {
            this.g = 0;
        };

        this.h = Math.abs(tile.x - targetTile.x) + Math.abs(tile.y - targetTile.y);
        this.f = this.g + this.h;

        this.tile.node = this;
    };
};

export class CharacterAI {
    constructor(character) {
        this.character = character;
        this.character.AI = this;
    };

    update(dt) {

    };

    pathfind(startingTile, targetTile, TileMap) {
        let currentNode = new Node(startingTile, targetTile);
        let finalNode;

        let open = [currentNode];
        let closed = [];

        while (open.length) {
            let smallestF = Infinity;
            for (let i = 0; i < open.length; i++) {
                if (open[i].f < smallestF) {
                    smallestF = open[i].f;
                    currentNode = open[i];
                };
            };
            open = open.filter(openNode => !(openNode.tile.x == currentNode.tile.x && openNode.tile.y == currentNode.tile.y));
            closed.push(currentNode);
            if (currentNode.tile.x == targetTile.x && currentNode.tile.y == targetTile.y) {
                finalNode = currentNode;
                break;
            };

            for (let xOffset = -1; xOffset <= 1; xOffset++) {
                for (let yOffset = -1; yOffset <= 1; yOffset++) {
                    if (Math.abs(xOffset) == Math.abs(yOffset)) continue;
                    // if(xOffset == 0 && yOffset == 0) continue;
                    if (closed.find(closedNode => closedNode.tile.x == (currentNode.tile.x + xOffset) && closedNode.tile.y == (currentNode.tile.y + yOffset))) continue;

                    /** VALID NODE CONDITION */
                    const newTile = TileMap.getTile(currentNode.tile.x + xOffset, currentNode.tile.y + yOffset);
                    if (!newTile) continue;
                    // const tileBelow = newTile.getNeighbour(0, 1);
                    const tilesBelow = [];
                    for (let i = 0; i < 3; i++) {
                        tilesBelow.push(newTile.getNeighbour(0, i + 1));
                    };
                    const ramps = TileMap.room.ramps.filter(ramp => {
                        const tileX = clamp(Math.floor((ramp.p0.x - TileMap.room.x + TileMap.room.width / 2) / tileSize), 0, TileMap.room.width - 1);
                        const tileY = clamp(Math.floor((ramp.p0.y - TileMap.room.y + TileMap.room.width / 2) / tileSize), 0, TileMap.room.width - 1);
                        return tilesBelow.some(tileBelow => tileBelow.x == tileX && tileBelow.y == tileY);
                    });
                    if (newTile.image || (!tilesBelow.some(tile => tile.image) && !ramps.length)) continue;
                    /** */

                    const newNode = new Node(newTile, targetTile, currentNode);//, Math.abs(xOffset) + Math.abs(yOffset) - 1);
                    const existingOpenNode = open.find(openNode => openNode.tile.x == newTile.x && openNode.tile.y == newTile.y)
                    if (!existingOpenNode) {
                        open.push(newNode);
                    } else {
                        if (newNode.g < existingOpenNode.g) {
                            existingOpenNode.parentNode = currentNode;
                            existingOpenNode.g = newNode.g;
                            existingOpenNode.f = newNode.f;
                        };
                    };
                };
            };
        };

        if (!finalNode) {
            return [];
        };
        let path = [];
        while (finalNode.parentNode) {
            path.push(finalNode);
            finalNode = finalNode.parentNode;
        };
        for (const node of path) node.tile.color = 'red';
        // startingTile.color = 'black';
        targetTile.color = 'black';
        return path.map(node => node.tile).reverse();
    };
};
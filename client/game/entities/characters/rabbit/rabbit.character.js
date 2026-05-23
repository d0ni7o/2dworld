import { Character } from "../character.js";
import { RabbitSkeleton } from "../../../animation/skeletons/rabbit/rabbit.skeleton.js";
import { CharacterStats } from "../../stats/stats.js";
import { spawnItem } from "../../items/items.js";
import { clamp, randomInt } from "../../../utils/utils.js";
import { CharacterAI } from "../../ai/character-ai.js";
import { tileSize } from "../../../world/tilemap/tilemap.js";
import { getDistance, getSqDistance } from "../../../physics/geometry.js";

class RabbitAI extends CharacterAI {
    constructor(character) {
        super(character);

        this.spawnX = null;
        this.targetX = null;
        this.dx = 0;

        this.currentState = 'idle';
        this.runTarget = null;

        this.runSqDist = 100 * tileSize * tileSize;
    };

    update(dt) {
        // this.chase(dt);
        this[this.currentState](dt);
    };

    chase(dt) {

        if (!this.chaseTarget) {
            this.chaseTarget = this.character.skeleton.Controller.room.characters.find(human => human.constructor.name == 'Human');
            if (!this.chaseTarget) return;
        };

        if (this.path && this.path.length) {
            this.followPath();
            return;
        };

        const tileX = Math.floor((this.character.skeleton.Controller.x - this.character.skeleton.Controller.room.x + this.character.skeleton.Controller.room.width / 2) / tileSize);
        const tileY = Math.floor((this.character.skeleton.Controller.y - this.character.skeleton.Controller.room.y + this.character.skeleton.Controller.room.height / 2) / tileSize);

        const targetTileX = Math.floor((this.chaseTarget.skeleton.Controller.x - this.chaseTarget.skeleton.Controller.room.x + this.chaseTarget.skeleton.Controller.room.width / 2) / tileSize);
        const targetTileY = Math.floor((this.chaseTarget.skeleton.Controller.y - this.chaseTarget.skeleton.Controller.room.y + this.chaseTarget.skeleton.Controller.room.height / 2) / tileSize);

        this.path = this.pathfind(
            this.character.skeleton.Controller.room.TileMap.map[
            clamp(tileX, 0, this.chaseTarget.skeleton.Controller.room.width - 1)
            ][
            clamp(tileY, 0, this.chaseTarget.skeleton.Controller.room.height - 1)
            ],
            this.character.skeleton.Controller.room.TileMap.map[
            clamp(targetTileX, 0, this.chaseTarget.skeleton.Controller.room.width - 1)
            ][
            clamp(targetTileY, 0, this.chaseTarget.skeleton.Controller.room.height - 1)
            ],
            this.character.skeleton.Controller.room.TileMap
        );
    };

    followPath(dt) {
        this.dx = Math.sign(this.path[0].Position.x - this.character.skeleton.Controller.x);

        if (Math.abs(this.character.skeleton.Controller.x - this.path[0].Position.x) <= tileSize) {
            this.path[0].color = 'lightblue';
            this.path = this.path.slice(1);
            return;
        };

        this.character.jump();
        if (!this.character.skeleton.Controller.Floor.collision || this.character.skeleton.Controller.jumping) {
            if (this.dx > 0) {
                this.character.moveRight(true);
            } else if (this.dx < 0) {
                this.character.moveLeft(true)
            } else {
                if (Math.random() < 0.5) {
                    this.character.moveRight(false);
                } else {
                    this.character.moveLeft(false);
                }
            };
        } else {
            this.character.moveRight(false);
            this.character.moveLeft(false);
        };
    };

    run(dt) {

        if (getSqDistance(this.character.skeleton.Controller, this.runTarget) >= this.runSqDist) {
            this.currentState = 'idle';
            this.runTarget = null;
            return;
        };

        if (this.dx > 0 && this.character.skeleton.Controller.Right.collision) {
            this.dx *= -1;
        } else if (this.dx < 0 && this.character.skeleton.Controller.Left.collision) {
            this.dx *= -1;
        };

        this.character.jump();
        if (!this.character.skeleton.Controller.Floor.collision || this.character.skeleton.Controller.jumping) {
            if (this.dx > 0) {
                this.character.moveRight(true);
            } else if (this.dx < 0) {
                this.character.moveLeft(true)
            } else {
                if (Math.random() < 0.5) {
                    this.character.moveRight(false);
                } else {
                    this.character.moveLeft(false);
                }
            };
        } else {
            this.character.moveRight(false);
            this.character.moveLeft(false);
        };
    };

    checkRunState(dt) {
        if (this.runTarget) {
            this.currentState = 'run';
            return true;
        };

        const closeHuman = this.character.skeleton.Controller.room.characters.find(human =>
            human.constructor.name == 'Human' && getSqDistance(this.character.skeleton.Controller, human.skeleton.Controller) <= this.runSqDist
        );
        if (closeHuman) {
            this.runTarget = closeHuman.skeleton.Controller;
            this.currentState = 'run';
            this.dx = -Math.sign(this.runTarget.x - this.character.skeleton.Controller.x);
            return true;
        };

        return false;
    };

    patrol(dt) {
        if (this.checkRunState(dt)) return;
        if (this.character.Stats.Stamina.currentValue < 10) {
            this.currentState = 'idle';
            return;
        };

        if (this.targetX === null) {
            this.spawnX = this.character.skeleton.Controller.x;
            this.dx = Math.sign(2 * Math.random() - 1);
            this.targetX = this.spawnX + randomInt(20, 10) * tileSize * this.dx;
        };

        this.dx = Math.sign(this.targetX - this.character.skeleton.Controller.x);

        this.character.jump();
        if (!this.character.skeleton.Controller.Floor.collision || this.character.skeleton.Controller.jumping) {
            if (this.dx > 0) {
                this.character.moveRight(true);
            } else if (this.dx < 0) {
                this.character.moveLeft(true)
            } else {
                this.character.moveRight(false);
                this.character.moveLeft(false);
            };
        } else {
            this.character.moveRight(false);
            this.character.moveLeft(false);
        };

        if (Math.abs(this.character.skeleton.Controller.x - this.targetX) < tileSize || this.character.skeleton.Controller.Right.collision || this.character.skeleton.Controller.Left.collision) {
            this.dx = Math.sign(2 * Math.random() - 1);
            this.spawnX = this.character.skeleton.Controller.x;
            this.targetX = this.spawnX + randomInt(20, 10) * tileSize * this.dx;
        };
    };

    idle(dt) {
        if (this.checkRunState(dt)) return;
        if (this.character.Stats.Stamina.currentValue >= this.character.Stats.Stamina.max) {
            this.currentState = 'patrol';
            this.spawnX = this.character.skeleton.Controller.x;
            this.dx = Math.sign(2 * Math.random() - 1);
            this.targetX = this.spawnX + randomInt(20, 10) * tileSize * this.dx;
            return;
        };

        this.character.moveRight(false);
        this.character.moveLeft(false);
    };
};

export class Rabbit extends Character {
    constructor(x, y, scale) {
        super(new RabbitSkeleton(x, y, scale));

        new CharacterStats(this);
        new RabbitAI(this);

        for (let i = 0; i < randomInt(3, 1); i++) {
            this.inventory.add(spawnItem('Meat', x, y));
        };

        this.Stats.Jump.currentValue = 1.5;
        this.Stats.Jump.max = 1.5;

        this.Stats.Stamina.currentValue = 500;
        this.Stats.Stamina.max = 500;

        this.Stats.MovementSpeed.max = 2;
        this.Stats.MovementSpeed.currentValue = 2;

        this.Stats.Hunger.regenRate = 0;
    };
};
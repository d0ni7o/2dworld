import { getId } from "../utils/utils.js";
import { tileSize } from "../world/tilemap/tilemap.js";

export const intersects = function (a, b, c, d, p, q, r, s) {
    let det, gamma, lambda;
    det = (c - a) * (s - q) - (r - p) * (d - b);
    if (det === 0) {
        return false;
    } else {
        lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
        gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    };
};
export const linesCross = function (V1, V2) {
    return intersects(V1.p0.x, V1.p0.y, V1.p.x, V1.p.y, V2.p0.x, V2.p0.y, V2.p.x, V2.p.y);
};
export const intersectionPoint = function (x3, y3, x4, y4, x1, y1, x2, y2) {
    const a1 = { x: x3, y: y3 };
    const a2 = { x: x4, y: y4 };
    const b1 = { x: x1, y: y1 };
    const b2 = { x: x2, y: y2 };
    var ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
    var ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
    var u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
    if (u_b != 0) {
        var ua = ua_t / u_b;
        var ub = ub_t / u_b;
        if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
            const point = {};
            point.x = a1.x + ua * (a2.x - a1.x);
            point.y = a1.y + ua * (a2.y - a1.y);
            return point;
        }
    };
    return false;
};
export const getRayIntersectionPoint = function (V1, V2) {
    return intersectionPoint(V1.p0.x, V1.p0.y, V1.p.x, V1.p.y, V2.p0.x, V2.p0.y, V2.p.x, V2.p.y)
};
export class Vector {
    constructor(x0, y0, x1, y1, color) {
        this.id = getId();
        this.p0 = {
            x: x0,
            y: y0
        };
        this.p = {
            x: x1,
            y: y1
        };
        this.color = color || 'blue';
    };

    dot() {
        return this.p0.x * this.p.x + this.p0.y * this.p.y;
    };

    magnitude() {

    };

    angleWith(Vector) {
        const m1 = (this.p.y - this.p0.y) / (this.p.x - this.p0.x);
        const m2 = (Vector.p.y - Vector.p0.y) / (Vector.p.x - Vector.p0.x);
        const tan = Math.abs((m1 - m2) / (1 + m1 * m2));
        return Math.atan(tan);
    };
};
export class Circle {
    constructor(x, y, radius = minCircleSize, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color || 'blue';

        this.lastX = this.x;
        this.lastY = this.y;

        this.dx = 0;
        this.dy = 0;

        this.ddx = 0;
        this.ddy = 0;

        this.airResistance = 0.98;//Math.max(0.9, Math.random());
    };

    updatePos(dt) {
        this.lastX = this.x;
        this.lastY = this.y;

        this.dx += this.ddx * dt;
        this.dy += this.ddy * dt;

        this.x += this.dx * dt;
        this.y += this.dy * dt;

        this.ddx = 0;
        this.ddy = 0;

        this.dx *= this.airResistance;
        this.dy *= this.airResistance;
    };
};
export class Box {
    constructor(x, y, width = 10, height = 10, rotation, color, isStatic = true) {
        this.id = getId();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color || 'black';
        this.isStatic = isStatic;

        this.rotation = rotation;

        this.lastX = this.x;
        this.lastY = this.y;

        this.dx = 0;
        this.dy = 0;

        this.ddx = 0;
        this.ddy = 0;

        this.offsetX = 0;
        this.offsetY = 0;

        // this.airResistance = 0.99;//Math.max(0.9, Math.random());
        this.airResistanceX = 0.99;//Math.max(0.9, Math.random());
        this.airResistanceY = 0.99;//Math.max(0.9, Math.random());

        this.minX = this.x - this.width / 2;
        this.maxX = this.x + this.width / 2;
        this.minY = this.y - this.height / 2;
        this.maxY = this.y + this.height / 2;

        this.AB = new Vector(this.minX, this.minY, this.maxX, this.minY);
        this.BC = new Vector(this.maxX, this.minY, this.maxX, this.maxY);
        this.CD = new Vector(this.maxX, this.maxY, this.minX, this.maxY);
        this.DA = new Vector(this.minX, this.maxY, this.minX, this.minY);

        this.sides = [this.AB, this.BC, this.CD, this.DA];
    };

    hasTileBelow() {
        const tileX = Math.floor((this.x - this.room.x + this.room.width / 2) / tileSize);
        const tileY = Math.floor((this.y - this.room.y + this.room.height / 2) / tileSize);
        const tile = this.room.TileMap.getTile(tileX, tileY + 1);
        return tile && tile.image;
    };

    updatePos(dt) {
        this.lastX = this.x;
        this.lastY = this.y;

        this.dx += this.ddx * dt;
        this.dy += this.ddy * dt;

        let maxFallSpeed = Math.abs(this.dy) * (dt) > this.height / 2 && this.hasTileBelow();
        if (maxFallSpeed) this.dy = Math.sign(this.dy) * this.height / 2;

        this.x += this.dx * dt;
        this.y += this.dy * dt;

        this.ddx = 0;
        this.ddy = 0;

        this.dx *= this.airResistanceX;
        if (!maxFallSpeed) this.dy *= this.airResistanceY;

        this.updateGeometry();
    };

    updateGeometry() {
        this.minX = this.x - this.width / 2;
        this.maxX = this.x + this.width / 2;
        this.minY = this.y - this.height / 2;
        this.maxY = this.y + this.height / 2;

        this.AB = new Vector(this.minX, this.minY, this.maxX, this.minY);
        this.BC = new Vector(this.maxX, this.minY, this.maxX, this.maxY);
        this.CD = new Vector(this.maxX, this.maxY, this.minX, this.maxY);
        this.DA = new Vector(this.minX, this.maxY, this.minX, this.minY);

        this.sides = [this.AB, this.BC, this.CD, this.DA];
    };
};
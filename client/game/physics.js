const oobBounce = 0.7;
const gForce = 2000;

let rays = [];
let points = [];

const Physics = {
    checkBoxBox(box1, box2) {
        const dx = box1.x - box2.x;
        const wMeet = (box1.width + box2.width) / 2;
        if (Math.abs(dx) >= wMeet) return false;

        const dy = box1.y - box2.y;
        const hMeet = (box1.height + box2.height) / 2;
        if (Math.abs(dy) >= hMeet) return false;

        // box1.collision = true;
        // box2.collision = true;
        return true;
    },
    checkBoxBox2(box1, box2) {
        const dx = box1.x - box2.x;
        const wMeet = (box1.width + box2.width) / 2;
        if (Math.abs(dx) > wMeet) return false;

        const dy = box1.y - box2.y;
        const hMeet = (box1.height + box2.height) / 2;
        if (Math.abs(dy) > hMeet) return false;

        box1.collision = true;
        box2.collision = true;
        return true;
    },
    checkEntityBoxEntityBox(dt, box1, box2) {
        if (!Physics.checkBoxBox2(box1, box2)) return false;

        // const dx = box2.x - box1.x;
        // const dy = box2.y - box1.y;

        // const ddx = box2.dx - box1.dx;
        // const ddy = box2.dy - box1.dy;

        if (Math.random() < 0.5) {
            Physics.checkEntityBoxBox(dt, box1, box2);
            Physics.checkEntityBoxBox(dt, box2, box1);
        } else {
            Physics.checkEntityBoxBox(dt, box2, box1);
            Physics.checkEntityBoxBox(dt, box1, box2);
        };
        // const box1dx = box1.lastX - box1.x;
        // const box2dx = box2.lastX - box2.x;
        // if (box1dx != 0 || box2dx != 0) {
        //     box1.x -= (box2dx / (box1dx + box2dx)) * dx / 2;
        //     box2.x += (box1dx / (box1dx + box2dx)) * dx / 2;
        // };

        return true;
    },
    checkEntityBoxBox(dt, entityBox, box) {
        for (let j = 0; j < box.sides.length; j++) {
            const i = collisionSideOrder[j];
            const extendedBoxSide = new Vector(box.sides[i].p0.x, box.sides[i].p0.y, box.sides[i].p.x, box.sides[i].p.y);
            const minPX = extendedBoxSide.p0.x < extendedBoxSide.p.x ? extendedBoxSide.p0 : extendedBoxSide.p;
            const maxPX = extendedBoxSide.p0.x > extendedBoxSide.p.x ? extendedBoxSide.p0 : extendedBoxSide.p;
            const minPY = extendedBoxSide.p0.y < extendedBoxSide.p.y ? extendedBoxSide.p0 : extendedBoxSide.p;
            const maxPY = extendedBoxSide.p0.y > extendedBoxSide.p.y ? extendedBoxSide.p0 : extendedBoxSide.p;
            if (extendedBoxSide.p0.y == extendedBoxSide.p.y) {
                minPX.x -= (entityBox.width / 2 - 1);
                maxPX.x += entityBox.width / 2 - 1;
            } else {
                minPY.y -= (entityBox.height / 2 - 1);
                maxPY.y += entityBox.height / 2 - 1;
            };
            const intersectionPoint = getRayIntersectionPoint(entityBox.directions[i], extendedBoxSide);
            if (!intersectionPoint) continue;

            const isX = entityBoxDirectionOffsets[i].x != 0;
            if (isX) {
                const dx = entityBox.x - intersectionPoint.x;
                if (Math.abs(dx) < entityBox.width / 2) {
                    entityBox.x = intersectionPoint.x + entityBoxDirectionOffsets[i].x * entityBox.width / 2;
                    entityBox.updateGeometry();
                    entityBox.dx = 0;
                    entityBox.directions[i].collision = true;
                    box.sides[i].collision = true;
                };
            } else {
                const dy = entityBox.y - intersectionPoint.y;
                if (Math.abs(dy) < entityBox.height / 2) {
                    entityBox.y = intersectionPoint.y + entityBoxDirectionOffsets[i].y * entityBox.height / 2;
                    entityBox.updateGeometry();
                    entityBox.dy = 0;
                    entityBox.directions[i].collision = true;
                    box.sides[i].collision = true;
                };
            };
        };
    },
    checkEntityBoxRamp(dt, entityBox, ramp) {
        for (let i = 0; i < entityBox.directions.length; i++) {
            let vector = ramp;
            if (ramp.tile?.imageIndex == 0 || ramp.tile?.imageIndex == 1) {
                if (vector.p0.y == vector.p.y) {
                    vector = new Vector(ramp.p0.x, ramp.p0.y, ramp.p.x, ramp.p.y);
                    const minPX = ramp.p0.x < ramp.p.x ? vector.p0 : vector.p;
                    const maxPX = ramp.p0.x > ramp.p.x ? vector.p0 : vector.p;
                    minPX.x -= (entityBox.width / 2 - 1);
                    maxPX.x += entityBox.width / 2 - 1;
                } else if (vector.p0.x == vector.p.x && (entityBox.x - entityBox.lastX)) {
                    vector = new Vector(ramp.p0.x, ramp.p0.y, ramp.p.x, ramp.p.y);
                    const minPY = ramp.p0.y < ramp.p.y ? vector.p0 : vector.p;
                    const maxPY = ramp.p0.y > ramp.p.y ? vector.p0 : vector.p;
                    minPY.y -= (entityBox.height / 4 - 1);
                    maxPY.y += entityBox.height / 2 - 1;
                };
            };
            const intersectionPoint = getRayIntersectionPoint(entityBox.directions[i], vector);
            if (!intersectionPoint) continue;

            const isX = entityBoxDirectionOffsets[i].x != 0;
            if (isX) {
                const dx = entityBox.x - intersectionPoint.x;
                if (Math.abs(dx) < entityBox.width / 2) {
                    entityBox.x = intersectionPoint.x + entityBoxDirectionOffsets[i].x * entityBox.width / 2;
                    entityBox.updateGeometry();
                    entityBox.dx = 0;
                    entityBox.directions[i].collision = true;
                    ramp.collision = true;
                    break;
                };
            } else {
                const dy = entityBox.y - intersectionPoint.y;
                if (Math.abs(dy) <= entityBox.height / 2) {
                    entityBox.y = intersectionPoint.y + entityBoxDirectionOffsets[i].y * entityBox.height / 2;
                    entityBox.updateGeometry();
                    entityBox.dy = 0;
                    entityBox.directions[i].collision = true;
                    ramp.collision = true;
                    break;
                };
            };
        };
    },
    checkCircleRamp(dt, circle, ramp) {
        const rampDx = ramp.p.x - ramp.p0.x;
        const rampDy = ramp.p.y - ramp.p0.y;
        const rampDist = Math.sqrt(Math.pow(rampDx, 2) + Math.pow(rampDy, 2));
        const rampSin = rampDy / rampDist;
        const rampCos = rampDx / rampDist;

        const dx = ramp.p0.x - circle.x;
        const dy = ramp.p0.y - circle.y;
        const t = -new Vector(dx, dy, rampDx, rampDy).dot() / new Vector(rampDx, rampDy, rampDx, rampDy).dot();

        let closestPoint;
        if (t < 0) {
            closestPoint = ramp.p0;
        } else if (t > 1) {
            closestPoint = ramp.p;
        } else {
            closestPoint = {
                x: ramp.p0.x + t * rampDx,
                y: ramp.p0.y + t * rampDy
            };
        };
        ray = new Vector(circle.x, circle.y, closestPoint.x, closestPoint.y, 'green');
        points.push(closestPoint);
        rays.push(ray);

        let intersectionPoint = getRayIntersectionPoint(ray, ramp);
        if (intersectionPoint) {
            const circleDx = circle.x - circle.lastX;
            const circleDy = circle.y - circle.lastY;
            const idx = intersectionPoint.x - circle.x;
            const idy = intersectionPoint.y - circle.y;
            const idist = Math.sqrt(Math.pow(idx, 2) + Math.pow(idy, 2));
            // ray2 = new Vector(circle.x, circle.y, circle.x, intersectionPoint.y, 'green');
            // rays.push(ray2);

            // const intersectionPoint2 = getRayIntersectionPoint(ray2, ramp);

            const angle3 = Math.atan2(circleDy, circleDx);

            const angle = Math.atan2(idy, idx);

            const directionRay = new Vector(
                circle.lastX,
                circle.lastY,
                circle.lastX + 100 * Math.cos(angle3),
                circle.lastY + 100 * Math.sin(angle3)
            );
            rays.push(directionRay);

            const newAngle = ramp.angleWith(directionRay)
            const testRay = new Vector(
                intersectionPoint.x,
                intersectionPoint.y,
                intersectionPoint.x + Math.cos(newAngle - Math.PI / 2) * 100,
                intersectionPoint.y + Math.sin(newAngle - Math.PI / 2) * 100,
                'purple'
            );
            rays.push(testRay);
            if (idist >= circle.radius) return false;
            const ratio = idist / circle.radius;
            const icos = idx / idist;
            const isin = idy / idist;

            // circle.x = intersectionPoint.x + Math.cos(angle) * (idist);
            // circle.y = intersectionPoint.y + Math.sin(angle) * (idist);
            // circle.dy = 0;
            // circle.updatePos(dt);

            circle.x = circle.lastX;
            circle.y = circle.lastY;
            circle.dx *= -oobBounce;
            circle.dy *= -oobBounce;

            ramp.collision = true;
            ray.collision = true;
            // points.push(intersectionPoint);

            // rays.push(new Vector(circle.x, circle.y, circle.x + circle.dx * 10, circle.y + circle.dy * 10));


            circle.x = intersectionPoint.x + idist * icos;
            circle.y = intersectionPoint.y + idist * isin;
            circle.dx += idist * icos;
            circle.dy += idist * isin;

            // circle.dx *= -oobBounce * icos;
            // circle.dy *= -1 * icos;

        };
        // }
    },
    checkCircleBox(dt, circle, box) {
        // temporary variables to set edges for testing
        let testX = circle.x;
        let testY = circle.y;

        // which edge is closest?
        if (circle.x < box.x - box.width / 2) testX = box.x - box.width / 2;      // test left edge
        else if (circle.x > box.x + box.width / 2) testX = box.x + box.width / 2;   // right edge
        if (circle.y < box.y - box.height / 2) testY = box.y - box.height / 2;      // top edge
        else if (circle.y > box.y + box.height / 2) testY = box.y + box.height / 2;   // bottom edge

        // get distance from closest edges
        let distX = circle.x - testX;
        let distY = circle.y - testY;
        let distance = Math.sqrt((distX * distX) + (distY * distY));
        // if the distance is less than the radius, collision!
        if (distance <= circle.radius) {
            circle.collision = true;
            box.collision = true;

            const dx = circle.x - circle.lastX;
            const dy = circle.y - circle.lastY;
            if (dx || dy || !box.isStatic) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                const cos = dx / dist;
                const sin = dy / dist;

                const ray = new Vector(circle.lastX - circle.radius * cos, circle.lastY - circle.radius * sin, circle.x + circle.radius * cos, circle.y + circle.radius * sin, 'green');
                const centerRay = new Vector(circle.x, circle.y, box.x, box.y, 'green');
                // rays.push(ray);

                for (const side of box.sides) {
                    let ray;
                    if (side.p0.x == side.p.x) {
                        ray = new Vector(circle.x, circle.y, side.p0.x, circle.y, 'green');
                    } else {
                        ray = new Vector(circle.x, circle.y, circle.x, side.p0.y, 'green');
                    };
                    // rays.push(ray);
                    let intersectionPoint = getRayIntersectionPoint(ray, side);
                    if (intersectionPoint) {

                        if (side.p0.x == side.p.x) {
                            const minY = Math.min(side.p0.y, side.p.y);
                            const maxY = Math.max(side.p0.y, side.p.y);
                            intersectionPoint.y = Math.max(minY, Math.min(maxY, intersectionPoint.y));
                        } else {
                            const minX = Math.min(side.p0.x, side.p.x);
                            const maxX = Math.max(side.p0.x, side.p.x);
                            intersectionPoint.x = Math.max(minX, Math.min(maxX, intersectionPoint.x));
                        };
                        const idx = intersectionPoint.x - circle.x;
                        const idy = intersectionPoint.y - circle.y;
                        const idist = Math.sqrt(Math.pow(idx, 2) + Math.pow(idy, 2));
                        if (idist > circle.radius) continue;
                        side.collision = true;
                        const icos = idx / idist;
                        const isin = idy / idist;
                        // points.push(intersectionPoint);
                        circle.x = intersectionPoint.x - circle.radius * icos;
                        circle.y = intersectionPoint.y - circle.radius * isin;

                        if (side.p0.x == side.p.x) {
                            if (circle.dx) circle.dx *= -oobBounce;
                        } else {
                            if (circle.dy) circle.dy *= -oobBounce;
                        };

                        circle.dx -= 100 * (box.lastX - box.x);
                        circle.dy += 100 * (box.lastY - box.y);
                    };
                    // intersectionPoint = getRayIntersectionPoint(centerRay, side);
                    // if (intersectionPoint) {
                    //     const dx = intersectionPoint.x - circle.x;
                    //     const dy = intersectionPoint.y - circle.y;
                    //     if (dx || dy) {
                    //         const dist = Math.sqrt(dx * dx + dy * dy);
                    //         if (dist > circle.radius) continue;
                    //         const cos = dx / dist;
                    //         const sin = dy / dist;
                    //         circle.x = intersectionPoint.x - circle.radius * cos;
                    //         circle.y = intersectionPoint.y - circle.radius * sin;
                    //         points.push(intersectionPoint);
                    //         if (side.p0.x == side.p.x) {
                    //             circle.dx -= dx * dist;
                    //         };
                    //         if (side.p0.y == side.p.y) {
                    //             circle.dy -= dy * dist;
                    //         };
                    //         rays.push(centerRay);
                    //         // circle.x = intersectionPoint.x - circle.radius * cos;
                    //         // circle.y = intersectionPoint.y - circle.radius * sin;
                    //     };
                    // };
                };
            }

            const unitX = distX / distance;
            const unitY = distY / distance;
            // console.log(unitX, unitY, distance, distX, distY);
            if (distance != 0) {
                circle.x = testX + circle.radius * unitX;
                circle.y = testY + circle.radius * unitY;
            };
            // if (Math.abs(distX) > Math.abs(distY)) {
            //     circle.dx *= -oobBounce;
            // } else if (Math.abs(distX) < Math.abs(distY)) {
            //     circle.dx *= -oobBounce;
            //     // circle.dy *= -oobBounce;

            //     // if (circle.y < box.y) circle.ddy -= gForce;
            // } else {
            //     circle.dx *= -oobBounce;
            //     // circle.dy *= -oobBounce;

            //     // if (circle.y < box.y) circle.ddy -= gForce;
            // };
            const boxMinX = box.x - box.width / 2;
            const boxMinY = box.y - box.height / 2;
            const boxMaxX = box.x + box.width / 2;
            const boxMaxY = box.y + box.height / 2;
            const circleMinX = circle.x - circle.radius;
            const circleMinY = circle.y - circle.radius;
            const circleMaxX = circle.x + circle.radius;
            const circleMaxY = circle.y + circle.radius;

            const xInside = (circle.x < boxMaxX && circle.x > boxMinX)// || (circleMaxX < boxMaxX && circleMaxX > boxMinX);
            const yInside = (circle.y < boxMaxY && circle.y > boxMinY)// || (circleMaxX < boxMaxY && circleMaxX > boxMinY);
            if (xInside && yInside) {
                const dMinX = Math.abs(circle.x - boxMinX);
                const dMaxX = Math.abs(circle.x - boxMaxX);
                const dMinY = Math.abs(circle.y - boxMinY);
                const dMaxY = Math.abs(circle.y - boxMaxY);

                const minX = Math.min(dMinX, dMaxX);
                const minY = Math.min(dMinY, dMaxY);

                if (minX < minY) {
                    circle.x += dMinX < dMaxX ? -dMinX : dMaxX;
                    // circle.dx += (dMinX < dMaxX ? -dMinX : dMaxX) * dt * dt;
                } else if (minX > minY) {
                    circle.y += dMinY < dMaxY ? -dMinY : dMaxY;
                    // circle.dy += (dMinY < dMaxY ? -dMinY : dMaxY) * dt * dt;
                } else {
                    circle.x += dMinX < dMaxX ? -dMinX : dMaxX;
                    // circle.dx += (dMinX < dMaxX ? -dMinX : dMaxX) * dt * dt;
                    circle.y += dMinY < dMaxY ? -dMinY : dMaxY;
                    // circle.dy += (dMinY < dMaxY ? -dMinY : dMaxY) * dt * dt;
                };
            };
            return true;
        }
        return false;
        // const boxMinX = box.x - box.width / 2;
        // const boxMinY = box.y - box.height / 2;
        // const boxMaxX = box.x + box.width / 2;
        // const boxMaxY = box.y + box.height / 2;
        // const circleMinX = circle.x - circle.radius;
        // const circleMinY = circle.y - circle.radius;
        // const circleMaxX = circle.x + circle.radius;
        // const circleMaxY = circle.y + circle.radius;

        // const lapMinX = boxMinX < circleMaxX && boxMinX > circleMinX;
        // const lapMinY = boxMinY < circleMaxY && boxMinY > circleMinY;
        // const lapMaxX = boxMaxX < circleMaxX && boxMaxX > circleMinX;
        // const lapMaxY = boxMaxY < circleMaxY && boxMaxY > circleMinY;
        // if (lapMinX && lapMinY) {
        //     circle.collision = true;
        //     box.collision = true;
        //     return true;
        // };
        // if (lapMinX && lapMaxY) {
        //     circle.collision = true;
        //     box.collision = true;
        //     return true;
        // };
        // if (lapMaxX && lapMinY) {
        //     circle.collision = true;
        //     box.collision = true;
        //     return true;
        // };
        // if (lapMaxX && lapMaxY) {
        //     circle.collision = true;
        //     box.collision = true;
        //     return true;
        // };
        // return false;

    },
    checkCircleCircle(dt, circle1, circle2) {
        const dx = circle2.x - circle1.x;
        const dy = circle2.y - circle1.y;
        const dSum = Math.pow(dx, 2) + Math.pow(dy, 2)
        const rSum = circle1.radius + circle2.radius
        const collision = dSum < Math.pow(rSum, 2);

        if (!collision) return false;

        circle1.collision = true;
        circle2.collision = true;
        const dist = Math.sqrt(dSum);
        // const overlap = rSum - dist;

        const n_x = dx / dist;
        const n_y = dy / dist;

        const p = 2 * (circle1.dx * n_x + circle1.dy * n_y - circle2.dx * n_x - circle2.dy * n_y) / (circle1.radius + circle2.radius);

        // const proportion1 = circle1 / rSum;

        const midX = (circle1.x + circle2.x) / 2;
        const midY = (circle1.y + circle2.y) / 2;

        circle1.lastX = circle1.x;
        circle1.lastY = circle1.y;
        circle2.lastX = circle2.x;
        circle2.lastY = circle2.y;


        circle1.x = midX + circle1.radius * (-1) * n_x;
        circle1.y = midY + circle1.radius * (-1) * n_y;
        circle2.x = midX + circle2.radius * n_x;
        circle2.y = midY + circle2.radius * n_y;

        circle1.dx -= p * circle1.radius * n_x;
        circle1.dy -= p * circle1.radius * n_y;
        circle2.dx += p * circle2.radius * n_x;
        circle2.dy += p * circle2.radius * n_y;

        return true;
    },
    checkOOB(circle) {
        if ((circle.x + circle.radius) > Screen.main.width) {
            circle.x = Screen.main.width - circle.radius;
            circle.dx *= -oobBounce;
        };
        if ((circle.x - circle.radius) < 0) {
            circle.x = circle.radius;
            circle.dx *= -oobBounce;
        };
        if ((circle.y + circle.radius) > Screen.main.height) {
            circle.y = Screen.main.height - circle.radius;
            circle.dy *= -oobBounce;
        };
        if ((circle.y - circle.radius) < 0) {
            circle.y = circle.radius;
            circle.dy *= -oobBounce;
        };
    },
    // checkOOB(bone) {
    //     if ((bone.x + bone.width / 2) > Screen.main.width) {
    //         bone.x = Screen.main.width - bone.width / 2;
    //     };
    //     if ((bone.x - bone.width / 2) < 0) {
    //         bone.x = bone.width / 2;
    //     };
    //     if ((bone.y + bone.height / 2) > Screen.main.height) {
    //         bone.y = Screen.main.height - bone.height / 2;
    //     };
    //     if ((bone.y - bone.height / 2) < 0) {
    //         bone.y = bone.height / 2;
    //     };
    // },
};
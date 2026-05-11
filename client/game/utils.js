
let loading = 0;
const getId = () => Math.floor(Math.random() * (999999 - 100000)) + 100000;
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));


const spawnCircle = function (x, y, radius = minCircleSize + Math.floor(Math.random() * maxCircleSize)) {
    if (!circlesFit(radius)) return;
    World.rooms[0].circles.push(new Circle(x, y, radius));
};
const spawnEntityBox = function (
    x = Math.floor(Math.random() * Screen.main.width),
    y = Math.floor(Math.random() * Screen.main.height),
    width = Math.floor(Math.random() * 20 + 20),
    height = Math.floor(Math.random() * 80 + 80),
) {
    entityBoxes.push(new EntityBox(x, y, width, height));
};
const circlesFit = function (radius) {
    return true;
    let totalWidth = radius;
    for (const circle of circles) {
        totalWidth += circle.radius * 2;
    };
    return totalWidth < Screen.main.width;
};
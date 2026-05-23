let loading = 0;
export const getId = () => Math.floor(Math.random() * (999999 - 100000)) + 100000;
export const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
export const startLoading = (name) => { console.log(`START LOADING ${name}`); loading++ };
export const stopLoading = (name) => { console.log(`STOP LOADING ${name}`); loading-- };
export const isLoading = () => loading > 0;
export const randomEl = (array) => array[Math.floor(Math.random() * array.length)];
export const randomInt = (max, min = 0) => Math.floor(Math.random() * (max - min + 1)) + min;


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
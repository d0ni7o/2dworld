// Fade function as defined by Ken Perlin
function fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
}

// Linear interpolation
function lerp(a, b, t) {
    return a + t * (b - a);
}

// 1D Perlin Noise Function
function perlin1D(x, maxRng = 2) {
    let x0 = Math.floor(x); // Left integer bound
    let x1 = x0 + 1;        // Right integer bound

    let t = x - x0;         // Local position in the interval [0, 1]
    let fadeT = fade(t);    // Smooth local position

    // Gradients for the integer bounds (using pseudo-random)
    const rng1 = randomInt(maxRng);
    const rng2 = randomInt(maxRng)
    let g0 = Math.sin(x0 * rng1) * rng2;
    let g1 = Math.sin(x1 * rng1) * rng2;

    // Dot product between distance vectors and gradients
    let d0 = g0 * t;
    let d1 = g1 * (t - 1);

    // Interpolate and return
    return lerp(d0, d1, fadeT);
}

function grad(hash, x, y) {
    const h = hash & 3;
    const u = h < 2 ? x : y;
    const v = h < 2 ? y : x;
    return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
};

const p = new Array(256).fill(0).map((_, i) => i).sort((a, b) => Math.random() - 0.5);


function perlin(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x)
    const yf = y - Math.floor(y)

    const u = fade(xf)
    const v = fade(yf)

    const aa = p[p[X] + Y]
    const ab = p[p[X] + Y + 1]
    const ba = p[p[X + 1] + Y]
    const bb = p[p[X + 1] + Y + 1]

    const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
    const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);

    return lerp(x1, x2, v)
};
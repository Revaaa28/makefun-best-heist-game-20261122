// A tiny seeded random generator (mulberry32) so floor textures, patrol timings
// and staged screenshots are identical on every run for the same seed.

export function createRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A random number in [min, max) from a generator made by createRandom. */
export function range(random, min, max) {
  return min + random() * (max - min);
}

/** Pick one element of an array from a generator made by createRandom. */
export function pick(random, array) {
  return array[Math.floor(random() * array.length)];
}

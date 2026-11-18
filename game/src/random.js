// A small seeded random number generator (mulberry32): the same seed gives the same city and the
// same screenshot scenes, which is what makes both repeatable.

export function createRandom(seed) {
  let a = seed | 0;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A small helper bundle around one seeded stream: ranges, picks and jitter. */
export function createDice(seed) {
  const random = createRandom(seed);
  return {
    random,
    /** A float in [a, b). */
    range: (a, b) => a + (b - a) * random(),
    /** An integer in [a, b], both ends included. */
    int: (a, b) => a + Math.floor(random() * (b - a + 1)),
    /** One element of the list. */
    pick: (list) => list[Math.min(list.length - 1, Math.floor(random() * list.length))],
    /** True with probability p. */
    chance: (p) => random() < p,
    /** A float in [-amount, amount). */
    jitter: (amount) => (random() * 2 - 1) * amount,
  };
}

const DIRS = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

export function createInput() {
  let next = null;

  function reset() {
    next = null;
  }

  function keyToDirection(key) {
    if (!key) return null;
    const k = key.length === 1 ? key.toLowerCase() : key;
    return DIRS[k] ?? null;
  }

  function setDirection(dir) {
    if (!dir) return;
    next = dir;
  }

  function consumeDirection() {
    const d = next;
    next = null;
    return d;
  }

  return {
    reset,
    keyToDirection,
    setDirection,
    consumeDirection,
  };
}


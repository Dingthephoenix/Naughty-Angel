function sameCell(a, b) {
  return a.x === b.x && a.y === b.y;
}

function isOpposite(a, b) {
  return a.x === -b.x && a.y === -b.y;
}

function clampInt(n, min, max) {
  return Math.max(min, Math.min(max, n | 0));
}

function randomCell(cols, rows) {
  return {
    x: (Math.random() * cols) | 0,
    y: (Math.random() * rows) | 0,
  };
}

function makeInitialSnake(cols, rows) {
  const x = clampInt((cols / 2) | 0, 2, cols - 3);
  const y = clampInt((rows / 2) | 0, 0, rows - 1);
  return [
    { x, y },
    { x: x - 1, y },
    { x: x - 2, y },
  ];
}

export function createGame(config) {
  const { cols, rows } = config;

  let status = "idle"; // idle | running | paused | gameover
  let score = 0;
  let snake = makeInitialSnake(cols, rows);
  let dir = { x: 1, y: 0 };
  let nextDir = { x: 1, y: 0 };
  let food = { x: 0, y: 0 };

  function placeFood() {
    if (snake.length >= cols * rows) {
      status = "gameover";
      return;
    }

    for (let i = 0; i < 5000; i++) {
      const candidate = randomCell(cols, rows);
      const onSnake = snake.some((c) => sameCell(c, candidate));
      if (!onSnake) {
        food = candidate;
        return;
      }
    }

    // Fallback: deterministic scan (shouldn't happen in practice)
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const candidate = { x, y };
        const onSnake = snake.some((c) => sameCell(c, candidate));
        if (!onSnake) {
          food = candidate;
          return;
        }
      }
    }
  }

  function reset() {
    status = "idle";
    score = 0;
    snake = makeInitialSnake(cols, rows);
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    placeFood();
  }

  function start() {
    if (status !== "idle") return;
    status = "running";
  }

  function pause() {
    if (status === "running") status = "paused";
  }

  function resume() {
    if (status === "paused") status = "running";
  }

  function setNextDirection(d) {
    if (!d) return;
    // Block opposite direction when length > 1
    if (snake.length > 1 && isOpposite(d, dir)) return;
    nextDir = d;
  }

  function tick() {
    if (status !== "running") return;

    // Apply direction once per tick
    if (nextDir && !isOpposite(nextDir, dir)) dir = nextDir;

    const head = snake[0];
    const newHead = { x: head.x + dir.x, y: head.y + dir.y };
    const willEat = sameCell(newHead, food);

    // Wall collision
    if (newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows) {
      status = "gameover";
      return;
    }

    // Self collision: allow moving into current tail if we are not eating (tail will move away)
    const bodyToCheck = willEat ? snake : snake.slice(0, -1);
    const hitSelf = bodyToCheck.some((c) => sameCell(c, newHead));
    if (hitSelf) {
      status = "gameover";
      return;
    }

    snake.unshift(newHead);

    if (willEat) {
      score += 1;
      placeFood();
    } else {
      snake.pop();
    }
  }

  function getState() {
    return {
      status,
      score,
      snake: snake.slice(),
      food: { ...food },
      cols,
      rows,
      dir: { ...dir },
    };
  }

  reset();

  return {
    start,
    pause,
    resume,
    reset,
    tick,
    setNextDirection,
    getState,
  };
}


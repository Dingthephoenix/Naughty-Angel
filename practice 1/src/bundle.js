// Single-file bundle for easy sharing:
// - avoids `type="module"` so `file://` opening works in more browsers
// - contains createGame/createRenderer/createInput + the main loop

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

function createGame(config) {
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
    if (
      newHead.x < 0 ||
      newHead.x >= cols ||
      newHead.y < 0 ||
      newHead.y >= rows
    ) {
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

function px(cell, cellSize) {
  return cell * cellSize;
}

function createRenderer(ctx, config) {
  const { cellSize, cols, rows } = config;

  function clear() {
    ctx.clearRect(0, 0, cols * cellSize, rows * cellSize);
  }

  function drawGrid() {
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "rgba(255,255,255,0.14)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(px(x, cellSize) + 0.5, 0);
      ctx.lineTo(px(x, cellSize) + 0.5, rows * cellSize);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, px(y, cellSize) + 0.5);
      ctx.lineTo(cols * cellSize, px(y, cellSize) + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFood(food) {
    const x = px(food.x, cellSize);
    const y = px(food.y, cellSize);
    const r = cellSize * 0.38;

    ctx.save();
    ctx.translate(x + cellSize / 2, y + cellSize / 2);
    const g = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.2);
    g.addColorStop(0, "rgba(34,197,94,0.95)");
    g.addColorStop(1, "rgba(34,197,94,0.35)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSnake(snake) {
    ctx.save();
    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i];
      const x = px(seg.x, cellSize);
      const y = px(seg.y, cellSize);

      const isHead = i === 0;
      const radius = cellSize * 0.32;

      ctx.fillStyle = isHead
        ? "rgba(124,92,255,0.95)"
        : "rgba(124,92,255,0.55)";
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.lineWidth = 1;

      roundedRect(ctx, x + 2, y + 2, cellSize - 4, cellSize - 4, radius);
      ctx.fill();
      ctx.stroke();

      if (isHead) drawEyes(x, y);
    }
    ctx.restore();
  }

  function drawEyes(x, y) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    const ex = x + cellSize * 0.35;
    const ey = y + cellSize * 0.34;
    const r = cellSize * 0.07;
    ctx.beginPath();
    ctx.arc(ex, ey, r, 0, Math.PI * 2);
    ctx.arc(ex + cellSize * 0.3, ey, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function roundedRect(c, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + w, y, x + w, y + h, rr);
    c.arcTo(x + w, y + h, x, y + h, rr);
    c.arcTo(x, y + h, x, y, rr);
    c.arcTo(x, y, x + w, y, rr);
    c.closePath();
  }

  function render(state) {
    clear();
    drawGrid();
    drawFood(state.food);
    drawSnake(state.snake);

    // Subtle vignette
    ctx.save();
    const v = ctx.createRadialGradient(
      (cols * cellSize) / 2,
      (rows * cellSize) / 2,
      cellSize * 2,
      (cols * cellSize) / 2,
      (rows * cellSize) / 2,
      Math.max(cols, rows) * cellSize
    );
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.18)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, cols * cellSize, rows * cellSize);
    ctx.restore();
  }

  return { render };
}

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

function createInput() {
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

(function main() {
  const canvas = document.getElementById("gameCanvas");
  const scoreValue = document.getElementById("scoreValue");
  const statusOverlay = document.getElementById("statusOverlay");
  const startBtn = document.getElementById("startBtn");
  const resetBtn = document.getElementById("resetBtn");

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("Canvas element not found.");
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available.");

  const config = {
    cellSize: 20,
    stepMs: 120,
    cols: Math.floor(canvas.width / 20),
    rows: Math.floor(canvas.height / 20),
  };

  const renderer = createRenderer(ctx, config);
  const input = createInput();
  const game = createGame(config);

  function setOverlay(text, visible) {
    statusOverlay.hidden = !visible;
    statusOverlay.textContent = visible ? text : "";
  }

  function syncUI() {
    scoreValue.textContent = String(game.getState().score);
  }

  function renderFrame() {
    const state = game.getState();
    renderer.render(state);
    syncUI();

    if (state.status === "running") {
      startBtn.textContent = "运行中";
      startBtn.disabled = true;
    } else if (state.status === "paused") {
      startBtn.textContent = "继续";
      startBtn.disabled = false;
    } else {
      startBtn.textContent = "开始";
      startBtn.disabled = false;
    }

    if (state.status === "idle") setOverlay("按「开始」或直接按方向键开始", true);
    else if (state.status === "paused") setOverlay("已暂停\n空格继续", true);
    else if (state.status === "gameover")
      setOverlay(`游戏结束\n分数：${state.score}\n按 R 或点「重开」`, true);
    else setOverlay("", false);
  }

  let rafId = 0;
  let lastTs = 0;
  let acc = 0;

  function frame(ts) {
    rafId = requestAnimationFrame(frame);
    const dt = ts - lastTs;
    lastTs = ts;
    if (!Number.isFinite(dt) || dt <= 0) return;

    const state = game.getState();
    if (state.status === "running") {
      acc += dt;
      while (acc >= config.stepMs) {
        const desiredDir = input.consumeDirection();
        if (desiredDir) game.setNextDirection(desiredDir);
        game.tick();
        acc -= config.stepMs;
        if (game.getState().status !== "running") break;
      }
    }

    renderFrame();
  }

  function startLoop() {
    cancelAnimationFrame(rafId);
    lastTs = performance.now();
    acc = 0;
    rafId = requestAnimationFrame(frame);
  }

  function startGame() {
    if (game.getState().status === "idle") game.start();
    if (game.getState().status === "paused") game.resume();
  }

  startBtn.addEventListener("click", () => {
    startGame();
  });

  resetBtn.addEventListener("click", () => {
    game.reset();
    input.reset();
    renderFrame();
  });

  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();

    if (key === " " || key === "spacebar") {
      e.preventDefault();
      const s = game.getState().status;
      if (s === "running") game.pause();
      else if (s === "paused") game.resume();
      return;
    }

    if (key === "r") {
      game.reset();
      input.reset();
      renderFrame();
      return;
    }

    const dir = input.keyToDirection(e.key);
    if (dir) {
      e.preventDefault();
      if (game.getState().status === "idle") game.start();
      input.setDirection(dir);
    }
  });

  startLoop();
  renderFrame();
})();


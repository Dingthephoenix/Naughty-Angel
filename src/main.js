import { createGame } from "./game.js";
import { createRenderer } from "./render.js";
import { createInput } from "./input.js";

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


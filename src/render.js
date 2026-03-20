function px(cell, cellSize) {
  return cell * cellSize;
}

export function createRenderer(ctx, config) {
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

      ctx.fillStyle = isHead ? "rgba(124,92,255,0.95)" : "rgba(124,92,255,0.55)";
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


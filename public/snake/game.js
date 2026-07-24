(function () {
  "use strict";

  const CELL = 20;
  const COLS = 28;
  const ROWS = 28;
  const W = COLS * CELL;
  const H = ROWS * CELL;

  const FRUIT_KEYS = [
    "banana", "orange", "grape", "strawberry", "cherry",
    "mushroom", "watermelon", "kiwi", "peach", "apple",
    "tomato", "berries", "pineapple", "melon",
  ];

  const FRUIT_SCORES = {
    banana: 10, orange: 15, grape: 12, strawberry: 20,
    cherry: 25, mushroom: 8, watermelon: 30, kiwi: 12,
    peach: 18, apple: 20, tomato: 10, berries: 25,
    pineapple: 20, melon: 25,
  };

  const BASE_INTERVAL = 150;
  const MIN_INTERVAL  = 60;

  let canvas, ctx;
  let snake, dir, nextDir, food, score;
  let gameInterval = null;
  let state = "idle"; // idle | running | dead
  let fruitImg = null;
  let atlasReady = false;

  // ── Init ────────────────────────────────────────────────────────────────────

  function init() {
    canvas = document.getElementById("canvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");

    fruitImg = new Image();
    fruitImg.onload = function () { atlasReady = true; };
    fruitImg.src = "/snake/snake-assets/fruits.png";

    resetState();
    document.addEventListener("keydown", handleKey);
    requestAnimationFrame(drawLoop);
    window.snakeReset = resetState;
  }

  function resetState() {
    const mx = Math.floor(COLS / 2);
    const my = Math.floor(ROWS / 2);
    snake = [
      { x: mx,     y: my },
      { x: mx - 1, y: my },
      { x: mx - 2, y: my },
    ];
    dir     = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score   = 0;
    food    = spawnFood();
    state   = "idle";
    if (gameInterval) { clearInterval(gameInterval); gameInterval = null; }
  }

  // ── Game logic ──────────────────────────────────────────────────────────────

  function startGame() {
    state = "running";
    scheduleStep();
  }

  function scheduleStep() {
    if (gameInterval) clearInterval(gameInterval);
    const interval = Math.max(MIN_INTERVAL, BASE_INTERVAL - Math.floor(score / 40) * 5);
    gameInterval = setInterval(step, interval);
  }

  function step() {
    dir = { x: nextDir.x, y: nextDir.y };

    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      triggerGameOver(); return;
    }

    // Self collision — tail will move, so exclude it from check
    const body = snake.slice(0, snake.length - 1);
    if (body.some(function (s) { return s.x === head.x && s.y === head.y; })) {
      triggerGameOver(); return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += FRUIT_SCORES[food.key] || 10;
      food   = spawnFood();
      scheduleStep();
    } else {
      snake.pop();
    }
  }

  function triggerGameOver() {
    state = "dead";
    if (gameInterval) { clearInterval(gameInterval); gameInterval = null; }
    var finalScore = score;
    setTimeout(function () {
      if (typeof window.onGameOver === "function") window.onGameOver(finalScore);
    }, 400);
  }

  function spawnFood() {
    var key = FRUIT_KEYS[Math.floor(Math.random() * FRUIT_KEYS.length)];
    var pos;
    do {
      pos = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
      };
    } while (snake.some(function (s) { return s.x === pos.x && s.y === pos.y; }));
    return { x: pos.x, y: pos.y, key: key };
  }

  // ── Input ───────────────────────────────────────────────────────────────────

  function handleKey(e) {
    if (state === "dead") return;

    var arrowMap = {
      ArrowUp:    { x: 0, y: -1 },
      ArrowDown:  { x: 0, y:  1 },
      ArrowLeft:  { x: -1, y: 0 },
      ArrowRight: { x:  1, y: 0 },
    };
    var wasdMap = {
      w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
      s: { x: 0, y:  1 }, S: { x: 0, y:  1 },
      a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
      d: { x:  1, y: 0 }, D: { x:  1, y: 0 },
    };

    var newDir = arrowMap[e.key] || wasdMap[e.key];
    if (!newDir) return;

    if (arrowMap[e.key]) e.preventDefault();

    // Prevent 180-degree reversal
    if (newDir.x === -dir.x && newDir.y === -dir.y) return;

    nextDir = newDir;
    if (state === "idle") startGame();
  }

  // ── Draw ────────────────────────────────────────────────────────────────────

  function drawLoop() {
    draw();
    requestAnimationFrame(drawLoop);
  }

  function draw() {
    // Background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, W, H);

    // Subtle grid dots
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    for (var gx = 0; gx < COLS; gx++) {
      for (var gy = 0; gy < ROWS; gy++) {
        ctx.fillRect(gx * CELL + CELL / 2 - 1, gy * CELL + CELL / 2 - 1, 2, 2);
      }
    }

    drawSnake();
    drawFood();
    drawScore();

    if (state === "idle") drawIdlePrompt();
    if (state === "dead") drawDeadOverlay();
  }

  function drawSnake() {
    var len = snake.length;
    for (var i = len - 1; i >= 0; i--) {
      var seg = snake[i];
      var isHead = i === 0;
      var g = Math.max(80, 220 - i * 3);
      var b = Math.max(20, 100 - i * 2);
      ctx.fillStyle = isHead
        ? "#00ff88"
        : ("rgba(0," + g + "," + b + ",0.92)");

      var pad = isHead ? 1 : 2;
      ctx.fillRect(
        seg.x * CELL + pad,
        seg.y * CELL + pad,
        CELL - pad * 2,
        CELL - pad * 2
      );
    }

    // Glow on head
    var head = snake[0];
    ctx.shadowColor = "#00ff88";
    ctx.shadowBlur  = 10;
    ctx.fillStyle   = "#00ff88";
    ctx.fillRect(head.x * CELL + 1, head.y * CELL + 1, CELL - 2, CELL - 2);
    ctx.shadowBlur  = 0;

    // Eyes
    var eyeSize = 3;
    ctx.fillStyle = "#0a0a0a";
    var ex = head.x * CELL + CELL / 2;
    var ey = head.y * CELL + CELL / 2;
    var d  = 4;
    if (dir.x === 1)  { ctx.fillRect(ex + 3, ey - d, eyeSize, eyeSize); ctx.fillRect(ex + 3, ey + d - eyeSize, eyeSize, eyeSize); }
    if (dir.x === -1) { ctx.fillRect(ex - 6, ey - d, eyeSize, eyeSize); ctx.fillRect(ex - 6, ey + d - eyeSize, eyeSize, eyeSize); }
    if (dir.y === -1) { ctx.fillRect(ex - d, ey - 6, eyeSize, eyeSize); ctx.fillRect(ex + d - eyeSize, ey - 6, eyeSize, eyeSize); }
    if (dir.y === 1)  { ctx.fillRect(ex - d, ey + 3, eyeSize, eyeSize); ctx.fillRect(ex + d - eyeSize, ey + 3, eyeSize, eyeSize); }
  }

  function drawFood() {
    var atlas = window.SPRITE_ATLAS;
    if (atlasReady && atlas && atlas.fruits[food.key]) {
      var s = atlas.fruits[food.key];
      ctx.drawImage(fruitImg, s.x, s.y, s.w, s.h,
        food.x * CELL, food.y * CELL, CELL, CELL);
    } else {
      ctx.beginPath();
      ctx.arc(
        food.x * CELL + CELL / 2,
        food.y * CELL + CELL / 2,
        CELL / 2 - 2, 0, Math.PI * 2
      );
      ctx.fillStyle = "#ff4466";
      ctx.fill();
    }
  }

  function drawScore() {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(6, 4, 130, 20);
    ctx.font = "bold 11px monospace";
    ctx.fillStyle = "#00ff88";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("SCORE  " + score, 12, 14);
  }

  function drawIdlePrompt() {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, H / 2 - 34, W, 44);
    ctx.font = "bold 13px monospace";
    ctx.fillStyle = "#00ff88";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("FLECHAS O WASD PARA INICIAR", W / 2, H / 2 - 13);
  }

  function drawDeadOverlay() {
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, W, H);
  }

  // ── Boot ────────────────────────────────────────────────────────────────────

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

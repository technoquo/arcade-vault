(function () {
"use strict";

// ─── SKINS ───────────────────────────────────────────────────────────────────
// Paletas para arkanoid. Los bloques usan el spritesheet original (colores
// bakeados en PNG) y siempre se ven bien sobre cualquier fondo oscuro.
// Las skins afectan: fondo del canvas, tint de paleta, tint de pelota, HUD y overlays.

const SKIN_COLORS = {
  clasico: {
    bg:           '#000000',   // negro puro del canvas original
    paddleTint:   '#cccccc',   // gris claro neutro
    ballTint:     '#ffffff',   // blanco
    hudText:      '#ffffff',   // blanco — contrast ~20.4:1 ✓ HUD
    toastBg:      'rgba(0,0,0,0.6)',
    toastText:    '#ffffff',
    overlayBg:    'rgba(0,0,0,0.65)',
    overlayTitle: '#ffffff',
    overlaySubtitle: '#cccccc',
    tintOpacity:  0,           // sin tint — sprites originales del spritesheet
  },
  retro: {
    bg:           '#0d0800',   // marrón muy oscuro al estilo CRT encendida
    paddleTint:   '#ff8c00',   // naranja ámbar — contrast 8.0:1 ✓ jugable
    ballTint:     '#ffe066',   // amarillo cálido — contrast 13.4:1 ✓ jugable
    hudText:      '#ffb347',   // naranja suave — contrast 7.6:1 ✓ HUD
    toastBg:      'rgba(20,10,0,0.7)',
    toastText:    '#ffe066',
    overlayBg:    'rgba(10,5,0,0.75)',
    overlayTitle: '#ffb347',
    overlaySubtitle: '#ff8c00',
    tintOpacity:  0.55,
  },
  neon: {
    bg:           '#00000f',   // negro azulado synthwave
    paddleTint:   '#00f5ff',   // cyan eléctrico — contrast 13.6:1 ✓ jugable
    ballTint:     '#ff00aa',   // magenta — contrast 4.7:1 ✓ jugable
    hudText:      '#00f5ff',   // cyan — contrast 13.6:1 ✓ HUD
    toastBg:      'rgba(0,0,20,0.65)',
    toastText:    '#00f5ff',
    overlayBg:    'rgba(0,0,15,0.75)',
    overlayTitle: '#00f5ff',
    overlaySubtitle: '#ff00aa',
    tintOpacity:  0.6,
  },
};

let currentSkin = localStorage.getItem('arkanoid-skin') || 'clasico';
if (!SKIN_COLORS[currentSkin]) currentSkin = 'clasico';

function getSkin() {
  return SKIN_COLORS[currentSkin];
}

// ─── CANVAS TINT ─────────────────────────────────────────────────────────────
// Dibuja un sprite del spritesheet y le aplica un tint de color encima
// usando un canvas auxiliar con composite 'source-atop'.
const tintCanvas = document.createElement('canvas');
tintCanvas.width = 200;
tintCanvas.height = 30;
const tintCtx = tintCanvas.getContext('2d');

function drawSpriteTinted(ctx, name, x, y, w, h, tintColor, opacity) {
  if (opacity <= 0) {
    drawSprite(ctx, name, x, y, w, h);
    return;
  }
  tintCanvas.width = w;
  tintCanvas.height = h;
  tintCtx.clearRect(0, 0, w, h);
  drawSprite(tintCtx, name, 0, 0, w, h);
  tintCtx.globalCompositeOperation = 'source-atop';
  tintCtx.globalAlpha = opacity;
  tintCtx.fillStyle = tintColor;
  tintCtx.fillRect(0, 0, w, h);
  tintCtx.globalCompositeOperation = 'source-over';
  tintCtx.globalAlpha = 1;
  ctx.drawImage(tintCanvas, x, y, w, h);
}

// ─── GAME CONSTANTS ───────────────────────────────────────────────────────────
const CANVAS_W = 800;
const CANVAS_H = 600;

const BASE_BALL_SPEED = 4;
const BALL_SPEED_INCREMENT = 0.3;

const state = {
  phase: 'waiting', // fases: 'waiting' | 'playing' | 'level-complete' | 'gameover' | 'win'
  lives: 3,
  score: 0,
  level: 1,
  levelTimer: 0,
};

const paddle = {
  x: (CANVAS_W - 80) / 2,
  y: 550,
  width: 80,
  height: 12,
  speed: 6,
};

const ball = {
  x: 0,
  y: 0,
  radius: 6,
  vx: 4,
  vy: -4,
  attached: true,
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const BLOCK_W = 72;
const BLOCK_H = 20;
const BLOCK_COLS = 10;
const BLOCK_ROWS = 6;
const BLOCK_START_X = (CANVAS_W - BLOCK_COLS * BLOCK_W) / 2;
const BLOCK_START_Y = 60;
const ROW_COLORS = ['block_red', 'block_cyan', 'block_green', 'block_magenta', 'block_yellow', 'block_hotpink'];

const TOAST_DURATION = 1000; // ms

let blocks = [];

const keys = { ArrowLeft: false, ArrowRight: false };

const toast = {
  text: '',
  timer: 0,
};

const sndBounce = new Audio('/arkanoid/assets/sounds/ball-bounce.mp3');
const sndBreak  = new Audio('/arkanoid/assets/sounds/break-sound.mp3');

function playSound(snd) {
  snd.currentTime = 0;
  snd.play().catch(() => {});
}

function launch() {
  if (state.phase !== 'waiting') return;
  const speed = BASE_BALL_SPEED + (state.level - 1) * BALL_SPEED_INCREMENT;
  ball.vx = speed * Math.sign(ball.vx);
  ball.vy = -speed;
  ball.attached = false;
  state.phase = 'playing';
}

window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keys[e.key] = true;
  if (e.key === ' ') launch();
  if (e.key === 'r' || e.key === 'R') {
    if (state.phase === 'gameover' || state.phase === 'win') resetGame();
  }
});
window.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') keys[e.key] = false;
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  paddle.x = Math.max(0, Math.min(CANVAS_W - paddle.width, mouseX - paddle.width / 2));
});

canvas.addEventListener('click', () => {
  if (state.phase === 'gameover' || state.phase === 'win') {
    resetGame();
  } else {
    launch();
  }
});

// ─── SELECTOR DE SKIN (cableado desde ArkanoidGame.tsx) ──────────────────────
function applySkin(skinName) {
  if (!SKIN_COLORS[skinName]) return;
  currentSkin = skinName;
  localStorage.setItem('arkanoid-skin', skinName);
  // Actualizar botones activos
  document.querySelectorAll('.arkanoid-skin-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.skin === skinName);
  });
}

// Exponer para que ArkanoidGame.tsx pueda llamarlo desde React
window.arkanoidApplySkin = applySkin;

function resetGame() {
  state.phase = 'waiting';
  state.lives = 3;
  state.score = 0;
  state.levelTimer = 0;
  paddle.x = (CANVAS_W - paddle.width) / 2;
  ball.attached = true;
  ball.vx = BASE_BALL_SPEED;
  ball.vy = -BASE_BALL_SPEED;
  createBlocks();
}

function showToast(text) {
  toast.text = text;
  toast.timer = 0;
}

function createBlocks() {
  blocks = [];
  for (let row = 0; row < BLOCK_ROWS; row++) {
    for (let col = 0; col < BLOCK_COLS; col++) {
      blocks.push({
        x: BLOCK_START_X + col * BLOCK_W,
        y: BLOCK_START_Y + row * BLOCK_H,
        width: BLOCK_W,
        height: BLOCK_H,
        color: ROW_COLORS[row],
        alive: true,
        exploding: false,
        explosionTimer: 0,
      });
    }
  }
}

function update(delta) {
  if (toast.text !== '') {
    toast.timer += delta;
    if (toast.timer >= TOAST_DURATION) toast.text = '';
  }

  if (state.phase === 'level-complete') {
    state.levelTimer += delta;
    if (state.levelTimer >= 1000) {
      if (state.level === 100) {
        state.phase = 'win';
      } else {
        state.level++;
        createBlocks();
        ball.attached = true;
        state.phase = 'waiting';
      }
    }
    return;
  }

  for (const block of blocks) {
    if (!block.exploding) continue;
    block.explosionTimer += delta;
    if (block.explosionTimer >= EXPLOSION_DURATION) block.exploding = false;
  }

  if (keys.ArrowLeft)  paddle.x = Math.max(0, paddle.x - paddle.speed);
  if (keys.ArrowRight) paddle.x = Math.min(CANVAS_W - paddle.width, paddle.x + paddle.speed);

  if (state.phase === 'waiting') {
    ball.x = paddle.x + paddle.width / 2;
    ball.y = paddle.y - ball.radius;
  } else if (state.phase === 'playing') {
    ball.x += ball.vx;
    ball.y += ball.vy;

    // paredes izquierda y derecha
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.vx = Math.abs(ball.vx);
      playSound(sndBounce); showToast('Rebote');
    } else if (ball.x + ball.radius > CANVAS_W) {
      ball.x = CANVAS_W - ball.radius;
      ball.vx = -Math.abs(ball.vx);
      playSound(sndBounce); showToast('Rebote');
    }

    // techo
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.vy = Math.abs(ball.vy);
      playSound(sndBounce); showToast('Rebote');
    }

    // paleta
    if (
      ball.vy > 0 &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.width &&
      ball.y + ball.radius >= paddle.y &&
      ball.y + ball.radius <= paddle.y + paddle.height
    ) {
      ball.y = paddle.y - ball.radius;
      ball.vy = -Math.abs(ball.vy);
      playSound(sndBounce); showToast('Rebote');
    }

    // salida por la parte inferior
    if (ball.y - ball.radius > CANVAS_H) {
      state.lives -= 1;
      if (state.lives === 0) {
        state.phase = 'gameover';
        if (typeof window.onGameOver === 'function') window.onGameOver(state.score);
      } else {
        ball.attached = true;
        state.phase = 'waiting';
      }
    }

    // bloques
    for (const block of blocks) {
      if (!block.alive) continue;
      if (
        ball.x + ball.radius > block.x &&
        ball.x - ball.radius < block.x + block.width &&
        ball.y + ball.radius > block.y &&
        ball.y - ball.radius < block.y + block.height
      ) {
        block.alive = false;
        block.exploding = true;
        block.explosionTimer = 0;
        ball.vy = -ball.vy;
        state.score += 10;
        playSound(sndBreak); showToast('¡Bloque!');
        break;
      }
    }

    if (blocks.every(b => !b.alive)) {
      state.phase = 'level-complete';
      state.levelTimer = 0;
    }
  }
}

function draw() {
  const skin = getSkin();

  ctx.fillStyle = skin.bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawSpriteTinted(ctx, 'paddle', paddle.x, paddle.y, paddle.width, paddle.height, skin.paddleTint, skin.tintOpacity);
  drawSpriteTinted(ctx, 'ball', ball.x - ball.radius, ball.y - ball.radius, ball.radius * 2, ball.radius * 2, skin.ballTint, skin.tintOpacity);

  for (const block of blocks) {
    if (block.alive) {
      drawSprite(ctx, block.color, block.x, block.y, block.width, block.height);
    } else if (block.exploding) {
      const frameIndex = Math.min(3, Math.floor((block.explosionTimer / EXPLOSION_DURATION) * 4));
      const colorKey = block.color.slice(6); // 'block_red' → 'red'
      drawFrame(ctx, EXPLOSION_FRAMES[colorKey][frameIndex], block.x, block.y, block.width, block.height);
    }
  }

  drawHUD(skin);

  if (state.phase === 'gameover') {
    drawOverlay('GAME OVER', 'Pulsa R o haz clic para reiniciar', skin);
  } else if (state.phase === 'win') {
    drawOverlay('¡GANASTE!', 'Pulsa R o haz clic para reiniciar', skin);
  } else if (state.phase === 'level-complete') {
    if (state.level === 100) {
      drawOverlay('¡Completaste el juego!', '', skin);
    } else {
      drawOverlay('Nivel ' + state.level + ' completado', '', skin);
    }
  }

  if (toast.text !== '') {
    const pad = 6;
    ctx.font = '14px monospace';
    const tw = ctx.measureText(toast.text).width;
    const tx = CANVAS_W - 8 - pad;
    const ty = 38;
    ctx.fillStyle = skin.toastBg;
    ctx.fillRect(tx - tw - pad, ty - 14, tw + pad * 2, 20);
    ctx.fillStyle = skin.toastText;
    ctx.textAlign = 'right';
    ctx.fillText(toast.text, tx, ty);
  }
}

function drawHUD(skin) {
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = skin.hudText;
  ctx.fillText('Puntos: ' + state.score, 12, 30);
  ctx.fillText('Nivel: ' + state.level, 12, 52);

  const ballSize = 18;
  const ballGap = 6;
  const totalWidth = state.lives * (ballSize + ballGap) - ballGap;
  let bx = CANVAS_W - 12 - totalWidth;
  for (let i = 0; i < state.lives; i++) {
    drawSpriteTinted(ctx, 'ball', bx, 12, ballSize, ballSize, skin.ballTint, skin.tintOpacity);
    bx += ballSize + ballGap;
  }
}

function drawOverlay(title, subtitle, skin) {
  ctx.fillStyle = skin.overlayBg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.textAlign = 'center';
  ctx.fillStyle = skin.overlayTitle;
  ctx.font = 'bold 56px monospace';
  ctx.fillText(title, CANVAS_W / 2, CANVAS_H / 2 - 20);

  ctx.font = '22px monospace';
  ctx.fillStyle = skin.overlaySubtitle;
  ctx.fillText(subtitle, CANVAS_W / 2, CANVAS_H / 2 + 30);
}

let lastTime = 0;

function loop(timestamp) {
  const delta = lastTime === 0 ? 0 : timestamp - lastTime;
  lastTime = timestamp;
  update(delta);
  draw();
  requestAnimationFrame(loop);
}

loadSpritesheet(() => {
  createBlocks();
  // Marcar botón activo al iniciar
  document.querySelectorAll('.arkanoid-skin-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.skin === currentSkin);
  });
  requestAnimationFrame(loop);
});

})();

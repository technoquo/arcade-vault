'use strict';

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;

const SKIN_COLORS = {
  retro:  [null, '#4dd0e1', '#ffd54f', '#ba68c8', '#81c784', '#e57373', '#90caf9', '#ffb74d', '#b0bec5'],
  neon:   [null, '#00ffff', '#ff9900', '#cc00ff', '#00ff00', '#ff0033', '#0066ff', '#ffff00', '#c0c0c0'],
  pastel: [null, '#aef4f4', '#f4d4a0', '#d4a8f4', '#a8f4a8', '#f4a8a8', '#a8c4f4', '#f4f4a8', '#d4d4d4'],
  pixel:  [null, '#008b8b', '#b8860b', '#6a0dad', '#228b22', '#8b0000', '#00008b', '#b8b800', '#696969'],
};

const SKIN_BG = { retro: '#111', neon: '#000', pastel: '#f0e6ff', pixel: '#1a1a2e' };

let currentSkin = localStorage.getItem('tetris-skin') || 'retro';
let COLORS = SKIN_COLORS[currentSkin];

const PIECES = [
  null,
  [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], // I
  [[2,2],[2,2]],                               // O
  [[0,3,0],[3,3,3],[0,0,0]],                  // T
  [[0,4,4],[4,4,0],[0,0,0]],                  // S
  [[5,5,0],[0,5,5],[0,0,0]],                  // Z
  [[6,0,0],[6,6,6],[0,0,0]],                  // J
  [[0,0,7],[7,7,7],[0,0,0]],                  // L
  [[8,8,8],[8,0,8],[8,8,8]],                  // N (tuerca)
];

const LINE_SCORES = [0, 100, 300, 500, 800];
const RECORDS_KEY = 'tetris-records';
const LAST_NAME_KEY = 'tetris-last-name';
const MAX_RECORDS = 5;

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreEl = document.getElementById('score');
const linesEl = document.getElementById('lines');
const levelEl = document.getElementById('level');
const comboEl = document.getElementById('combo');
const overlay = document.getElementById('overlay');
const startScreen = document.getElementById('start-screen');
const pauseScreen = document.getElementById('pause-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const gameoverScoreEl = document.getElementById('gameover-score');
const restartBtn = document.getElementById('restart-btn');
const saveRecordBtn = document.getElementById('save-record-btn');
const playerNameInput = document.getElementById('player-name');
const recordSaveSection = document.getElementById('record-save-section');
const startRecordsEl = document.getElementById('start-records');
const gameoverRecordsEl = document.getElementById('gameover-records');
const resetRecordsStartBtn = document.getElementById('reset-records-start');
const resetRecordsGameoverBtn = document.getElementById('reset-records-gameover');
const themeToggle = document.getElementById('theme-toggle');
const resumeBtn = document.getElementById('resume-btn');
const restartPauseBtn = document.getElementById('restart-pause-btn');
const controlsToggleBtn = document.getElementById('controls-toggle-btn');
const controlsList = document.getElementById('controls-list');
const startLevelSelect = document.getElementById('start-level-select');

let board, current, next, score, lines, level, paused, gameOver, lastTime, dropAccum, dropInterval, animId;
let maxCombo, currentCombo;
let gridColor;
let gameStarted = false;
let startLevel = 1;

// ---- Records (localStorage) ----

function getRecords() {
  try {
    return JSON.parse(localStorage.getItem(RECORDS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecords(records) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

function isTopRecord(sc) {
  const records = getRecords();
  return records.length < MAX_RECORDS || sc > records[records.length - 1].score;
}

function addRecord(name, sc, lns, combo) {
  const records = getRecords();
  const entry = { name: name.trim() || 'AAA', score: sc, lines: lns, maxCombo: combo };
  records.push(entry);
  records.sort((a, b) => b.score - a.score);
  if (records.length > MAX_RECORDS) records.length = MAX_RECORDS;
  saveRecords(records);
  return records.indexOf(entry);
}

function resetRecords() {
  if (confirm('¿Borrar todos los records? Esta acción no se puede deshacer.')) {
    localStorage.removeItem(RECORDS_KEY);
    renderStartRecords();
    renderGameoverRecords(-1);
  }
}

// ---- Tablas de records ----

function buildRecordsTable(records, highlightIndex) {
  if (!records.length) {
    const msg = document.createElement('p');
    msg.className = 'no-records';
    msg.textContent = 'Sin records aún';
    return msg;
  }

  const table = document.createElement('table');
  table.className = 'records-table';

  const thead = document.createElement('thead');
  thead.innerHTML = '<tr><th>Pos</th><th>Nombre</th><th>Puntos</th><th>Líneas</th><th>Combo</th></tr>';
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  records.forEach((rec, i) => {
    const tr = document.createElement('tr');
    if (i === highlightIndex) tr.classList.add('record-highlight');
    tr.innerHTML = `
      <td class="pos">#${i + 1}</td>
      <td class="name">${escHtml(rec.name)}</td>
      <td class="pts">${rec.score.toLocaleString()}</td>
      <td class="lns">${rec.lines}</td>
      <td class="cbo">${rec.maxCombo}</td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderStartRecords() {
  startRecordsEl.innerHTML = '';
  startRecordsEl.appendChild(buildRecordsTable(getRecords(), -1));
}

function renderGameoverRecords(highlightIndex) {
  gameoverRecordsEl.innerHTML = '';
  gameoverRecordsEl.appendChild(buildRecordsTable(getRecords(), highlightIndex));
}

// ---- Skin ----

function applySkin(skin) {
  currentSkin = skin;
  COLORS = SKIN_COLORS[skin];
  localStorage.setItem('tetris-skin', skin);

  canvas.style.background = SKIN_BG[skin];
  nextCanvas.style.background = SKIN_BG[skin];

  document.querySelectorAll('.skin-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.skin === skin);
  });
}

document.querySelectorAll('.skin-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    applySkin(btn.dataset.skin);
    if (current) {
      draw();
      if (next) drawNext();
    }
  });
});

applySkin(currentSkin);

// ---- Theme ----

function applyTheme(theme) {
  document.body.classList.toggle('light-theme', theme === 'light');
  themeToggle.checked = theme === 'light';
  gridColor = getComputedStyle(document.body).getPropertyValue('--grid-line').trim();
  localStorage.setItem('theme', theme);
}

applyTheme(localStorage.getItem('theme') === 'light' ? 'light' : 'dark');

themeToggle.addEventListener('change', () => {
  applyTheme(themeToggle.checked ? 'light' : 'dark');
});

// ---- Board ----

function createBoard() {
  return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
}

function randomPiece() {
  const type = Math.floor(Math.random() * 8) + 1;
  const shape = PIECES[type].map(row => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}

function collide(shape, ox, oy) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape) {
  const rows = shape.length, cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function tryRotate() {
  const rotated = rotateCW(current.shape);
  const kicks = [0, -1, 1, -2, 2];
  for (const kick of kicks) {
    if (!collide(rotated, current.x + kick, current.y)) {
      current.shape = rotated;
      current.x += kick;
      return;
    }
  }
}

function merge() {
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        board[current.y + r][current.x + c] = current.shape[r][c];
}

function clearLines() {
  let cleared = 0;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r].every(v => v !== 0)) {
      board.splice(r, 1);
      board.unshift(new Array(COLS).fill(0));
      cleared++;
      r++;
    }
  }
  if (cleared) {
    currentCombo += cleared;
    if (currentCombo > maxCombo) maxCombo = currentCombo;
    lines += cleared;
    score += (LINE_SCORES[cleared] || 0) * level;
    level = Math.floor(lines / 10) + 1;
    dropInterval = Math.max(100, 1000 - (level - 1) * 90);
    updateHUD();
  } else {
    currentCombo = 0;
  }
}

function ghostY() {
  let gy = current.y;
  while (!collide(current.shape, current.x, gy + 1)) gy++;
  return gy;
}

function hardDrop() {
  const gy = ghostY();
  score += (gy - current.y) * 2;
  current.y = gy;
  lockPiece();
}

function softDrop() {
  if (!collide(current.shape, current.x, current.y + 1)) {
    current.y++;
    score += 1;
    updateHUD();
  } else {
    lockPiece();
  }
}

function lockPiece() {
  merge();
  clearLines();
  spawn();
}

function spawn() {
  current = next;
  next = randomPiece();
  if (collide(current.shape, current.x, current.y)) {
    endGame();
  }
  drawNext();
}

function updateHUD() {
  scoreEl.textContent = score.toLocaleString();
  linesEl.textContent = lines;
  levelEl.textContent = level;
  comboEl.textContent = maxCombo;
}

// ---- Draw ----

function drawBlock(context, x, y, colorIndex, size, alpha) {
  if (!colorIndex) return;
  const color = COLORS[colorIndex];
  context.globalAlpha = alpha ?? 1;

  if (currentSkin === 'neon') {
    context.shadowBlur = 15;
    context.shadowColor = color;
    context.fillStyle = color;
    context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
    context.shadowBlur = 0;
    context.fillStyle = 'rgba(0,0,0,0.45)';
    context.fillRect(x * size + 3, y * size + 3, size - 6, size - 6);
  } else if (currentSkin === 'pastel') {
    const px = x * size + 1;
    const py = y * size + 1;
    const w = size - 2;
    const h = size - 2;
    const r = 6;
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(px + r, py);
    context.lineTo(px + w - r, py);
    context.quadraticCurveTo(px + w, py, px + w, py + r);
    context.lineTo(px + w, py + h - r);
    context.quadraticCurveTo(px + w, py + h, px + w - r, py + h);
    context.lineTo(px + r, py + h);
    context.quadraticCurveTo(px, py + h, px, py + h - r);
    context.lineTo(px, py + r);
    context.quadraticCurveTo(px, py, px + r, py);
    context.closePath();
    context.fill();
    context.fillStyle = 'rgba(255,255,255,0.35)';
    context.beginPath();
    context.moveTo(px + r, py);
    context.lineTo(px + w - r, py);
    context.quadraticCurveTo(px + w, py, px + w, py + r);
    context.lineTo(px + w, py + 5);
    context.lineTo(px, py + 5);
    context.lineTo(px, py + r);
    context.quadraticCurveTo(px, py, px + r, py);
    context.closePath();
    context.fill();
  } else if (currentSkin === 'pixel') {
    context.fillStyle = color;
    context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
    const cellW = (size - 2) / 3;
    const cellH = (size - 2) / 3;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const isDark = (row + col) % 2 === 0;
        context.fillStyle = isDark ? 'rgba(0,0,0,0.20)' : 'rgba(255,255,255,0.10)';
        context.fillRect(
          x * size + 1 + col * cellW,
          y * size + 1 + row * cellH,
          cellW,
          cellH
        );
      }
    }
    context.fillStyle = 'rgba(255,255,255,0.15)';
    context.fillRect(x * size + 1, y * size + 1, size - 2, 2);
    context.fillRect(x * size + 1, y * size + 1, 2, size - 2);
  } else {
    // retro (default)
    context.fillStyle = color;
    context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
    context.fillStyle = 'rgba(255,255,255,0.12)';
    context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  }

  context.globalAlpha = 1;
  context.shadowBlur = 0;
}

function drawGrid() {
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 0.5;
  for (let c = 1; c < COLS; c++) {
    ctx.beginPath();
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, ROWS * BLOCK);
    ctx.stroke();
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.beginPath();
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(COLS * BLOCK, r * BLOCK);
    ctx.stroke();
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();

  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      drawBlock(ctx, c, r, board[r][c], BLOCK);

  const gy = ghostY();
  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      if (current.shape[r][c])
        drawBlock(ctx, current.x + c, gy + r, current.shape[r][c], BLOCK, 0.2);

  for (let r = 0; r < current.shape.length; r++)
    for (let c = 0; c < current.shape[r].length; c++)
      drawBlock(ctx, current.x + c, current.y + r, current.shape[r][c], BLOCK);
}

function drawNext() {
  const NB = 30;
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
  const shape = next.shape;
  const offX = Math.floor((4 - shape[0].length) / 2);
  const offY = Math.floor((4 - shape.length) / 2);
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[r].length; c++)
      drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
}

// ---- Overlay helpers ----

function showScreen(screenId) {
  startScreen.classList.add('hidden');
  pauseScreen.classList.add('hidden');
  gameoverScreen.classList.add('hidden');
  if (screenId) {
    document.getElementById(screenId).classList.remove('hidden');
  }
  overlay.classList.remove('hidden');
}

function hideOverlay() {
  overlay.classList.add('hidden');
}

// ---- Game flow ----

function endGame() {
  gameOver = true;
  cancelAnimationFrame(animId);

  gameoverScoreEl.textContent = `Puntuación: ${score.toLocaleString()} · Líneas: ${lines} · Combo: ${maxCombo}`;

  const isTop = isTopRecord(score);
  if (isTop) {
    recordSaveSection.classList.remove('hidden');
    playerNameInput.value = localStorage.getItem(LAST_NAME_KEY) || '';
    renderGameoverRecords(-1);
  } else {
    recordSaveSection.classList.add('hidden');
    renderGameoverRecords(-1);
  }

  showScreen('gameover-screen');

  if (isTop) {
    setTimeout(() => playerNameInput.focus(), 50);
  }
}

function doSaveRecord() {
  const name = playerNameInput.value.trim() || 'AAA';
  localStorage.setItem(LAST_NAME_KEY, name);
  const idx = addRecord(name, score, lines, maxCombo);
  recordSaveSection.classList.add('hidden');
  renderGameoverRecords(idx);
}

function togglePause() {
  if (gameOver || !gameStarted) return;
  paused = !paused;
  if (!paused) {
    hideOverlay();
    lastTime = performance.now();
    loop(lastTime);
  } else {
    cancelAnimationFrame(animId);
    showScreen('pause-screen');
  }
}

function loop(ts) {
  if (gameOver) return;
  const dt = ts - lastTime;
  lastTime = ts;
  dropAccum += dt;
  if (dropAccum >= dropInterval) {
    dropAccum = 0;
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
    } else {
      lockPiece();
      if (gameOver) return;
    }
  }
  draw();
  animId = requestAnimationFrame(loop);
}

function init() {
  board = createBoard();
  score = 0;
  lines = 0;
  level = startLevel;
  maxCombo = 0;
  currentCombo = 0;
  paused = false;
  gameOver = false;
  gameStarted = true;
  dropInterval = Math.max(100, 1000 - (startLevel - 1) * 90);
  dropAccum = 0;
  lastTime = performance.now();
  next = randomPiece();
  spawn();
  updateHUD();
  hideOverlay();
  cancelAnimationFrame(animId);
  animId = requestAnimationFrame(loop);
}

function showStartScreen() {
  renderStartRecords();
  showScreen('start-screen');
}

// ---- Events ----

document.addEventListener('keydown', e => {
  if (e.code === 'KeyP' || e.code === 'Escape') {
    e.preventDefault();
    togglePause();
    return;
  }

  if (!gameStarted && e.code === 'Space') {
    e.preventDefault();
    init();
    return;
  }

  if (gameOver && e.code === 'Space') {
    e.preventDefault();
    init();
    return;
  }

  if (paused || gameOver) return;
  switch (e.code) {
    case 'ArrowLeft':
      if (!collide(current.shape, current.x - 1, current.y)) current.x--;
      break;
    case 'ArrowRight':
      if (!collide(current.shape, current.x + 1, current.y)) current.x++;
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case 'ArrowUp':
    case 'KeyX':
      tryRotate();
      break;
    case 'Space':
      e.preventDefault();
      hardDrop();
      break;
  }
  updateHUD();
});

restartBtn.addEventListener('click', init);

saveRecordBtn.addEventListener('click', doSaveRecord);

playerNameInput.addEventListener('keydown', e => {
  if (e.code === 'Enter') doSaveRecord();
});

resetRecordsStartBtn.addEventListener('click', resetRecords);

resetRecordsGameoverBtn.addEventListener('click', resetRecords);

resumeBtn.addEventListener('click', () => {
  if (paused) togglePause();
});

restartPauseBtn.addEventListener('click', init);

controlsToggleBtn.addEventListener('click', () => {
  const isHidden = controlsList.classList.toggle('hidden');
  controlsToggleBtn.textContent = isHidden ? '☰ Ver controles' : '☰ Ocultar controles';
});

startLevelSelect.addEventListener('change', () => {
  startLevel = parseInt(startLevelSelect.value, 10);
});

showStartScreen();

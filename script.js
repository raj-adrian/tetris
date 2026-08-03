// ----------------------- Configuration & Constants -----------------------
const COLS = 10;
const ROWS = 20;
const VISIBLE_ROWS = ROWS;
const BLOCK_SIZE = 30; // logical size; canvas will scale responsively
const CANVAS_ASPECT = (COLS * BLOCK_SIZE) / (ROWS * BLOCK_SIZE);

const COLORS = {
  I: '#00f0ff',
  O: '#f0e800',
  T: '#b400f0',
  S: '#00f05a',
  Z: '#ff0044',
  J: '#004bff',
  L: '#ff8b00',
  GHOST: 'rgba(200,255,255,0.12)',
  GRID: 'rgba(255,255,255,0.04)',
};

const SCORE_TABLE = [0, 100, 300, 500, 800]; // index = lines cleared in single clear
const LINES_PER_LEVEL = 10;

// Gravity/level formula: base 1000ms * 0.8^level (approx)
function gravityMs(level) {
  // clamp to a minimum to keep playable
  const g = Math.max(50, 1000 * Math.pow(0.8, level));
  return g;
}

// ----------------------- Tetromino Definitions (SRS-friendly) -----------------------
// Each piece defined as 4 rotation matrices (0, R, 2, L) using 4x4 arrays
const SHAPES = {
  I: [
    [
      [0,0,0,0],
      [1,1,1,1],
      [0,0,0,0],
      [0,0,0,0],
    ],
    [
      [0,0,1,0],
      [0,0,1,0],
      [0,0,1,0],
      [0,0,1,0],
    ],
    [
      [0,0,0,0],
      [0,0,0,0],
      [1,1,1,1],
      [0,0,0,0],
    ],
    [
      [0,1,0,0],
      [0,1,0,0],
      [0,1,0,0],
      [0,1,0,0],
    ],
  ],
  O: [
    [
      [0,1,1,0],
      [0,1,1,0],
      [0,0,0,0],
      [0,0,0,0],
    ],
    // O piece rotations are identical
    [
      [0,1,1,0],
      [0,1,1,0],
      [0,0,0,0],
      [0,0,0,0],
    ],
    [
      [0,1,1,0],
      [0,1,1,0],
      [0,0,0,0],
      [0,0,0,0],
    ],
    [
      [0,1,1,0],
      [0,1,1,0],
      [0,0,0,0],
      [0,0,0,0],
    ],
  ],
  T: [
    [
      [0,1,0],
      [1,1,1],
      [0,0,0],
    ],
    [
      [0,1,0],
      [0,1,1],
      [0,1,0],
    ],
    [
      [0,0,0],
      [1,1,1],
      [0,1,0],
    ],
    [
      [0,1,0],
      [1,1,0],
      [0,1,0],
    ],
  ],
  S: [
    [
      [0,1,1],
      [1,1,0],
      [0,0,0],
    ],
    [
      [0,1,0],
      [0,1,1],
      [0,0,1],
    ],
    [
      [0,0,0],
      [0,1,1],
      [1,1,0],
    ],
    [
      [1,0,0],
      [1,1,0],
      [0,1,0],
    ],
  ],
  Z: [
    [
      [1,1,0],
      [0,1,1],
      [0,0,0],
    ],
    [
      [0,0,1],
      [0,1,1],
      [0,1,0],
    ],
    [
      [0,0,0],
      [1,1,0],
      [0,1,1],
    ],
    [
      [0,1,0],
      [1,1,0],
      [1,0,0],
    ],
  ],
  J: [
    [
      [1,0,0],
      [1,1,1],
      [0,0,0],
    ],
    [
      [0,1,1],
      [0,1,0],
      [0,1,0],
    ],
    [
      [0,0,0],
      [1,1,1],
      [0,0,1],
    ],
    [
      [0,1,0],
      [0,1,0],
      [1,1,0],
    ],
  ],
  L: [
    [
      [0,0,1],
      [1,1,1],
      [0,0,0],
    ],
    [
      [0,1,0],
      [0,1,0],
      [0,1,1],
    ],
    [
      [0,0,0],
      [1,1,1],
      [1,0,0],
    ],
    [
      [1,1,0],
      [0,1,0],
      [0,1,0],
    ],
  ],
};

// Wall kicks (SRS) — offsets tried during rotation
// For JLTSZ (standard): list of tests for rotating from state 'r' to 'r2'
const KICKS_JLTSZ = {
  // key: from->to as "0>1", "1>2", etc.
  "0>1":[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  "1>0":[[0,0],[1,0],[1,-1],[0,2],[1,2]],
  "1>2":[[0,0],[1,0],[1,-1],[0,2],[1,2]],
  "2>1":[[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
  "2>3":[[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  "3>2":[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  "3>0":[[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
  "0>3":[[0,0],[1,0],[1,1],[0,-2],[1,-2]],
};

// I piece kicks are different
const KICKS_I = {
  "0>1":[[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  "1>0":[[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  "1>2":[[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
  "2>1":[[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  "2>3":[[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
  "3>2":[[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
  "3>0":[[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
  "0>3":[[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
};

// ----------------------- Utility Functions -----------------------
function randRange(n){ return Math.floor(Math.random()*n); }
function deepClone(mat){ return JSON.parse(JSON.stringify(mat)); }

// Shuffle helper — Fisher-Yates
function shuffle(array){
  for(let i=array.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [array[i],array[j]]=[array[j],array[i]];
  }
  return array;
}

// ----------------------- Board & Game State -----------------------
let board = createMatrix(ROWS, COLS);
let currentPiece = null;
let nextQueue = [];
let bag = [];
let holdPiece = null;
let holdLocked = false; // only one hold per drop
let score = 0;
let level = 0;
let lines = 0;
let gameOver = false;
let paused = false;

// Timing
let lastGravity = 0;
let dropInterval = gravityMs(level);
let lastFrame = 0;

// Input state
const input = {
  left: false, right:false, soft:false,
};

// Canvas & rendering
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', {alpha:true});
const nextCanvas = document.getElementById('nextCanvas');
const nextCtx = nextCanvas.getContext('2d', {alpha:true});
const holdCanvas = document.getElementById('holdCanvas');
const holdCtx = holdCanvas.getContext('2d', {alpha:true});

// UI elements
const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const linesEl = document.getElementById('lines');
const startBtn = document.getElementById('startBtn');
const overlay = document.getElementById('overlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScoreEl = document.getElementById('finalScore');
const playAgainBtn = document.getElementById('playAgainBtn');
const musicToggleBtn = document.getElementById('musicToggle');
const sfxToggle = document.getElementById('sfxToggle');

// Mobile buttons
document.querySelectorAll('.touch').forEach(btn=>{
  btn.addEventListener('pointerdown', (e)=>{
    const a = btn.dataset.action;
    handleTouchAction(a);
  });
});

// WebAudio for SFX and music
const audio = new (window.AudioContext || window.webkitAudioContext)();
let musicRunning = false;
let musicInterval = null;
let sfxEnabled = sfxToggle.checked;

// Keep track of last spawn time to animate entry
let spawnAnim = 0;

// ----------------------- Initialization -----------------------
function init() {
  resizeCanvases();
  attachEvents();
  resetGameState();
  render(); // initial draw
}

function resetGameState(){
  board = createMatrix(ROWS, COLS);
  bag = [];
  nextQueue = [];
  fillBag(); // prepare bag and queue
  // prepare initial queue (we'll show 5 next)
  for(let i=0;i<5;i++) nextQueue.push(drawFromBag());
  holdPiece = null; holdLocked=false;
  score = 0; level = 0; lines = 0;
  gameOver = false; paused=false;
  dropInterval = gravityMs(level);
  updateStats();
}

// create empty matrix rows x cols
function createMatrix(r,c){
  const m = [];
  for(let y=0;y<r;y++){
    m.push(new Array(c).fill(0));
  }
  return m;
}

// Fill bag with 7 tetrominoes
function fillBag(){
  const pieces = Object.keys(SHAPES);
  bag = shuffle(pieces.slice());
}

// Draw random piece from bag using 7-bag system
function drawFromBag(){
  if(bag.length===0) fillBag();
  return bag.pop();
}

// Spawn a new piece (from nextQueue)
function spawnPiece(){
  const type = nextQueue.shift();
  // replenish queue
  nextQueue.push(drawFromBag());
  const piece = {
    type,
    rot: 0,
    matrix: normalizeMatrix(SHAPES[type][0]),
    x: Math.floor((COLS - 4) / 2), // 4x4 spawn for I & O; others use 3x3 but we place in center
    y: -getSpawnOffset(type), // negative so piece enters
  };
  // adjust x for 3x3 matrices to center
  if(['T','S','Z','J','L','O'].includes(type)){
    piece.x = Math.floor((COLS - 3)/2);
  } else { // I-piece uses 4x4
    piece.x = Math.floor((COLS - 4)/2);
  }
  currentPiece = piece;
  holdLocked = false;
  spawnAnim = performance.now();
  // Game over check: if spawn collides immediately when placed at y=0 (or y negative but overlaps)
  if(collides(currentPiece.matrix, currentPiece.x, currentPiece.y)){
    endGame();
  }
}

// For I piece spawn offset; returns rows above the visible field
function getSpawnOffset(type){
  // Use 0 or 1 depending on shape height; keep simple
  if(type==='I') return 1;
  if(type==='O') return 1;
  return 2;
}

// Normalize shape matrix for variable sizes: ensure matrix is trimmed to true width/height
function normalizeMatrix(matrix){
  // If already 4x4 or 3x3, return deep clone
  return deepClone(matrix);
}

// ----------------------- Collision & Placement -----------------------
function collides(matrix, offsetX, offsetY){
  for(let y=0;y<matrix.length;y++){
    for(let x=0;x<matrix[y].length;x++){
      if(matrix[y][x]){
        const boardX = offsetX + x;
        const boardY = offsetY + y;
        if(boardX < 0 || boardX >= COLS || boardY >= ROWS){
          return true;
        }
        if(boardY >=0 && board[boardY][boardX]){
          return true;
        }
      }
    }
  }
  return false;
}

function placePiece(){
  const m = currentPiece.matrix;
  for(let y=0;y<m.length;y++){
    for(let x=0;x<m[y].length;x++){
      if(m[y][x]){
        const boardX = currentPiece.x + x;
        const boardY = currentPiece.y + y;
        if(boardY >= 0 && boardY < ROWS && boardX>=0 && boardX < COLS){
          board[boardY][boardX] = currentPiece.type;
        }
      }
    }
  }
  lockPiece();
}

function lockPiece(){
  // After placing, clear lines and spawn new piece
  const cleared = clearLines();
  if(cleared > 0){
    addScore(cleared);
  }
  spawnPiece();
  holdLocked = false;
  dropInterval = gravityMs(level);
}

// Clear full lines and animate clearing
function clearLines(){
  const rowsCleared = [];
  for(let y=ROWS-1;y>=0;y--){
    if(board[y].every(cell => cell !== 0)){
      rowsCleared.push(y);
    }
  }
  if(rowsCleared.length===0) return 0;
  // Remove rows from bottom to top
  rowsCleared.forEach(r=>{
    board.splice(r,1);
    board.unshift(new Array(COLS).fill(0));
  });
  // update line counters
  lines += rowsCleared.length;
  level = Math.floor(lines / LINES_PER_LEVEL);
  updateStats();
  // Play line clear sound
  playSfx('line');
  return rowsCleared.length;
}

// ----------------------- Scoring -----------------------
function addScore(linesCleared, hardDropCells=0, softDropCells=0){
  // Add for line clears (classic-ish)
  const linePoints = SCORE_TABLE[linesCleared] || 0;
  score += linePoints * (level + 1);
  // Soft drop: 1 point per cell
  score += softDropCells;
  // Hard drop: 2 points per cell
  score += hardDropCells * 2;
  updateStats();
}

// ----------------------- Rotation with Wall Kicks -----------------------
function rotatePiece(dir){
  // dir = +1 clockwise or -1 counter-clockwise
  if(!currentPiece) return;
  const oldRot = currentPiece.rot;
  const newRot = (oldRot + (dir===1?1:3)) % 4;
  const type = currentPiece.type;
  const oldMatrix = currentPiece.matrix;
  const newMatrix = normalizeMatrix(SHAPES[type][newRot]);
  // choose correct kicks
  const kicks = (type === 'I') ? KICKS_I : KICKS_JLTSZ;
  const key = `${oldRot}>${newRot}`;
  const tests = kicks[key] || [[0,0]];
  for(const [dx,dy] of tests){
    const nx = currentPiece.x + dx;
    const ny = currentPiece.y + dy;
    if(!collides(newMatrix, nx, ny)){
      currentPiece.rot = newRot;
      currentPiece.matrix = deepClone(newMatrix);
      currentPiece.x = nx;
      currentPiece.y = ny;
      playSfx('rotate');
      return true;
    }
  }
  // rotation failed
  return false;
}

// ----------------------- Movement -----------------------
function movePiece(dx, dy){
  if(!currentPiece) return false;
  const nx = currentPiece.x + dx;
  const ny = currentPiece.y + dy;
  if(!collides(currentPiece.matrix, nx, ny)){
    currentPiece.x = nx;
    currentPiece.y = ny;
    return true;
  }
  return false;
}

// Hard drop: move piece down until collision, lock and score for dropped cells
function hardDrop(){
  let drop = 0;
  while(!collides(currentPiece.matrix, currentPiece.x, currentPiece.y + 1)){
    currentPiece.y++;
    drop++;
  }
  addScore(0, drop, 0);
  placePiece();
  playSfx('hard');
}

// Soft drop: attempt to move down one cell, award soft-drop point if moved
function softDrop(){
  if(movePiece(0,1)){
    addScore(0, 0, 1);
  } else {
    // if can't move down, lock piece immediately
    placePiece();
  }
}

// ----------------------- Hold -----------------------
function holdCurrent(){
  if(holdLocked) return;
  playSfx('hold');
  if(!holdPiece){
    // move current into hold and spawn next
    holdPiece = currentPiece.type;
    spawnPiece();
  } else {
    // swap
    const temp = holdPiece;
    holdPiece = currentPiece.type;
    currentPiece = {
      type: temp,
      rot: 0,
      matrix: normalizeMatrix(SHAPES[temp][0]),
      x: Math.floor((COLS - (temp==='I'?4:3))/2),
      y: -getSpawnOffset(temp),
    };
    // ensure rotation state is reset
    if(collides(currentPiece.matrix, currentPiece.x, currentPiece.y)){
      endGame();
    }
  }
  holdLocked = true;
  updatePreviews();
}

// ----------------------- Ghost Piece -----------------------
function computeGhostY(){
  if(!currentPiece) return currentPiece ? currentPiece.y : 0;
  let y = currentPiece.y;
  while(!collides(currentPiece.matrix, currentPiece.x, y + 1)){
    y++;
  }
  return y;
}

// ----------------------- Rendering -----------------------
function resizeCanvases(){
  // Responsive canvas sizing while maintaining tile proportion.
  // We'll set CSS width and let devicePixelRatio scale canvas backing store.
  const container = canvas.parentElement;
  const maxWidth = Math.min(container.clientWidth - 20, 520);
  // calculate desired canvas width based on cols and block size
  const width = Math.min(maxWidth, COLS * BLOCK_SIZE);
  const height = Math.round(width * (ROWS / COLS));
  setCanvasSize(canvas, width, height);
  // next and hold canvases
  setCanvasSize(nextCanvas, 160, 160);
  setCanvasSize(holdCanvas, 160, 160);
}

function setCanvasSize(c, w, h){
  const ratio = window.devicePixelRatio || 1;
  c.style.width = w + 'px';
  c.style.height = h + 'px';
  c.width = Math.round(w * ratio);
  c.height = Math.round(h * ratio);
  const ctx = c.getContext('2d');
  ctx.setTransform(ratio,0,0,ratio,0,0);
}

window.addEventListener('resize', ()=>{
  resizeCanvases();
  render(); // re-render on resize
});

// draw rounded rectangle helper for glow panel effect in canvas
function drawRoundedRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

function render(){
  // main render pass on requestAnimationFrame; draws board, ghost, active piece, grid
  // clear
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawBoard();
  drawGhost();
  drawCurrentPiece();
  drawGridOverlay();
  // previews
  drawPreview(nextCtx, nextQueue[0]);
  drawHold(holdCtx, holdPiece);
}

// draw static board blocks
function drawBoard(){
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const cellW = width / COLS;
  const cellH = height / ROWS;
  // draw background with subtle gradient
  // draw blocks
  for(let y=0;y<ROWS;y++){
    for(let x=0;x<COLS;x++){
      const cell = board[y][x];
      if(cell){
        drawCell(ctx, x, y, cellW, cellH, cell);
      }
    }
  }
}

// draw ghost piece translucent
function drawGhost(){
  if(!currentPiece) return;
  const ghostY = computeGhostY();
  const m = currentPiece.matrix;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const cellW = width / COLS;
  const cellH = height / ROWS;
  for(let y=0;y<m.length;y++){
    for(let x=0;x<m[y].length;x++){
      if(m[y][x]){
        const gx = currentPiece.x + x;
        const gy = ghostY + y;
        if(gy>=0){
          const px = gx * cellW;
          const py = gy * cellH;
          // draw translucent rectangle with inner glow
          ctx.fillStyle = COLORS.GHOST;
          roundRectFill(ctx, px+1, py+1, cellW-2, cellH-2, 6);
        }
      }
    }
  }
}

// draw active piece with neon stroke
function drawCurrentPiece(){
  if(!currentPiece) return;
  const m = currentPiece.matrix;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const cellW = width / COLS;
  const cellH = height / ROWS;
  for(let y=0;y<m.length;y++){
    for(let x=0;x<m[y].length;x++){
      if(m[y][x]){
        const gx = currentPiece.x + x;
        const gy = currentPiece.y + y;
        if(gy >= -4){ // draw if within or near viewport for spawn animation
          drawCell(ctx, gx, gy, cellW, cellH, currentPiece.type, true);
        }
      }
    }
  }
}

function drawCell(ctx, gridX, gridY, cellW, cellH, type, neon=false){
  if(gridY < 0) return; // don't draw above playfield
  const px = gridX * cellW;
  const py = gridY * cellH;
  // base rounded rect
  ctx.save();
  // subtle inner shadow
  ctx.fillStyle = '#07111f';
  roundRectFill(ctx, px+2, py+2, cellW-4, cellH-4, Math.min(cellW,12)/2);
  // colored fill
  ctx.shadowBlur = neon ? 22 : 10;
  ctx.shadowColor = neon ? COLORS[type] : 'rgba(0,170,255,0.06)';
  ctx.fillStyle = COLORS[type] || COLORS.GHOST;
  roundRectFill(ctx, px+3, py+3, cellW-6, cellH-6, Math.min(cellW,10)/2);
  // crisp border
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  roundRectStroke(ctx, px+3, py+3, cellW-6, cellH-6, Math.min(cellW,10)/2);
  ctx.restore();
}

function roundRectFill(ctx,x,y,w,h,r){
  const rad = r;
  ctx.beginPath();
  ctx.moveTo(x+rad, y);
  ctx.arcTo(x+w, y, x+w, y+h, rad);
  ctx.arcTo(x+w, y+h, x, y+h, rad);
  ctx.arcTo(x, y+h, x, y, rad);
  ctx.arcTo(x, y, x+w, y, rad);
  ctx.closePath();
  ctx.fill();
}

function roundRectStroke(ctx,x,y,w,h,r){
  const rad = r;
  ctx.beginPath();
  ctx.moveTo(x+rad, y);
  ctx.arcTo(x+w, y, x+w, y+h, rad);
  ctx.arcTo(x+w, y+h, x, y+h, rad);
  ctx.arcTo(x, y+h, x, y, rad);
  ctx.arcTo(x, y, x+w, y, rad);
  ctx.closePath();
  ctx.stroke();
}

function drawGridOverlay(){
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const cellW = width / COLS;
  const cellH = height / ROWS;
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = COLORS.GRID;
  for(let x=0;x<=COLS;x++){
    ctx.beginPath();
    ctx.moveTo(x*cellW, 0);
    ctx.lineTo(x*cellW, height);
    ctx.stroke();
  }
  for(let y=0;y<=ROWS;y++){
    ctx.beginPath();
    ctx.moveTo(0, y*cellH);
    ctx.lineTo(width, y*cellH);
    ctx.stroke();
  }
  ctx.restore();
}

// small preview drawing (center small canvas)
function drawPreview(ctxLocal, type){
  // clear
  ctxLocal.clearRect(0,0,nextCanvas.width,nextCanvas.height);
  if(!type) return;
  const size = 3; // scale preview
  // determine matrix to render (use rotation 0)
  const matrix = normalizeMatrix(SHAPES[type][0]);
  // center it
  const cellW = nextCanvas.clientWidth / 4;
  const cellH = nextCanvas.clientHeight / 4;
  const offsetX = (nextCanvas.clientWidth - (matrix[0].length * cellW)) / 2;
  const offsetY = (nextCanvas.clientHeight - (matrix.length * cellH)) / 2;
  for(let y=0;y<matrix.length;y++){
    for(let x=0;x<matrix[y].length;x++){
      if(matrix[y][x]){
        const px = offsetX + x * cellW;
        const py = offsetY + y * cellH;
        // draw neon square
        ctxLocal.fillStyle = COLORS[type];
        roundRectFill(ctxLocal, px+6, py+6, cellW-12, cellH-12, 8);
        ctxLocal.lineWidth = 1;
        ctxLocal.strokeStyle = 'rgba(255,255,255,0.06)';
        roundRectStroke(ctxLocal, px+6, py+6, cellW-12, cellH-12, 8);
      }
    }
  }
}

// draw hold preview (same as next)
function drawHold(ctxLocal, type){
  ctxLocal.clearRect(0,0,holdCanvas.width,holdCanvas.height);
  if(!type) return drawPreview(ctxLocal, type);
  drawPreview(ctxLocal, type);
}

// ----------------------- Game Loop -----------------------
function update(time=0){
  if(!lastFrame) lastFrame = time;
  const delta = time - lastFrame;
  lastFrame = time;
  if(!paused && !gameOver){
    // gravity
    if(time - lastGravity > dropInterval){
      lastGravity = time;
      // try falling
      if(!movePiece(0,1)){
        // if can't move down, lock piece
        placePiece();
      }
    }
  }
  render();
  requestAnimationFrame(update);
}

// ----------------------- Events & Controls -----------------------
function attachEvents(){
  // keyboard controls
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  startBtn.addEventListener('click', startGame);
  playAgainBtn.addEventListener('click', startGame);
  musicToggleBtn.addEventListener('click', toggleMusic);
  sfxToggle.addEventListener('change', ()=> sfxEnabled = sfxToggle.checked);

  // pointer / focus
  canvas.addEventListener('pointerdown', (e) => { canvas.focus(); });
  // prevent scroll on mobile when pressing buttons
  document.addEventListener('touchmove', (e)=>{ if(e.target.closest('.touch')) e.preventDefault(); }, {passive:false});
}

function onKeyDown(e){
  if(e.repeat) {
    // allow certain repeats (left/right soft drop). Browsers generate repeats automatically.
  }
  switch(e.key){
    case 'ArrowLeft':
      movePiece(-1,0);
      playSfx('move');
      break;
    case 'ArrowRight':
      movePiece(1,0);
      playSfx('move');
      break;
    case 'ArrowDown':
      softDrop();
      break;
    case ' ': // space
      e.preventDefault();
      hardDrop();
      break;
    case 'x':
    case 'X':
    case 'ArrowUp':
      rotatePiece(1);
      break;
    case 'z':
    case 'Z':
      rotatePiece(-1);
      break;
    case 'c':
    case 'C':
      holdCurrent();
      break;
    case 'p':
    case 'P':
      togglePause();
      break;
  }
  updatePreviews();
}

function onKeyUp(e){
  // no-op for now
}

function handleTouchAction(action){
  switch(action){
    case 'left': movePiece(-1,0); playSfx('move'); break;
    case 'right': movePiece(1,0); playSfx('move'); break;
    case 'soft': softDrop(); break;
    case 'hard': hardDrop(); break;
    case 'rotCW': rotatePiece(1); break;
    case 'rotCCW': rotatePiece(-1); break;
    case 'hold': holdCurrent(); break;
    case 'pause': togglePause(); break;
  }
  updatePreviews();
}

// ----------------------- UI & State Helpers -----------------------
function startGame(){
  overlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  resetGameState();
  // spawn first piece
  for(let i=0;i<2;i++){ // spawn twice because spawnPiece will shift queue etc.
    if(!currentPiece) spawnPiece();
  }
  spawnPiece();
  updatePreviews();
  lastGravity = performance.now();
  lastFrame = performance.now();
  requestAnimationFrame(update);
  playMusic();
}

function endGame(){
  gameOver = true;
  paused = false;
  finalScoreEl.textContent = `Score: ${score}`;
  gameOverOverlay.classList.remove('hidden');
  playSfx('gameover');
  stopMusic();
}

function togglePause(){
  if(gameOver) return;
  paused = !paused;
  const overlayEl = document.getElementById('overlay');
  if(paused){
    overlayEl.classList.remove('hidden');
    overlayEl.classList.add('start');
    overlayEl.querySelector('.start-panel .neon-title').textContent = 'Paused';
    overlayEl.querySelector('#startBtn').textContent = 'Resume';
    overlayEl.querySelector('.controls-legend').style.display = 'none';
  } else {
    overlayEl.classList.add('hidden');
    overlayEl.querySelector('.start-panel .neon-title').textContent = 'Neon Tetris';
    overlayEl.querySelector('#startBtn').textContent = 'Start Game';
    overlayEl.querySelector('.controls-legend').style.display = 'block';
  }
}

function updateStats(){
  scoreEl.textContent = score;
  levelEl.textContent = level;
  linesEl.textContent = lines;
}

function updatePreviews(){
  drawPreview(nextCtx, nextQueue[0]);
  drawHold(holdCtx, holdPiece);
}

// ----------------------- Audio (WebAudio synths) -----------------------
function playSfx(type){
  if(!sfxEnabled) return;
  const now = audio.currentTime;
  const o = audio.createOscillator();
  const g = audio.createGain();
  o.connect(g); g.connect(audio.destination);
  g.gain.setValueAtTime(0, now);
  switch(type){
    case 'move':
      o.type = 'sine';
      o.frequency.setValueAtTime(660, now);
      g.gain.linearRampToValueAtTime(0.02, now+0.001);
      g.gain.exponentialRampToValueAtTime(0.0001, now+0.09);
      o.start(now); o.stop(now+0.12);
      break;
    case 'rotate':
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(880, now);
      g.gain.linearRampToValueAtTime(0.03, now+0.001);
      g.gain.exponentialRampToValueAtTime(0.0001, now+0.12);
      o.start(now); o.stop(now+0.13);
      break;
    case 'line':
      // chord
      const freqs = [220, 330, 440];
      const os = freqs.map(f=>{
        const osc = audio.createOscillator();
        const gg = audio.createGain();
        osc.connect(gg); gg.connect(audio.destination);
        osc.type='sine';
        osc.frequency.setValueAtTime(f, now);
        gg.gain.setValueAtTime(0, now);
        gg.gain.linearRampToValueAtTime(0.03, now+0.003);
        gg.gain.exponentialRampToValueAtTime(0.0001, now+0.28);
        osc.start(now); osc.stop(now+0.28);
        return osc;
      });
      break;
    case 'hard':
      o.type = 'triangle';
      o.frequency.setValueAtTime(120, now);
      g.gain.linearRampToValueAtTime(0.06, now+0.001);
      g.gain.exponentialRampToValueAtTime(0.0001, now+0.18);
      o.start(now); o.stop(now+0.18);
      break;
    case 'hold':
      o.type='square';
      o.frequency.setValueAtTime(330, now);
      g.gain.linearRampToValueAtTime(0.03, now+0.001);
      g.gain.exponentialRampToValueAtTime(0.0001, now+0.15);
      o.start(now); o.stop(now+0.15);
      break;
    case 'gameover':
      // descending noise
      o.type='sawtooth';
      o.frequency.setValueAtTime(880, now);
      g.gain.linearRampToValueAtTime(0.08, now+0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now+1.2);
      o.frequency.exponentialRampToValueAtTime(220, now+1.2);
      o.start(now); o.stop(now+1.25);
      break;
    default:
      o.type='sine';
      o.frequency.setValueAtTime(440, now);
      g.gain.linearRampToValueAtTime(0.02, now+0.001);
      g.gain.exponentialRampToValueAtTime(0.0001, now+0.12);
      o.start(now); o.stop(now+0.12);
  }
}

// Simple background synth loop (toggleable)
function playMusic(){
  if(musicRunning) return;
  musicRunning = true;
  musicToggleBtn.textContent = 'Music: On';
  // create a very light arpeggio
  let step = 0;
  musicInterval = setInterval(()=>{
    if(!musicRunning) return;
    const now = audio.currentTime;
    // create per-step oscillator with short envelope
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.connect(g); g.connect(audio.destination);
    o.type = (step % 3 === 0) ? 'sine' : 'triangle';
    const baseFreq = 110;
    const freq = baseFreq * [1, 1.25, 1.5, 2][step % 4];
    o.frequency.setValueAtTime(freq, now);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.02, now+0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now+0.5);
    o.start(now); o.stop(now+0.6);
    step++;
  }, 400);
}

function stopMusic(){
  musicRunning = false;
  musicToggleBtn.textContent = 'Music: Off';
  if(musicInterval) clearInterval(musicInterval);
}

function toggleMusic(){
  if(!musicRunning){
    // resume audio context upon user gesture requirement
    if(audio.state === 'suspended') audio.resume();
    playMusic();
  } else {
    stopMusic();
  }
}

init();

// Make sure canvas is focusable for keyboard events
canvas.setAttribute('tabindex','0');
canvas.addEventListener('focus', ()=>{ /* optional visual */ });

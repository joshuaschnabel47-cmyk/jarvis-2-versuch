(function () {
  "use strict";

  const launcher = document.getElementById("games-launcher");
  const chessRoot = document.getElementById("chessRoot");
  const connect4Root = document.getElementById("connect4Root");
  const memoryRoot = document.getElementById("memoryRoot");
  const snakeRoot = document.getElementById("snakeRoot");
  const g2048Root = document.getElementById("g2048Root");
  const tttRoot = document.getElementById("tttRoot");
  const minesRoot = document.getElementById("minesRoot");
  const battleshipRoot = document.getElementById("battleshipRoot");
  const sudokuRoot = document.getElementById("sudokuRoot");
  const reflexRoot = document.getElementById("reflexRoot");
  const puzzle15Root = document.getElementById("puzzle15Root");
  const airhockeyRoot = document.getElementById("airhockeyRoot");
  const checkersRoot = document.getElementById("checkersRoot");
  const minigolfRoot = document.getElementById("minigolfRoot");
  const billiardRoot = document.getElementById("billiardRoot");
  const gamesExitBtn = document.getElementById("games-exit-btn");

  const allViews = () => [launcher, chessRoot, connect4Root, memoryRoot, snakeRoot, g2048Root, tttRoot, minesRoot, battleshipRoot, sudokuRoot, reflexRoot, puzzle15Root, airhockeyRoot, checkersRoot, minigolfRoot, billiardRoot].filter(Boolean);

  function showGamesLauncher() {
    allViews().forEach(v => v.classList.add("hidden"));
    launcher?.classList.remove("hidden");
    stopSnake();
    stopReflex();
    window.stopAirHockey?.();
    window.stopMinigolf?.();
    window.stopBilliard?.();
    renderHighscores();
  }
  // Exposed so jarvis-script.js can reset to the launcher every time
  // the SPIELE mode is opened from the topbar.
  window.showGamesLauncher = showGamesLauncher;

  function openGame(name) {
    allViews().forEach(v => v.classList.add("hidden"));
    if (name === "chess") chessRoot?.classList.remove("hidden");
    else if (name === "connect4") { connect4Root?.classList.remove("hidden"); initConnect4(); }
    else if (name === "memory") { memoryRoot?.classList.remove("hidden"); initMemory(); }
    else if (name === "snake") { snakeRoot?.classList.remove("hidden"); initSnake(); }
    else if (name === "2048") { g2048Root?.classList.remove("hidden"); init2048(); }
    else if (name === "ttt") { tttRoot?.classList.remove("hidden"); initTTT(); }
    else if (name === "mines") { minesRoot?.classList.remove("hidden"); initMines(); }
    else if (name === "battleship") { battleshipRoot?.classList.remove("hidden"); initBattleship(); }
    else if (name === "sudoku") { sudokuRoot?.classList.remove("hidden"); initSudoku(); }
    else if (name === "reflex") { reflexRoot?.classList.remove("hidden"); initReflex(); }
    else if (name === "puzzle15") { puzzle15Root?.classList.remove("hidden"); initPuzzle15(); }
    else if (name === "airhockey") { airhockeyRoot?.classList.remove("hidden"); window.initAirHockey?.(); }
    else if (name === "checkers") { checkersRoot?.classList.remove("hidden"); window.initCheckers?.(); }
    else if (name === "minigolf") { minigolfRoot?.classList.remove("hidden"); window.initMinigolf?.(); }
    else if (name === "billiard") { billiardRoot?.classList.remove("hidden"); window.initBilliard?.(); }
  }

  /* =========================================================
     GLOBALE HIGHSCORE-LISTE (über alle Spiele hinweg)
     ========================================================= */
  const HS_KEY = "jarvisGameHighscores";
  const HS_LABELS = {
    snake: "Holo Snake (Punkte)",
    "2048": "Holo 2048 (Punkte)",
    memory: "Holo Memory (wenigste Züge)",
    mines: "Minesweeper (Siege)",
    ttt: "Tic-Tac-Toe (Siege vs. KI)",
    connect4: "Vier Gewinnt (Siege)",
    battleship: "Schiffe versenken (Siege)",
    sudoku: "Sudoku (gelöst)",
    reflex: "Reaktionstest (schnellste ms)",
    puzzle15: "Schiebepuzzle (wenigste Züge)",
    airhockey: "Air Hockey 3D (Siege)",
    checkers: "3D-Dame (Siege)",
    minigolf: "Mini-Golf 3D (wenigste Schläge)",
    billiard: "Billard 3D (Siege)"
  };
  function loadHighscores() {
    try { return JSON.parse(localStorage.getItem(HS_KEY)) || {}; } catch (_) { return {}; }
  }
  function saveHighscores(hs) { localStorage.setItem(HS_KEY, JSON.stringify(hs)); }

  // higherIsBetter=false means "lower is better" (e.g. Memory Züge)
  function recordScore(game, value, higherIsBetter = true) {
    const hs = loadHighscores();
    const current = hs[game];
    if (current === undefined ||
        (higherIsBetter && value > current) ||
        (!higherIsBetter && value < current)) {
      hs[game] = value;
      saveHighscores(hs);
    }
    renderHighscores();
  }
  window.recordGameScore = recordScore;

  function incrementHighscore(game) {
    const hs = loadHighscores();
    hs[game] = (hs[game] || 0) + 1;
    saveHighscores(hs);
    renderHighscores();
  }
  window.incrementGameHighscore = incrementHighscore;

  function renderHighscores() {
    const el = document.getElementById("highscoreList");
    if (!el) return;
    const hs = loadHighscores();
    const entries = Object.keys(HS_LABELS).filter(k => hs[k] !== undefined);
    el.innerHTML = entries.length
      ? entries.map(k => `<div class="highscore-item"><span>${HS_LABELS[k]}</span><strong>${hs[k]}</strong></div>`).join("")
      : '<div class="empty-hint">Noch keine Highscores — leg direkt los!</div>';
  }
  renderHighscores();

  document.querySelectorAll(".game-tile").forEach(tile => {
    tile.addEventListener("click", () => openGame(tile.dataset.game));
  });

  document.querySelectorAll("[data-back-to-launcher]").forEach(btn => {
    btn.addEventListener("click", showGamesLauncher);
  });

  gamesExitBtn?.addEventListener("click", () => {
    document.getElementById("schoolModeBtn")?.click();
  });

  /* =========================================================
     VIER GEWINNT
     ========================================================= */
  const C4_ROWS = 6, C4_COLS = 7;
  let c4Board, c4Turn, c4Over, c4Initialized = false;
  const c4BoardEl = document.getElementById("c4-board");
  const c4StatusEl = document.getElementById("c4-status");
  const c4RestartBtn = document.getElementById("c4-restart-btn");

  function c4NewGame() {
    c4Board = Array.from({ length: C4_ROWS }, () => Array(C4_COLS).fill(0));
    c4Turn = 1;
    c4Over = false;
    c4Render();
    c4UpdateStatus();
  }

  function c4Render() {
    if (!c4BoardEl) return;
    c4BoardEl.innerHTML = "";
    for (let r = 0; r < C4_ROWS; r++) {
      for (let c = 0; c < C4_COLS; c++) {
        const cell = document.createElement("div");
        cell.className = "c4-cell";
        const v = c4Board[r][c];
        if (v === 1) cell.classList.add("p1");
        else if (v === 2) cell.classList.add("p2");
        cell.dataset.col = String(c);
        cell.addEventListener("click", () => c4Drop(c));
        c4BoardEl.appendChild(cell);
      }
    }
  }

  function c4UpdateStatus(text) {
    if (!c4StatusEl) return;
    if (text) { c4StatusEl.textContent = text; return; }
    c4StatusEl.textContent = c4Turn === 1
      ? "Spieler 🔵 ist am Zug."
      : "Spieler 🟣 ist am Zug.";
  }

  function c4Drop(col) {
    if (c4Over) return;
    for (let r = C4_ROWS - 1; r >= 0; r--) {
      if (c4Board[r][col] === 0) {
        c4Board[r][col] = c4Turn;
        c4Render();
        const win = c4CheckWin(r, col, c4Turn);
        if (win) {
          win.forEach(([wr, wc]) => {
            const idx = wr * C4_COLS + wc;
            c4BoardEl.children[idx]?.classList.add("win");
          });
          c4UpdateStatus((c4Turn === 1 ? "🔵" : "🟣") + " gewinnt die Partie!");
          c4Over = true;
          incrementHighscore("connect4");
          return;
        }
        if (c4Board.every(row => row.every(cell => cell !== 0))) {
          c4UpdateStatus("Unentschieden — das Feld ist voll.");
          c4Over = true;
          return;
        }
        c4Turn = c4Turn === 1 ? 2 : 1;
        c4UpdateStatus();
        return;
      }
    }
  }

  function c4CheckWin(row, col, player) {
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for (const [dr, dc] of dirs) {
      const line = [[row,col]];
      for (const sign of [1,-1]) {
        let r = row + dr*sign, c = col + dc*sign;
        while (r >= 0 && r < C4_ROWS && c >= 0 && c < C4_COLS && c4Board[r][c] === player) {
          line.push([r,c]);
          r += dr*sign; c += dc*sign;
        }
      }
      if (line.length >= 4) return line;
    }
    return null;
  }

  c4RestartBtn?.addEventListener("click", c4NewGame);

  function initConnect4() {
    if (c4Initialized) return;
    c4Initialized = true;
    c4NewGame();
  }

  /* =========================================================
     HOLO MEMORY
     ========================================================= */
  const MEM_ICONS = ["♞","◈","♟","⬡","☄","✦","♜","⌬"];
  let memCards, memFlipped, memMatchedCount, memMoves, memLock, memInitialized = false;
  const memBoardEl = document.getElementById("mem-board");
  const memStatusEl = document.getElementById("mem-status");
  const memRestartBtn = document.getElementById("mem-restart-btn");

  function memShuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function memNewGame() {
    memCards = memShuffle([...MEM_ICONS, ...MEM_ICONS]);
    memFlipped = [];
    memMatchedCount = 0;
    memMoves = 0;
    memLock = false;
    memRender();
    memUpdateStatus();
  }

  function memRender() {
    if (!memBoardEl) return;
    memBoardEl.innerHTML = "";
    memCards.forEach((icon, i) => {
      const card = document.createElement("div");
      card.className = "mem-card";
      card.dataset.index = String(i);
      card.textContent = icon;
      card.addEventListener("click", () => memFlip(i));
      memBoardEl.appendChild(card);
    });
  }

  function memUpdateStatus() {
    if (!memStatusEl) return;
    memStatusEl.textContent = `Züge: ${memMoves} · Gefundene Paare: ${memMatchedCount} / ${MEM_ICONS.length}`;
  }

  function memFlip(i) {
    if (memLock) return;
    const cardEl = memBoardEl.children[i];
    if (!cardEl || cardEl.classList.contains("flipped") || cardEl.classList.contains("matched")) return;
    cardEl.classList.add("flipped");
    memFlipped.push(i);
    if (memFlipped.length === 2) {
      memMoves++;
      memUpdateStatus();
      const [a, b] = memFlipped;
      if (memCards[a] === memCards[b]) {
        memBoardEl.children[a].classList.add("matched");
        memBoardEl.children[b].classList.add("matched");
        memFlipped = [];
        memMatchedCount++;
        memUpdateStatus();
        if (memMatchedCount === MEM_ICONS.length) {
          memStatusEl.textContent = `Geschafft! Alle Paare in ${memMoves} Zügen gefunden.`;
          recordScore("memory", memMoves, false);
        }
      } else {
        memLock = true;
        setTimeout(() => {
          memBoardEl.children[a]?.classList.remove("flipped");
          memBoardEl.children[b]?.classList.remove("flipped");
          memFlipped = [];
          memLock = false;
        }, 700);
      }
    }
  }

  memRestartBtn?.addEventListener("click", memNewGame);

  function initMemory() {
    if (memInitialized) return;
    memInitialized = true;
    memNewGame();
  }

  /* =========================================================
     HOLO SNAKE
     ========================================================= */
  const SNAKE_GRID = 18;
  const snakeCanvas = document.getElementById("snake-canvas");
  const snakeCtx = snakeCanvas?.getContext("2d");
  const snakeStatusEl = document.getElementById("snake-status");
  const snakeRestartBtn = document.getElementById("snake-restart-btn");
  const snakeDpad = document.getElementById("snake-dpad");
  let snakeCell, snake, snakeDir, snakeNextDir, snakeFood, snakeScore, snakeAlive, snakeTimer, snakeInitialized = false;

  function snakeSetup() {
    snakeCell = snakeCanvas.width / SNAKE_GRID;
    snake = [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }];
    snakeDir = { x: 1, y: 0 };
    snakeNextDir = { x: 1, y: 0 };
    snakeScore = 0;
    snakeAlive = true;
    snakePlaceFood();
    snakeUpdateStatus();
  }

  function snakePlaceFood() {
    let pos;
    do {
      pos = { x: Math.floor(Math.random() * SNAKE_GRID), y: Math.floor(Math.random() * SNAKE_GRID) };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    snakeFood = pos;
  }

  function snakeUpdateStatus(msg) {
    if (!snakeStatusEl) return;
    snakeStatusEl.textContent = msg || `Punkte: ${snakeScore} · Pfeiltasten oder Wischen zum Steuern`;
  }

  function snakeDraw() {
    if (!snakeCtx) return;
    snakeCtx.fillStyle = "rgba(1,6,14,0.9)";
    snakeCtx.fillRect(0, 0, snakeCanvas.width, snakeCanvas.height);
    snakeCtx.strokeStyle = "rgba(0,229,255,0.08)";
    for (let i = 0; i <= SNAKE_GRID; i++) {
      snakeCtx.beginPath();
      snakeCtx.moveTo(i * snakeCell, 0);
      snakeCtx.lineTo(i * snakeCell, snakeCanvas.height);
      snakeCtx.stroke();
      snakeCtx.beginPath();
      snakeCtx.moveTo(0, i * snakeCell);
      snakeCtx.lineTo(snakeCanvas.width, i * snakeCell);
      snakeCtx.stroke();
    }
    snakeCtx.fillStyle = "#ffb454";
    snakeCtx.shadowColor = "#ffb454";
    snakeCtx.shadowBlur = 10;
    snakeCtx.fillRect(snakeFood.x * snakeCell + 2, snakeFood.y * snakeCell + 2, snakeCell - 4, snakeCell - 4);
    snakeCtx.shadowBlur = 0;
    snake.forEach((s, i) => {
      snakeCtx.fillStyle = i === 0 ? "#00e5ff" : "rgba(0,229,255,0.65)";
      snakeCtx.shadowColor = "#00e5ff";
      snakeCtx.shadowBlur = i === 0 ? 12 : 0;
      snakeCtx.fillRect(s.x * snakeCell + 1, s.y * snakeCell + 1, snakeCell - 2, snakeCell - 2);
    });
    snakeCtx.shadowBlur = 0;
  }

  function snakeStep() {
    if (!snakeAlive) return;
    snakeDir = snakeNextDir;
    const head = { x: snake[0].x + snakeDir.x, y: snake[0].y + snakeDir.y };
    if (head.x < 0 || head.x >= SNAKE_GRID || head.y < 0 || head.y >= SNAKE_GRID ||
        snake.some(s => s.x === head.x && s.y === head.y)) {
      snakeAlive = false;
      snakeUpdateStatus(`Game Over — Punkte: ${snakeScore}. Neustart mit dem Button.`);
      clearInterval(snakeTimer);
      recordScore("snake", snakeScore, true);
      return;
    }
    snake.unshift(head);
    if (head.x === snakeFood.x && head.y === snakeFood.y) {
      snakeScore += 10;
      snakeUpdateStatus();
      snakePlaceFood();
    } else {
      snake.pop();
    }
    snakeDraw();
  }

  function snakeSetDir(x, y) {
    if (snakeDir.x === -x && snakeDir.y === -y) return; // no 180° reversal
    snakeNextDir = { x, y };
  }

  const SNAKE_KEYS = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0]
  };
  function snakeKeyHandler(e) {
    if (snakeRoot?.classList.contains("hidden")) return;
    const dir = SNAKE_KEYS[e.key];
    if (dir) { e.preventDefault(); snakeSetDir(dir[0], dir[1]); }
  }
  document.addEventListener("keydown", snakeKeyHandler);

  snakeDpad?.querySelectorAll("[data-dir]").forEach(btn => {
    btn.addEventListener("click", () => {
      const map = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      const d = map[btn.dataset.dir];
      if (d) snakeSetDir(d[0], d[1]);
    });
  });

  // Simple swipe support on the canvas itself.
  let snakeTouchStart = null;
  snakeCanvas?.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    snakeTouchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  snakeCanvas?.addEventListener("touchend", (e) => {
    if (!snakeTouchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - snakeTouchStart.x;
    const dy = t.clientY - snakeTouchStart.y;
    if (Math.abs(dx) > Math.abs(dy)) snakeSetDir(dx > 0 ? 1 : -1, 0);
    else snakeSetDir(0, dy > 0 ? 1 : -1);
    snakeTouchStart = null;
  }, { passive: true });

  function snakeNewGame() {
    clearInterval(snakeTimer);
    snakeSetup();
    snakeDraw();
    snakeTimer = setInterval(snakeStep, 130);
  }

  function stopSnake() {
    clearInterval(snakeTimer);
  }

  snakeRestartBtn?.addEventListener("click", snakeNewGame);

  function initSnake() {
    if (!snakeCanvas) return;
    if (!snakeInitialized) { snakeInitialized = true; }
    snakeNewGame();
  }

  /* =========================================================
     HOLO 2048
     ========================================================= */
  const g2048BoardEl = document.getElementById("g2048-board");
  const g2048StatusEl = document.getElementById("g2048-status");
  const g2048RestartBtn = document.getElementById("g2048-restart-btn");
  let g2048Grid, g2048Score, g2048Initialized = false;

  function g2048Empty() {
    return Array.from({ length: 4 }, () => Array(4).fill(0));
  }
  function g2048AddTile() {
    const empties = [];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (g2048Grid[r][c] === 0) empties.push([r, c]);
    if (!empties.length) return;
    const [r, c] = empties[Math.floor(Math.random() * empties.length)];
    g2048Grid[r][c] = Math.random() < 0.9 ? 2 : 4;
  }
  function g2048NewGame() {
    g2048Grid = g2048Empty();
    g2048Score = 0;
    g2048AddTile();
    g2048AddTile();
    g2048Render();
  }
  const G2048_COLORS = {
    2: "#0d2233", 4: "#0f2c42", 8: "#0e3a55", 16: "#00587a",
    32: "#00789e", 64: "#0099c2", 128: "#22c2ea", 256: "#5fd6f5",
    512: "#9fe6fa", 1024: "#cf42ff", 2048: "#ffb454"
  };
  function g2048Render() {
    if (!g2048BoardEl) return;
    g2048BoardEl.innerHTML = "";
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const v = g2048Grid[r][c];
        const cell = document.createElement("div");
        cell.className = "g2048-cell";
        if (v) {
          cell.textContent = v;
          cell.style.background = G2048_COLORS[v] || "#ffb454";
          cell.style.color = v <= 4 ? "#dff6ff" : "#03050a";
        }
        g2048BoardEl.appendChild(cell);
      }
    }
    if (g2048StatusEl) g2048StatusEl.textContent = `Punkte: ${g2048Score} · Pfeiltasten oder Wischen zum Verschieben`;
  }
  function g2048Slide(row) {
    const vals = row.filter(v => v !== 0);
    const merged = [];
    for (let i = 0; i < vals.length; i++) {
      if (vals[i] === vals[i + 1]) {
        const sum = vals[i] * 2;
        merged.push(sum);
        g2048Score += sum;
        i++;
      } else {
        merged.push(vals[i]);
      }
    }
    while (merged.length < 4) merged.push(0);
    return merged;
  }
  function g2048Rotate(grid) {
    const res = g2048Empty();
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) res[c][3 - r] = grid[r][c];
    return res;
  }
  function g2048Move(dir) {
    // dir: 0=left,1=up,2=right,3=down — normalize to "left" via rotation
    let grid = g2048Grid;
    for (let i = 0; i < dir; i++) grid = g2048Rotate(grid);
    const before = JSON.stringify(grid);
    grid = grid.map(g2048Slide);
    for (let i = 0; i < (4 - dir) % 4; i++) grid = g2048Rotate(grid);
    const changed = JSON.stringify(grid) !== JSON.stringify(g2048Grid);
    g2048Grid = grid;
    if (changed) {
      g2048AddTile();
      g2048Render();
      if (g2048IsGameOver()) {
        if (g2048StatusEl) g2048StatusEl.textContent = `Game Over — Punkte: ${g2048Score}. Neustart mit dem Button.`;
        recordScore("2048", g2048Score, true);
      }
    }
  }
  function g2048IsGameOver() {
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      if (g2048Grid[r][c] === 0) return false;
      if (c < 3 && g2048Grid[r][c] === g2048Grid[r][c + 1]) return false;
      if (r < 3 && g2048Grid[r][c] === g2048Grid[r + 1][c]) return false;
    }
    return true;
  }
  const G2048_KEYS = { ArrowLeft: 0, ArrowUp: 1, ArrowRight: 2, ArrowDown: 3 };
  function g2048KeyHandler(e) {
    if (g2048Root?.classList.contains("hidden")) return;
    if (e.key in G2048_KEYS) { e.preventDefault(); g2048Move(G2048_KEYS[e.key]); }
  }
  document.addEventListener("keydown", g2048KeyHandler);

  let g2048TouchStart = null;
  g2048BoardEl?.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    g2048TouchStart = { x: t.clientX, y: t.clientY };
  }, { passive: true });
  g2048BoardEl?.addEventListener("touchend", (e) => {
    if (!g2048TouchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - g2048TouchStart.x;
    const dy = t.clientY - g2048TouchStart.y;
    if (Math.abs(dx) > Math.abs(dy)) g2048Move(dx > 0 ? 2 : 0);
    else g2048Move(dy > 0 ? 3 : 1);
    g2048TouchStart = null;
  }, { passive: true });

  g2048RestartBtn?.addEventListener("click", g2048NewGame);

  function init2048() {
    if (g2048Initialized) return;
    g2048Initialized = true;
    g2048NewGame();
  }

  /* =========================================================
     TIC-TAC-TOE (mit einfacher, unbesiegbarer Minimax-KI)
     ========================================================= */
  const tttBoardEl = document.getElementById("ttt-board");
  const tttStatusEl = document.getElementById("ttt-status");
  const tttRestartBtn = document.getElementById("ttt-restart-btn");
  const tttModeBtns = document.querySelectorAll(".ttt-mode-btn");
  let tttCells, tttTurn, tttOver, tttMode = "ai", tttInitialized = false;

  const TTT_LINES = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  function tttWinner(cells) {
    for (const [a,b,c] of TTT_LINES) {
      if (cells[a] && cells[a] === cells[b] && cells[b] === cells[c]) return { player: cells[a], line: [a,b,c] };
    }
    if (cells.every(c => c)) return { player: "draw", line: [] };
    return null;
  }

  function tttMinimax(cells, player) {
    const result = tttWinner(cells);
    if (result) {
      if (result.player === "draw") return { score: 0 };
      return { score: result.player === "O" ? 10 : -10 };
    }
    const moves = [];
    for (let i = 0; i < 9; i++) {
      if (!cells[i]) {
        const next = cells.slice();
        next[i] = player;
        const { score } = tttMinimax(next, player === "O" ? "X" : "O");
        moves.push({ index: i, score });
      }
    }
    const best = player === "O"
      ? moves.reduce((a, b) => (b.score > a.score ? b : a))
      : moves.reduce((a, b) => (b.score < a.score ? b : a));
    return best;
  }

  function tttRender() {
    if (!tttBoardEl) return;
    tttBoardEl.innerHTML = "";
    tttCells.forEach((v, i) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "ttt-cell" + (v ? ` ttt-${v.toLowerCase()}` : "");
      cell.textContent = v || "";
      cell.addEventListener("click", () => tttPlay(i));
      tttBoardEl.appendChild(cell);
    });
  }

  function tttUpdateStatus(text) {
    if (tttStatusEl) tttStatusEl.textContent = text;
  }

  function tttPlay(i) {
    if (tttOver || tttCells[i]) return;
    tttCells[i] = tttTurn;
    const result = tttWinner(tttCells);
    if (result) return tttFinish(result);
    tttTurn = tttTurn === "X" ? "O" : "X";
    tttRender();
    if (tttMode === "ai" && tttTurn === "O" && !tttOver) {
      tttUpdateStatus("JARVIS überlegt...");
      setTimeout(tttAiMove, 350);
    } else {
      tttUpdateStatus(tttTurn === "X" ? "Du bist ✕ — du bist am Zug." : "Spieler ⭘ ist am Zug.");
    }
  }

  function tttAiMove() {
    if (tttOver) return;
    const best = tttMinimax(tttCells, "O");
    if (best.index === undefined) return;
    tttCells[best.index] = "O";
    const result = tttWinner(tttCells);
    if (result) return tttFinish(result);
    tttTurn = "X";
    tttRender();
    tttUpdateStatus("Du bist ✕ — du bist am Zug.");
  }

  function tttFinish(result) {
    tttRender();
    tttOver = true;
    if (result.player === "draw") {
      tttUpdateStatus("Unentschieden!");
      return;
    }
    result.line.forEach(i => tttBoardEl.children[i]?.classList.add("ttt-win"));
    if (tttMode === "ai") {
      tttUpdateStatus(result.player === "X" ? "Du gewinnst! 🎉" : "JARVIS gewinnt diese Runde.");
      if (tttMode === "ai" && result.player === "X") incrementHighscore("ttt");
    } else {
      tttUpdateStatus(`Spieler ${result.player === "X" ? "✕" : "⭘"} gewinnt!`);
    }
  }

  function tttNewGame() {
    tttCells = Array(9).fill(null);
    tttTurn = "X";
    tttOver = false;
    tttRender();
    tttUpdateStatus(tttMode === "ai" ? "Du bist ✕ — du beginnst." : "Spieler ✕ beginnt.");
  }

  tttModeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tttModeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      tttMode = btn.dataset.tttMode;
      tttNewGame();
    });
  });
  tttRestartBtn?.addEventListener("click", tttNewGame);

  function initTTT() {
    if (tttInitialized) return;
    tttInitialized = true;
    tttNewGame();
  }

  /* =========================================================
     MINESWEEPER
     ========================================================= */
  const MINES_SIZE = 9, MINES_COUNT = 10;
  const minesBoardEl = document.getElementById("mines-board");
  const minesStatusEl = document.getElementById("mines-status");
  const minesRestartBtn = document.getElementById("mines-restart-btn");
  let minesGrid, minesRevealed, minesFlagged, minesOver, minesInitialized = false;

  function minesNewGame() {
    minesGrid = Array.from({ length: MINES_SIZE }, () => Array(MINES_SIZE).fill(0));
    minesRevealed = Array.from({ length: MINES_SIZE }, () => Array(MINES_SIZE).fill(false));
    minesFlagged = Array.from({ length: MINES_SIZE }, () => Array(MINES_SIZE).fill(false));
    minesOver = false;
    let placed = 0;
    while (placed < MINES_COUNT) {
      const r = Math.floor(Math.random() * MINES_SIZE);
      const c = Math.floor(Math.random() * MINES_SIZE);
      if (minesGrid[r][c] !== -1) { minesGrid[r][c] = -1; placed++; }
    }
    for (let r = 0; r < MINES_SIZE; r++) {
      for (let c = 0; c < MINES_SIZE; c++) {
        if (minesGrid[r][c] === -1) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < MINES_SIZE && nc >= 0 && nc < MINES_SIZE && minesGrid[nr][nc] === -1) count++;
        }
        minesGrid[r][c] = count;
      }
    }
    minesRender();
    minesUpdateStatus("💣 10 Minen · Linksklick: aufdecken · Rechtsklick: markieren");
  }

  function minesUpdateStatus(text) {
    if (minesStatusEl) minesStatusEl.textContent = text;
  }

  function minesRender() {
    if (!minesBoardEl) return;
    minesBoardEl.innerHTML = "";
    for (let r = 0; r < MINES_SIZE; r++) {
      for (let c = 0; c < MINES_SIZE; c++) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "mines-cell";
        if (minesRevealed[r][c]) {
          cell.classList.add("revealed");
          const v = minesGrid[r][c];
          if (v === -1) { cell.textContent = "💣"; cell.classList.add("mine"); }
          else if (v > 0) { cell.textContent = v; cell.dataset.n = v; }
        } else if (minesFlagged[r][c]) {
          cell.textContent = "🚩";
        }
        cell.addEventListener("click", () => minesReveal(r, c));
        cell.addEventListener("contextmenu", (e) => { e.preventDefault(); minesFlag(r, c); });
        minesBoardEl.appendChild(cell);
      }
    }
  }

  function minesFlag(r, c) {
    if (minesOver || minesRevealed[r][c]) return;
    minesFlagged[r][c] = !minesFlagged[r][c];
    minesRender();
  }

  function minesReveal(r, c) {
    if (minesOver || minesRevealed[r][c] || minesFlagged[r][c]) return;
    minesRevealed[r][c] = true;
    if (minesGrid[r][c] === -1) {
      minesOver = true;
      for (let rr = 0; rr < MINES_SIZE; rr++) for (let cc = 0; cc < MINES_SIZE; cc++) {
        if (minesGrid[rr][cc] === -1) minesRevealed[rr][cc] = true;
      }
      minesRender();
      minesUpdateStatus("💥 Getroffen! Neues Feld mit dem Button.");
      return;
    }
    if (minesGrid[r][c] === 0) {
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < MINES_SIZE && nc >= 0 && nc < MINES_SIZE && !minesRevealed[nr][nc]) minesReveal(nr, nc);
      }
    }
    minesRender();
    let revealedCount = 0;
    for (let rr = 0; rr < MINES_SIZE; rr++) for (let cc = 0; cc < MINES_SIZE; cc++) if (minesRevealed[rr][cc]) revealedCount++;
    if (revealedCount === MINES_SIZE * MINES_SIZE - MINES_COUNT) {
      minesOver = true;
      minesUpdateStatus("🏆 Gewonnen! Alle sicheren Felder aufgedeckt.");
      incrementHighscore("mines");
    }
  }

  minesRestartBtn?.addEventListener("click", minesNewGame);

  function initMines() {
    if (minesInitialized) return;
    minesInitialized = true;
    minesNewGame();
  }

  /* =========================================================
     SCHIFFE VERSENKEN (gegen einfache KI)
     ========================================================= */
  const BS_SIZE = 8;
  const BS_SHIPS = [5, 4, 3, 3, 2]; // Längen
  const bsEnemyBoardEl = document.getElementById("bs-enemy-board");
  const bsOwnBoardEl = document.getElementById("bs-own-board");
  const bsStatusEl = document.getElementById("bs-status");
  const bsRestartBtn = document.getElementById("bs-restart-btn");
  let bsPlayerGrid, bsEnemyGrid, bsPlayerShots, bsEnemyShots, bsOver, bsInitialized = false;

  function bsEmptyGrid() {
    return Array.from({ length: BS_SIZE }, () => Array(BS_SIZE).fill(0));
  }

  function bsPlaceShipsRandom(grid) {
    for (const len of BS_SHIPS) {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 200) {
        attempts++;
        const horizontal = Math.random() < 0.5;
        const r = Math.floor(Math.random() * BS_SIZE);
        const c = Math.floor(Math.random() * BS_SIZE);
        const cells = [];
        for (let i = 0; i < len; i++) {
          const rr = horizontal ? r : r + i;
          const cc = horizontal ? c + i : c;
          if (rr >= BS_SIZE || cc >= BS_SIZE) { cells.length = 0; break; }
          cells.push([rr, cc]);
        }
        if (cells.length !== len) continue;
        const fits = cells.every(([rr, cc]) => {
          for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
            const nr = rr + dr, nc = cc + dc;
            if (nr >= 0 && nr < BS_SIZE && nc >= 0 && nc < BS_SIZE && grid[nr][nc] === 1) return false;
          }
          return true;
        });
        if (!fits) continue;
        cells.forEach(([rr, cc]) => { grid[rr][cc] = 1; });
        placed = true;
      }
    }
  }

  function bsNewGame() {
    bsPlayerGrid = bsEmptyGrid();
    bsEnemyGrid = bsEmptyGrid();
    bsPlaceShipsRandom(bsPlayerGrid);
    bsPlaceShipsRandom(bsEnemyGrid);
    bsPlayerShots = Array.from({ length: BS_SIZE }, () => Array(BS_SIZE).fill(null)); // null|"hit"|"miss"
    bsEnemyShots = Array.from({ length: BS_SIZE }, () => Array(BS_SIZE).fill(null));
    bsOver = false;
    bsRender();
    bsUpdateStatus("Klicke ein Feld auf dem gegnerischen Ozean, um zu schießen.");
  }

  function bsUpdateStatus(text) {
    if (bsStatusEl) bsStatusEl.textContent = text;
  }

  function bsRenderBoard(el, grid, shots, revealShips) {
    if (!el) return;
    el.innerHTML = "";
    for (let r = 0; r < BS_SIZE; r++) {
      for (let c = 0; c < BS_SIZE; c++) {
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "bs-cell";
        const shot = shots[r][c];
        if (shot === "hit") { cell.classList.add("bs-hit"); cell.textContent = "✕"; }
        else if (shot === "miss") { cell.classList.add("bs-miss"); cell.textContent = "•"; }
        else if (revealShips && grid[r][c] === 1) { cell.classList.add("bs-ship"); }
        cell.dataset.r = r;
        cell.dataset.c = c;
        el.appendChild(cell);
      }
    }
  }

  function bsRender() {
    bsRenderBoard(bsEnemyBoardEl, bsEnemyGrid, bsPlayerShots, false);
    bsRenderBoard(bsOwnBoardEl, bsPlayerGrid, bsEnemyShots, true);
  }

  function bsCountRemaining(grid, shots) {
    let remaining = 0;
    for (let r = 0; r < BS_SIZE; r++) for (let c = 0; c < BS_SIZE; c++) {
      if (grid[r][c] === 1 && shots[r][c] !== "hit") remaining++;
    }
    return remaining;
  }

  function bsPlayerShoot(r, c) {
    if (bsOver || bsPlayerShots[r][c]) return;
    const hit = bsEnemyGrid[r][c] === 1;
    bsPlayerShots[r][c] = hit ? "hit" : "miss";
    bsRender();
    if (hit && bsCountRemaining(bsEnemyGrid, bsPlayerShots) === 0) {
      bsOver = true;
      bsUpdateStatus("🏆 Du hast die gegnerische Flotte versenkt — gewonnen!");
      incrementHighscore("battleship");
      return;
    }
    bsUpdateStatus(hit ? "Treffer! Du bist erneut am Zug." : "Verfehlt. JARVIS ist am Zug...");
    if (!hit) setTimeout(bsEnemyShoot, 500);
  }

  function bsEnemyShoot() {
    if (bsOver) return;
    let r, c;
    do {
      r = Math.floor(Math.random() * BS_SIZE);
      c = Math.floor(Math.random() * BS_SIZE);
    } while (bsEnemyShots[r][c]);
    const hit = bsPlayerGrid[r][c] === 1;
    bsEnemyShots[r][c] = hit ? "hit" : "miss";
    bsRender();
    if (hit && bsCountRemaining(bsPlayerGrid, bsEnemyShots) === 0) {
      bsOver = true;
      bsUpdateStatus("💥 JARVIS hat deine Flotte versenkt. Neue Partie starten!");
      return;
    }
    if (hit) {
      bsUpdateStatus("JARVIS trifft — noch ein Schuss für JARVIS...");
      setTimeout(bsEnemyShoot, 500);
    } else {
      bsUpdateStatus("JARVIS verfehlt. Du bist am Zug.");
    }
  }

  bsEnemyBoardEl?.addEventListener("click", (e) => {
    const cell = e.target.closest("[data-r]");
    if (!cell) return;
    bsPlayerShoot(Number(cell.dataset.r), Number(cell.dataset.c));
  });
  bsRestartBtn?.addEventListener("click", bsNewGame);

  function initBattleship() {
    if (bsInitialized) return;
    bsInitialized = true;
    bsNewGame();
  }

  /* =========================================================
     HOLO SUDOKU (3 vorgefertigte Rätsel je Schwierigkeit)
     ========================================================= */
  const SUDOKU_REMOVE_COUNT = { leicht: 36, mittel: 46, schwer: 54 };

  // Einfacher Backtracking-Solver / -Generator — erzeugt und löst Sudokus
  // live im Browser, damit Rätsel und Lösung garantiert zusammenpassen.
  function sudokuValid(g, i, val) {
    const row = Math.floor(i / 9), col = i % 9;
    const boxRow = Math.floor(row / 3) * 3, boxCol = Math.floor(col / 3) * 3;
    for (let c = 0; c < 9; c++) if (g[row * 9 + c] === val) return false;
    for (let r = 0; r < 9; r++) if (g[r * 9 + col] === val) return false;
    for (let r = boxRow; r < boxRow + 3; r++)
      for (let c = boxCol; c < boxCol + 3; c++)
        if (g[r * 9 + c] === val) return false;
    return true;
  }
  function sudokuSolve(cells) {
    const grid = cells.slice();
    function solve(g, pos) {
      if (pos === 81) return true;
      if (g[pos] !== null) return solve(g, pos + 1);
      for (let val = 1; val <= 9; val++) {
        if (sudokuValid(g, pos, val)) {
          g[pos] = val;
          if (solve(g, pos + 1)) return true;
          g[pos] = null;
        }
      }
      return false;
    }
    solve(grid, 0);
    return grid;
  }
  function sudokuGenerateFullGrid() {
    const grid = Array(81).fill(null);
    function shuffledDigits() {
      const d = [1,2,3,4,5,6,7,8,9];
      for (let i = d.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [d[i], d[j]] = [d[j], d[i]];
      }
      return d;
    }
    function fill(pos) {
      if (pos === 81) return true;
      if (grid[pos] !== null) return fill(pos + 1);
      for (const val of shuffledDigits()) {
        if (sudokuValid(grid, pos, val)) {
          grid[pos] = val;
          if (fill(pos + 1)) return true;
          grid[pos] = null;
        }
      }
      return false;
    }
    fill(0);
    return grid;
  }
  function sudokuGeneratePuzzle(diff) {
    const solution = sudokuGenerateFullGrid();
    const puzzle = solution.slice();
    const positions = [...Array(81).keys()];
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }
    const removeCount = SUDOKU_REMOVE_COUNT[diff] || 36;
    positions.slice(0, removeCount).forEach(i => { puzzle[i] = null; });
    return { puzzle, solution };
  }
  const sudokuBoardEl = document.getElementById("sudoku-board");
  const sudokuStatusEl = document.getElementById("sudoku-status");
  const sudokuNumpad = document.getElementById("sudoku-numpad");
  const sudokuCheckBtn = document.getElementById("sudoku-check-btn");
  const sudokuRestartBtn = document.getElementById("sudoku-restart-btn");
  const sudokuDiffBtns = document.querySelectorAll(".sudoku-diff-btn");
  let sudokuCells, sudokuGiven, sudokuSolution, sudokuSelected, sudokuDiff = "leicht", sudokuInitialized = false;

  function sudokuLoad(diff) {
    const { puzzle, solution } = sudokuGeneratePuzzle(diff);
    sudokuCells = puzzle;
    sudokuGiven = sudokuCells.map(c => c !== null);
    sudokuSolution = solution;
    sudokuSelected = null;
    sudokuRender();
    if (sudokuStatusEl) sudokuStatusEl.textContent = "Zahl wählen, dann Feld anklicken.";
  }

  function sudokuRender() {
    if (!sudokuBoardEl) return;
    sudokuBoardEl.innerHTML = "";
    sudokuCells.forEach((v, i) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "sudoku-cell";
      if (sudokuGiven[i]) cell.classList.add("sudoku-given");
      if (sudokuSelected === i) cell.classList.add("sudoku-selected");
      const row = Math.floor(i / 9), col = i % 9;
      if (col % 3 === 0) cell.classList.add("sudoku-border-left");
      if (row % 3 === 0) cell.classList.add("sudoku-border-top");
      cell.textContent = v || "";
      cell.addEventListener("click", () => {
        if (sudokuGiven[i]) return;
        sudokuSelected = i;
        sudokuRender();
      });
      sudokuBoardEl.appendChild(cell);
    });
  }

  sudokuNumpad?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-num]");
    if (!btn || sudokuSelected === null) return;
    const num = Number(btn.dataset.num);
    sudokuCells[sudokuSelected] = num === 0 ? null : num;
    sudokuRender();
  });

  sudokuCheckBtn?.addEventListener("click", () => {
    const correct = sudokuCells.every((v, i) => v === sudokuSolution[i]);
    if (correct) {
      if (sudokuStatusEl) sudokuStatusEl.textContent = "🏆 Gelöst! Sehr gut.";
      incrementHighscore("sudoku");
    } else {
      const filled = sudokuCells.filter(v => v !== null).length;
      if (sudokuStatusEl) sudokuStatusEl.textContent = `Noch nicht fertig oder fehlerhaft (${filled}/81 ausgefüllt).`;
    }
  });

  sudokuDiffBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sudokuDiffBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      sudokuDiff = btn.dataset.sudokuDiff;
      sudokuLoad(sudokuDiff);
    });
  });
  sudokuRestartBtn?.addEventListener("click", () => sudokuLoad(sudokuDiff));

  function initSudoku() {
    if (sudokuInitialized) return;
    sudokuInitialized = true;
    sudokuLoad(sudokuDiff);
  }

  /* =========================================================
     REAKTIONSTEST
     ========================================================= */
  const reflexPad = document.getElementById("reflex-pad");
  const reflexPadText = document.getElementById("reflex-pad-text");
  const reflexStatusEl = document.getElementById("reflex-status");
  const reflexBestEl = document.getElementById("reflex-best");
  let reflexState = "idle"; // idle | waiting | ready | result
  let reflexTimeout = null;
  let reflexStartTime = 0;

  function reflexBestKey() { return "jarvisReflexBest"; }
  function reflexLoadBest() {
    const v = Number(localStorage.getItem(reflexBestKey()));
    return v > 0 ? v : null;
  }
  function reflexRenderBest() {
    const best = reflexLoadBest();
    if (reflexBestEl) reflexBestEl.textContent = best ? `Bestzeit: ${best} ms` : "Bestzeit: —";
  }

  function reflexReset() {
    clearTimeout(reflexTimeout);
    reflexState = "idle";
    reflexPad.className = "reflex-pad reflex-idle";
    if (reflexPadText) reflexPadText.textContent = "Start";
    if (reflexStatusEl) reflexStatusEl.textContent = 'Klicke "Start" und warte auf Grün.';
  }

  function stopReflex() {
    clearTimeout(reflexTimeout);
  }

  reflexPad?.addEventListener("click", () => {
    if (reflexState === "idle" || reflexState === "result") {
      reflexState = "waiting";
      reflexPad.className = "reflex-pad reflex-waiting";
      if (reflexPadText) reflexPadText.textContent = "Warten...";
      if (reflexStatusEl) reflexStatusEl.textContent = "Warte auf Grün...";
      const delay = 1200 + Math.random() * 2500;
      reflexTimeout = setTimeout(() => {
        reflexState = "ready";
        reflexPad.className = "reflex-pad reflex-ready";
        if (reflexPadText) reflexPadText.textContent = "JETZT!";
        reflexStartTime = performance.now();
      }, delay);
    } else if (reflexState === "waiting") {
      // zu früh geklickt
      clearTimeout(reflexTimeout);
      reflexState = "result";
      reflexPad.className = "reflex-pad reflex-fail";
      if (reflexPadText) reflexPadText.textContent = "Zu früh!";
      if (reflexStatusEl) reflexStatusEl.textContent = "Zu früh geklickt — nochmal versuchen.";
    } else if (reflexState === "ready") {
      const ms = Math.round(performance.now() - reflexStartTime);
      reflexState = "result";
      reflexPad.className = "reflex-pad reflex-result";
      if (reflexPadText) reflexPadText.textContent = `${ms} ms`;
      if (reflexStatusEl) reflexStatusEl.textContent = "Klicke erneut für einen neuen Versuch.";
      const best = reflexLoadBest();
      if (!best || ms < best) {
        localStorage.setItem(reflexBestKey(), String(ms));
        recordScore("reflex", ms, false);
      }
      reflexRenderBest();
    }
  });

  function initReflex() {
    reflexReset();
    reflexRenderBest();
  }

  /* =========================================================
     SCHIEBEPUZZLE (15-Puzzle)
     ========================================================= */
  const puzzle15BoardEl = document.getElementById("puzzle15-board");
  const puzzle15StatusEl = document.getElementById("puzzle15-status");
  const puzzle15RestartBtn = document.getElementById("puzzle15-restart-btn");
  let puzzle15Tiles, puzzle15Moves, puzzle15Initialized = false;

  function puzzle15Solved() {
    for (let i = 0; i < 15; i++) if (puzzle15Tiles[i] !== i + 1) return false;
    return puzzle15Tiles[15] === null;
  }

  function puzzle15Shuffle() {
    puzzle15Tiles = [...Array(15).keys()].map(n => n + 1);
    puzzle15Tiles.push(null);
    // Führe viele zufällige gültige Züge aus, damit das Puzzle immer lösbar ist.
    for (let i = 0; i < 400; i++) {
      const emptyIdx = puzzle15Tiles.indexOf(null);
      const moves = puzzle15AdjacentIndices(emptyIdx);
      const swapIdx = moves[Math.floor(Math.random() * moves.length)];
      [puzzle15Tiles[emptyIdx], puzzle15Tiles[swapIdx]] = [puzzle15Tiles[swapIdx], puzzle15Tiles[emptyIdx]];
    }
    puzzle15Moves = 0;
  }

  function puzzle15AdjacentIndices(idx) {
    const row = Math.floor(idx / 4), col = idx % 4;
    const result = [];
    if (row > 0) result.push(idx - 4);
    if (row < 3) result.push(idx + 4);
    if (col > 0) result.push(idx - 1);
    if (col < 3) result.push(idx + 1);
    return result;
  }

  function puzzle15Render() {
    if (!puzzle15BoardEl) return;
    puzzle15BoardEl.innerHTML = "";
    puzzle15Tiles.forEach((v, i) => {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "puzzle15-cell" + (v === null ? " puzzle15-empty" : "");
      cell.textContent = v || "";
      cell.addEventListener("click", () => puzzle15Move(i));
      puzzle15BoardEl.appendChild(cell);
    });
    if (puzzle15StatusEl) puzzle15StatusEl.textContent = `Züge: ${puzzle15Moves}`;
  }

  function puzzle15Move(idx) {
    const emptyIdx = puzzle15Tiles.indexOf(null);
    if (!puzzle15AdjacentIndices(emptyIdx).includes(idx)) return;
    [puzzle15Tiles[emptyIdx], puzzle15Tiles[idx]] = [puzzle15Tiles[idx], puzzle15Tiles[emptyIdx]];
    puzzle15Moves++;
    puzzle15Render();
    if (puzzle15Solved()) {
      if (puzzle15StatusEl) puzzle15StatusEl.textContent = `🏆 Gelöst in ${puzzle15Moves} Zügen!`;
      recordScore("puzzle15", puzzle15Moves, false);
    }
  }

  puzzle15RestartBtn?.addEventListener("click", () => { puzzle15Shuffle(); puzzle15Render(); });

  function initPuzzle15() {
    if (puzzle15Initialized) return;
    puzzle15Initialized = true;
    puzzle15Shuffle();
    puzzle15Render();
  }
})();

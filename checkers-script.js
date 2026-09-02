(function () {
  "use strict";

  // 3D-Dame — vollständiges Damespiel (8x8, amerikanische Grundregeln):
  // Pflichtschlagzug, Mehrfachsprünge, Damen (nicht "fliegend").
  // Rendering mit Three.js, Zuglogik komplett selbst geschrieben.

  const container = document.getElementById("ck-canvas-container");
  const statusEl = document.getElementById("ck-status");
  const scoreP1El = document.getElementById("ck-score-p1");
  const scoreP2El = document.getElementById("ck-score-p2");
  const restartBtn = document.getElementById("ck-restart-btn");

  if (!container) return;

  const EMPTY = 0, P1_MAN = 1, P1_KING = 2, P2_MAN = 3, P2_KING = 4;
  const BOARD_N = 8;

  let renderer, scene, camera, raycaster, mouse;
  let squareMeshes = [];   // [row][col] -> mesh (nur dunkle, spielbare Felder haben Klick-Handler)
  let pieceMeshes = [];    // [row][col] -> mesh oder null
  let board = [];
  let currentPlayer = 1;   // 1 oder 2
  let selected = null;     // {row, col} oder null
  let legalForSelected = []; // aktuell mögliche Ziele für die Auswahl
  let mustContinueWith = null; // {row, col} — bei Mehrfachsprung
  let gameOver = false;
  let initialized = false;

  function isP1(v) { return v === P1_MAN || v === P1_KING; }
  function isP2(v) { return v === P2_MAN || v === P2_KING; }
  function isKing(v) { return v === P1_KING || v === P2_KING; }
  function ownerOf(v) { return isP1(v) ? 1 : isP2(v) ? 2 : 0; }

  function newBoard() {
    const b = Array.from({ length: BOARD_N }, () => Array(BOARD_N).fill(EMPTY));
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < BOARD_N; c++) {
        if ((r + c) % 2 === 1) b[r][c] = P1_MAN;
      }
    }
    for (let r = BOARD_N - 3; r < BOARD_N; r++) {
      for (let c = 0; c < BOARD_N; c++) {
        if ((r + c) % 2 === 1) b[r][c] = P2_MAN;
      }
    }
    return b;
  }

  // ---- Zuggenerierung ----
  function pieceDirs(v) {
    if (v === P1_MAN) return [[1, -1], [1, 1]];       // Spieler 1 zieht Richtung höhere Reihen
    if (v === P2_MAN) return [[-1, -1], [-1, 1]];      // Spieler 2 zieht Richtung niedrigere Reihen
    return [[1, -1], [1, 1], [-1, -1], [-1, 1]];       // Damen: alle 4 Richtungen
  }

  function inBounds(r, c) { return r >= 0 && r < BOARD_N && c >= 0 && c < BOARD_N; }

  function getCapturesFrom(b, r, c) {
    const v = b[r][c];
    if (!v) return [];
    const player = ownerOf(v);
    const caps = [];
    for (const [dr, dc] of pieceDirs(v)) {
      const mr = r + dr, mc = c + dc;         // übersprungenes Feld
      const lr = r + dr * 2, lc = c + dc * 2; // Landefeld
      if (!inBounds(lr, lc)) continue;
      const mv = b[mr]?.[mc];
      if (mv && ownerOf(mv) !== player && b[lr][lc] === EMPTY) {
        caps.push({ to: [lr, lc], captured: [mr, mc] });
      }
    }
    return caps;
  }

  function getSimpleMovesFrom(b, r, c) {
    const v = b[r][c];
    if (!v) return [];
    const moves = [];
    for (const [dr, dc] of pieceDirs(v)) {
      const nr = r + dr, nc = c + dc;
      if (inBounds(nr, nc) && b[nr][nc] === EMPTY) moves.push({ to: [nr, nc] });
    }
    return moves;
  }

  function getAllCaptures(b, player) {
    const result = [];
    for (let r = 0; r < BOARD_N; r++) {
      for (let c = 0; c < BOARD_N; c++) {
        if (ownerOf(b[r][c]) === player) {
          const caps = getCapturesFrom(b, r, c);
          caps.forEach(cap => result.push({ from: [r, c], ...cap }));
        }
      }
    }
    return result;
  }

  function getAllSimpleMoves(b, player) {
    const result = [];
    for (let r = 0; r < BOARD_N; r++) {
      for (let c = 0; c < BOARD_N; c++) {
        if (ownerOf(b[r][c]) === player) {
          getSimpleMovesFrom(b, r, c).forEach(m => result.push({ from: [r, c], ...m }));
        }
      }
    }
    return result;
  }

  function legalMovesForPlayer(player) {
    const caps = getAllCaptures(board, player);
    if (caps.length) return { moves: caps, forced: true };
    return { moves: getAllSimpleMoves(board, player), forced: false };
  }

  function maybePromote(b, r, c) {
    const v = b[r][c];
    if (v === P1_MAN && r === BOARD_N - 1) b[r][c] = P1_KING;
    if (v === P2_MAN && r === 0) b[r][c] = P2_KING;
  }

  // ---- Three.js Setup ----
  const SQUARE = 1.4;
  const BOARD_OFFSET = (BOARD_N - 1) / 2;

  function boardToWorld(r, c) {
    return { x: (c - BOARD_OFFSET) * SQUARE, z: (r - BOARD_OFFSET) * SQUARE };
  }

  function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03050a);

    const aspect = container.clientWidth / (container.clientHeight || 500);
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    camera.position.set(0, 10.5, 8.5);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight || 500);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x99aacc, 0.75));
    const dirLight = new THREE.DirectionalLight(0x00e5ff, 0.5);
    dirLight.position.set(4, 10, 6);
    scene.add(dirLight);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Board-Unterlage
    const baseGeo = new THREE.BoxGeometry(BOARD_N * SQUARE + 0.6, 0.3, BOARD_N * SQUARE + 0.6);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x0a1622, metalness: 0.3, roughness: 0.7 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = -0.2;
    scene.add(base);

    squareMeshes = Array.from({ length: BOARD_N }, () => Array(BOARD_N).fill(null));
    const lightMat = new THREE.MeshStandardMaterial({ color: 0x16324a, metalness: 0.1, roughness: 0.9 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x061019, metalness: 0.1, roughness: 0.9 });
    const geo = new THREE.BoxGeometry(SQUARE * 0.96, 0.15, SQUARE * 0.96);

    for (let r = 0; r < BOARD_N; r++) {
      for (let c = 0; c < BOARD_N; c++) {
        const dark = (r + c) % 2 === 1;
        const mesh = new THREE.Mesh(geo, dark ? darkMat.clone() : lightMat);
        const pos = boardToWorld(r, c);
        mesh.position.set(pos.x, 0, pos.z);
        mesh.userData = { row: r, col: c, isSquare: true, dark };
        scene.add(mesh);
        squareMeshes[r][c] = mesh;
      }
    }

    pieceMeshes = Array.from({ length: BOARD_N }, () => Array(BOARD_N).fill(null));

    renderer.domElement.addEventListener("click", onCanvasClick);
  }

  function pieceGeometryFor(v) {
    const group = new THREE.Group();
    const isP1piece = isP1(v);
    const color = isP1piece ? 0xff4d67 : 0xe7f6ff;
    const emissive = isP1piece ? 0x3a0410 : 0x22303c;
    const mat = new THREE.MeshStandardMaterial({ color, emissive, metalness: 0.5, roughness: 0.35 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(SQUARE * 0.36, SQUARE * 0.38, 0.28, 28), mat);
    base.position.y = 0.22;
    group.add(base);
    if (isKing(v)) {
      const crown = new THREE.Mesh(new THREE.CylinderGeometry(SQUARE * 0.24, SQUARE * 0.24, 0.16, 24), mat);
      crown.position.y = 0.42;
      group.add(crown);
    }
    return group;
  }

  function renderBoard() {
    for (let r = 0; r < BOARD_N; r++) {
      for (let c = 0; c < BOARD_N; c++) {
        if (pieceMeshes[r][c]) {
          scene.remove(pieceMeshes[r][c]);
          pieceMeshes[r][c] = null;
        }
        const v = board[r][c];
        if (v) {
          const mesh = pieceGeometryFor(v);
          const pos = boardToWorld(r, c);
          mesh.position.x = pos.x;
          mesh.position.z = pos.z;
          scene.add(mesh);
          pieceMeshes[r][c] = mesh;
        }
        // Highlight zurücksetzen
        const sqMesh = squareMeshes[r][c];
        const dark = (r + c) % 2 === 1;
        sqMesh.material.emissive?.setHex(0x000000);
        sqMesh.material.color.setHex(dark ? 0x061019 : 0x16324a);
      }
    }
    if (selected) {
      squareMeshes[selected.row][selected.col].material.color.setHex(0x00e5ff);
    }
    legalForSelected.forEach(m => {
      const [r, c] = m.to;
      squareMeshes[r][c].material.color.setHex(0xffb454);
    });
    updateScoreUI();
    renderFrame();
  }

  function updateScoreUI() {
    let c1 = 0, c2 = 0;
    for (let r = 0; r < BOARD_N; r++) for (let c = 0; c < BOARD_N; c++) {
      if (isP1(board[r][c])) c1++;
      if (isP2(board[r][c])) c2++;
    }
    if (scoreP1El) scoreP1El.textContent = String(c1);
    if (scoreP2El) scoreP2El.textContent = String(c2);
    return { c1, c2 };
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function onCanvasClick(e) {
    if (gameOver || !renderer) return;
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const targets = squareMeshes.flat();
    const hits = raycaster.intersectObjects(targets, false);
    if (!hits.length) return;
    const { row, col } = hits[0].object.userData;
    handleSquareClick(row, col);
  }

  function handleSquareClick(row, col) {
    const clickedVal = board[row][col];

    // Ziel innerhalb der aktuell erlaubten Optionen?
    const target = legalForSelected.find(m => m.to[0] === row && m.to[1] === col);
    if (selected && target) {
      applyMove(selected, target);
      return;
    }

    // Bei Mehrfachsprung: nur dieselbe Figur darf weiter ziehen.
    if (mustContinueWith) return;

    if (ownerOf(clickedVal) === currentPlayer) {
      const { moves, forced } = legalMovesForPlayer(currentPlayer);
      const forThisPiece = moves.filter(m => m.from[0] === row && m.from[1] === col);
      if (!forThisPiece.length) {
        if (forced) setStatus("Diese Figur kann nicht ziehen — es gibt einen Pflichtschlagzug mit einer anderen Figur.");
        selected = null;
        legalForSelected = [];
        renderBoard();
        return;
      }
      selected = { row, col };
      legalForSelected = forThisPiece;
      renderBoard();
    } else {
      selected = null;
      legalForSelected = [];
      renderBoard();
    }
  }

  function applyMove(from, move) {
    const [tr, tc] = move.to;
    const v = board[from.row][from.col];
    board[from.row][from.col] = EMPTY;
    board[tr][tc] = v;

    let capturedSomething = false;
    if (move.captured) {
      const [cr, cc] = move.captured;
      board[cr][cc] = EMPTY;
      capturedSomething = true;
    }
    maybePromote(board, tr, tc);

    if (capturedSomething) {
      const furtherCaps = getCapturesFrom(board, tr, tc);
      if (furtherCaps.length) {
        // Mehrfachsprung: gleiche Figur muss weiterziehen.
        selected = { row: tr, col: tc };
        legalForSelected = furtherCaps.map(cap => ({ to: cap.to, captured: cap.captured }));
        mustContinueWith = selected;
        renderBoard();
        setStatus(`Spieler ${currentPlayer} muss mit derselben Figur weiterschlagen.`);
        return;
      }
    }

    // Zug/Sprungserie beendet -> Spieler wechseln
    mustContinueWith = null;
    selected = null;
    legalForSelected = [];
    endTurnCheck();
  }

  function endTurnCheck() {
    const { c1, c2 } = updateScoreUI();
    if (c1 === 0) { finishGame(2); return; }
    if (c2 === 0) { finishGame(1); return; }

    currentPlayer = currentPlayer === 1 ? 2 : 1;
    const { moves } = legalMovesForPlayer(currentPlayer);
    if (!moves.length) {
      finishGame(currentPlayer === 1 ? 2 : 1);
      return;
    }
    setStatus(`Spieler ${currentPlayer} (${currentPlayer === 1 ? "Rot" : "Weiß"}) ist am Zug.`);
    renderBoard();
  }

  function finishGame(winner) {
    gameOver = true;
    setStatus(`🏆 Spieler ${winner} (${winner === 1 ? "Rot" : "Weiß"}) gewinnt die Partie!`);
    renderBoard();
    try { window.incrementGameHighscore?.("checkers"); } catch (_) {}
  }

  function newGame() {
    board = newBoard();
    currentPlayer = 1;
    selected = null;
    legalForSelected = [];
    mustContinueWith = null;
    gameOver = false;
    setStatus("Spieler 1 (Rot) beginnt.");
    renderBoard();
  }

  function handleResize() {
    if (!renderer || !camera || !container.clientWidth) return;
    camera.aspect = container.clientWidth / (container.clientHeight || 500);
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight || 500);
    if (scene && camera) renderer.render(scene, camera);
  }
  window.addEventListener("resize", handleResize);

  function renderFrame() {
    if (renderer && scene && camera) renderer.render(scene, camera);
  }

  function initCheckers() {
    if (!initialized) {
      if (typeof THREE === "undefined") {
        if (statusEl) statusEl.textContent = "3D-Engine (Three.js) konnte nicht geladen werden — bitte Internetverbindung prüfen.";
        return;
      }
      setupScene();
      newGame();
      initialized = true;
    }
    handleResize();
    renderFrame();
  }

  restartBtn?.addEventListener("click", newGame);

  window.initCheckers = initCheckers;
})();

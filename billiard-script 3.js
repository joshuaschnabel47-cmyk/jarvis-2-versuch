(function () {
  "use strict";

  // Billard 3D — vereinfachtes 8-Ball für 2 Spieler (Hotseat).
  // Kreis-Kollisionsphysik zwischen allen Kugeln, Banden-Reflexion,
  // Taschen, Gruppen-Zuweisung (Volle/Halbe), Foul-Erkennung.

  const container = document.getElementById("bl-canvas-container");
  const statusEl = document.getElementById("bl-status");
  const scoreP1El = document.getElementById("bl-score-p1");
  const scoreP2El = document.getElementById("bl-score-p2");
  const groupP1El = document.getElementById("bl-p1-group");
  const groupP2El = document.getElementById("bl-p2-group");
  const restartBtn = document.getElementById("bl-restart-btn");

  if (!container) return;

  const TABLE_W = 11, TABLE_D = 22;
  const BALL_R = 0.42;
  const POCKET_R = 0.75;
  const MAX_DRAG = 140;

  const POCKETS = [
    { x: -TABLE_W / 2, z: -TABLE_D / 2 }, { x: 0, z: -TABLE_D / 2 }, { x: TABLE_W / 2, z: -TABLE_D / 2 },
    { x: -TABLE_W / 2, z: TABLE_D / 2 }, { x: 0, z: TABLE_D / 2 }, { x: TABLE_W / 2, z: TABLE_D / 2 }
  ];

  const BALL_COLORS = {
    1: 0xf4c430, 2: 0x1f4fd8, 3: 0xd8231f, 4: 0x6a2fa0, 5: 0xe8641a,
    6: 0x1f8a3a, 7: 0x7a1f1f, 9: 0xf4c430, 10: 0x1f4fd8, 11: 0xd8231f,
    12: 0x6a2fa0, 13: 0xe8641a, 14: 0x1f8a3a, 15: 0x7a1f1f
  };

  let renderer, scene, camera;
  let balls = [];       // {id, x, z, vx, vz, mesh, pocketed, type} type: 'cue'|'solid'|'stripe'|'eight'
  let currentPlayer = 1;
  let playerGroup = { 1: null, 2: null }; // 'solid' | 'stripe' | null (noch offen)
  let scores = { 1: 0, 2: 0 };
  let gameOver = false;
  let ballsMoving = false;
  let initialized = false;
  let dragging = false;
  let dragStart = { x: 0, y: 0 };
  let dragCurrent = { x: 0, y: 0 };
  let aimLine = null;
  let firstContactThisShot = null;
  let pocketedThisShot = [];
  let cueWasPocketed = false;

  function cueBall() { return balls.find(b => b.type === "cue"); }

  function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030a12);

    const aspect = container.clientWidth / (container.clientHeight || 500);
    camera = new THREE.PerspectiveCamera(46, aspect, 0.1, 100);
    camera.position.set(0, 17, 13);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight || 500);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xaabbdd, 0.85));
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight.position.set(4, 12, 6);
    scene.add(dirLight);

    const feltMat = new THREE.MeshStandardMaterial({ color: 0x0a3d24, metalness: 0.05, roughness: 0.95 });
    const felt = new THREE.Mesh(new THREE.PlaneGeometry(TABLE_W, TABLE_D), feltMat);
    felt.rotation.x = -Math.PI / 2;
    scene.add(felt);

    const railMat = new THREE.MeshStandardMaterial({ color: 0x2a1608, metalness: 0.3, roughness: 0.7 });
    const railH = 0.5, railT = 0.35;
    function addRail(w, d, x, z) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, railH, d), railMat);
      mesh.position.set(x, railH / 2, z);
      scene.add(mesh);
    }
    addRail(TABLE_W + railT * 2, railT, 0, -TABLE_D / 2 - railT / 2);
    addRail(TABLE_W + railT * 2, railT, 0, TABLE_D / 2 + railT / 2);
    addRail(railT, TABLE_D, -TABLE_W / 2 - railT / 2, 0);
    addRail(railT, TABLE_D, TABLE_W / 2 + railT / 2, 0);

    const pocketMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    POCKETS.forEach(p => {
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(POCKET_R, POCKET_R, 0.15, 20), pocketMat);
      mesh.position.set(p.x, 0.02, p.z);
      scene.add(mesh);
    });

    attachDragHandlers();
  }

  function makeBallMesh(id, type) {
    const color = type === "cue" ? 0xffffff : (BALL_COLORS[id] || 0xcccccc);
    const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.25 });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(BALL_R, 20, 20), mat);
    if (type === "stripe") {
      const bandMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.3, roughness: 0.3 });
      const band = new THREE.Mesh(new THREE.TorusGeometry(BALL_R * 0.98, BALL_R * 0.32, 12, 24), bandMat);
      band.rotation.x = Math.PI / 2;
      mesh.add(band);
    }
    return mesh;
  }

  function rack() {
    balls.forEach(b => { if (b.mesh) scene.remove(b.mesh); });
    balls = [];

    // Weiße Kugel
    const cue = { id: 0, x: 0, z: TABLE_D / 4, vx: 0, vz: 0, pocketed: false, type: "cue" };
    cue.mesh = makeBallMesh(0, "cue");
    scene.add(cue.mesh);
    balls.push(cue);

    // Dreieck-Aufstellung: 1-7 solid, 9-15 stripe, 8 in der Mitte (Reihe 3)
    const order = [1, 9, 2, 10, 8, 3, 11, 4, 12, 5, 13, 6, 14, 7, 15];
    let idx = 0;
    const startZ = -TABLE_D / 4;
    const spacing = BALL_R * 2.02;
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col <= row; col++) {
        const id = order[idx++];
        const type = id === 8 ? "eight" : (id <= 7 ? "solid" : "stripe");
        const x = (col - row / 2) * spacing;
        const z = startZ - row * spacing * 0.87;
        const b = { id, x, z, vx: 0, vz: 0, pocketed: false, type };
        b.mesh = makeBallMesh(id, type);
        scene.add(b.mesh);
        balls.push(b);
      }
    }
    syncMeshes();
  }

  function syncMeshes() {
    balls.forEach(b => {
      if (!b.mesh) return;
      b.mesh.visible = !b.pocketed;
      b.mesh.position.set(b.x, BALL_R, b.z);
    });
  }

  function setStatus(text) { if (statusEl) statusEl.textContent = text; }

  function groupLabel(g) {
    return g === "solid" ? "(Volle)" : g === "stripe" ? "(Halbe)" : "";
  }
  function updateScoreUI() {
    if (scoreP1El) scoreP1El.textContent = String(scores[1]);
    if (scoreP2El) scoreP2El.textContent = String(scores[2]);
    if (groupP1El) groupP1El.textContent = groupLabel(playerGroup[1]);
    if (groupP2El) groupP2El.textContent = groupLabel(playerGroup[2]);
  }

  // ---- Physik ----
  function stepPhysics(dt) {
    let moving = false;
    balls.forEach(b => {
      if (b.pocketed) return;
      if (Math.abs(b.vx) > 0.001 || Math.abs(b.vz) > 0.001) moving = true;
      b.x += b.vx * dt;
      b.z += b.vz * dt;
      b.vx *= 0.985;
      b.vz *= 0.985;
      if (Math.hypot(b.vx, b.vz) < 0.04) { b.vx = 0; b.vz = 0; }

      const maxX = TABLE_W / 2 - BALL_R, maxZ = TABLE_D / 2 - BALL_R;
      if (b.x > maxX) { b.x = maxX; b.vx *= -0.9; }
      if (b.x < -maxX) { b.x = -maxX; b.vx *= -0.9; }
      if (b.z > maxZ) { b.z = maxZ; b.vz *= -0.9; }
      if (b.z < -maxZ) { b.z = -maxZ; b.vz *= -0.9; }
    });

    // Kugel-Kugel-Kollisionen
    for (let i = 0; i < balls.length; i++) {
      if (balls[i].pocketed) continue;
      for (let j = i + 1; j < balls.length; j++) {
        if (balls[j].pocketed) continue;
        resolveBallCollision(balls[i], balls[j]);
      }
    }

    // Taschen prüfen
    balls.forEach(b => {
      if (b.pocketed) return;
      for (const p of POCKETS) {
        if (Math.hypot(b.x - p.x, b.z - p.z) < POCKET_R) {
          b.pocketed = true;
          b.vx = 0; b.vz = 0;
          pocketedThisShot.push(b);
          break;
        }
      }
    });

    syncMeshes();

    if (moving) { ballsMoving = true; return; }
    if (ballsMoving && !moving) {
      ballsMoving = false;
      resolveShotOutcome();
    }
  }

  function resolveBallCollision(a, b) {
    const dx = b.x - a.x, dz = b.z - a.z;
    const dist = Math.hypot(dx, dz);
    const minDist = BALL_R * 2;
    if (dist > 0 && dist < minDist) {
      if (firstContactThisShot === null && (a.type === "cue" || b.type === "cue")) {
        const other = a.type === "cue" ? b : a;
        if (other.type !== "cue") firstContactThisShot = other;
      }
      const nx = dx / dist, nz = dz / dist;
      const overlap = minDist - dist;
      a.x -= nx * overlap / 2; a.z -= nz * overlap / 2;
      b.x += nx * overlap / 2; b.z += nz * overlap / 2;

      const relVx = a.vx - b.vx, relVz = a.vz - b.vz;
      const relDot = relVx * nx + relVz * nz;
      if (relDot > 0) {
        a.vx -= relDot * nx; a.vz -= relDot * nz;
        b.vx += relDot * nx; b.vz += relDot * nz;
      }
    }
  }

  function resolveShotOutcome() {
    const cue = cueBall();
    cueWasPocketed = cue.pocketed;

    // Gruppe zuweisen, falls noch offen und ein passender Ball versenkt wurde
    if (!playerGroup[currentPlayer]) {
      const firstGroupBall = pocketedThisShot.find(b => b.type === "solid" || b.type === "stripe");
      if (firstGroupBall) {
        playerGroup[currentPlayer] = firstGroupBall.type;
        playerGroup[currentPlayer === 1 ? 2 : 1] = firstGroupBall.type === "solid" ? "stripe" : "solid";
      }
    }

    pocketedThisShot.forEach(b => {
      if (b.type === "solid" || b.type === "stripe") scores[currentPlayer]++;
    });
    updateScoreUI();

    const eightPocketed = pocketedThisShot.some(b => b.type === "eight");
    let foul = false;
    let msg = "";

    if (eightPocketed) {
      const ownGroupCleared = isGroupCleared(currentPlayer);
      if (ownGroupCleared && !cueWasPocketed) {
        gameOver = true;
        setStatus(`🏆 Spieler ${currentPlayer} versenkt die 8 korrekt und gewinnt!`);
        try { window.incrementGameHighscore?.("billiard"); } catch (_) {}
        finishRound();
        return;
      } else {
        gameOver = true;
        const winner = currentPlayer === 1 ? 2 : 1;
        setStatus(`❌ Spieler ${currentPlayer} versenkt die 8 zu früh oder scratcht dabei — Spieler ${winner} gewinnt!`);
        finishRound();
        return;
      }
    }

    if (cueWasPocketed) {
      foul = true;
      msg = "Foul: weiße Kugel versenkt (Scratch). ";
      respotCueBall();
    } else if (firstContactThisShot) {
      const myGroup = playerGroup[currentPlayer];
      if (myGroup && firstContactThisShot.type !== myGroup) {
        foul = true;
        msg = `Foul: falsche Gruppe zuerst getroffen (${groupLabel(myGroup)} wären dran). `;
      }
    } else if (!firstContactThisShot) {
      foul = true;
      msg = "Foul: keine Kugel getroffen. ";
    }

    const potOwn = pocketedThisShot.some(b => playerGroup[currentPlayer] ? b.type === playerGroup[currentPlayer] : (b.type === "solid" || b.type === "stripe"));

    pocketedThisShot = [];
    firstContactThisShot = null;

    if (foul || !potOwn) {
      currentPlayer = currentPlayer === 1 ? 2 : 1;
      setStatus(`${msg}Spieler ${currentPlayer} ist am Zug.`);
    } else {
      setStatus(`Eigene Kugel versenkt — Spieler ${currentPlayer} ist erneut am Zug.`);
    }
    syncMeshes();
  }

  function isGroupCleared(player) {
    const group = playerGroup[player];
    if (!group) return false;
    return !balls.some(b => b.type === group && !b.pocketed);
  }

  function respotCueBall() {
    const cue = cueBall();
    cue.pocketed = false;
    cue.x = 0; cue.z = TABLE_D / 4;
    cue.vx = 0; cue.vz = 0;
  }

  function finishRound() {
    syncMeshes();
  }

  // ---- Eingabe ----
  function attachDragHandlers() {
    const dom = renderer.domElement;

    function screenToLocal(clientX, clientY) {
      const rect = dom.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    }
    function cueScreenPos() {
      const cue = cueBall();
      const vector = new THREE.Vector3(cue.x, BALL_R, cue.z);
      vector.project(camera);
      const rect = dom.getBoundingClientRect();
      return { x: (vector.x * 0.5 + 0.5) * rect.width, y: (-vector.y * 0.5 + 0.5) * rect.height };
    }
    function anyMoving() { return balls.some(b => !b.pocketed && (Math.abs(b.vx) > 0.01 || Math.abs(b.vz) > 0.01)); }

    function down(clientX, clientY) {
      if (gameOver || anyMoving() || cueBall().pocketed) return;
      dragging = true;
      dragStart = cueScreenPos();
      dragCurrent = screenToLocal(clientX, clientY);
      updateAimLine();
    }
    function move(clientX, clientY) {
      if (!dragging) return;
      dragCurrent = screenToLocal(clientX, clientY);
      updateAimLine();
    }
    function up() {
      if (!dragging) return;
      dragging = false;
      const dx = dragStart.x - dragCurrent.x;
      const dy = dragStart.y - dragCurrent.y;
      const dragDist = Math.min(Math.hypot(dx, dy), MAX_DRAG);
      removeAimLine();
      if (dragDist < 8) return;
      const worldDx = dx;
      const worldDz = -dy;
      const dirLen = Math.hypot(worldDx, worldDz) || 1;
      const power = (dragDist / MAX_DRAG) * 16;
      const cue = cueBall();
      cue.vx = (worldDx / dirLen) * power;
      cue.vz = (worldDz / dirLen) * power;
      pocketedThisShot = [];
      firstContactThisShot = null;
      setStatus("Stoß!");
    }

    dom.addEventListener("mousedown", e => down(e.clientX, e.clientY));
    window.addEventListener("mousemove", e => move(e.clientX, e.clientY));
    window.addEventListener("mouseup", up);
    dom.addEventListener("touchstart", e => { const t = e.touches[0]; down(t.clientX, t.clientY); }, { passive: true });
    dom.addEventListener("touchmove", e => { const t = e.touches[0]; move(t.clientX, t.clientY); }, { passive: true });
    dom.addEventListener("touchend", up);
  }

  function updateAimLine() {
    removeAimLine();
    const cue = cueBall();
    const dx = dragStart.x - dragCurrent.x;
    const dy = dragStart.y - dragCurrent.y;
    const dragDist = Math.min(Math.hypot(dx, dy), MAX_DRAG);
    if (dragDist < 6) return;
    const worldDx = dx, worldDz = -dy;
    const dirLen = Math.hypot(worldDx, worldDz) || 1;
    const len = (dragDist / MAX_DRAG) * 5 + 1;
    const points = [
      new THREE.Vector3(cue.x, 0.05, cue.z),
      new THREE.Vector3(cue.x + (worldDx / dirLen) * len, 0.05, cue.z + (worldDz / dirLen) * len)
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    aimLine = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffb454 }));
    scene.add(aimLine);
  }
  function removeAimLine() { if (aimLine) { scene.remove(aimLine); aimLine = null; } }

  let lastTime = 0, running = false, animationId = null;
  function loop(t) {
    if (!running) return;
    const dt = Math.min(0.032, (t - lastTime) / 1000 || 0.016);
    lastTime = t;
    stepPhysics(dt);
    renderer.render(scene, camera);
    animationId = requestAnimationFrame(loop);
  }

  function handleResize() {
    if (!renderer || !camera || !container.clientWidth) return;
    camera.aspect = container.clientWidth / (container.clientHeight || 500);
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight || 500);
  }
  window.addEventListener("resize", handleResize);

  function newGame() {
    currentPlayer = 1;
    playerGroup = { 1: null, 2: null };
    scores = { 1: 0, 2: 0 };
    gameOver = false;
    ballsMoving = false;
    pocketedThisShot = [];
    firstContactThisShot = null;
    rack();
    updateScoreUI();
    setStatus("Spieler 1 ist am Zug. Ziehe von der weißen Kugel weg zum Zielen, loslassen zum Stoßen.");
  }

  function initBilliard() {
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
    running = true;
    lastTime = performance.now();
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(loop);
  }
  function stopBilliard() {
    running = false;
    cancelAnimationFrame(animationId);
  }

  restartBtn?.addEventListener("click", newGame);

  window.initBilliard = initBilliard;
  window.stopBilliard = stopBilliard;
})();

(function () {
  "use strict";

  // Air Hockey 3D — echtzeitfähiges 2-Spieler-Luftpolster-Hockey mit
  // Three.js-Rendering und selbstgeschriebener 2D-Physik (Kreis-Kollisionen)
  // auf der x/z-Ebene eines flachen Tisches.

  const container = document.getElementById("ah-canvas-container");
  const statusEl = document.getElementById("ah-status");
  const scoreP1El = document.getElementById("ah-score-p1");
  const scoreP2El = document.getElementById("ah-score-p2");
  const restartBtn = document.getElementById("ah-restart-btn");
  const root = document.getElementById("airhockeyRoot");

  if (!container) return; // Seite ohne Air-Hockey-Markup — nichts zu tun.

  // ---- Spielfeld-Konstanten (Welteinheiten) ----
  const TABLE_W = 12;   // x-Richtung (links/rechts)
  const TABLE_D = 20;   // z-Richtung (oben/unten, entlang der Spielrichtung)
  const GOAL_HALF_WIDTH = 2.6;
  const PUCK_R = 0.55;
  const PADDLE_R = 0.9;
  const WIN_SCORE = 7;

  let renderer, scene, camera;
  let puckMesh, p1Mesh, p2Mesh;
  let animationId = null;
  let initialized = false;
  let running = false;

  // Spielzustand
  let puck = { x: 0, z: 0, vx: 0, vz: 0 };
  let p1 = { x: 0, z: TABLE_D / 2 - 1.5 };   // unten (nahe Kamera), Spieler 1
  let p2 = { x: 0, z: -(TABLE_D / 2 - 1.5) }; // oben, Spieler 2
  let score1 = 0, score2 = 0;
  let gameOver = false;

  const keys = Object.create(null);
  function onKeyDown(e) { keys[e.key.toLowerCase()] = true; }
  function onKeyUp(e) { keys[e.key.toLowerCase()] = false; }

  function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030a12);

    const aspect = container.clientWidth / container.clientHeight || 1.4;
    camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 100);
    camera.position.set(0, 15, 12.5);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight || 500);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0x88aacc, 0.7);
    scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0x00e5ff, 0.6);
    dirLight.position.set(5, 12, 8);
    scene.add(dirLight);

    // Tischfläche
    const tableGeo = new THREE.PlaneGeometry(TABLE_W, TABLE_D);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x061826, metalness: 0.2, roughness: 0.8 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.rotation.x = -Math.PI / 2;
    scene.add(table);

    // Mittellinie
    const lineGeo = new THREE.PlaneGeometry(TABLE_W, 0.06);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.5 });
    const centerLine = new THREE.Mesh(lineGeo, lineMat);
    centerLine.rotation.x = -Math.PI / 2;
    centerLine.position.y = 0.01;
    scene.add(centerLine);

    // Mittelkreis
    const ringGeo = new THREE.RingGeometry(2, 2.08, 48);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.011;
    scene.add(ring);

    // Banden (niedrige Wände rundherum, mit Lücken für die Tore)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x123045, metalness: 0.3, roughness: 0.6 });
    const wallH = 0.5, wallT = 0.4;
    function addWall(w, d, x, z) {
      const geo = new THREE.BoxGeometry(w, wallH, d);
      const mesh = new THREE.Mesh(geo, wallMat);
      mesh.position.set(x, wallH / 2, z);
      scene.add(mesh);
    }
    // Seitenbanden (links/rechts durchgehend)
    addWall(wallT, TABLE_D + wallT * 2, -TABLE_W / 2 - wallT / 2, 0);
    addWall(wallT, TABLE_D + wallT * 2, TABLE_W / 2 + wallT / 2, 0);
    // Endbanden oben/unten, mit Lücke für das Tor in der Mitte
    const sideLen = (TABLE_W - GOAL_HALF_WIDTH * 2) / 2;
    const sideOffset = GOAL_HALF_WIDTH + sideLen / 2;
    [1, -1].forEach(sign => {
      addWall(sideLen, wallT, -sideOffset, sign * (TABLE_D / 2 + wallT / 2));
      addWall(sideLen, wallT, sideOffset, sign * (TABLE_D / 2 + wallT / 2));
    });

    // Torzonen farblich markieren
    const goalGeoP1 = new THREE.PlaneGeometry(GOAL_HALF_WIDTH * 2, 0.6);
    const goalMatP1 = new THREE.MeshBasicMaterial({ color: 0xcf42ff, transparent: true, opacity: 0.35 });
    const goalP1 = new THREE.Mesh(goalGeoP1, goalMatP1);
    goalP1.rotation.x = -Math.PI / 2;
    goalP1.position.set(0, 0.012, TABLE_D / 2 - 0.3);
    scene.add(goalP1);
    const goalP2 = goalP1.clone();
    goalP2.position.z = -(TABLE_D / 2 - 0.3);
    goalP2.material = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.35 });
    scene.add(goalP2);

    // Puck
    const puckGeo = new THREE.CylinderGeometry(PUCK_R, PUCK_R, 0.3, 24);
    const puckMat = new THREE.MeshStandardMaterial({ color: 0xffb454, emissive: 0x442200, metalness: 0.4, roughness: 0.4 });
    puckMesh = new THREE.Mesh(puckGeo, puckMat);
    puckMesh.position.y = 0.15;
    scene.add(puckMesh);

    // Paddles
    const paddleGeoP1 = new THREE.CylinderGeometry(PADDLE_R, PADDLE_R, 0.4, 32);
    const p1Mat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x003844, metalness: 0.5, roughness: 0.3 });
    p1Mesh = new THREE.Mesh(paddleGeoP1, p1Mat);
    p1Mesh.position.y = 0.2;
    scene.add(p1Mesh);

    const p2Mat = new THREE.MeshStandardMaterial({ color: 0xcf42ff, emissive: 0x330044, metalness: 0.5, roughness: 0.3 });
    p2Mesh = new THREE.Mesh(paddleGeoP1.clone(), p2Mat);
    p2Mesh.position.y = 0.2;
    scene.add(p2Mesh);
  }

  function resetPositions(servingTowards) {
    puck.x = 0; puck.z = 0;
    const speed = 6;
    const dir = servingTowards === 1 ? 1 : -1;
    const angle = (Math.random() - 0.5) * 0.6;
    puck.vx = Math.sin(angle) * speed;
    puck.vz = Math.cos(angle) * speed * dir;
    p1.x = 0; p1.z = TABLE_D / 2 - 1.5;
    p2.x = 0; p2.z = -(TABLE_D / 2 - 1.5);
  }

  function newGame() {
    score1 = 0; score2 = 0;
    gameOver = false;
    updateScoreUI();
    resetPositions(Math.random() < 0.5 ? 1 : -1);
    if (statusEl) statusEl.textContent = "Erster Spieler mit " + WIN_SCORE + " Toren gewinnt.";
  }

  function updateScoreUI() {
    if (scoreP1El) scoreP1El.textContent = String(score1);
    if (scoreP2El) scoreP2El.textContent = String(score2);
  }

  function clampToHalf(paddle, minZ, maxZ) {
    paddle.x = Math.max(-(TABLE_W / 2 - PADDLE_R), Math.min(TABLE_W / 2 - PADDLE_R, paddle.x));
    paddle.z = Math.max(minZ, Math.min(maxZ, paddle.z));
  }

  const PADDLE_SPEED = 14;

  function step(dt) {
    if (gameOver) return;

    // --- Eingaben: Spieler 1 = WASD (untere Hälfte), Spieler 2 = Pfeiltasten (obere Hälfte) ---
    let p1dx = 0, p1dz = 0;
    if (keys["a"]) p1dx -= 1;
    if (keys["d"]) p1dx += 1;
    if (keys["w"]) p1dz -= 1;
    if (keys["s"]) p1dz += 1;
    p1.x += p1dx * PADDLE_SPEED * dt;
    p1.z += p1dz * PADDLE_SPEED * dt;
    clampToHalf(p1, 0.3, TABLE_D / 2 - PADDLE_R);

    let p2dx = 0, p2dz = 0;
    if (keys["arrowleft"]) p2dx -= 1;
    if (keys["arrowright"]) p2dx += 1;
    if (keys["arrowup"]) p2dz -= 1;
    if (keys["arrowdown"]) p2dz += 1;
    p2.x += p2dx * PADDLE_SPEED * dt;
    p2.z += p2dz * PADDLE_SPEED * dt;
    clampToHalf(p2, -(TABLE_D / 2 - PADDLE_R), -0.3);

    // --- Puck-Physik ---
    puck.x += puck.vx * dt;
    puck.z += puck.vz * dt;
    // leichte Reibung
    puck.vx *= 0.995;
    puck.vz *= 0.995;

    // Seitenwände (x)
    const maxX = TABLE_W / 2 - PUCK_R;
    if (puck.x > maxX) { puck.x = maxX; puck.vx *= -0.92; }
    if (puck.x < -maxX) { puck.x = -maxX; puck.vx *= -0.92; }

    // Endbanden (z) — nur außerhalb der Torbreite reflektieren, sonst Tor
    const maxZ = TABLE_D / 2 - PUCK_R;
    if (puck.z > maxZ) {
      if (Math.abs(puck.x) > GOAL_HALF_WIDTH - PUCK_R * 0.4) {
        puck.z = maxZ; puck.vz *= -0.92;
      } else if (puck.z > TABLE_D / 2 + PUCK_R) {
        scoreGoal(2); // Puck komplett hinter Spieler 1s Bande = Tor für Spieler 2
        return;
      }
    }
    if (puck.z < -maxZ) {
      if (Math.abs(puck.x) > GOAL_HALF_WIDTH - PUCK_R * 0.4) {
        puck.z = -maxZ; puck.vz *= -0.92;
      } else if (puck.z < -(TABLE_D / 2 + PUCK_R)) {
        scoreGoal(1);
        return;
      }
    }

    // --- Kollision Puck <-> Paddles ---
    resolvePaddleCollision(p1);
    resolvePaddleCollision(p2);

    // Geschwindigkeit deckeln, damit es nicht ausartet
    const maxSpeed = 22;
    const sp = Math.hypot(puck.vx, puck.vz);
    if (sp > maxSpeed) {
      puck.vx = (puck.vx / sp) * maxSpeed;
      puck.vz = (puck.vz / sp) * maxSpeed;
    }

    syncMeshes();
  }

  function resolvePaddleCollision(paddle) {
    const dx = puck.x - paddle.x;
    const dz = puck.z - paddle.z;
    const dist = Math.hypot(dx, dz);
    const minDist = PUCK_R + PADDLE_R;
    if (dist > 0 && dist < minDist) {
      const nx = dx / dist, nz = dz / dist;
      puck.x = paddle.x + nx * minDist;
      puck.z = paddle.z + nz * minDist;
      const speed = Math.hypot(puck.vx, puck.vz) || 4;
      const kick = 9;
      puck.vx = nx * (speed * 0.6 + kick);
      puck.vz = nz * (speed * 0.6 + kick);
    }
  }

  function scoreGoal(scorer) {
    if (scorer === 1) score1++; else score2++;
    updateScoreUI();
    if (score1 >= WIN_SCORE || score2 >= WIN_SCORE) {
      gameOver = true;
      const winner = score1 >= WIN_SCORE ? 1 : 2;
      if (statusEl) statusEl.textContent = `🏆 Spieler ${winner} gewinnt ${score1}:${score2}!`;
      if (winner) {
        try { window.incrementGameHighscore?.("airhockey"); } catch (_) {}
      }
      return;
    }
    if (statusEl) statusEl.textContent = `Tor für Spieler ${scorer}! Stand ${score1}:${score2}`;
    resetPositions(scorer === 1 ? -1 : 1);
  }

  function syncMeshes() {
    if (puckMesh) { puckMesh.position.x = puck.x; puckMesh.position.z = puck.z; }
    if (p1Mesh) { p1Mesh.position.x = p1.x; p1Mesh.position.z = p1.z; }
    if (p2Mesh) { p2Mesh.position.x = p2.x; p2Mesh.position.z = p2.z; }
  }

  let lastTime = 0;
  function loop(t) {
    if (!running) return;
    const dt = Math.min(0.032, (t - lastTime) / 1000 || 0.016);
    lastTime = t;
    step(dt);
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

  function initAirHockey() {
    if (!initialized) {
      if (typeof THREE === "undefined") {
        if (statusEl) statusEl.textContent = "3D-Engine (Three.js) konnte nicht geladen werden — bitte Internetverbindung prüfen.";
        return;
      }
      setupScene();
      newGame();
      initialized = true;
      document.addEventListener("keydown", onKeyDown);
      document.addEventListener("keyup", onKeyUp);
    }
    handleResize();
    running = true;
    lastTime = performance.now();
    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(loop);
  }

  function stopAirHockey() {
    running = false;
    cancelAnimationFrame(animationId);
  }

  restartBtn?.addEventListener("click", () => {
    newGame();
    syncMeshes();
  });

  window.initAirHockey = initAirHockey;
  window.stopAirHockey = stopAirHockey;
})();

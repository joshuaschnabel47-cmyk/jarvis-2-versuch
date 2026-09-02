(function () {
  "use strict";

  // Mini-Golf 3D — 3 Bahnen mit unterschiedlichem Layout, Maus/Touch-Drag
  // zum Zielen & Schlagen, einfache aber saubere 2D-Physik auf x/z-Ebene.

  const container = document.getElementById("mg-canvas-container");
  const statusEl = document.getElementById("mg-status");
  const holeLabel = document.getElementById("mg-hole-label");
  const strokesLabel = document.getElementById("mg-strokes-label");
  const totalLabel = document.getElementById("mg-total-label");
  const restartBtn = document.getElementById("mg-restart-btn");

  if (!container) return;

  const BALL_R = 0.28;
  const HOLE_R = 0.42;
  const MAX_DRAG = 4.2;
  const POWER_SCALE = 3.4;

  // ---- Bahn-Definitionen (Welteinheiten). Jede Bahn: Startposition,
  // Lochposition, Außenmaße, Hindernisse (Boxen als {x,z,w,d}). ----
  const COURSES = [
    {
      name: "Bahn 1 — Die Gerade",
      w: 6, d: 16,
      start: { x: 0, z: 6.5 },
      hole: { x: 0, z: -6.5 },
      obstacles: [
        { x: -1.6, z: 0, w: 1.2, d: 1.2 },
        { x: 1.6, z: -2, w: 1.2, d: 1.2 }
      ]
    },
    {
      name: "Bahn 2 — Der Knick",
      w: 10, d: 14,
      start: { x: -3.2, z: 5.5 },
      hole: { x: 3.2, z: -5.5 },
      obstacles: [
        { x: 0.5, z: 1, w: 5.5, d: 1.4 },
        { x: -3.5, z: -3, w: 1.2, d: 4 }
      ]
    },
    {
      name: "Bahn 3 — Die Insel",
      w: 8, d: 14,
      start: { x: 0, z: 6 },
      hole: { x: 0, z: -6 },
      obstacles: [
        { x: -2.2, z: 0, w: 1.2, d: 5 },
        { x: 2.2, z: 0, w: 1.2, d: 5 }
      ]
    }
  ];

  let renderer, scene, camera;
  let ballMesh, holeMesh, aimLine;
  let ball = { x: 0, z: 0, vx: 0, vz: 0 };
  let currentCourseIdx = 0;
  let strokes = 0, totalStrokes = 0;
  let moving = false;
  let sunk = false;
  let initialized = false;
  let dragging = false;
  let dragStart = { x: 0, y: 0 };
  let dragCurrent = { x: 0, y: 0 };
  let courseObstacleMeshes = [];
  let wallSegments = []; // {x1,z1,x2,z2} — für Kollision mit dem Rand + Hindernissen

  function course() { return COURSES[currentCourseIdx]; }

  function buildWallSegments(c) {
    const segs = [];
    const hw = c.w / 2, hd = c.d / 2;
    segs.push({ x1: -hw, z1: -hd, x2: hw, z2: -hd });
    segs.push({ x1: hw, z1: -hd, x2: hw, z2: hd });
    segs.push({ x1: hw, z1: hd, x2: -hw, z2: hd });
    segs.push({ x1: -hw, z1: hd, x2: -hw, z2: -hd });
    c.obstacles.forEach(o => {
      const ow = o.w / 2, od = o.d / 2;
      segs.push({ x1: o.x - ow, z1: o.z - od, x2: o.x + ow, z2: o.z - od });
      segs.push({ x1: o.x + ow, z1: o.z - od, x2: o.x + ow, z2: o.z + od });
      segs.push({ x1: o.x + ow, z1: o.z + od, x2: o.x - ow, z2: o.z + od });
      segs.push({ x1: o.x - ow, z1: o.z + od, x2: o.x - ow, z2: o.z - od });
    });
    return segs;
  }

  function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03140a);

    const aspect = container.clientWidth / (container.clientHeight || 500);
    camera = new THREE.PerspectiveCamera(48, aspect, 0.1, 100);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight || 500);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x99ccaa, 0.8));
    const dirLight = new THREE.DirectionalLight(0xccffcc, 0.5);
    dirLight.position.set(4, 10, 6);
    scene.add(dirLight);

    ballMesh = new THREE.Mesh(
      new THREE.SphereGeometry(BALL_R, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x333333, metalness: 0.2, roughness: 0.3 })
    );
    scene.add(ballMesh);

    holeMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(HOLE_R, HOLE_R, 0.12, 24),
      new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    scene.add(holeMesh);

    setupCourseGeometry();
    attachDragHandlers();
  }

  function clearCourseMeshes() {
    courseObstacleMeshes.forEach(m => scene.remove(m));
    courseObstacleMeshes = [];
    if (scene.userData.groundMesh) scene.remove(scene.userData.groundMesh);
    if (scene.userData.wallGroup) scene.remove(scene.userData.wallGroup);
  }

  function setupCourseGeometry() {
    clearCourseMeshes();
    const c = course();
    wallSegments = buildWallSegments(c);

    const groundMat = new THREE.MeshStandardMaterial({ color: 0x0e3b22, metalness: 0.05, roughness: 0.95 });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(c.w, c.d), groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    scene.userData.groundMesh = ground;

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0a2417, metalness: 0.1, roughness: 0.9 });
    const wallGroup = new THREE.Group();
    const hw = c.w / 2, hd = c.d / 2, wallH = 0.5, wallT = 0.25;
    function addBoundaryWall(w, d, x, z) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), wallMat);
      mesh.position.set(x, wallH / 2, z);
      wallGroup.add(mesh);
    }
    addBoundaryWall(c.w + wallT * 2, wallT, 0, -hd - wallT / 2);
    addBoundaryWall(c.w + wallT * 2, wallT, 0, hd + wallT / 2);
    addBoundaryWall(wallT, c.d, -hw - wallT / 2, 0);
    addBoundaryWall(wallT, c.d, hw + wallT / 2, 0);
    scene.add(wallGroup);
    scene.userData.wallGroup = wallGroup;

    const obsMat = new THREE.MeshStandardMaterial({ color: 0x123a24, metalness: 0.15, roughness: 0.85 });
    c.obstacles.forEach(o => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(o.w, wallH, o.d), obsMat);
      mesh.position.set(o.x, wallH / 2, o.z);
      scene.add(mesh);
      courseObstacleMeshes.push(mesh);
    });

    // Kamera auf die aktuelle Bahn ausrichten
    camera.position.set(0, Math.max(c.w, c.d) * 0.85, hd + 3);
    camera.lookAt(0, 0, -hd * 0.15);

    holeMesh.position.set(c.hole.x, 0.02, c.hole.z);
  }

  function resetBall() {
    const c = course();
    ball.x = c.start.x; ball.z = c.start.z;
    ball.vx = 0; ball.vz = 0;
    moving = false;
    sunk = false;
    syncBallMesh();
  }

  function syncBallMesh() {
    ballMesh.position.set(ball.x, BALL_R, ball.z);
  }

  function updateLabels() {
    if (holeLabel) holeLabel.textContent = `${course().name} (${currentCourseIdx + 1} / ${COURSES.length})`;
    if (strokesLabel) strokesLabel.textContent = `Schläge: ${strokes}`;
    if (totalLabel) totalLabel.textContent = `Gesamt: ${totalStrokes}`;
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  // ---- Physik ----
  function segmentReflect(px, pz, vx, vz, seg) {
    // Reflektiert die Ballgeschwindigkeit, wenn er über die Wandlinie hinausragt.
    const dx = seg.x2 - seg.x1, dz = seg.z2 - seg.z1;
    const len = Math.hypot(dx, dz) || 1;
    const nx = dz / len, nz = -dx / len; // Normalenvektor
    const relx = px - seg.x1, relz = pz - seg.z1;
    const dist = relx * nx + relz * nz;
    if (Math.abs(dist) < BALL_R) {
      const t = (relx * dx + relz * dz) / (len * len);
      if (t >= -0.02 && t <= 1.02) {
        const dot = vx * nx + vz * nz;
        if (dot !== 0) {
          return {
            vx: (vx - 2 * dot * nx) * 0.86,
            vz: (vz - 2 * dot * nz) * 0.86,
            push: dist < 0 ? -1 : 1, nx, nz, penetration: BALL_R - Math.abs(dist)
          };
        }
      }
    }
    return null;
  }

  function stepPhysics(dt) {
    if (!moving || sunk) return;
    ball.x += ball.vx * dt;
    ball.z += ball.vz * dt;

    // Reibung
    const friction = 0.985;
    ball.vx *= friction;
    ball.vz *= friction;

    // Kollision mit allen Wandsegmenten
    for (const seg of wallSegments) {
      const res = segmentReflect(ball.x, ball.z, ball.vx, ball.vz, seg);
      if (res) {
        ball.vx = res.vx; ball.vz = res.vz;
        ball.x += res.nx * res.push * res.penetration;
        ball.z += res.nz * res.push * res.penetration;
      }
    }

    const speed = Math.hypot(ball.vx, ball.vz);

    // Loch treffen?
    const hd = Math.hypot(ball.x - course().hole.x, ball.z - course().hole.z);
    if (hd < HOLE_R * 0.75 && speed < 3.2) {
      sunk = true;
      moving = false;
      ball.x = course().hole.x; ball.z = course().hole.z;
      syncBallMesh();
      onHoleComplete();
      return;
    }

    if (speed < 0.06) {
      ball.vx = 0; ball.vz = 0;
      moving = false;
    }
    syncBallMesh();
  }

  function onHoleComplete() {
    setStatus(`⛳ Eingelocht! ${strokes} Schlag/Schläge auf dieser Bahn.`);
    setTimeout(() => {
      if (currentCourseIdx < COURSES.length - 1) {
        currentCourseIdx++;
        strokes = 0;
        setupCourseGeometry();
        resetBall();
        updateLabels();
        setStatus(`${course().name} — viel Erfolg!`);
      } else {
        setStatus(`🏆 Runde beendet! Gesamt: ${totalStrokes} Schläge für alle 3 Bahnen.`);
        try { window.recordGameScore?.("minigolf", totalStrokes, false); } catch (_) {}
      }
    }, 1200);
  }

  // ---- Eingabe: Drag vom Ball weg zum Zielen, loslassen zum Schlagen ----
  function attachDragHandlers() {
    const dom = renderer.domElement;

    function screenToLocal(clientX, clientY) {
      const rect = dom.getBoundingClientRect();
      return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function ballScreenPos() {
      const vector = new THREE.Vector3(ball.x, BALL_R, ball.z);
      vector.project(camera);
      const rect = dom.getBoundingClientRect();
      return {
        x: (vector.x * 0.5 + 0.5) * rect.width,
        y: (-vector.y * 0.5 + 0.5) * rect.height
      };
    }

    function down(clientX, clientY) {
      if (moving || sunk) return;
      dragging = true;
      dragStart = ballScreenPos();
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
      const dragDist = Math.min(Math.hypot(dx, dy), 140);
      if (dragDist < 8) { removeAimLine(); return; }
      // Bildschirm-Delta in Weltrichtung umrechnen (Kamera ist von "vorne oben" auf -z ausgerichtet)
      const worldDx = dx / 140 * MAX_DRAG;
      const worldDz = -dy / 140 * MAX_DRAG; // Bildschirm "hoch" ~ Welt "-z" (weiter weg)
      const power = Math.min(dragDist / 140, 1) * POWER_SCALE;
      const dirLen = Math.hypot(worldDx, worldDz) || 1;
      ball.vx = (worldDx / dirLen) * power * 3.2;
      ball.vz = (worldDz / dirLen) * power * 3.2;
      moving = true;
      strokes++;
      totalStrokes++;
      updateLabels();
      setStatus("Schlag! Ball rollt...");
      removeAimLine();
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
    const dx = dragStart.x - dragCurrent.x;
    const dy = dragStart.y - dragCurrent.y;
    const dragDist = Math.min(Math.hypot(dx, dy), 140);
    if (dragDist < 6) return;
    const worldDx = dx / 140 * MAX_DRAG;
    const worldDz = -dy / 140 * MAX_DRAG;
    const dirLen = Math.hypot(worldDx, worldDz) || 1;
    const points = [
      new THREE.Vector3(ball.x, 0.05, ball.z),
      new THREE.Vector3(ball.x + (worldDx / dirLen) * (dragDist / 140) * 3.5, 0.05, ball.z + (worldDz / dirLen) * (dragDist / 140) * 3.5)
    ];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({ color: 0xffb454 });
    aimLine = new THREE.Line(geo, mat);
    scene.add(aimLine);
  }
  function removeAimLine() {
    if (aimLine) { scene.remove(aimLine); aimLine = null; }
  }

  let lastTime = 0;
  let running = false;
  let animationId = null;
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
    currentCourseIdx = 0;
    strokes = 0;
    totalStrokes = 0;
    setupCourseGeometry();
    resetBall();
    updateLabels();
    setStatus(`${course().name} — viel Erfolg!`);
  }

  function initMinigolf() {
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
  function stopMinigolf() {
    running = false;
    cancelAnimationFrame(animationId);
  }

  restartBtn?.addEventListener("click", newGame);

  window.initMinigolf = initMinigolf;
  window.stopMinigolf = stopMinigolf;
})();

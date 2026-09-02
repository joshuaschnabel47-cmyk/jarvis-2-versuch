/* ============================================================
   HOLO CHESS — board3d.js
   Echte 3D-Darstellung mit Three.js: prozedural gebaute
   Schachfiguren-Geometrie, holografisches Material (Glow +
   Wireframe-Overlay), Kamera mit OrbitControls, Klick-Picking
   über eine mathematische Ebene (robust unabhängig von Figurhöhe).
   Exponiert ein globales Objekt `Board3D`.
   ============================================================ */

const Board3D = (() => {

  const SQUARE = 1.0;
  const BOARD_HALF = 4 * SQUARE; // Brett von -4 .. +4
  const CYAN = 0x00e5ff;
  const MAGENTA = 0xcf42ff;
  const GOLD = 0xffb454;
  const DANGER = 0xff3b5c;

  let renderer, scene, camera, controls, container;
  let boardMesh, pieceGroup, highlightGroup, ringGroup;
  let clickCallback = null;
  let active = false;
  let rafId = null;
  let resizeObserver = null;
  let moveTween = null;
  let cameraTween = null;
  let particleSystems = [];
  let lastAnimatedSeq = -1;

  const CAMERA_PRESETS = {
    white: { pos: [0, 7.2, 6.4], target: [0, 0, 0] },
    black: { pos: [0, 7.2, -6.4], target: [0, 0, 0] },
    top:   { pos: [0.001, 11, 0.001], target: [0, 0, 0] }
  };

  const pickPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let pointerDownPos = null;
  let pointerMoved = false;

  /* ---------- Hilfsfunktionen: Position & Material ---------- */

  function squareCenter(row, col) {
    // row 0 = Rang 8 (hinten/schwarz), col 0 = a-Linie
    return { x: col - 3.5, z: row - 3.5 };
  }

  function holoMaterial(hex, opacity = 0.62) {
    return new THREE.MeshPhongMaterial({
      color: hex, emissive: hex, emissiveIntensity: 0.55,
      transparent: true, opacity, shininess: 90,
      side: THREE.DoubleSide
    });
  }
  function wireMaterial(hex) {
    return new THREE.LineBasicMaterial({ color: hex, transparent: true, opacity: 0.85 });
  }
  function glowMaterial(hex) {
    return new THREE.MeshBasicMaterial({
      color: hex, transparent: true, opacity: 0.16,
      side: THREE.BackSide, depthWrite: false
    });
  }

  // Fügt eine Solid-Mesh + Wireframe-Kontur + weiche Glow-Hülle zu einer Gruppe hinzu
  function addPart(group, geometry, hex, glowScale = 1.18) {
    const mesh = new THREE.Mesh(geometry, holoMaterial(hex));
    const wire = new THREE.LineSegments(new THREE.WireframeGeometry(geometry), wireMaterial(hex));
    mesh.add(wire);
    const glow = new THREE.Mesh(geometry, glowMaterial(hex));
    glow.scale.multiplyScalar(glowScale);
    mesh.add(glow);
    group.add(mesh);
    return mesh;
  }

  /* ---------- Figuren-Geometrie (prozedural, Staunton-artige Silhouetten) ---------- */

  function base(group, hex, r = 0.34, h = 0.12) {
    const geo = new THREE.CylinderGeometry(r, r * 1.12, h, 20);
    const m = addPart(group, geo, hex);
    m.position.y = h / 2;
    return h;
  }

  function buildPawn(hex) {
    const g = new THREE.Group();
    let y = base(g, hex, 0.30, 0.11);
    const stemH = 0.32;
    const stem = addPart(g, new THREE.CylinderGeometry(0.10, 0.15, stemH, 16), hex);
    stem.position.y = y + stemH / 2; y += stemH;
    const head = addPart(g, new THREE.SphereGeometry(0.155, 18, 14), hex);
    head.position.y = y + 0.14; y += 0.28;
    return g;
  }

  function buildRook(hex) {
    const g = new THREE.Group();
    let y = base(g, hex, 0.36, 0.12);
    const bodyH = 0.5;
    const body = addPart(g, new THREE.CylinderGeometry(0.26, 0.30, bodyH, 20), hex);
    body.position.y = y + bodyH / 2; y += bodyH;
    const rimH = 0.10;
    const rim = addPart(g, new THREE.CylinderGeometry(0.30, 0.28, rimH, 20), hex);
    rim.position.y = y + rimH / 2; y += rimH;
    const teeth = 6;
    for (let i = 0; i < teeth; i++) {
      const a = (i / teeth) * Math.PI * 2;
      const tooth = addPart(g, new THREE.BoxGeometry(0.09, 0.13, 0.09), hex, 1.15);
      tooth.position.set(Math.cos(a) * 0.23, y + 0.065, Math.sin(a) * 0.23);
      g.add(tooth);
    }
    y += 0.13;
    return g;
  }

  function buildBishop(hex) {
    const g = new THREE.Group();
    let y = base(g, hex, 0.33, 0.12);
    const bodyH = 0.5;
    const body = addPart(g, new THREE.CylinderGeometry(0.09, 0.25, bodyH, 20), hex);
    body.position.y = y + bodyH / 2; y += bodyH;
    const collar = addPart(g, new THREE.TorusGeometry(0.13, 0.035, 8, 20), hex);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = y; y += 0.04;
    const head = addPart(g, new THREE.SphereGeometry(0.145, 18, 14), hex);
    head.position.y = y + 0.13; y += 0.24;
    const spike = addPart(g, new THREE.CylinderGeometry(0.018, 0.03, 0.14, 8), hex, 1.3);
    spike.position.y = y + 0.06; y += 0.13;
    return g;
  }

  function buildKnight(hex) {
    // Stilisierte, abstrakte Silhouette (geneigter Hals + Kopf) statt realistischem Pferdekopf
    const g = new THREE.Group();
    let y = base(g, hex, 0.34, 0.12);
    const neckH = 0.42;
    const neck = addPart(g, new THREE.CylinderGeometry(0.10, 0.22, neckH, 16), hex);
    neck.position.set(0, y + neckH / 2 - 0.03, -0.03);
    neck.rotation.x = -0.38;
    const head = addPart(g, new THREE.BoxGeometry(0.20, 0.34, 0.15), hex, 1.15);
    head.position.set(0, y + 0.52, 0.14);
    head.rotation.x = 0.55;
    const snout = addPart(g, new THREE.BoxGeometry(0.14, 0.13, 0.22), hex, 1.15);
    snout.position.set(0, y + 0.42, 0.30);
    snout.rotation.x = 0.55;
    const ear = addPart(g, new THREE.ConeGeometry(0.045, 0.14, 8), hex, 1.2);
    ear.position.set(0, y + 0.72, 0.05);
    ear.rotation.x = -0.2;
    return g;
  }

  function buildQueen(hex) {
    const g = new THREE.Group();
    let y = base(g, hex, 0.37, 0.12);
    const bodyH = 0.62;
    const body = addPart(g, new THREE.CylinderGeometry(0.16, 0.30, bodyH, 20), hex);
    body.position.y = y + bodyH / 2; y += bodyH;
    const ring = addPart(g, new THREE.TorusGeometry(0.17, 0.035, 8, 22), hex);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    const spikes = 7;
    for (let i = 0; i < spikes; i++) {
      const a = (i / spikes) * Math.PI * 2;
      const spike = addPart(g, new THREE.ConeGeometry(0.032, 0.13, 8), hex, 1.2);
      spike.position.set(Math.cos(a) * 0.17, y + 0.065, Math.sin(a) * 0.17);
      g.add(spike);
    }
    y += 0.08;
    const top = addPart(g, new THREE.SphereGeometry(0.09, 16, 12), hex);
    top.position.y = y + 0.09; y += 0.18;
    return g;
  }

  function buildKing(hex) {
    const g = new THREE.Group();
    let y = base(g, hex, 0.37, 0.12);
    const bodyH = 0.72;
    const body = addPart(g, new THREE.CylinderGeometry(0.17, 0.30, bodyH, 20), hex);
    body.position.y = y + bodyH / 2; y += bodyH;
    const collar = addPart(g, new THREE.TorusGeometry(0.18, 0.038, 8, 22), hex);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = y; y += 0.06;
    const neck = addPart(g, new THREE.CylinderGeometry(0.09, 0.12, 0.12, 16), hex);
    neck.position.y = y + 0.06; y += 0.12;
    const crossV = addPart(g, new THREE.BoxGeometry(0.055, 0.24, 0.055), hex, 1.25);
    crossV.position.y = y + 0.12;
    const crossH = addPart(g, new THREE.BoxGeometry(0.16, 0.055, 0.055), hex, 1.25);
    crossH.position.y = y + 0.16;
    y += 0.24;
    return g;
  }

  const BUILDERS = { P: buildPawn, R: buildRook, N: buildKnight, B: buildBishop, Q: buildQueen, K: buildKing };

  function buildPieceMesh(type, color) {
    const hex = color === 'w' ? CYAN : MAGENTA;
    const group = BUILDERS[type](hex);
    group.userData.floatPhase = Math.random() * Math.PI * 2;
    return group;
  }

  /* ---------- Brett ---------- */

  function buildBoardTexture() {
    const size = 1024;
    const cnv = document.createElement('canvas');
    cnv.width = cnv.height = size;
    const ctx = cnv.getContext('2d');
    const cell = size / 8;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const light = (r + c) % 2 === 0;
        ctx.fillStyle = light ? 'rgba(0,229,255,0.16)' : 'rgba(1,10,20,0.92)';
        ctx.fillRect(c * cell, r * cell, cell, cell);
      }
    }
    // Gitterlinien
    ctx.strokeStyle = 'rgba(0,229,255,0.55)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, size); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(size, i * cell); ctx.stroke();
    }
    // Rand
    ctx.strokeStyle = 'rgba(0,229,255,0.9)';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, size - 6, size - 6);
    // Koordinaten
    ctx.fillStyle = 'rgba(0,229,255,0.8)';
    ctx.font = `${cell * 0.18}px monospace`;
    const files = ['a','b','c','d','e','f','g','h'];
    for (let c = 0; c < 8; c++) {
      ctx.fillText(files[c], c * cell + 6, size - 6);
    }
    for (let r = 0; r < 8; r++) {
      ctx.fillText(String(8 - r), size - cell * 0.22, r * cell + cell * 0.22);
    }
    const tex = new THREE.CanvasTexture(cnv);
    tex.needsUpdate = true;
    return tex;
  }

  function buildBoard() {
    const geo = new THREE.PlaneGeometry(8, 8);
    const tex = buildBoardTexture();
    const mat = new THREE.MeshPhongMaterial({
      map: tex, transparent: true, opacity: 0.92, shininess: 60,
      emissive: 0x001822, emissiveIntensity: 0.4, side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  function buildHoloRings() {
    const group = new THREE.Group();
    [ [4.7, 0.03, CYAN, 0.35], [4.1, 0.02, MAGENTA, 0.3] ].forEach(([r, tube, hex, opacity]) => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, tube, 8, 64),
        new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -0.02;
      group.add(ring);
    });
    return group;
  }

  /* ---------- Highlights (Auswahl, legale Züge, Schach, letzter Zug) ---------- */

  function makeFlatDisc(hex, radius, opacity, y = 0.015) {
    const geo = new THREE.CircleGeometry(radius, 24);
    const mat = new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = y;
    return mesh;
  }
  function makeFlatRing(hex, inner, outer, opacity, y = 0.016) {
    const geo = new THREE.RingGeometry(inner, outer, 28);
    const mat = new THREE.MeshBasicMaterial({ color: hex, transparent: true, opacity, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = y;
    return mesh;
  }

  /* ---------- Öffentliche Sync-Funktion: Szene an Spielzustand angleichen ---------- */

  function sync(gameState, opts = {}) {
    if (!pieceGroup || !highlightGroup) return;
    const { selected = null, legalTargets = [], lastMove = null, checkSquare = null, moveSeq, wasCapture = false } = opts;

    while (pieceGroup.children.length) pieceGroup.remove(pieceGroup.children[0]);
    while (highlightGroup.children.length) highlightGroup.remove(highlightGroup.children[0]);

    const isNewMove = !!lastMove && moveSeq !== undefined && moveSeq !== lastAnimatedSeq;
    let animatedMesh = null;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = gameState.board[r][c];
        if (!piece) continue;
        const mesh = buildPieceMesh(piece.type, piece.color);
        const { x, z } = squareCenter(r, c);
        mesh.position.set(x, 0, z);
        pieceGroup.add(mesh);
        if (isNewMove && r === lastMove.to.row && c === lastMove.to.col) animatedMesh = mesh;
      }
    }

    if (lastMove) {
      const from = squareCenter(lastMove.from.row, lastMove.from.col);
      const to = squareCenter(lastMove.to.row, lastMove.to.col);
      const f = makeFlatDisc(CYAN, 0.42, 0.14); f.position.set(from.x, 0.014, from.z);
      const t = makeFlatDisc(GOLD, 0.44, 0.22); t.position.set(to.x, 0.014, to.z);
      highlightGroup.add(f, t);
    }
    if (selected) {
      const { x, z } = squareCenter(selected.row, selected.col);
      const ring = makeFlatRing(CYAN, 0.36, 0.44, 0.6); ring.position.set(x, 0.018, z);
      highlightGroup.add(ring);
    }
    legalTargets.forEach(m => {
      const { x, z } = squareCenter(m.to.row, m.to.col);
      const isCapture = !!gameState.board[m.to.row][m.to.col];
      const marker = isCapture
        ? makeFlatRing(DANGER, 0.38, 0.46, 0.55)
        : makeFlatDisc(GOLD, 0.14, 0.65);
      marker.position.set(x, 0.017, z);
      highlightGroup.add(marker);
    });
    if (checkSquare) {
      const { x, z } = squareCenter(checkSquare.row, checkSquare.col);
      const glow = makeFlatDisc(DANGER, 0.5, 0.35, 0.013);
      glow.userData.pulse = true;
      highlightGroup.add(glow);
    }

    if (isNewMove) {
      lastAnimatedSeq = moveSeq;
      const from = squareCenter(lastMove.from.row, lastMove.from.col);
      const to = squareCenter(lastMove.to.row, lastMove.to.col);
      if (animatedMesh) {
        animatedMesh.position.x = from.x;
        animatedMesh.position.z = from.z;
        moveTween = { mesh: animatedMesh, from: { x: from.x, z: from.z }, to: { x: to.x, z: to.z }, start: performance.now(), duration: 300 };
      }
      if (wasCapture) spawnParticleBurst(to.x, to.z, 0xffffff);
    } else if (moveSeq !== undefined) {
      lastAnimatedSeq = moveSeq;
    }
  }

  /* ---------- Partikel-Effekt (Schlagen einer Figur) ---------- */

  function spawnParticleBurst(x, z, hex) {
    const count = 36;
    const positions = new Float32Array(count * 3);
    const base = new Float32Array(count * 3);
    const velocities = [];
    for (let i = 0; i < count; i++) {
      positions[i * 3] = base[i * 3] = x;
      positions[i * 3 + 1] = base[i * 3 + 1] = 0.18;
      positions[i * 3 + 2] = base[i * 3 + 2] = z;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.7 + Math.random() * 1.5;
      velocities.push({ x: Math.cos(angle) * speed, y: 0.7 + Math.random() * 1.1, z: Math.sin(angle) * speed });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: hex, size: 0.1, transparent: true, opacity: 1, depthWrite: false });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    particleSystems.push({ points, velocities, base, start: performance.now(), duration: 650 });
  }

  function updateParticles() {
    particleSystems = particleSystems.filter(ps => {
      const tNorm = (performance.now() - ps.start) / ps.duration;
      if (tNorm >= 1) {
        scene.remove(ps.points);
        ps.points.geometry.dispose();
        ps.points.material.dispose();
        return false;
      }
      const pos = ps.points.geometry.attributes.position.array;
      for (let i = 0; i < ps.velocities.length; i++) {
        const v = ps.velocities[i];
        pos[i * 3] = ps.base[i * 3] + v.x * tNorm;
        pos[i * 3 + 1] = ps.base[i * 3 + 1] + v.y * tNorm - 1.1 * tNorm * tNorm;
        pos[i * 3 + 2] = ps.base[i * 3 + 2] + v.z * tNorm;
      }
      ps.points.geometry.attributes.position.needsUpdate = true;
      ps.points.material.opacity = 1 - tNorm;
      return true;
    });
  }

  /* ---------- Picking (Klick -> Feld) ---------- */

  function pointerToSquare(clientX, clientY) {
    const rect = renderer.domElement.getBoundingClientRect();
    ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const pt = new THREE.Vector3();
    const hit = raycaster.ray.intersectPlane(pickPlane, pt);
    if (!hit) return null;
    const col = Math.floor(pt.x + 4);
    const row = Math.floor(pt.z + 4);
    if (row < 0 || row > 7 || col < 0 || col > 7) return null;
    return { row, col };
  }

  function onPointerDown(e) {
    pointerDownPos = { x: e.clientX, y: e.clientY };
    pointerMoved = false;
  }
  function onPointerMoveTrack(e) {
    if (!pointerDownPos) return;
    const dx = e.clientX - pointerDownPos.x, dy = e.clientY - pointerDownPos.y;
    if (Math.sqrt(dx * dx + dy * dy) > 6) pointerMoved = true;
  }
  function onPointerUp(e) {
    if (!pointerMoved && pointerDownPos) {
      const sq = pointerToSquare(e.clientX, e.clientY);
      if (sq && clickCallback) clickCallback(sq.row, sq.col);
    }
    pointerDownPos = null;
  }

  /* ---------- Lifecycle ---------- */

  function init(containerEl, onSquareClick) {
    container = containerEl;
    clickCallback = onSquareClick;

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 7.2, 6.4);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x224455, 1.1));
    const key = new THREE.DirectionalLight(0x9fe8ff, 0.6);
    key.position.set(3, 6, 4);
    scene.add(key);
    const rim = new THREE.PointLight(MAGENTA, 0.5, 20);
    rim.position.set(-4, 3, -4);
    scene.add(rim);

    boardMesh = buildBoard();
    scene.add(boardMesh);
    scene.add(buildHoloRings());

    pieceGroup = new THREE.Group();
    highlightGroup = new THREE.Group();
    scene.add(pieceGroup);
    scene.add(highlightGroup);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 4.5;
    controls.maxDistance = 13;
    controls.maxPolarAngle = Math.PI / 2.15;
    controls.minPolarAngle = Math.PI / 8;
    controls.target.set(0, 0, 0);
    controls.update();

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointermove', onPointerMoveTrack);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);
    handleResize();

    active = true;
    if (!rafId) animate();
  }

  function handleResize() {
    if (!container || !renderer || !camera) return;
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function resetCamera() {
    setCameraPreset('white');
  }

  function setCameraPreset(name) {
    const preset = CAMERA_PRESETS[name];
    if (!preset || !camera || !controls) return;
    cameraTween = {
      fromPos: camera.position.clone(),
      toPos: new THREE.Vector3(...preset.pos),
      fromTarget: controls.target.clone(),
      toTarget: new THREE.Vector3(...preset.target),
      start: performance.now(),
      duration: 650
    };
  }

  function setActive(isActive) {
    active = isActive;
    if (active && !rafId) animate();
  }

  function animate() {
    if (!active) { rafId = null; return; }
    rafId = requestAnimationFrame(animate);
    const t = performance.now() * 0.001;
    pieceGroup.children.forEach(g => {
      g.position.y = Math.sin(t * 1.4 + (g.userData.floatPhase || 0)) * 0.02 + 0.02;
      g.rotation.y = Math.sin(t * 0.3 + (g.userData.floatPhase || 0)) * 0.04;
    });
    highlightGroup.children.forEach(m => {
      if (m.userData.pulse) {
        m.material.opacity = 0.22 + Math.sin(t * 4) * 0.14;
      }
    });

    if (moveTween) {
      const tNorm = Math.min(1, (performance.now() - moveTween.start) / moveTween.duration);
      const ease = 1 - Math.pow(1 - tNorm, 3);
      moveTween.mesh.position.x = moveTween.from.x + (moveTween.to.x - moveTween.from.x) * ease;
      moveTween.mesh.position.z = moveTween.from.z + (moveTween.to.z - moveTween.from.z) * ease;
      if (tNorm >= 1) moveTween = null;
    }

    if (cameraTween) {
      const tNorm = Math.min(1, (performance.now() - cameraTween.start) / cameraTween.duration);
      const ease = 0.5 - 0.5 * Math.cos(tNorm * Math.PI);
      camera.position.lerpVectors(cameraTween.fromPos, cameraTween.toPos, ease);
      controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, ease);
      if (tNorm >= 1) cameraTween = null;
    }

    updateParticles();
    controls.update();
    renderer.render(scene, camera);
  }

  return { init, sync, resetCamera, setActive, handleResize, setCameraPreset, primeAnimationState(seq){ lastAnimatedSeq = seq; } };
})();
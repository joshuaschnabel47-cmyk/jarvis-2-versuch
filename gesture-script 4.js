// GESTEN-SCANNER — echte KI-Handerkennung per Webcam mit MediaPipe
// (Googles Open-Source Hand-Tracking-Modell). Läuft komplett lokal im
// Browser: das Kamerabild verlässt nie das Gerät, nur das Erkennungs-
// modell selbst wird einmalig aus dem Internet geladen.
//
// WICHTIG: Dies ist bewusst ein normales (nicht type="module") Skript,
// weil <script type="module"> beim Öffnen der Seite per Doppelklick
// (file://-Protokoll) von Browsern aus Sicherheitsgründen blockiert
// wird. Der MediaPipe-Import läuft stattdessen über ein dynamisches
// import(...), das auch in klassischen Skripten funktioniert.
(() => {
"use strict";

const video = document.getElementById("gestureVideo");
const canvas = document.getElementById("gestureCanvas");
const statusEl = document.getElementById("gestureStatus");
const labelEl = document.getElementById("gestureLabel");
const startBtn = document.getElementById("gestureStartBtn");
const stopBtn = document.getElementById("gestureStopBtn");

if (video && canvas && startBtn && stopBtn) {
  const ctx = canvas.getContext("2d");
  let handLandmarker = null;
  let faceDetector = null;
  let currentMode = "hand"; // "hand" | "face"
  let running = false;
  let stream = null;
  let rafId = null;
  let lastGesture = "";
  let flashUntil = 0;
  let faceScanStartedAt = null;
  let lastFaceSeenAt = 0;

  const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],
    [0, 5], [5, 6], [6, 7], [7, 8],
    [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16],
    [13, 17], [17, 18], [18, 19], [19, 20],
    [0, 17]
  ];

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  async function loadModel() {
    setStatus("Lade Erkennungsmodell...");
    const { HandLandmarker, FilesetResolver } = await import(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs"
    );
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 1
    });
  }

  async function loadFaceModel() {
    setStatus("Lade Gesichtserkennungs-Modell...");
    const { FaceDetector, FilesetResolver } = await import(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs"
    );
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );
    faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        delegate: "GPU"
      },
      runningMode: "VIDEO"
    });
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  // Grobe, aber für eine Demo zuverlässige Gesten-Heuristik auf Basis
  // der 21 Handpunkte (MediaPipe-Landmark-Layout).
  function classifyGesture(lm) {
    const wrist = lm[0];
    const isExtended = (tip, pip, mcp) => dist(lm[tip], wrist) > dist(lm[pip], wrist) && dist(lm[pip], wrist) > dist(lm[mcp], wrist) * 0.9;

    const indexExt = isExtended(8, 6, 5);
    const middleExt = isExtended(12, 10, 9);
    const ringExt = isExtended(16, 14, 13);
    const pinkyExt = isExtended(20, 18, 17);
    const thumbExt = dist(lm[4], lm[17]) > dist(lm[2], lm[17]);

    const extCount = [indexExt, middleExt, ringExt, pinkyExt].filter(Boolean).length;

    if (extCount === 4 && thumbExt) return { name: "Offene Hand", emoji: "🖐️", key: "open" };
    if (extCount === 0 && !thumbExt) return { name: "Faust", emoji: "✊", key: "fist" };
    if (indexExt && middleExt && !ringExt && !pinkyExt) return { name: "Peace-Zeichen", emoji: "✌️", key: "peace" };
    if (indexExt && !middleExt && !ringExt && !pinkyExt && !thumbExt) return { name: "Zeigen", emoji: "☝️", key: "point" };
    if (thumbExt && extCount === 0) return { name: "Daumen hoch", emoji: "👍", key: "thumbsup" };
    return { name: "—", emoji: "🖐️", key: "" };
  }

  function reactToGesture(gesture) {
    if (gesture.key === lastGesture) return;
    lastGesture = gesture.key;
    if (!gesture.key) return;

    if (gesture.key === "peace") {
      flashUntil = performance.now() + 180; // kurzer "Foto-Blitz"
    }
    if (gesture.key === "open") {
      setJarvisMessage?.("👋 Gruß erkannt — hey!");
    }
    if (gesture.key === "thumbsup") {
      setJarvisMessage?.("👍 Bestätigt.");
    }
    if (gesture.key === "fist") {
      setJarvisMessage?.("✊ Power-Modus aktiviert.");
    }
  }

  /* =========================================================
     WISCH-ERKENNUNG → MODUS WECHSELN
     Trackt die Handposition über ein kurzes Zeitfenster; eine
     schnelle horizontale Bewegung wird als Wisch gewertet und
     wechselt den Modus (Schule → Hacking → Spiele → Freizeit).
     ========================================================= */
  const MODE_ORDER = ["school", "hacking", "games", "leisure"];
  const MODE_BTN_ID = { school: "schoolModeBtn", hacking: "hackModeBtn", games: "gamesModeBtn", leisure: "leisureModeBtn" };
  const MODE_BODY_CLASS = { school: "jarvis-school", hacking: "jarvis-hacking", games: "jarvis-games", leisure: "jarvis-leisure" };

  let swipeHistory = [];
  let lastSwipeAt = 0;
  const SWIPE_WINDOW_MS = 450;
  const SWIPE_THRESHOLD = 0.32; // Anteil der Framebreite
  const SWIPE_COOLDOWN_MS = 1300;

  function currentModeKey() {
    return MODE_ORDER.find(m => document.body.classList.contains(MODE_BODY_CLASS[m])) || "school";
  }

  function switchMode(direction) {
    const idx = MODE_ORDER.indexOf(currentModeKey());
    const nextIdx = (idx + direction + MODE_ORDER.length) % MODE_ORDER.length;
    const nextMode = MODE_ORDER[nextIdx];
    document.getElementById(MODE_BTN_ID[nextMode])?.click();
    if (labelEl) labelEl.textContent = `↔️ Gewischt → ${nextMode.toUpperCase()}`;
    setJarvisMessage?.(`Per Wisch-Geste zu ${nextMode.toUpperCase()} gewechselt.`);
  }

  function trackSwipe(wristLandmark) {
    const now = performance.now();
    // Spiegelbild-Koordinate, damit "rechts wischen" auch visuell rechts ist (siehe CSS scaleX(-1)).
    const mirroredX = 1 - wristLandmark.x;
    swipeHistory.push({ t: now, x: mirroredX, y: wristLandmark.y });
    swipeHistory = swipeHistory.filter(p => now - p.t <= SWIPE_WINDOW_MS);

    if (now - lastSwipeAt < SWIPE_COOLDOWN_MS || swipeHistory.length < 2) return;

    const first = swipeHistory[0];
    const last = swipeHistory[swipeHistory.length - 1];
    const delta = last.x - first.x;

    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      lastSwipeAt = now;
      swipeHistory = [];
      switchMode(delta > 0 ? 1 : -1); // rechts wischen = nächster Modus, links = vorheriger
    }
  }

  function drawHud(landmarksList) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Video-Frame zeichnen (leicht abgedunkelt für den HUD-Look)
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(3, 10, 18, 0.25)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Eck-Klammern (Scanner-Rahmen)
    const m = 24, l = 34;
    ctx.strokeStyle = "rgba(0, 229, 255, 0.85)";
    ctx.lineWidth = 3;
    [[m, m, 1, 1], [canvas.width - m, m, -1, 1], [m, canvas.height - m, 1, -1], [canvas.width - m, canvas.height - m, -1, -1]]
      .forEach(([x, y, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(x, y + l * dy);
        ctx.lineTo(x, y);
        ctx.lineTo(x + l * dx, y);
        ctx.stroke();
      });

    landmarksList.forEach(lm => {
      // Skelett-Linien
      ctx.strokeStyle = "rgba(0, 229, 255, 0.8)";
      ctx.lineWidth = 2;
      HAND_CONNECTIONS.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(lm[a].x * canvas.width, lm[a].y * canvas.height);
        ctx.lineTo(lm[b].x * canvas.width, lm[b].y * canvas.height);
        ctx.stroke();
      });
      // Gelenkpunkte
      lm.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#ffb454";
        ctx.fill();
      });

      const gesture = classifyGesture(lm);
      reactToGesture(gesture);
      if (labelEl) labelEl.textContent = `${gesture.emoji} ${gesture.name}`;

      trackSwipe(lm[0]); // Handwurzelpunkt für die Wisch-Erkennung
    });

    if (!landmarksList.length) {
      lastGesture = "";
      swipeHistory = [];
      if (labelEl) labelEl.textContent = "—";
    }

    if (performance.now() < flashUntil) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Wisch-Spur visualisieren
    if (swipeHistory.length > 1) {
      ctx.strokeStyle = "rgba(255, 180, 84, 0.7)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      swipeHistory.forEach((p, i) => {
        const px = (1 - p.x) * canvas.width; // zurück in Canvas-Koordinaten (unmirrored, da CSS spiegelt)
        const py = p.y * canvas.height;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }
  }

  function drawFaceHud(detections) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(3, 10, 18, 0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!detections.length) {
      faceScanStartedAt = null;
      if (labelEl) labelEl.textContent = "Kein Gesicht erkannt";
    } else {
      if (!faceScanStartedAt) faceScanStartedAt = performance.now();
      lastFaceSeenAt = performance.now();

      const box = detections[0].boundingBox;
      const x = box.originX, y = box.originY, w = box.width, h = box.height;
      const pad = w * 0.15;
      const bx = x - pad, by = y - pad, bw = w + pad * 2, bh = h + pad * 2;

      const elapsed = performance.now() - faceScanStartedAt;
      const scanProgress = Math.min(elapsed / 1400, 1);
      const locked = scanProgress >= 1;

      // Eck-Klammern um das Gesicht
      const l = Math.min(bw, bh) * 0.22;
      ctx.strokeStyle = locked ? "rgba(40,223,156,0.95)" : "rgba(0,229,255,0.9)";
      ctx.lineWidth = 3;
      [[bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1]]
        .forEach(([cx, cy, dx, dy]) => {
          ctx.beginPath();
          ctx.moveTo(cx, cy + l * dy);
          ctx.lineTo(cx, cy);
          ctx.lineTo(cx + l * dx, cy);
          ctx.stroke();
        });

      if (!locked) {
        // Scan-Linie, die während des "Scannens" durchs Gesicht wandert
        const scanY = by + bh * scanProgress;
        ctx.strokeStyle = "rgba(0,229,255,0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx, scanY);
        ctx.lineTo(bx + bw, scanY);
        ctx.stroke();
        if (labelEl) labelEl.textContent = "🔍 Scanne...";
      } else {
        // Fadenkreuz + Text, sobald "erkannt"
        const cx = bx + bw / 2, cy = by + bh / 2;
        ctx.strokeStyle = "rgba(40,223,156,0.9)";
        ctx.beginPath();
        ctx.moveTo(cx - 14, cy); ctx.lineTo(cx + 14, cy);
        ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy + 14);
        ctx.stroke();

        ctx.font = "bold 15px monospace";
        ctx.fillStyle = "rgba(40,223,156,0.95)";
        ctx.fillText("IDENTITY CONFIRMED", bx, by - 12);
        ctx.font = "12px monospace";
        ctx.fillStyle = "rgba(0,229,255,0.85)";
        ctx.fillText(`BIOMETRIC MATCH ${(94 + Math.sin(performance.now() / 500) * 3).toFixed(1)}%`, bx, by + bh + 20);

        if (labelEl) labelEl.textContent = "🎯 IDENTITY CONFIRMED";
      }
    }

    if (performance.now() < flashUntil) {
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function loop() {
    if (!running) return;
    if (video.readyState >= 2) {
      if (currentMode === "hand" && handLandmarker) {
        const result = handLandmarker.detectForVideo(video, performance.now());
        drawHud(result.landmarks || []);
      } else if (currentMode === "face" && faceDetector) {
        const result = faceDetector.detectForVideo(video, performance.now());
        drawFaceHud(result.detections || []);
      }
    }
    rafId = requestAnimationFrame(loop);
  }

  async function start() {
    if (running) return;
    try {
      setStatus("Kamera wird angefragt...");
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      video.srcObject = stream;
      await video.play();
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      if (currentMode === "hand" && !handLandmarker) await loadModel();
      if (currentMode === "face" && !faceDetector) await loadFaceModel();

      running = true;
      setStatus("🟢 Scanner aktiv");
      loop();
    } catch (err) {
      setStatus(
        err && err.name === "NotAllowedError"
          ? "Kamera-Zugriff wurde verweigert."
          : "Konnte Kamera oder Erkennungsmodell nicht laden (Internetverbindung prüfen)."
      );
    }
  }

  function stop() {
    running = false;
    cancelAnimationFrame(rafId);
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setStatus("Kamera aus");
    if (labelEl) labelEl.textContent = "—";
    lastGesture = "";
    faceScanStartedAt = null;
  }

  document.querySelectorAll(".gesture-mode-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const mode = btn.dataset.gestureMode;
      if (mode === currentMode) return;
      currentMode = mode;
      document.querySelectorAll(".gesture-mode-btn").forEach(b => b.classList.toggle("active", b === btn));
      faceScanStartedAt = null;
      lastGesture = "";
      if (labelEl) labelEl.textContent = "—";

      if (running) {
        // Laufenden Scanner nahtlos aufs neue Modell umschalten.
        if (mode === "hand" && !handLandmarker) { setStatus("Lade Erkennungsmodell..."); await loadModel(); }
        if (mode === "face" && !faceDetector) { setStatus("Lade Gesichtserkennungs-Modell..."); await loadFaceModel(); }
        setStatus("🟢 Scanner aktiv");
      }
    });
  });

  startBtn.addEventListener("click", start);
  stopBtn.addEventListener("click", stop);
}
})();

/* =========================================================
   BIOMETRISCHER SCAN AUF DEM STARTBILDSCHIRM
   Eigenständiger, einfacherer Ablauf: einmal scannen, dann
   automatisch den Boot-Vorgang auslösen (Alternative zur
   Code-Eingabe). Nutzt dieselbe MediaPipe-Gesichtserkennung
   wie der Gesten-Scanner, aber komplett unabhängig davon.
   ========================================================= */
(() => {
  "use strict";
  const video = document.getElementById("bioScanVideo");
  const canvas = document.getElementById("bioScanCanvas");
  const stage = document.getElementById("bioScanStage");
  const statusEl = document.getElementById("bioScanStatus");
  const startBtn = document.getElementById("bioScanStartBtn");

  if (!video || !canvas || !stage || !startBtn) return;

  const ctx = canvas.getContext("2d");
  let faceDetector = null;
  let stream = null;
  let running = false;
  let rafId = null;
  let scanStartedAt = null;
  let confirmed = false;

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  async function loadFaceModel() {
    setStatus("Lade Gesichtserkennungs-Modell...");
    const { FaceDetector, FilesetResolver } = await import(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs"
    );
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
    );
    faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
        delegate: "GPU"
      },
      runningMode: "VIDEO"
    });
  }

  function drawFrame(detections) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(3, 10, 18, 0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!detections.length) {
      scanStartedAt = null;
      setStatus("Gesicht nicht im Bild...");
      return;
    }

    if (!scanStartedAt) scanStartedAt = performance.now();
    const box = detections[0].boundingBox;
    const pad = box.width * 0.15;
    const bx = box.originX - pad, by = box.originY - pad, bw = box.width + pad * 2, bh = box.height + pad * 2;
    const elapsed = performance.now() - scanStartedAt;
    const progress = Math.min(elapsed / 1400, 1);
    const locked = progress >= 1;

    const l = Math.min(bw, bh) * 0.22;
    ctx.strokeStyle = locked ? "rgba(40,223,156,0.95)" : "rgba(0,229,255,0.9)";
    ctx.lineWidth = 3;
    [[bx, by, 1, 1], [bx + bw, by, -1, 1], [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1]]
      .forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy + l * dy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + l * dx, cy);
        ctx.stroke();
      });

    if (!locked) {
      const scanY = by + bh * progress;
      ctx.strokeStyle = "rgba(0,229,255,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx, scanY);
      ctx.lineTo(bx + bw, scanY);
      ctx.stroke();
      setStatus("🔍 Scanne Identität...");
    } else {
      ctx.font = "bold 15px monospace";
      ctx.fillStyle = "rgba(40,223,156,0.95)";
      ctx.fillText("IDENTITY CONFIRMED", bx, by - 12);
      setStatus("✅ ZUGANG BESTÄTIGT");

      if (!confirmed) {
        confirmed = true;
        setTimeout(() => {
          stopScan();
          window.jarvisStartBoot?.();
        }, 500);
      }
    }
  }

  function loop() {
    if (!running) return;
    if (video.readyState >= 2 && faceDetector) {
      const result = faceDetector.detectForVideo(video, performance.now());
      drawFrame(result.detections || []);
    }
    rafId = requestAnimationFrame(loop);
  }

  async function startScan() {
    if (running) return;
    confirmed = false;
    scanStartedAt = null;
    try {
      setStatus("Kamera wird angefragt...");
      stage.classList.remove("hidden");
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      video.srcObject = stream;
      await video.play();
      canvas.width = video.videoWidth || 480;
      canvas.height = video.videoHeight || 360;

      if (!faceDetector) await loadFaceModel();

      running = true;
      loop();
    } catch (err) {
      setStatus(
        err && err.name === "NotAllowedError"
          ? "Kamera-Zugriff verweigert — nutze stattdessen den Code."
          : "Scan nicht verfügbar (Internetverbindung prüfen) — nutze stattdessen den Code."
      );
      stage.classList.add("hidden");
    }
  }

  function stopScan() {
    running = false;
    cancelAnimationFrame(rafId);
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
  }

  startBtn.addEventListener("click", startScan);
})();

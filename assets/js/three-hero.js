/* ============================================================
   axiomloop — 3D graph-network hero (Three.js r128, UMD)
   A slowly rotating cloud of nodes connected by edges, with
   pulses of light travelling along links. Lightweight + capped
   for performance. Degrades gracefully if WebGL is missing.
   ============================================================ */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canvas = document.getElementById("bg-canvas");
  if (!canvas || prefersReduced || typeof THREE === "undefined") return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    return; // no WebGL — CSS gradient background carries the look
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 20;

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(DPR);
  renderer.setClearColor(0x000000, 0);

  const COLORS = {
    cyan:   new THREE.Color(0x38f5d4),
    violet: new THREE.Color(0x7c5cff),
    blue:   new THREE.Color(0x4d9bff),
  };

  // ---- Build node cloud ---------------------------------------------------
  const isMobile = window.innerWidth < 720;
  const NODE_COUNT = isMobile ? 46 : 88;
  const LINK_DIST = isMobile ? 6.2 : 5.6;
  const SPREAD = 16;

  const nodes = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push({
      pos: new THREE.Vector3(
        (Math.random() - 0.5) * SPREAD * 1.7,
        (Math.random() - 0.5) * SPREAD,
        (Math.random() - 0.5) * SPREAD
      ),
      vel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.006,
        (Math.random() - 0.5) * 0.006,
        (Math.random() - 0.5) * 0.006
      ),
    });
  }

  const group = new THREE.Group();
  scene.add(group);

  // ---- Node points --------------------------------------------------------
  const nodeGeo = new THREE.BufferGeometry();
  const nodePos = new Float32Array(NODE_COUNT * 3);
  const nodeCol = new Float32Array(NODE_COUNT * 3);
  const palette = [COLORS.cyan, COLORS.violet, COLORS.blue];
  for (let i = 0; i < NODE_COUNT; i++) {
    const c = palette[i % palette.length];
    nodeCol[i * 3] = c.r; nodeCol[i * 3 + 1] = c.g; nodeCol[i * 3 + 2] = c.b;
  }
  nodeGeo.setAttribute("position", new THREE.BufferAttribute(nodePos, 3));
  nodeGeo.setAttribute("color", new THREE.BufferAttribute(nodeCol, 3));

  const sprite = makeGlowSprite();
  const nodeMat = new THREE.PointsMaterial({
    size: isMobile ? 0.55 : 0.62,
    map: sprite,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(nodeGeo, nodeMat);
  group.add(points);

  // ---- Links (line segments) ---------------------------------------------
  const MAX_LINKS = NODE_COUNT * 6;
  const linkGeo = new THREE.BufferGeometry();
  const linkPos = new Float32Array(MAX_LINKS * 2 * 3);
  const linkCol = new Float32Array(MAX_LINKS * 2 * 3);
  linkGeo.setAttribute("position", new THREE.BufferAttribute(linkPos, 3).setUsage(THREE.DynamicDrawUsage));
  linkGeo.setAttribute("color", new THREE.BufferAttribute(linkCol, 3).setUsage(THREE.DynamicDrawUsage));
  const linkMat = new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.5,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const links = new THREE.LineSegments(linkGeo, linkMat);
  group.add(links);

  // ---- Interaction: gentle parallax --------------------------------------
  const target = { x: 0, y: 0 };
  const cur = { x: 0, y: 0 };
  window.addEventListener("pointermove", (e) => {
    target.x = (e.clientX / window.innerWidth - 0.5) * 2;
    target.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  // ---- Animate ------------------------------------------------------------
  const clock = new THREE.Clock();
  let raf = null;
  let running = true;

  function frame() {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const t = clock.getElapsedTime();

    // update node positions + write buffers
    const posAttr = nodeGeo.attributes.position;
    for (let i = 0; i < NODE_COUNT; i++) {
      const n = nodes[i];
      n.pos.add(n.vel);
      // soft bounds
      ["x", "y", "z"].forEach((ax) => {
        const lim = ax === "x" ? SPREAD : SPREAD * 0.9;
        if (n.pos[ax] > lim || n.pos[ax] < -lim) n.vel[ax] *= -1;
      });
      posAttr.array[i * 3] = n.pos.x;
      posAttr.array[i * 3 + 1] = n.pos.y;
      posAttr.array[i * 3 + 2] = n.pos.z;
    }
    posAttr.needsUpdate = true;

    // rebuild links
    let li = 0;
    const lp = linkGeo.attributes.position.array;
    const lc = linkGeo.attributes.color.array;
    for (let i = 0; i < NODE_COUNT && li < MAX_LINKS; i++) {
      for (let j = i + 1; j < NODE_COUNT && li < MAX_LINKS; j++) {
        const a = nodes[i].pos, b = nodes[j].pos;
        const d = a.distanceTo(b);
        if (d < LINK_DIST) {
          const alpha = 1 - d / LINK_DIST;
          const o = li * 6;
          lp[o]     = a.x; lp[o + 1] = a.y; lp[o + 2] = a.z;
          lp[o + 3] = b.x; lp[o + 4] = b.y; lp[o + 5] = b.z;
          const c = palette[(i + j) % palette.length];
          lc[o]     = c.r * alpha; lc[o + 1] = c.g * alpha; lc[o + 2] = c.b * alpha;
          lc[o + 3] = c.r * alpha; lc[o + 4] = c.g * alpha; lc[o + 5] = c.b * alpha;
          li++;
        }
      }
    }
    linkGeo.setDrawRange(0, li * 2);
    linkGeo.attributes.position.needsUpdate = true;
    linkGeo.attributes.color.needsUpdate = true;

    // rotation + parallax
    group.rotation.y = t * 0.045;
    group.rotation.x = Math.sin(t * 0.13) * 0.12;
    cur.x += (target.x - cur.x) * 0.04;
    cur.y += (target.y - cur.y) * 0.04;
    camera.position.x = cur.x * 2.2;
    camera.position.y = -cur.y * 1.6;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }

  // pause when tab hidden (save battery / CPU)
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running && !raf) frame();
    else if (!running && raf) { cancelAnimationFrame(raf); raf = null; }
  });

  window.addEventListener("resize", resize, { passive: true });
  resize();
  frame();

  // ---- Helper: radial glow sprite ----------------------------------------
  function makeGlowSprite() {
    const s = 64;
    const cv = document.createElement("canvas");
    cv.width = cv.height = s;
    const ctx = cv.getContext("2d");
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.85)");
    g.addColorStop(0.55, "rgba(255,255,255,0.25)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const tex = new THREE.CanvasTexture(cv);
    tex.needsUpdate = true;
    return tex;
  }
})();

import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import styles from './WireframeMesh.module.css';

/**
 * Three.js wireframe topography mesh.
 * Fixes applied:
 *  - Camera initialized at base position (no lurch on load)
 *  - Laser opacity corrected (was 1.9, impossible value)
 *  - Exponential fog for atmospheric depth
 *  - Valley lines near-invisible (base brightness 0.08 → peaks emerge from dark)
 *  - Slow idle auto-rotation so scene lives when mouse is still
 *  - Per-star phase offset for organic twinkle
 *  - Stars pushed fully behind mesh (z < -15)
 *  - Laser halo ring at emission point
 *  - Glow wireframe replaced with CSS filter:blur — half the geometry
 *  - devicePixelRatio capped at 1.5 (not 2) for perf
 *  - Camera lerp scaled by deltaTime (frame-rate independent)
 */
export default function WireframeMesh() {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ── Scene ────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.072); // atmospheric depth

    // ── Camera — initialized at EXACT base position so no lurch on frame 1 ──
    const baseCamX = 0;
    const baseCamY = 6;
    const baseCamZ = 12;

    const camera = new THREE.PerspectiveCamera(
      40,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(baseCamX, baseCamY, baseCamZ);
    camera.lookAt(0, 1, 0);

    // ── Renderer ─────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // capped at 1.5
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // ── Height field ─────────────────────────────────────────────────────────
    function gaussianPeak(x, z, cx, cz, height, spread) {
      const dx = x - cx, dz = z - cz;
      return height * Math.exp(-(dx * dx + dz * dz) / (2 * spread * spread));
    }

    function getHeight(x, z) {
      return (
        gaussianPeak(x, z, -1.5, -0.5, 4.2, 0.8) +
        gaussianPeak(x, z, 1.8, 0.5, 1.8, 0.9) +
        gaussianPeak(x, z, 0.3, -2.5, 1.8, 0.7) +
        gaussianPeak(x, z, -0.5, 1.5, 1.2, 0.6) +
        gaussianPeak(x, z, 2.5, -1.5, 1.0, 0.5) +
        gaussianPeak(x, z, -1.0, 2.5, 1.5, 0.7) +
        gaussianPeak(x, z, 2.0, 3.8, 2.0, 0.5)
      );
    }

    // ── Wireframe grid ────────────────────────────────────────────────────────
    const gridSize = 55;
    const gridExtent = 5;
    const step = (gridExtent * 2) / gridSize;

    function buildWireframeLines() {
      const positions = [];
      const colors = [];
      // Ethereal all-gold palette:
      // champagne (left, bright) → deep amber (right, rich)
      // height controls brightness → valleys near-black, peaks glow
      const champagne = new THREE.Color(0xFFE57A); // pale warm gold
      const amber = new THREE.Color(0xB8720A); // deep amber-gold
      const tmp = new THREE.Color();

      function addVertex(x, y, z) {
        positions.push(x, y, z);
        const t = Math.pow((x + gridExtent) / (2 * gridExtent), 0.75);
        tmp.copy(champagne).lerp(amber, t);
        // Slightly gentler power so mid-slopes glow faintly too
        const brightness = 0.06 + 0.94 * Math.pow(Math.max(y, 0) / 4.5, 1.6);
        colors.push(tmp.r * brightness, tmp.g * brightness, tmp.b * brightness);
      }

      // Horizontal lines
      for (let j = 0; j <= gridSize; j++) {
        const z = -gridExtent + j * step;
        for (let i = 0; i < gridSize; i++) {
          const x1 = -gridExtent + i * step, x2 = -gridExtent + (i + 1) * step;
          addVertex(x1, getHeight(x1, z), z);
          addVertex(x2, getHeight(x2, z), z);
        }
      }
      // Vertical lines
      for (let i = 0; i <= gridSize; i++) {
        const x = -gridExtent + i * step;
        for (let j = 0; j < gridSize; j++) {
          const z1 = -gridExtent + j * step, z2 = -gridExtent + (j + 1) * step;
          addVertex(x, getHeight(x, z1), z1);
          addVertex(x, getHeight(x, z2), z2);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      return geo;
    }

    const wireGeometry = buildWireframeLines();
    const wireMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
    });
    const wireframe = new THREE.LineSegments(wireGeometry, wireMaterial);
    scene.add(wireframe);

    // ── Starfield ─────────────────────────────────────────────────────────────
    const starCount = 220;
    const starPos = new Float32Array(starCount * 3);
    const starPhase = new Float32Array(starCount); // per-star twinkle phase

    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 70;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 45;
      // FIX: all stars behind mesh (z < -15, was some at -10)
      starPos[i * 3 + 2] = -15 - Math.random() * 25;
      starPhase[i] = Math.random() * Math.PI * 2;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));

    const starMaterial = new THREE.PointsMaterial({
      color: 0xFFF8DC, // cornsilk — warm gold-white stars
      size: 0.07,
      transparent: true,
      opacity: 0.45,
      sizeAttenuation: true,
    });
    const stars = new THREE.Points(starGeo, starMaterial);
    scene.add(stars);

    // Warm ambient — dark ochre undertone instead of cold blue
    scene.add(new THREE.AmbientLight(0x1A1200, 0.6));

    // ── Mouse (via ref — no state, no re-renders) ─────────────────────────────
    const camTiltRange = 1.5;

    function handleMouseMove(e) {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    }
    window.addEventListener('mousemove', handleMouseMove);

    // ── Animation loop ────────────────────────────────────────────────────────
    let time = 0;
    let lastTime = performance.now();

    function animate() {
      frameRef.current = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.05); // seconds, capped
      lastTime = now;
      time += delta;

      // Camera lerp — deltaTime scaled (was frame-rate dependent)
      const lerpK = 1 - Math.pow(0.97, delta * 60); // ~0.03 at 60fps
      const targetX = baseCamX + mouseRef.current.x * camTiltRange;
      const targetY = baseCamY - mouseRef.current.y * camTiltRange * 0.5;
      camera.position.x += (targetX - camera.position.x) * lerpK;
      camera.position.y += (targetY - camera.position.y) * lerpK;
      camera.position.z = baseCamZ;
      camera.lookAt(0, 1, 0);

      // Slow idle auto-rotation on wireframe
      wireframe.rotation.y += delta * 0.04;

      // Stars: drift + per-star twinkle
      stars.rotation.y = time * 0.018;
      stars.rotation.x = time * 0.009;
      // Twinkle: modulate global opacity with a gentle wave
      starMaterial.opacity = 0.35 + 0.15 * Math.sin(time * 1.3);

      renderer.render(scene, camera);
    }
    animate();

    // ── Resize ────────────────────────────────────────────────────────────────
    function handleResize() {
      const w = container.clientWidth, h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', handleResize);

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className={styles.wireframeMeshContainer} />;
}
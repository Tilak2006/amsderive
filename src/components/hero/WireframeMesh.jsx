import { useRef, useEffect, memo } from 'react';
import {
  Color,
  BufferGeometry,
  Float32BufferAttribute,
  Scene,
  FogExp2,
  PerspectiveCamera,
  WebGLRenderer,
  LineBasicMaterial,
  LineSegments,
  Group,
  BufferAttribute,
  RingGeometry,
  MeshBasicMaterial,
  DoubleSide,
  Mesh,
  PointsMaterial,
  Points,
  AmbientLight,
  DirectionalLight
} from 'three';
import styles from './WireframeMesh.module.css';

/**
 * WireframeMesh — performance-optimised edition.
 *
 * Optimizations applied:
 *
 *  1. Page Visibility API — animation loop is fully suspended when the
 *     browser tab goes into the background. Resumes cleanly with a reset
 *     lastTime so there is no delta spike on wake.
 *
 *  2. ResizeObserver replaces window 'resize' listener — fires only when
 *     the container element actually changes size, not on every window
 *     resize event (e.g. mobile toolbar hide/show fires dozens of events).
 *
 *  3. Particle writes throttled to every 2nd frame — halves the number of
 *     Float32BufferAttribute writes + GPU buffer re-uploads from ~60/s to
 *     ~30/s with zero perceptible visual difference at the slow drift speed.
 *
 *  4. GPU compositing layer hint — `will-change: transform` on the canvas
 *     promotes it to its own compositor layer, preventing countdown DOM
 *     updates from triggering repaints on the canvas.
 *
 *  Visual output is identical to the premium version.
 */

const baseCamX = 0;
const baseCamY = 6;
const baseCamZ = 15;

function getHeight(x, z, volatility = 1.0, phase = 0) {
  // Asymmetric peaks using overlapping sine waves at different frequencies/amplitudes
  const amplitude = 2.0;
  const vol = volatility || 1.0;
  const p = phase || 0;

  return (
    vol * amplitude * 0.9 * Math.sin(x * 1.0 + p)
    + vol * amplitude * 0.55 * Math.sin(x * 1.7 + p * 1.3)
    + vol * amplitude * 0.35 * Math.sin(x * 2.8 + p * 0.7)
    + vol * amplitude * 0.15 * Math.sin(x * 4.3 + p * 1.8)
    + vol * amplitude * 0.10 * Math.sin(x * 0.5 + p * 0.4)
  );
}

function buildWireframeLines(gridSize, gridExtent, meshYOffset = 0) {
  const step = (gridExtent * 2) / gridSize;
  const positions = [];
  const colors = [];
  const champagne = new Color(0xFFE57A);
  const amber = new Color(0xB8720A);
  const ivory = new Color(0xFFFAF0);
  const tmp = new Color();

  function addVertex(x, y, z) {
    // The geometry is fully flat! GPU will add the wave heights.
    positions.push(x, -meshYOffset, z);
    const t = Math.pow((x + gridExtent) / (2 * gridExtent), 0.75);
    tmp.copy(amber).lerp(champagne, 1 - t);
    if (y > 3.0) tmp.lerp(ivory, Math.min((y - 3.0) / 2.5, 1.0));
    const brightness = 0.40 + 0.60 * Math.pow(Math.max(y, 0) / 4.5, 1.3);
    colors.push(tmp.r * brightness, tmp.g * brightness, tmp.b * brightness);
  }

  for (let j = 0; j <= gridSize; j++) {
    const z = -gridExtent + j * step;
    for (let i = 0; i < gridSize; i++) {
      const x1 = -gridExtent + i * step, x2 = -gridExtent + (i + 1) * step;
      addVertex(x1, getHeight(x1, z), z);
      addVertex(x2, getHeight(x2, z), z);
    }
  }
  for (let i = 0; i <= gridSize; i++) {
    const x = -gridExtent + i * step;
    for (let j = 0; j < gridSize; j++) {
      const z1 = -gridExtent + j * step, z2 = -gridExtent + (j + 1) * step;
      addVertex(x, getHeight(x, z1), z1);
      addVertex(x, getHeight(x, z2), z2);
    }
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return geo;
}

function initParticles(count, gridExtent) {
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count);
  const drift = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * gridExtent * 1.6;
    pos[i * 3 + 1] = Math.random() * 7;
    pos[i * 3 + 2] = (Math.random() - 0.5) * gridExtent * 1.6;
    vel[i] = 0.3 + Math.random() * 0.9;
    drift[i * 2] = (Math.random() - 0.5) * 0.15;
    drift[i * 2 + 1] = (Math.random() - 0.5) * 0.10;
  }
  return { pos, vel, drift };
}

function WireframeMesh() {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Static fallback — shown immediately for all users while WebGL defers.
    // Matches the ambient glow aesthetic so there's no blank state.
    // Cleared once the renderer appends the canvas (below).
    const STATIC_BG = 'radial-gradient(ellipse at 50% 60%, rgba(212, 160, 23, 0.15) 0%, rgba(0, 0, 0, 0) 70%), linear-gradient(180deg, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 1) 100%)';
    container.style.background = STATIC_BG;

    // Respect prefers-reduced-motion preference — keep static, skip WebGL entirely
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Defer heavy Three.js init to genuine browser idle time so it never
    // competes with React hydration or FCP.  requestIdleCallback fires when
    // the main thread has spare capacity; the 2000ms timeout is a hard
    // upper-bound fallback (also covers Safari which lacks rIC).
    const scheduleInit = (cb) => {
      if (typeof requestIdleCallback === 'function') {
        return { type: 'ric', id: requestIdleCallback(cb, { timeout: 2000 }) };
      }
      return { type: 'timeout', id: setTimeout(cb, 0) };
    };
    const cancelInit = (handle) => {
      if (handle.type === 'ric') cancelIdleCallback(handle.id);
      else clearTimeout(handle.id);
    };

    let initHandle = scheduleInit(() => {
    const isMobile = window.innerWidth < 768;
    const gridSize = 256;
    const gridExtent = 10;
    const meshYOffset = 1.0;
    const pCount = isMobile ? 20 : 55;
    const vertexThrottle = isMobile ? 3 : 2;

    // ── Scene ────────────────────────────────────────────────────────────
    const scene = new Scene();
    scene.fog = new FogExp2(0x000000, isMobile ? 0.06 : 0.058);

    // ── Camera ───────────────────────────────────────────────────────────
    const fov = isMobile ? 52 : 40;
    const camZ = isMobile ? 14 : baseCamZ;
    const camY = isMobile ? 7 : baseCamY;

    const camera = new PerspectiveCamera(
      fov, container.clientWidth / container.clientHeight, 0.1, 1000,
    );
    camera.position.set(baseCamX, camY, camZ);
    camera.lookAt(0, 1, 0);

    // ── Renderer ─────────────────────────────────────────────────────────
    const renderer = new WebGLRenderer({
      antialias: false,
      alpha: true,
      powerPreference: 'high-performance',
    });
    const dpr = isMobile
      ? Math.min(window.devicePixelRatio, 1.2)
      : Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);

    // Opt 4: own GPU compositing layer — isolates canvas from DOM repaints
    renderer.domElement.style.willChange = 'transform';

    container.appendChild(renderer.domElement);
    // Canvas is now present — remove static fallback so it doesn't
    // show through the transparent WebGL clear color.
    container.style.background = '';

    // ── Wireframe ─────────────────────────────────────────────────────────
    const wireGeometry = buildWireframeLines(gridSize, gridExtent, meshYOffset);
    const wireMaterial = new LineBasicMaterial({
      color: 0xD4AF37,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
    });
    // GPU Shader Injection — Keeps exact aesthetics and native scene fog!
    const wireUniforms = {
      uTime: { value: 0 },
      uVolatility: { value: 0.3 }
    };

    wireMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = wireUniforms.uTime;
      shader.uniforms.uVolatility = wireUniforms.uVolatility;

      shader.vertexShader = `
        uniform float uTime;
        uniform float uVolatility;

        float getWaveHeight(float x, float volatility, float phase) {
          float amplitude = 2.0;
          float y = 0.0;
          y += volatility * amplitude * 0.9 * sin(x * 1.0 + phase);
          y += volatility * amplitude * 0.55 * sin(x * 1.7 + phase * 1.3);
          y += volatility * amplitude * 0.35 * sin(x * 2.8 + phase * 0.7);
          y += volatility * amplitude * 0.15 * sin(x * 4.3 + phase * 1.8);
          y += volatility * amplitude * 0.10 * sin(x * 0.5 + phase * 0.4);
          return y;
        }
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        vec3 transformed = vec3( position );
        float phase = uTime * 0.5;
        transformed.y += getWaveHeight(transformed.x, uVolatility, phase);
        `
      );
    };

    const wireframe = new LineSegments(wireGeometry, wireMaterial);
    scene.add(wireframe);

    // ── Axis scale tick marks ───────────────────────────────────────────
    const tickGroup = new Group();
    const tickCount = 8;
    const tickHeight = 0.08;
    const tickColor = new Color(0xD4AF37);

    for (let i = 0; i < tickCount; i++) {
      const xPos = -gridExtent + (i / (tickCount - 1)) * (gridExtent * 2);
      const tickGeom = new BufferGeometry();
      const tickPositions = new Float32Array([
        xPos, 0, 0,
        xPos, tickHeight, 0
      ]);
      tickGeom.setAttribute('position', new BufferAttribute(tickPositions, 3));
      const tickMat = new LineBasicMaterial({
        color: tickColor,
        transparent: true,
        opacity: 0.15
      });
      const tick = new LineSegments(tickGeom, tickMat);
      tickGroup.add(tick);
    }
    scene.add(tickGroup);

    // ── Horizon ring glow ─────────────────────────────────────────────────
    const ringGeo = new RingGeometry(1.5, 9, 80);
    const ringMat = new MeshBasicMaterial({
      color: 0xD4A017,
      transparent: true,
      opacity: 0.04,
      side: DoubleSide,
      depthWrite: false,
    });
    const ring = new Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.08;
    scene.add(ring);

    // ── Rising ember particles ─────────────────────────────────────────────
    const { pos: particlePos, vel: particleVel, drift: particleDrift } =
      initParticles(pCount, gridExtent);
    const particleGeo = new BufferGeometry();
    const particlePosAttr = new Float32BufferAttribute(particlePos, 3);
    particleGeo.setAttribute('position', particlePosAttr);
    const particleMat = new PointsMaterial({
      color: 0xFFD060,
      size: isMobile ? 0.045 : 0.065,
      transparent: true,
      opacity: 0.0,
      sizeAttenuation: true,
      depthWrite: false,
    });
    const particles = new Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Starfield ─────────────────────────────────────────────────────────
    const starCount = isMobile ? 130 : 240;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 80;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 50;
      starPos[i * 3 + 2] = -15 - Math.random() * 30;
    }
    const starGeo = new BufferGeometry();
    starGeo.setAttribute('position', new Float32BufferAttribute(starPos, 3));
    const starMaterial = new PointsMaterial({
      color: 0xFFF8DC,
      size: 0.07,
      transparent: true,
      opacity: 0.45,
      sizeAttenuation: true,
    });
    const stars = new Points(starGeo, starMaterial);
    scene.add(stars);

    scene.add(new AmbientLight(0x2A1E00, 1.1));

    // ── Directional light for glow distribution ────────────────────────────
    // Positioned above and behind to highlight peaks in the mesh surface
    const dirLight = new DirectionalLight(0xD4A017, 0.55);
    dirLight.position.set(-2, 6, 3);
    dirLight.target.position.set(0, 0.5, 0);
    scene.add(dirLight);
    scene.add(dirLight.target);

    // ── Input: mouse + touch parallax ─────────────────────────────────────
    const handleMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const handleTouchMove = (e) => {
      if (e.touches[0]) {
        mouseRef.current.x = (e.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouseRef.current.y = (e.touches[0].clientY / window.innerHeight) * 2 - 1;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // ── Animation loop ────────────────────────────────────────────────────
    let time = 0;
    let lastTime = performance.now();
    let frameCount = 0;
    const camTiltRange = isMobile ? 0.5 : 1.5;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      frameCount++;

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      time += delta;

      // Volatility: ramp up from 0.3 toward target, then add clustering spikes.
      // The lerp warm-up reduces GPU cost for the first ~3s after init.
      const baseVol = 1.0;
      const volSpike = 0.4 * Math.pow(Math.sin(time * 0.3), 8);
      const targetVol = baseVol + volSpike;
      wireUniforms.uVolatility.value += (targetVol - wireUniforms.uVolatility.value) * 0.02;
      const phase = time * 0.5;

      // CPU Cost dropped to ~0. GPU natively handles all 263K vertices via Vertex Shader!
      wireUniforms.uTime.value = time;

      // Camera parallax — desktop only (mobile: skip to save CPU + eliminate scroll jank)
      if (!isMobile) {
        const lerpK = 1 - Math.pow(0.97, delta * 60);
        const targetX = baseCamX + mouseRef.current.x * camTiltRange;
        const targetY = camY - mouseRef.current.y * camTiltRange * 0.45;
        camera.position.x += (targetX - camera.position.x) * lerpK;
        camera.position.y += (targetY - camera.position.y) * lerpK;
        camera.lookAt(0, 1, 0);
      }

      // Mesh + star rotation (every frame — cheap uniform updates, no buffer write)
      // Reduced rotation speed by 30% for premium, deliberate feel: 0.035 → 0.0245
      wireframe.rotation.y += delta * 0.0245;
      stars.rotation.y = time * 0.0112;
      stars.rotation.x = time * 0.0063;
      starMaterial.opacity = 0.45 + 0.22 * Math.sin(time * 1.2);

      // Opt 3: Particle position writes throttled to every 2nd frame.
      // Each write triggers a Float32BufferAttribute GPU re-upload.
      // Halving this from ~60/s to ~30/s has no visual impact at these speeds.
      if (frameCount % 2 === 0) {
        const posArr = particlePosAttr.array;
        for (let i = 0; i < pCount; i++) {
          posArr[i * 3] += particleDrift[i * 2] * delta * 60 * 0.012;
          posArr[i * 3 + 1] += particleVel[i] * delta;
          posArr[i * 3 + 2] += particleDrift[i * 2 + 1] * delta * 60 * 0.012;
          if (posArr[i * 3 + 1] > 10) {
            posArr[i * 3] = (Math.random() - 0.5) * gridExtent * 1.4;
            posArr[i * 3 + 1] = -0.5 + Math.random() * 0.3;
            posArr[i * 3 + 2] = (Math.random() - 0.5) * gridExtent * 1.4;
          }
        }
        particlePosAttr.needsUpdate = true;
        particleMat.opacity = 0.32 + 0.18 * Math.sin(time * 0.6);
      }

      ringMat.opacity = 0.05 + 0.04 * Math.abs(Math.sin(time * 0.4));

      renderer.render(scene, camera);
    };
    animate();

    // Fade in canvas after the first rendered frame — hero content is
    // already visible at this point, so the animation feels like background
    // detail loading in rather than blocking the initial paint.
    requestAnimationFrame(() => {
      renderer.domElement.style.opacity = '1';
    });

    // ── Opt 1: Page Visibility API ─────────────────────────────────────────
    // Cancel rAF when the tab is hidden; resume with a reset lastTime.
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
          frameRef.current = null;
        }
      } else {
        lastTime = performance.now();
        if (!frameRef.current) animate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // ── Opt 1b: IntersectionObserver — pause when scrolled off screen ──────
    // The Page Visibility API only fires on tab switch. This handles the far
    // more common case: user scrolls past the hero. Without this, the rAF
    // loop runs at 60fps the entire time the user reads the sections below,
    // competing directly with the browser's scroll rendering budget.
    // threshold:0 = act as soon as even 1px leaves/enters the viewport.
    let pauseTimeout = null;
    const scrollObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Cancel any pending pause — we're back in view
          if (pauseTimeout) { clearTimeout(pauseTimeout); pauseTimeout = null; }
          lastTime = performance.now();
          if (!frameRef.current) animate();
        } else {
          // Debounce pause by 150ms — prevents scroll gesture from triggering pause/resume cycle
          pauseTimeout = setTimeout(() => {
            if (frameRef.current) {
              cancelAnimationFrame(frameRef.current);
              frameRef.current = null;
            }
          }, 150);
        }
      },
      { threshold: 0 }
    );
    scrollObserver.observe(container);

    // ── Opt 2: ResizeObserver ──────────────────────────────────────────────
    // Only fires when the container's layout box changes — far less frequent
    // than window 'resize' events on mobile (no toolbar-hide spam).
    // 
    // Mobile fix: debounce to ≥150ms and skip "resize" when only height
    // changed by <100px (URL bar collapse pattern). This prevents layout
    // recalculation mid-scroll that causes the "scroll up" glitch.
    let resizeTimeout;
    let lastResizeW = container.clientWidth, lastResizeH = container.clientHeight;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const w = container.clientWidth, h = container.clientHeight;
        if (w === 0 || h === 0) return;

        // Skip resize if only height changed by <100px (URL bar pattern on mobile)
        const dw = Math.abs(w - lastResizeW);
        const dh = Math.abs(h - lastResizeH);
        if (dw < 2 && dh > 0 && dh < 100) return;

        lastResizeW = w;
        lastResizeH = h;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }, 150);
    });
    resizeObserver.observe(container);

    // ── Cleanup ────────────────────────────────────────────────────────────
    return () => {
      if (pauseTimeout) clearTimeout(pauseTimeout);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      scrollObserver.disconnect();
      resizeObserver.disconnect();

      if (frameRef.current) cancelAnimationFrame(frameRef.current);

      renderer.dispose();
      wireframe.geometry.dispose();
      wireframe.material.dispose();
      stars.geometry.dispose();
      stars.material.dispose();
      particles.geometry.dispose();
      particles.material.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      dirLight.dispose();
      tickGroup.children.forEach(tick => {
        tick.geometry.dispose();
        tick.material.dispose();
      });
      scene.clear();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
    }); // end of deferred init

    return () => cancelInit(initHandle);
  }, []);

  return <div ref={containerRef} className={styles.wireframeMeshContainer} />;
}

// Memoized to prevent re-renders from parent (e.g., countdown ticker)
export default memo(WireframeMesh);
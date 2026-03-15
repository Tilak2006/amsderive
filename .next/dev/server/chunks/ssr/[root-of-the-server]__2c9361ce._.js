module.exports = [
"[project]/src/components/hero/WireframeMesh.module.css [ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "wireframeMeshContainer": "WireframeMesh-module__wJadia__wireframeMeshContainer",
});
}),
"[project]/src/components/hero/WireframeMesh.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>WireframeMesh
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__ = __turbopack_context__.i("[externals]/three [external] (three, esm_import, [project]/node_modules/three)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$WireframeMesh$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/components/hero/WireframeMesh.module.css [ssr] (css module)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
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
 */ const baseCamX = 0;
const baseCamY = 6;
const baseCamZ = 12;
function gaussianPeak(x, z, cx, cz, height, spread) {
    const dx = x - cx, dz = z - cz;
    return height * Math.exp(-(dx * dx + dz * dz) / (2 * spread * spread));
}
function getHeight(x, z) {
    return gaussianPeak(x, z, -1.5, -0.5, 4.2, 0.8) + gaussianPeak(x, z, 1.8, 0.5, 1.8, 0.9) + gaussianPeak(x, z, 0.3, -2.5, 1.8, 0.7) + gaussianPeak(x, z, -0.5, 1.5, 1.2, 0.6) + gaussianPeak(x, z, 2.5, -1.5, 1.0, 0.5) + gaussianPeak(x, z, -1.0, 2.5, 1.5, 0.7) + gaussianPeak(x, z, 2.0, 3.8, 2.0, 0.5);
}
function buildWireframeLines(gridSize, gridExtent) {
    const step = gridExtent * 2 / gridSize;
    const positions = [];
    const colors = [];
    const champagne = new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["Color"](0xFFE57A);
    const amber = new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["Color"](0xB8720A);
    const ivory = new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["Color"](0xFFFAF0);
    const tmp = new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["Color"]();
    function addVertex(x, y, z) {
        positions.push(x, y, z);
        const t = Math.pow((x + gridExtent) / (2 * gridExtent), 0.75);
        tmp.copy(amber).lerp(champagne, 1 - t);
        if (y > 3.0) tmp.lerp(ivory, Math.min((y - 3.0) / 2.5, 1.0));
        const brightness = 0.08 + 0.92 * Math.pow(Math.max(y, 0) / 4.5, 1.3);
        colors.push(tmp.r * brightness, tmp.g * brightness, tmp.b * brightness);
    }
    for(let j = 0; j <= gridSize; j++){
        const z = -gridExtent + j * step;
        for(let i = 0; i < gridSize; i++){
            const x1 = -gridExtent + i * step, x2 = -gridExtent + (i + 1) * step;
            addVertex(x1, getHeight(x1, z), z);
            addVertex(x2, getHeight(x2, z), z);
        }
    }
    for(let i = 0; i <= gridSize; i++){
        const x = -gridExtent + i * step;
        for(let j = 0; j < gridSize; j++){
            const z1 = -gridExtent + j * step, z2 = -gridExtent + (j + 1) * step;
            addVertex(x, getHeight(x, z1), z1);
            addVertex(x, getHeight(x, z2), z2);
        }
    }
    const geo = new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["BufferGeometry"]();
    geo.setAttribute('position', new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["Float32BufferAttribute"](positions, 3));
    geo.setAttribute('color', new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["Float32BufferAttribute"](colors, 3));
    return geo;
}
function initParticles(count, gridExtent) {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count);
    const drift = new Float32Array(count * 2);
    for(let i = 0; i < count; i++){
        pos[i * 3] = (Math.random() - 0.5) * gridExtent * 1.6;
        pos[i * 3 + 1] = Math.random() * 7;
        pos[i * 3 + 2] = (Math.random() - 0.5) * gridExtent * 1.6;
        vel[i] = 0.3 + Math.random() * 0.9;
        drift[i * 2] = (Math.random() - 0.5) * 0.15;
        drift[i * 2 + 1] = (Math.random() - 0.5) * 0.10;
    }
    return {
        pos,
        vel,
        drift
    };
}
function WireframeMesh() {
    const containerRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const mouseRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])({
        x: 0,
        y: 0
    });
    const frameRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const container = containerRef.current;
        if (!container) return;
        const isMobile = window.innerWidth < 768;
        const isLowEnd = isMobile && window.innerWidth < 420;
        const gridSize = isLowEnd ? 28 : isMobile ? 36 : 55;
        const gridExtent = 5;
        const pCount = isLowEnd ? 20 : isMobile ? 30 : 55;
        // ── Scene ────────────────────────────────────────────────────────────
        const scene = new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["Scene"]();
        scene.fog = new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["FogExp2"](0x000000, isMobile ? 0.07 : 0.072);
        // ── Camera ───────────────────────────────────────────────────────────
        const fov = isMobile ? 52 : 40;
        const camZ = isMobile ? 14 : baseCamZ;
        const camY = isMobile ? 7 : baseCamY;
        const camera = new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["PerspectiveCamera"](fov, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(baseCamX, camY, camZ);
        camera.lookAt(0, 1, 0);
        // ── Renderer ─────────────────────────────────────────────────────────
        const renderer = new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["WebGLRenderer"]({
            antialias: !isLowEnd,
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isLowEnd ? 1.0 : isMobile ? 1.2 : 1.5));
        renderer.setClearColor(0x000000, 0);
        // Opt 4: own GPU compositing layer — isolates canvas from DOM repaints
        renderer.domElement.style.willChange = 'transform';
        container.appendChild(renderer.domElement);
        // ── Wireframe ─────────────────────────────────────────────────────────
        const wireGeometry = buildWireframeLines(gridSize, gridExtent);
        const wireMaterial = new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["LineBasicMaterial"]({
            vertexColors: true,
            transparent: true,
            opacity: 0.82
        });
        const wireframe = new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["LineSegments"](wireGeometry, wireMaterial);
        scene.add(wireframe);
        // ── Horizon ring glow ─────────────────────────────────────────────────
        const ringGeo = new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["RingGeometry"](1.5, 9, 80);
        const ringMat = new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["MeshBasicMaterial"]({
            color: 0xD4A017,
            transparent: true,
            opacity: 0.04,
            side: __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["DoubleSide"],
            depthWrite: false
        });
        const ring = new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["Mesh"](ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = -0.08;
        scene.add(ring);
        // ── Rising ember particles ─────────────────────────────────────────────
        const { pos: particlePos, vel: particleVel, drift: particleDrift } = initParticles(pCount, gridExtent);
        const particleGeo = new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["BufferGeometry"]();
        const particlePosAttr = new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["Float32BufferAttribute"](particlePos, 3);
        particleGeo.setAttribute('position', particlePosAttr);
        const particleMat = new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["PointsMaterial"]({
            color: 0xFFD060,
            size: isMobile ? 0.045 : 0.065,
            transparent: true,
            opacity: 0.0,
            sizeAttenuation: true,
            depthWrite: false
        });
        const particles = new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["Points"](particleGeo, particleMat);
        scene.add(particles);
        // ── Starfield ─────────────────────────────────────────────────────────
        const starCount = isMobile ? 130 : 240;
        const starPos = new Float32Array(starCount * 3);
        for(let i = 0; i < starCount; i++){
            starPos[i * 3] = (Math.random() - 0.5) * 80;
            starPos[i * 3 + 1] = (Math.random() - 0.5) * 50;
            starPos[i * 3 + 2] = -15 - Math.random() * 30;
        }
        const starGeo = new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["BufferGeometry"]();
        starGeo.setAttribute('position', new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["Float32BufferAttribute"](starPos, 3));
        const starMaterial = new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["PointsMaterial"]({
            color: 0xFFF8DC,
            size: 0.07,
            transparent: true,
            opacity: 0.45,
            sizeAttenuation: true
        });
        const stars = new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["Points"](starGeo, starMaterial);
        scene.add(stars);
        scene.add(new __TURBOPACK__imported__module__$5b$externals$5d2f$three__$5b$external$5d$__$28$three$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$three$29$__["AmbientLight"](0x1A1200, 1.0));
        // ── Input: mouse + touch parallax ─────────────────────────────────────
        const handleMouseMove = (e)=>{
            mouseRef.current.x = e.clientX / window.innerWidth * 2 - 1;
            mouseRef.current.y = e.clientY / window.innerHeight * 2 - 1;
        };
        const handleTouchMove = (e)=>{
            if (e.touches[0]) {
                mouseRef.current.x = e.touches[0].clientX / window.innerWidth * 2 - 1;
                mouseRef.current.y = e.touches[0].clientY / window.innerHeight * 2 - 1;
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove, {
            passive: true
        });
        window.addEventListener('touchstart', handleTouchMove, {
            passive: true
        });
        // ── Animation loop ────────────────────────────────────────────────────
        let time = 0;
        let lastTime = performance.now();
        let frameCount = 0;
        const camTiltRange = isMobile ? 0.5 : 1.5;
        const animate = ()=>{
            frameRef.current = requestAnimationFrame(animate);
            frameCount++;
            const now = performance.now();
            const delta = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;
            time += delta;
            // Camera parallax (every frame — math only, no GPU writes)
            const lerpK = 1 - Math.pow(0.97, delta * 60);
            const targetX = baseCamX + mouseRef.current.x * camTiltRange;
            const targetY = camY - mouseRef.current.y * camTiltRange * 0.45;
            camera.position.x += (targetX - camera.position.x) * lerpK;
            camera.position.y += (targetY - camera.position.y) * lerpK;
            camera.lookAt(0, 1, 0);
            // Mesh + star rotation (every frame — cheap uniform updates, no buffer write)
            wireframe.rotation.y += delta * 0.035;
            stars.rotation.y = time * 0.016;
            stars.rotation.x = time * 0.009;
            starMaterial.opacity = 0.30 + 0.18 * Math.sin(time * 1.2);
            // Opt 3: Particle position writes throttled to every 2nd frame.
            // Each write triggers a Float32BufferAttribute GPU re-upload.
            // Halving this from ~60/s to ~30/s has no visual impact at these speeds.
            if (frameCount % 2 === 0) {
                const posArr = particlePosAttr.array;
                for(let i = 0; i < pCount; i++){
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
                particleMat.opacity = 0.18 + 0.14 * Math.sin(time * 0.6);
            }
            ringMat.opacity = 0.025 + 0.03 * Math.abs(Math.sin(time * 0.4));
            renderer.render(scene, camera);
        };
        animate();
        // ── Opt 1: Page Visibility API ─────────────────────────────────────────
        // Cancel rAF when the tab is hidden; resume with a reset lastTime.
        const handleVisibilityChange = ()=>{
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
        const scrollObserver = new IntersectionObserver(([entry])=>{
            if (entry.isIntersecting) {
                lastTime = performance.now();
                if (!frameRef.current) animate();
            } else {
                if (frameRef.current) {
                    cancelAnimationFrame(frameRef.current);
                    frameRef.current = null;
                }
            }
        }, {
            threshold: 0
        });
        scrollObserver.observe(container);
        // ── Opt 2: ResizeObserver ──────────────────────────────────────────────
        // Only fires when the container's layout box changes — far less frequent
        // than window 'resize' events on mobile (no toolbar-hide spam).
        const resizeObserver = new ResizeObserver(()=>{
            const w = container.clientWidth, h = container.clientHeight;
            if (w === 0 || h === 0) return;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        });
        resizeObserver.observe(container);
        // ── Cleanup ────────────────────────────────────────────────────────────
        return ()=>{
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchstart', handleTouchMove);
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
            scene.clear();
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
        };
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        ref: containerRef,
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$WireframeMesh$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].wireframeMeshContainer
    }, void 0, false, {
        fileName: "[project]/src/components/hero/WireframeMesh.jsx",
        lineNumber: 360,
        columnNumber: 10
    }, this);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/components/hero/WireframeMesh.jsx [ssr] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/components/hero/WireframeMesh.jsx [ssr] (ecmascript)"));
}),
"[externals]/three [external] (three, esm_import, [project]/node_modules/three)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("three-055b82e065a9f10e");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__2c9361ce._.js.map
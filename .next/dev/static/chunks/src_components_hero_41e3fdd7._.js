(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/hero/WireframeMesh.module.css [client] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "wireframeMeshContainer": "WireframeMesh-module__wJadia__wireframeMeshContainer",
});
}),
"[project]/src/components/hero/WireframeMesh.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>WireframeMesh
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.core.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/three/build/three.module.js [client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$WireframeMesh$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/components/hero/WireframeMesh.module.css [client] (css module)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
function WireframeMesh() {
    _s();
    const containerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const mouseRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])({
        x: 0,
        y: 0
    });
    const frameRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "WireframeMesh.useEffect": ()=>{
            const container = containerRef.current;
            if (!container) return;
            // ── Scene ────────────────────────────────────────────────────────────────
            const scene = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Scene"]();
            scene.fog = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["FogExp2"](0x000000, 0.072); // atmospheric depth
            // ── Camera — initialized at EXACT base position so no lurch on frame 1 ──
            const baseCamX = 0;
            const baseCamY = 6;
            const baseCamZ = 12;
            const camera = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["PerspectiveCamera"](40, container.clientWidth / container.clientHeight, 0.1, 1000);
            camera.position.set(baseCamX, baseCamY, baseCamZ);
            camera.lookAt(0, 1, 0);
            // ── Renderer ─────────────────────────────────────────────────────────────
            const renderer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WebGLRenderer"]({
                antialias: true,
                alpha: true
            });
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
                return gaussianPeak(x, z, -1.5, -0.5, 4.2, 0.8) + gaussianPeak(x, z, 1.8, 0.5, 1.8, 0.9) + gaussianPeak(x, z, 0.3, -2.5, 1.8, 0.7) + gaussianPeak(x, z, -0.5, 1.5, 1.2, 0.6) + gaussianPeak(x, z, 2.5, -1.5, 1.0, 0.5) + gaussianPeak(x, z, -1.0, 2.5, 1.5, 0.7) + gaussianPeak(x, z, 2.0, 3.8, 2.0, 0.5);
            }
            // ── Wireframe grid ────────────────────────────────────────────────────────
            const gridSize = 55;
            const gridExtent = 5;
            const step = gridExtent * 2 / gridSize;
            function buildWireframeLines() {
                const positions = [];
                const colors = [];
                // Ethereal all-gold palette:
                // champagne (left, bright) → deep amber (right, rich)
                // height controls brightness → valleys near-black, peaks glow
                const champagne = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Color"](0xFFE57A); // pale warm gold
                const amber = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Color"](0xB8720A); // deep amber-gold
                const tmp = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Color"]();
                function addVertex(x, y, z) {
                    positions.push(x, y, z);
                    const t = Math.pow((x + gridExtent) / (2 * gridExtent), 0.75);
                    tmp.copy(champagne).lerp(amber, t);
                    // Slightly gentler power so mid-slopes glow faintly too
                    const brightness = 0.06 + 0.94 * Math.pow(Math.max(y, 0) / 4.5, 1.6);
                    colors.push(tmp.r * brightness, tmp.g * brightness, tmp.b * brightness);
                }
                // Horizontal lines
                for(let j = 0; j <= gridSize; j++){
                    const z = -gridExtent + j * step;
                    for(let i = 0; i < gridSize; i++){
                        const x1 = -gridExtent + i * step, x2 = -gridExtent + (i + 1) * step;
                        addVertex(x1, getHeight(x1, z), z);
                        addVertex(x2, getHeight(x2, z), z);
                    }
                }
                // Vertical lines
                for(let i = 0; i <= gridSize; i++){
                    const x = -gridExtent + i * step;
                    for(let j = 0; j < gridSize; j++){
                        const z1 = -gridExtent + j * step, z2 = -gridExtent + (j + 1) * step;
                        addVertex(x, getHeight(x, z1), z1);
                        addVertex(x, getHeight(x, z2), z2);
                    }
                }
                const geo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["BufferGeometry"]();
                geo.setAttribute('position', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Float32BufferAttribute"](positions, 3));
                geo.setAttribute('color', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Float32BufferAttribute"](colors, 3));
                return geo;
            }
            const wireGeometry = buildWireframeLines();
            const wireMaterial = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["LineBasicMaterial"]({
                vertexColors: true,
                transparent: true,
                opacity: 0.55
            });
            const wireframe = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["LineSegments"](wireGeometry, wireMaterial);
            scene.add(wireframe);
            // ── Laser beam ────────────────────────────────────────────────────────────
            const laserPeakX = -1.5;
            const laserPeakZ = -0.5;
            const laserPeakY = getHeight(laserPeakX, laserPeakZ);
            const beamGeo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["BufferGeometry"]();
            beamGeo.setAttribute('position', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Float32BufferAttribute"]([
                laserPeakX,
                laserPeakY,
                laserPeakZ,
                laserPeakX,
                laserPeakY + 18,
                laserPeakZ
            ], 3));
            // Gold laser pillar — ethereal upward beam
            const beamMaterial = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["LineBasicMaterial"]({
                color: 0xFFD060,
                transparent: true,
                opacity: 0.7
            });
            const beam = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["LineSegments"](beamGeo, beamMaterial);
            scene.add(beam);
            // Soft gold glow corona around beam
            for(let i = 1; i <= 3; i++){
                const g = beam.clone();
                g.material = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["LineBasicMaterial"]({
                    color: 0xD4A017,
                    transparent: true,
                    opacity: 0.14 / i
                });
                g.scale.set(1 + i * 0.012, 1, 1 + i * 0.012);
                scene.add(g);
            }
            // Halo ring at emission point — gold shimmer
            const haloMaterial = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
                color: 0xFFD060,
                transparent: true,
                opacity: 0.55,
                side: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["DoubleSide"]
            });
            const halo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["RingGeometry"](0.10, 0.18, 32), haloMaterial);
            halo.position.set(laserPeakX, laserPeakY + 0.05, laserPeakZ);
            halo.rotation.x = -Math.PI / 2;
            scene.add(halo);
            const outerHaloMat = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["MeshBasicMaterial"]({
                color: 0xD4A017,
                transparent: true,
                opacity: 0.18,
                side: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["DoubleSide"]
            });
            const outerHalo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Mesh"](new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["RingGeometry"](0.22, 0.32, 32), outerHaloMat);
            outerHalo.position.copy(halo.position);
            outerHalo.rotation.x = -Math.PI / 2;
            scene.add(outerHalo);
            // Gold point light — warm illumination at peak
            const laserLight = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["PointLight"](0xFFB800, 2.5, 9);
            laserLight.position.set(laserPeakX, laserPeakY + 1, laserPeakZ);
            scene.add(laserLight);
            // ── Starfield ─────────────────────────────────────────────────────────────
            const starCount = 220;
            const starPos = new Float32Array(starCount * 3);
            const starPhase = new Float32Array(starCount); // per-star twinkle phase
            for(let i = 0; i < starCount; i++){
                starPos[i * 3] = (Math.random() - 0.5) * 70;
                starPos[i * 3 + 1] = (Math.random() - 0.5) * 45;
                // FIX: all stars behind mesh (z < -15, was some at -10)
                starPos[i * 3 + 2] = -15 - Math.random() * 25;
                starPhase[i] = Math.random() * Math.PI * 2;
            }
            const starGeo = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["BufferGeometry"]();
            starGeo.setAttribute('position', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Float32BufferAttribute"](starPos, 3));
            const starMaterial = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["PointsMaterial"]({
                color: 0xFFF8DC,
                size: 0.07,
                transparent: true,
                opacity: 0.45,
                sizeAttenuation: true
            });
            const stars = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Points"](starGeo, starMaterial);
            scene.add(stars);
            // Warm ambient — dark ochre undertone instead of cold blue
            scene.add(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["AmbientLight"](0x1A1200, 0.6));
            // ── Mouse (via ref — no state, no re-renders) ─────────────────────────────
            const camTiltRange = 1.5;
            function handleMouseMove(e) {
                mouseRef.current.x = e.clientX / window.innerWidth * 2 - 1;
                mouseRef.current.y = e.clientY / window.innerHeight * 2 - 1;
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
                // Laser pulse — corrected opacity range
                beamMaterial.opacity = 0.5 + 0.5 * Math.sin(time * 4);
                laserLight.intensity = 1.5 + 0.5 * Math.sin(time * 4);
                // Halo pulse (scale + opacity)
                const haloPulse = 0.8 + 0.2 * Math.sin(time * 3.5);
                halo.scale.setScalar(haloPulse);
                haloMaterial.opacity = 0.4 * haloPulse;
                const outerPulse = 0.9 + 0.1 * Math.sin(time * 2.8 + 1);
                outerHalo.scale.setScalar(outerPulse);
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
            return ({
                "WireframeMesh.useEffect": ()=>{
                    window.removeEventListener('mousemove', handleMouseMove);
                    window.removeEventListener('resize', handleResize);
                    if (frameRef.current) cancelAnimationFrame(frameRef.current);
                    renderer.dispose();
                    if (container.contains(renderer.domElement)) {
                        container.removeChild(renderer.domElement);
                    }
                }
            })["WireframeMesh.useEffect"];
        }
    }["WireframeMesh.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: containerRef,
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$WireframeMesh$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].wireframeMeshContainer
    }, void 0, false, {
        fileName: "[project]/src/components/hero/WireframeMesh.jsx",
        lineNumber: 295,
        columnNumber: 10
    }, this);
}
_s(WireframeMesh, "t0SOF2Pe8fQajb2J5lP7lqg90n0=");
_c = WireframeMesh;
var _c;
__turbopack_context__.k.register(_c, "WireframeMesh");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/hero/WireframeMesh.jsx [client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/components/hero/WireframeMesh.jsx [client] (ecmascript)"));
}),
]);

//# sourceMappingURL=src_components_hero_41e3fdd7._.js.map
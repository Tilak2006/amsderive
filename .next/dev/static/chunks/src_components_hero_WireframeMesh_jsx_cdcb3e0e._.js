(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
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
;
var _s = __turbopack_context__.k.signature();
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
            // --- Scene setup ---
            const scene = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Scene"]();
            const camera = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["PerspectiveCamera"](40, container.clientWidth / container.clientHeight, 0.1, 1000);
            camera.position.set(0, 7, 7);
            camera.lookAt(0, 0, 0);
            const renderer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$module$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["WebGLRenderer"]({
                antialias: true,
                alpha: true
            });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            renderer.setClearColor(0x000000, 0);
            container.appendChild(renderer.domElement);
            // --- Gaussian peak function ---
            function gaussianPeak(x, z, cx, cz, height, spread) {
                const dx = x - cx;
                const dz = z - cz;
                return height * Math.exp(-(dx * dx + dz * dz) / (2 * spread * spread));
            }
            function getHeight(x, z) {
                return gaussianPeak(x, z, -1.5, -0.5, 4.2, 0.8) + gaussianPeak(x, z, 1.8, 0.5, 1.8, 0.9) + gaussianPeak(x, z, 0.3, -2.5, 1.8, 0.7) + gaussianPeak(x, z, -0.5, 1.5, 1.2, 0.6) + gaussianPeak(x, z, 2.5, -1.5, 1.0, 0.5) + gaussianPeak(x, z, -1.0, 2.5, 1.5, 0.7) + gaussianPeak(x, z, 2.0, 3.8, 2.0, 0.5);
            }
            // --- Build wireframe grid ---
            const gridSize = 55;
            const gridExtent = 5;
            const step = gridExtent * 2 / gridSize;
            function buildWireframeLines() {
                const positions = [];
                const colors = [];
                const cyanColor = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Color"](0x00e5ff);
                const goldColor = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Color"](0xd4a844);
                const tempColor = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Color"]();
                function addVertex(x, y, z) {
                    positions.push(x, y, z);
                    const t = (x + gridExtent) / (2 * gridExtent);
                    tempColor.copy(cyanColor).lerp(goldColor, t);
                    const brightness = 0.5 + 0.5 * (y / 4.5);
                    colors.push(tempColor.r * brightness, tempColor.g * brightness, tempColor.b * brightness);
                }
                // Horizontal lines (along x)
                for(let j = 0; j <= gridSize; j++){
                    const z = -gridExtent + j * step;
                    for(let i = 0; i < gridSize; i++){
                        const x1 = -gridExtent + i * step;
                        const x2 = -gridExtent + (i + 1) * step;
                        const y1 = getHeight(x1, z);
                        const y2 = getHeight(x2, z);
                        addVertex(x1, y1, z);
                        addVertex(x2, y2, z);
                    }
                }
                // Vertical lines (along z)
                for(let i = 0; i <= gridSize; i++){
                    const x = -gridExtent + i * step;
                    for(let j = 0; j < gridSize; j++){
                        const z1 = -gridExtent + j * step;
                        const z2 = -gridExtent + (j + 1) * step;
                        const y1 = getHeight(x, z1);
                        const y2 = getHeight(x, z2);
                        addVertex(x, y1, z1);
                        addVertex(x, y2, z2);
                    }
                }
                const geometry = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["BufferGeometry"]();
                geometry.setAttribute('position', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Float32BufferAttribute"](positions, 3));
                geometry.setAttribute('color', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Float32BufferAttribute"](colors, 3));
                return geometry;
            }
            // Main wireframe
            const wireGeometry = buildWireframeLines();
            const wireMaterial = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["LineBasicMaterial"]({
                vertexColors: true,
                transparent: true,
                opacity: 0.85
            });
            const wireframe = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["LineSegments"](wireGeometry, wireMaterial);
            scene.add(wireframe);
            // Glow wireframe (slightly thicker, more transparent)
            const glowMaterial = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["LineBasicMaterial"]({
                vertexColors: true,
                transparent: true,
                opacity: 0.15,
                linewidth: 1
            });
            const glowWireframe = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["LineSegments"](wireGeometry.clone(), glowMaterial);
            glowWireframe.scale.set(1.002, 1.002, 1.002);
            scene.add(glowWireframe);
            // --- Laser beam ---
            const laserPeakX = -1.5;
            const laserPeakZ = -0.5;
            const laserPeakY = getHeight(laserPeakX, laserPeakZ);
            // Core beam (bright, thin)
            const beamPositions = [
                laserPeakX,
                laserPeakY,
                laserPeakZ,
                laserPeakX,
                laserPeakY + 18,
                laserPeakZ
            ];
            const beamGeometry = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["BufferGeometry"]();
            beamGeometry.setAttribute('position', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Float32BufferAttribute"](beamPositions, 3));
            const beamMaterial = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["LineBasicMaterial"]({
                color: 0x00e5ff,
                transparent: true,
                opacity: 1.9
            });
            const beam = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["LineSegments"](beamGeometry, beamMaterial);
            scene.add(beam);
            // Glow layers for laser
            for(let i = 1; i <= 3; i++){
                const glowBeam = beam.clone();
                glowBeam.material = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["LineBasicMaterial"]({
                    color: 0x00e5ff,
                    transparent: true,
                    opacity: 0.15 / i
                });
                glowBeam.scale.set(1 + i * 0.01, 1, 1 + i * 0.01);
                scene.add(glowBeam);
            }
            // Laser glow point light
            const laserLight = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["PointLight"](0x00e5ff, 2, 8);
            laserLight.position.set(laserPeakX, laserPeakY + 1, laserPeakZ);
            scene.add(laserLight);
            // --- Starfield ---
            const starCount = 200;
            const starPositions = new Float32Array(starCount * 3);
            const starSizes = new Float32Array(starCount);
            for(let i = 0; i < starCount; i++){
                starPositions[i * 3] = (Math.random() - 0.5) * 60;
                starPositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
                starPositions[i * 3 + 2] = -10 - Math.random() * 30;
                starSizes[i] = Math.random() * 1.5 + 0.5;
            }
            const starGeometry = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["BufferGeometry"]();
            starGeometry.setAttribute('position', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Float32BufferAttribute"](starPositions, 3));
            starGeometry.setAttribute('size', new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Float32BufferAttribute"](starSizes, 1));
            const starMaterial = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["PointsMaterial"]({
                color: 0xffffff,
                size: 0.08,
                transparent: true,
                opacity: 0.6,
                sizeAttenuation: true
            });
            const stars = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Points"](starGeometry, starMaterial);
            scene.add(stars);
            // --- Ambient light ---
            const ambientLight = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$three$2f$build$2f$three$2e$core$2e$js__$5b$client$5d$__$28$ecmascript$29$__["AmbientLight"](0x112233, 0.5);
            scene.add(ambientLight);
            // --- Mouse tracking ---
            function handleMouseMove(e) {
                mouseRef.current.x = e.clientX / window.innerWidth * 2 - 1;
                mouseRef.current.y = e.clientY / window.innerHeight * 2 - 1;
            }
            window.addEventListener('mousemove', handleMouseMove);
            // --- Camera base position ---
            const baseCamX = 0;
            const baseCamY = 6;
            const baseCamZ = 12;
            const camTiltRange = 1.5;
            // --- Animation loop ---
            let time = 0;
            function animate() {
                frameRef.current = requestAnimationFrame(animate);
                time += 0.005;
                // Mouse-reactive camera
                const targetX = baseCamX + mouseRef.current.x * camTiltRange;
                const targetY = baseCamY - mouseRef.current.y * camTiltRange * 0.5;
                camera.position.x += (targetX - camera.position.x) * 0.03;
                camera.position.y += (targetY - camera.position.y) * 0.03;
                camera.position.z = baseCamZ;
                camera.lookAt(0, 1, 0);
                // Subtle starfield drift
                stars.rotation.y = time * 0.02;
                stars.rotation.x = time * 0.01;
                // Laser pulse
                beamMaterial.opacity = 0.7 + 0.3 * Math.sin(time * 4);
                laserLight.intensity = 1.5 + 0.5 * Math.sin(time * 4);
                renderer.render(scene, camera);
            }
            animate();
            // --- Resize handler ---
            function handleResize() {
                const w = container.clientWidth;
                const h = container.clientHeight;
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h);
            }
            window.addEventListener('resize', handleResize);
            // --- Cleanup ---
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
        className: "wireframe-mesh-container"
    }, void 0, false, {
        fileName: "[project]/src/components/hero/WireframeMesh.jsx",
        lineNumber: 279,
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

//# sourceMappingURL=src_components_hero_WireframeMesh_jsx_cdcb3e0e._.js.map
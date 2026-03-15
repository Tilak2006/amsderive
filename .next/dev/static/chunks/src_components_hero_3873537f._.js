(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/hero/BackgroundOverlay.module.css [client] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "animatePath": "BackgroundOverlay-module__OvLICq__animatePath",
  "animatePathSlow": "BackgroundOverlay-module__OvLICq__animatePathSlow",
  "animatePulse": "BackgroundOverlay-module__OvLICq__animatePulse",
  "dotAppear": "BackgroundOverlay-module__OvLICq__dotAppear",
  "draw": "BackgroundOverlay-module__OvLICq__draw",
  "element": "BackgroundOverlay-module__OvLICq__element",
  "eqAll": "BackgroundOverlay-module__OvLICq__eqAll",
  "eqDesktop": "BackgroundOverlay-module__OvLICq__eqDesktop",
  "equation": "BackgroundOverlay-module__OvLICq__equation",
  "equationSpaced": "BackgroundOverlay-module__OvLICq__equationSpaced",
  "overlayContainer": "BackgroundOverlay-module__OvLICq__overlayContainer",
  "pulse": "BackgroundOverlay-module__OvLICq__pulse",
  "scanDrift": "BackgroundOverlay-module__OvLICq__scanDrift",
  "scanLine": "BackgroundOverlay-module__OvLICq__scanLine",
  "scatterDot": "BackgroundOverlay-module__OvLICq__scatterDot",
  "svg": "BackgroundOverlay-module__OvLICq__svg",
});
}),
"[project]/src/components/hero/BackgroundOverlay.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/components/hero/BackgroundOverlay.module.css [client] (css module)");
;
;
;
/**
 * BackgroundOverlay — premium edition
 *
 * Enhancements over original:
 *  - Radial golden spotlight at center (SVG radialGradient)
 *  - Stochastic data point scatter (suggests live price data)
 *  - Second price-path curve for depth layering
 *  - Outer construction circle for framing
 *  - Mobile-responsive: equations hidden on narrow viewports via CSS,
 *    reduced animation complexity
 *  - Memoized: zero re-renders during countdown updates
 */ const BackgroundOverlay = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["memo"])(_c = ()=>{
    // Pre-generated scatter: 28 faint data points suggesting a price cloud
    const scatter = [
        [
            80,
            480
        ],
        [
            145,
            510
        ],
        [
            210,
            465
        ],
        [
            275,
            530
        ],
        [
            340,
            490
        ],
        [
            400,
            555
        ],
        [
            460,
            470
        ],
        [
            520,
            540
        ],
        [
            580,
            500
        ],
        [
            640,
            560
        ],
        [
            700,
            480
        ],
        [
            755,
            525
        ],
        [
            820,
            490
        ],
        [
            880,
            545
        ],
        [
            935,
            510
        ],
        [
            970,
            480
        ],
        [
            100,
            430
        ],
        [
            190,
            595
        ],
        [
            310,
            415
        ],
        [
            430,
            620
        ],
        [
            560,
            440
        ],
        [
            670,
            610
        ],
        [
            790,
            430
        ],
        [
            900,
            600
        ],
        [
            250,
            640
        ],
        [
            480,
            390
        ],
        [
            720,
            650
        ],
        [
            850,
            375
        ]
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].overlayContainer,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].svg,
            viewBox: "0 0 1000 1000",
            preserveAspectRatio: "xMidYMid slice",
            "aria-hidden": "true",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("radialGradient", {
                            id: "centerGlow",
                            cx: "50%",
                            cy: "50%",
                            r: "35%",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    offset: "0%",
                                    stopColor: "#D4A017",
                                    stopOpacity: "0.07"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                                    lineNumber: 37,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    offset: "60%",
                                    stopColor: "#D4A017",
                                    stopOpacity: "0.02"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                                    lineNumber: 38,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    offset: "100%",
                                    stopColor: "#D4A017",
                                    stopOpacity: "0"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                                    lineNumber: 39,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                            lineNumber: 36,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("linearGradient", {
                            id: "pathFade",
                            x1: "0",
                            x2: "1",
                            y1: "0",
                            y2: "0",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    offset: "0%",
                                    stopColor: "white",
                                    stopOpacity: "0"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                                    lineNumber: 44,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    offset: "12%",
                                    stopColor: "white",
                                    stopOpacity: "1"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                                    lineNumber: 45,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    offset: "88%",
                                    stopColor: "white",
                                    stopOpacity: "1"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                                    lineNumber: 46,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                    offset: "100%",
                                    stopColor: "white",
                                    stopOpacity: "0"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                                    lineNumber: 47,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                            lineNumber: 43,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("mask", {
                            id: "edgeFade",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                                width: "1000",
                                height: "1000",
                                fill: "url(#pathFade)"
                            }, void 0, false, {
                                fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                                lineNumber: 50,
                                columnNumber: 13
                            }, ("TURBOPACK compile-time value", void 0))
                        }, void 0, false, {
                            fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                            lineNumber: 49,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 34,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    width: "1000",
                    height: "1000",
                    fill: "url(#centerGlow)"
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 55,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "500",
                    cy: "500",
                    r: "490",
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].element,
                    style: {
                        opacity: 0.04
                    }
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 58,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                    x1: "0",
                    y1: "500",
                    x2: "1000",
                    y2: "500",
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].element
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 65,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                    x1: "500",
                    y1: "0",
                    x2: "500",
                    y2: "1000",
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].element
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 66,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "500",
                    cy: "500",
                    r: "300",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].element} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].animatePulse}`
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 69,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "500",
                    cy: "500",
                    r: "150",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].element} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].animatePulse}`,
                    style: {
                        animationDelay: '2s'
                    }
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 73,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "500",
                    cy: "500",
                    r: "60",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].element} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].animatePulse}`,
                    style: {
                        animationDelay: '4s',
                        opacity: 0.08
                    }
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 78,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M 0 600 Q 100 550 200 620 T 400 580 T 600 650 T 800 600 T 1000 630",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].element} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].animatePath}`,
                    style: {
                        stroke: '#D4AF37',
                        opacity: 0.26
                    },
                    mask: "url(#edgeFade)"
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 85,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M 0 540 Q 120 580 240 510 T 480 560 T 720 520 T 1000 555",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].element} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].animatePathSlow}`,
                    style: {
                        stroke: '#D4AF37',
                        opacity: 0.11,
                        strokeWidth: 0.8
                    },
                    mask: "url(#edgeFade)"
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 93,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M 200 800 C 400 800 400 200 600 200",
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].element,
                    style: {
                        strokeWidth: 1
                    }
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 101,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                    x1: "300",
                    y1: "600",
                    x2: "500",
                    y2: "400",
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].element
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 108,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M 400 400 A 100 100 0 0 1 600 400",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].element} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].animatePulse}`,
                    style: {
                        animationDelay: '1.5s'
                    }
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 111,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("g", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].scatterGroup,
                    children: scatter.map(([x, y], i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                            cx: x,
                            cy: y,
                            r: "2.2",
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].scatterDot,
                            style: {
                                animationDelay: `${i * 0.37 % 5}s`
                            }
                        }, i, false, {
                            fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                            lineNumber: 120,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)))
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 118,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                [
                    {
                        y: 120,
                        delay: '0s'
                    },
                    {
                        y: 200,
                        delay: '2.7s'
                    },
                    {
                        y: 270,
                        delay: '5.1s'
                    },
                    {
                        y: 740,
                        delay: '1.4s'
                    },
                    {
                        y: 810,
                        delay: '3.8s'
                    }
                ].map(({ y, delay }, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("line", {
                        x1: "0",
                        y1: y,
                        x2: "1000",
                        y2: y,
                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].element} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].scanLine}`,
                        style: {
                            animationDelay: delay
                        }
                    }, i, false, {
                        fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                        lineNumber: 137,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                    x: "130",
                    y: "185",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].equation} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].equationSpaced} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].eqDesktop}`,
                    children: "∂V/∂t + ½σ²S²∂²V/∂S² + rS∂V/∂S − rV = 0"
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 146,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                    x: "580",
                    y: "820",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].equation} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].equationSpaced} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].eqDesktop}`,
                    children: "dXt = σtXt dWt + μtXt dt"
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 149,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                    x: "120",
                    y: "860",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].equation} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].equationSpaced} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].eqAll}`,
                    children: "E[Ri] = Rf + βi(E[Rm] − Rf)"
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 152,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                    x: "660",
                    y: "145",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].equation} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].equationSpaced} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].eqDesktop}`,
                    children: "lim(n→∞) (1 + 1/n)ⁿ = e"
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 155,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("text", {
                    x: "700",
                    y: "680",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].equation} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].equationSpaced} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].eqDesktop}`,
                    children: "Cov(Ri, Rj) / σiσj = ρij"
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 158,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
            lineNumber: 28,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
        lineNumber: 27,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
_c1 = BackgroundOverlay;
BackgroundOverlay.displayName = 'BackgroundOverlay';
const __TURBOPACK__default__export__ = BackgroundOverlay;
var _c, _c1;
__turbopack_context__.k.register(_c, "BackgroundOverlay$memo");
__turbopack_context__.k.register(_c1, "BackgroundOverlay");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/hero/BackgroundOverlay.jsx [client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/components/hero/BackgroundOverlay.jsx [client] (ecmascript)"));
}),
]);

//# sourceMappingURL=src_components_hero_3873537f._.js.map
(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/styles/sections.module.css [client] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "card": "sections-module__6gzkAW__card",
  "cardIcon": "sections-module__6gzkAW__cardIcon",
  "cardText": "sections-module__6gzkAW__cardText",
  "cardTitle": "sections-module__6gzkAW__cardTitle",
  "container": "sections-module__6gzkAW__container",
  "containerWide": "sections-module__6gzkAW__containerWide",
  "grid": "sections-module__6gzkAW__grid",
  "gridFour": "sections-module__6gzkAW__gridFour",
  "section": "sections-module__6gzkAW__section",
  "sectionTitle": "sections-module__6gzkAW__sectionTitle",
  "timeline": "sections-module__6gzkAW__timeline",
  "timelineDate": "sections-module__6gzkAW__timelineDate",
  "timelineDesc": "sections-module__6gzkAW__timelineDesc",
  "timelineItem": "sections-module__6gzkAW__timelineItem",
  "timelineTitle": "sections-module__6gzkAW__timelineTitle",
});
}),
"[project]/src/components/sections/WhoSection.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$sections$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/styles/sections.module.css [client] (css module)");
;
;
const WhoSection = ()=>{
    const categories = [
        {
            title: 'Competitive Programmers',
            desc: 'Top-tier coders who thrive under pressure and enjoy solving algorithmic puzzles.'
        },
        {
            title: 'Mathematics Students',
            desc: 'Analytical minds with a strong foundation in probability, statistics, and calculus.'
        },
        {
            title: 'Quant Enthusiasts',
            desc: 'Aspiring quantitative researchers and traders interested in financial markets.'
        },
        {
            title: 'Finance Engineers',
            desc: 'Engineers who want to build the next generation of financial technology and systems.'
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "who",
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$sections$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].section,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$sections$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].containerWide,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$sections$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                    children: "Who Should Participate"
                }, void 0, false, {
                    fileName: "[project]/src/components/sections/WhoSection.jsx",
                    lineNumber: 26,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$sections$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].gridFour,
                    children: categories.map((cat, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$sections$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].card,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$sections$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].cardTitle,
                                    children: cat.title
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/WhoSection.jsx",
                                    lineNumber: 30,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$sections$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].cardText,
                                    children: cat.desc
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/WhoSection.jsx",
                                    lineNumber: 31,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, index, true, {
                            fileName: "[project]/src/components/sections/WhoSection.jsx",
                            lineNumber: 29,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)))
                }, void 0, false, {
                    fileName: "[project]/src/components/sections/WhoSection.jsx",
                    lineNumber: 27,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/sections/WhoSection.jsx",
            lineNumber: 25,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/sections/WhoSection.jsx",
        lineNumber: 24,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_c = WhoSection;
const __TURBOPACK__default__export__ = WhoSection;
var _c;
__turbopack_context__.k.register(_c, "WhoSection");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/sections/WhoSection.jsx [client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/components/sections/WhoSection.jsx [client] (ecmascript)"));
}),
]);

//# sourceMappingURL=src_48e7f001._.js.map
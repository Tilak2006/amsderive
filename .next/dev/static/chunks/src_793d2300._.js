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
"[project]/src/components/sections/TimelineSection.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$sections$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/styles/sections.module.css [client] (css module)");
;
;
const TimelineSection = ()=>{
    const events = [
        {
            date: 'APRIL 20, 2026',
            title: 'Registrations Open',
            desc: 'Participant registrations begin.'
        },
        {
            date: 'MAY 23, 2026',
            title: 'Round 1: PRIOR',
            desc: 'Online qualification round focused on derivatives and math.'
        },
        {
            date: 'JUNE 21, 2026',
            title: 'Round 2: POSTERIOR',
            desc: 'Advanced round for top performers.'
        },
        {
            date: 'JULY 11, 2026',
            title: 'Finals: CONVERGENCE',
            desc: 'Onsite coding round for the top competitors.'
        }
    ];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        id: "timeline",
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$sections$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].section,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$sections$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].container,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$sections$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].sectionTitle,
                    children: "Timeline"
                }, void 0, false, {
                    fileName: "[project]/src/components/sections/TimelineSection.jsx",
                    lineNumber: 30,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$sections$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].timeline,
                    children: events.map((event, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$sections$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].timelineItem,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$sections$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].timelineDate,
                                    children: event.date
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/TimelineSection.jsx",
                                    lineNumber: 34,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$sections$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].timelineTitle,
                                    children: event.title
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/TimelineSection.jsx",
                                    lineNumber: 35,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$sections$2e$module$2e$css__$5b$client$5d$__$28$css__module$29$__["default"].timelineDesc,
                                    children: event.desc
                                }, void 0, false, {
                                    fileName: "[project]/src/components/sections/TimelineSection.jsx",
                                    lineNumber: 36,
                                    columnNumber: 15
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, index, true, {
                            fileName: "[project]/src/components/sections/TimelineSection.jsx",
                            lineNumber: 33,
                            columnNumber: 13
                        }, ("TURBOPACK compile-time value", void 0)))
                }, void 0, false, {
                    fileName: "[project]/src/components/sections/TimelineSection.jsx",
                    lineNumber: 31,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/sections/TimelineSection.jsx",
            lineNumber: 29,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/sections/TimelineSection.jsx",
        lineNumber: 28,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
_c = TimelineSection;
const __TURBOPACK__default__export__ = TimelineSection;
var _c;
__turbopack_context__.k.register(_c, "TimelineSection");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/sections/TimelineSection.jsx [client] (ecmascript, next/dynamic entry)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/src/components/sections/TimelineSection.jsx [client] (ecmascript)"));
}),
]);

//# sourceMappingURL=src_793d2300._.js.map
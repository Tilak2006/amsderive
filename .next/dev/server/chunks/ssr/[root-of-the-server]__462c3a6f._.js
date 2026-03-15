module.exports = [
"[project]/src/components/Navbar.module.css [ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "logo": "Navbar-module__cJzEcG__logo",
  "navbar": "Navbar-module__cJzEcG__navbar",
  "notifyBtn": "Navbar-module__cJzEcG__notifyBtn",
});
}),
"[project]/src/components/Navbar.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/link.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Navbar$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/components/Navbar.module.css [ssr] (css module)");
;
;
;
const REGISTRATION_OPENS = new Date('2026-04-19T18:30:00Z'); // April 20 2026, 00:00 IST
function openGoogleCalendarInvite() {
    const isRegistrationOpen = Date.now() >= REGISTRATION_OPENS.getTime();
    if (isRegistrationOpen) {
        // After April 20: remind for Round 1 "Prior" on May 23
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: 'AMS DERIVE — Round 1: Prior',
            dates: '20260522T183000Z/20260522T193000Z',
            details: 'Round 1 (Prior) of the AMS DERIVE Quantitative Trading & Mathematical Competition begins. Make sure you are prepared.'
        });
        window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
    } else {
        // Before April 20: remind for registrations opening
        const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: 'AMS DERIVE — Registrations Open',
            dates: '20260419T183000Z/20260419T193000Z',
            details: 'Registrations for the AMS DERIVE Quantitative Trading & Mathematical Competition are now open. Visit the website to register.'
        });
        window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
    }
}
const Navbar = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("nav", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Navbar$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].navbar,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Navbar$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].logoContainer,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                    href: "/",
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Navbar$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].logo,
                    children: "AMS DERIVE"
                }, void 0, false, {
                    fileName: "[project]/src/components/Navbar.jsx",
                    lineNumber: 34,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/Navbar.jsx",
                lineNumber: 33,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                type: "button",
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Navbar$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].notifyBtn,
                onClick: openGoogleCalendarInvite,
                children: "Notify Me"
            }, void 0, false, {
                fileName: "[project]/src/components/Navbar.jsx",
                lineNumber: 38,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/Navbar.jsx",
        lineNumber: 32,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = Navbar;
}),
"[project]/src/components/Countdown.module.css [ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "countdownContainer": "Countdown-module__UY-Ckq__countdownContainer",
  "label": "Countdown-module__UY-Ckq__label",
  "labels": "Countdown-module__UY-Ckq__labels",
  "number": "Countdown-module__UY-Ckq__number",
  "numbers": "Countdown-module__UY-Ckq__numbers",
  "registerBtn": "Countdown-module__UY-Ckq__registerBtn",
  "separator": "Countdown-module__UY-Ckq__separator",
});
}),
"[project]/src/components/Countdown.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/link.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Countdown$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/components/Countdown.module.css [ssr] (css module)");
;
;
;
;
const REGISTRATION_DATE = new Date('2026-04-19T18:30:00Z'); // April 20 2026, 00:00 IST
function pad(n) {
    return String(n).padStart(2, '0');
}
function getTimeRemaining() {
    const diff = REGISTRATION_DATE.getTime() - Date.now();
    if (diff <= 0) return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        expired: true
    };
    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor(diff / (1000 * 60 * 60) % 24),
        minutes: Math.floor(diff / (1000 * 60) % 60),
        seconds: Math.floor(diff / 1000 % 60),
        expired: false
    };
}
const Countdown = ({ onExpiredChange })=>{
    const [time, setTime] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(getTimeRemaining);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (time.expired && onExpiredChange) onExpiredChange(true);
        const interval = setInterval(()=>{
            const remaining = getTimeRemaining();
            setTime(remaining);
            if (remaining.expired) {
                clearInterval(interval);
                if (onExpiredChange) onExpiredChange(true);
            }
        }, 1000);
        return ()=>clearInterval(interval);
    }, []);
    if (time.expired) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Countdown$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].countdownContainer,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                href: "/register",
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Countdown$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].registerBtn,
                children: "Register Now"
            }, void 0, false, {
                fileName: "[project]/src/components/Countdown.jsx",
                lineNumber: 42,
                columnNumber: 9
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/src/components/Countdown.jsx",
            lineNumber: 41,
            columnNumber: 7
        }, ("TURBOPACK compile-time value", void 0));
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Countdown$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].countdownContainer,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Countdown$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].numbers,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Countdown$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].number,
                        children: pad(time.days)
                    }, void 0, false, {
                        fileName: "[project]/src/components/Countdown.jsx",
                        lineNumber: 52,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Countdown$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].separator,
                        children: ":"
                    }, void 0, false, {
                        fileName: "[project]/src/components/Countdown.jsx",
                        lineNumber: 53,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Countdown$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].number,
                        children: pad(time.hours)
                    }, void 0, false, {
                        fileName: "[project]/src/components/Countdown.jsx",
                        lineNumber: 54,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Countdown$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].separator,
                        children: ":"
                    }, void 0, false, {
                        fileName: "[project]/src/components/Countdown.jsx",
                        lineNumber: 55,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Countdown$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].number,
                        children: pad(time.minutes)
                    }, void 0, false, {
                        fileName: "[project]/src/components/Countdown.jsx",
                        lineNumber: 56,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Countdown$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].separator,
                        children: ":"
                    }, void 0, false, {
                        fileName: "[project]/src/components/Countdown.jsx",
                        lineNumber: 57,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Countdown$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].number,
                        children: pad(time.seconds)
                    }, void 0, false, {
                        fileName: "[project]/src/components/Countdown.jsx",
                        lineNumber: 58,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Countdown.jsx",
                lineNumber: 51,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Countdown$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].labels,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Countdown$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].label,
                        children: "DAYS"
                    }, void 0, false, {
                        fileName: "[project]/src/components/Countdown.jsx",
                        lineNumber: 61,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Countdown$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].label,
                        children: "HOURS"
                    }, void 0, false, {
                        fileName: "[project]/src/components/Countdown.jsx",
                        lineNumber: 62,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Countdown$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].label,
                        children: "MINUTES"
                    }, void 0, false, {
                        fileName: "[project]/src/components/Countdown.jsx",
                        lineNumber: 63,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Countdown$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].label,
                        children: "SECONDS"
                    }, void 0, false, {
                        fileName: "[project]/src/components/Countdown.jsx",
                        lineNumber: 64,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Countdown.jsx",
                lineNumber: 60,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/Countdown.jsx",
        lineNumber: 50,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = Countdown;
}),
"[project]/src/components/hero/BackgroundOverlay.module.css [ssr] (css module)", ((__turbopack_context__) => {

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
"[project]/src/components/hero/BackgroundOverlay.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/components/hero/BackgroundOverlay.module.css [ssr] (css module)");
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
 */ const BackgroundOverlay = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["memo"])(()=>{
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].overlayContainer,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].svg,
            viewBox: "0 0 1000 1000",
            preserveAspectRatio: "xMidYMid slice",
            "aria-hidden": "true",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("defs", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("radialGradient", {
                            id: "centerGlow",
                            cx: "50%",
                            cy: "50%",
                            r: "35%",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("stop", {
                                    offset: "0%",
                                    stopColor: "#D4A017",
                                    stopOpacity: "0.07"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                                    lineNumber: 37,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("stop", {
                                    offset: "60%",
                                    stopColor: "#D4A017",
                                    stopOpacity: "0.02"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                                    lineNumber: 38,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("stop", {
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
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("linearGradient", {
                            id: "pathFade",
                            x1: "0",
                            x2: "1",
                            y1: "0",
                            y2: "0",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("stop", {
                                    offset: "0%",
                                    stopColor: "white",
                                    stopOpacity: "0"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                                    lineNumber: 44,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("stop", {
                                    offset: "12%",
                                    stopColor: "white",
                                    stopOpacity: "1"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                                    lineNumber: 45,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("stop", {
                                    offset: "88%",
                                    stopColor: "white",
                                    stopOpacity: "1"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                                    lineNumber: 46,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("stop", {
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
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("mask", {
                            id: "edgeFade",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("rect", {
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
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("rect", {
                    width: "1000",
                    height: "1000",
                    fill: "url(#centerGlow)"
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 55,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("circle", {
                    cx: "500",
                    cy: "500",
                    r: "490",
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].element,
                    style: {
                        opacity: 0.04
                    }
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 58,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("line", {
                    x1: "0",
                    y1: "500",
                    x2: "1000",
                    y2: "500",
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].element
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 65,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("line", {
                    x1: "500",
                    y1: "0",
                    x2: "500",
                    y2: "1000",
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].element
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 66,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("circle", {
                    cx: "500",
                    cy: "500",
                    r: "300",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].element} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].animatePulse}`
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 69,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("circle", {
                    cx: "500",
                    cy: "500",
                    r: "150",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].element} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].animatePulse}`,
                    style: {
                        animationDelay: '2s'
                    }
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 73,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("circle", {
                    cx: "500",
                    cy: "500",
                    r: "60",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].element} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].animatePulse}`,
                    style: {
                        animationDelay: '4s',
                        opacity: 0.08
                    }
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 78,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                    d: "M 0 600 Q 100 550 200 620 T 400 580 T 600 650 T 800 600 T 1000 630",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].element} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].animatePath}`,
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
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                    d: "M 0 540 Q 120 580 240 510 T 480 560 T 720 520 T 1000 555",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].element} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].animatePathSlow}`,
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
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                    d: "M 200 800 C 400 800 400 200 600 200",
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].element,
                    style: {
                        strokeWidth: 1
                    }
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 101,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("line", {
                    x1: "300",
                    y1: "600",
                    x2: "500",
                    y2: "400",
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].element
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 108,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                    d: "M 400 400 A 100 100 0 0 1 600 400",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].element} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].animatePulse}`,
                    style: {
                        animationDelay: '1.5s'
                    }
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 111,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("g", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].scatterGroup,
                    children: scatter.map(([x, y], i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("circle", {
                            cx: x,
                            cy: y,
                            r: "2.2",
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].scatterDot,
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
                ].map(({ y, delay }, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("line", {
                        x1: "0",
                        y1: y,
                        x2: "1000",
                        y2: y,
                        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].element} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].scanLine}`,
                        style: {
                            animationDelay: delay
                        }
                    }, i, false, {
                        fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                        lineNumber: 137,
                        columnNumber: 11
                    }, ("TURBOPACK compile-time value", void 0))),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("text", {
                    x: "130",
                    y: "185",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].equation} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].equationSpaced} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].eqDesktop}`,
                    children: "∂V/∂t + ½σ²S²∂²V/∂S² + rS∂V/∂S − rV = 0"
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 146,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("text", {
                    x: "580",
                    y: "820",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].equation} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].equationSpaced} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].eqDesktop}`,
                    children: "dXt = σtXt dWt + μtXt dt"
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 149,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("text", {
                    x: "120",
                    y: "860",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].equation} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].equationSpaced} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].eqAll}`,
                    children: "E[Ri] = Rf + βi(E[Rm] − Rf)"
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 152,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("text", {
                    x: "660",
                    y: "145",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].equation} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].equationSpaced} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].eqDesktop}`,
                    children: "lim(n→∞) (1 + 1/n)ⁿ = e"
                }, void 0, false, {
                    fileName: "[project]/src/components/hero/BackgroundOverlay.jsx",
                    lineNumber: 155,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("text", {
                    x: "700",
                    y: "680",
                    className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].equation} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].equationSpaced} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].eqDesktop}`,
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
BackgroundOverlay.displayName = 'BackgroundOverlay';
const __TURBOPACK__default__export__ = BackgroundOverlay;
}),
"[project]/src/components/FadeInSection.module.css [ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "reveal": "FadeInSection-module__QIziha__reveal",
  "visible": "FadeInSection-module__QIziha__visible",
});
}),
"[project]/src/components/FadeInSection.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$FadeInSection$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/components/FadeInSection.module.css [ssr] (css module)");
;
;
;
const FadeInSection = ({ children })=>{
    const [isVisible, setVisible] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const domRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])();
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const observer = new IntersectionObserver((entries)=>{
            entries.forEach((entry)=>{
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });
        const { current } = domRef;
        if (current) observer.observe(current);
        return ()=>{
            if (current) observer.unobserve(current);
        };
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: `${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$FadeInSection$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].reveal} ${isVisible ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$FadeInSection$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].visible : ''}`,
        ref: domRef,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/FadeInSection.jsx",
        lineNumber: 27,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = FadeInSection;
}),
"[project]/src/components/Footer.module.css [ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "bottomBar": "Footer-module__S6Hkya__bottomBar",
  "brandDesc": "Footer-module__S6Hkya__brandDesc",
  "brandName": "Footer-module__S6Hkya__brandName",
  "colTitle": "Footer-module__S6Hkya__colTitle",
  "contactBlock": "Footer-module__S6Hkya__contactBlock",
  "contactEmail": "Footer-module__S6Hkya__contactEmail",
  "contactLabel": "Footer-module__S6Hkya__contactLabel",
  "copyright": "Footer-module__S6Hkya__copyright",
  "footer": "Footer-module__S6Hkya__footer",
  "footerContent": "Footer-module__S6Hkya__footerContent",
  "footerGrid": "Footer-module__S6Hkya__footerGrid",
  "linkList": "Footer-module__S6Hkya__linkList",
  "socialLink": "Footer-module__S6Hkya__socialLink",
  "socials": "Footer-module__S6Hkya__socials",
  "statusBadge": "Footer-module__S6Hkya__statusBadge",
  "statusDot": "Footer-module__S6Hkya__statusDot",
});
}),
"[project]/src/components/Footer.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/components/Footer.module.css [ssr] (css module)");
;
;
const Footer = ()=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("footer", {
        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].footer,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].footerContent,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].footerGrid,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].brandCol,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].brandName,
                                    children: "AMS"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/Footer.jsx",
                                    lineNumber: 10,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].brandDesc,
                                    children: "Exploring the space where deep algorithmic thinking meets quantitative finance."
                                }, void 0, false, {
                                    fileName: "[project]/src/components/Footer.jsx",
                                    lineNumber: 11,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].socials,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                            href: "https://github.com",
                                            target: "_blank",
                                            rel: "noopener noreferrer",
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].socialLink,
                                            "aria-label": "GitHub",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                width: "20",
                                                height: "20",
                                                viewBox: "0 0 24 24",
                                                fill: "currentColor",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                    d: "M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/Footer.jsx",
                                                    lineNumber: 18,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/Footer.jsx",
                                                lineNumber: 17,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Footer.jsx",
                                            lineNumber: 16,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                            href: "https://www.linkedin.com/company/111440238/admin/dashboard/",
                                            target: "_blank",
                                            rel: "noopener noreferrer",
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].socialLink,
                                            "aria-label": "LinkedIn",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                width: "20",
                                                height: "20",
                                                viewBox: "0 0 24 24",
                                                fill: "currentColor",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                    d: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/Footer.jsx",
                                                    lineNumber: 24,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/Footer.jsx",
                                                lineNumber: 23,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Footer.jsx",
                                            lineNumber: 22,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                            href: "https://discord.com/invite/fgm4CnBKzV",
                                            target: "_blank",
                                            rel: "noopener noreferrer",
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].socialLink,
                                            "aria-label": "Discord",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                width: "20",
                                                height: "20",
                                                viewBox: "0 0 24 24",
                                                fill: "currentColor",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                    d: "M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/Footer.jsx",
                                                    lineNumber: 30,
                                                    columnNumber: 19
                                                }, ("TURBOPACK compile-time value", void 0))
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/Footer.jsx",
                                                lineNumber: 29,
                                                columnNumber: 17
                                            }, ("TURBOPACK compile-time value", void 0))
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Footer.jsx",
                                            lineNumber: 28,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/Footer.jsx",
                                    lineNumber: 14,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/Footer.jsx",
                            lineNumber: 9,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].linkCol,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h3", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].colTitle,
                                    children: "CONTACT"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/Footer.jsx",
                                    lineNumber: 38,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].contactBlock,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].contactLabel,
                                            children: "GENERAL INQUIRIES"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Footer.jsx",
                                            lineNumber: 40,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                            href: "mailto:admin@amsociety.in",
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].contactEmail,
                                            children: "admin@amsociety.in"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Footer.jsx",
                                            lineNumber: 41,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/Footer.jsx",
                                    lineNumber: 39,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].contactBlock,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].contactLabel,
                                            children: "PARTNERS & SPONSORS"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Footer.jsx",
                                            lineNumber: 44,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("a", {
                                            href: "mailto:partnership@amsociety.in",
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].contactEmail,
                                            children: "partnership@amsociety.in"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/Footer.jsx",
                                            lineNumber: 45,
                                            columnNumber: 15
                                        }, ("TURBOPACK compile-time value", void 0))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/Footer.jsx",
                                    lineNumber: 43,
                                    columnNumber: 13
                                }, ("TURBOPACK compile-time value", void 0))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/Footer.jsx",
                            lineNumber: 37,
                            columnNumber: 11
                        }, ("TURBOPACK compile-time value", void 0))
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/Footer.jsx",
                    lineNumber: 7,
                    columnNumber: 9
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/src/components/Footer.jsx",
                lineNumber: 6,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].bottomBar,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].copyright,
                        children: [
                            "© 2026 ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("strong", {
                                children: "Algorithms & Mathematics Society"
                            }, void 0, false, {
                                fileName: "[project]/src/components/Footer.jsx",
                                lineNumber: 54,
                                columnNumber: 23
                            }, ("TURBOPACK compile-time value", void 0)),
                            ". All rights reserved."
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/Footer.jsx",
                        lineNumber: 53,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0)),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].statusBadge,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].statusDot
                            }, void 0, false, {
                                fileName: "[project]/src/components/Footer.jsx",
                                lineNumber: 57,
                                columnNumber: 11
                            }, ("TURBOPACK compile-time value", void 0)),
                            "All systems operational"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/Footer.jsx",
                        lineNumber: 56,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/Footer.jsx",
                lineNumber: 52,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/Footer.jsx",
        lineNumber: 5,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const __TURBOPACK__default__export__ = Footer;
}),
"[project]/src/styles/hero.module.css [ssr] (css module)", ((__turbopack_context__) => {

__turbopack_context__.v({
  "beamPulse": "hero-module__6qflza__beamPulse",
  "heroContent": "hero-module__6qflza__heroContent",
  "heroMain": "hero-module__6qflza__heroMain",
  "heroOverlay": "hero-module__6qflza__heroOverlay",
  "heroTopoLabel": "hero-module__6qflza__heroTopoLabel",
  "lightBeam": "hero-module__6qflza__lightBeam",
  "mainTitle": "hero-module__6qflza__mainTitle",
  "signupLabel": "hero-module__6qflza__signupLabel",
  "subTitle": "hero-module__6qflza__subTitle",
  "titleGroup": "hero-module__6qflza__titleGroup",
});
}),
"[project]/src/pages/index.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LandingPage
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$head$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/head.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dynamic$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dynamic.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Navbar$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/Navbar.jsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Countdown$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/Countdown.jsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/hero/BackgroundOverlay.jsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$FadeInSection$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/FadeInSection.jsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/Footer.jsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$hero$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__ = __turbopack_context__.i("[project]/src/styles/hero.module.css [ssr] (css module)");
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
// Dynamic import for Three.js component
const WireframeMesh = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dynamic$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/src/components/hero/WireframeMesh.jsx [ssr] (ecmascript, next/dynamic entry, async loader)"), {
    loadableGenerated: {
        modules: [
            "[project]/src/components/hero/WireframeMesh.jsx [client] (ecmascript, next/dynamic entry)"
        ]
    },
    ssr: false
});
// Dynamic imports for below-the-fold sections to reduce initial bundle
const AboutSection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dynamic$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/src/components/sections/AboutSection.jsx [ssr] (ecmascript, next/dynamic entry, async loader)"), {
    loadableGenerated: {
        modules: [
            "[project]/src/components/sections/AboutSection.jsx [client] (ecmascript, next/dynamic entry)"
        ]
    },
    loading: ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            style: {
                minHeight: '400px'
            }
        }, void 0, false, {
            fileName: "[project]/src/pages/index.jsx",
            lineNumber: 19,
            columnNumber: 18
        }, ("TURBOPACK compile-time value", void 0)),
    ssr: true
});
const CompetitionSection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dynamic$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/src/components/sections/CompetitionSection.jsx [ssr] (ecmascript, next/dynamic entry, async loader)"), {
    loadableGenerated: {
        modules: [
            "[project]/src/components/sections/CompetitionSection.jsx [client] (ecmascript, next/dynamic entry)"
        ]
    },
    loading: ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            style: {
                minHeight: '400px'
            }
        }, void 0, false, {
            fileName: "[project]/src/pages/index.jsx",
            lineNumber: 23,
            columnNumber: 18
        }, ("TURBOPACK compile-time value", void 0)),
    ssr: true
});
const TimelineSection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dynamic$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/src/components/sections/TimelineSection.jsx [ssr] (ecmascript, next/dynamic entry, async loader)"), {
    loadableGenerated: {
        modules: [
            "[project]/src/components/sections/TimelineSection.jsx [client] (ecmascript, next/dynamic entry)"
        ]
    },
    loading: ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            style: {
                minHeight: '400px'
            }
        }, void 0, false, {
            fileName: "[project]/src/pages/index.jsx",
            lineNumber: 27,
            columnNumber: 18
        }, ("TURBOPACK compile-time value", void 0)),
    ssr: true
});
const WhoSection = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dynamic$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"])(()=>__turbopack_context__.A("[project]/src/components/sections/WhoSection.jsx [ssr] (ecmascript, next/dynamic entry, async loader)"), {
    loadableGenerated: {
        modules: [
            "[project]/src/components/sections/WhoSection.jsx [client] (ecmascript, next/dynamic entry)"
        ]
    },
    loading: ()=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            style: {
                minHeight: '400px'
            }
        }, void 0, false, {
            fileName: "[project]/src/pages/index.jsx",
            lineNumber: 31,
            columnNumber: 18
        }, ("TURBOPACK compile-time value", void 0)),
    ssr: true
});
function LandingPage() {
    const [expired, setExpired] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$head$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("title", {
                        children: "AMS-DERIVE — Quantitative Trading & Mathematical Competition"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/index.jsx",
                        lineNumber: 41,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("meta", {
                        name: "description",
                        content: "AMS-DERIVE is a premium competitive programming and quantitative trading contest."
                    }, void 0, false, {
                        fileName: "[project]/src/pages/index.jsx",
                        lineNumber: 42,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("meta", {
                        name: "viewport",
                        content: "width=device-width, initial-scale=1"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/index.jsx",
                        lineNumber: 46,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/index.jsx",
                lineNumber: 40,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Navbar$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/pages/index.jsx",
                lineNumber: 49,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("main", {
                className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$hero$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].heroMain,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(WireframeMesh, {}, void 0, false, {
                        fileName: "[project]/src/pages/index.jsx",
                        lineNumber: 52,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$hero$2f$BackgroundOverlay$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                        fileName: "[project]/src/pages/index.jsx",
                        lineNumber: 53,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$hero$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].heroOverlay,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$hero$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].heroContent,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$hero$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].titleGroup,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$hero$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].mainTitle,
                                            children: "AMS DERIVE"
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/index.jsx",
                                            lineNumber: 58,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                            className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$hero$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].subTitle,
                                            children: "Quantitative Trading & Mathematical Competition"
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/index.jsx",
                                            lineNumber: 59,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/index.jsx",
                                    lineNumber: 57,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                    className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$hero$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].signupLabel,
                                    children: expired ? 'REGISTRATIONS ARE OPEN NOW' : 'REGISTRATIONS OPEN IN'
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/index.jsx",
                                    lineNumber: 62,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Countdown$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    onExpiredChange: setExpired
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/index.jsx",
                                    lineNumber: 65,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/pages/index.jsx",
                            lineNumber: 56,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/pages/index.jsx",
                        lineNumber: 55,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                        className: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$styles$2f$hero$2e$module$2e$css__$5b$ssr$5d$__$28$css__module$29$__["default"].heroTopoLabel
                    }, void 0, false, {
                        fileName: "[project]/src/pages/index.jsx",
                        lineNumber: 68,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/index.jsx",
                lineNumber: 51,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                className: "content-sections",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["Suspense"], {
                    fallback: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        style: {
                            minHeight: '400px'
                        }
                    }, void 0, false, {
                        fileName: "[project]/src/pages/index.jsx",
                        lineNumber: 72,
                        columnNumber: 29
                    }, void 0),
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$FadeInSection$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(AboutSection, {}, void 0, false, {
                                fileName: "[project]/src/pages/index.jsx",
                                lineNumber: 74,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/pages/index.jsx",
                            lineNumber: 73,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$FadeInSection$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(CompetitionSection, {}, void 0, false, {
                                fileName: "[project]/src/pages/index.jsx",
                                lineNumber: 77,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/pages/index.jsx",
                            lineNumber: 76,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$FadeInSection$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(TimelineSection, {}, void 0, false, {
                                fileName: "[project]/src/pages/index.jsx",
                                lineNumber: 80,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/pages/index.jsx",
                            lineNumber: 79,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$FadeInSection$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(WhoSection, {}, void 0, false, {
                                fileName: "[project]/src/pages/index.jsx",
                                lineNumber: 83,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/pages/index.jsx",
                            lineNumber: 82,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/pages/index.jsx",
                    lineNumber: 72,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/pages/index.jsx",
                lineNumber: 71,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$Footer$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/src/pages/index.jsx",
                lineNumber: 88,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__462c3a6f._.js.map
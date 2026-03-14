module.exports = [
"[project]/src/components/layout/Wordmark.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * The AMS-DERIVE wordmark / logo component.
 * @param {{ size?: 'sm'|'md'|'lg' }} props
 */ __turbopack_context__.s([
    "default",
    ()=>Wordmark
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
;
function Wordmark({ size = 'md' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
        className: `wordmark wordmark-${size}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                className: "wordmark-prefix",
                children: "AMS"
            }, void 0, false, {
                fileName: "[project]/src/components/layout/Wordmark.jsx",
                lineNumber: 9,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                className: "wordmark-separator",
                children: "-"
            }, void 0, false, {
                fileName: "[project]/src/components/layout/Wordmark.jsx",
                lineNumber: 10,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                className: "wordmark-suffix",
                children: "DERIVE"
            }, void 0, false, {
                fileName: "[project]/src/components/layout/Wordmark.jsx",
                lineNumber: 11,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/layout/Wordmark.jsx",
        lineNumber: 8,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/utils/countdownUtils.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Calculate the time remaining until a target date.
 * @param {string|Date} targetDate
 * @returns {{ days: number, hours: number, minutes: number, seconds: number, isExpired: boolean }}
 */ __turbopack_context__.s([
    "calculateTimeRemaining",
    ()=>calculateTimeRemaining,
    "formatTimeUnit",
    ()=>formatTimeUnit,
    "padNumber",
    ()=>padNumber
]);
function calculateTimeRemaining(targetDate) {
    const target = new Date(targetDate).getTime();
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) {
        return {
            days: 0,
            hours: 0,
            minutes: 0,
            seconds: 0,
            isExpired: true
        };
    }
    return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor(diff / (1000 * 60 * 60) % 24),
        minutes: Math.floor(diff / (1000 * 60) % 60),
        seconds: Math.floor(diff / 1000 % 60),
        isExpired: false
    };
}
function padNumber(n) {
    return String(n).padStart(2, '0');
}
function formatTimeUnit(value, label) {
    return `${padNumber(value)} ${label}`;
}
}),
"[project]/src/hooks/useCountdown.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useCountdown",
    ()=>useCountdown
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$countdownUtils$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/countdownUtils.js [ssr] (ecmascript)");
;
;
function useCountdown(targetDate) {
    const [timeRemaining, setTimeRemaining] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$countdownUtils$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["calculateTimeRemaining"])(targetDate));
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        const interval = setInterval(()=>{
            const remaining = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$countdownUtils$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["calculateTimeRemaining"])(targetDate);
            setTimeRemaining(remaining);
            if (remaining.isExpired) {
                clearInterval(interval);
            }
        }, 1000);
        return ()=>clearInterval(interval);
    }, [
        targetDate
    ]);
    return timeRemaining;
}
}),
"[project]/src/components/countdown/TimeBlock.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TimeBlock
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$countdownUtils$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/countdownUtils.js [ssr] (ecmascript)");
;
;
function TimeBlock({ value = 0, label = '' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "timeblock",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                className: "timeblock-value",
                children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$countdownUtils$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["padNumber"])(value)
            }, void 0, false, {
                fileName: "[project]/src/components/countdown/TimeBlock.jsx",
                lineNumber: 10,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                className: "timeblock-label",
                children: label
            }, void 0, false, {
                fileName: "[project]/src/components/countdown/TimeBlock.jsx",
                lineNumber: 11,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/countdown/TimeBlock.jsx",
        lineNumber: 9,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/components/countdown/CountdownTimer.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CountdownTimer
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useCountdown$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/useCountdown.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$countdown$2f$TimeBlock$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/countdown/TimeBlock.jsx [ssr] (ecmascript)");
;
;
;
function CountdownTimer({ targetDate }) {
    const { days, hours, minutes, seconds, isExpired } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$useCountdown$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useCountdown"])(targetDate);
    if (isExpired) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: "countdown-container",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                className: "countdown-expired",
                children: "The contest has begun!"
            }, void 0, false, {
                fileName: "[project]/src/components/countdown/CountdownTimer.jsx",
                lineNumber: 14,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/countdown/CountdownTimer.jsx",
            lineNumber: 13,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "countdown-container",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
            className: "countdown-blocks",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$countdown$2f$TimeBlock$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                    value: days,
                    label: "Days"
                }, void 0, false, {
                    fileName: "[project]/src/components/countdown/CountdownTimer.jsx",
                    lineNumber: 22,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                    className: "countdown-separator",
                    children: ":"
                }, void 0, false, {
                    fileName: "[project]/src/components/countdown/CountdownTimer.jsx",
                    lineNumber: 23,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$countdown$2f$TimeBlock$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                    value: hours,
                    label: "Hours"
                }, void 0, false, {
                    fileName: "[project]/src/components/countdown/CountdownTimer.jsx",
                    lineNumber: 24,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                    className: "countdown-separator",
                    children: ":"
                }, void 0, false, {
                    fileName: "[project]/src/components/countdown/CountdownTimer.jsx",
                    lineNumber: 25,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$countdown$2f$TimeBlock$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                    value: minutes,
                    label: "Minutes"
                }, void 0, false, {
                    fileName: "[project]/src/components/countdown/CountdownTimer.jsx",
                    lineNumber: 26,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                    className: "countdown-separator",
                    children: ":"
                }, void 0, false, {
                    fileName: "[project]/src/components/countdown/CountdownTimer.jsx",
                    lineNumber: 27,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$countdown$2f$TimeBlock$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                    value: seconds,
                    label: "Seconds"
                }, void 0, false, {
                    fileName: "[project]/src/components/countdown/CountdownTimer.jsx",
                    lineNumber: 28,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/countdown/CountdownTimer.jsx",
            lineNumber: 21,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/countdown/CountdownTimer.jsx",
        lineNumber: 20,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/components/ui/Button.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Primary action button with accent styling.
 * @param {{ children: React.ReactNode, type?: string, disabled?: boolean, onClick?: Function, variant?: 'primary'|'secondary' }} props
 */ __turbopack_context__.s([
    "default",
    ()=>Button
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
;
function Button({ children, type = 'button', disabled = false, onClick, variant = 'primary' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
        type: type,
        disabled: disabled,
        onClick: onClick,
        className: `btn btn-${variant}`,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/components/ui/Button.jsx",
        lineNumber: 14,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/pages/index.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LandingPage
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$head$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/head.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Wordmark$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Wordmark.jsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$countdown$2f$CountdownTimer$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/countdown/CountdownTimer.jsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$Button$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/Button.jsx [ssr] (ecmascript)");
;
;
;
;
;
const CONTEST_DATE = '2026-06-01T00:00:00';
function LandingPage() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$head$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("title", {
                        children: "AMS-DERIVE — Competitive Programming Contest"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/index.jsx",
                        lineNumber: 12,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("meta", {
                        name: "description",
                        content: "AMS-DERIVE is a premium competitive programming contest. Register now and test your skills."
                    }, void 0, false, {
                        fileName: "[project]/src/pages/index.jsx",
                        lineNumber: 13,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("meta", {
                        name: "viewport",
                        content: "width=device-width, initial-scale=1"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/index.jsx",
                        lineNumber: 17,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/index.jsx",
                lineNumber: 11,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("main", {
                className: "landing-main",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "landing-hero",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Wordmark$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                            size: "lg"
                        }, void 0, false, {
                            fileName: "[project]/src/pages/index.jsx",
                            lineNumber: 21,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                            className: "landing-tagline",
                            children: "A competitive programming contest"
                        }, void 0, false, {
                            fileName: "[project]/src/pages/index.jsx",
                            lineNumber: 22,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$countdown$2f$CountdownTimer$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                            targetDate: CONTEST_DATE
                        }, void 0, false, {
                            fileName: "[project]/src/pages/index.jsx",
                            lineNumber: 23,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "landing-actions",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$Button$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                onClick: ()=>window.location.href = '/register',
                                children: "Register Now"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/index.jsx",
                                lineNumber: 25,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/pages/index.jsx",
                            lineNumber: 24,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/pages/index.jsx",
                    lineNumber: 20,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/pages/index.jsx",
                lineNumber: 19,
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

//# sourceMappingURL=%5Broot-of-the-server%5D__29cbd137._.js.map
module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/pages-api-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/pages/api/get-ip.js [api] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * API route that returns the client's IP address.
 * GET /api/get-ip → { ip: string }
 */ __turbopack_context__.s([
    "default",
    ()=>handler
]);
function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({
            error: 'Method not allowed'
        });
    }
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;
    res.status(200).json({
        ip
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__8069aed9._.js.map
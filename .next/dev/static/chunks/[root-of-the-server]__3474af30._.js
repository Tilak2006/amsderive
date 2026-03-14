(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[turbopack]/browser/dev/hmr-client/hmr-client.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/// <reference path="../../../shared/runtime-types.d.ts" />
/// <reference path="../../runtime/base/dev-globals.d.ts" />
/// <reference path="../../runtime/base/dev-protocol.d.ts" />
/// <reference path="../../runtime/base/dev-extensions.ts" />
__turbopack_context__.s([
    "connect",
    ()=>connect,
    "setHooks",
    ()=>setHooks,
    "subscribeToUpdate",
    ()=>subscribeToUpdate
]);
function connect({ addMessageListener, sendMessage, onUpdateError = console.error }) {
    addMessageListener((msg)=>{
        switch(msg.type){
            case 'turbopack-connected':
                handleSocketConnected(sendMessage);
                break;
            default:
                try {
                    if (Array.isArray(msg.data)) {
                        for(let i = 0; i < msg.data.length; i++){
                            handleSocketMessage(msg.data[i]);
                        }
                    } else {
                        handleSocketMessage(msg.data);
                    }
                    applyAggregatedUpdates();
                } catch (e) {
                    console.warn('[Fast Refresh] performing full reload\n\n' + "Fast Refresh will perform a full reload when you edit a file that's imported by modules outside of the React rendering tree.\n" + 'You might have a file which exports a React component but also exports a value that is imported by a non-React component file.\n' + 'Consider migrating the non-React component export to a separate file and importing it into both files.\n\n' + 'It is also possible the parent component of the component you edited is a class component, which disables Fast Refresh.\n' + 'Fast Refresh requires at least one parent function component in your React tree.');
                    onUpdateError(e);
                    location.reload();
                }
                break;
        }
    });
    const queued = globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS;
    if (queued != null && !Array.isArray(queued)) {
        throw new Error('A separate HMR handler was already registered');
    }
    globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS = {
        push: ([chunkPath, callback])=>{
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    };
    if (Array.isArray(queued)) {
        for (const [chunkPath, callback] of queued){
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    }
}
const updateCallbackSets = new Map();
function sendJSON(sendMessage, message) {
    sendMessage(JSON.stringify(message));
}
function resourceKey(resource) {
    return JSON.stringify({
        path: resource.path,
        headers: resource.headers || null
    });
}
function subscribeToUpdates(sendMessage, resource) {
    sendJSON(sendMessage, {
        type: 'turbopack-subscribe',
        ...resource
    });
    return ()=>{
        sendJSON(sendMessage, {
            type: 'turbopack-unsubscribe',
            ...resource
        });
    };
}
function handleSocketConnected(sendMessage) {
    for (const key of updateCallbackSets.keys()){
        subscribeToUpdates(sendMessage, JSON.parse(key));
    }
}
// we aggregate all pending updates until the issues are resolved
const chunkListsWithPendingUpdates = new Map();
function aggregateUpdates(msg) {
    const key = resourceKey(msg.resource);
    let aggregated = chunkListsWithPendingUpdates.get(key);
    if (aggregated) {
        aggregated.instruction = mergeChunkListUpdates(aggregated.instruction, msg.instruction);
    } else {
        chunkListsWithPendingUpdates.set(key, msg);
    }
}
function applyAggregatedUpdates() {
    if (chunkListsWithPendingUpdates.size === 0) return;
    hooks.beforeRefresh();
    for (const msg of chunkListsWithPendingUpdates.values()){
        triggerUpdate(msg);
    }
    chunkListsWithPendingUpdates.clear();
    finalizeUpdate();
}
function mergeChunkListUpdates(updateA, updateB) {
    let chunks;
    if (updateA.chunks != null) {
        if (updateB.chunks == null) {
            chunks = updateA.chunks;
        } else {
            chunks = mergeChunkListChunks(updateA.chunks, updateB.chunks);
        }
    } else if (updateB.chunks != null) {
        chunks = updateB.chunks;
    }
    let merged;
    if (updateA.merged != null) {
        if (updateB.merged == null) {
            merged = updateA.merged;
        } else {
            // Since `merged` is an array of updates, we need to merge them all into
            // one, consistent update.
            // Since there can only be `EcmascriptMergeUpdates` in the array, there is
            // no need to key on the `type` field.
            let update = updateA.merged[0];
            for(let i = 1; i < updateA.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateA.merged[i]);
            }
            for(let i = 0; i < updateB.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateB.merged[i]);
            }
            merged = [
                update
            ];
        }
    } else if (updateB.merged != null) {
        merged = updateB.merged;
    }
    return {
        type: 'ChunkListUpdate',
        chunks,
        merged
    };
}
function mergeChunkListChunks(chunksA, chunksB) {
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    return chunks;
}
function mergeChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted' || updateA.type === 'deleted' && updateB.type === 'added') {
        return undefined;
    }
    if (updateA.type === 'partial') {
        invariant(updateA.instruction, 'Partial updates are unsupported');
    }
    if (updateB.type === 'partial') {
        invariant(updateB.instruction, 'Partial updates are unsupported');
    }
    return undefined;
}
function mergeChunkListEcmascriptMergedUpdates(mergedA, mergedB) {
    const entries = mergeEcmascriptChunkEntries(mergedA.entries, mergedB.entries);
    const chunks = mergeEcmascriptChunksUpdates(mergedA.chunks, mergedB.chunks);
    return {
        type: 'EcmascriptMergedUpdate',
        entries,
        chunks
    };
}
function mergeEcmascriptChunkEntries(entriesA, entriesB) {
    return {
        ...entriesA,
        ...entriesB
    };
}
function mergeEcmascriptChunksUpdates(chunksA, chunksB) {
    if (chunksA == null) {
        return chunksB;
    }
    if (chunksB == null) {
        return chunksA;
    }
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeEcmascriptChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    if (Object.keys(chunks).length === 0) {
        return undefined;
    }
    return chunks;
}
function mergeEcmascriptChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted') {
        // These two completely cancel each other out.
        return undefined;
    }
    if (updateA.type === 'deleted' && updateB.type === 'added') {
        const added = [];
        const deleted = [];
        const deletedModules = new Set(updateA.modules ?? []);
        const addedModules = new Set(updateB.modules ?? []);
        for (const moduleId of addedModules){
            if (!deletedModules.has(moduleId)) {
                added.push(moduleId);
            }
        }
        for (const moduleId of deletedModules){
            if (!addedModules.has(moduleId)) {
                deleted.push(moduleId);
            }
        }
        if (added.length === 0 && deleted.length === 0) {
            return undefined;
        }
        return {
            type: 'partial',
            added,
            deleted
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'partial') {
        const added = new Set([
            ...updateA.added ?? [],
            ...updateB.added ?? []
        ]);
        const deleted = new Set([
            ...updateA.deleted ?? [],
            ...updateB.deleted ?? []
        ]);
        if (updateB.added != null) {
            for (const moduleId of updateB.added){
                deleted.delete(moduleId);
            }
        }
        if (updateB.deleted != null) {
            for (const moduleId of updateB.deleted){
                added.delete(moduleId);
            }
        }
        return {
            type: 'partial',
            added: [
                ...added
            ],
            deleted: [
                ...deleted
            ]
        };
    }
    if (updateA.type === 'added' && updateB.type === 'partial') {
        const modules = new Set([
            ...updateA.modules ?? [],
            ...updateB.added ?? []
        ]);
        for (const moduleId of updateB.deleted ?? []){
            modules.delete(moduleId);
        }
        return {
            type: 'added',
            modules: [
                ...modules
            ]
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'deleted') {
        // We could eagerly return `updateB` here, but this would potentially be
        // incorrect if `updateA` has added modules.
        const modules = new Set(updateB.modules ?? []);
        if (updateA.added != null) {
            for (const moduleId of updateA.added){
                modules.delete(moduleId);
            }
        }
        return {
            type: 'deleted',
            modules: [
                ...modules
            ]
        };
    }
    // Any other update combination is invalid.
    return undefined;
}
function invariant(_, message) {
    throw new Error(`Invariant: ${message}`);
}
const CRITICAL = [
    'bug',
    'error',
    'fatal'
];
function compareByList(list, a, b) {
    const aI = list.indexOf(a) + 1 || list.length;
    const bI = list.indexOf(b) + 1 || list.length;
    return aI - bI;
}
const chunksWithIssues = new Map();
function emitIssues() {
    const issues = [];
    const deduplicationSet = new Set();
    for (const [_, chunkIssues] of chunksWithIssues){
        for (const chunkIssue of chunkIssues){
            if (deduplicationSet.has(chunkIssue.formatted)) continue;
            issues.push(chunkIssue);
            deduplicationSet.add(chunkIssue.formatted);
        }
    }
    sortIssues(issues);
    hooks.issues(issues);
}
function handleIssues(msg) {
    const key = resourceKey(msg.resource);
    let hasCriticalIssues = false;
    for (const issue of msg.issues){
        if (CRITICAL.includes(issue.severity)) {
            hasCriticalIssues = true;
        }
    }
    if (msg.issues.length > 0) {
        chunksWithIssues.set(key, msg.issues);
    } else if (chunksWithIssues.has(key)) {
        chunksWithIssues.delete(key);
    }
    emitIssues();
    return hasCriticalIssues;
}
const SEVERITY_ORDER = [
    'bug',
    'fatal',
    'error',
    'warning',
    'info',
    'log'
];
const CATEGORY_ORDER = [
    'parse',
    'resolve',
    'code generation',
    'rendering',
    'typescript',
    'other'
];
function sortIssues(issues) {
    issues.sort((a, b)=>{
        const first = compareByList(SEVERITY_ORDER, a.severity, b.severity);
        if (first !== 0) return first;
        return compareByList(CATEGORY_ORDER, a.category, b.category);
    });
}
const hooks = {
    beforeRefresh: ()=>{},
    refresh: ()=>{},
    buildOk: ()=>{},
    issues: (_issues)=>{}
};
function setHooks(newHooks) {
    Object.assign(hooks, newHooks);
}
function handleSocketMessage(msg) {
    sortIssues(msg.issues);
    handleIssues(msg);
    switch(msg.type){
        case 'issues':
            break;
        case 'partial':
            // aggregate updates
            aggregateUpdates(msg);
            break;
        default:
            // run single update
            const runHooks = chunkListsWithPendingUpdates.size === 0;
            if (runHooks) hooks.beforeRefresh();
            triggerUpdate(msg);
            if (runHooks) finalizeUpdate();
            break;
    }
}
function finalizeUpdate() {
    hooks.refresh();
    hooks.buildOk();
    // This is used by the Next.js integration test suite to notify it when HMR
    // updates have been completed.
    // TODO: Only run this in test environments (gate by `process.env.__NEXT_TEST_MODE`)
    if (globalThis.__NEXT_HMR_CB) {
        globalThis.__NEXT_HMR_CB();
        globalThis.__NEXT_HMR_CB = null;
    }
}
function subscribeToChunkUpdate(chunkListPath, sendMessage, callback) {
    return subscribeToUpdate({
        path: chunkListPath
    }, sendMessage, callback);
}
function subscribeToUpdate(resource, sendMessage, callback) {
    const key = resourceKey(resource);
    let callbackSet;
    const existingCallbackSet = updateCallbackSets.get(key);
    if (!existingCallbackSet) {
        callbackSet = {
            callbacks: new Set([
                callback
            ]),
            unsubscribe: subscribeToUpdates(sendMessage, resource)
        };
        updateCallbackSets.set(key, callbackSet);
    } else {
        existingCallbackSet.callbacks.add(callback);
        callbackSet = existingCallbackSet;
    }
    return ()=>{
        callbackSet.callbacks.delete(callback);
        if (callbackSet.callbacks.size === 0) {
            callbackSet.unsubscribe();
            updateCallbackSets.delete(key);
        }
    };
}
function triggerUpdate(msg) {
    const key = resourceKey(msg.resource);
    const callbackSet = updateCallbackSets.get(key);
    if (!callbackSet) {
        return;
    }
    for (const callback of callbackSet.callbacks){
        callback(msg);
    }
    if (msg.type === 'notFound') {
        // This indicates that the resource which we subscribed to either does not exist or
        // has been deleted. In either case, we should clear all update callbacks, so if a
        // new subscription is created for the same resource, it will send a new "subscribe"
        // message to the server.
        // No need to send an "unsubscribe" message to the server, it will have already
        // dropped the update stream before sending the "notFound" message.
        updateCallbackSets.delete(key);
    }
}
}),
"[project]/src/components/form/TextInput.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * A labelled text input field with optional hint and error display.
 * @param {{ label: string, name: string, value: string, onChange: Function, error?: string, placeholder?: string, required?: boolean, hint?: string }} props
 */ __turbopack_context__.s([
    "default",
    ()=>TextInput
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
;
function TextInput({ label, name, value = '', onChange, error = '', placeholder = '', required = false, hint = '' }) {
    const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "text-input-field",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                htmlFor: name,
                className: "text-input-label",
                children: [
                    label,
                    required && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-input-required",
                        children: " *"
                    }, void 0, false, {
                        fileName: "[project]/src/components/form/TextInput.jsx",
                        lineNumber: 26,
                        columnNumber: 22
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/form/TextInput.jsx",
                lineNumber: 24,
                columnNumber: 7
            }, this),
            hint && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                id: `${name}-hint`,
                className: "text-input-hint",
                children: hint
            }, void 0, false, {
                fileName: "[project]/src/components/form/TextInput.jsx",
                lineNumber: 29,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                id: name,
                name: name,
                type: "text",
                value: value,
                onChange: onChange,
                placeholder: placeholder,
                className: `text-input ${error ? 'text-input-error' : ''}`,
                "aria-invalid": !!error,
                "aria-describedby": describedBy
            }, void 0, false, {
                fileName: "[project]/src/components/form/TextInput.jsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                id: `${name}-error`,
                className: "text-input-error-msg",
                role: "alert",
                children: error
            }, void 0, false, {
                fileName: "[project]/src/components/form/TextInput.jsx",
                lineNumber: 45,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/form/TextInput.jsx",
        lineNumber: 23,
        columnNumber: 5
    }, this);
}
_c = TextInput;
var _c;
__turbopack_context__.k.register(_c, "TextInput");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/form/FileUpload.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FileUpload
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
function FileUpload({ label, name, accept = '', onFileSelect, error = '', file = null, required = false }) {
    _s();
    const inputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const [dragging, setDragging] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [previewUrl, setPreviewUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "FileUpload.useEffect": ()=>{
            if (file && file.type.startsWith('image/')) {
                const url = URL.createObjectURL(file);
                setPreviewUrl(url);
                return ({
                    "FileUpload.useEffect": ()=>URL.revokeObjectURL(url)
                })["FileUpload.useEffect"];
            }
            setPreviewUrl(null);
        }
    }["FileUpload.useEffect"], [
        file
    ]);
    function handleClick() {
        inputRef.current?.click();
    }
    function handleChange(e) {
        const selected = e.target.files?.[0] || null;
        if (selected && onFileSelect) {
            onFileSelect(selected);
        }
    }
    function handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
    }
    function handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
    }
    function handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
        const dropped = e.dataTransfer.files?.[0] || null;
        if (dropped && onFileSelect) {
            onFileSelect(dropped);
        }
    }
    function formatFileSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    const dropzoneClasses = [
        'file-upload-dropzone',
        dragging ? 'file-upload-dropzone-dragging' : '',
        file ? 'file-upload-dropzone-selected' : '',
        error ? 'file-upload-dropzone-error' : ''
    ].filter(Boolean).join(' ');
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "file-upload-field",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "file-upload-label",
                children: [
                    label,
                    required && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "file-upload-required",
                        children: " *"
                    }, void 0, false, {
                        fileName: "[project]/src/components/form/FileUpload.jsx",
                        lineNumber: 81,
                        columnNumber: 22
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/form/FileUpload.jsx",
                lineNumber: 79,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "file-upload-subtext",
                children: "to verify institution"
            }, void 0, false, {
                fileName: "[project]/src/components/form/FileUpload.jsx",
                lineNumber: 83,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                className: dropzoneClasses,
                onClick: handleClick,
                onDragOver: handleDragOver,
                onDragLeave: handleDragLeave,
                onDrop: handleDrop,
                "aria-describedby": error ? `${name}-error` : undefined,
                children: file ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "file-upload-selected",
                    children: [
                        previewUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                            src: previewUrl,
                            alt: "Preview",
                            className: "file-upload-preview"
                        }, void 0, false, {
                            fileName: "[project]/src/components/form/FileUpload.jsx",
                            lineNumber: 96,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "file-upload-info",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "file-upload-filename",
                                    children: file.name
                                }, void 0, false, {
                                    fileName: "[project]/src/components/form/FileUpload.jsx",
                                    lineNumber: 103,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "file-upload-filesize",
                                    children: formatFileSize(file.size)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/form/FileUpload.jsx",
                                    lineNumber: 104,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/form/FileUpload.jsx",
                            lineNumber: 102,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                            className: "file-upload-checkmark",
                            width: "24",
                            height: "24",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            "aria-hidden": "true",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                    cx: "12",
                                    cy: "12",
                                    r: "12",
                                    fill: "#c9a84c"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/form/FileUpload.jsx",
                                    lineNumber: 114,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    d: "M7 12.5l3 3 7-7",
                                    stroke: "#0a0a0a",
                                    strokeWidth: "2",
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/form/FileUpload.jsx",
                                    lineNumber: 115,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/form/FileUpload.jsx",
                            lineNumber: 106,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/form/FileUpload.jsx",
                    lineNumber: 94,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "file-upload-empty",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "file-upload-prompt",
                            children: "Click to upload or drag and drop"
                        }, void 0, false, {
                            fileName: "[project]/src/components/form/FileUpload.jsx",
                            lineNumber: 126,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "file-upload-formats",
                            children: "JPG, PNG or PDF · Max 5MB"
                        }, void 0, false, {
                            fileName: "[project]/src/components/form/FileUpload.jsx",
                            lineNumber: 127,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/form/FileUpload.jsx",
                    lineNumber: 125,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/form/FileUpload.jsx",
                lineNumber: 84,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                ref: inputRef,
                id: name,
                name: name,
                type: "file",
                accept: accept,
                onChange: handleChange,
                className: "file-upload-hidden",
                "aria-hidden": "true",
                tabIndex: -1
            }, void 0, false, {
                fileName: "[project]/src/components/form/FileUpload.jsx",
                lineNumber: 131,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                id: `${name}-error`,
                className: "file-upload-error-msg",
                role: "alert",
                children: error
            }, void 0, false, {
                fileName: "[project]/src/components/form/FileUpload.jsx",
                lineNumber: 143,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/form/FileUpload.jsx",
        lineNumber: 78,
        columnNumber: 5
    }, this);
}
_s(FileUpload, "ksrNpFYVf+meta6Sa0WC1M5Zcms=");
_c = FileUpload;
var _c;
__turbopack_context__.k.register(_c, "FileUpload");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/Button.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Primary action button with accent styling.
 * @param {{ children: React.ReactNode, type?: string, disabled?: boolean, onClick?: Function, variant?: 'primary'|'secondary' }} props
 */ __turbopack_context__.s([
    "default",
    ()=>Button
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
;
function Button({ children, type = 'button', disabled = false, onClick, variant = 'primary' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
_c = Button;
var _c;
__turbopack_context__.k.register(_c, "Button");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/validators.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Validate a participant name.
 * @param {string} value
 * @returns {{ valid: boolean, error?: string }}
 */ __turbopack_context__.s([
    "validateCodechefHandle",
    ()=>validateCodechefHandle,
    "validateCodeforcesHandle",
    ()=>validateCodeforcesHandle,
    "validateHandle",
    ()=>validateHandle,
    "validateInstitution",
    ()=>validateInstitution,
    "validateName",
    ()=>validateName
]);
function validateName(value) {
    const trimmed = (value || '').trim();
    if (!trimmed) return {
        valid: false,
        error: 'Name is required'
    };
    if (trimmed.length < 2) return {
        valid: false,
        error: 'Name must be at least 2 characters'
    };
    if (trimmed.length > 100) return {
        valid: false,
        error: 'Name must be under 100 characters'
    };
    if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
        return {
            valid: false,
            error: 'Name can only contain letters and spaces'
        };
    }
    return {
        valid: true
    };
}
function validateInstitution(value) {
    const trimmed = (value || '').trim();
    if (!trimmed) return {
        valid: false,
        error: 'Institution is required'
    };
    if (trimmed.length < 3) return {
        valid: false,
        error: 'Institution must be at least 3 characters'
    };
    if (trimmed.length > 150) return {
        valid: false,
        error: 'Institution must be under 150 characters'
    };
    return {
        valid: true
    };
}
function validateHandle(value) {
    const trimmed = (value || '').trim();
    if (!trimmed) return {
        valid: false,
        error: 'Handle is required'
    };
    if (trimmed.length < 2) return {
        valid: false,
        error: 'Handle must be at least 2 characters'
    };
    if (trimmed.length > 50) return {
        valid: false,
        error: 'Handle must be under 50 characters'
    };
    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
        return {
            valid: false,
            error: 'Handle can only contain letters, numbers, underscores, dots, and hyphens'
        };
    }
    return {
        valid: true
    };
}
function validateCodeforcesHandle(value) {
    const trimmed = (value || '').trim();
    if (!trimmed) return {
        valid: false,
        error: 'Codeforces handle is required'
    };
    if (trimmed.length > 24) return {
        valid: false,
        error: 'Codeforces handle must be under 24 characters'
    };
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
        return {
            valid: false,
            error: 'Codeforces handle can only contain letters, numbers, underscores, and hyphens'
        };
    }
    return {
        valid: true
    };
}
function validateCodechefHandle(value) {
    const trimmed = (value || '').trim();
    if (!trimmed) return {
        valid: false,
        error: 'CodeChef handle is required'
    };
    if (trimmed.length > 24) return {
        valid: false,
        error: 'CodeChef handle must be under 24 characters'
    };
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
        return {
            valid: false,
            error: 'CodeChef handle can only contain letters, numbers, underscores, and hyphens'
        };
    }
    return {
        valid: true
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/fileValidation.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Validate that a file's type is in the allowed list.
 * @param {File} file
 * @param {string[]} allowedTypes - e.g. ['image/png', 'image/jpeg', 'application/pdf']
 * @returns {{ valid: boolean, error?: string }}
 */ __turbopack_context__.s([
    "validateFileSize",
    ()=>validateFileSize,
    "validateFileType",
    ()=>validateFileType
]);
function validateFileType(file, allowedTypes) {
    if (!file) return {
        valid: false,
        error: 'No file provided'
    };
    if (!allowedTypes.includes(file.type)) {
        return {
            valid: false,
            error: `File type "${file.type}" is not allowed`
        };
    }
    return {
        valid: true
    };
}
function validateFileSize(file, maxBytes) {
    if (!file) return {
        valid: false,
        error: 'No file provided'
    };
    if (file.size > maxBytes) {
        const maxMB = (maxBytes / (1024 * 1024)).toFixed(1);
        return {
            valid: false,
            error: `File exceeds maximum size of ${maxMB} MB`
        };
    }
    return {
        valid: true
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/form/RegistrationForm.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RegistrationForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$TextInput$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/form/TextInput.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$FileUpload$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/form/FileUpload.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$Button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/Button.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validators$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validators.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$fileValidation$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/fileValidation.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'application/pdf'
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
function RegistrationForm({ onSubmit, loading = false }) {
    _s();
    const [fields, setFields] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        name: '',
        institution: '',
        cfHandle: '',
        ccHandle: ''
    });
    const [file, setFile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [errors, setErrors] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({});
    function handleChange(e) {
        const { name, value } = e.target;
        setFields((prev)=>({
                ...prev,
                [name]: value
            }));
        if (errors[name]) {
            setErrors((prev)=>({
                    ...prev,
                    [name]: ''
                }));
        }
    }
    function handleFileSelect(selected) {
        setFile(selected);
        if (errors.file) {
            setErrors((prev)=>({
                    ...prev,
                    file: ''
                }));
        }
    }
    function validateAll() {
        const newErrors = {};
        const nameResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validators$2e$js__$5b$client$5d$__$28$ecmascript$29$__["validateName"])(fields.name);
        if (!nameResult.valid) newErrors.name = nameResult.error;
        const instResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validators$2e$js__$5b$client$5d$__$28$ecmascript$29$__["validateInstitution"])(fields.institution);
        if (!instResult.valid) newErrors.institution = instResult.error;
        const cfResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validators$2e$js__$5b$client$5d$__$28$ecmascript$29$__["validateCodeforcesHandle"])(fields.cfHandle);
        if (!cfResult.valid) newErrors.cfHandle = cfResult.error;
        const ccResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validators$2e$js__$5b$client$5d$__$28$ecmascript$29$__["validateCodechefHandle"])(fields.ccHandle);
        if (!ccResult.valid) newErrors.ccHandle = ccResult.error;
        if (!file) {
            newErrors.file = 'ID card is required';
        } else {
            const typeResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$fileValidation$2e$js__$5b$client$5d$__$28$ecmascript$29$__["validateFileType"])(file, ALLOWED_TYPES);
            if (!typeResult.valid) {
                newErrors.file = typeResult.error;
            } else {
                const sizeResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$fileValidation$2e$js__$5b$client$5d$__$28$ecmascript$29$__["validateFileSize"])(file, MAX_FILE_SIZE);
                if (!sizeResult.valid) newErrors.file = sizeResult.error;
            }
        }
        return newErrors;
    }
    function handleSubmit(e) {
        e.preventDefault();
        const newErrors = validateAll();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        if (onSubmit) {
            onSubmit({
                ...fields,
                file
            }, setErrors);
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
        className: "registration-form",
        onSubmit: handleSubmit,
        noValidate: true,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$TextInput$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                label: "Full Name",
                name: "name",
                value: fields.name,
                onChange: handleChange,
                error: errors.name,
                placeholder: "Your full name",
                required: true
            }, void 0, false, {
                fileName: "[project]/src/components/form/RegistrationForm.jsx",
                lineNumber: 84,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$TextInput$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                label: "Institution",
                name: "institution",
                value: fields.institution,
                onChange: handleChange,
                error: errors.institution,
                placeholder: "College / University / School",
                required: true
            }, void 0, false, {
                fileName: "[project]/src/components/form/RegistrationForm.jsx",
                lineNumber: 93,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$TextInput$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                label: "Codeforces Handle",
                name: "cfHandle",
                value: fields.cfHandle,
                onChange: handleChange,
                error: errors.cfHandle,
                placeholder: "cf_username",
                hint: "Max 24 characters, no dots",
                required: true
            }, void 0, false, {
                fileName: "[project]/src/components/form/RegistrationForm.jsx",
                lineNumber: 102,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$TextInput$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                label: "CodeChef Handle",
                name: "ccHandle",
                value: fields.ccHandle,
                onChange: handleChange,
                error: errors.ccHandle,
                placeholder: "cc_username",
                hint: "Max 24 characters, no dots",
                required: true
            }, void 0, false, {
                fileName: "[project]/src/components/form/RegistrationForm.jsx",
                lineNumber: 112,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$FileUpload$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                label: "ID Card",
                name: "file",
                accept: "image/jpeg,image/png,application/pdf",
                onFileSelect: handleFileSelect,
                error: errors.file,
                file: file,
                required: true
            }, void 0, false, {
                fileName: "[project]/src/components/form/RegistrationForm.jsx",
                lineNumber: 122,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$Button$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                type: "submit",
                disabled: loading,
                children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "submit-loading",
                    children: [
                        "Submitting",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "submit-dot submit-dot-1",
                            children: "·"
                        }, void 0, false, {
                            fileName: "[project]/src/components/form/RegistrationForm.jsx",
                            lineNumber: 135,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "submit-dot submit-dot-2",
                            children: "·"
                        }, void 0, false, {
                            fileName: "[project]/src/components/form/RegistrationForm.jsx",
                            lineNumber: 136,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "submit-dot submit-dot-3",
                            children: "·"
                        }, void 0, false, {
                            fileName: "[project]/src/components/form/RegistrationForm.jsx",
                            lineNumber: 137,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/form/RegistrationForm.jsx",
                    lineNumber: 133,
                    columnNumber: 11
                }, this) : 'Submit Registration'
            }, void 0, false, {
                fileName: "[project]/src/components/form/RegistrationForm.jsx",
                lineNumber: 131,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/form/RegistrationForm.jsx",
        lineNumber: 83,
        columnNumber: 5
    }, this);
}
_s(RegistrationForm, "p/4Kvnk7O4LhtNQshOYVRzqqo1k=");
_c = RegistrationForm;
var _c;
__turbopack_context__.k.register(_c, "RegistrationForm");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/ui/ErrorBanner.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Displays an error message in a prominent banner.
 * @param {{ message: string }} props
 */ __turbopack_context__.s([
    "default",
    ()=>ErrorBanner
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
;
function ErrorBanner({ message }) {
    if (!message) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "error-banner",
        role: "alert",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            className: "error-banner-message",
            children: message
        }, void 0, false, {
            fileName: "[project]/src/components/ui/ErrorBanner.jsx",
            lineNumber: 11,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/ui/ErrorBanner.jsx",
        lineNumber: 10,
        columnNumber: 5
    }, this);
}
_c = ErrorBanner;
var _c;
__turbopack_context__.k.register(_c, "ErrorBanner");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/firebase/firebaseConfig.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "db",
    ()=>db,
    "storage",
    ()=>storage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/app/dist/esm/index.esm.js [client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/app/dist/esm/index.esm.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/firestore/dist/esm/index.esm.js [client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/index.esm.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$storage$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/storage/dist/esm/index.esm.js [client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/storage/dist/index.esm.js [client] (ecmascript)");
;
;
;
const firebaseConfig = {
    apiKey: ("TURBOPACK compile-time value", "AIzaSyCGdEbTDPAfVJISaWHO0hHt5V7xmYQ_gpk"),
    authDomain: ("TURBOPACK compile-time value", "subs-ams.firebaseapp.com"),
    projectId: ("TURBOPACK compile-time value", "subs-ams"),
    storageBucket: ("TURBOPACK compile-time value", "subs-ams.firebasestorage.app"),
    messagingSenderId: ("TURBOPACK compile-time value", "163579372402"),
    appId: ("TURBOPACK compile-time value", "1:163579372402:web:19e7f57dc9a23cd72b73eb")
};
const app = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getApps"])().length === 0 ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["initializeApp"])(firebaseConfig) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getApps"])()[0];
const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getFirestore"])(app);
const storage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getStorage"])(app);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/firebase/firestoreService.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "checkDuplicateHandle",
    ()=>checkDuplicateHandle,
    "checkRateLimit",
    ()=>checkRateLimit,
    "submitRegistration",
    ()=>submitRegistration
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firebaseConfig$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/firebase/firebaseConfig.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/firestore/dist/esm/index.esm.js [client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/index.esm.js [client] (ecmascript)");
;
;
async function checkDuplicateHandle(cfHandle, ccHandle) {
    try {
        const registrationsRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firebaseConfig$2e$js__$5b$client$5d$__$28$ecmascript$29$__["db"], 'registrants');
        const cfQuery = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["query"])(registrationsRef, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["where"])('codeforcesHandle', '==', cfHandle));
        const cfSnapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getDocs"])(cfQuery);
        if (!cfSnapshot.empty) {
            return {
                duplicate: true,
                error: 'This Codeforces handle is already registered'
            };
        }
        const ccQuery = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["query"])(registrationsRef, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["where"])('codechefHandle', '==', ccHandle));
        const ccSnapshot = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getDocs"])(ccQuery);
        if (!ccSnapshot.empty) {
            return {
                duplicate: true,
                error: 'This CodeChef handle is already registered'
            };
        }
        return {
            duplicate: false
        };
    } catch (error) {
        return {
            duplicate: false,
            error: error.message
        };
    }
}
async function submitRegistration(data) {
    try {
        const docRef = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firebaseConfig$2e$js__$5b$client$5d$__$28$ecmascript$29$__["db"], 'registrants'), {
            name: data.name,
            institution: data.institution,
            codeforcesHandle: data.codeforcesHandle,
            codechefHandle: data.codechefHandle,
            idDocumentUrl: data.idDocumentUrl,
            idDocumentFileName: data.idDocumentFileName,
            ipHash: data.ipHash,
            submittedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["serverTimestamp"])()
        });
        return {
            success: true,
            id: docRef.id
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
async function checkRateLimit(hashedIp) {
    try {
        const rateLimitRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firebaseConfig$2e$js__$5b$client$5d$__$28$ecmascript$29$__["db"], '_rate_limits', hashedIp);
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const result = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["runTransaction"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firebaseConfig$2e$js__$5b$client$5d$__$28$ecmascript$29$__["db"], async (transaction)=>{
            const rateLimitDoc = await transaction.get(rateLimitRef);
            let timestamps = [];
            if (rateLimitDoc.exists()) {
                timestamps = rateLimitDoc.data().timestamps || [];
            }
            // Filter to only timestamps within the last hour
            const recentTimestamps = timestamps.filter((ts)=>ts > oneHourAgo);
            if (recentTimestamps.length >= 3) {
                return {
                    allowed: false
                };
            }
            // Add current timestamp and update
            recentTimestamps.push(Date.now());
            transaction.set(rateLimitRef, {
                timestamps: recentTimestamps
            });
            return {
                allowed: true
            };
        });
        return result;
    } catch (error) {
        return {
            allowed: false,
            error: error.message
        };
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/firebase/storageService.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getFileUrl",
    ()=>getFileUrl,
    "uploadFile",
    ()=>uploadFile
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firebaseConfig$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/firebase/firebaseConfig.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$storage$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/storage/dist/esm/index.esm.js [client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@firebase/storage/dist/index.esm.js [client] (ecmascript)");
;
;
async function uploadFile(file, path) {
    try {
        const storageRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firebaseConfig$2e$js__$5b$client$5d$__$28$ecmascript$29$__["storage"], path);
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["uploadBytes"])(storageRef, file);
        const url = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getDownloadURL"])(storageRef);
        return {
            success: true,
            url
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
async function getFileUrl(path) {
    try {
        const storageRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firebaseConfig$2e$js__$5b$client$5d$__$28$ecmascript$29$__["storage"], path);
        const url = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$storage$2f$dist$2f$index$2e$esm$2e$js__$5b$client$5d$__$28$ecmascript$29$__["getDownloadURL"])(storageRef);
        return {
            success: true,
            url
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/rateLimit.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "checkRateLimit",
    ()=>checkRateLimit
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firestoreService$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/firebase/firestoreService.js [client] (ecmascript)");
;
async function checkRateLimit(hashedIp) {
    if (!hashedIp) {
        return {
            allowed: false,
            error: 'Missing IP hash'
        };
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firestoreService$2e$js__$5b$client$5d$__$28$ecmascript$29$__["checkRateLimit"])(hashedIp);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/utils/hashIp.js [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Hash an IP address using SHA-256 via the Web Crypto API.
 * @param {string} ip - The raw IP address string.
 * @returns {Promise<string>} Hex-encoded SHA-256 hash.
 */ __turbopack_context__.s([
    "hashIp",
    ()=>hashIp
]);
async function hashIp(ip) {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b)=>b.toString(16).padStart(2, '0')).join('');
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/pages/register.jsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Register
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$head$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/head.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$RegistrationForm$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/form/RegistrationForm.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$ErrorBanner$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/ErrorBanner.jsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firestoreService$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/firebase/firestoreService.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$storageService$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/firebase/storageService.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$rateLimit$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/rateLimit.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$hashIp$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/hashIp.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
;
;
;
;
// April 20, 2025 00:00 IST = April 19, 2025 18:30 UTC
const REGISTRATION_OPENS = new Date('2025-04-19T18:30:00Z');
const TIMEOUT_MS = 50000;
function withTimeout(promise, ms = TIMEOUT_MS) {
    return Promise.race([
        promise,
        new Promise((_, reject)=>setTimeout(()=>reject(new Error('Request timed out. Please try again.')), ms))
    ]);
}
function Register() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('idle'); // idle | submitting | success | error
    const [errorMessage, setErrorMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [submittedName, setSubmittedName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    // Date gate — redirect before registration opens
    // In production, add server-side check via getServerSideProps
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Register.useEffect": ()=>{
            if (Date.now() < REGISTRATION_OPENS.getTime()) {
                router.replace('/');
            }
        }
    }["Register.useEffect"], [
        router
    ]);
    async function handleSubmit(data, setFieldErrors) {
        setStatus('submitting');
        setErrorMessage('');
        try {
            // Step 1: Check for duplicate handles
            const dupResult = await withTimeout((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firestoreService$2e$js__$5b$client$5d$__$28$ecmascript$29$__["checkDuplicateHandle"])(data.cfHandle.trim(), data.ccHandle.trim()));
            if (dupResult.duplicate) {
                setStatus('error');
                setErrorMessage(dupResult.error || 'A registration with this handle already exists.');
                return;
            }
            if (dupResult.error) {
                setStatus('error');
                setErrorMessage(dupResult.error);
                return;
            }
            // Step 2: Upload ID document
            const sanitizedName = data.name.trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const storagePath = `registrants/${Date.now()}_${sanitizedName}_${data.file.name}`;
            const uploadResult = await withTimeout((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$storageService$2e$js__$5b$client$5d$__$28$ecmascript$29$__["uploadFile"])(data.file, storagePath));
            if (!uploadResult.success) {
                setStatus('error');
                setErrorMessage(uploadResult.error || 'Failed to upload document. Please try again.');
                return;
            }
            // Step 3: Get IP and hash it (graceful fallback)
            let ipHash = 'unknown';
            try {
                const ipRes = await fetch('/api/get-ip');
                const ipData = await ipRes.json();
                if (ipData.ip) {
                    ipHash = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$hashIp$2e$js__$5b$client$5d$__$28$ecmascript$29$__["hashIp"])(ipData.ip);
                }
            } catch  {
            // Graceful fallback — proceed with 'unknown'
            }
            // Step 4: Check rate limit
            const rateResult = await withTimeout((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$rateLimit$2e$js__$5b$client$5d$__$28$ecmascript$29$__["checkRateLimit"])(ipHash));
            if (!rateResult.allowed) {
                setStatus('error');
                setErrorMessage(rateResult.error || 'Too many submissions. Please try again later.');
                return;
            }
            // Step 5: Submit registration to Firestore
            const regResult = await withTimeout((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firestoreService$2e$js__$5b$client$5d$__$28$ecmascript$29$__["submitRegistration"])({
                name: data.name.trim(),
                institution: data.institution.trim(),
                codeforcesHandle: data.cfHandle.trim(),
                codechefHandle: data.ccHandle.trim(),
                idDocumentUrl: uploadResult.url,
                idDocumentFileName: data.file.name,
                ipHash
            }));
            if (!regResult.success) {
                setStatus('error');
                setErrorMessage(regResult.error || 'Registration failed. Please try again.');
                return;
            }
            setSubmittedName(data.name.trim());
            setStatus('success');
        } catch (err) {
            setStatus('error');
            setErrorMessage(err.message || 'Something went wrong. Please try again.');
        }
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$head$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("title", {
                        children: "Register — AMS-DERIVE"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/register.jsx",
                        lineNumber: 114,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meta", {
                        name: "description",
                        content: "Register for the AMS-DERIVE competitive programming contest."
                    }, void 0, false, {
                        fileName: "[project]/src/pages/register.jsx",
                        lineNumber: 115,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meta", {
                        name: "viewport",
                        content: "width=device-width, initial-scale=1"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/register.jsx",
                        lineNumber: 116,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/register.jsx",
                lineNumber: 113,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "register-main",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "register-container",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "register-wordmark",
                            children: "AMS DERIVE"
                        }, void 0, false, {
                            fileName: "[project]/src/pages/register.jsx",
                            lineNumber: 121,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "register-subtitle",
                            children: "REGISTRATION"
                        }, void 0, false, {
                            fileName: "[project]/src/pages/register.jsx",
                            lineNumber: 122,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("hr", {
                            className: "register-divider"
                        }, void 0, false, {
                            fileName: "[project]/src/pages/register.jsx",
                            lineNumber: 123,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "register-accent-line"
                        }, void 0, false, {
                            fileName: "[project]/src/pages/register.jsx",
                            lineNumber: 124,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "register-content",
                            children: [
                                status === 'error' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$ErrorBanner$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                    message: errorMessage
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/register.jsx",
                                    lineNumber: 127,
                                    columnNumber: 36
                                }, this),
                                status === 'success' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "register-success",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "register-success-checkmark",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                width: "32",
                                                height: "32",
                                                viewBox: "0 0 32 32",
                                                fill: "none",
                                                "aria-hidden": "true",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                        cx: "16",
                                                        cy: "16",
                                                        r: "16",
                                                        fill: "#c9a84c"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/pages/register.jsx",
                                                        lineNumber: 138,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        d: "M9 16.5l5 5 9-9",
                                                        stroke: "#0a0a0a",
                                                        strokeWidth: "2.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/pages/register.jsx",
                                                        lineNumber: 139,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/pages/register.jsx",
                                                lineNumber: 131,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/register.jsx",
                                            lineNumber: 130,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "register-success-title",
                                            children: "Registration Received"
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/register.jsx",
                                            lineNumber: 148,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "register-success-name",
                                            children: submittedName
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/register.jsx",
                                            lineNumber: 149,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "register-success-message",
                                            children: "We'll reach out before the event."
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/register.jsx",
                                            lineNumber: 150,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/register.jsx",
                                    lineNumber: 129,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$RegistrationForm$2e$jsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                    onSubmit: handleSubmit,
                                    loading: status === 'submitting'
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/register.jsx",
                                    lineNumber: 155,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/pages/register.jsx",
                            lineNumber: 126,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/pages/register.jsx",
                    lineNumber: 119,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/pages/register.jsx",
                lineNumber: 118,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_s(Register, "1PWUyf5eJo6BC+ZnF5dMFT3wDlI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = Register;
var _c;
__turbopack_context__.k.register(_c, "Register");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/src/pages/register.jsx [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/register";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/src/pages/register.jsx [client] (ecmascript)");
    }
]);
// @ts-expect-error module.hot exists
if (module.hot) {
    // @ts-expect-error module.hot exists
    module.hot.dispose(function() {
        window.__NEXT_P.push([
            PAGE_PATH
        ]);
    });
}
}),
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/src/pages/register\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/src/pages/register.jsx [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__3474af30._.js.map
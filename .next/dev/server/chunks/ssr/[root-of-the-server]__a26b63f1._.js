module.exports = [
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/stream [external] (stream, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("stream", () => require("stream"));

module.exports = mod;
}),
"[externals]/zlib [external] (zlib, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("zlib", () => require("zlib"));

module.exports = mod;
}),
"[externals]/react-dom [external] (react-dom, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("react-dom", () => require("react-dom"));

module.exports = mod;
}),
"[project]/src/components/form/TextInput.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * A labelled text input field with optional hint and error display.
 * @param {{ label: string, name: string, value: string, onChange: Function, error?: string, placeholder?: string, required?: boolean, hint?: string }} props
 */ __turbopack_context__.s([
    "default",
    ()=>TextInput
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
;
function TextInput({ label, name, value = '', onChange, error = '', placeholder = '', required = false, hint = '' }) {
    const describedBy = error ? `${name}-error` : hint ? `${name}-hint` : undefined;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "text-input-field",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                htmlFor: name,
                className: "text-input-label",
                children: [
                    label,
                    required && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
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
            hint && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                id: `${name}-hint`,
                className: "text-input-hint",
                children: hint
            }, void 0, false, {
                fileName: "[project]/src/components/form/TextInput.jsx",
                lineNumber: 29,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
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
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
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
}),
"[project]/src/components/form/FileUpload.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FileUpload
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
;
;
function FileUpload({ label, name, accept = '', onFileSelect, error = '', file = null, required = false }) {
    const inputRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useRef"])(null);
    const [dragging, setDragging] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [previewUrl, setPreviewUrl] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            return ()=>URL.revokeObjectURL(url);
        }
        setPreviewUrl(null);
    }, [
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "file-upload-field",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("label", {
                className: "file-upload-label",
                children: [
                    label,
                    required && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                className: "file-upload-subtext",
                children: "to verify institution"
            }, void 0, false, {
                fileName: "[project]/src/components/form/FileUpload.jsx",
                lineNumber: 83,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("button", {
                type: "button",
                className: dropzoneClasses,
                onClick: handleClick,
                onDragOver: handleDragOver,
                onDragLeave: handleDragLeave,
                onDrop: handleDrop,
                "aria-describedby": error ? `${name}-error` : undefined,
                children: file ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "file-upload-selected",
                    children: [
                        previewUrl && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("img", {
                            src: previewUrl,
                            alt: "Preview",
                            className: "file-upload-preview"
                        }, void 0, false, {
                            fileName: "[project]/src/components/form/FileUpload.jsx",
                            lineNumber: 96,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "file-upload-info",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                                    className: "file-upload-filename",
                                    children: file.name
                                }, void 0, false, {
                                    fileName: "[project]/src/components/form/FileUpload.jsx",
                                    lineNumber: 103,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
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
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                            className: "file-upload-remove",
                            role: "button",
                            tabIndex: 0,
                            "aria-label": "Remove file",
                            onClick: (e)=>{
                                e.stopPropagation();
                                if (onFileSelect) onFileSelect(null);
                                if (inputRef.current) inputRef.current.value = '';
                            },
                            onKeyDown: (e)=>{
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.stopPropagation();
                                    if (onFileSelect) onFileSelect(null);
                                    if (inputRef.current) inputRef.current.value = '';
                                }
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                width: "14",
                                height: "14",
                                viewBox: "0 0 14 14",
                                fill: "none",
                                "aria-hidden": "true",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                    d: "M1 1l12 12M13 1L1 13",
                                    stroke: "#c9a84c",
                                    strokeWidth: "1.5",
                                    strokeLinecap: "round"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/form/FileUpload.jsx",
                                    lineNumber: 125,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/form/FileUpload.jsx",
                                lineNumber: 124,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/form/FileUpload.jsx",
                            lineNumber: 106,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/form/FileUpload.jsx",
                    lineNumber: 94,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "file-upload-empty",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                            className: "file-upload-prompt",
                            children: "Click to upload or drag and drop"
                        }, void 0, false, {
                            fileName: "[project]/src/components/form/FileUpload.jsx",
                            lineNumber: 131,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                            className: "file-upload-formats",
                            children: "JPG, PNG or PDF · Max 5MB"
                        }, void 0, false, {
                            fileName: "[project]/src/components/form/FileUpload.jsx",
                            lineNumber: 132,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/form/FileUpload.jsx",
                    lineNumber: 130,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/form/FileUpload.jsx",
                lineNumber: 84,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("input", {
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
                lineNumber: 136,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                id: `${name}-error`,
                className: "file-upload-error-msg",
                role: "alert",
                children: error
            }, void 0, false, {
                fileName: "[project]/src/components/form/FileUpload.jsx",
                lineNumber: 148,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/form/FileUpload.jsx",
        lineNumber: 78,
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
"[project]/src/utils/validators.js [ssr] (ecmascript)", ((__turbopack_context__) => {
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
}),
"[project]/src/utils/fileValidation.js [ssr] (ecmascript)", ((__turbopack_context__) => {
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
}),
"[project]/src/components/form/RegistrationForm.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>RegistrationForm
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$TextInput$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/form/TextInput.jsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$FileUpload$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/form/FileUpload.jsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$Button$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/Button.jsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validators$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/validators.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$fileValidation$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/fileValidation.js [ssr] (ecmascript)");
;
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
    const [fields, setFields] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])({
        name: '',
        institution: '',
        cfHandle: '',
        ccHandle: ''
    });
    const [file, setFile] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(null);
    const [errors, setErrors] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])({});
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
        const nameResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validators$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["validateName"])(fields.name);
        if (!nameResult.valid) newErrors.name = nameResult.error;
        const instResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validators$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["validateInstitution"])(fields.institution);
        if (!instResult.valid) newErrors.institution = instResult.error;
        const cfResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validators$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["validateCodeforcesHandle"])(fields.cfHandle);
        if (!cfResult.valid) newErrors.cfHandle = cfResult.error;
        const ccResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$validators$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["validateCodechefHandle"])(fields.ccHandle);
        if (!ccResult.valid) newErrors.ccHandle = ccResult.error;
        if (!file) {
            newErrors.file = 'ID card is required';
        } else {
            const typeResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$fileValidation$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["validateFileType"])(file, ALLOWED_TYPES);
            if (!typeResult.valid) {
                newErrors.file = typeResult.error;
            } else {
                const sizeResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$fileValidation$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["validateFileSize"])(file, MAX_FILE_SIZE);
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("form", {
        className: "registration-form",
        onSubmit: handleSubmit,
        noValidate: true,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$TextInput$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$TextInput$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$TextInput$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$TextInput$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$FileUpload$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$Button$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                type: "submit",
                disabled: loading,
                children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                    className: "submit-loading",
                    children: [
                        "Submitting",
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                            className: "submit-dot submit-dot-1",
                            children: "·"
                        }, void 0, false, {
                            fileName: "[project]/src/components/form/RegistrationForm.jsx",
                            lineNumber: 135,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                            className: "submit-dot submit-dot-2",
                            children: "·"
                        }, void 0, false, {
                            fileName: "[project]/src/components/form/RegistrationForm.jsx",
                            lineNumber: 136,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
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
}),
"[project]/src/components/ui/ErrorBanner.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Displays an error message in a prominent banner.
 * @param {{ message: string }} props
 */ __turbopack_context__.s([
    "default",
    ()=>ErrorBanner
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
;
function ErrorBanner({ message }) {
    if (!message) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "error-banner",
        role: "alert",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
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
}),
"[project]/src/firebase/firebaseConfig.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "db",
    ()=>db,
    "storage",
    ()=>storage
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$app__$5b$external$5d$__$28$firebase$2f$app$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__ = __turbopack_context__.i("[externals]/firebase/app [external] (firebase/app, esm_import, [project]/node_modules/firebase)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__ = __turbopack_context__.i("[externals]/firebase/firestore [external] (firebase/firestore, esm_import, [project]/node_modules/firebase)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$storage__$5b$external$5d$__$28$firebase$2f$storage$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__ = __turbopack_context__.i("[externals]/firebase/storage [external] (firebase/storage, esm_import, [project]/node_modules/firebase)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$app__$5b$external$5d$__$28$firebase$2f$app$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$storage__$5b$external$5d$__$28$firebase$2f$storage$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$app__$5b$external$5d$__$28$firebase$2f$app$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$storage__$5b$external$5d$__$28$firebase$2f$storage$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};
const app = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$app__$5b$external$5d$__$28$firebase$2f$app$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["getApps"])().length === 0 ? (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$app__$5b$external$5d$__$28$firebase$2f$app$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["initializeApp"])(firebaseConfig) : (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$app__$5b$external$5d$__$28$firebase$2f$app$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["getApps"])()[0];
const db = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["getFirestore"])(app);
const storage = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$storage__$5b$external$5d$__$28$firebase$2f$storage$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["getStorage"])(app);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/firebase/firestoreService.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "checkDuplicateHandle",
    ()=>checkDuplicateHandle,
    "checkRateLimit",
    ()=>checkRateLimit,
    "submitRegistration",
    ()=>submitRegistration
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firebaseConfig$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/firebase/firebaseConfig.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__ = __turbopack_context__.i("[externals]/firebase/firestore [external] (firebase/firestore, esm_import, [project]/node_modules/firebase)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firebaseConfig$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firebaseConfig$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
async function checkDuplicateHandle(cfHandle, ccHandle) {
    try {
        const registrationsRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firebaseConfig$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["db"], 'registrants');
        const cfQuery = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["query"])(registrationsRef, (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["where"])('codeforcesHandle', '==', cfHandle));
        const ccQuery = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["query"])(registrationsRef, (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["where"])('codechefHandle', '==', ccHandle));
        // Parallelize queries to reduce latency
        const [cfSnapshot, ccSnapshot] = await Promise.all([
            (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["getDocs"])(cfQuery),
            (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["getDocs"])(ccQuery)
        ]);
        if (!cfSnapshot.empty) {
            return {
                duplicate: true,
                error: 'This Codeforces handle is already registered'
            };
        }
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
        const docRef = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["addDoc"])((0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firebaseConfig$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["db"], 'registrants'), {
            name: data.name,
            institution: data.institution,
            codeforcesHandle: data.codeforcesHandle,
            codechefHandle: data.codechefHandle,
            idDocumentUrl: data.idDocumentUrl,
            idDocumentFileName: data.idDocumentFileName,
            ipHash: data.ipHash,
            submittedAt: (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["serverTimestamp"])()
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
        const rateLimitRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firebaseConfig$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["db"], '_rate_limits', hashedIp);
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        const result = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$firestore__$5b$external$5d$__$28$firebase$2f$firestore$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["runTransaction"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firebaseConfig$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["db"], async (transaction)=>{
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
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/firebase/storageService.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "getFileUrl",
    ()=>getFileUrl,
    "uploadFile",
    ()=>uploadFile
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firebaseConfig$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/firebase/firebaseConfig.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$storage__$5b$external$5d$__$28$firebase$2f$storage$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__ = __turbopack_context__.i("[externals]/firebase/storage [external] (firebase/storage, esm_import, [project]/node_modules/firebase)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firebaseConfig$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$storage__$5b$external$5d$__$28$firebase$2f$storage$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firebaseConfig$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$storage__$5b$external$5d$__$28$firebase$2f$storage$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
async function uploadFile(file, path) {
    try {
        const storageRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$storage__$5b$external$5d$__$28$firebase$2f$storage$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firebaseConfig$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["storage"], path);
        await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$storage__$5b$external$5d$__$28$firebase$2f$storage$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["uploadBytes"])(storageRef, file);
        const url = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$storage__$5b$external$5d$__$28$firebase$2f$storage$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["getDownloadURL"])(storageRef);
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
        const storageRef = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$storage__$5b$external$5d$__$28$firebase$2f$storage$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["ref"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firebaseConfig$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["storage"], path);
        const url = await (0, __TURBOPACK__imported__module__$5b$externals$5d2f$firebase$2f$storage__$5b$external$5d$__$28$firebase$2f$storage$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$firebase$29$__["getDownloadURL"])(storageRef);
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
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/utils/rateLimit.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "checkRateLimit",
    ()=>checkRateLimit
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firestoreService$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/firebase/firestoreService.js [ssr] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firestoreService$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firestoreService$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
async function checkRateLimit(hashedIp) {
    if (!hashedIp) {
        return {
            allowed: false,
            error: 'Missing IP hash'
        };
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firestoreService$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["checkRateLimit"])(hashedIp);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/src/utils/hashIp.js [ssr] (ecmascript)", ((__turbopack_context__) => {
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
}),
"[project]/src/utils/performanceLogger.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
/**
 * Lightweight performance logging utility.
 * Used internally to detect slow components and API calls.
 */ const isDev = ("TURBOPACK compile-time value", "development") === 'development';
const PerformanceLogger = {
    /**
   * Log the duration of an asynchronous operation.
   * @param {string} name - Name of the operation.
   * @param {number} duration - Duration in milliseconds.
   */ logDuration: (name, duration)=>{
        if ("TURBOPACK compile-time truthy", 1) {
            const color = duration > 1000 ? '\x1b[31m' : duration > 500 ? '\x1b[33m' : '\x1b[32m';
            console.log(`[PERF] ${name}: ${color}${duration.toFixed(2)}ms\x1b[0m`);
        }
    },
    /**
   * Monitor a promise and log its duration.
   * @param {string} name - Name of the operation.
   * @param {Promise} promise - The promise to monitor.
   * @returns {Promise} - The original promise.
   */ monitor: async (name, promise)=>{
        const start = performance.now();
        try {
            const result = await promise;
            const end = performance.now();
            PerformanceLogger.logDuration(name, end - start);
            return result;
        } catch (error) {
            const end = performance.now();
            PerformanceLogger.logDuration(`${name} (FAILED)`, end - start);
            throw error;
        }
    },
    /**
   * Hook for measuring component mount time.
   * @param {string} componentName 
   */ useTraceUpdate: (componentName)=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        const start = performance.now();
        // Simplified trace - can be expanded to track re-renders
        console.log(`[PERF] ${componentName} mounted in ${(performance.now() - start).toFixed(2)}ms`);
    }
};
const __TURBOPACK__default__export__ = PerformanceLogger;
}),
"[project]/src/pages/register.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>Register
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$head$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/head.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$RegistrationForm$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/form/RegistrationForm.jsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$ErrorBanner$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/ErrorBanner.jsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firestoreService$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/firebase/firestoreService.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$storageService$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/firebase/storageService.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$rateLimit$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/rateLimit.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$hashIp$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/hashIp.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$performanceLogger$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/performanceLogger.js [ssr] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firestoreService$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$storageService$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$rateLimit$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firestoreService$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$storageService$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$rateLimit$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
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
// April 20, 2026 00:00 IST = April 19, 2026 18:30 UTC
const REGISTRATION_OPENS = new Date('2026-04-19T18:30:00Z');
const TIMEOUT_MS = 50000;
function withTimeout(promise, ms = TIMEOUT_MS) {
    return Promise.race([
        promise,
        new Promise((_, reject)=>setTimeout(()=>reject(new Error('Request timed out. Please try again.')), ms))
    ]);
}
function Register() {
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["useRouter"])();
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('idle'); // idle | submitting | success | error
    const [errorMessage, setErrorMessage] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    const [submittedName, setSubmittedName] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    // Monitoring component mount
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$performanceLogger$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"].logDuration('Register Page Mount', 0); // Simplified tracking
    }, []);
    // Date gate — redirect before registration opens
    // In production, add server-side check via getServerSideProps
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (Date.now() < REGISTRATION_OPENS.getTime()) {
            router.replace('/');
        }
    }, [
        router
    ]);
    async function handleSubmit(data, setFieldErrors) {
        setStatus('submitting');
        setErrorMessage('');
        try {
            // Step 1: Trigger independent tasks in parallel
            const sanitizedName = data.name.trim().replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
            const storagePath = `registrants/${Date.now()}_${sanitizedName}_${data.file.name}`;
            // Start checkDuplicateHandle, uploadFile, and IP retrieval concurrently
            const [dupResult, uploadResult, ipHash] = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$performanceLogger$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"].monitor('Registration Pre-checks (Parallel)', Promise.all([
                withTimeout((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firestoreService$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["checkDuplicateHandle"])(data.cfHandle.trim(), data.ccHandle.trim())),
                withTimeout((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$storageService$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["uploadFile"])(data.file, storagePath)),
                (async ()=>{
                    try {
                        const ipRes = await fetch('/api/get-ip');
                        const ipData = await ipRes.json();
                        if (ipData.ip) {
                            return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$hashIp$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["hashIp"])(ipData.ip);
                        }
                    } catch  {
                        return 'unknown';
                    }
                    return 'unknown';
                })()
            ]));
            // Handle duplicate check result
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
            // Handle file upload result
            if (!uploadResult.success) {
                setStatus('error');
                setErrorMessage(uploadResult.error || 'Failed to upload document. Please try again.');
                return;
            }
            // Step 2: Check rate limit (depends on ipHash)
            const rateResult = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$performanceLogger$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"].monitor('Rate Limit Check', withTimeout((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$rateLimit$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["checkRateLimit"])(ipHash)));
            if (!rateResult.allowed) {
                setStatus('error');
                setErrorMessage(rateResult.error || 'Too many submissions. Please try again later.');
                return;
            }
            // Step 3: Submit registration to Firestore
            const regResult = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$performanceLogger$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"].monitor('Firestore Submission', withTimeout((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$firebase$2f$firestoreService$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["submitRegistration"])({
                name: data.name.trim(),
                institution: data.institution.trim(),
                codeforcesHandle: data.cfHandle.trim(),
                codechefHandle: data.ccHandle.trim(),
                idDocumentUrl: uploadResult.url,
                idDocumentFileName: data.file.name,
                ipHash
            })));
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$head$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("title", {
                        children: "Register — AMS-DERIVE"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/register.jsx",
                        lineNumber: 128,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("meta", {
                        name: "description",
                        content: "Register for the AMS-DERIVE competitive programming contest."
                    }, void 0, false, {
                        fileName: "[project]/src/pages/register.jsx",
                        lineNumber: 129,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("meta", {
                        name: "viewport",
                        content: "width=device-width, initial-scale=1"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/register.jsx",
                        lineNumber: 130,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/register.jsx",
                lineNumber: 127,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("main", {
                className: "register-main",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "register-container",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                            className: "register-wordmark",
                            children: "AMS DERIVE"
                        }, void 0, false, {
                            fileName: "[project]/src/pages/register.jsx",
                            lineNumber: 135,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                            className: "register-subtitle",
                            children: "REGISTRATION"
                        }, void 0, false, {
                            fileName: "[project]/src/pages/register.jsx",
                            lineNumber: 136,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("hr", {
                            className: "register-divider"
                        }, void 0, false, {
                            fileName: "[project]/src/pages/register.jsx",
                            lineNumber: 137,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                            className: "register-accent-line"
                        }, void 0, false, {
                            fileName: "[project]/src/pages/register.jsx",
                            lineNumber: 138,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                            className: "register-content",
                            children: [
                                status === 'error' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$ErrorBanner$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    message: errorMessage
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/register.jsx",
                                    lineNumber: 141,
                                    columnNumber: 36
                                }, this),
                                status === 'success' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                    className: "register-success",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                                            className: "register-success-checkmark",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                                                width: "32",
                                                height: "32",
                                                viewBox: "0 0 32 32",
                                                fill: "none",
                                                "aria-hidden": "true",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("circle", {
                                                        cx: "16",
                                                        cy: "16",
                                                        r: "16",
                                                        fill: "#c9a84c"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/pages/register.jsx",
                                                        lineNumber: 152,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
                                                        d: "M9 16.5l5 5 9-9",
                                                        stroke: "#0a0a0a",
                                                        strokeWidth: "2.5",
                                                        strokeLinecap: "round",
                                                        strokeLinejoin: "round"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/pages/register.jsx",
                                                        lineNumber: 153,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/pages/register.jsx",
                                                lineNumber: 145,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/register.jsx",
                                            lineNumber: 144,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                                            className: "register-success-title",
                                            children: "Registration Received"
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/register.jsx",
                                            lineNumber: 162,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                            className: "register-success-name",
                                            children: submittedName
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/register.jsx",
                                            lineNumber: 163,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                                            className: "register-success-message",
                                            children: "We'll reach out before the event."
                                        }, void 0, false, {
                                            fileName: "[project]/src/pages/register.jsx",
                                            lineNumber: 164,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/pages/register.jsx",
                                    lineNumber: 143,
                                    columnNumber: 15
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$RegistrationForm$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                    onSubmit: handleSubmit,
                                    loading: status === 'submitting'
                                }, void 0, false, {
                                    fileName: "[project]/src/pages/register.jsx",
                                    lineNumber: 169,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/pages/register.jsx",
                            lineNumber: 140,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/pages/register.jsx",
                    lineNumber: 133,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/pages/register.jsx",
                lineNumber: 132,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__a26b63f1._.js.map
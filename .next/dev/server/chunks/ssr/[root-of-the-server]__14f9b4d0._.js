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
                children: "Photo of your student ID or government ID"
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
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("svg", {
                            className: "file-upload-checkmark",
                            width: "24",
                            height: "24",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            "aria-hidden": "true",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("circle", {
                                    cx: "12",
                                    cy: "12",
                                    r: "12",
                                    fill: "#c9a84c"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/form/FileUpload.jsx",
                                    lineNumber: 114,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("path", {
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
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                    className: "file-upload-empty",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
                            className: "file-upload-prompt",
                            children: "Click to upload or drag and drop"
                        }, void 0, false, {
                            fileName: "[project]/src/components/form/FileUpload.jsx",
                            lineNumber: 126,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("span", {
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
                lineNumber: 131,
                columnNumber: 7
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
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
;
;
;
;
;
function RegistrationForm({ onSubmit, loading = false }) {
    const [fields, setFields] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])({
        name: '',
        institution: '',
        handle: ''
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
    function handleFileChange(e) {
        const selected = e.target.files?.[0] || null;
        setFile(selected);
        if (errors.file) {
            setErrors((prev)=>({
                    ...prev,
                    file: ''
                }));
        }
    }
    function handleSubmit(e) {
        e.preventDefault();
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
                placeholder: "Enter your full name",
                required: true
            }, void 0, false, {
                fileName: "[project]/src/components/form/RegistrationForm.jsx",
                lineNumber: 44,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$TextInput$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                label: "Institution",
                name: "institution",
                value: fields.institution,
                onChange: handleChange,
                error: errors.institution,
                placeholder: "University or organization",
                required: true
            }, void 0, false, {
                fileName: "[project]/src/components/form/RegistrationForm.jsx",
                lineNumber: 53,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$TextInput$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                label: "Handle",
                name: "handle",
                value: fields.handle,
                onChange: handleChange,
                error: errors.handle,
                placeholder: "Codeforces / AtCoder handle",
                required: true
            }, void 0, false, {
                fileName: "[project]/src/components/form/RegistrationForm.jsx",
                lineNumber: 62,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$FileUpload$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                label: "Upload Screenshot",
                name: "file",
                accept: "image/png,image/jpeg,application/pdf",
                onChange: handleFileChange,
                error: errors.file,
                fileName: file?.name
            }, void 0, false, {
                fileName: "[project]/src/components/form/RegistrationForm.jsx",
                lineNumber: 71,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$Button$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                type: "submit",
                disabled: loading,
                children: loading ? 'Submitting...' : 'Register'
            }, void 0, false, {
                fileName: "[project]/src/components/form/RegistrationForm.jsx",
                lineNumber: 79,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/form/RegistrationForm.jsx",
        lineNumber: 43,
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
"[project]/src/components/ui/SuccessState.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Displays a success confirmation after registration.
 * @param {{ heading?: string, message?: string }} props
 */ __turbopack_context__.s([
    "default",
    ()=>SuccessState
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
;
function SuccessState({ heading = 'Registration Complete', message = 'You have been successfully registered for the contest.' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        className: "success-state",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                className: "success-state-heading",
                children: heading
            }, void 0, false, {
                fileName: "[project]/src/components/ui/SuccessState.jsx",
                lineNumber: 12,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                className: "success-state-message",
                children: message
            }, void 0, false, {
                fileName: "[project]/src/components/ui/SuccessState.jsx",
                lineNumber: 13,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui/SuccessState.jsx",
        lineNumber: 11,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/pages/register.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Register
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$head$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/head.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Wordmark$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/layout/Wordmark.jsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$RegistrationForm$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/form/RegistrationForm.jsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$ErrorBanner$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/ErrorBanner.jsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SuccessState$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/SuccessState.jsx [ssr] (ecmascript)");
;
;
;
;
;
;
;
function Register() {
    const [status, setStatus] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('idle'); // idle | loading | success | error
    const [errorMessage, setErrorMessage] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('');
    async function handleSubmit(data, setFieldErrors) {
        setStatus('loading');
        setErrorMessage('');
        try {
            // TODO: validate fields, upload file, submit registration
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
                        lineNumber: 28,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("meta", {
                        name: "description",
                        content: "Register for the AMS-DERIVE competitive programming contest."
                    }, void 0, false, {
                        fileName: "[project]/src/pages/register.jsx",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("meta", {
                        name: "viewport",
                        content: "width=device-width, initial-scale=1"
                    }, void 0, false, {
                        fileName: "[project]/src/pages/register.jsx",
                        lineNumber: 30,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/register.jsx",
                lineNumber: 27,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("main", {
                className: "register-main",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "register-header",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$layout$2f$Wordmark$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                            size: "sm"
                        }, void 0, false, {
                            fileName: "[project]/src/pages/register.jsx",
                            lineNumber: 34,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/pages/register.jsx",
                        lineNumber: 33,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                        className: "register-content",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h2", {
                                className: "register-title",
                                children: "Registration"
                            }, void 0, false, {
                                fileName: "[project]/src/pages/register.jsx",
                                lineNumber: 37,
                                columnNumber: 11
                            }, this),
                            status === 'error' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$ErrorBanner$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                message: errorMessage
                            }, void 0, false, {
                                fileName: "[project]/src/pages/register.jsx",
                                lineNumber: 38,
                                columnNumber: 34
                            }, this),
                            status === 'success' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$SuccessState$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                                fileName: "[project]/src/pages/register.jsx",
                                lineNumber: 40,
                                columnNumber: 13
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$form$2f$RegistrationForm$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {
                                onSubmit: handleSubmit,
                                loading: status === 'loading'
                            }, void 0, false, {
                                fileName: "[project]/src/pages/register.jsx",
                                lineNumber: 42,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/pages/register.jsx",
                        lineNumber: 36,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/pages/register.jsx",
                lineNumber: 32,
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

//# sourceMappingURL=%5Broot-of-the-server%5D__14f9b4d0._.js.map
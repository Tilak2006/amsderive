# Zero UI Optimization Procedure

## Purpose
This document defines the strict workflow for performing performance optimizations while guaranteeing **zero changes to UI, layout, styling, animations, or user-visible behavior**.

All optimizations must operate only on internal logic, execution efficiency, and resource usage. The rendered output must remain **pixel-identical** to the original application.

---

# Core Principle

Performance optimization must **never change what the user sees**.

The following must remain identical:

- DOM structure
- component hierarchy
- CSS classes and styling
- layout and spacing
- typography
- animations and transitions
- user interactions
- visual timing and responsiveness

Only internal implementation may change.

---

# Allowed Optimizations

The following internal improvements are allowed because they do not affect visual output.

## Rendering Optimization

Examples:

- `React.memo`
- `useMemo`
- `useCallback`
- state isolation
- moving heavy calculations outside render

Example:

```javascript
const mesh = useMemo(() => buildWireframe(data), [data])
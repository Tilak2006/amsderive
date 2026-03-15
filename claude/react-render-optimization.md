# React Render Optimization

## Purpose
This skill defines safe strategies to reduce unnecessary React rendering and main-thread blocking while preserving identical UI behavior.

The goal is to ensure components only render when necessary and expensive computations are not executed repeatedly.

All optimizations must follow the **Zero UI Change rule**.

---

# Common Rendering Problems

## 1. Unnecessary Component Re-renders

React components may re-render when:

- parent components re-render
- props change reference
- state updates occur
- functions are recreated during render

This can cause large parts of the UI tree to update even when the visual output does not change.

---

## 2. Expensive Computations Inside Render

Heavy logic inside component bodies can cause performance problems:

Examples:

- geometry generation
- complex math calculations
- large array processing
- sorting or filtering large datasets

These should not run during every render cycle.

---

# Optimization Strategies

## React.memo

Wrap pure components with `React.memo` to prevent unnecessary re-renders.

Example:

```javascript
const BackgroundOverlay = React.memo(function BackgroundOverlay(props) {
  return <svg>{/* content */}</svg>
})
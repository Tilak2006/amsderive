# Three.js Performance Optimization

## Purpose
This skill defines safe performance optimization strategies for applications using Three.js or WebGL within React or Next.js environments.

The goal is to maintain smooth rendering, stable frame rates, and efficient GPU usage while ensuring that the visual output remains identical.

All optimizations must follow the **Zero UI Change rule**.

---

# Common Performance Issues

## Scene Reinitialization

A frequent issue occurs when a Three.js scene is recreated on React re-renders.

This can lead to:

- multiple WebGL contexts
- memory leaks
- frame drops
- duplicated event listeners

Scenes must only be initialized once.

---

## Geometry Recreation

Expensive geometry calculations can significantly impact performance.

Problems arise when:

- geometry is recreated during each render
- large vertex buffers are rebuilt unnecessarily
- procedural mesh generation runs repeatedly

Geometry creation should occur once and be reused whenever possible.

---

## High Pixel Ratio Rendering

Rendering at very high pixel ratios increases GPU workload.

Example issue:

Devices with `devicePixelRatio` of 2 or higher can significantly increase fragment shader load.

Solution:

Cap pixel ratio to a reasonable value.

Example:

```javascript
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
# Memory Leak Detection

## Purpose
This skill defines methods for detecting and preventing memory leaks in modern web applications.

Memory leaks occur when objects, listeners, timers, or GPU resources remain allocated even after they are no longer needed. Over time this leads to increased memory usage, reduced performance, and potential crashes.

The goal is to ensure that application memory usage remains stable during long sessions and navigation cycles.

All improvements must preserve identical UI behavior.

---

# Common Sources of Memory Leaks

## Event Listeners

Event listeners attached to global objects can remain active after components unmount.

Example problem:

```javascript
window.addEventListener("resize", handleResize)
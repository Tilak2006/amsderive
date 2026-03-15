# Network Latency Optimization

## Purpose
This skill defines strategies for reducing network latency in modern web applications.

The goal is to minimize user wait time by optimizing how network requests are structured, executed, and handled.

All optimizations must maintain identical application behavior and must not change UI output.

---

# Common Network Latency Issues

## Sequential API Requests

Many applications perform API calls sequentially even when they are independent.

Example problem:

```javascript
await fetchUser()
await fetchSettings()
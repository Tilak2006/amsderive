# Async Parallelization

## Purpose
This skill defines safe patterns for executing asynchronous operations in parallel to reduce latency and improve responsiveness.

Many applications execute independent asynchronous tasks sequentially, which unnecessarily increases total execution time.

The goal is to identify tasks that can run concurrently and execute them safely in parallel while preserving application behavior.

All optimizations must follow the **Zero UI Change rule**.

---

# Common Async Bottlenecks

## Sequential Async Calls

Example problem:

```javascript
await validateHandle()
await uploadFile()
await fetchIPInfo()
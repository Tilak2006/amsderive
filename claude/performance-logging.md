# Performance Logging

## Purpose
This skill defines how to implement lightweight performance telemetry for development environments.

The objective is to measure important runtime operations such as component mounts, API calls, and asynchronous workflows in order to detect performance regressions early.

Logging must **not affect production performance or UI behavior**.

---

# Design Principles

Performance logging should be:

- lightweight
- development-only
- non-blocking
- easy to remove or disable

Logs should never interfere with application logic.

---

# Development-Only Logging

Performance logs should only run in development mode.

Example:

```javascript
if (process.env.NODE_ENV !== "production") {
  console.log("[PERF] Operation completed")
}
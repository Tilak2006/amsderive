# Performance Audit Skill

## Purpose
This skill defines how to systematically audit a web application for performance issues without altering UI behavior.

The goal is to identify latency sources in:

- rendering
- bundle size
- network calls
- asynchronous workflows
- GPU / WebGL workloads
- memory usage

The audit must **not change UI structure, styling, animations, or behavior**.

---

# Core Audit Areas

## 1. Rendering Performance

Detect:

- unnecessary React re-renders
- expensive computations inside render cycles
- large component trees re-rendering frequently
- inline functions causing prop changes
- state updates triggering full page renders

Common causes:

- missing `React.memo`
- missing `useMemo`
- missing `useCallback`
- large calculations inside JSX

Goal:

Reduce **main thread blocking** and **render frequency**.

---

## 2. Bundle Size

Inspect:

- initial JavaScript bundle size
- unnecessary dependencies
- unused modules
- duplicated packages

Look for opportunities to introduce:

- dynamic imports
- route-level code splitting
- lazy loading

Goal:

Reduce **initial payload** and improve:

- Time To Interactive (TTI)
- Largest Contentful Paint (LCP)

---

## 3. Network Latency

Detect:

- sequential API requests
- redundant network calls
- duplicate queries
- slow backend responses

Solutions may include:

- request batching
- parallel execution
- response caching
- payload reduction

Goal:

Minimize **user waiting time for data**.

---

## 4. GPU / WebGL Performance

If the project uses Three.js or WebGL:

Audit:

- scene initialization frequency
- geometry rebuilds
- shader complexity
- renderer pixel ratio
- animation loop stability

Detect:

- multiple WebGL contexts
- repeated geometry creation
- unnecessary GPU redraws

Goal:

Maintain stable **frame rate and GPU efficiency**.

---

## 5. Memory Usage

Check for:

- event listener leaks
- timers not cleared
- WebGL resources not disposed
- animation loops not stopped
- stale closures retaining references

Goal:

Prevent **memory growth over time**.

---

# Audit Output

When auditing a project, report:

1. Identified performance bottlenecks
2. Files responsible for the issue
3. Estimated impact of the issue
4. Safe optimization strategies
5. Code modifications required

All optimizations must follow the **Zero UI Change rule**.

---

# Zero UI Change Rule

Optimizations must **not modify**:

- DOM structure
- CSS classes
- layout
- animations
- visual output
- component hierarchy

Only internal implementation may change.
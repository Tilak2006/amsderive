# Next.js Bundle Optimization

## Purpose
This skill defines safe strategies for reducing the JavaScript bundle size and improving load performance in Next.js applications while preserving identical UI behavior.

The objective is to improve:

- Time To Interactive (TTI)
- Largest Contentful Paint (LCP)
- initial page load speed
- runtime responsiveness

All optimizations must follow the **Zero UI Change rule**.

---

# Common Bundle Problems

## Large Initial JavaScript Payload

Many Next.js applications load too much JavaScript on the first page load.

Common causes:

- importing all components at once
- loading below-the-fold sections immediately
- unused dependencies
- large libraries included globally

This increases:

- initial page load time
- main thread blocking
- browser parsing time

---

# Optimization Strategies

## Dynamic Imports

Use dynamic imports for components that are not required immediately.

Example:

```javascript
import dynamic from "next/dynamic"

const AboutSection = dynamic(() => import("../components/AboutSection"))
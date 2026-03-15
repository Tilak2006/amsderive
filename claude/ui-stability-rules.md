# UI Stability Rules

## Purpose
This document defines the strict rules required to ensure that performance optimizations do **not alter the visual output or behavior of the user interface**.

When optimizing performance, the UI must remain **pixel-identical** to the original implementation.

This skill ensures that optimizations only affect internal logic and never change the rendered result.

---

# Zero UI Change Rule

Performance improvements must **not modify**:

- DOM structure
- component hierarchy
- CSS class names
- layout spacing
- responsive breakpoints
- visual animations
- typography
- colors
- element positioning

Only internal implementation changes are allowed.

---

# DOM Structure Integrity

Optimizations must preserve the existing DOM structure.

Avoid:

- adding new wrapper elements
- removing elements
- changing element nesting
- modifying semantic structure

Example:

If the original structure is:

```html
<section>
  <div class="hero">
    <canvas></canvas>
  </div>
</section>
# CSS Integrity

## Purpose
This document defines rules to ensure that CSS behavior remains stable and visually identical when performance optimizations are applied.

Performance improvements must **never modify styling behavior, layout appearance, or visual consistency**.

All optimizations must follow the **Zero UI Change rule**.

---

# Styling Preservation

All CSS rules must remain unchanged unless explicitly required for performance improvements that **do not affect visual output**.

Avoid modifying:

- existing CSS selectors
- class names
- CSS modules
- global styles
- style ordering

Changing any of these can unintentionally alter layout or appearance.

---

# Class Name Stability

CSS class names must remain identical.

Avoid:

- renaming classes
- replacing class names with different ones
- modifying class composition

Example:

Original:

```html
<div class="hero-container">
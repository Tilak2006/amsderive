# Firestore Query Optimization

## Purpose
This skill defines strategies for optimizing Firestore queries to reduce latency, minimize read costs, and improve responsiveness in applications using Firebase.

The goal is to ensure queries execute efficiently while preserving identical application behavior and UI output.

---

# Common Firestore Performance Issues

## Sequential Queries

A common inefficiency occurs when independent queries are executed sequentially.

Example problem:

```javascript
const cf = await checkCodeforcesHandle(handle)
const cc = await checkCodechefHandle(handle)
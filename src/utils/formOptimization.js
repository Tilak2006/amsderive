/**
 * Ultra-low latency form validation with debouncing
 * Factory function creates isolated debouncer instances to prevent cross-component interference
 */

/**
 * Create a validation debouncer instance with isolated timer state
 * Each component should create one instance and reuse it
 */
export function createValidationDebouncer() {
  const timers = new Map();
  return {
    debounce(key, callback, delay = 150) {
      if (timers.has(key)) {
        clearTimeout(timers.get(key));
      }
      const timer = setTimeout(() => {
        callback();
        timers.delete(key);
      }, delay);
      timers.set(key, timer);
    },
    cancel(key) {
      if (timers.has(key)) {
        clearTimeout(timers.get(key));
        timers.delete(key);
      }
    },
    cancelAll() {
      timers.forEach((_, k) => this.cancel(k));
    }
  };
}

/**
 * Legacy module-level debouncer for backward compatibility
 * Deprecated: Use createValidationDebouncer() for new code
 */
const legacyDebouncer = createValidationDebouncer();

/**
 * Debounce validation calls - only run after user stops typing for Xms
 * Deprecated: Use debouncer instance from createValidationDebouncer() instead
 */
export function debounceValidation(key, callback, delay = 150) {
  legacyDebouncer.debounce(key, callback, delay);
}

/**
 * Cancel pending validation
 * Deprecated: Use debouncer instance from createValidationDebouncer() instead
 */
export function cancelValidation(key) {
  legacyDebouncer.cancel(key);
}

/**
 * Optimistic UI: show success immediately, update server in background
 */
export function createOptimisticUpdate(optimisticState, serverPromise) {
  return {
    optimistic: optimisticState,
    sync: serverPromise.catch((err) => {
      // Revert to error state if server fails
      throw err;
    }),
  };
}

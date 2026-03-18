/**
 * Ultra-low latency form validation with debouncing
 * Prevents excessive re-renders and validation calls
 */

const debounceTimers = new Map();

/**
 * Debounce validation calls - only run after user stops typing for Xms
 */
export function debounceValidation(key, callback, delay = 150) {
  if (debounceTimers.has(key)) {
    clearTimeout(debounceTimers.get(key));
  }

  const timer = setTimeout(() => {
    callback();
    debounceTimers.delete(key);
  }, delay);

  debounceTimers.set(key, timer);
}

/**
 * Cancel pending validation
 */
export function cancelValidation(key) {
  if (debounceTimers.has(key)) {
    clearTimeout(debounceTimers.get(key));
    debounceTimers.delete(key);
  }
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

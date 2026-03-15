/**
 * Lightweight performance logging utility.
 * Used internally to detect slow components and API calls.
 */
const isDev = process.env.NODE_ENV === 'development';

const PerformanceLogger = {
  /**
   * Log the duration of an asynchronous operation.
   * @param {string} name - Name of the operation.
   * @param {number} duration - Duration in milliseconds.
   */
  logDuration: (name, duration) => {
    if (isDev) {
      const color = duration > 1000 ? '\x1b[31m' : duration > 500 ? '\x1b[33m' : '\x1b[32m';
      console.log(`[PERF] ${name}: ${color}${duration.toFixed(2)}ms\x1b[0m`);
    }
  },

  /**
   * Monitor a promise and log its duration.
   * @param {string} name - Name of the operation.
   * @param {Promise} promise - The promise to monitor.
   * @returns {Promise} - The original promise.
   */
  monitor: async (name, promise) => {
    const start = performance.now();
    try {
      const result = await promise;
      const end = performance.now();
      PerformanceLogger.logDuration(name, end - start);
      return result;
    } catch (error) {
      const end = performance.now();
      PerformanceLogger.logDuration(`${name} (FAILED)`, end - start);
      throw error;
    }
  },

  /**
   * Hook for measuring component mount time.
   * @param {string} componentName 
   */
  useTraceUpdate: (componentName) => {
    if (!isDev) return;
    const start = performance.now();
    // Simplified trace - can be expanded to track re-renders
    console.log(`[PERF] ${componentName} mounted in ${(performance.now() - start).toFixed(2)}ms`);
  }
};

export default PerformanceLogger;

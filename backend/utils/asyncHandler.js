/**
 * ==============================================================================
 * GSFC UNIVERSITY PLACEMENT MANAGEMENT PORTAL - ASYNC HANDLER WRAPPER
 * ==============================================================================
 * Wraps asynchronous Express route handlers & middleware to guarantee that any
 * rejected promises or thrown exceptions are safely forwarded to next(err)
 * without triggering unhandled promise rejections or crashing the process.
 */

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;

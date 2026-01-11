/**
 * Centralized error logging utility for production safety.
 * Only logs to console in development mode to prevent information leakage.
 */

export const logError = (context: string, error: unknown): void => {
  if (import.meta.env.DEV) {
    console.error(context, error);
  }
  // In production, errors are silently suppressed from console
  // TODO: Integrate with error tracking service (Sentry, LogRocket, etc.)
  // if (import.meta.env.PROD) {
  //   sendToErrorTrackingService(context, error);
  // }
};

export const logWarning = (context: string, message: string): void => {
  if (import.meta.env.DEV) {
    console.warn(context, message);
  }
};

export const logInfo = (context: string, data?: unknown): void => {
  if (import.meta.env.DEV) {
    console.log(context, data);
  }
};

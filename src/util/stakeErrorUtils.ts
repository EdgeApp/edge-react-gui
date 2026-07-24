import { lstrings } from '../locales/strings'

/**
 * Extract a user-presentable message from an unknown error thrown while
 * fetching or approving a stake change quote. Falls back to a generic string
 * when the error carries no message, so the on-scene error field can show the
 * real reason instead of a scary popup alert plus "unknown error occurred".
 */
export const getDisplayErrorMessage = (err: unknown): string =>
  err instanceof Error && err.message !== ''
    ? err.message
    : lstrings.unknown_error_occurred_fragment

/**
 * Ensures a font size value is safe for React Native rendering.
 * React Native crashes when fontSize is 0 or negative on both iOS and Android.
 *
 * @param size - The font size value to validate
 * @param minimumSize - The minimum allowed font size (default: 1)
 * @returns A safe font size value that won't crash the app
 */
export const safeFontSize = (size: number, minimumSize: number = 1): number => {
  // Handle non-finite values (NaN, Infinity, -Infinity)
  if (!Number.isFinite(size)) {
    if (__DEV__) {
      console.warn(
        `safeFontSize: Invalid fontSize value ${size}, using minimum ${minimumSize}`
      )
    }
    return minimumSize
  }

  // Ensure size is not zero or negative
  if (size <= 0) {
    if (__DEV__) {
      console.warn(
        `safeFontSize: fontSize ${size} is <= 0, using minimum ${minimumSize}`
      )
    }
    return minimumSize
  }

  return size
}

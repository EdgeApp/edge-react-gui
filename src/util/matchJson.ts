/**
 * Compares two JSON-like objects, returning false if they differ.
 */
export function matchJson(a: any, b: any): boolean {
  // Use simple equality, unless a and b are proper objects:
  if (typeof a !== 'object' || typeof b !== 'object' || a == null || b == null) {
    return a === b
  }

  // These must either be both arrays or both objects:
  const aIsArray = Array.isArray(a)
  const bIsArray = Array.isArray(b)
  if (aIsArray !== bIsArray) return false

  // Compare arrays in order:
  if (aIsArray) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; ++i) {
      if (!matchJson(a[i], b[i])) return false
    }
    return true
  }

  // These are both regular objects, so grab the keys,
  // ignoring entries where the value is `undefined`:
  const aKeys = Object.getOwnPropertyNames(a).filter(key => a[key] !== undefined)
  const bKeys = Object.getOwnPropertyNames(b).filter(key => b[key] !== undefined)
  if (aKeys.length !== bKeys.length) return false

  // We know that both objects have the same number of properties,
  // so if every property in `a` has a matching property in `b`,
  // the objects must be identical, regardless of key order.
  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false
    if (!matchJson(a[key], b[key])) return false
  }
  return true
}

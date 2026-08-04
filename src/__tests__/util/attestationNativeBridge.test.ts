import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * The Swift `EdgeAttestation` class is exposed to React Native through a
 * hand-written Objective-C bridge, and the two declare the same selectors
 * independently. Nothing else in the repo notices when they drift: `swiftc` does
 * not read the bridge, and `RCT_EXTERN_METHOD` mismatches are not build errors -
 * React Native discovers them at runtime, on the device, as a selector that does
 * not resolve. For `clearKey` that would silently disable the only path that
 * recovers from a key the server has rejected.
 */
describe('iOS attestation native bridge', () => {
  const iosDir = join(__dirname, '../../../ios/edge')
  const swiftSource = readFileSync(
    join(iosDir, 'EdgeAttestation.swift'),
    'utf8'
  )
  const objcSource = readFileSync(join(iosDir, 'EdgeAttestation.m'), 'utf8')

  /** Selectors the Swift class exports, e.g. `clearKey:resolver:rejecter:`. */
  const swiftSelectors = (source: string): string[] => {
    const found = source.match(/@objc\(([^)]+)\)/g) ?? []
    return (
      found
        .map(match => match.slice('@objc('.length, -1))
        // `@objc(EdgeAttestation)` names the class, not a method.
        .filter(selector => selector.includes(':'))
        .sort()
    )
  }

  /**
   * Selectors the Objective-C bridge declares. Each `RCT_EXTERN_METHOD` body is
   * the method name followed by argument labels interleaved with parenthesised
   * types, so dropping every `(Type *)argName` leaves just the selector parts.
   */
  const objcSelectors = (source: string): string[] => {
    const marker = 'RCT_EXTERN_METHOD('
    const selectors: string[] = []
    let index = source.indexOf(marker)
    while (index !== -1) {
      let depth = 1
      let cursor = index + marker.length
      while (cursor < source.length && depth > 0) {
        if (source[cursor] === '(') depth += 1
        if (source[cursor] === ')') depth -= 1
        cursor += 1
      }
      const body = source.slice(index + marker.length, cursor - 1)
      selectors.push(
        body.replace(/\(\s*[^)]*\)\s*\w+/g, '').replace(/\s+/g, '')
      )
      index = source.indexOf(marker, cursor)
    }
    return selectors.sort()
  }

  it('declares every Swift selector with matching arity', () => {
    const swift = swiftSelectors(swiftSource)
    expect(swift.length).toBeGreaterThan(0)
    expect(objcSelectors(objcSource)).toStrictEqual(swift)
  })

  it('passes clearKey a key id, so JS can scope the delete', () => {
    // The check above only sees the two files disagreeing, so it would not
    // notice clearKey losing its keyId in both at once. Pin the argument
    // itself: without it, native deletes whatever key happens to be enrolled
    // when the call finally runs, which may be a newer one.
    expect(swiftSelectors(swiftSource)).toContain('clearKey:resolver:rejecter:')
  })
})

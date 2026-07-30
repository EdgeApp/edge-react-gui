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

/**
 * Three timeouts across three files have to stay in a particular order, and each
 * file documents its own end of the bargain without being able to check it. They
 * are read out of the sources here rather than imported, because two of them are
 * native and none of them is exported.
 */
describe('attestation timeout ordering', () => {
  const root = join(__dirname, '../../..')
  const source = (path: string): string =>
    readFileSync(join(root, path), 'utf8')

  /** Reads `const NAME = 90 * 1000` and multiplies out the literals. */
  const msConstant = (text: string, name: string): number => {
    const match = new RegExp(`const ${name} = ([0-9 *]+)`).exec(text)
    if (match == null) throw new Error(`could not read ${name}`)
    return match[1]
      .split('*')
      .reduce((total, part) => total * Number(part.trim()), 1)
  }

  const engine = source('src/util/attestation.ts')
  const watchdogMs = msConstant(engine, 'HANDSHAKE_WATCHDOG_MS')

  it('gives up on a hung Keystore lock before the JS watchdog fires', () => {
    // Android rejects with `lockTimeout` when it cannot take the lock, and the
    // JS engine reads that as proof no attestation was spent, so it retries the
    // cheap path without growing the backoff. Landing after the watchdog throws
    // that away: the attempt is already retired, so the rejection arrives to a
    // handler that only un-counts, and the engine has spent 90s learning nothing.
    const kotlin = source(
      'android/app/src/main/java/co/edgesecure/app/EdgeAttestationModule.kt'
    )
    const match = /LOCK_TIMEOUT_SECONDS = (\d+)L/.exec(kotlin)
    if (match == null) throw new Error('could not read LOCK_TIMEOUT_SECONDS')
    expect(Number(match[1]) * 1000).toBeLessThan(watchdogMs)
  })

  it('holds the App Attest queue past the JS watchdog, not before it', () => {
    // The iOS operation timeout exists to unwedge the serial queue, not to beat
    // JS to the answer. Below the watchdog it would start rejecting handshakes
    // that were merely slow, and every one of those costs an attestation.
    const swift = source('ios/edge/EdgeAttestation.swift')
    const match = /operationTimeout[^=]*= \.seconds\((\d+)\)/.exec(swift)
    if (match == null) throw new Error('could not read operationTimeout')
    expect(Number(match[1]) * 1000).toBeGreaterThan(watchdogMs)
  })
})

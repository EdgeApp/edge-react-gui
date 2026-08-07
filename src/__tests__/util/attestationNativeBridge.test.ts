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
    // handler that only un-counts, and the engine has spent a whole watchdog
    // interval learning nothing.
    const kotlin = source(
      'android/app/src/main/java/co/edgesecure/app/EdgeAttestationModule.kt'
    )
    const match = /LOCK_TIMEOUT_SECONDS = (\d+)L/.exec(kotlin)
    if (match == null) throw new Error('could not read LOCK_TIMEOUT_SECONDS')
    expect(Number(match[1]) * 1000).toBeLessThan(watchdogMs)
  })

  it('reports every failure to take the Keystore lock as unspent', () => {
    // Failing to acquire the lock is the one native failure that proves no
    // platform attestation was spent, and the engine relies on that to keep a
    // merely contended device from backing off as though it were burning quota.
    // Every exit from the acquisition therefore has to carry a code the engine
    // recognises. A new one carrying anything else would be silent: JS cannot
    // tell an unfamiliar code from a genuine failure, so it would assume the
    // expensive case, which is the safe assumption but the wrong answer here.
    const kotlin = source(
      'android/app/src/main/java/co/edgesecure/app/EdgeAttestationModule.kt'
    )
    const start = kotlin.indexOf('private fun withKeystoreLock')
    if (start === -1) throw new Error('could not find withKeystoreLock')
    const rest = kotlin.slice(start + 1)
    const end = rest.search(/\n {2}(private fun|@ReactMethod)/)
    const acquisition = end === -1 ? rest : rest.slice(0, end)

    const engineSrc = source('src/util/attestation.ts')
    const unspent = /const UNSPENT_NATIVE_CODES = new Set\(\[([^\]]*)\]\)/.exec(
      engineSrc
    )
    if (unspent == null) throw new Error('could not read UNSPENT_NATIVE_CODES')
    const known = [...unspent[1].matchAll(/'([^']+)'/g)].map(match => match[1])

    // Codes come from the AttestCode enums, not string literals at reject sites.
    const swiftCodes = extractSwiftAttestCodes(
      source('ios/edge/EdgeAttestation.swift')
    )
    const kotlinCodes = extractKotlinAttestCodes(kotlin)
    const emitted = [...new Set([...swiftCodes, ...kotlinCodes])]

    const acquisitionCodes = [
      ...acquisition.matchAll(/AttestCode\.(\w+)\.code/g)
    ].map(match => {
      const entry = new RegExp(`${match[1]}\\("([^"]+)"\\)`).exec(kotlin)
      if (entry == null) {
        throw new Error(`could not resolve AttestCode.${match[1]}`)
      }
      return entry[1]
    })

    expect(acquisitionCodes.length).toBeGreaterThan(0)
    expect(
      acquisitionCodes.filter(code => !known.includes(code))
    ).toStrictEqual([])

    // And the other way round, which is where a typo would land: a code in the
    // set that no module emits never matches, so the engine quietly falls back
    // to assuming quota was spent - the same wrong answer, reached from the
    // other side, and just as invisible.
    expect(known.filter(code => !emitted.includes(code))).toStrictEqual([])
  })

  it('declares every JS-routed native code in a platform enum', () => {
    // TRANSIENT_NATIVE_CODES / UNSPENT_NATIVE_CODES are the JS vocabulary for
    // native failures. Every member must appear in one of the two AttestCode
    // enums so a rename on either side is caught here rather than at runtime.
    const engineSrc = source('src/util/attestation.ts')
    const readSet = (name: string): string[] => {
      const match = new RegExp(
        `const ${name} = new Set\\(\\[([^\\]]*)\\]\\)`
      ).exec(engineSrc)
      if (match == null) throw new Error(`could not read ${name}`)
      return [...match[1].matchAll(/'([^']+)'/g)].map(m => m[1])
    }
    const routed = [
      ...readSet('TRANSIENT_NATIVE_CODES'),
      ...readSet('UNSPENT_NATIVE_CODES')
    ]
    const emitted = [
      ...extractSwiftAttestCodes(source('ios/edge/EdgeAttestation.swift')),
      ...extractKotlinAttestCodes(
        source(
          'android/app/src/main/java/co/edgesecure/app/EdgeAttestationModule.kt'
        )
      )
    ]
    expect(routed.filter(code => !emitted.includes(code))).toStrictEqual([])
  })

  it('holds the App Attest queue below the JS watchdog, not past it', () => {
    // iOS must answer before the JS watchdog so a hung call arrives as a real
    // rejection rather than an abandoned attempt. Below the watchdog, slow-but
    // healthy attestations still complete; above it, JS would routinely retire
    // live native work and manufacture overlapping handshakes as normal.
    const swift = source('ios/edge/EdgeAttestation.swift')
    const match = /operationTimeout[^=]*= \.seconds\((\d+)\)/.exec(swift)
    if (match == null) throw new Error('could not read operationTimeout')
    expect(Number(match[1]) * 1000).toBeLessThan(watchdogMs)
  })

  it('leaves room to recover before the token expires', () => {
    // A hung refresh must still recover before the cached token dies. Worst
    // case is watchdog + failure backoff + one handshake, so the lead has to
    // cover at least the first two.
    const failureBackoffMs = msConstant(engine, 'FAILURE_BACKOFF_MS')
    const refreshLeadMs = msConstant(engine, 'REFRESH_LEAD_MS')
    expect(refreshLeadMs).toBeGreaterThan(watchdogMs + failureBackoffMs)
  })
})

/** Cases from `private enum AttestCode: String { case a, b, ... }`. */
const extractSwiftAttestCodes = (swift: string): string[] => {
  const start = swift.indexOf('private enum AttestCode: String')
  if (start === -1) throw new Error('could not find Swift AttestCode enum')
  const bodyStart = swift.indexOf('{', start)
  const bodyEnd = swift.indexOf('}', bodyStart)
  const body = swift.slice(bodyStart + 1, bodyEnd).replace(/\bcase\b/g, ' ')
  return [...body.matchAll(/\b([A-Za-z][A-Za-z0-9_]*)\b/g)].map(m => m[1])
}

/** Codes from `private enum class AttestCode(val code: String) { X("x"), ... }`. */
const extractKotlinAttestCodes = (kotlin: string): string[] => {
  const start = kotlin.indexOf('private enum class AttestCode')
  if (start === -1) throw new Error('could not find Kotlin AttestCode enum')
  const bodyStart = kotlin.indexOf('{', start)
  const bodyEnd = kotlin.indexOf('}', bodyStart)
  const body = kotlin.slice(bodyStart + 1, bodyEnd)
  return [...body.matchAll(/\(\s*"([^"]+)"\s*\)/g)].map(m => m[1])
}

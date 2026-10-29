import { describe, expect, it } from '@jest/globals'

import {
  lockedVersion,
  offRegistryIsFatal
} from '../../../scripts/util/lockPins'

/**
 * The published manifest's pins, against the four kinds of `resolved` a lock
 * holds.
 *
 * Nothing ran either arm before: today's lock has no off-registry pin on a
 * CLI dependency, so a wrong prefix or an unreachable fatal check would have
 * published a pack-dependencies build under a bare semver.
 */
describe('lockedVersion', () => {
  const lock = {
    'node_modules/registry-pkg': {
      version: '1.2.3',
      resolved:
        'https://registry.npmjs.org/registry-pkg/-/registry-pkg-1.2.3.tgz'
    },
    'node_modules/tarball-pkg': {
      version: '4.5.6',
      resolved: 'https://example.com/builds/tarball-pkg-4.5.6.tgz'
    },
    'node_modules/git-pkg': {
      version: '7.0.0',
      resolved: 'git+ssh://git@github.com/EdgeApp/git-pkg.git#abc123'
    },
    'node_modules/file-pkg': {
      version: '0.0.1',
      resolved: 'file:../file-pkg'
    }
  }

  it('takes a registry pin as it is', () => {
    expect(lockedVersion('registry-pkg', lock)).toStrictEqual({
      version: '1.2.3',
      offRegistry: undefined
    })
  })

  it('reports every pin that is not the registry', () => {
    for (const name of ['tarball-pkg', 'git-pkg', 'file-pkg']) {
      const pin = lockedVersion(name, lock)
      expect(pin.offRegistry).toBe(
        `${name} (${
          lock[`node_modules/${name}` as keyof typeof lock].resolved
        })`
      )
    }
  })

  it('answers null for a package the lock does not hold', () => {
    expect(lockedVersion('absent', lock)).toStrictEqual({
      version: null,
      offRegistry: undefined
    })
  })
})

describe('offRegistryIsFatal', () => {
  it('stops a publish build, and only a publish build', () => {
    expect(offRegistryIsFatal(['x (file:../x)'], true)).toBe(true)
    expect(offRegistryIsFatal(['x (file:../x)'], false)).toBe(false)
    expect(offRegistryIsFatal([], true)).toBe(false)
  })
})

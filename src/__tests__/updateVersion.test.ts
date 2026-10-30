import { describe, expect, it } from '@jest/globals'
import { readFileSync } from 'fs'
import { join } from 'path'

import { stampGradle } from '../../scripts/updateVersion'

const gradle = readFileSync(
  join(__dirname, '../../android/app/build.gradle'),
  'utf8'
)

describe('updateVersion', () => {
  it('stamps the real build.gradle and nothing else', () => {
    const stamped = stampGradle(gradle, {
      version: '4.53.0-d',
      build: 26103001
    })
    expect(stamped).toContain('versionName "4.53.0-d"')
    expect(stamped).toContain('versionCode 26103001')
    // Only those two lines change; the split APKs' offsets stay.
    expect(stamped.split('\n').length).toBe(gradle.split('\n').length)
    expect(stamped).toContain("['armeabi-v7a': 1, 'arm64-v8a': 2]")
    // A build.gradle stamped before, with a suffixed name, stamps again.
    expect(
      stampGradle(stamped, { version: '4.53.0', build: 26103004 })
    ).toContain('versionName "4.53.0"')
  })

  it('refuses a build.gradle missing either line', () => {
    expect(() =>
      stampGradle(gradle.replace(/versionName "[^"]*"/, ''), {
        version: '1.0.0',
        build: 1
      })
    ).toThrow('android/app/build.gradle has no /versionName "[^"]*"/g')
    expect(() =>
      stampGradle(gradle.replace(/versionCode [0-9]+/, ''), {
        version: '1.0.0',
        build: 1
      })
    ).toThrow('android/app/build.gradle has no /versionCode [0-9]+/g')
  })
})

import { afterEach, describe, expect, it } from '@jest/globals'
import fs from 'fs'
import os from 'os'
import path from 'path'

import { secureDataDir } from '../../cli/engine/dataDir'

/**
 * The account data directory's mode.
 *
 * Both halves `chmod`ed whatever `-d` named to `0700`, so `-d ~` or a
 * shared folder cut off every other user and service relying on its mode.
 */
const made: string[] = []
afterEach(() => {
  for (const dir of made.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-cli-datadir-'))
  made.push(dir)
  return dir
}

describe('secureDataDir', () => {
  it('creates a directory 0700', () => {
    const dir = path.join(tempDir(), 'new')
    expect(secureDataDir(dir)).toBeUndefined()
    expect(fs.statSync(dir).mode & 0o777).toBe(0o700)
  })

  it('leaves an existing directory’s mode alone, and says when others can read it', () => {
    const dir = tempDir()
    fs.chmodSync(dir, 0o755)
    const warning = secureDataDir(dir)
    expect(fs.statSync(dir).mode & 0o777).toBe(0o755)
    expect(warning).toMatch(/other local users can read/)
  })

  it('says nothing about an existing directory only its owner can read', () => {
    const dir = tempDir()
    fs.chmodSync(dir, 0o700)
    expect(secureDataDir(dir)).toBeUndefined()
  })
})

import { describe, expect, it } from '@jest/globals'
import { spawnSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

import {
  extractionCacheKey,
  gitFreeEnv
} from '../../../scripts/util/extractionCache'

/**
 * The route-extraction cache is read by gates, where a stale answer is a
 * false pass, so its key has to move whenever anything the extraction could
 * depend on moves — which is any file in the tree, not the route files.
 */
describe('extractionCacheKey', () => {
  function repo(): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-extract-key-'))
    // No inherited `GIT_*` variable reaches these children. This suite runs
    // inside the pre-commit hook, where git exports `GIT_DIR` and
    // `GIT_INDEX_FILE`; a child that inherits them ignores `cwd` and acts on
    // the *real* repository — an earlier version of this helper committed
    // into the branch being committed and wrote `core.bare` and a test
    // identity into the shared repository config. Identity goes on the
    // command line for the same reason: nothing here may run `git config`.
    const git = (...args: string[]): string =>
      spawnSync('git', args, {
        cwd: dir,
        encoding: 'utf8',
        env: gitFreeEnv()
      }).stdout.trim()
    git('init', '-q')
    // And proved before the first write, so a scrub that ever stops working
    // fails here instead of touching another repository.
    const gitDir = fs.realpathSync(
      path.resolve(dir, git('rev-parse', '--git-dir'))
    )
    if (!gitDir.startsWith(fs.realpathSync(dir))) {
      throw new Error(
        `refusing to write: git resolved ${gitDir} outside ${dir}`
      )
    }
    fs.writeFileSync(path.join(dir, 'schemas.ts'), 'export const a = 1\n')
    git('add', 'schemas.ts')
    git(
      '-c',
      'user.email=test@example.com',
      '-c',
      'user.name=Test',
      'commit',
      '-q',
      '-m',
      'init'
    )
    return dir
  }

  it('is stable while nothing changes', () => {
    const dir = repo()
    try {
      const first = extractionCacheKey(dir)
      expect(first).not.toBeNull()
      expect(extractionCacheKey(dir)).toBe(first)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('moves for an edit to any tracked file, and for a second edit', () => {
    // A second edit to an already-modified file leaves `git status`
    // byte-identical, which is why the key hashes contents.
    const dir = repo()
    try {
      const clean = extractionCacheKey(dir)
      fs.writeFileSync(path.join(dir, 'schemas.ts'), 'export const a = 2\n')
      const once = extractionCacheKey(dir)
      fs.writeFileSync(path.join(dir, 'schemas.ts'), 'export const a = 3\n')
      const twice = extractionCacheKey(dir)
      expect(new Set([clean, once, twice]).size).toBe(3)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('moves for a new untracked file', () => {
    const dir = repo()
    try {
      const before = extractionCacheKey(dir)
      fs.writeFileSync(path.join(dir, 'newRoute.ts'), 'export {}\n')
      expect(extractionCacheKey(dir)).not.toBe(before)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('has no key, and so no cache, outside a git tree', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-extract-nogit-'))
    try {
      expect(extractionCacheKey(dir)).toBeNull()
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('gitFreeEnv', () => {
  it('removes every GIT_ variable and keeps the rest', () => {
    const env = gitFreeEnv({
      NODE_ENV: 'test',
      GIT_DIR: '/real/.git',
      GIT_INDEX_FILE: '/real/.git/index',
      GIT_WORK_TREE: '/real',
      PATH: '/usr/bin'
    })
    expect(env.GIT_DIR).toBeUndefined()
    expect(env.GIT_INDEX_FILE).toBeUndefined()
    expect(env.GIT_WORK_TREE).toBeUndefined()
    expect(env.PATH).toBe('/usr/bin')
    expect(env.NODE_ENV).toBe('test')
  })
})

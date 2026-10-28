import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'

import { ROOT_DIR } from './common'

export interface UsageSite {
  file: string
  line: number
  /** The top-level declaration that contains the usage. */
  component: string
  snippet: string
}

/** Lines of code kept on each side of a usage. */
const SNIPPET_RADIUS = 7
const KEY_PATTERN =
  /lstrings\.([A-Za-z0-9_]+)|'([A-Za-z0-9_]+)'|`([A-Za-z0-9_]+)`/g
const DECLARATION_PATTERN =
  /^(?:export )?(?:default )?(?:async )?(?:function\*? ?|const |let |class )([A-Za-z0-9_$]+)/

/**
 * Finds every usage of the given string keys in the TypeScript sources under
 * src/ with one git grep pass, matching `lstrings.<key>` and the key as a
 * quoted or template literal. The locale files themselves, tests and docs do
 * not count as usage.
 */
export function findUsageSites(keys: Set<string>): Map<string, UsageSite[]> {
  const output = execFileSync(
    'git',
    [
      'grep',
      '-n',
      '-E',
      "lstrings\\.[A-Za-z0-9_]+|'[A-Za-z0-9_]+'|`[A-Za-z0-9_]+`",
      '--',
      ':(glob)src/**/*.ts',
      ':(glob)src/**/*.tsx',
      ':(exclude)src/locales/strings',
      ':(exclude)src/locales/strings-ai',
      ':(exclude)src/locales/context',
      ':(exclude)src/locales/en_US.ts',
      ':(exclude)src/**/__tests__/**'
    ],
    { cwd: ROOT_DIR, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 }
  )

  const sites = new Map<string, UsageSite[]>()
  const fileLines = new Map<string, string[]>()
  for (const grepLine of output.split('\n')) {
    const match = /^([^:]+):(\d+):(.*)$/.exec(grepLine)
    if (match == null) continue
    const [, file, lineText, content] = match
    const line = parseInt(lineText, 10)

    const lineKeys = new Set<string>()
    for (const keyMatch of content.matchAll(KEY_PATTERN)) {
      const key = keyMatch[1] ?? keyMatch[2] ?? keyMatch[3]
      if (keys.has(key)) lineKeys.add(key)
    }
    if (lineKeys.size === 0) continue

    let lines = fileLines.get(file)
    if (lines == null) {
      lines = fs.readFileSync(path.join(ROOT_DIR, file), 'utf8').split('\n')
      fileLines.set(file, lines)
    }
    const site: UsageSite = {
      file,
      line,
      component: enclosingDeclaration(lines, line - 1) ?? path.basename(file),
      snippet: lines
        .slice(Math.max(0, line - 1 - SNIPPET_RADIUS), line + SNIPPET_RADIUS)
        .join('\n')
    }
    for (const key of lineKeys) {
      const keySites = sites.get(key) ?? []
      keySites.push(site)
      sites.set(key, keySites)
    }
  }
  return sites
}

/**
 * Keeps one site per (file, component) pair,
 * since repeats inside one component rarely change the meaning.
 */
export function distinctSites(sites: UsageSite[]): UsageSite[] {
  const seen = new Set<string>()
  return sites.filter(site => {
    const id = `${site.file}#${site.component}`
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

export function usageFilesOf(sites: UsageSite[]): string[] {
  return [...new Set(sites.map(site => site.file))].sort((a, b) =>
    a.localeCompare(b)
  )
}

function enclosingDeclaration(
  lines: string[],
  index: number
): string | undefined {
  for (let i = index; i >= 0; --i) {
    const match = DECLARATION_PATTERN.exec(lines[i])
    if (match != null) return match[1]
  }
  return undefined
}

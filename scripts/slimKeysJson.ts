/**
 * Reduce a full `keys.json` to the local-only secrets a build needs before the
 * remote `GET /v1/getKeys` fetch can run. Everything else is dropped, because
 * the info server supplies it at boot.
 *
 * The keep-list is imported from `src/localOnlyKeys.ts`, the same inventory
 * `keysStore` uses to strip overlays, so a build that omitted them would have
 * no way to get them back.
 *
 * Usage:
 *   node -r sucrase/register scripts/slimKeysJson.ts <in.json> <out.json>
 *
 * Never prints secret values - only field names.
 */

import fs from 'fs'

import { LOCAL_ONLY_PREFIXES, LOCAL_ONLY_TOP_LEVEL } from '../src/localOnlyKeys'

const KEEP_FIELDS = new Set<string>(LOCAL_ONLY_TOP_LEVEL)
const KEEP_PREFIXES: readonly string[] = LOCAL_ONLY_PREFIXES

export function slimKeys(keys: Record<string, unknown>): {
  slim: Record<string, unknown>
  kept: string[]
  dropped: string[]
} {
  const slim: Record<string, unknown> = {}
  const kept: string[] = []
  const dropped: string[] = []
  for (const [field, value] of Object.entries(keys)) {
    const keep =
      KEEP_FIELDS.has(field) ||
      KEEP_PREFIXES.some(prefix => field.startsWith(prefix))
    if (keep) {
      slim[field] = value
      kept.push(field)
    } else dropped.push(field)
  }
  return { slim, kept, dropped }
}

function main(): void {
  const [inPath, outPath] = process.argv.slice(2)
  if (inPath == null || outPath == null) {
    console.error(
      'Usage: node -r sucrase/register scripts/slimKeysJson.ts <in.json> <out.json>'
    )
    process.exit(1)
  }
  const keys = JSON.parse(fs.readFileSync(inPath, 'utf8'))
  const { slim, kept, dropped } = slimKeys(keys)

  const missing = [...KEEP_FIELDS].filter(field => !(field in slim))
  if (missing.length > 0) {
    console.warn(
      `WARNING: keep-list fields absent from input: ${missing.join(', ')}`
    )
  }

  fs.writeFileSync(outPath, JSON.stringify(slim, null, 2) + '\n', {
    mode: 0o600
  })
  console.log(`kept (${kept.length}): ${kept.sort().join(', ')}`)
  console.log(`dropped (${dropped.length}): ${dropped.sort().join(', ')}`)
  console.log(`wrote ${outPath}`)
}

if (require.main === module) main()

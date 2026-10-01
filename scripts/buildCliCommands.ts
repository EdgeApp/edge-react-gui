/**
 * Generates the CLI's command table from the route declarations.
 *
 * A command that only maps arguments onto a request needs no code: its
 * positional, flags, method and path all come from the route. This emits that
 * table as JSON, which `src/cli/commands/generated.ts` turns into commands at
 * startup.
 *
 * Commands marked `custom` in their declaration are hand-written, because they
 * do something the request shape cannot describe — writing export files,
 * storing a session, holding a stream open.
 *
 * The file is committed, so `src/` never depends on `scripts/`.
 *
 *   node -r sucrase/register scripts/buildCliCommands.ts
 */
import path from 'path'

import type {
  ArgSpecInput as ArgSpec,
  CommandSpecInput as CommandSpec
} from '../src/cli/generatedSchemas'
import { isJson, usageFor } from './cliUsage'
import {
  type ExtractedCli,
  type ExtractedRoute,
  extractRoutes,
  kebab
} from './extractRoutes'
import { writeIfChanged } from './writeIfChanged'

const OUT = path.resolve(__dirname, '../src/cli/generated/commands.json')

/**
 * A JSON blob is anything the caller cannot express as a scalar flag.
 *
 * Structured is the default and scalar is the exception, because getting this
 * backwards is silent: a field whose cleaner names an interface — an
 * `EdgeMetadataChange` rather than a bare `unknown` — used to fall through to
 * a string flag, and the engine then received the *text* of the JSON. The
 * body cleaner rejects that, but a route forwarding the value untouched would
 * have written the string into a synced file.
 */
function kindOf(type: string, required: boolean): ArgSpec['kind'] {
  const t = type.replace(/ \| (null|undefined)/g, '').trim()
  // `boolean` now accepts both `--flag` and `--flag=false`, so requiredness
  // is no longer the thing that decides. `boolstr` stays for a field that
  // must be sent either way, where a bare `--flag` would be ambiguous about
  // whether the caller meant to send anything at all.
  if (t === 'boolean') return required ? 'boolstr' : 'boolean'
  return isJson(t) ? 'json' : 'string'
}

function specFor(r: ExtractedRoute, cli: ExtractedCli): CommandSpec {
  const fields = [
    ...(r.query ?? []).map(f => ({ f, target: 'query' as const })),
    ...(r.body ?? []).map(f => ({ f, target: 'body' as const }))
  ]

  // `{sessionId}` comes from the stored session; any other path parameter is
  // the command's positional argument. A positional that is also a declared
  // field is already on the path, so it must not be sent again as a flag.
  const pathPositional = r.pathParams.find(p => p !== 'sessionId')
  const args: ArgSpec[] = []
  for (const { f, target } of fields) {
    if (f.name === pathPositional) continue
    const mapped = cli.flags.find(x => x.maps === f.name)
    args.push({
      flag: mapped?.name ?? kebab(f.name),
      field: f.name,
      target,
      kind: mapped?.repeat === true ? 'repeat' : kindOf(f.type, !f.optional),
      required: !f.optional
    })
  }

  // `bodyFlag` means one JSON argument *is* the body, so any other declared
  // field would be silently dropped. Better to fail the build than to send a
  // request missing a field the route requires.
  if (cli.bodyFlag != null && args.length > 0) {
    throw new Error(
      `${cli.command}: has bodyFlag "${cli.bodyFlag}" and also declares ` +
        `${args.map(a => a.field).join(', ')}; drop the bodyFlag so every ` +
        'field gets its own flag'
    )
  }

  return {
    command: cli.command,
    method: r.method,
    path: r.routePath,
    usage: usageFor(r, cli),
    help: cli.summary ?? r.summary,
    needsSession: r.pathParams.includes('sessionId'),
    pathPositional,
    args: cli.bodyFlag != null ? [] : args,
    bodyFlag: cli.bodyFlag,
    preset: Object.keys(cli.preset).length > 0 ? cli.preset : undefined
  }
}

const commands: CommandSpec[] = []
const custom: string[] = []
for (const r of extractRoutes()) {
  if (r.isStream) continue
  for (const cli of [r.cli, ...r.cliExtra]) {
    if (cli == null) continue
    if (cli.custom) {
      custom.push(cli.command)
      continue
    }
    if (commands.some(c => c.command === cli.command)) {
      throw new Error(
        `Command "${cli.command}" is declared on more than one route. ` +
          'Mark it `custom: true` and hand-write the dispatch.'
      )
    }
    commands.push(specFor(r, cli))
  }
}
commands.sort((a, b) => a.command.localeCompare(b.command))

const payload = {
  $comment:
    'GENERATED FILE — DO NOT EDIT. Produced by scripts/buildCliCommands.ts ' +
    'from the route declarations in src/cli/engine/routes. Commands marked ' +
    '`custom: true` in a declaration are hand-written instead; see ' +
    'src/cli/commands/.',
  commands
}

const changed = writeIfChanged(OUT, JSON.stringify(payload, null, 2) + '\n')
console.log(
  `${changed ? '✓ wrote' : '· unchanged'} src/cli/generated/commands.json ` +
    `(${commands.length} generated, ${custom.length} hand-written)`
)

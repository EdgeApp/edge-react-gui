/**
 * Registers every command that is just an argument mapping.
 *
 * The table comes from `src/cli/generated/commands.json`, produced from the
 * route declarations. A command listed there needs no code: its positional,
 * flags, method and path are all in the declaration, so the mapping below is
 * the same for all of them.
 *
 * Commands doing something the request shape cannot describe are hand-written
 * in their own module and marked `custom: true` on the route.
 */
import { printJson } from '../client/output'
import { type Command, command, requireSession, UsageError } from '../command'
import { type FlagKind, parseCommandArgs } from '../commandArgs'
import table from '../generated/commands.json'
import { type ArgSpec, asCommandsTable } from '../generatedSchemas'

/** Argument kinds map onto the parser's flag kinds. */
function flagKind(kind: ArgSpec['kind']): FlagKind {
  if (kind === 'boolean') return 'boolean'
  if (kind === 'repeat') return 'repeat'
  return 'string'
}

function parseJson(raw: string, what: string, cmd: Command): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    // `cmd`, not `undefined`: every sibling throw in this handler passes it,
    // so `--metadata '{bad'` printed no usage line where a *missing*
    // `--metadata` did.
    throw new UsageError(cmd, `--${what} must be valid JSON`)
  }
}

for (const spec of asCommandsTable(table).commands) {
  const cmd = command(
    spec.command,
    {
      usage: spec.usage,
      help: spec.help,
      needsSession: spec.needsSession
    },
    async (ctx, argv) => {
      const flags: Record<string, FlagKind> = {}
      for (const a of spec.args) {
        if (a.flag != null) flags[a.flag] = flagKind(a.kind)
      }
      if (spec.bodyFlag != null) flags[spec.bodyFlag] = 'string'

      const args = parseCommandArgs(cmd, argv, {
        positional: spec.pathPositional != null ? 'required' : 'none',
        flags
      })

      const query = new URLSearchParams()
      let body: Record<string, unknown> | undefined

      const put = (a: ArgSpec, value: unknown): void => {
        if (a.target === 'query') {
          query.set(a.field, String(value))
        } else {
          body = body ?? {}
          body[a.field] = value
        }
      }

      if (spec.preset != null) {
        body = { ...(body ?? {}), ...spec.preset }
      }
      if (spec.bodyFlag != null) {
        const raw = args.requireString(spec.bodyFlag)
        body = parseJson(raw, spec.bodyFlag, cmd) as Record<string, unknown>
      } else {
        for (const a of spec.args) {
          if (a.flag == null) continue
          if (a.kind === 'boolean') {
            // Sent only when the caller actually gave the flag, so a field
            // the server defaults to true keeps that default when the flag
            // is absent and can still be turned off with `--flag=false`.
            if (args.booleanGiven(a.flag)) put(a, args.boolean(a.flag))
            else if (a.required)
              throw new UsageError(cmd, `Missing --${a.flag}`)
            continue
          }
          if (a.kind === 'boolstr') {
            // `--flag=true|false`, for a field that must be sent either way.
            const value = args.boolstr(a.flag)
            if (value == null) {
              if (a.required) throw new UsageError(cmd, `Missing --${a.flag}`)
              continue
            }
            put(a, value)
            continue
          }
          if (a.kind === 'repeat') {
            const values = args.strings(a.flag)
            if (values.length > 0) put(a, values)
            else if (a.required)
              throw new UsageError(cmd, `Missing --${a.flag}`)
            continue
          }
          const value = args.string(a.flag)
          if (value == null) {
            if (a.required) throw new UsageError(cmd, `Missing --${a.flag}`)
            continue
          }
          put(a, a.kind === 'json' ? parseJson(value, a.flag, cmd) : value)
        }
      }

      // `{sessionId}` is filled from the stored session; other path params
      // come from the command's positional.
      let path = spec.path
      if (spec.needsSession) {
        path = path.replace(
          '{sessionId}',
          encodeURIComponent(requireSession(ctx))
        )
      }
      if (spec.pathPositional != null) {
        path = path.replace(
          `{${spec.pathPositional}}`,
          encodeURIComponent(String(args.positional ?? ''))
        )
      }

      // A challenge solved by `--solve-captcha` arrives on the retry, not in
      // argv, so inject it when the route takes one and the caller did not
      // pass `--challenge-id` itself. Without this the retry re-sends the
      // request unchallenged and the server issues a fresh challenge.
      const challengeArg = spec.args.find(a => a.field === 'challengeId')
      if (challengeArg != null && ctx.challengeId != null) {
        if (challengeArg.target === 'query') {
          if (query.get('challengeId') == null) {
            query.set('challengeId', ctx.challengeId)
          }
        } else {
          // The body is created if it does not exist yet. Guarding the whole
          // branch on `body != null` dropped a `challengeId` whenever no
          // other field happened to build a body, so the retry went out
          // unchallenged and the server issued a fresh challenge. The query
          // branch above has no such condition.
          body = { challengeId: ctx.challengeId, ...body }
        }
      }

      const qs = query.toString()
      if (qs !== '') path += (path.includes('?') ? '&' : '?') + qs

      const result =
        spec.method === 'GET'
          ? await ctx.client.get(path)
          : await ctx.client.post(path, body)
      printJson(result ?? { ok: true })
    }
  )
}

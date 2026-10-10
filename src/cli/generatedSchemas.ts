/**
 * Cleaners for the files `scripts/build*` generate into `src/cli/generated/`.
 *
 * One declaration per file, imported by both the writer and the reader. Each
 * shape used to be hand-declared twice with a cast bridging the gap, and the
 * cast was load-bearing: `resolveJsonModule` already infers a literal type
 * for the import, so `table as { commands: CommandSpec[] }` is what
 * *suppressed* the check — a `kind` the JSON carries but `ArgSpec['kind']`
 * does not was accepted silently and `flagKind` fell through to `'string'`.
 * The copies had already drifted: `buildCliHelp`'s `ParamHelp` declared a
 * `restOnly` that nothing ever set and that appears zero times in the
 * generated JSON.
 */
import {
  asArray,
  asBoolean,
  asEither,
  asJSON,
  asNull,
  asObject,
  asOptional,
  asString,
  asValue
} from 'cleaners'

/** How one parameter is passed on the command line. */
const asParamHelp = asObject({
  /** How to supply it on the command line, or null when REST-only. */
  pass: asEither(asString, asNull),
  doc: asOptional(asString),
  optional: asOptional(asBoolean)
})

const asCommandHelp = asObject({
  summary: asString,
  description: asOptional(asString),
  core: asOptional(asString),
  method: asString,
  path: asString,
  usage: asString,
  /** Further usage lines, when two routes share this command name. */
  alsoUsage: asOptional(asArray(asString)),
  /** Further REST routes, when two routes share this command name. */
  alsoRest: asOptional(asArray(asString)),
  params: asOptional(asObject(asParamHelp)),
  returns: asOptional(asObject(asString)),
  returnsDoc: asOptional(asString),
  notes: asOptional(asArray(asString)),
  errors: asOptional(asArray(asString))
})

export const asHelpDocs = asObject({
  commands: asObject(asCommandHelp)
}).withRest

/** The flag kinds `commandArgs` knows how to parse. */
const asArgKind = asValue<
  Array<'string' | 'boolean' | 'boolstr' | 'repeat' | 'json'>
>('string', 'boolean', 'boolstr', 'repeat', 'json')

const asArgSpec = asObject({
  flag: asOptional(asString),
  field: asString,
  target: asValue<Array<'query' | 'body'>>('query', 'body'),
  kind: asArgKind,
  required: asBoolean
})

export const asCommandSpec = asObject({
  command: asString,
  method: asString,
  path: asString,
  usage: asString,
  help: asString,
  needsSession: asBoolean,
  pathPositional: asOptional(asString),
  args: asArray(asArgSpec),
  preset: asOptional(asObject(asBoolean))
})

export const asCommandsTable = asObject({
  commands: asArray(asCommandSpec)
}).withRest

/**
 * The same table, read straight from the file.
 *
 * `asJSON`, so one cleaner owns both the parse and the shape: the two gates
 * that read `commands.json` each had their own hand-written interface and a
 * cast, which is the drift a gate exists to notice — and a cast suppresses
 * the check in the one place that is supposed to make it.
 */
export const asCommandsTableJson = asJSON(asCommandsTable)

/**
 * `helpDocs.json` as read from disk, parse and shape in one cleaner — the
 * same form as `asCommandsTableJson` above, for the one reader that goes to
 * disk for it. The `resolveJsonModule` importers keep `asHelpDocs`.
 */
export const asHelpDocsJson = asJSON(asHelpDocs)

export type ParamHelp = ReturnType<typeof asParamHelp>
export type CommandHelp = ReturnType<typeof asCommandHelp>
export type ArgSpec = ReturnType<typeof asArgSpec>
export type CommandSpec = ReturnType<typeof asCommandSpec>

/**
 * The same shape, with every `asOptional` key genuinely optional.
 *
 * A cleaner's output type lists those keys as `T | undefined`, which is right
 * for a *reader* — the key is always there — but a writer building an object
 * literal cannot satisfy it by omission. These are the writer-facing types,
 * so the generators and the CLI still share one declaration.
 */
type Optionalize<T> = {
  [K in keyof T as undefined extends T[K] ? never : K]: T[K]
} & {
  [K in keyof T as undefined extends T[K] ? K : never]?: T[K]
}

export type ParamHelpInput = Optionalize<ParamHelp>

// `Optionalize` is shallow, so the nested shapes are re-stated in their own
// writer form.
export type CommandHelpInput = Omit<Optionalize<CommandHelp>, 'params'> & {
  params?: Record<string, ParamHelpInput>
}

export type ArgSpecInput = Optionalize<ArgSpec>

export type CommandSpecInput = Omit<Optionalize<CommandSpec>, 'args'> & {
  args: ArgSpecInput[]
}

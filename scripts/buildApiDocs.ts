/**
 * Compiles the API reference from the route declarations.
 *
 *   docs/api/dist/openapi.json   OpenAPI 3.1, with `x-cli` and `x-core-call`
 *   docs/api/dist/index.html     self-contained human-readable reference
 *
 *   node -r sucrase/register scripts/buildApiDocs.ts
 *
 * Everything here comes from `src/cli/engine/routes/*.ts`: the JSDoc above each
 * `route(…)` supplies the prose, and the cleaners supply the shapes, resolved
 * through the TypeScript checker. The command line is rendered first in each
 * entry, because the two are one call seen from two directions.
 */
import fs from 'fs'
import { marked } from 'marked'
import path from 'path'

import { groupOrder, sectionOrder } from '../docs/api/groups'
import { CLI_EXIT_CODES, errorCodes } from '../docs/api/shared'
import { API_VERSION } from '../src/cli/engine/apiVersion'
import { SCOPE_PARAMS } from '../src/cli/engine/doc'
import { EXAMPLE_TCP_PORT } from '../src/cli/engine/tcpPort'
import { usageFor } from './cliUsage'
import {
  type ExtractedCli,
  type ExtractedField,
  type ExtractedRoute,
  extractRoutes
} from './extractRoutes'
import { writeIfChanged } from './writeIfChanged'

/**
 * What a path parameter is, in prose.
 *
 * A derived positional keeps the description written beside its cleaner; a
 * scope parameter means the same thing everywhere and is described once.
 */
function pathParamDoc(e: ExtractedRoute, name: string): string {
  if (name === e.pathPositional) {
    const field = [...(e.query ?? []), ...(e.body ?? [])].find(
      f => f.name === name
    )
    if (field?.doc != null) return field.doc
  }
  return SCOPE_PARAMS[name] ?? ''
}

/**
 * Request fields, minus the one the path carries.
 *
 * A positional is declared as an ordinary field but travels as a path
 * segment. Listing it in both tables would tell a reader to send it twice.
 */
function requestFields(
  e: ExtractedRoute,
  fields: ExtractedField[] | undefined
): ExtractedField[] | undefined {
  if (fields == null) return undefined
  const out = fields.filter(f => f.name !== e.pathPositional)
  return out.length === 0 ? undefined : out
}

const OUT = path.resolve(__dirname, '../docs/api/dist')

interface Group {
  id: string
  title: string
  doc: string
  section: string
  endpoints: ExtractedRoute[]
}

function buildGroups(): Group[] {
  const routes = extractRoutes()
  const out: Group[] = []
  for (const info of groupOrder) {
    const endpoints = routes.filter(r => r.group === info.id)
    if (endpoints.length > 0) out.push({ ...info, endpoints })
  }
  const placed = new Set(out.flatMap(g => g.endpoints.map(e => e.id)))
  const rest = routes.filter(r => !placed.has(r.id))
  if (rest.length > 0) {
    out.push({
      id: 'other',
      title: 'Other',
      doc: '',
      section: 'other',
      endpoints: rest
    })
  }
  return out
}

const groups = buildGroups()

interface Section {
  id: string
  title: string
  doc: string
  groups: Group[]
}

/** Sections in declared order, each holding the groups that named it. */
function buildSections(): Section[] {
  const out: Section[] = []
  for (const info of sectionOrder) {
    const inSection = groups.filter(g => g.section === info.id)
    if (inSection.length > 0) out.push({ ...info, groups: inSection })
  }
  const placed = new Set(out.flatMap(s => s.groups.map(g => g.id)))
  const rest = groups.filter(g => !placed.has(g.id))
  if (rest.length > 0) {
    out.push({ id: 'other', title: 'Other', doc: '', groups: rest })
  }
  return out
}

const sections = buildSections()

// ------------------------------------------------------------------ helpers

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function md(text: string | undefined): string {
  if (text == null || text === '') return ''
  return marked.parseInline(text) as string
}

function mdBlock(text: string | undefined): string {
  if (text == null || text === '') return ''
  return marked.parse(text) as string
}

/** A resolved type string, rendered with the primitives played down. */
function typeLabel(type: string): string {
  return `<span class="t">${esc(type)}</span>`
}

/**
 * Split a type on one separator, at the top level only.
 *
 * `t.split('|')` cut inside braces, so an index signature or an object
 * literal containing a union came apart: `{ [keys: string]: string |
 * string[]; }` became the two fragments `{ [keys: string]: string` and
 * `string[]; }`, and each fragment fell through to `{ description }` — so
 * the field published an `anyOf` of two always-true schemas built from
 * halves of a broken type.
 */
function splitTopLevel(t: string, separator: string): string[] {
  const parts: string[] = []
  let depth = 0
  let quote: string | null = null
  let start = 0
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (quote != null) {
      if (c === quote && t[i - 1] !== '\\') quote = null
      continue
    }
    if (c === '"' || c === "'") {
      quote = c
    } else if (c === '{' || c === '[' || c === '<' || c === '(') {
      depth++
    } else if (c === '}' || c === ']' || c === '>' || c === ')') {
      // Never below zero: a function type's `=>` has an unmatched `>`.
      if (depth > 0) depth--
    } else if (c === separator && depth === 0) {
      parts.push(t.slice(start, i))
      start = i + 1
    }
  }
  parts.push(t.slice(start))
  return parts.map(p => p.trim()).filter(p => p !== '')
}

/**
 * A string literal type, with its value.
 *
 * Both quote styles. The enum and single-literal branches tested for `'`
 * while the TypeScript checker prints `"`, so neither ever fired: the
 * six-member `loginMethod` union and 62 other string-literal schemas landed
 * as `anyOf` members with no `type` at all, and `"enum"` appeared nowhere in
 * the published document.
 */
const STRING_LITERAL = /^(['"])([\s\S]*)\1$/

/** Plausible JSON for a resolved type, so examples read like real payloads. */
function exampleFor(type: string, name = ''): unknown {
  const resolvedType = type.trim()
  if (resolvedType.endsWith('[]'))
    return [exampleFor(resolvedType.slice(0, -2), name)]
  if (resolvedType.startsWith('Array<'))
    return [exampleFor(resolvedType.slice(6, -1), name)]
  // `splitTopLevel` and `STRING_LITERAL`, like `jsonSchema` below — the two
  // readers of one resolved type string had two ideas of what a union is.
  // `resolvedType.split('|')` cuts inside braces, so `{ walletType: string; name:
  // string | undefined }` — the shape of most route returns — came apart
  // into `{ walletType: string; name: string` and `undefined }`, and the
  // first fragment then matched the `startsWith('{')` arm and answered `{}`:
  // the right answer, by accident, until a shape whose first fragment is not
  // an object literal comes along.
  const unionParts = splitTopLevel(resolvedType, '|')
  if (unionParts.length > 1) {
    const first = unionParts.find(p => p !== 'null' && p !== 'undefined')
    return first != null ? exampleFor(first, name) : null
  }
  if (resolvedType === 'boolean') return true
  if (resolvedType === 'number')
    return /Height|Count|Seconds|Ratio|rate/i.test(name) ? 1 : 0
  if (resolvedType === 'null') return null
  // Both quote styles: the checker prints `"`, and testing only for `'`
  // meant a string-literal union's example was the raw type text.
  const literal = STRING_LITERAL.exec(resolvedType)
  if (literal != null) return literal[2].split(' ')[0]
  if (resolvedType === 'string') {
    if (/date|At$/i.test(name)) return '2026-09-02T16:35:00.000Z'
    if (/Amount|Fee/i.test(name)) return '12345'
    if (/Id$/i.test(name)) return 'FS8xJ2kQ…'
    return 'string'
  }
  if (resolvedType === 'unknown' || resolvedType === 'any') return {}
  // A `Date` never crosses JSON as one. `asQueryDate` accepts ISO-8601 or
  // epoch milliseconds and the handlers answer with `toISOString()`, so what
  // a caller sends and reads is a string — and `{ description: 'Date' }`,
  // which is what the fallthrough produced, validates anything.
  if (resolvedType === 'Date') return { type: 'string', format: 'date-time' }
  if (resolvedType.startsWith('{')) return {}
  return `<${resolvedType}>`
}

function exampleObject(fields: ExtractedField[]): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const f of fields) out[f.name] = exampleFor(f.type, f.name)
  return out
}

/**
 * Break a resolved type across lines the way a person would write it.
 *
 * The compiler hands back one long string —
 * `{ tokenId: string | null; currencyCode: string; … }[]` — which is
 * unreadable past a couple of fields. This indents nested object literals and
 * puts one member per line. Only `{`, `;` and `}` matter; a `;` inside a
 * string literal type would be misread, and no cleaner produces one.
 */
function formatType(type: string, indent = 0): string {
  let out = ''
  let depth = indent
  const pad = (n: number): string => '  '.repeat(n)
  for (let i = 0; i < type.length; i++) {
    const c = type[i]
    if (c === '{') {
      depth++
      out += '{\n' + pad(depth)
    } else if (c === '}') {
      depth--
      out = out.replace(/[ \n]+$/, '')
      out += '\n' + pad(depth) + '}'
    } else if (c === ';') {
      // A trailing `;` before `}` would leave a blank line.
      const rest = type.slice(i + 1).trimStart()
      out += rest.startsWith('}') ? '' : ';\n' + pad(depth)
    } else if (c === ' ' && out.endsWith('\n' + pad(depth))) {
      // Swallow the space the compiler puts after `{` and `;`.
    } else {
      out += c
    }
  }
  return out
}

function tsInterface(fields: ExtractedField[]): string {
  const lines = fields.map(
    f =>
      `  ${f.name}${f.optional ? '?' : ''}: ${formatType(
        f.type,
        1
      ).trimStart()}`
  )
  return `{\n${lines.join('\n')}\n}`
}

function fieldRows(fields: ExtractedField[]): string {
  return fields
    .map(
      f => `<tr>
  <td class="k"><code>${esc(f.name)}</code></td>
  <td class="ty">${typeLabel(f.type)}${
        f.optional ? ' <span class="flag opt">optional</span>' : ''
      }</td>
  <td class="doc">${md(f.doc)}</td>
</tr>`
    )
    .join('\n')
}

/** Type, example and per-field prose: three views of one shape. */
function shapeBlock(fields: ExtractedField[], label: string): string {
  if (fields.length === 0) return ''
  return `<div class="shape">
    <div class="shape-h">${esc(label)}</div>
    <pre class="ts"><code>${esc(tsInterface(fields))}</code></pre>
    <details><summary>Example</summary><pre class="json"><code>${esc(
      JSON.stringify(exampleObject(fields), null, 2)
    )}</code></pre></details>
    <table class="fields"><tbody>${fieldRows(fields)}</tbody></table>
  </div>`
}

// ------------------------------------------------------------ endpoint HTML

function coreLine(e: ExtractedRoute): string {
  const note =
    e.coreNote != null ? ` <span class="dim">${md(e.coreNote)}</span>` : ''
  if (e.core == null) {
    return `<p class="core none"><span class="lbl">core</span><em>${
      e.coreNote != null ? md(e.coreNote) : 'No direct core call.'
    }</em></p>`
  }
  const diffs = Object.entries(e.coreExtra)
  const extra =
    diffs.length === 0
      ? ''
      : `<div class="note"><p><strong>Differs from core:</strong></p><ul>${diffs
          .map(([k, v]) => `<li><code>${esc(k)}</code> — ${md(v)}</li>`)
          .join('')}</ul></div>`
  return `<p class="core"><span class="lbl">core</span><code>${esc(
    e.core
  )}</code>${note}</p>${extra}`
}

function cliBlock(e: ExtractedRoute): string {
  if (e.cli == null) {
    return `<div class="pane cli none"><h4>Command line</h4>
      <p class="dim">No <code>edge-cli</code> command. REST only.</p></div>`
  }
  const cli: ExtractedCli = e.cli
  const extras =
    cli.extra.length === 0
      ? ''
      : `<h5>Client-only flags</h5><table class="fields"><tbody>${cli.extra
          .map(
            x =>
              `<tr><td class="k"><code>--${esc(
                x.name
              )}</code></td><td class="ty">${
                x.required === true
                  ? '<span class="flag req">required</span>'
                  : '<span class="flag opt">optional</span>'
              }</td><td class="doc">${md(x.doc)}</td></tr>`
          )
          .join('')}</tbody></table>`
  // A route can bind more than one command — `spend` and `spend-max` share
  // one, differing only by a preset — and rendering only the first left the
  // others out of the reference entirely.
  const alternates = e.cliExtra
    .map(
      extra =>
        // The alternate's own `summary` as a heading. Rendering only its
        // usage line left `spend-max` under a section headed "Send funds."
        // — the summary it declares appeared nowhere in the document.
        `<h5 class="alt"><code>${esc(extra.command)}</code>${
          extra.summary != null ? ` — ${esc(extra.summary)}` : ''
        }</h5><pre class="usage"><code>${esc(usageFor(e, extra))}</code></pre>${
          extra.notes != null
            ? `<div class="note">${mdBlock(extra.notes)}</div>`
            : ''
        }`
    )
    .join('')
  return `<div class="pane cli">
    <h4>Command line</h4>
    <pre class="usage"><code>${esc(usageFor(e, e.cli))}</code></pre>
    ${alternates}
    ${extras}
    ${cli.notes != null ? `<div class="note">${mdBlock(cli.notes)}</div>` : ''}
  </div>`
}

function curlFor(e: ExtractedRoute): string {
  const p = e.routePath
    .replace('{sessionId}', '$SESS')
    .replace('{walletId}', '$WID')
    .replace(/\{(\w+)\}/g, (_m, n) => `$${String(n).toUpperCase()}`)
  const required = (e.query ?? []).filter(q => !q.optional)
  const qs =
    required.length > 0 ? '?' + required.map(q => `${q.name}=…`).join('&') : ''
  const lines = ['curl --unix-socket "$SOCK" \\']
  if (e.method !== 'GET') lines.push(`  -X ${e.method} \\`)
  if (e.body != null && e.body.length > 0) {
    lines.push(`  -H 'Content-Type: application/json' \\`)
    lines.push(`  -d '${JSON.stringify(exampleObject(e.body))}' \\`)
  }
  lines.push(`  'http://localhost${p}${qs}'`)
  return lines.join('\n')
}

function restBlock(e: ExtractedRoute): string {
  const pathTable =
    e.pathParams.length === 0
      ? ''
      : `<h5>Path</h5><table class="fields"><tbody>${e.pathParams
          .map(
            n =>
              `<tr><td class="k"><code>${esc(
                n
              )}</code></td><td class="ty">${typeLabel(
                'string'
              )}</td><td class="doc">${md(pathParamDoc(e, n))}</td></tr>`
          )
          .join('')}</tbody></table>`
  return `<div class="pane rest">
    <h4>REST</h4>
    <p class="route"><span class="m m-${e.method}">${
    e.method
  }</span><code>${esc(e.routePath)}</code></p>
    ${pathTable}
    ${
      requestFields(e, e.query) != null
        ? shapeBlock(requestFields(e, e.query)!, 'Query')
        : ''
    }
    ${
      e.bodyNote != null ? `<div class="note">${mdBlock(e.bodyNote)}</div>` : ''
    }
    ${
      requestFields(e, e.body) != null
        ? shapeBlock(requestFields(e, e.body)!, 'Request body')
        : ''
    }
    <h5>Example</h5>
    <pre class="ex"><code>${esc(curlFor(e))}</code></pre>
  </div>`
}

function responseBlock(e: ExtractedRoute): string {
  const status = e.returns == null && e.returnsType == null ? 204 : 200
  const errs =
    e.errors.length === 0
      ? ''
      : `<h5>Errors</h5><p class="errs">${e.errors
          .map(code => {
            const known = errorCodes.find(x => x.code === code)
            return `<a href="#err-${code}" class="err" title="${esc(
              known?.doc ?? ''
            )}"><span class="st">${known?.status ?? '?'}</span>${code}</a>`
          })
          .join(' ')}</p>`
  const prose = e.returnsProse ?? e.returnsDoc
  const body =
    status === 204
      ? '<p class="lead dim">No body.</p>'
      : `${prose != null ? `<div class="note">${mdBlock(prose)}</div>` : ''}${
          e.returns != null && e.returns.length > 0
            ? shapeBlock(e.returns, 'Response body')
            : `<pre class="ts"><code>${esc(
                formatType(e.returnsType ?? 'unknown')
              )}</code></pre>`
        }`
  return `<div class="pane resp">
    <h4>Response <span class="st ok">${status}</span></h4>
    ${body}
    ${errs}
  </div>`
}

function endpointHtml(e: ExtractedRoute): string {
  const name =
    e.cli != null
      ? `<code class="cmdname">${esc(e.cli.command)}</code>`
      : '<span class="restonly">REST only</span>'
  const notes =
    e.notes.length === 0
      ? ''
      : `<div class="pane notes"><h4>Notes</h4><ul>${e.notes
          .map(n => `<li>${md(n)}</li>`)
          .join('')}</ul></div>`
  return `<section class="endpoint" id="${e.id}">
    <header>
      <h3><a href="#${e.id}">${esc(e.summary)}</a></h3>
      <div class="ids">${name}<span class="src" title="Declared in">src/cli/engine/routes/${esc(
    e.file
  )}</span></div>
    </header>
    ${coreLine(e)}
    ${
      e.description != null
        ? `<div class="desc">${mdBlock(e.description)}</div>`
        : ''
    }
    <div class="panes">${cliBlock(e)}${restBlock(e)}</div>
    ${responseBlock(e)}
    ${notes}
  </section>`
}

// ------------------------------------------------------------------- OpenAPI

/** An index signature, which is an object with a value type and no fields. */
const INDEX_SIGNATURE = /^\{\s*\[[^\]]+\]\s*:\s*([\s\S]+?);?\s*\}$/

/** A resolved type string, as JSON Schema. */
function jsonSchema(type: string): Record<string, unknown> {
  const resolvedType = type.trim()
  if (resolvedType.endsWith('[]'))
    return { type: 'array', items: jsonSchema(resolvedType.slice(0, -2)) }
  if (resolvedType.startsWith('Array<')) {
    return { type: 'array', items: jsonSchema(resolvedType.slice(6, -1)) }
  }

  const union = splitTopLevel(resolvedType, '|')
  if (union.length > 1) {
    const parts = union.filter(p => p !== 'undefined')
    const literals = parts.map(p => STRING_LITERAL.exec(p))
    if (literals.every(m => m != null)) {
      return {
        type: 'string',
        enum: literals.map(m => m![2])
      }
    }
    if (parts.length === 1) return jsonSchema(parts[0])
    return { anyOf: parts.map(jsonSchema) }
  }

  if (resolvedType === 'string') return { type: 'string' }
  const literal = STRING_LITERAL.exec(resolvedType)
  // `const`, not a bare `type: string`: the one value the field accepts is
  // the whole content of a single-literal type.
  if (literal != null) return { type: 'string', const: literal[2] }
  if (resolvedType === 'number') return { type: 'number' }
  if (resolvedType === 'boolean') return { type: 'boolean' }
  if (resolvedType === 'null') return { type: 'null' }
  if (resolvedType === 'unknown' || resolvedType === 'any') return {}
  // A `Date` never crosses JSON as one. `asQueryDate` accepts ISO-8601 or
  // epoch milliseconds and the handlers answer with `toISOString()`, so what
  // a caller sends and reads is a string — and `{ description: 'Date' }`,
  // which is what the fallthrough produced, validates anything.
  if (resolvedType === 'Date') return { type: 'string', format: 'date-time' }

  const indexed = INDEX_SIGNATURE.exec(resolvedType)
  if (indexed != null) {
    return { type: 'object', additionalProperties: jsonSchema(indexed[1]) }
  }

  if (resolvedType.startsWith('{') && resolvedType.endsWith('}')) {
    const properties: Record<string, unknown> = {}
    const required: string[] = []
    for (const member of splitTopLevel(resolvedType.slice(1, -1), ';')) {
      const field = /^(\w+)(\?)?\s*:\s*([\s\S]+)$/.exec(member)
      // A shape this cannot read is still an object, so say that much rather
      // than falling through to a schema that validates anything.
      if (field == null) return { type: 'object', description: resolvedType }
      const inner = field[3].trim()
      properties[field[1]] = jsonSchema(inner)
      const optional =
        field[2] != null || splitTopLevel(inner, '|').includes('undefined')
      if (!optional) required.push(field[1])
    }
    return {
      type: 'object',
      properties,
      ...(required.length > 0 ? { required } : {})
    }
  }

  return { description: resolvedType }
}

function objectSchema(fields: ExtractedField[]): Record<string, unknown> {
  const properties: Record<string, unknown> = {}
  const required: string[] = []
  for (const f of fields) {
    properties[f.name] =
      f.doc != null
        ? { ...jsonSchema(f.type), description: f.doc }
        : jsonSchema(f.type)
    if (!f.optional) required.push(f.name)
  }
  const out: Record<string, unknown> = { type: 'object', properties }
  if (required.length > 0) out.required = required
  return out
}

function buildOpenApi(): Record<string, unknown> {
  const paths: Record<string, Record<string, unknown>> = {}
  for (const g of groups) {
    for (const e of g.endpoints) {
      const coreMd =
        e.core != null
          ? `**Core call:** \`${e.core}\`\n\n`
          : `**Core call:** _none — ${e.coreNote ?? ''}_\n\n`
      const cliMd =
        e.cli != null
          ? '**Command line**\n\n```\n' + usageFor(e, e.cli) + '\n```\n\n'
          : '_No `edge-cli` command; REST only._\n\n'
      const op: Record<string, unknown> = {
        operationId: e.id,
        summary: e.summary,
        description: coreMd + cliMd + (e.description ?? ''),
        tags: [g.title],
        'x-cli': e.cli,
        // Routes with a second binding (`spend-max` presets `spend`) were
        // otherwise absent from the document entirely.
        ...(e.cliExtra.length > 0 ? { 'x-cli-alternates': e.cliExtra } : {}),
        'x-core-call': e.core,
        'x-core-note': e.coreNote,
        'x-source': `src/cli/engine/routes/${e.file}`,
        parameters: [
          ...e.pathParams.map(n => ({
            name: n,
            in: 'path',
            required: true,
            description: pathParamDoc(e, n),
            schema: { type: 'string' }
          })),
          ...(requestFields(e, e.query) ?? []).map(q => ({
            name: q.name,
            in: 'query',
            required: !q.optional,
            description: q.doc,
            schema: jsonSchema(q.type)
          }))
        ],
        responses: {
          [e.returns == null && e.returnsType == null ? '204' : '200']:
            e.returns == null && e.returnsType == null
              ? { description: 'No content.' }
              : {
                  description: e.returnsProse ?? e.returnsDoc ?? 'Success.',
                  content: {
                    'application/json': {
                      schema:
                        e.returns != null && e.returns.length > 0
                          ? objectSchema(e.returns)
                          : jsonSchema(e.returnsType ?? 'unknown')
                    }
                  }
                },
          default: {
            description: e.errors.length > 0 ? e.errors.join(', ') : 'Error.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' }
              }
            }
          }
        }
      }
      const bodyFields = requestFields(e, e.body)
      if (bodyFields != null) {
        op.requestBody = {
          required: true,
          description: e.bodyNote,
          content: { 'application/json': { schema: objectSchema(bodyFields) } }
        }
      }
      paths[e.routePath] = paths[e.routePath] ?? {}
      paths[e.routePath][e.method.toLowerCase()] = op
    }
  }

  return {
    openapi: '3.1.0',
    info: {
      title: 'Edge CLI',
      version: API_VERSION,
      description:
        'The `edge-cli` command line and the `edge-engine` JSON REST API, generated from the route declarations in `src/cli/engine/routes/`.'
    },
    servers: [
      {
        url: 'http://localhost',
        description: 'Unix socket at ~/.edge-cli/run/<profile>/engine.sock'
      },
      {
        url: `http://127.0.0.1:${EXAMPLE_TCP_PORT}`,
        description: `Loopback TCP, when started with --tcp=${EXAMPLE_TCP_PORT}. Requires the X-Edge-Token header; see securitySchemes.`
      }
    ],
    // Declared, so the published document says what the TCP transport
    // requires rather than reading as an open port. The unix socket needs
    // none — its 0600 mode is the check — which is why this is not a
    // document-wide `security` requirement.
    security: [{}, { edgeTcpToken: [] }],
    tags: groups.map(g => ({ name: g.title, description: g.doc })),
    paths,
    components: {
      securitySchemes: {
        edgeTcpToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Edge-Token',
          description:
            'The bearer token the engine mints for its loopback TCP listener, written to the `0600` run file at ~/.edge-cli/run/<profile>/engine.json as `tcpToken`. Required on the TCP transport and ignored on the unix socket. A TCP request that also carries `Origin`, or a `Host` other than the bound address, is refused with 403 whatever token it presents.'
        }
      },
      schemas: {
        // The one schema here that is not derived from a route's cleaners,
        // because the envelope belongs to no route: it is what *every*
        // route answers on failure. `src/cli/engine/errors.ts` names the
        // runtime shape as `ErrorResponse`, and `src/cli/engine/schemas.ts`
        // says why there is no cleaner for it.
        ErrorEnvelope: {
          type: 'object',
          description: 'Every failure, on both transports.',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                status: { type: 'number' },
                details: {}
              },
              required: ['code', 'message', 'status']
            }
          },
          required: ['error']
        }
      }
    }
  }
}

// ---------------------------------------------------------------------- CSS

const CSS = fs.readFileSync(path.join(__dirname, 'apiDocs.css'), 'utf8')

// --------------------------------------------------------------------- HTML

function buildHtml(): string {
  const nav = sections
    .map(
      s =>
        `<div class="s">${esc(s.title)}</div>` +
        s.groups
          .map(
            g =>
              `<div class="g">${esc(g.title)}</div>` +
              g.endpoints
                .map(e => {
                  const label =
                    e.cli != null
                      ? `<code>${esc(e.cli.command)}</code>`
                      : `<span class="restonly">${esc(e.summary)}</span>`
                  // Every binding's command and summary go into the search
                  // text, not just the first: a reader looking for
                  // `spend-max` found nothing, because the sidebar and the
                  // index were built from `e.cli` alone.
                  const alternateText = e.cliExtra
                    .map(x => `${x.command} ${x.summary ?? ''}`)
                    .join(' ')
                  return `<a class="e" href="#${e.id}" data-s="${esc(
                    (
                      e.summary +
                      ' ' +
                      e.routePath +
                      ' ' +
                      (e.cli?.command ?? '') +
                      ' ' +
                      alternateText
                    ).toLowerCase()
                  )}">${label}</a>`
                })
                .join('')
          )
          .join('')
    )
    .join('')

  const body = sections
    .map(
      s => `<h2 id="${s.id}">${esc(s.title)}</h2>
      ${s.doc !== '' ? `<div class="groupdoc">${mdBlock(s.doc)}</div>` : ''}
      ${s.groups
        .map(
          g => `<h3 class="sub" id="${g.id}">${esc(g.title)}</h3>
          ${g.doc !== '' ? `<div class="groupdoc">${mdBlock(g.doc)}</div>` : ''}
          ${g.endpoints.map(endpointHtml).join('')}`
        )
        .join('')}`
    )
    .join('')

  const errorSection = `<table class="fields"><tbody>${errorCodes
    .map(
      e =>
        `<tr id="err-${e.code}"><td class="k"><code>${e.code}</code></td>
        <td class="ty"><span class="st">${e.status}</span><span class="dim">${
          e.origin
        }</span></td>
        <td class="doc">${md(e.doc)}${
          e.details != null
            ? ` <span class="dim">details: ${md(e.details)}</span>`
            : ''
        }</td></tr>`
    )
    .join('')}</tbody></table>`

  const exitSection = `<table class="fields"><tbody>${CLI_EXIT_CODES.map(
    x =>
      `<tr><td class="k"><code>${
        x.code
      }</code></td><td class="ty"><span class="dim">${
        x.name
      }</span></td><td class="doc">${md(x.doc)}</td></tr>`
  ).join('')}</tbody></table>`

  const count = groups.reduce((n, g) => n + g.endpoints.length, 0)

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Edge CLI API</title>
<style>${CSS}</style>
</head><body>
<div class="layout">
<nav>
  <h1>Edge CLI API</h1>
  <p class="ver">v${API_VERSION} · ${count} calls</p>
  <input id="q" type="search" placeholder="Filter…" autocomplete="off">
  <a class="e" href="#overview"><strong>Overview</strong></a>
  ${nav}
  <div class="g">Reference</div>
  <a class="e" href="#errors">Error codes</a>
  <a class="e" href="#exit-codes">Exit codes</a>
</nav>
<main>
<h2 id="overview">Overview</h2>
<div class="groupdoc">${mdBlock(
    `Every entry is one API call shown twice: as an \`edge-cli\` command, then as the JSON REST request that command sends. Both are generated from a single declaration in \`src/cli/engine/routes/\`, so the two forms cannot drift apart.

Routes are named after the \`edge-core-js\` call they front, kebab-cased: \`context.forgetAccount\` becomes \`POST /forget-account\`, and the command is \`forget-account\`. Parameters carry core's own names. Every entry states its core call, or says why there is none. Only \`GET\` and \`POST\` appear — core has no HTTP verbs, so reads are GET and everything else is POST.

The \`edge-cli\` client is a thin one-shot process. A long-lived \`edge-engine\` daemon owns the \`EdgeContext\` and every logged-in account, serving this API over a Unix socket at \`~/.edge-cli/run/<profile>/engine.sock\`, plus loopback TCP when started with \`--tcp=${EXAMPLE_TCP_PORT}\`.

**Transport authentication differs by transport.** The Unix socket needs none: it is \`0600\` inside a \`0700\` directory, so the operating system is the check and only this user's processes can connect. The loopback TCP listener needs more, because every process on the host can reach \`127.0.0.1\` whatever user it runs as, and a web page the user happens to visit can reach it too — so it requires the bearer token from the engine's \`0600\` run file in an \`X-Edge-Token\` header, refuses any request carrying an \`Origin\`, requires \`Host\` to be the address it bound, and answers no preflight. A \`sessionId\` is itself full account authority, so treat one as a credential wherever it travels.

<a id="object-handles"></a>
**Ephemeral object handles.** In \`edge-core-js\` a method-bearing value is identified by object reference — you call \`wallet.signTx(tx)\` on the very \`tx\` that \`makeSpend\` returned. That does not survive HTTP, so the engine parks such values under an \`objectId\` with a 5 minute TTL and later steps name the id. Reads do not extend the TTL; only a step that updates the value does. Finishing a workflow, or \`POST /account/{sessionId}/object/delete/{objectId}\`, releases the handle early. A handle read after its TTL answers \`410 OBJECT_EXPIRED\` if the 15-second sweeper has not reached it yet and \`404 OBJECT_NOT_FOUND\` once it has, which is the usual case — so a caller retrying on an expired handle has to branch on both.

**Serialization.** \`Uint8Array\` becomes base64, \`Date\` becomes an ISO-8601 string, \`Map\` becomes an object, amounts are always decimal strings, and \`EdgeTokenId\` is JSON \`null\` for a native asset.

**Testing.** Always pass \`-t\` / \`--test\` to point at the \`*-tester.edge.app\` servers.`
  )}</div>
${body}
<h2 id="errors">Error codes</h2>
${errorSection}
<h2 id="exit-codes">CLI exit codes</h2>
${exitSection}
</main>
</div>
<script>
const q = document.getElementById('q')
const links = [...document.querySelectorAll('nav a.e[data-s]')]
q.addEventListener('input', () => {
  const v = q.value.trim().toLowerCase()
  for (const a of links) a.classList.toggle('hidden', v !== '' && !a.dataset.s.includes(v))
  for (const g of document.querySelectorAll('nav .g')) {
    let el = g.nextElementSibling, any = false
    while (el != null && el.classList.contains('e')) {
      if (!el.classList.contains('hidden')) any = true
      el = el.nextElementSibling
    }
    g.classList.toggle('hidden', !any)
  }
  // A section heading outlives its groups unless it is hidden too.
  for (const sec of document.querySelectorAll('nav .s')) {
    let el = sec.nextElementSibling, any = false
    while (el != null && !el.classList.contains('s')) {
      if (el.classList.contains('e') && !el.classList.contains('hidden')) any = true
      el = el.nextElementSibling
    }
    sec.classList.toggle('hidden', !any)
  }
})
</script>
</body></html>`
}

// ---------------------------------------------------------------------- main

fs.mkdirSync(OUT, { recursive: true })
const spec = buildOpenApi()
const html = buildHtml()
const wroteJson = writeIfChanged(
  path.join(OUT, 'openapi.json'),
  JSON.stringify(spec, null, 2) + '\n'
)
const wroteHtml = writeIfChanged(path.join(OUT, 'index.html'), html)

const count = groups.reduce((n, g) => n + g.endpoints.length, 0)
console.log(`✓ ${count} calls in ${groups.length} groups`)
console.log(
  `  ${wroteJson ? 'wrote' : 'unchanged'} docs/api/dist/openapi.json  ${
    (JSON.stringify(spec).length / 1024) | 0
  } KB`
)
console.log(
  `  ${wroteHtml ? 'wrote' : 'unchanged'} docs/api/dist/index.html    ${
    (html.length / 1024) | 0
  } KB`
)

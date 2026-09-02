/**
 * Compiles docs/api into:
 *
 *   docs/api/dist/openapi.json   OpenAPI 3.1, with an `x-cli` extension
 *   docs/api/dist/index.html     self-contained human-readable reference
 *
 *   node -r sucrase/register scripts/buildApiDocs.ts
 *
 * The HTML puts the command line first and the REST call second for every
 * entry, which is the whole point of the format: the two are one thing seen
 * from two directions, not two documents to keep in sync.
 */
import fs from 'fs'
import { marked } from 'marked'
import path from 'path'

import { groups } from '../docs/api'
import type { Field, Schema } from '../docs/api/schema'
import { CLI_EXIT_CODES, errorCodes, schemas } from '../docs/api/shared'
import type { Endpoint } from '../docs/api/types'

const OUT = path.resolve(__dirname, '../docs/api/dist')
const API_VERSION = '1.0.0'

// ------------------------------------------------------------------ helpers

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Inline markdown (no wrapping <p>), for table cells and one-liners. */
function md(text: string | undefined): string {
  if (text == null || text === '') return ''
  return marked.parseInline(text) as string
}

/** Block markdown, for descriptions. */
function mdBlock(text: string | undefined): string {
  if (text == null || text === '') return ''
  return marked.parse(text) as string
}

// ------------------------------------------------------------- JSON Schema

function toJsonSchema(schema: Schema): Record<string, unknown> {
  switch (schema.kind) {
    case 'string': {
      const out: Record<string, unknown> = { type: 'string' }
      if (schema.enum != null) out.enum = schema.enum
      if (schema.format != null) out.format = schema.format
      if (schema.example != null) out.examples = [schema.example]
      return out
    }
    case 'number': {
      const out: Record<string, unknown> = {
        type: schema.integer === true ? 'integer' : 'number'
      }
      if (schema.example != null) out.examples = [schema.example]
      return out
    }
    case 'boolean':
      return { type: 'boolean' }
    case 'null':
      return { type: 'null' }
    case 'unknown':
      return schema.note != null ? { description: schema.note } : {}
    case 'array':
      return { type: 'array', items: toJsonSchema(schema.items) }
    case 'map':
      return {
        type: 'object',
        additionalProperties: toJsonSchema(schema.values)
      }
    case 'ref':
      return { $ref: `#/components/schemas/${schema.name}` }
    case 'union':
      return { oneOf: schema.of.map(toJsonSchema) }
    case 'core':
      return {
        description: `\`${schema.name}\` from edge-core-js${
          schema.note != null ? ` — ${schema.note}` : ''
        }`
      }
    case 'object': {
      const properties: Record<string, unknown> = {}
      const required: string[] = []
      for (const field of schema.fields) {
        // Spread markers (`…Session`) document composition, not a real key.
        if (field.name.startsWith('…')) continue
        let inner = toJsonSchema(field.schema)
        if (field.nullable === true)
          inner = { anyOf: [inner, { type: 'null' }] }
        if (field.doc != null) inner = { ...inner, description: field.doc }
        properties[field.name] = inner
        if (field.optional !== true) required.push(field.name)
      }
      const out: Record<string, unknown> = { type: 'object', properties }
      if (required.length > 0) out.required = required
      if (schema.open !== true) out.additionalProperties = false
      return out
    }
  }
}

// ------------------------------------------------------------- HTML schema

function typeLabel(schema: Schema): string {
  switch (schema.kind) {
    case 'string':
      return schema.enum != null
        ? schema.enum.map(v => `<code>${esc(v)}</code>`).join(' | ')
        : schema.format === 'date-time'
        ? '<span class="t">string</span> <span class="dim">(ISO-8601)</span>'
        : schema.format === 'byte'
        ? '<span class="t">string</span> <span class="dim">(base64)</span>'
        : '<span class="t">string</span>'
    case 'number':
      return `<span class="t">${
        schema.integer === true ? 'integer' : 'number'
      }</span>`
    case 'boolean':
      return '<span class="t">boolean</span>'
    case 'null':
      return '<span class="t">null</span>'
    case 'unknown':
      return '<span class="t">any</span>'
    case 'array':
      return `${typeLabel(schema.items)}<span class="t">[]</span>`
    case 'map':
      return `<span class="t">{ [key]: </span>${typeLabel(
        schema.values
      )}<span class="t"> }</span>`
    case 'ref':
      return `<a class="ref" href="#schema-${schema.name}">${schema.name}</a>`
    case 'union':
      return schema.of.map(typeLabel).join(' <span class="dim">or</span> ')
    case 'core':
      return `<span class="t core" title="edge-core-js type">${esc(
        schema.name
      )}</span>`
    case 'object':
      return '<span class="t">object</span>'
  }
}

function fieldRows(fields: Field[], depth = 0): string {
  return fields
    .map(field => {
      const flags: string[] = []
      if (field.optional === true)
        flags.push('<span class="flag opt">optional</span>')
      if (field.nullable === true)
        flags.push('<span class="flag null">nullable</span>')
      const nested =
        field.schema.kind === 'object'
          ? fieldRows(field.schema.fields, depth + 1)
          : field.schema.kind === 'array' &&
            field.schema.items.kind === 'object'
          ? fieldRows(field.schema.items.fields, depth + 1)
          : ''
      return `<tr class="d${depth}">
  <td class="k"><code>${esc(field.name)}</code></td>
  <td class="ty">${typeLabel(field.schema)} ${flags.join(' ')}</td>
  <td class="doc">${md(field.doc)}</td>
</tr>${nested}`
    })
    .join('\n')
}

function schemaBlock(schema: Schema): string {
  if (schema.kind === 'object') {
    return `<table class="fields"><tbody>${fieldRows(
      schema.fields
    )}</tbody></table>`
  }
  if (schema.kind === 'array' && schema.items.kind === 'object') {
    return `<p class="lead">Array of:</p><table class="fields"><tbody>${fieldRows(
      schema.items.fields
    )}</tbody></table>`
  }
  if (schema.kind === 'union') {
    return schema.of
      .map(
        (one, i) =>
          `<p class="lead">Form ${i + 1} — ${typeLabel(one)}</p>${schemaBlock(
            one
          )}`
      )
      .join('')
  }
  return `<p class="lead">${typeLabel(schema)}</p>`
}

// -------------------------------------------------- TypeScript + examples

/** Render a schema as TypeScript, expanding named refs one level deep. */
function toTypeScript(schema: Schema, indent = 0, seen: string[] = []): string {
  const pad = '  '.repeat(indent + 1)
  const close = '  '.repeat(indent)
  switch (schema.kind) {
    case 'string':
      return schema.enum != null
        ? schema.enum.map(v => `'${v}'`).join(' | ')
        : 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'null':
      return 'null'
    case 'unknown':
      return 'unknown'
    case 'core':
      return schema.name
    case 'array': {
      const inner = toTypeScript(schema.items, indent, seen)
      return inner.includes('\n') ? `Array<${inner}>` : `${inner}[]`
    }
    case 'map':
      return `{ [key: string]: ${toTypeScript(schema.values, indent, seen)} }`
    case 'union':
      return schema.of.map(one => toTypeScript(one, indent, seen)).join(' | ')
    case 'ref': {
      // Expand a named shape once, then fall back to the name to stay finite.
      if (seen.includes(schema.name)) return schema.name
      const named = schemas.find(n => n.name === schema.name)
      if (named == null) return schema.name
      return toTypeScript(named.schema, indent, [...seen, schema.name])
    }
    case 'object': {
      const lines = schema.fields
        .filter(field => !field.name.startsWith('…'))
        .map(field => {
          const opt = field.optional === true ? '?' : ''
          let type = toTypeScript(field.schema, indent + 1, seen)
          if (field.nullable === true) type = `${type} | null`
          return `${pad}${field.name}${opt}: ${type}`
        })
      // Spread markers mean "every field of X", so inline that shape too.
      const spreads = schema.fields
        .filter(
          field => field.name.startsWith('…') && field.schema.kind === 'ref'
        )
        .map(field => {
          const name = (field.schema as { name: string }).name
          const named = schemas.find(n => n.name === name)
          if (named == null || named.schema.kind !== 'object') return []
          return named.schema.fields.map(inner => {
            const opt = inner.optional === true ? '?' : ''
            let type = toTypeScript(inner.schema, indent + 1, [...seen, name])
            if (inner.nullable === true) type = `${type} | null`
            return `${pad}${inner.name}${opt}: ${type}`
          })
        })
        .flat()
      const all = [...spreads, ...lines]
      if (all.length === 0) return '{}'
      return `{\n${all.join('\n')}\n${close}}`
    }
  }
}

/** Synthesize an example value, preferring the `example` on each primitive. */
function toExample(schema: Schema, seen: string[] = []): unknown {
  switch (schema.kind) {
    case 'string':
      if (schema.example != null) return schema.example
      if (schema.enum != null) return schema.enum[0]
      if (schema.format === 'date-time') return '2026-09-02T16:35:00.000Z'
      if (schema.format === 'byte') return 'aGVsbG8='
      return 'string'
    case 'number':
      return schema.example ?? (schema.integer === true ? 0 : 0)
    case 'boolean':
      return true
    case 'null':
      return null
    case 'unknown':
      return {}
    case 'core':
      return `<${schema.name}>`
    case 'array':
      return [toExample(schema.items, seen)]
    case 'map':
      return { key: toExample(schema.values, seen) }
    case 'union':
      return toExample(schema.of[0], seen)
    case 'ref': {
      if (seen.includes(schema.name)) return `<${schema.name}>`
      const named = schemas.find(n => n.name === schema.name)
      if (named == null) return `<${schema.name}>`
      return toExample(named.schema, [...seen, schema.name])
    }
    case 'object': {
      const out: Record<string, unknown> = {}
      for (const field of schema.fields) {
        if (field.name.startsWith('…')) {
          const inner = toExample(field.schema, seen)
          if (inner != null && typeof inner === 'object') {
            Object.assign(out, inner)
          }
          continue
        }
        out[field.name] =
          field.nullable === true && field.optional === true
            ? null
            : toExample(field.schema, seen)
      }
      return out
    }
  }
}

/** Type + example + field table, the three views of one shape. */
function shapeBlock(schema: Schema, label: string): string {
  const ts = toTypeScript(schema)
  const example = JSON.stringify(toExample(schema), null, 2)
  return `<div class="shape">
    <div class="shape-h">${esc(label)}</div>
    <pre class="ts"><code>${esc(ts)}</code></pre>
    <details><summary>Example</summary><pre class="json"><code>${esc(
      example
    )}</code></pre></details>
    ${schemaBlock(schema)}
  </div>`
}

// ------------------------------------------------------------ endpoint HTML

function cliBlock(e: Endpoint): string {
  if (e.cli.length === 0) {
    return `<div class="pane cli none">
      <h4>Command line</h4>
      <p class="dim">No <code>edge-cli</code> command. REST only.</p>
    </div>`
  }
  const blocks = e.cli
    .map(c => {
      const flags =
        c.flags == null || c.flags.length === 0
          ? ''
          : `<table class="flags"><thead><tr><th>Flag</th><th>Becomes</th><th></th></tr></thead><tbody>${c.flags
              .map(
                fl =>
                  `<tr><td><code>${esc(fl.flag)}</code></td><td><code>${esc(
                    fl.maps
                  )}</code> <span class="dim">${
                    fl.target
                  }</span></td><td class="doc">${md(fl.doc)}</td></tr>`
              )
              .join('')}</tbody></table>`
      return `<div class="cmd">
        ${c.summary != null ? `<p class="lead">${md(c.summary)}</p>` : ''}
        <pre class="usage"><code>${esc(c.usage)}</code></pre>
        ${flags}
        ${
          c.example != null
            ? `<pre class="ex"><code>$ ${esc(c.example)}</code></pre>`
            : ''
        }
        ${c.notes != null ? `<div class="note">${mdBlock(c.notes)}</div>` : ''}
      </div>`
    })
    .join('')
  return `<div class="pane cli"><h4>Command line</h4>${blocks}</div>`
}

function curlFor(e: Endpoint): string {
  const p = e.path
    .replace('{sessionId}', '$SESS')
    .replace('{walletId}', '$WID')
    .replace(/\{(\w+)\}/g, (_m, n) => `$${String(n).toUpperCase()}`)
  const q = (e.query ?? []).filter(x => x.required === true)
  const qs = q.length > 0 ? '?' + q.map(x => `${x.name}=…`).join('&') : ''
  const lines = ['curl --unix-socket "$SOCK" \\']
  if (e.method !== 'GET') lines.push(`  -X ${e.method} \\`)
  if (e.body != null && e.method !== 'GET') {
    lines.push(`  -H 'Content-Type: application/json' \\`)
    lines.push(`  -d '{…}' \\`)
  }
  lines.push(`  'http://localhost${p}${qs}'`)
  return lines.join('\n')
}

function restBlock(e: Endpoint): string {
  const params = [...(e.pathParams ?? [])]
  const paramTable =
    params.length === 0
      ? ''
      : `<h5>Path</h5><table class="fields"><tbody>${params
          .map(
            p =>
              `<tr><td class="k"><code>${esc(
                p.name
              )}</code></td><td class="ty">${typeLabel(
                p.schema
              )}</td><td class="doc">${md(p.doc)}</td></tr>`
          )
          .join('')}</tbody></table>`
  const queryTable =
    e.query == null || e.query.length === 0
      ? ''
      : `<h5>Query</h5><table class="fields"><tbody>${e.query
          .map(q => {
            const flags = [
              q.required === true
                ? '<span class="flag req">required</span>'
                : '<span class="flag opt">optional</span>',
              q.default != null
                ? `<span class="flag def">default ${esc(q.default)}</span>`
                : ''
            ]
              .filter(Boolean)
              .join(' ')
            return `<tr><td class="k"><code>${esc(
              q.name
            )}</code></td><td class="ty">${typeLabel(
              q.schema
            )} ${flags}</td><td class="doc">${md(q.doc)}</td></tr>`
          })
          .join('')}</tbody></table>`
  const bodyBlock =
    e.body == null
      ? ''
      : `<h5>Body</h5>${
          e.bodyDoc != null
            ? `<div class="note">${mdBlock(e.bodyDoc)}</div>`
            : ''
        }${
          e.body.kind === 'object' && e.body.fields.length === 0
            ? ''
            : shapeBlock(e.body, 'Request body')
        }`
  return `<div class="pane rest">
    <h4>REST</h4>
    <p class="route"><span class="m m-${e.method}">${
    e.method
  }</span><code>${esc(e.path)}</code></p>
    ${paramTable}
    ${queryTable}
    ${bodyBlock}
    <h5>Example</h5>
    <pre class="ex"><code>${esc(curlFor(e))}</code></pre>
  </div>`
}

function responseBlock(e: Endpoint): string {
  const status = e.success.status
  const body =
    status === 204
      ? '<p class="lead dim">No body.</p>'
      : `${
          e.success.doc != null
            ? `<div class="note">${mdBlock(e.success.doc)}</div>`
            : ''
        }${
          e.success.schema != null
            ? shapeBlock(e.success.schema, 'Response body')
            : ''
        }`
  const errs =
    e.errors == null || e.errors.length === 0
      ? ''
      : `<h5>Errors</h5><p class="errs">${e.errors
          .map(code => {
            const known = errorCodes.find(x => x.code === code)
            return `<a href="#err-${code}" class="err" title="${esc(
              known?.doc ?? ''
            )}"><span class="st">${known?.status ?? '?'}</span>${code}</a>`
          })
          .join(' ')}</p>`
  return `<div class="pane resp">
    <h4>Response <span class="st ok">${status}</span></h4>
    ${body}
    ${errs}
  </div>`
}

/** The edge-core-js call an endpoint fronts, or why there isn't one. */
function coreLine(e: Endpoint): string {
  if (e.coreCall == null) {
    return `<p class="core none"><span class="lbl">core</span><em>${md(
      e.coreNote ?? 'No direct core call.'
    )}</em></p>`
  }
  const note =
    e.coreNote != null ? ` <span class="dim">${md(e.coreNote)}</span>` : ''
  return `<p class="core"><span class="lbl">core</span><code>${esc(
    e.coreCall
  )}</code>${note}</p>`
}

function endpointHtml(e: Endpoint): string {
  const names =
    e.cli.length > 0
      ? [...new Set(e.cli.map(c => c.command))]
          .map(c => `<code class="cmdname">${esc(c)}</code>`)
          .join(' ')
      : '<span class="restonly">REST only</span>'
  const notes =
    e.notes == null || e.notes.length === 0
      ? ''
      : `<div class="pane notes"><h4>Notes</h4><ul>${e.notes
          .map(n => `<li>${md(n)}</li>`)
          .join('')}</ul></div>`
  return `<section class="endpoint" id="${e.id}">
    <header>
      <h3><a href="#${e.id}">${esc(e.summary)}</a></h3>
      <div class="ids">${names}<span class="src" title="Implemented in">${esc(
    e.source
  )}</span></div>
    </header>
    ${coreLine(e)}
    ${
      e.description != null
        ? `<div class="desc">${mdBlock(e.description)}</div>`
        : ''
    }
    <div class="panes">
      ${cliBlock(e)}
      ${restBlock(e)}
    </div>
    ${responseBlock(e)}
    ${notes}
  </section>`
}

// ------------------------------------------------------------------- OpenAPI

function buildOpenApi(): Record<string, unknown> {
  const paths: Record<string, Record<string, unknown>> = {}
  for (const g of groups) {
    for (const e of g.endpoints) {
      const coreMd =
        e.coreCall != null
          ? `**Core call:** \`${e.coreCall}\`\n\n`
          : `**Core call:** _none — ${e.coreNote ?? ''}_\n\n`
      const cliMd =
        e.cli.length > 0
          ? '**Command line**\n\n' +
            e.cli.map(c => '```\n' + c.usage + '\n```').join('\n') +
            '\n\n'
          : '_No `edge-cli` command; REST only._\n\n'
      const op: Record<string, unknown> = {
        operationId: e.id,
        summary: e.summary,
        // CLI first, so any standard viewer shows it above the request.
        description: coreMd + cliMd + (e.description ?? ''),
        tags: [g.title],
        'x-cli': e.cli,
        'x-core-call': e.coreCall,
        'x-core-note': e.coreNote,
        'x-source': e.source,
        parameters: [
          ...(e.pathParams ?? []).map(p => ({
            name: p.name,
            in: 'path',
            required: true,
            description: p.doc,
            schema: toJsonSchema(p.schema)
          })),
          ...(e.query ?? []).map(q => ({
            name: q.name,
            in: 'query',
            required: q.required === true,
            description:
              (q.doc ?? '') +
              (q.default != null ? ` Default: \`${q.default}\`.` : ''),
            schema: toJsonSchema(q.schema)
          }))
        ],
        responses: {
          [String(e.success.status)]:
            e.success.status === 204
              ? { description: e.success.doc ?? 'No content.' }
              : {
                  description: e.success.doc ?? 'Success.',
                  content: {
                    'application/json': {
                      schema:
                        e.success.schema != null
                          ? toJsonSchema(e.success.schema)
                          : {}
                    }
                  }
                },
          default: {
            description:
              (e.errors ?? []).length > 0
                ? (e.errors ?? []).join(', ')
                : 'Error.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorEnvelope' }
              }
            }
          }
        }
      }
      if (e.body != null) {
        op.requestBody = {
          required: true,
          description: e.bodyDoc,
          content: { 'application/json': { schema: toJsonSchema(e.body) } }
        }
      }
      paths[e.path] = paths[e.path] ?? {}
      paths[e.path][e.method.toLowerCase()] = op
    }
  }

  const components: Record<string, unknown> = {}
  for (const named of schemas) {
    components[named.name] = {
      description: named.doc,
      ...toJsonSchema(named.schema)
    }
  }

  return {
    openapi: '3.1.0',
    info: {
      title: 'Edge CLI',
      version: API_VERSION,
      description:
        'The `edge-cli` command line and the `edge-engine` JSON REST API, documented together. Every operation carries an `x-cli` extension naming the command that drives it.'
    },
    servers: [
      {
        url: 'http://localhost',
        description: 'Unix socket at ~/.edge-cli/run/<profile>/engine.sock'
      },
      {
        url: 'http://127.0.0.1:9008',
        description: 'Loopback TCP, when started with --tcp=9008'
      }
    ],
    tags: groups.map(g => ({ name: g.title, description: g.doc })),
    paths,
    components: { schemas: components }
  }
}

// ---------------------------------------------------------------------- CSS

const CSS = `
:root {
  --bg: #fff; --fg: #16181d; --dim: #6b7280; --line: #e5e7eb; --card: #fafafa;
  --accent: #2563eb; --code: #f3f4f6; --warn: #b45309; --ok: #047857;
  --mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0d1117; --fg: #e6edf3; --dim: #8b949e; --line: #262c36; --card: #131920;
    --accent: #6ea8ff; --code: #1a212b; --warn: #d29922; --ok: #3fb950;
  }
}
* { box-sizing: border-box; }
body {
  margin: 0; background: var(--bg); color: var(--fg);
  font: 15px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
}
code, pre { font-family: var(--mono); font-size: 13px; }
code { background: var(--code); padding: 1px 5px; border-radius: 4px; }
pre { background: var(--code); padding: 12px 14px; border-radius: 8px; overflow-x: auto; margin: 8px 0; }
pre code { background: none; padding: 0; }
a { color: var(--accent); text-decoration: none; }
a:hover { text-decoration: underline; }

.layout { display: flex; align-items: flex-start; }
nav {
  position: sticky; top: 0; height: 100vh; overflow-y: auto; flex: 0 0 270px;
  border-right: 1px solid var(--line); padding: 20px 12px 60px;
}
nav h1 { font-size: 15px; margin: 0 8px 4px; }
nav .ver { font-size: 12px; color: var(--dim); margin: 0 8px 14px; }
nav input {
  width: 100%; padding: 7px 10px; margin-bottom: 14px; font: inherit; font-size: 13px;
  border: 1px solid var(--line); border-radius: 7px; background: var(--bg); color: var(--fg);
}
nav .g { font-size: 11px; text-transform: uppercase; letter-spacing: .07em; color: var(--dim);
  margin: 16px 8px 5px; font-weight: 600; }
nav a.e { display: block; padding: 3px 8px; border-radius: 5px; font-size: 13px; color: var(--fg); }
nav a.e:hover { background: var(--card); text-decoration: none; }
nav a.e code { background: none; padding: 0; color: var(--accent); }
nav a.e .restonly { color: var(--dim); font-style: italic; font-size: 12px; }

main { flex: 1 1 auto; min-width: 0; padding: 32px 40px 120px; max-width: 1000px; }
h2 { font-size: 22px; margin: 48px 0 6px; padding-top: 14px; border-top: 1px solid var(--line); }
h2:first-of-type { border-top: none; margin-top: 8px; }
.groupdoc { color: var(--dim); margin: 0 0 8px; }

.endpoint { border: 1px solid var(--line); border-radius: 12px; padding: 18px 20px;
  margin: 18px 0; background: var(--card); }
.endpoint header { display: flex; flex-wrap: wrap; align-items: baseline;
  justify-content: space-between; gap: 8px; }
.endpoint h3 { font-size: 17px; margin: 0; }
.endpoint h3 a { color: var(--fg); }
.ids { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.cmdname { background: var(--accent); color: #fff; font-weight: 600; }
.restonly { color: var(--dim); font-style: italic; font-size: 12px; }
.src { color: var(--dim); font-size: 11px; font-family: var(--mono); }
.shape { margin: 6px 0; }
.shape-h { font: 600 10px var(--mono); text-transform: uppercase; letter-spacing: .06em;
  color: var(--dim); margin-bottom: 4px; }
pre.ts { background: var(--code); border-left: 3px solid var(--accent); }
pre.json { background: transparent; border: 1px dashed var(--line); }
.shape details { margin: 6px 0; }
.shape summary { cursor: pointer; font-size: 12px; color: var(--dim); user-select: none; }
.shape summary:hover { color: var(--accent); }
.core { margin: 8px 0 2px; font-size: 13px; display: flex; align-items: baseline;
  gap: 8px; flex-wrap: wrap; }
.core .lbl { font: 600 10px var(--mono); text-transform: uppercase; letter-spacing: .06em;
  color: var(--dim); border: 1px solid var(--line); border-radius: 3px; padding: 1px 5px; }
.core code { color: var(--ok); }
.core.none em { color: var(--dim); font-style: italic; }
.desc { margin: 8px 0 4px; }
.desc p { margin: 6px 0; }

.panes { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 14px; }
@media (max-width: 900px) { .panes { grid-template-columns: 1fr; } }
.pane { background: var(--bg); border: 1px solid var(--line); border-radius: 9px; padding: 12px 14px; }
.pane h4 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase;
  letter-spacing: .07em; color: var(--dim); }
.pane h5 { margin: 12px 0 4px; font-size: 12px; color: var(--dim); font-weight: 600; }
.pane.resp, .pane.notes { margin-top: 16px; }
.pane.cli.none p { margin: 0; }
.cmd + .cmd { margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--line); }
.usage { background: var(--code); }
.ex { background: transparent; border: 1px dashed var(--line); }
.lead { margin: 4px 0; color: var(--dim); font-size: 13px; }
.note { font-size: 13px; }
.note p { margin: 4px 0; }
.pane.notes ul { margin: 0; padding-left: 20px; }
.pane.notes li { margin: 5px 0; }

.route { margin: 0 0 4px; display: flex; align-items: center; gap: 8px; }
.m { font: 600 11px var(--mono); padding: 2px 7px; border-radius: 4px; color: #fff; }
.m-GET { background: #2563eb; } .m-POST { background: #047857; }
.m-PUT { background: #b45309; } .m-PATCH { background: #7c3aed; }
.m-DELETE { background: #b91c1c; }

table { border-collapse: collapse; width: 100%; margin: 4px 0; }
table.fields td, table.flags td, table.flags th { padding: 4px 8px 4px 0;
  vertical-align: top; font-size: 13px; border-bottom: 1px solid var(--line); }
table.flags th { text-align: left; font-size: 11px; color: var(--dim); text-transform: uppercase; }
td.k { white-space: nowrap; width: 1%; }
td.ty { white-space: nowrap; width: 1%; }
td.doc { color: var(--dim); }
tr.d1 td.k { padding-left: 18px; } tr.d2 td.k { padding-left: 36px; }
.t { color: var(--dim); font-family: var(--mono); font-size: 12px; }
.t.core { color: var(--warn); border-bottom: 1px dotted var(--warn); cursor: help; }
.dim { color: var(--dim); }
.ref { font-family: var(--mono); font-size: 12px; }
.flag { font-size: 10px; padding: 1px 5px; border-radius: 3px; border: 1px solid var(--line);
  color: var(--dim); text-transform: uppercase; letter-spacing: .04em; }
.flag.req { color: var(--warn); border-color: var(--warn); }
.st { font: 600 11px var(--mono); padding: 1px 6px; border-radius: 4px;
  background: var(--code); margin-right: 5px; }
.st.ok { color: var(--ok); }
.errs { display: flex; flex-wrap: wrap; gap: 6px; margin: 4px 0; }
a.err { font: 12px var(--mono); border: 1px solid var(--line); border-radius: 5px;
  padding: 2px 7px; color: var(--fg); }
a.err:hover { border-color: var(--accent); text-decoration: none; }

.schema { border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; margin: 14px 0;
  background: var(--card); }
.schema h3 { margin: 0 0 2px; font-size: 15px; font-family: var(--mono); }
.schema .src { display: block; margin-bottom: 6px; }
.hidden { display: none; }
`

// --------------------------------------------------------------------- HTML

function buildHtml(): string {
  const nav = groups
    .map(
      g =>
        `<div class="g">${esc(g.title)}</div>` +
        g.endpoints
          .map(e => {
            const label =
              e.cli.length > 0
                ? `<code>${esc(
                    [...new Set(e.cli.map(c => c.command))].join(', ')
                  )}</code>`
                : `<span class="restonly">${esc(e.summary)}</span>`
            return `<a class="e" href="#${e.id}" data-s="${esc(
              (
                e.summary +
                ' ' +
                e.path +
                ' ' +
                e.cli.map(c => c.command).join(' ')
              ).toLowerCase()
            )}">${label}</a>`
          })
          .join('')
    )
    .join('')

  const body = groups
    .map(
      g => `<h2 id="${g.id}">${esc(g.title)}</h2>
      ${g.doc != null ? `<div class="groupdoc">${mdBlock(g.doc)}</div>` : ''}
      ${g.endpoints.map(endpointHtml).join('')}`
    )
    .join('')

  const schemaSection = schemas
    .map(
      n => `<div class="schema" id="schema-${n.name}">
      <h3>${esc(n.name)}</h3>
      ${n.source != null ? `<span class="src">${esc(n.source)}</span>` : ''}
      <div class="note">${mdBlock(n.doc)}</div>
      ${shapeBlock(n.schema, n.name)}
    </div>`
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
  <a class="e" href="#schemas">Shared shapes</a>
  <a class="e" href="#errors">Error codes</a>
  <a class="e" href="#exit-codes">Exit codes</a>
</nav>
<main>
<h2 id="overview">Overview</h2>
<div class="groupdoc">${mdBlock(
    `Every entry below is one API call shown twice: as an \`edge-cli\` command, then as the JSON REST request that command sends. They are generated from a single definition in \`docs/api/\`, so the two forms cannot drift apart.

Routes are named after the \`edge-core-js\` call they front, kebab-cased: \`context.forgetAccount\` becomes \`POST /forget-account\`, and the command is \`forget-account\`. Parameters carry core's own names. Every entry states its core call, or says why there is none. Only \`GET\` and \`POST\` appear — core has no HTTP verbs, so reads are GET and everything else is POST.

The \`edge-cli\` client is a thin one-shot process. A long-lived \`edge-engine\` daemon owns the \`EdgeContext\` and every logged-in account, and serves this API over a Unix socket at \`~/.edge-cli/run/<profile>/engine.sock\` — plus loopback TCP when started with \`--tcp=9008\`.

**There is no transport authentication.** The socket is owner-only (\`0600\`) and TCP is loopback, so anything that can reach the engine can act as every logged-in account. Edge credentials are still enforced by the login server; the \`sessionId\` only scopes calls afterwards.

Request bodies must be \`application/json\` (\`415\` otherwise) and are capped at 4 MiB (\`413\`). Every response carries \`X-Edge-Api-Version: ${API_VERSION}\`. Success bodies are bare JSON — never wrapped in \`{ data: … }\` — and only ever \`200\` or \`204\`; the engine emits no other success status. Failures use the [ErrorEnvelope](#schema-ErrorEnvelope) shape.

<a id="object-handles"></a>
**Ephemeral object handles.** In \`edge-core-js\` a method-bearing value is identified by object reference — you call \`wallet.signTx(tx)\` on the very \`tx\` that \`makeSpend\` returned. That does not survive HTTP, so the engine parks such values under an \`objectId\` with a 5 minute TTL and later steps name the id. Reads do not extend the TTL; only a step that updates the value does. Finishing a workflow, or \`POST …/objects/{objectId}/delete\`, releases the handle early and runs its cleanup. Expired handles return \`410 OBJECT_EXPIRED\`.

**Serialization.** \`Uint8Array\` becomes base64, \`Date\` becomes an ISO-8601 string, \`Map\` becomes an object, amounts are always decimal strings, and \`EdgeTokenId\` is JSON \`null\` for a native asset — the literal string \`null\` in a path segment.

**Testing.** Always pass \`-t\` / \`--test\` to point at the \`*-tester.edge.app\` servers. Confirm with \`edge-cli engine-config\` before a test run.`
  )}</div>
${body}
<h2 id="schemas">Shared shapes</h2>
<div class="groupdoc">${mdBlock(
    'Shapes the engine reuses across many routes. A change here propagates to every endpoint that references it.'
  )}</div>
${schemaSection}
<h2 id="errors">Error codes</h2>
<div class="groupdoc">${mdBlock(
    'Engine codes come from `engineError`; core codes are mapped from `edge-core-js` error types. Both use the same [ErrorEnvelope](#schema-ErrorEnvelope).'
  )}</div>
${errorSection}
<h2 id="exit-codes">CLI exit codes</h2>
<div class="groupdoc">${mdBlock(
    'The `edge-cli` process exit status. Errors are written to stderr as a single JSON object, never as prose.'
  )}</div>
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
})
</script>
</body></html>`
}

// ---------------------------------------------------------------------- main

fs.mkdirSync(OUT, { recursive: true })
const spec = buildOpenApi()
fs.writeFileSync(
  path.join(OUT, 'openapi.json'),
  JSON.stringify(spec, null, 2) + '\n'
)
fs.writeFileSync(path.join(OUT, 'index.html'), buildHtml())

const count = groups.reduce((n, g) => n + g.endpoints.length, 0)
console.log(`✓ ${count} calls in ${groups.length} groups`)
console.log(
  `  docs/api/dist/openapi.json  ${(JSON.stringify(spec).length / 1024) | 0} KB`
)
console.log(
  `  docs/api/dist/index.html    ${(buildHtml().length / 1024) | 0} KB`
)

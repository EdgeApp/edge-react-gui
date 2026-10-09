'use strict'
/**
 * The CLI's value-import graph, walked from a set of entry points.
 *
 * Shared, because three things need the same answer and had no way to agree:
 * `scripts/buildCliManifest.ts` derives the published dependency list from
 * it, `scripts/cliNodeSafeSmoke.js` loads what it names under a poisoned
 * `react-native`, and `cliGatePaths.js` promises that the modules the smoke
 * test loads are the modules the CLI reaches. The third promise was the one
 * nobody could check: `SHARED_MODULES` is hand-written, and
 * `src/util/PeriodicTask.ts` — a value import of `src/cli/engine/
 * sweepTicker.ts`, which both `SessionStore` and `ObjectHandleStore` run —
 * sat outside it.
 *
 * CommonJS JavaScript, because the smoke test runs under plain Node with no
 * sucrase. `typescript` is a dev dependency and loads fine there.
 */

const fs = require('fs')
const path = require('path')
const { builtinModules } = require('module')
const ts = require('typescript')

const ROOT = path.resolve(__dirname, '../..')

/** The CLI's two entry points, repo-relative. */
const CLI_ENTRIES = ['src/cli/index.ts', 'src/cli/engine/index.ts']

/** Extensions tried when resolving a relative specifier, in order. */
const EXTENSIONS = [
  '',
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.json',
  '/index.ts',
  '/index.tsx',
  '/index.js'
]

const BUILTINS = new Set([
  ...builtinModules,
  ...builtinModules.map(m => `node:${m}`)
])

/**
 * The package a specifier belongs to.
 *
 * `csv-stringify/lib/browser/sync` is a subpath of `csv-stringify`, and a
 * scoped package keeps two segments. Declaring the subpath instead of the
 * package would be an unresolvable dependency name.
 */
function packageOf(specifier) {
  const parts = specifier.split('/')
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

function resolveRelative(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier)
  for (const extension of EXTENSIONS) {
    const candidate = base + extension
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate
    }
  }
  return null
}

/** Every module specifier a file imports *as a value*. */
function valueSpecifiers(file) {
  const text = fs.readFileSync(file, 'utf8')
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )
  const out = []

  const add = node => {
    if (node != null && ts.isStringLiteral(node)) out.push(node.text)
  }

  const visit = node => {
    if (ts.isImportDeclaration(node)) {
      const clause = node.importClause
      // No clause at all is a side-effect import, which is a value import:
      // `import './commands/all'` is how every command registers itself.
      const typeOnly =
        clause != null &&
        (clause.isTypeOnly ||
          (clause.name == null &&
            clause.namedBindings != null &&
            ts.isNamedImports(clause.namedBindings) &&
            clause.namedBindings.elements.every(e => e.isTypeOnly)))
      if (!typeOnly) add(node.moduleSpecifier)
    } else if (ts.isExportDeclaration(node) && node.moduleSpecifier != null) {
      if (!node.isTypeOnly) add(node.moduleSpecifier)
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === 'require'))
    ) {
      add(node.arguments[0])
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return out
}

/**
 * Every repository module the entries reach, plus the bare packages they
 * require.
 *
 * `modules` is repo-relative and sorted, so it reads as a list and compares
 * as one. An unresolvable relative import throws: in this graph that is
 * either a deleted file or a typo, and both are worth failing on.
 */
function walkGraph(entries) {
  const seen = new Set()
  const bare = new Set()
  const queue = entries.map(e => path.join(ROOT, e))

  while (queue.length > 0) {
    const file = queue.pop()
    if (file == null || seen.has(file)) continue
    seen.add(file)
    // A `.json` import is inlined by `@rollup/plugin-json`, and a `.js` file
    // in this graph is a hand-written shim with no further imports worth
    // following through the TypeScript parser.
    if (!file.endsWith('.ts') && !file.endsWith('.tsx')) continue

    for (const specifier of valueSpecifiers(file)) {
      if (specifier.startsWith('.')) {
        const resolved = resolveRelative(file, specifier)
        if (resolved == null) {
          throw new Error(
            `${path.relative(ROOT, file)} imports "${specifier}", ` +
              'which does not resolve to a file.'
          )
        }
        queue.push(resolved)
      } else if (!BUILTINS.has(specifier)) {
        bare.add(packageOf(specifier))
      }
    }
  }
  return {
    modules: [...seen].map(f => path.relative(ROOT, f)).sort(),
    packages: bare
  }
}

module.exports = {
  BUILTINS,
  CLI_ENTRIES,
  ROOT,
  packageOf,
  valueSpecifiers,
  walkGraph
}

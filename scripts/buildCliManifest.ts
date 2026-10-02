/**
 * Generates `src/cli/generated/npmPackage.json`, the manifest the published
 * CLI package ships.
 *
 * The dependency list is the whole reason this exists. `rollup.config.cli.mjs`
 * externalises `Object.keys(packageJson.dependencies)` — the app's entire
 * runtime dependency set — so the bundles leave every one of them as a bare
 * `require`, while actually needing about a dozen. A hand-written list would
 * be wrong the first time a module gained an import, and the failure mode is
 * the worst kind: `npm install` succeeds and the CLI dies on first run with
 * `Cannot find module`.
 *
 * So the list is read off the module graph, from both entry points, the same
 * way rollup decides what to externalise:
 *
 *   - a bare specifier reachable from either entry, that the app declares in
 *     `dependencies`, is declared: that is exactly the set rollup
 *     externalises, so the bundle will `require` it
 *   - a Node builtin needs no declaration
 *   - anything else rollup resolves and inlines, so declaring it would
 *     install a package the bundle does not load
 *
 * Type-only imports are skipped, because Babel strips them before rollup sees
 * them and a package imported only for its types is not a runtime dependency.
 *
 * The graph over-approximates, deliberately. It does not tree-shake at the
 * symbol level, so it sees imports whose bindings rollup goes on to drop —
 * `uuid`, reached through `src/util/utils.ts`, is in neither bundle. Erring
 * that way is the safe direction: an extra declared package installs and sits
 * unused, where a missing one is an `npm install` that succeeds and a CLI that
 * dies on first run.
 *
 * `--check` turns this into a staleness gate, like the documentation
 * generators: a new import cannot reach a commit while the manifest still
 * describes the old dependency set.
 */
import fs from 'fs'
import { builtinModules } from 'module'
import path from 'path'
import ts from 'typescript'

import { CLI_PACKAGE_FILES, CLI_PACKAGE_META } from '../src/cli/npmMeta'
import { writeIfChanged } from './writeIfChanged'

const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'src/cli/generated/npmPackage.json')
const ENTRIES = ['src/cli/index.ts', 'src/cli/engine/index.ts']

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
function packageOf(specifier: string): string {
  const parts = specifier.split('/')
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

function resolveRelative(fromFile: string, specifier: string): string | null {
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
function valueSpecifiers(file: string): string[] {
  const text = fs.readFileSync(file, 'utf8')
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  )
  const out: string[] = []

  const add = (node: ts.Expression | undefined): void => {
    if (node != null && ts.isStringLiteral(node)) out.push(node.text)
  }

  const visit = (node: ts.Node): void => {
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

/** Walk the graph from the entry points, collecting bare specifiers. */
function collectBarePackages(): { packages: Set<string>; files: number } {
  const seen = new Set<string>()
  const bare = new Set<string>()
  const queue = ENTRIES.map(e => path.join(ROOT, e))

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
  return { packages: bare, files: seen.size }
}

const appPackage = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')
) as {
  version: string
  dependencies: Record<string, string>
  devDependencies: Record<string, string>
}

const { packages, files } = collectBarePackages()

const dependencies: Record<string, string> = {}
const bundled: string[] = []
const undeclared: string[] = []
for (const name of [...packages].sort()) {
  if (appPackage.dependencies[name] != null) {
    // The app's own range, so the CLI installs against what the app is tested
    // with rather than a range nobody has run.
    dependencies[name] = appPackage.dependencies[name]
  } else if (appPackage.devDependencies[name] != null) {
    bundled.push(name)
  } else {
    undeclared.push(name)
  }
}

const meta = CLI_PACKAGE_META
// Lockstep with the app, so there is no second version to bump and a reader
// can tell at a glance which app release a published CLI corresponds to.
const version = appPackage.version
const optionalDependencies: Record<string, string> = {}
for (const native of meta.nativePackages) {
  optionalDependencies[native.name] = version
}

const manifest = {
  $comment:
    'GENERATED FILE — DO NOT EDIT. Produced by scripts/buildCliManifest.ts ' +
    'from src/cli/npmMeta.ts and the module graph under src/cli. ' +
    '`scripts/publishCli.ts` strips this key before publishing. ' +
    'Run `npm run cli:manifest` to regenerate.',
  name: meta.name,
  version,
  description: meta.description,
  keywords: meta.keywords,
  homepage: meta.homepage,
  repository: {
    type: 'git',
    url: meta.repositoryUrl,
    directory: meta.repositoryDirectory
  },
  license: meta.license,
  author: meta.author,
  engines: meta.engines,
  bin: { [meta.binName]: 'edgeCli.js' },
  files: CLI_PACKAGE_FILES,
  dependencies,
  ...(Object.keys(optionalDependencies).length > 0
    ? { optionalDependencies }
    : {})
}

const changed = writeIfChanged(OUT, JSON.stringify(manifest, null, 2) + '\n', {
  why: 'The CLI gained or lost an import, so its npm dependencies moved.',
  run: 'npm run cli:manifest'
})
console.log(
  `${changed ? '✓ wrote' : '· unchanged'} src/cli/generated/npmPackage.json ` +
    `(${
      Object.keys(dependencies).length
    } dependencies from ${files} modules, ` +
    `${bundled.length} bundled)`
)
if (bundled.length > 0) {
  console.log(`  bundled, not declared: ${bundled.join(', ')}`)
}
// When the bundles are built, say which declared packages neither of them
// actually requires. The graph over-approximates on purpose, and that is the
// safe direction — but an unused declaration still installs, and `date-fns`
// alone is 25 MB. It is reached through `src/locales/intl.ts`, whose `format`
// binding no CLI path calls today, so rollup shakes it out; it stays declared
// because the moment a CLI path does call it, a missing declaration is an
// `npm install` that succeeds and a CLI that cannot resolve a module.
const bundles = ['lib/edgeCli.js', 'lib/edgeEngine.js'].map(f =>
  path.join(ROOT, f)
)
if (bundles.every(f => fs.existsSync(f))) {
  const required = new Set<string>()
  for (const file of bundles) {
    const text = fs.readFileSync(file, 'utf8')
    for (const match of text.matchAll(/require\('([^']+)'\)/g)) {
      const specifier = match[1]
      if (specifier.startsWith('.') || BUILTINS.has(specifier)) continue
      required.add(packageOf(specifier))
    }
  }
  const missing = Object.keys(dependencies).filter(n => !required.has(n))
  if (missing.length > 0) {
    console.log(
      `  declared but not required by the built bundles: ${missing.join(', ')}`
    )
  }
  const undeclaredByBundle = [...required].filter(n => dependencies[n] == null)
  if (undeclaredByBundle.length > 0) {
    // This direction is a real defect: the published package could not
    // resolve them.
    console.error(
      `✗ the built bundles require ${undeclaredByBundle.join(', ')}, ` +
        'which the manifest does not declare.'
    )
    process.exit(1)
  }
}

if (undeclared.length > 0) {
  // Not fatal: rollup inlines them, so the published package is fine. It is
  // the *build* that rests on a package nobody declared, resolved only
  // because something else happens to depend on it — so a dependency bump
  // elsewhere can break this bundle with no change here. Worth a line every
  // time rather than a silent pass.
  console.log(
    `  resolved only transitively (declare these if the build should not ` +
      `depend on luck): ${undeclared.join(', ')}`
  )
}

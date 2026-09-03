/**
 * Compare each route's request against the core call it fronts.
 *
 * `verifyApiDocs` only checks that the core member exists by name, which is
 * how `currency-wallets` came to carry a `waitForAll` parameter that
 * `account.currencyWallets` does not have — it is a property, and waiting is a
 * separate method. This resolves the real signature and compares names.
 */
import path from 'path'
import ts from 'typescript'

import { extractRoutes } from './extractRoutes'

const CORE = path.resolve(
  __dirname,
  '../node_modules/edge-core-js/src/types/types.ts'
)

/** Which core interface a `core:` prefix refers to. */
const INTERFACES: Record<string, string> = {
  context: 'EdgeContext',
  account: 'EdgeAccount',
  wallet: 'EdgeCurrencyWallet',
  'account.dataStore': 'EdgeDataStore',
  EdgeSwapQuote: 'EdgeSwapQuote',
  EdgeLoginRequest: 'EdgeLoginRequest',
  EdgePendingEdgeLogin: 'EdgePendingEdgeLogin'
}

const program = ts.createProgram([CORE], {
  target: ts.ScriptTarget.ES2020,
  moduleResolution: ts.ModuleResolutionKind.NodeJs
})
const checker = program.getTypeChecker()
const source = program.getSourceFile(CORE)
if (source == null) throw new Error(`Cannot read ${CORE}`)

/** Every named interface in core's public types. */
const interfaces = new Map<string, ts.InterfaceDeclaration>()
source.forEachChild(node => {
  if (ts.isInterfaceDeclaration(node)) interfaces.set(node.name.text, node)
})

/**
 * Property names a type exposes, for an options object.
 *
 * Primitives are skipped: asking a `string` for its properties yields
 * `charAt`, `toUpperCase` and forty more, none of which is a parameter.
 */
function paramNames(type: ts.Type): Set<string> {
  const out = new Set<string>()
  const objectish =
    (type.flags & ts.TypeFlags.Object) !== 0 ||
    (type.isUnionOrIntersection() &&
      type.types.some(t => (t.flags & ts.TypeFlags.Object) !== 0))
  if (!objectish) return out
  // An array or a typed array is a value, not a bag of named options.
  const name = checker.typeToString(type)
  if (/\[\]$|^(Array|Uint8Array|Promise)\b/.test(name)) return out
  for (const prop of checker.getPropertiesOfType(type)) {
    if (prop.name.startsWith('__@')) continue
    out.add(prop.name)
  }
  return out
}

interface Signature {
  kind: 'method' | 'property'
  params: Set<string>
}

function signatureOf(coreCall: string): Signature | null {
  const parts = coreCall.split('.')
  const member = parts.pop() ?? ''
  const owner = INTERFACES[parts.join('.')] ?? INTERFACES[parts[0]]
  const decl = owner != null ? interfaces.get(owner) : undefined
  if (decl == null) return null

  for (const m of decl.members) {
    if (m.name?.getText() !== member) continue
    // Core writes its methods as properties holding function types
    // (`changePassword: (opts: …) => Promise<void>`), so asking the type for
    // its call signatures is what distinguishes a method from a real property.
    const type = checker.getTypeAtLocation(m)
    const calls = type.getCallSignatures()
    if (calls.length === 0) return { kind: 'property', params: new Set() }

    const params = new Set<string>()
    for (const p of calls[0].getParameters()) {
      const pType = checker.getTypeOfSymbolAtLocation(p, m)
      const inner = paramNames(pType)
      // A parameter that is an object of options contributes its properties;
      // the parameter's own name is not something a caller ever sends.
      if (inner.size > 0) {
        for (const n of inner) params.add(n)
      }
      params.add(p.name)
    }
    return { kind: 'method', params }
  }
  return null
}

// Scope, not arguments: these identify the receiver, not what is passed to it.
const SCOPE = new Set(['sessionId', 'walletId', 'objectId', 'pendingId'])

let checked = 0
const problems: string[] = []
for (const r of extractRoutes()) {
  if (r.core == null || r.core.includes('$internalStuff')) continue
  const sig = signatureOf(r.core)
  if (sig == null) continue
  checked++

  const declared = [...(r.query ?? []), ...(r.body ?? [])]
    .map(f => f.name)
    .filter(n => !SCOPE.has(n))

  const extra =
    sig.kind === 'property'
      ? declared
      : declared.filter(n => !sig.params.has(n))
  const takes =
    sig.kind === 'property'
      ? 'nothing — it is a property, not a method'
      : [...sig.params].join(', ')

  for (const name of extra) {
    if (r.coreExtra[name] == null) {
      problems.push(
        `${r.id}: ${r.core} has no parameter "${name}". Drop it, or record ` +
          `in \`coreExtra\` why it exists. Core takes: ${takes}`
      )
    }
  }
  // A justification that no longer applies is worse than none: it claims a
  // difference was weighed when the difference is gone.
  for (const name of Object.keys(r.coreExtra)) {
    if (!extra.includes(name)) {
      problems.push(
        `${r.id}: coreExtra lists "${name}", which is not a divergence any ` +
          'more. Remove the entry.'
      )
    }
  }
}

if (problems.length > 0) {
  console.error(`✗ ${problems.length} core-alignment problem(s):\n`)
  for (const p of problems) console.error(`  ${p}`)
  process.exit(1)
}
console.log(
  `✓ ${checked} routes match their core signature, ` + `or say why they differ`
)

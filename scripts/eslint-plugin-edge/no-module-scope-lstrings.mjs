/**
 * No `lstrings.` read outside a function, in the trees the CLI loads.
 *
 * A module-scope read freezes that string to whatever the tables held when
 * the module first evaluated. `applyLocale` mutates `lstrings` in place, and
 * the module that calls it — `initLocale` in the app, `bootNodeLocale` in the
 * CLI — is not one these files import, so the value is right only if that
 * happened to run first. It used to be right by construction: `strings.ts`
 * applied the locale during its own evaluation, so importing `lstrings`
 * forced it.
 *
 * Every reference to the imported binding, not a list of shapes. Selectors
 * for `lstrings.foo`, `const { foo } = lstrings` and `const s = lstrings`
 * still let `Object.entries(lstrings)`, `{ ...lstrings }` and an aliased
 * `import { lstrings as L }` through, each the same freeze written
 * differently. The import's own variable knows all of its references, so the
 * rule asks scope analysis for them and reports the ones with no enclosing
 * function. Nothing in `src/cli`, `src/locales` or `src/util` does this
 * today — which is the point, since the rule exists for the next edit.
 *
 * What "enclosing function" cannot see: a callback that a module-scope call
 * invokes *during* evaluation, like `Object.keys(x).map(k => lstrings[k])`,
 * reads the tables at import time just as surely. An immediately-invoked
 * function is treated as no function at all; a callback handed to some
 * other module-scope call is not, because that is also how every deferred
 * registration is written and the rule would then refuse them all.
 *
 * Its own rule rather than a `no-restricted-syntax` selector, because flat
 * config *replaces* a rule's options: an override carrying this selector
 * dropped the base config's `styled()` restriction from `src/cli`,
 * `src/locales` and `src/util`, and the next selector added to either place
 * would have dropped the other, silently. One name per constraint means both
 * keep their own severity, and this one gets to say why in a message a
 * selector string cannot hold.
 */
const FUNCTIONS = new Set([
  'ArrowFunctionExpression',
  'FunctionDeclaration',
  'FunctionExpression',
  'TSDeclareFunction',
  'TSEmptyBodyFunctionExpression'
])

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Read lstrings inside a function, not at module scope',
      category: 'Possible Errors',
      recommended: false
    },
    schema: []
  },
  create(context) {
    const MESSAGE =
      'Read lstrings inside a function, not at module scope: applyLocale mutates lstrings in place, so a module-scope capture is only correct if the locale boot ran first — and these modules are loaded by the CLI, which boots it elsewhere. See src/util/txDisplay/txActionLabels.ts.'

    // An enclosing function defers the read to when it is called, which is
    // after whichever boot the process runs — unless it is called right
    // here: an IIFE runs during module evaluation, so it does not count.
    const insideFunction = node => {
      for (let scope = node.parent; scope != null; scope = scope.parent) {
        if (!FUNCTIONS.has(scope.type)) continue
        const iife =
          scope.parent?.type === 'CallExpression' &&
          scope.parent.callee === scope
        if (!iife) return true
      }
      return false
    }

    const inTypeQuery = node => {
      for (let up = node.parent; up != null; up = up.parent) {
        if (up.type === 'TSTypeQuery') return true
      }
      return false
    }

    return {
      ImportSpecifier(node) {
        const imported =
          node.imported.type === 'Identifier'
            ? node.imported.name
            : node.imported.value
        if (imported !== 'lstrings') return
        // The local binding, whatever it was renamed to, and every place it
        // is read.
        for (const variable of context.sourceCode.getDeclaredVariables(node)) {
          for (const reference of variable.references) {
            // `typeof lstrings` in a type position reads nothing at runtime.
            // The TS scope manager reports it as a value reference — the
            // query names a value — so the type position is checked
            // directly.
            if (inTypeQuery(reference.identifier)) continue
            if (insideFunction(reference.identifier)) continue
            context.report({ node: reference.identifier, message: MESSAGE })
          }
        }
      }
    }
  }
}

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
 * Two shapes, not one. A direct `lstrings.foo` is the obvious case, and an
 * alias is the same freeze written differently: `const { foo } = lstrings`
 * and `const s = lstrings` at module scope both capture whatever the tables
 * held at import time, and a selector over member reads alone passes them
 * silently. Nothing in `src/cli`, `src/locales` or `src/util` does this
 * today — which is the point, since the rule exists for the next edit.
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

    // Any enclosing function is enough, whatever its shape: the read then
    // happens when the function is called, which is after whichever boot
    // the process runs.
    const insideFunction = node => {
      for (let scope = node.parent; scope != null; scope = scope.parent) {
        if (FUNCTIONS.has(scope.type)) return true
      }
      return false
    }

    const report = node => {
      if (insideFunction(node)) return
      context.report({ node, message: MESSAGE })
    }

    return {
      'MemberExpression[object.name="lstrings"]': report,
      // `const { foo } = lstrings` and `const s = lstrings` alike: the
      // declarator's initialiser is the identifier either way, so one
      // selector covers the destructure and the alias.
      'VariableDeclarator[init.name="lstrings"]': report
    }
  }
}

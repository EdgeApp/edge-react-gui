module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure awaited promises within useAbortable are followed by .then(maybeAbort)',
      category: 'Possible Errors',
      recommended: false
    },
    fixable: 'code',
    schema: []
  },
  create: function (context) {
    let withinUseAbortable = false
    let abortParamName = null

    return {
      CallExpression(node) {
        if (node.callee.name === 'useAbortable') {
          withinUseAbortable = true
          if (node.arguments[0]?.params?.[0]?.name) {
            abortParamName = node.arguments[0].params[0].name
          } else {
            // Report and provide fix
            context.report({
              node,
              message: `Missing maybeAbort argument for useAbortable hook.`,
              fix: function (fixer) {
                if (node.arguments[0]?.params != null) {
                  // Get the full text of the arrow function
                  const sourceCode = context.getSourceCode()
                  const arrowFunction = node.arguments[0]
                  const arrowFunctionText = sourceCode.getText(arrowFunction)

                  // Replace the empty params () with (maybeAbort)
                  const newText = arrowFunctionText.replace(/^\(\s*\)/, '(maybeAbort)')

                  return fixer.replaceText(arrowFunction, newText)
                }
              }
            })
          }
        }
      },
      'CallExpression:exit'(node) {
        if (node.callee.name === 'useAbortable') {
          withinUseAbortable = false
          abortParamName = null
        }
      },
      AwaitExpression(node) {
        if (!withinUseAbortable || !abortParamName) return

        const awaitedExpr = node.argument

        // Check if the awaited expression is already a .then() call with maybeAbort
        if (
          awaitedExpr.type === 'CallExpression' &&
          awaitedExpr.callee.type === 'MemberExpression' &&
          awaitedExpr.callee.property.name === 'then' &&
          awaitedExpr.arguments.length > 0 &&
          awaitedExpr.arguments[0].type === 'Identifier' &&
          awaitedExpr.arguments[0].name === abortParamName
        ) {
          return // Already has .then(maybeAbort)
        }

        // Report and provide fix
        context.report({
          node,
          message: `Awaited promise within useAbortable should be followed by .then(${abortParamName}).`,
          fix: function (fixer) {
            const sourceCode = context.getSourceCode()
            const awaitedExpression = sourceCode.getText(awaitedExpr)
            return fixer.replaceText(node, `await ${awaitedExpression}.then(${abortParamName})`)
          }
        })
      }
    }
  }
}

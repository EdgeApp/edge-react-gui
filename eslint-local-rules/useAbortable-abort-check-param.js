module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure useAbortable includes maybeAbort parameter',
      category: 'Possible Errors',
      recommended: false
    },
    fixable: 'code',
    schema: []
  },
  create: function (context) {
    return {
      CallExpression(node) {
        if (node.callee.name === 'useAbortable') {
          if (node.arguments[0]?.params?.[0]?.name == null) {
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
      }
    }
  }
}

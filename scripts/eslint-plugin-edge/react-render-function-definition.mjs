/**
 * ESLint rule to enforce React.ReactElement for render helper functions.
 *
 * Wrong:
 *   const renderItem = (item: Item): React.ReactNode => { ... }
 *   const renderHeader = (): JSX.Element => { ... }
 *
 * Correct:
 *   const renderItem = (item: Item): React.ReactElement => { ... }
 *   const renderBadge = (): React.ReactElement | null => { ... }
 *
 * This rule targets camelCase functions starting with "render" to distinguish
 * render helpers from components (which should use React.FC<Props>).
 */

// Types that should be flagged and replaced with ReactElement
const DISALLOWED_TYPES = [
  'ReactNode', // Too broad - use ReactElement or explicit union
  'Element' // JSX.Element - use ReactElement for consistency
]

function isRenderFunction(name) {
  return /^render[A-Z]/.test(name)
}

function getTypeName(typeName) {
  if (typeName.type === 'Identifier') {
    return typeName.name
  }
  // Handle qualified names like `React.ReactNode` or `JSX.Element`
  // We only need the rightmost name since we use exact matches
  if (typeName.type === 'TSQualifiedName') {
    return typeName.right.name
  }
  return ''
}

function isDisallowedType(node) {
  if (!node) return null

  // Handle `React.ReactNode`, `JSX.Element`, etc.
  if (node.type === 'TSTypeReference') {
    const typeName = getTypeName(node.typeName)
    if (DISALLOWED_TYPES.includes(typeName)) {
      return typeName
    }
  }

  return null
}

function checkReturnType(typeAnnotation) {
  if (!typeAnnotation) return null

  const { typeAnnotation: innerType } = typeAnnotation

  // Handle union types like `React.ReactElement | null`
  // Only flag if the union contains a disallowed type
  if (innerType.type === 'TSUnionType') {
    for (const t of innerType.types) {
      const disallowed = isDisallowedType(t)
      if (disallowed != null) {
        return disallowed
      }
    }
    return null
  }

  return isDisallowedType(innerType)
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce React.ReactElement for render helper functions instead of ReactNode or JSX.Element',
      category: 'Stylistic Issues',
      recommended: false
    },
    schema: []
  },
  create(context) {
    return {
      VariableDeclarator(node) {
        // Check if this is an arrow function
        if (node.init?.type !== 'ArrowFunctionExpression') return

        // Check if the variable name starts with "render" (camelCase render helper)
        const variableName = node.id?.name
        if (!variableName || !isRenderFunction(variableName)) return

        // Check if the arrow function has an explicit return type
        const arrowFunction = node.init
        if (!arrowFunction.returnType) return

        // Check if the return type is a disallowed type
        const disallowedType = checkReturnType(arrowFunction.returnType)
        if (disallowedType == null) return

        const suggestion =
          disallowedType === 'ReactNode'
            ? 'React.ReactElement (or React.ReactElement | null for nullable returns)'
            : 'React.ReactElement'

        context.report({
          node: arrowFunction.returnType,
          message: `Render function '${variableName}' should return ${suggestion} instead of ${disallowedType}. Use: const ${variableName} = (...): React.ReactElement => { ... }`
        })
      },

      // Also check regular function declarations
      FunctionDeclaration(node) {
        const functionName = node.id?.name
        if (!functionName || !isRenderFunction(functionName)) return

        if (!node.returnType) return

        const disallowedType = checkReturnType(node.returnType)
        if (disallowedType == null) return

        const suggestion =
          disallowedType === 'ReactNode'
            ? 'React.ReactElement (or React.ReactElement | null for nullable returns)'
            : 'React.ReactElement'

        context.report({
          node: node.returnType,
          message: `Render function '${functionName}' should return ${suggestion} instead of ${disallowedType}. Use: function ${functionName}(...): React.ReactElement { ... }`
        })
      }
    }
  }
}

/**
 * ESLint rule to enforce React.FC<Props> for component definitions.
 *
 * Wrong:
 *   export const Component = (props: Props): React.ReactElement | null => { ... }
 *   function Component(props: Props): React.ReactElement { ... }
 *
 * Correct:
 *   export const Component: React.FC<Props> = props => { ... }
 *
 * This rule targets PascalCase-named functions (both arrow and declarations) to
 * distinguish components from render helper functions (which should use explicit
 * return types).
 */

const JSX_RETURN_TYPES = [
  'ReactElement',
  'ReactNode',
  'Element', // JSX.Element
  'JSXElement'
]

function isPascalCase(name) {
  return /^[A-Z][a-zA-Z0-9]*$/.test(name)
}

function isJsxReturnType(typeAnnotation) {
  if (!typeAnnotation) return false

  const { typeAnnotation: innerType } = typeAnnotation

  // Handle union types like `React.ReactElement | null`
  if (innerType.type === 'TSUnionType') {
    return innerType.types.some(t => isJsxType(t))
  }

  return isJsxType(innerType)
}

function isJsxType(node) {
  if (!node) return false

  // Handle `React.ReactElement`, `React.JSX.Element`, etc.
  if (node.type === 'TSTypeReference') {
    const typeName = getTypeName(node.typeName)
    return JSX_RETURN_TYPES.includes(typeName)
  }

  return false
}

function getTypeName(typeName) {
  if (typeName.type === 'Identifier') {
    return typeName.name
  }
  // Handle qualified names like `React.ReactElement` or `React.JSX.Element`
  // We only need the rightmost name since we use exact matches
  if (typeName.type === 'TSQualifiedName') {
    return typeName.right.name
  }
  return ''
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce React.FC<Props> for component definitions instead of explicit return types',
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

        // Check if the variable name is PascalCase (component convention)
        const variableName = node.id?.name
        if (!variableName || !isPascalCase(variableName)) return

        // Check if the arrow function has an explicit return type
        const arrowFunction = node.init
        if (!arrowFunction.returnType) return

        // Check if the return type is a JSX-related type
        if (!isJsxReturnType(arrowFunction.returnType)) return

        // Check if the variable already has a React.FC type annotation
        const variableType = node.id.typeAnnotation
        if (variableType) {
          const typeName = getTypeName(
            variableType.typeAnnotation?.typeName || {}
          )
          if (
            typeName.endsWith('FC') ||
            typeName.endsWith('FunctionComponent')
          ) {
            return // Already using React.FC
          }
        }

        context.report({
          node: arrowFunction.returnType,
          message: `Component '${variableName}' should use React.FC<Props> instead of an explicit return type. Use: const ${variableName}: React.FC<Props> = props => { ... }`
        })
      },

      // Also check regular function declarations
      FunctionDeclaration(node) {
        const functionName = node.id?.name
        if (!functionName || !isPascalCase(functionName)) return

        if (!node.returnType) return

        // Check if the return type is a JSX-related type
        if (!isJsxReturnType(node.returnType)) return

        context.report({
          node: node.returnType,
          message: `Component '${functionName}' should use React.FC<Props> instead of a function declaration. Use: const ${functionName}: React.FC<Props> = props => { ... }`
        })
      }
    }
  }
}

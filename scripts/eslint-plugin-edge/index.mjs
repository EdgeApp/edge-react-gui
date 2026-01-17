import reactFcComponentDefinition from './react-fc-component-definition.mjs'
import reactRenderFunctionDefinition from './react-render-function-definition.mjs'
import abortCheckParam from './useAbortable-abort-check-param.mjs'
import abortCheckUsage from './useAbortable-abort-check-usage.mjs'

export default {
  meta: {
    name: 'eslint-plugin-edge',
    version: '0.1.3',
    namespace: 'edge'
  },
  rules: {
    'react-fc-component-definition': reactFcComponentDefinition,
    'react-render-function-definition': reactRenderFunctionDefinition,
    'useAbortable-abort-check-param': abortCheckParam,
    'useAbortable-abort-check-usage': abortCheckUsage
  }
}

import abortCheckParam from './useAbortable-abort-check-param.mjs'
import abortCheckUsage from './useAbortable-abort-check-usage.mjs'

export default {
  meta: {
    name: 'eslint-plugin-edge',
    version: '0.1.2',
    namespace: 'edge'
  },
  rules: {
    'useAbortable-abort-check-param': abortCheckParam,
    'useAbortable-abort-check-usage': abortCheckUsage
  }
}

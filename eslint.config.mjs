import standardConfig from 'eslint-config-standard-kit'
import rnPlugin from 'eslint-plugin-react-native'

import edgePlugin from './scripts/eslint-plugin-edge/index.mjs'

export default [
  ...standardConfig({
    prettier: true,
    sortImports: true,
    node: true,
    react: true,
    typescript: true
  }),

  // Activate additional rules:
  {
    plugins: {
      'react-native': rnPlugin,
      edge: edgePlugin
    },
    rules: {
      // Tweak builtin rules:
      'react/jsx-handler-names': 'warn',

      // Add the React Native plugin:
      ...rnPlugin.configs.all.rules,
      'react-hooks/exhaustive-deps': [
        'error',
        {
          additionalHooks: '^useSceneFooterRender$'
        }
      ],
      'react-native/no-inline-styles': 'off',
      'react-native/no-raw-text': [
        'error',
        {
          skip: ['B', 'EdgeText', 'Paragraph', 'SmallText', 'WarningText']
        }
      ],
      'react-native/sort-styles': 'off',

      // Add our own rules:
      'edge/useAbortable-abort-check-param': 'error',
      'edge/useAbortable-abort-check-usage': 'error'
    }
  },

  // Turn several TypeScript lint errors into warnings:
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/default-param-last': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-dynamic-delete': 'warn',
      '@typescript-eslint/no-misused-promises': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/require-array-sort-compare': 'warn',
      '@typescript-eslint/restrict-plus-operands': 'warn',
      '@typescript-eslint/restrict-template-expressions': 'warn',
      '@typescript-eslint/strict-boolean-expressions': 'warn',
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'warn'
    }
  },

  // Global ignores need to be in their own block:
  {
    ignores: [
      '**/scratch.*',
      'android/*',
      'artifacts/*',
      'ios/*',
      'src/plugins/contracts/*',
      'src/controllers/edgeProvider/client/rolledUp.js',
      'src/controllers/edgeProvider/injectThisInWebView.js'
    ]
  }
]

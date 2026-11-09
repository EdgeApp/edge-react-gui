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
          skip: [
            'B',
            'EdgeText',
            'Paragraph',
            'PositiveText',
            'SmallText',
            'WarningText'
          ]
        }
      ],
      'react-native/sort-styles': 'off',

      // Add our own rules:
      'edge/react-fc-component-definition': 'warn',
      'edge/react-render-function-definition': 'warn',
      'edge/useAbortable-abort-check-param': 'error',
      'edge/useAbortable-abort-check-usage': 'error',

      // Warn on styled() usage to encourage migration away from styled components
      'no-restricted-syntax': [
        'warn',
        {
          selector: "CallExpression[callee.name='styled']",
          message:
            'Avoid using styled() - prefer regular components with useTheme() and cacheStyles()'
        }
      ],

      // Warn on raw react-native-vector-icons imports to encourage migration
      // toward shared, theme-driven icon components:
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: [
                'react-native-vector-icons',
                'react-native-vector-icons/*'
              ],
              message:
                'Avoid importing react-native-vector-icons directly. Use a shared icon from src/components/icons/ThemedIcons or the VectorIcon component so color and size stay theme-driven, and add a new definition there if one is missing.'
            },
            {
              group: ['**/ScanModal', './ScanModal'],
              message:
                'Do not mount ScanModal directly. Use `showScanModal` from src/actions/ScanActions, which requests the camera permission and shows the first-use scam warning before the scanner opens. Mounting it directly skips both.'
            }
          ]
        }
      ]
    }
  },

  // `showScanModal` is the sanctioned entry point, so it is the one place
  // allowed to import ScanModal:
  {
    files: ['src/actions/ScanActions.tsx'],
    rules: {
      'no-restricted-imports': 'off'
    }
  },

  // Allow the shared icon wrappers to import react-native-vector-icons
  // directly, since they are the components that re-export it:
  {
    files: [
      'src/assets/vector/index.ts',

      'src/components/themed/VectorIcon.tsx'
    ],
    rules: {
      'no-restricted-imports': 'off'
    }
  },

  // Permit certain deprecated symbols:
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-deprecated': [
        'warn',
        {
          allow: ['runOnJS']
        }
      ]
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

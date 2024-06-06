import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import reactNativePlugin from 'eslint-plugin-react-native';
import typescriptEslintPlugin from '@typescript-eslint/eslint-plugin';
import standardKitPrettier from 'eslint-config-standard-kit/prettier';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

export const configs = [
  reactNativePlugin.configs.all,
  standardKitPrettier,
  {
    rules: {
      ...typescriptEslintPlugin.rules,
      ...reactNativePlugin.rules,
      ...simpleImportSortPlugin.rules,
    },
    files: ["*.ts", "*.tsx"],
    rules: {
      "@typescript-eslint/switch-exhaustiveness-check": "error"
    },
  },
  {
    rules: {
      "@typescript-eslint/default-param-last": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-dynamic-delete": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/prefer-optional-chain": "off",
      "@typescript-eslint/require-array-sort-compare": "off",
      "@typescript-eslint/restrict-plus-operands": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/strict-boolean-expressions": "off",
      "react-hooks/exhaustive-deps": [
        "error",
        {
          "additionalHooks": "^useSceneFooterRender$"
        }
      ],
      "react/jsx-handler-names": "off",
      "react-native/no-inline-styles": "off",
      "react-native/no-raw-text": [
        "error",
        {
          "skip": ["B", "EdgeText", "Paragraph", "SmallText", "WarningText"]
        }
      ],
      "react-native/sort-styles": "off",
      "simple-import-sort/imports": "error"
    },
  },
];

export const globals = {
  fetch: true,
};

export const settings = {
  react: {
    version: "17.0.2",
  },
};

export const parserOptions = {
  project: "tsconfig.json",
};

export const plugins = ["simple-import-sort"];

export const ignores = [
  "eslint.config.js",
  "**/scratch.*",
  "/android/",
  "/ios/",
  "/src/controllers/edgeProvider/injectThisInWebView.js",
  "/src/controllers/edgeProvider/client/rolledUp.js",
  "node_modules",
  "artifacts",
];

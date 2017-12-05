module.exports = {
    "env": {
        "es6": true,
        "node": true
    },
    "parser": "babel-eslint",
    "extends": [
      "eslint:recommended",
      "plugin:flowtype/recommended",
      "plugin:react/recommended",
      "plugin:react-native/all"
    ],
    "parserOptions": {
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true,
            "jsx": true
        },
        "sourceType": "module"
    },
    "plugins": [
        "react",
        "react-native",
        "flowtype"
    ],
    "rules": {
        "max-len": ["error", {
          "code": 200,
          "ignoreComments": true,
          "ignoreTrailingComments": true,
          "ignoreUrls": true,
          "ignoreStrings": true,
          "ignoreTemplateLiterals": true,
          "ignoreRegExpLiterals": true
        }],
        "arrow-parens": ["error", "always"],
        "operator-linebreak": ["error", "before"],
        "react/jsx-curly-spacing": ["error", {
          "when": "never",
          "attributes": {"allowMultiline": false},
          "children": true
        }],
        "react/jsx-no-duplicate-props": ["error", { "ignoreCase": true }],
        "react/jsx-indent-props": ["error", 'space'|2],
        "react/self-closing-comp": ["error", {"component": true}],
        "react/no-typos": "error",
        "react/no-array-index-key": "error",
        "block-spacing": ["error", "always"],
        "brace-style": ["error", "1tbs", { "allowSingleLine": true }],
        "jsx-quotes": ["error", "prefer-single"],
        "newline-per-chained-call": ["error", { "ignoreChainWithDepth": 2 }],
        "no-plusplus": ["error", { "allowForLoopAfterthoughts": true }],
        // "object-curly-spacing": ["error", "never", { "objectsInObjects": true }],
        "operator-assignment": ["error", "never"],
        "keyword-spacing": ["error", {
          "before": true,
          "after": true
        }],
        "arrow-spacing": ["error", {
          "before": true,
          "after": true
        }],
        "space-before-blocks": ["error", {
          "functions": "always",
          "keywords": "always",
          "classes": "always"
        }],
        "space-before-function-paren": ["error", {
          "anonymous": "always",
          "named": "always",
          "asyncArrow": "always"
        }],
        "space-in-parens": ["error", "never"],
        "space-before-function-paren": 2,
        "no-duplicate-imports": 2,
        "array-callback-return": 2,
        "no-floating-decimal": 2,
        "no-var": 2,
        "no-trailing-spaces": 2,
        "no-console": 0,
        "indent": ["error", 2],
        "linebreak-style": ["error", "unix"],
        "quotes": ["error", "single"],
        "semi": ["error", "never"],
        "react/prop-types": 0,
        "react/no-string-refs": 0,
        "react-native/no-unused-styles": 0,
        "react-native/split-platform-components": 2,
        "react-native/no-inline-styles": 0,
    }
};

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
        "space-before-function-paren": 2,
        "no-duplicate-imports": 2,
        "array-callback-return": 2,
        "no-floating-decimal": 2,
        "no-var": 2,
        "no-trailing-spaces": 2,
        "react-native/no-unused-styles": 0,
        "react-native/split-platform-components": 2,
        "react-native/no-inline-styles": 0,
        "react-native/no-color-literals": 0,
        "flowtype/no-types-missing-file-annotation": 0,
        "react/prop-types": 0,
        "react/no-string-refs": 0,
        "no-console": 0,
        "indent": [
            "error",
            2
        ],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "never"
        ]
    }
};

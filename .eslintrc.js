module.exports =
{
  "extends": ["standard", "plugin:flowtype/recommended"],
  "parser": "babel-eslint",
  "plugins": ["flowtype", "standard"],
  "rules": {
    "camelcase": "error",
    "flowtype/generic-spacing": "off",
    "no-throw-literal": "error",
    "no-unused-vars": "off",
    "no-var": "error",
    "prefer-const": "error"
  }
}

// @flow
const fs = require('fs')

const text = fs.readFileSync('./src/lib/bridge/rolledUp.js', 'utf8')
const out = `export const javascript = ${JSON.stringify(text)}`

fs.writeFileSync('./src/lib/bridge/injectThisInWebView.js', out, 'utf8')

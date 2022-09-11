export {}

const fs2 = require('fs')

const text = fs2.readFileSync('./src/util/bridge/rolledUp.js', 'utf8')
const out = `export const javascript = ${JSON.stringify(text)}`

fs2.writeFileSync('./src/util/bridge/injectThisInWebView.js', out, 'utf8')

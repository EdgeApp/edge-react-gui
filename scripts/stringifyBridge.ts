import fs from 'fs'

const text = fs.readFileSync('./src/controllers/edgeProvider/client/rolledUp.js', 'utf8')
const out = `export const javascript = ${JSON.stringify(text)}`

fs.writeFileSync('./src/controllers/edgeProvider/injectThisInWebView.js', out, 'utf8')

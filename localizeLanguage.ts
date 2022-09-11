export {}

const fs1 = require('fs')
const masterStrings = require('./src/locales/en_US.ts')
fs1.writeFileSync('./src/locales/strings/enUS.json', JSON.stringify(masterStrings, null, 2))

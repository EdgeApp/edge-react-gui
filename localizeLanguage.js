// @flow

const fs = require('fs')
const masterStrings = require('./src/locales/en_US.js')
fs.writeFileSync('./src/locales/strings/enUS.json', JSON.stringify(masterStrings, null, 2))

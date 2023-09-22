import fs from 'fs'

import masterStrings from '../src/locales/en_US'

const text = JSON.stringify(masterStrings, null, 2) + '\n'
fs.writeFileSync('./src/locales/strings/enUS.json', text)

import fs from 'fs'

import masterStrings from '../src/locales/en_US'

fs.writeFileSync('./src/locales/strings/enUS.json', JSON.stringify(masterStrings, null, 2))

import fs from 'fs'

// @ts-expect-error we need to port this to TypeScript:
import masterStrings from '../src/locales/en_US.js'

fs.writeFileSync('./src/locales/strings/enUS.json', JSON.stringify(masterStrings, null, 2))

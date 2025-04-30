import fs from 'fs'

function editFile(name, cb) {
  let text = fs.readFileSync(name, 'utf8')
  text = cb(text)
  fs.writeFileSync(name, text, 'utf8')
}

editFile('package.json', text =>
  text //
    .replace(/"edge-currency-accountbased".*/, '')
    .replace(/"eosjs-api".*/, '')
)

fs.writeFileSync(
  'src/edge-currency-accountbased.d.ts',
  `declare module 'edge-currency-accountbased/rn' {
  export function makePluginIo(): any
  export const debugUri: string
  export const pluginUri: string
}

declare module 'edge-currency-accountbased/rn-piratechain' {
  export function makePiratechainIo(): any
}

declare module 'edge-currency-accountbased/rn-zano' {
  export function makeZanoIo(): any
}

declare module 'edge-currency-accountbased/rn-zcash' {
  export function makeZcashIo(): any
}
`,
  'utf8'
)

editFile('scripts/prepare.sh', text =>
  text //
    .replace(/node .\/node_modules\/.bin\/webpack/, '')
)

import fs from 'fs'

function editFile(name, cb) {
  let text = fs.readFileSync(name, 'utf8')
  text = cb(text)
  fs.writeFileSync(name, text, 'utf8')
}

editFile('package.json', text =>
  text //
    .replace(/"edge-currency-accountbased".*/, '')
    .replace(/"edge-currency-plugins".*/, '')
    .replace(/"eosjs-api".*/, '')
)

fs.writeFileSync(
  'src/edge-currency-accountbased.d.ts',
  `declare module 'edge-currency-accountbased' {
  export function makePluginIo(): any
  export const debugUri: string
  export const pluginUri: string
}
`,
  'utf8'
)

editFile('scripts/prepare.sh', text =>
  text //
    .replace(/node .\/node_modules\/.bin\/webpack/, '')
)

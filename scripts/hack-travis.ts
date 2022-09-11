export {}
const fs3 = require('fs')

function editFile(name: string, cb: (text: string) => string) {
  let text = fs3.readFileSync(name, 'utf8')
  text = cb(text)
  fs3.writeFileSync(name, text, 'utf8')
}

editFile('package.json', text =>
  text //
    .replace(/"edge-currency-accountbased".*/, '')
    .replace(/"edge-currency-plugins".*/, '')
    .replace(/"edge-plugin-bity".*/, '')
    .replace(/"edge-plugin-simplex".*/, '')
    .replace(/"edge-plugin-wyre".*/, '')
    .replace(/"eosjs-api".*/, '')
)

editFile('scripts/prepare.sh', text =>
  text //
    .replace('node ./copy-plugin.js', '')
    .replace(/cp -R node_modules\/edge-currency-accountbased.*/g, '')
    .replace(/node .\/node_modules\/.bin\/webpack/, '')
)

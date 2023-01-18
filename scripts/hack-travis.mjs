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
    .replace(/"edge-plugin-bity".*/, '')
    .replace(/"edge-plugin-simplex".*/, '')
    .replace(/"edge-plugin-wyre".*/, '')
    .replace(/"eosjs-api".*/, '')
)

editFile('scripts/prepare.sh', text =>
  text //
    .replace('node -r sucrase/register ./scripts/copy-plugin.ts', '')
    .replace(/cp -r node_modules\/edge-currency-accountbased.*/g, '')
    .replace(/node .\/node_modules\/.bin\/webpack/, '')
)

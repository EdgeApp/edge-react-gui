import fs from 'fs'

function editFile(name, cb) {
  let text = fs.readFileSync(name, 'utf8')
  text = cb(text)
  fs.writeFileSync(name, text, 'utf8')
}

// `edge-currency-accountbased` stays in `package.json`: the CLI engine imports
// it directly (`src/cli/engine/makeCoreContext.ts`), so `tsc`, `npm test`,
// `cli:plugins:check` and both offline suites need it installed on CI.
editFile('package.json', text =>
  text //
    .replace(/"eosjs-api".*/, '')
)

editFile('scripts/prepare.sh', text =>
  text //
    .replace(/node .\/node_modules\/.bin\/webpack/, '')
)

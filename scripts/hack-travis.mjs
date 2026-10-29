import fs from 'fs'

function editFile(name, cb) {
  let text = fs.readFileSync(name, 'utf8')
  text = cb(text)
  fs.writeFileSync(name, text, 'utf8')
}

// `edge-currency-accountbased` used to be stripped from `package.json` here,
// with ambient declarations written for its `/rn*` subpaths in its place.
// That was for git dependencies, which Travis installed in parallel into one
// cache and raced on; the package is a registry dependency now, and the CLI
// engine imports it directly (`src/cli/engine/makeCoreContext.ts`) — so
// stripping it failed `tsc`, `npm test`, `cli:plugins:check` and both offline
// suites on CI.
editFile('package.json', text =>
  text //
    .replace(/"eosjs-api".*/, '')
)

editFile('scripts/prepare.sh', text =>
  text //
    .replace(/node .\/node_modules\/.bin\/webpack/, '')
)

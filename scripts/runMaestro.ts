import { execSync, ExecSyncOptions } from 'child_process'
import { makeConfig } from 'cleaner-config'
import { asObject, asOptional, asString } from 'cleaners'
import { join } from 'path'

const TESTER_CONFIG = 'testerConfig.json'

const asTestConfig = asObject({
  env: asOptional(
    asObject({
      MAESTRO_APP_ID: asOptional(asString, 'co.edgesecure.app'),
      MAESTRO_EDGE_UTXO_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_UTXO_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_UTXO_PIN_1: asOptional(asString, '1'),
      MAESTRO_EDGE_UTXO_PIN_2: asOptional(asString, '1'),
      MAESTRO_EDGE_UTXO_PIN_3: asOptional(asString, '1'),
      MAESTRO_EDGE_UTXO_PIN_4: asOptional(asString, '1'),
      MAESTRO_EDGE_IP2FA_MEXICO_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_IP2FA_MEXICO_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_XMR_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_XMR_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_2FA_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_2FA_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_XRP_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_XRP_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_TXDETAILS_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_TXDETAILS_PASSWORD: asOptional(asString, 'passwd')
    }),
    {
      MAESTRO_APP_ID: 'co.edgesecure.app',
      MAESTRO_EDGE_UTXO_USERNAME: 'user',
      MAESTRO_EDGE_UTXO_PASSWORD: 'passwd',
      MAESTRO_EDGE_UTXO_PIN_1: '1',
      MAESTRO_EDGE_UTXO_PIN_2: '1',
      MAESTRO_EDGE_UTXO_PIN_3: '1',
      MAESTRO_EDGE_UTXO_PIN_4: '1',
      MAESTRO_EDGE_IP2FA_MEXICO_USERNAME: 'user',
      MAESTRO_EDGE_IP2FA_MEXICO_PASSWORD: 'passwd',
      MAESTRO_EDGE_XMR_USERNAME: 'user',
      MAESTRO_EDGE_XMR_PASSWORD: 'passwd',
      MAESTRO_EDGE_2FA_USERNAME: 'user',
      MAESTRO_EDGE_2FA_PASSWORD: 'passwd',
      MAESTRO_EDGE_XRP_USERNAME: 'user',
      MAESTRO_EDGE_XRP_PASSWORD: 'passwd',
      MAESTRO_EDGE_TXDETAILS_USERNAME: 'user',
      MAESTRO_EDGE_TXDETAILS_PASSWORD: 'passwd'
    }
  )
}).withRest

const cwd = join(__dirname, '..')

const { env } = makeConfig(asTestConfig, TESTER_CONFIG)

const execSyncOpts: ExecSyncOptions = { cwd, stdio: 'inherit', env: { ...process.env, ...env } }
const args = process.argv.slice(2).join(' ')
const cmd = `maestro ${args}`
execSync(cmd, execSyncOpts)

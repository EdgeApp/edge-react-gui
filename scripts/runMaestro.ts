import { execSync, type ExecSyncOptions } from 'child_process'
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
      MAESTRO_EDGE_2FA_BACKUP_CODE: asOptional(asString, 'code'),
      MAESTRO_EDGE_2FA_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_2FA_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_XRP_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_XRP_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_TXDETAILS_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_TXDETAILS_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_NEW_ACCOUNT_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_NEW_ACCOUNT_PIN: asOptional(asString, 'pin'),
      MAESTRO_EDGE_NEW_ACCOUNT_PIN_SINGLE: asOptional(asString, 'pin'),
      MAESTRO_EDGE_PASSWORD_RECOVERY_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_PASSWORD_RECOVERY_TOKEN: asOptional(asString, 'token'),
      MAESTRO_EDGE_PASSWORD_RECOVERY_Q1: asOptional(asString, 'answer'),
      MAESTRO_EDGE_PASSWORD_RECOVERY_Q2: asOptional(asString, 'answer'),
      MAESTRO_EDGE_MAX_IMPORT_SEED: asOptional(asString, 'seed'),
      MAESTRO_EDGE_CHANGE_PASSWORD_PASSWORD1: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_CHANGE_PASSWORD_PASSWORD2: asOptional(asString, 'passwd')
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
      MAESTRO_EDGE_2FA_BACKUP_CODE: 'code',
      MAESTRO_EDGE_2FA_USERNAME: 'user',
      MAESTRO_EDGE_2FA_PASSWORD: 'passwd',
      MAESTRO_EDGE_XRP_USERNAME: 'user',
      MAESTRO_EDGE_XRP_PASSWORD: 'passwd',
      MAESTRO_EDGE_TXDETAILS_USERNAME: 'user',
      MAESTRO_EDGE_TXDETAILS_PASSWORD: 'passwd',
      MAESTRO_EDGE_NEW_ACCOUNT_PASSWORD: 'passwd',
      MAESTRO_EDGE_NEW_ACCOUNT_PIN: 'pin',
      MAESTRO_EDGE_NEW_ACCOUNT_PIN_SINGLE: 'pin',
      MAESTRO_EDGE_PASSWORD_RECOVERY_USERNAME: 'user',
      MAESTRO_EDGE_PASSWORD_RECOVERY_TOKEN: 'token',
      MAESTRO_EDGE_PASSWORD_RECOVERY_Q1: 'answer',
      MAESTRO_EDGE_PASSWORD_RECOVERY_Q2: 'answer',
      MAESTRO_EDGE_MAX_IMPORT_SEED: 'seed',
      MAESTRO_EDGE_CHANGE_PASSWORD_PASSWORD1: 'passwd',
      MAESTRO_EDGE_CHANGE_PASSWORD_PASSWORD2: 'passwd'
    }
  )
}).withRest

const cwd = join(__dirname, '..')

const { env } = makeConfig(asTestConfig, TESTER_CONFIG)

const execSyncOpts: ExecSyncOptions = {
  cwd,
  stdio: 'inherit',
  env: { ...process.env, ...env }
}
const args = process.argv.slice(2).join(' ')
const cmd = `maestro ${args}`
execSync(cmd, execSyncOpts)

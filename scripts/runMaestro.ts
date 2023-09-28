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
      MAESTRO_EDGE_TXDETAILS_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_USA_PARTNERS_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_USA_PARTNERS_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_MUTATE_CHANGEPW_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_MUTATE_CHANGEPW_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_MUTATE_CHANGEPIN_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_MUTATE_CHANGEPIN_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_EVM_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_EVM_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_XLM_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_XLM_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_HBAR_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_HBAR_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_XTZ_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_XTZ_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_BNB_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_BNB_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_ALGO_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_ALGO_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_TRX_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_TRX_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_DOT_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_DOT_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_SOL_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_SOL_PASSWORD: asOptional(asString, 'passwd'),
      MAESTRO_EDGE_FIO_USERNAME: asOptional(asString, 'user'),
      MAESTRO_EDGE_FIO_PASSWORD: asOptional(asString, 'passwd')
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
      MAESTRO_EDGE_TXDETAILS_PASSWORD: 'passwd',
      MAESTRO_EDGE_USA_PARTNERS_USERNAME: 'user',
      MAESTRO_EDGE_USA_PARTNERS_PASSWORD: 'passwd',
      MAESTRO_EDGE_MUTATE_CHANGEPW_USERNAME: 'user',
      MAESTRO_EDGE_MUTATE_CHANGEPW_PASSWORD: 'passwd',
      MAESTRO_EDGE_MUTATE_CHANGEPIN_USERNAME: 'user',
      MAESTRO_EDGE_MUTATE_CHANGEPIN_PASSWORD: 'passwd',
      MAESTRO_EDGE_EVM_USERNAME: 'user',
      MAESTRO_EDGE_EVM_PASSWORD: 'passwd',
      MAESTRO_EDGE_XLM_USERNAME: 'user',
      MAESTRO_EDGE_XLM_PASSWORD: 'passwd',
      MAESTRO_EDGE_HBAR_USERNAME: 'user',
      MAESTRO_EDGE_HBAR_PASSWORD: 'passwd',
      MAESTRO_EDGE_XTZ_USERNAME: 'user',
      MAESTRO_EDGE_XTZ_PASSWORD: 'passwd',
      MAESTRO_EDGE_BNB_USERNAME: 'user',
      MAESTRO_EDGE_BNB_PASSWORD: 'passwd',
      MAESTRO_EDGE_ALGO_USERNAME: 'user',
      MAESTRO_EDGE_ALGO_PASSWORD: 'passwd',
      MAESTRO_EDGE_TRX_USERNAME: 'user',
      MAESTRO_EDGE_TRX_PASSWORD: 'passwd',
      MAESTRO_EDGE_DOT_USERNAME: 'user',
      MAESTRO_EDGE_DOT_PASSWORD: 'passwd',
      MAESTRO_EDGE_SOL_USERNAME: 'user',
      MAESTRO_EDGE_SOL_PASSWORD: 'passwd',
      MAESTRO_EDGE_FIO_USERNAME: 'user',
      MAESTRO_EDGE_FIO_PASSWORD: 'passwd'
    }
  )
}).withRest

const cwd = join(__dirname, '..')

const { env } = makeConfig(asTestConfig, TESTER_CONFIG)

const execSyncOpts: ExecSyncOptions = { cwd, stdio: 'inherit', env: { ...process.env, ...env } }
const args = process.argv.slice(2).join(' ')
const cmd = `maestro ${args}`
execSync(cmd, execSyncOpts)

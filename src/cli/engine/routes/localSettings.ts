import {
  readLocalAccountSettingsFromDisk,
  writeLocalAccountSettingsToDisk
} from '../../../util/localAccountSettings'
import { engineError } from '../errors'
import { requireBodyObject, type Router } from '../router'
import { getAccount, optionalBoolean } from './helpers'

export function registerLocalSettingsRoutes(router: Router): void {
  /** GUI code, not core: account.localDisklet Settings.json. */
  router.add('GET', '/account/{sessionId}/local-settings', async ctx => {
    const account = getAccount(ctx)
    const settings = await readLocalAccountSettingsFromDisk(account)
    return { spamFilterOn: settings.spamFilterOn }
  })

  /** GUI code, not core: account.localDisklet Settings.json. */
  router.add(
    'POST',
    '/account/{sessionId}/change-local-settings',
    async ctx => {
      const body = requireBodyObject(ctx.body)
      const spamFilterOn = optionalBoolean(body, 'spamFilterOn')
      if (spamFilterOn == null) {
        throw engineError(
          'BAD_REQUEST',
          'Missing required field "spamFilterOn"',
          400
        )
      }
      const account = getAccount(ctx)
      const settings = await readLocalAccountSettingsFromDisk(account)
      const updated = await writeLocalAccountSettingsToDisk(account, {
        ...settings,
        spamFilterOn
      })
      return { spamFilterOn: updated.spamFilterOn }
    }
  )
}

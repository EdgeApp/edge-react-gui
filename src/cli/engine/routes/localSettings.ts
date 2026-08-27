import {
  readLocalAccountSettingsFromDisk,
  writeLocalAccountSettingsToDisk
} from '../../../util/localAccountSettings'
import { engineError } from '../errors'
import { requireBodyObject, type Router } from '../router'
import { getAccount, optionalBoolean } from './helpers'

export function registerLocalSettingsRoutes(router: Router): void {
  router.add('GET', '/v1/accounts/{sessionId}/local-settings', async ctx => {
    const account = getAccount(ctx)
    const settings = await readLocalAccountSettingsFromDisk(account)
    return { spamFilterOn: settings.spamFilterOn }
  })

  router.add('PATCH', '/v1/accounts/{sessionId}/local-settings', async ctx => {
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
  })
}

import { EdgeAccount } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal'
import { Airship } from '../components/services/AirshipInstance'
import { lstrings } from '../locales/strings'
import { config } from '../theme/appConfig'
import { getUkCompliantString } from '../util/ukComplianceUtils'
import {
  getLocalAccountSettings,
  writeTokenWarningsShown
} from './LocalSettingsActions'

export const approveTokenTerms = async (
  account: EdgeAccount,
  pluginId: string,
  countryCode: string
) => {
  const { currencyCode } = account.currencyConfig[pluginId].currencyInfo
  const { tokenWarningsShown } = await getLocalAccountSettings(account)
  if (tokenWarningsShown.includes(pluginId)) return

  await writeTokenWarningsShown(account, pluginId)

  const title = sprintf(lstrings.token_agreement_modal_title, currencyCode)
  const body = getUkCompliantString(
    countryCode,
    'token_agreement_modal_message',
    currencyCode,
    config.appName
  )

  await Airship.show<boolean>(bridge => (
    <ConfirmContinueModal bridge={bridge} title={title} body={body} />
  ))
}

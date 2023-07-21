import { Disklet } from 'disklet'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal'
import { Airship } from '../components/services/AirshipInstance'
import { TOKEN_TERMS_AGREEMENT } from '../constants/constantSettings'
import { lstrings } from '../locales/strings'
import { config } from '../theme/appConfig'

export const approveTokenTerms = async (disklet: Disklet, currencyCode: string) => {
  const title = sprintf(lstrings.token_agreement_modal_title, currencyCode)
  const body = sprintf(lstrings.token_agreement_modal_message, currencyCode, config.appName)
  const filePath = `${currencyCode}-${TOKEN_TERMS_AGREEMENT}`

  try {
    await disklet.getText(filePath)
  } catch (error: any) {
    await Airship.show<boolean>(bridge => <ConfirmContinueModal bridge={bridge} title={title} body={body} />)
    await disklet.setText(filePath, '')
  }
}

import { Disklet } from 'disklet'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal'
import { Airship } from '../components/services/AirshipInstance'
import { TOKEN_TERMS_AGREEMENT } from '../constants/constantSettings'
import s from '../locales/strings'
import { config } from '../theme/appConfig'

export const approveTokenTerms = async (disklet: Disklet, currencyCode: string) => {
  const title = sprintf(s.strings.token_agreement_modal_title, currencyCode)
  const body = sprintf(s.strings.token_agreement_modal_message, currencyCode, config.appName)
  const filePath = `${currencyCode}-${TOKEN_TERMS_AGREEMENT}`

  try {
    return await disklet.getText(filePath)
  } catch (error: any) {
    Airship.show<boolean>(bridge => <ConfirmContinueModal bridge={bridge} title={title} body={body} />).then(async () => disklet.setText(filePath, ''))
  }
}

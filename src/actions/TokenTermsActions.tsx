import { EdgeCurrencyWallet } from 'edge-core-js'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal'
import { Airship } from '../components/services/AirshipInstance'
import { lstrings } from '../locales/strings'
import { config } from '../theme/appConfig'

export const TOKEN_TERMS_AGREEMENT = 'ttAgreement.json'

export const approveTokenTerms = async (wallet: EdgeCurrencyWallet) => {
  const { disklet } = wallet
  const { currencyCode } = wallet.currencyInfo

  const title = sprintf(lstrings.token_agreement_modal_title, currencyCode)
  const body = sprintf(lstrings.token_agreement_modal_message, currencyCode, config.appName)

  try {
    await disklet.getText(TOKEN_TERMS_AGREEMENT)
  } catch (error: any) {
    await Airship.show<boolean>(bridge => <ConfirmContinueModal bridge={bridge} title={title} body={body} />)
    await disklet.setText(TOKEN_TERMS_AGREEMENT, '')
  }
}

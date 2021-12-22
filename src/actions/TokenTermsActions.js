// @flow
import type { Disklet } from 'disklet'
import * as React from 'react'

import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal.js'
import { Airship } from '../components/services/AirshipInstance.js'
import { TOKEN_TERMS_AGREEMENT } from '../constants/constantSettings.js'
import s from '../locales/strings.js'

export const approveTokenTerms = async (disklet: Disklet) => {
  try {
    return await disklet.getText(TOKEN_TERMS_AGREEMENT)
  } catch (error) {
    Airship.show(bridge => (
      <ConfirmContinueModal bridge={bridge} title={s.strings.token_agreement_modal_title} body={s.strings.token_agreement_modal_body} />
    )).then(() => disklet.setText(TOKEN_TERMS_AGREEMENT, ''))
  }
}

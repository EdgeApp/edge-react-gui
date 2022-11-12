import { Disklet } from 'disklet'
import * as React from 'react'

import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal'
import { Airship } from '../components/services/AirshipInstance'
import { ModalMessage } from '../components/themed/ModalParts'
import { SCAM_WARNING } from '../constants/constantSettings'
import s from '../locales/strings'

let isWarningChecked = false

export const dismissScamWarning = async (disklet: Disklet) => {
  if (isWarningChecked) return

  try {
    await disklet.getText(SCAM_WARNING)
  } catch (error: any) {
    Airship.show<boolean>(bridge => {
      const warningMessage = `\u2022 ${s.strings.warning_scam_message_financial_advice}\n\n\u2022 ${s.strings.warning_scam_message_irreversibility}\n\n\u2022 ${s.strings.warning_scam_message_unknown_recipients}`

      return (
        <ConfirmContinueModal bridge={bridge} title={s.strings.warning_scam_title}>
          <ModalMessage isWarning>{warningMessage}</ModalMessage>
        </ConfirmContinueModal>
      )
    }).then(async () => {
      await disklet.setText(SCAM_WARNING, '')

      isWarningChecked = true
    })
  }
}

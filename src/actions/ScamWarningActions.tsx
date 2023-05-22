import { Disklet } from 'disklet'
import * as React from 'react'

import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal'
import { Airship } from '../components/services/AirshipInstance'
import { ModalMessage } from '../components/themed/ModalParts'
import { SCAM_WARNING } from '../constants/constantSettings'
import { lstrings } from '../locales/strings'

let isWarningChecked = false

export const triggerScamWarningModal = async (disklet: Disklet) => {
  if (isWarningChecked) return

  try {
    await disklet.getText(SCAM_WARNING)
  } catch (error: any) {
    await Airship.show<boolean>(bridge => {
      const warningMessage = `\u2022 ${lstrings.warning_scam_message_financial_advice}\n\n\u2022 ${lstrings.warning_scam_message_irreversibility}\n\n\u2022 ${lstrings.warning_scam_message_unknown_recipients}`

      return (
        <ConfirmContinueModal bridge={bridge} title={lstrings.warning_scam_title}>
          <ModalMessage isWarning>{warningMessage}</ModalMessage>
        </ConfirmContinueModal>
      )
    })
    await disklet.setText(SCAM_WARNING, '')

    isWarningChecked = true
  }
}

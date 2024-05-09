import { Disklet } from 'disklet'
import * as React from 'react'
import { sprintf } from 'sprintf-js'

import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal'
import { Airship } from '../components/services/AirshipInstance'
import { Paragraph, WarningText } from '../components/themed/EdgeText'
import { SCAM_WARNING } from '../constants/constantSettings'
import { lstrings } from '../locales/strings'
import { config } from '../theme/appConfig'

let isSendScamWarningChecked = false

/** Scam warning to educate users about potential scams before their first Send */
export const showSendScamWarningModal = async (disklet: Disklet) => {
  if (isSendScamWarningChecked) return

  try {
    await disklet.getText(SCAM_WARNING)
  } catch (error: any) {
    const scamMessage = sprintf(lstrings.warning_scam_message_financial_advice_s, config.appName)
    await Airship.show<boolean>(bridge => {
      const warningMessage = `\u2022 ${scamMessage}\n\n\u2022 ${lstrings.warning_scam_message_irreversibility}\n\n\u2022 ${lstrings.warning_scam_message_unknown_recipients}`

      return (
        <ConfirmContinueModal bridge={bridge} title={lstrings.warning_scam_title}>
          <Paragraph>
            <WarningText>{warningMessage}</WarningText>
          </Paragraph>
        </ConfirmContinueModal>
      )
    })
    await disklet.setText(SCAM_WARNING, '')

    isSendScamWarningChecked = true
  }
}
  }
}

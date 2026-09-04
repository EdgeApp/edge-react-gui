import * as React from 'react'
import type { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { Paragraph, WarningText } from '../themed/EdgeText'
import { ConfirmContinueModal } from './ConfirmContinueModal'

interface Props {
  bridge: AirshipBridge<boolean>
}

/**
 * Scam warning shown before the first use of the QR scanner camera.
 *
 * This is deliberately separate from the "enable Camera access" recovery
 * modal, so that the two have independent lifecycles. `ConfirmContinueModal`
 * is not skippable, so there is no backdrop tap, swipe, close button or
 * hardware back that can dismiss this: the user has to tick the checkbox and
 * confirm.
 */
export const ScanScamWarningModal: React.FC<Props> = props => {
  const { bridge } = props

  // A non-skippable `ConfirmContinueModal` passes no `onCancel`, so `EdgeModal`
  // ignores Airship's global `clear` event. Without this the modal would
  // outlive a logout and leave the caller awaiting a promise that never
  // settles:
  React.useEffect(
    () =>
      bridge.on('clear', () => {
        bridge.resolve(false)
      }),
    [bridge]
  )

  const warningMessage = [
    sprintf(lstrings.warning_scam_message_financial_advice_s, config.appName),
    lstrings.warning_scam_message_irreversibility,
    lstrings.warning_scam_message_unknown_recipients
  ]
    .map(bullet => `• ${bullet}`)
    .join('\n\n')

  return (
    <ConfirmContinueModal
      bridge={bridge}
      title={lstrings.warning_scam_title}
      warning
    >
      <Paragraph>
        <WarningText>{warningMessage}</WarningText>
      </Paragraph>
      <Paragraph>
        {sprintf(lstrings.warning_scam_footer_s, config.supportEmail)}
      </Paragraph>
    </ConfirmContinueModal>
  )
}

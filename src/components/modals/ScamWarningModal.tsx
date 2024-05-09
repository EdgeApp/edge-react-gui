import React from 'react'
import { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { Airship } from '../services/AirshipInstance'
import { Paragraph } from '../themed/EdgeText'
import { ModalUi4 } from '../ui4/ModalUi4'
import { ButtonsModal2 } from './ButtonsModal'
import { ConfirmContinueModal } from './ConfirmContinueModal'

/**
 * Warn the user about potential scams from sending, viewing private keys,
 * account creation, etc, the first time they interact with or open those
 * features.
 */
export const ScamWarningModal = (props: { bridge: AirshipBridge<'yes' | 'no' | undefined> }) => {
  const { bridge } = props

  const handleCancel = useHandler(() => bridge.resolve(undefined))

  const handleYesPress = useHandler(async () => {
    bridge.resolve('yes')
    await Airship.show((bridge: AirshipBridge<boolean>) => (
      <ConfirmContinueModal
        bridge={bridge}
        title={lstrings.warning_scam_title}
        body={sprintf(lstrings.warning_scam_message_yes_1s, config.supportEmail)}
        warning
      />
    ))
    return await Promise.resolve(true)
  })

  const handleNoPress = useHandler(async () => {
    bridge.resolve('no')
    await Airship.show(bridge => (
      <ModalUi4 bridge={bridge} title={lstrings.warning_scam_title} onCancel={handleCancel}>
        <Paragraph>{sprintf(lstrings.warning_scam_message_no_1s, config.supportEmail)}</Paragraph>
      </ModalUi4>
    ))
    return await Promise.resolve(true)
  })

  return (
    <ButtonsModal2
      bridge={bridge}
      buttons={{
        yes: { label: lstrings.yes, onPress: handleYesPress },
        no: {
          label: lstrings.no,
          onPress: handleNoPress
        }
      }}
      title={lstrings.warning_scam_title}
      message={lstrings.warning_scam_message}
      disableCancel
    />
  )
}

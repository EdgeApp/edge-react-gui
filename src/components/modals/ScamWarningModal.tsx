import React from 'react'
import { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { Airship } from '../services/AirshipInstance'
import { Paragraph } from '../themed/EdgeText'
import { ButtonsModal } from './ButtonsModal'
import { ConfirmContinueModal } from './ConfirmContinueModal'
import { EdgeModal } from './EdgeModal'

/**
 * Warn the user about potential scams from sending, viewing private keys,
 * account creation, etc, the first time they interact with or open those
 * features.
 */
export const ScamWarningModal = (props: { bridge: AirshipBridge<'yes' | 'no' | undefined> }) => {
  const { bridge } = props

  const handleYesPress = useHandler(async () => {
    await Airship.show((bridge: AirshipBridge<boolean>) => (
      <ConfirmContinueModal
        bridge={bridge}
        title={lstrings.warning_scam_title}
        body={sprintf(lstrings.warning_scam_message_yes_1s, config.supportEmail)}
        warning
      />
    ))
    bridge.resolve('yes')
    return await Promise.resolve(true)
  })

  const handleNoPress = useHandler(async () => {
    await Airship.show(bridge2 => (
      <EdgeModal
        bridge={bridge2}
        title={lstrings.warning_scam_title}
        onCancel={() => {
          bridge2.resolve(undefined)
          bridge.resolve('no')
        }}
      >
        <Paragraph>{sprintf(lstrings.warning_scam_message_no_1s, config.supportEmail)}</Paragraph>
      </EdgeModal>
    ))

    return await Promise.resolve(true)
  })

  return (
    <ButtonsModal
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

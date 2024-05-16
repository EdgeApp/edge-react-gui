import { asBoolean, asObject, asOptional } from 'cleaners'
import { Disklet, makeReactNativeDisklet } from 'disklet'
import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { ConfirmContinueModal } from '../components/modals/ConfirmContinueModal'
import { ScamWarningModal } from '../components/modals/ScamWarningModal'
import { Airship } from '../components/services/AirshipInstance'
import { Paragraph, WarningText } from '../components/themed/EdgeText'
import { SCAM_WARNING, SCAM_WARNING_2 } from '../constants/constantSettings'
import { lstrings } from '../locales/strings'
import { config } from '../theme/appConfig'
import { getFirstOpenInfo } from './FirstOpenActions'

let isSendScamWarningChecked = false

/**
 * Scam warning to educate users about potential scams before their first Send
 **/
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

const scamWarningDisklet = makeReactNativeDisklet()
const asScamWarningInfo = asObject({
  firstPrivateKeyView: asOptional(asBoolean, true),
  firstWalletConnect: asOptional(asBoolean, true),
  firstLogin: asOptional(asBoolean, true)
})
type ScamWarningInfo = ReturnType<typeof asScamWarningInfo>
let scamWarningInfo: ScamWarningInfo

const getScamWarningInfo = async (): Promise<ScamWarningInfo> => {
  if (scamWarningInfo == null) {
    try {
      const scamWarningText = await scamWarningDisklet.getText(SCAM_WARNING_2)
      scamWarningInfo = asScamWarningInfo(JSON.parse(scamWarningText))
    } catch (error: any) {
      if ((await getFirstOpenInfo()).isFirstOpen === 'false') {
        // If this isn't the first open, don't pester the user with new scam
        // warnings. Assume this isn't their first rodeo across the board.
        scamWarningInfo = {
          firstPrivateKeyView: false,
          firstWalletConnect: false,
          firstLogin: false
        }
      } else {
        scamWarningInfo = asScamWarningInfo({})
      }
      await scamWarningDisklet.setText(SCAM_WARNING_2, JSON.stringify(scamWarningInfo))
    }
  }
  return scamWarningInfo
}

/**
 * Warning the user about bad actors that are walking the user through
 * potentially dangerous actions such as logging into pre-created accounts,
 * exposing private keys, etc.
 *
 * These scam warnings will only show once the first time they perform a
 * dangerous action.
 **/
export const showScamWarningModal = async (scamWarningInfoKey: keyof ScamWarningInfo) => {
  const scamWarningInfo = await getScamWarningInfo()

  // Ignore if we've already triggered a particular warning
  if (scamWarningInfo[scamWarningInfoKey]) {
    // Make sure we don't show this warning again for this particular scenario
    scamWarningInfo[scamWarningInfoKey] = false
    await scamWarningDisklet.setText(SCAM_WARNING_2, JSON.stringify(scamWarningInfo))

    // Show the scam warning modal
    await Airship.show((bridge: AirshipBridge<'yes' | 'no' | undefined>) => {
      return <ScamWarningModal bridge={bridge} />
    })
  }
}

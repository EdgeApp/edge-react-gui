import * as React from 'react'
import { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { BackupTextType } from '../../experimentConfig'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { openBrowserUri } from '../../util/WebUtils'
import { Paragraph, SmallText, WarningText } from '../themed/EdgeText'
import { ButtonsModal } from './ButtonsModal'

const body = lstrings.backup_message
const bodyCont = sprintf(lstrings.no_access_disclaimer_1s, config.appName)

const VARIANT_MAP = {
  original: {
    title: lstrings.backup_title,
    body,
    bodyCont,
    subtext: lstrings.backup_message_subtext
  },
  backup: {
    title: lstrings.backup_title,
    body,
    bodyCont,
    subtext: lstrings.backup_message_subtext
  },
  secure: {
    title: lstrings.secure_account_title,
    body,
    bodyCont,
    subtext: lstrings.secure_account_message_subtext
  },
  create: {
    title: lstrings.create_user_title,
    body,
    bodyCont,
    subtext: lstrings.create_user_message_subtext
  }
}

export type BackupForTransferModalResult = 'upgrade' | 'learnMore'
/**
 * Informational modal prompting the user to back up their account
 *
 * TODO: Merge our various backup modal flavors with a common design that
 * satisfies all requirements (design TBD).
 */
export const BackupForTransferModal = (props: { bridge: AirshipBridge<BackupForTransferModalResult | undefined>; variantKey: BackupTextType }) => {
  const { bridge, variantKey } = props
  const { title, body, bodyCont, subtext } = VARIANT_MAP[variantKey]

  const handleLearnMorePress = useHandler(async () => {
    openBrowserUri(config.backupAccountSite)
    return false
  })

  // Unchanged modal, different format...
  if (variantKey === 'original')
    return (
      <ButtonsModal
        bridge={bridge}
        buttons={{
          upgrade: { label: lstrings.backup_account }
        }}
        title={lstrings.backup_title}
      >
        <Paragraph>{lstrings.backup_for_transfer_message}</Paragraph>
      </ButtonsModal>
    )

  // New modal variants under testing:
  return (
    <ButtonsModal
      bridge={bridge}
      buttons={{
        upgrade: { label: lstrings.get_started_button },
        learnMore: {
          label: lstrings.learn_more,
          onPress: handleLearnMorePress,
          spinner: false
        }
      }}
      title={title}
    >
      <Paragraph>{body}</Paragraph>
      <Paragraph>{bodyCont}</Paragraph>
      <Paragraph>
        <SmallText>
          <WarningText>{subtext}</WarningText>
        </SmallText>
      </Paragraph>
    </ButtonsModal>
  )
}

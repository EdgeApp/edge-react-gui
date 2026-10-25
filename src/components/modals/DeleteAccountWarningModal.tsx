import * as React from 'react'
import type { AirshipBridge } from 'react-native-airship'
import { sprintf } from 'sprintf-js'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { parseLinkedText } from '../../util/parseLinkedText'
import { openBrowserUri } from '../../util/WebUtils'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { EdgeText, Paragraph } from '../themed/EdgeText'
import { ConfirmContinueModal } from './ConfirmContinueModal'

interface Props {
  bridge: AirshipBridge<boolean>
}

/**
 * Warns the user about what deleting their account means, and asks them to
 * acknowledge it before continuing to the username verification step.
 */
export const DeleteAccountWarningModal: React.FC<Props> = props => {
  const { bridge } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const supportUrl = config.deleteAccountSupportUrl ?? config.supportSite
  const supportLinkText = getUrlOrigin(supportUrl)

  const handleSupportPress = useHandler(() => {
    openBrowserUri(supportUrl).catch((error: unknown) => {
      showError(error)
    })
  })

  return (
    <ConfirmContinueModal
      bridge={bridge}
      title={lstrings.delete_account_title}
      agreeLabel={lstrings.delete_account_understand_impact}
      continueLabel={lstrings.string_continue}
      hideConfirmPrompt
      isSkippable
      warning
    >
      <Paragraph>
        <EdgeText style={styles.boldText}>
          {lstrings.delete_account_move_funds_warning}
        </EdgeText>
      </Paragraph>
      <Paragraph>{lstrings.delete_account_funds_inaccessible}</Paragraph>
      <Paragraph>
        {sprintf(lstrings.delete_account_partner_profiles_1s, config.appName)}
      </Paragraph>
      <Paragraph>
        {parseLinkedText(
          sprintf(
            lstrings.delete_account_contact_support_2s,
            config.appName,
            supportLinkText
          ),
          handleSupportPress,
          styles.linkText
        )}
      </Paragraph>
    </ConfirmContinueModal>
  )
}

/**
 * Shows a support article URL as just its site, such as
 * "https://support.edge.app", so the text stays short.
 */
const getUrlOrigin = (url: string): string => {
  const match = /^https?:\/\/[^/]+/.exec(url)
  return match == null ? url : match[0]
}

const getStyles = cacheStyles((theme: Theme) => ({
  boldText: {
    fontFamily: theme.fontFaceBold
  },
  linkText: {
    color: theme.textLink
  }
}))

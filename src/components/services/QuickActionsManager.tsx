import * as QuickActions from 'expo-quick-actions'
import { useQuickActionCallback } from 'expo-quick-actions/hooks'
import * as React from 'react'
import { Linking, Platform } from 'react-native'

import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { showError } from './AirshipInstance'

const DO_NOT_UNINSTALL_URL =
  'https://support.edge.app/en/articles/14439418-warning-don-t-uninstall-edge-without-your-login-credentials'
const CONTACT_SUPPORT_URL =
  'https://support.edge.app/en/articles/14054649-need-help-reach-out-via-our-chat-bubble?chat=open'

export const QuickActionsManager: React.FC = () => {
  React.useEffect(() => {
    QuickActions.setItems([
      {
        id: 'do_not_uninstall',
        title: lstrings.shortcut_do_not_uninstall_title,
        subtitle: lstrings.shortcut_do_not_uninstall_subtitle,
        icon: Platform.select({
          ios: 'symbol:nosign',
          default: 'prohibit'
        }),
        params: { url: DO_NOT_UNINSTALL_URL }
      },
      {
        id: 'contact_support',
        title: lstrings.shortcut_contact_support_title,
        subtitle: lstrings.shortcut_contact_support_subtitle,
        icon: Platform.select({
          ios: 'symbol:message.fill',
          default: 'message'
        }),
        params: { url: CONTACT_SUPPORT_URL }
      }
    ]).catch(showError)
  }, [])

  const handleQuickAction = useHandler((action: QuickActions.Action) => {
    const url = action.params?.url
    if (typeof url === 'string') {
      Linking.openURL(url).catch(showError)
    }
  })

  useQuickActionCallback(handleQuickAction)

  return null
}

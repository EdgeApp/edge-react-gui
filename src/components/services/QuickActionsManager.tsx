import * as QuickActions from 'expo-quick-actions'
import { useQuickActionCallback } from 'expo-quick-actions/hooks'
import type * as React from 'react'
import { Linking, Platform } from 'react-native'

import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { showError } from './AirshipInstance'

export const QuickActionsManager: React.FC = () => {
  useAsyncEffect(
    async () => {
      const { quickActions } = config
      if (quickActions == null) return
      try {
        await QuickActions.setItems([
          {
            id: 'do_not_uninstall',
            title: lstrings.shortcut_do_not_uninstall_title,
            subtitle: lstrings.shortcut_do_not_uninstall_subtitle,
            icon: Platform.select({
              ios: 'symbol:nosign',
              default: 'prohibit'
            }),
            params: { url: quickActions.uninstallWarningUrl }
          },
          {
            id: 'contact_support',
            title: lstrings.shortcut_contact_support_title,
            subtitle: lstrings.shortcut_contact_support_subtitle,
            icon: Platform.select({
              ios: 'symbol:message.fill',
              default: 'message'
            }),
            params: { url: quickActions.contactSupportUrl }
          }
        ])
      } catch (error: unknown) {
        showError(error)
      }
    },
    [],
    'QuickActionsManager'
  )

  const handleQuickAction = useHandler(async (action: QuickActions.Action) => {
    const url = action.params?.url
    if (typeof url !== 'string') return
    try {
      await Linking.openURL(url)
    } catch (error: unknown) {
      showError(error)
    }
  })

  useQuickActionCallback(handleQuickAction)

  return null
}

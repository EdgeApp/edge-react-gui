import * as QuickActions from 'expo-quick-actions'
import { useQuickActionCallback } from 'expo-quick-actions/hooks'
import * as React from 'react'
import { AppState, Linking, Platform } from 'react-native'

import { useAsyncEffect } from '../../hooks/useAsyncEffect'
import { useHandler } from '../../hooks/useHandler'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { trackError } from '../../util/tracking'
import { showError } from './AirshipInstance'

export const QuickActionsManager: React.FC = () => {
  // Android cannot register shortcuts until the app has a resumed activity, and
  // the OS rate-limits shortcut updates made without one. This component mounts
  // at the top of the app, which on Android can happen before the activity is
  // published, so wait for the first foreground before registering:
  const [isForeground, setIsForeground] = React.useState(
    AppState.currentState === 'active'
  )

  React.useEffect(() => {
    if (isForeground) return
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active') setIsForeground(true)
    })
    return () => {
      listener.remove()
    }
  }, [isForeground])

  useAsyncEffect(
    async () => {
      const { quickActions } = config
      if (quickActions == null || !isForeground) return
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
        // Shortcuts are an optional convenience, so a registration failure
        // must never block startup with an error modal:
        trackError(error, 'QuickActionsManager')
      }
    },
    [isForeground],
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

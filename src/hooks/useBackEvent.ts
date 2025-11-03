import type { NavigationProp } from '@react-navigation/native'
import * as React from 'react'

/**
 * Hook that listens for the back navigation event and calls the provided handler
 * when the GO_BACK action is detected.
 *
 * @param navigation - The navigation prop from React Navigation
 * @param handleBack - Callback function to execute when back navigation occurs
 */
export const useBackEvent = (
  navigation: NavigationProp<any>,
  handleBack: () => void
): void => {
  React.useEffect(() => {
    return navigation.addListener('beforeRemove', e => {
      // If we're going back, call the handler
      if (e.data.action.type === 'GO_BACK' || e.data.action.type === 'POP') {
        const routeName = navigation.getState()?.routes?.slice(-1)?.[0]?.name
        // Only call handler if we're still on the current screen
        if (routeName != null) {
          handleBack()
        }
      }
    })
  }, [navigation, handleBack])
}

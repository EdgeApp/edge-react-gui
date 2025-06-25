import * as React from 'react'
import { Keyboard, Platform } from 'react-native'
import { KeyboardAccessoryView } from 'react-native-keyboard-accessory'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useSelector } from '../../types/reactRedux'
import { EdgeButton } from '../buttons/EdgeButton'
import { MAX_TAB_BAR_HEIGHT } from '../themed/MenuTabs'

interface KavButtonProps {
  children?: React.ReactNode
  disabled?: boolean
  hasNotifications?: boolean
  hasTabs?: boolean
  label?: string
  spinner?: boolean
  testID?: string
  visible?: boolean
  onPress?: () => void | Promise<void>
}

/**
 * A keyboard accessory button that spans most of the width of the screen,
 * positioned above the keyboard.
 *
 * IMPORTANT: This component MUST be placed as a direct sibling of SceneWrapper
 * for proper keyboard positioning.
 *
 * TODO: Consider moving this to SceneWrapper since there is a lot of duplicate
 * inset logic
 */
export const KavButton = (props: KavButtonProps) => {
  const { children, disabled = false, label, onPress, spinner = false, visible = true, testID, hasTabs = false, hasNotifications = false } = props
  const isIos = Platform.OS === 'ios'

  const safeAreaInsets = useSafeAreaInsets()
  const notificationHeight = useSelector(state => state.ui.notificationHeight)

  const [isKeyboardVisible, setKeyboardVisible] = React.useState(false)

  React.useEffect(() => {
    // Listening event is different between iOS and Android, but actually mean
    // the same thing: when the keyboard begins its movement
    const keyboardDidShowListener = Keyboard.addListener(isIos ? 'keyboardWillShow' : 'keyboardDidShow', () => {
      setKeyboardVisible(true)
    })
    const keyboardDidHideListener = Keyboard.addListener(isIos ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      setKeyboardVisible(false)
    })

    return () => {
      keyboardDidShowListener.remove()
      keyboardDidHideListener.remove()
    }
  }, [isIos])

  const maybeTabBarHeight = hasTabs ? MAX_TAB_BAR_HEIGHT : 0
  const maybeNotificationHeight = hasNotifications ? notificationHeight : 0

  const keyboardAccessoryStyle = React.useMemo(
    () => ({
      backgroundColor: 'transparent',
      marginBottom: isKeyboardVisible ? 0 : safeAreaInsets.bottom + maybeTabBarHeight + maybeNotificationHeight
    }),
    [isKeyboardVisible, safeAreaInsets.bottom, maybeTabBarHeight, maybeNotificationHeight]
  )

  return !visible ? null : (
    <KeyboardAccessoryView style={keyboardAccessoryStyle} avoidKeyboard alwaysVisible hideBorder>
      <EdgeButton type="primary" disabled={disabled} label={label} onPress={onPress} spinner={spinner} testID={testID} layout="fullWidth">
        {children}
      </EdgeButton>
    </KeyboardAccessoryView>
  )
}

/**
 * IMPORTANT: Changes in this file MUST be synced between edge-react-gui and
 * edge-login-ui-rn!
 */
import * as React from 'react'
import { Platform, TextInput, View } from 'react-native'
import { cacheStyles } from 'react-native-patina'

import { fixSides, mapSides, sidesToMargin } from '../../../util/sides'
import { EdgeTouchableWithoutFeedback } from '../../common/EdgeTouchableWithoutFeedback'
import { Theme, useTheme } from '../../services/ThemeContext'
import { PinDots } from './DigitInput/PinDots'

export const MAX_PIN_LENGTH = 4

interface Props {
  testID?: string
  pin: string
  maxPinLength?: number
  marginRem?: number[] | number
  onChangePin: (newPin: string) => void
}

export const DigitInput = (props: Props) => {
  const { testID, pin, maxPinLength = MAX_PIN_LENGTH, marginRem, onChangePin } = props

  const theme = useTheme()
  const styles = getStyles(theme)
  const spacings = sidesToMargin(mapSides(fixSides(marginRem, 0.5), theme.rem))

  const inputRef = React.useRef<TextInput | null>(null)

  const handleRefocus = () => {
    if (inputRef.current != null) {
      // We don't lose focus when the user closes the keyboard
      // with the hardware back button, so blur first to fix that:
      if (Platform.OS === 'android') inputRef.current.blur()
      inputRef.current.focus()
    }
  }

  return (
    <EdgeTouchableWithoutFeedback testID={testID} onPress={handleRefocus}>
      <View style={[styles.container, spacings]}>
        <View style={styles.interactiveContainer}>
          <PinDots pinLength={pin.length} maxLength={maxPinLength} />
        </View>
        <TextInput
          ref={inputRef}
          style={styles.input}
          onChangeText={onChangePin}
          maxLength={maxPinLength}
          keyboardType="number-pad"
          returnKeyType={Platform.OS === 'ios' ? undefined : 'none'}
          value={pin}
          autoFocus
        />
      </View>
    </EdgeTouchableWithoutFeedback>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    alignSelf: 'center'
  },
  interactiveContainer: {
    width: theme.rem(13)
  },
  input: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    opacity: 0
  }
}))

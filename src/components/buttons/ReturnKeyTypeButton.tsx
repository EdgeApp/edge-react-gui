import * as React from 'react'
import { View } from 'react-native'

import { lstrings } from '../../locales/strings'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { FilledTextInputReturnKeyType } from '../themed/FilledTextInput'
import { EdgeButton } from './EdgeButton'

interface ReturnKeyTypeButtonProps {
  returnKeyType: FilledTextInputReturnKeyType
  onPress: () => void | Promise<void>
}

export const ReturnKeyTypeButton = (props: ReturnKeyTypeButtonProps) => {
  const { returnKeyType, onPress } = props

  const theme = useTheme()
  const styles = getStyles(theme)

  const getButtonLabel = (keyType: FilledTextInputReturnKeyType): string => {
    switch (keyType) {
      case 'done':
        return lstrings.string_done_cap
      case 'next':
        return lstrings.string_next_capitalized
      case 'go':
        return lstrings.string_ok // Fallback to "OK" for go
      case 'search':
        return lstrings.string_ok // Fallback to "OK" for search
      case 'send':
        return lstrings.fragment_send_subtitle // Uses "Send"
      case 'none':
        return lstrings.string_ok // Fallback to "OK" for none
      default:
        return lstrings.string_ok
    }
  }

  return (
    <View style={styles.buttonContainer}>
      <EdgeButton
        type="primary"
        mini
        label={getButtonLabel(returnKeyType)}
        layout="solo"
        onPress={onPress}
      />
    </View>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  buttonContainer: {
    marginRight: theme.rem(0.5),
    marginBottom: theme.rem(0.5),
    alignItems: 'flex-end'
  }
}))

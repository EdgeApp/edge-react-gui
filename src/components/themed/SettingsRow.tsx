import * as React from 'react'
import { ActivityIndicator, Text, TextStyle, TouchableHighlight } from 'react-native'

import { usePendingPress } from '../../hooks/usePendingPress'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

interface Props {
  children?: React.ReactNode

  // Show with a dim style when set. Defaults to false:
  disabled?: boolean

  // Show with red text when set. Defaults to false:
  dangerous?: boolean

  // Insert a text label after the other children when set:
  label?: string

  // An interactive control to render on the right:
  right?: React.ReactNode

  // Called when the user presses the row.
  // If the callback returns a promise, the row will disable itself
  // and show a spinner until the promise resolves.
  onPress?: () => void | Promise<void>
}

/**
 * A settings row places an interactive control next to a description,
 * which can be some combination of React children and a plain text label.
 */
const SettingsRowComponent = (props: Props) => {
  const { children, disabled = false, dangerous = false, label = '', right, onPress } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const [pending, handlePress] = usePendingPress(onPress)

  return (
    <TouchableHighlight underlayColor={theme.settingsRowPressed} style={styles.row} onPress={handlePress}>
      <>
        {children}
        <Text style={disabled ? styles.disabledText : dangerous ? styles.dangerText : styles.text}>{label}</Text>
        {pending ? <ActivityIndicator color={theme.iconTappable} style={styles.spinner} /> : right}
      </>
    </TouchableHighlight>
  )
}

const getStyles = cacheStyles((theme: Theme) => {
  const commonText: TextStyle = {
    flexGrow: 1,
    flexShrink: 1,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    textAlign: 'left',
    paddingHorizontal: theme.rem(0.5)
  }

  return {
    row: {
      alignItems: 'center',
      backgroundColor: theme.settingsRowBackground,
      flexDirection: 'row',
      marginBottom: theme.rem(1 / 16),
      minHeight: theme.rem(3),
      padding: theme.rem(0.5)
    },
    text: {
      ...commonText,
      color: theme.primaryText
    },
    disabledText: {
      ...commonText,
      color: theme.deactivatedText
    },
    dangerText: {
      ...commonText,
      color: theme.dangerText
    },
    spinner: {
      height: theme.rem(1.5),
      marginHorizontal: theme.rem(0.5)
    }
  }
})

export const SettingsRow = React.memo(SettingsRowComponent)

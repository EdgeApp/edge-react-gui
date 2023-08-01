import * as React from 'react'
import { ActivityIndicator, Text, TextStyle, TouchableHighlight, View } from 'react-native'
import Animated, { useAnimatedStyle, withDelay, withTiming } from 'react-native-reanimated'

import { usePendingPress } from '../../hooks/usePendingPress'
import { styled } from '../hoc/styled'
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

const ACTIVITY_INDICATOR_FADE_IN_DURATION = 500
const ACTIVITY_INDICATOR_FADE_IN_DELAY = 100

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
        <View>
          <ActivityContainer pending={pending}>
            <ActivityIndicator color={theme.iconTappable} style={styles.spinner} />
          </ActivityContainer>
          <RightContainer pending={pending}>{right}</RightContainer>
        </View>
      </>
    </TouchableHighlight>
  )
}

const ActivityContainer = styled(Animated.View)<{ pending: boolean }>(_theme => props => {
  return [
    {
      position: 'absolute',
      aspectRatio: 1,
      width: '100%',
      zIndex: 1
    },
    useAnimatedStyle(() => ({
      opacity: withDelay(
        props.pending ? ACTIVITY_INDICATOR_FADE_IN_DELAY : 0,
        withTiming(props.pending ? 1 : 0, { duration: ACTIVITY_INDICATOR_FADE_IN_DURATION })
      )
    }))
  ]
})

const RightContainer = styled(Animated.View)<{ pending: boolean }>(
  _theme => props =>
    useAnimatedStyle(() => ({
      opacity: withDelay(
        props.pending ? ACTIVITY_INDICATOR_FADE_IN_DELAY : 0,
        withTiming(props.pending ? 0 : 1, { duration: ACTIVITY_INDICATOR_FADE_IN_DURATION })
      )
    }))
)

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

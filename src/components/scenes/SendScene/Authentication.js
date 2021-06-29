// @flow

import React from 'react'
import { View, TextInput } from 'react-native'

import s from '../../../locales/strings.js'
import { useRef } from '../../../util/hooks'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../../services/ThemeContext.js'

import { PinDots } from '../../themed/PinDots.js'
import { Tile } from '../../themed/Tile.js'

type Props = {
  authRequired: 'pin' | 'none',
  pin: string,
  onChangePin: (pin: string) => void,
}

const PIN_MAX_LENGTH = 4

const AuthenticationComponent = ({ authRequired, pin, onChangePin, theme }: Props & ThemeProps) => {
  const styles = getStyles(theme)
  const inputRef = useRef(null)

  const handleFocus = () => {
    if (inputRef.current && inputRef.current.focus) {
      inputRef.current.focus()
    }
  }

  const handleChange = (pin: string) => {
    onChangePin(pin)

    if (pin.length >= PIN_MAX_LENGTH && inputRef.current) {
      inputRef.current.blur()
    }
  }

  if (authRequired === 'none') return null

  return (
    <Tile type="touchable" title={s.strings.four_digit_pin} onPress={handleFocus}>
      <View style={styles.container}>
        <PinDots pinLength={pin.length} maxLength={PIN_MAX_LENGTH} />
      </View>
      <TextInput
        ref={inputRef}
        maxLength={PIN_MAX_LENGTH}
        onChangeText={handleChange}
        keyboardType="numeric"
        returnKeyType="done"
        placeholder="Enter PIN"
        placeholderTextColor={theme.textLink}
        style={styles.input}
        value={pin}
        secureTextEntry
      />
    </Tile>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    marginTop: theme.rem(0.25)
  },
  input: {
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    color: theme.primaryText,
    position: 'absolute',
    width: 0,
    height: 0
  }
}))

export const Authentication = withTheme(AuthenticationComponent)

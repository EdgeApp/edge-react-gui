// @flow

// $FlowFixMe
import React, { useEffect, useRef, useState } from 'react'
import { View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'

import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext'
import { EdgeTextFieldOutlined } from '../themed/EdgeTextField.js'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'

type OwnProps = {
  bridge: AirshipBridge<string | null>,
  value: string,
  label: string,
  title: string
}

type Props = OwnProps & ThemeProps

const SingleInputModalComponent = ({ bridge, title, label, theme, value: propsValue }: Props) => {
  const textInput = useRef(null)
  const [value, setValue] = useState(propsValue)
  const [isFocused, setIsFocused] = useState(false)
  const styles = getStyles(theme)

  useEffect(() => {
    if (textInput.current) {
      textInput.current.focus()
    }
  }, [])

  const clearText = () => {
    setValue('')

    if (textInput.current) {
      textInput.current.blur()
    }
  }

  return (
    <ThemedModal bridge={bridge} onCancel={() => bridge.resolve(null)} paddingRem={[1, 0]}>
      <ModalTitle center paddingRem={[0, 3, 1]}>
        {title}
      </ModalTitle>
      <View style={styles.field}>
        <EdgeTextFieldOutlined
          autoFocus
          keyboardType="default"
          label={label}
          onChangeText={setValue}
          onSubmitEditing={() => bridge.resolve(value)}
          value={value}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="next"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onClear={clearText}
          isClearable={isFocused}
          marginRem={[0, 1]}
          ref={textInput}
          blurOnSubmit
        />
      </View>
      <ModalCloseArrow onPress={() => bridge.resolve(null)} />
    </ThemedModal>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  field: {
    marginHorizontal: theme.rem(0.75)
  }
}))

export const SingleInputModal = withTheme(SingleInputModalComponent)

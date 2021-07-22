// @flow

import * as React from 'react'
import { View } from 'react-native'
import { type AirshipBridge } from 'react-native-airship'

import { useEffect, useRef, useState } from '../../types/reactHooks.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext'
import { EdgeTextFieldOutlined } from '../themed/EdgeOutlinedField'
import { ModalCloseArrow, ModalTitle } from '../themed/ModalParts.js'
import { ThemedModal } from '../themed/ThemedModal.js'

type OwnProps = {
  bridge: AirshipBridge<string | null>,
  label: string,
  title: string,
  value?: string,
  returnKeyType?: string,
  onSubmit?: (value: string) => void
}

type Props = OwnProps & ThemeProps

const SingleInputModalComponent = ({ bridge, title, label, theme, onSubmit, value: propsValue = '', returnKeyType = 'done' }: Props) => {
  const textInput = useRef(null)
  const [value, setValue] = useState(propsValue)
  const [isFocused, setIsFocused] = useState(false)
  const styles = getStyles(theme)
  const onSubmitEditing = () => {
    const handleSubmit = onSubmit || bridge.resolve
    handleSubmit(value)
  }

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
          onSubmitEditing={onSubmitEditing}
          value={value}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType={returnKeyType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onClear={clearText}
          isClearable={isFocused}
          marginRem={[0, 1]}
          ref={textInput}
          blurOnSubmit
          showSearchIcon={returnKeyType === 'search'}
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

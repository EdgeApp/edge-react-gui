import * as React from 'react'
import { View } from 'react-native'

import { useTheme } from '../../../components/services/ThemeContext'
import { OutlinedTextInput, OutlinedTextInputRef, OutlinedTextInputReturnKeyType } from '../../../components/themed/OutlinedTextInput'
import { FORM_FIELD_DISPLAY_PROPS, FormFieldType } from '../../../types/FormTypes'

// TODO: Consolidate with FormField

interface Props {
  label: string
  fieldType?: FormFieldType
  key?: string
  autofocus?: boolean
  returnKeyType?: OutlinedTextInputReturnKeyType
  fieldRef?: React.Ref<OutlinedTextInputRef> | undefined
  value?: string
  onChangeText: ((text: string) => void) | undefined
  onFocus?: (() => void) | undefined
  onBlur?: (() => void) | undefined
}

export const GuiFormField = React.memo((props: Props) => {
  const {
    fieldType = 'text',
    key = fieldType || undefined,
    label,
    autofocus = false,
    returnKeyType = 'next',
    fieldRef,
    value,
    onChangeText: handleChangeText,
    onFocus: handleFocus,
    onBlur: handleBlur
  } = props
  const theme = useTheme()

  const { widthRem, textInputProps } = FORM_FIELD_DISPLAY_PROPS[fieldType]

  const widthStyle = React.useMemo(
    () =>
      widthRem != null
        ? {
            width: theme.rem(widthRem)
          }
        : undefined,
    [theme, widthRem]
  )

  return (
    <View key={key} style={widthStyle}>
      <OutlinedTextInput
        autoCorrect={false}
        autoFocus={autofocus}
        label={label}
        ref={fieldRef}
        returnKeyType={returnKeyType}
        value={value ?? ''}
        onBlur={handleBlur}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        {...textInputProps}
      />
    </View>
  )
})

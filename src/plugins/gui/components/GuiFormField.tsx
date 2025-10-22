import * as React from 'react'
import { View } from 'react-native'

import {
  cacheStyles,
  type Theme,
  useTheme
} from '../../../components/services/ThemeContext'
import {
  FilledTextInput,
  type FilledTextInputRef,
  type FilledTextInputReturnKeyType
} from '../../../components/themed/FilledTextInput'
import {
  FORM_FIELD_DISPLAY_PROPS,
  type FormFieldType
} from '../../../types/FormTypes'

// TODO: Consolidate with FormField

interface Props {
  label: string
  fieldType?: FormFieldType
  key?: string
  autofocus?: boolean
  returnKeyType?: FilledTextInputReturnKeyType
  fieldRef?: React.Ref<FilledTextInputRef> | undefined
  value?: string
  error?: string
  onChangeText: ((text: string) => void) | undefined
  onFocus?: (() => void) | undefined
  onBlur?: (() => void) | undefined
  onSubmitEditing?: () => void
}

export const GuiFormField = React.memo((props: Props) => {
  const {
    fieldType = 'text',
    key = fieldType,
    label,
    autofocus = false,
    returnKeyType = 'next',
    fieldRef,
    value,
    error,
    onChangeText: handleChangeText,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onSubmitEditing: handleSubmitEditing
  } = props
  const theme = useTheme()
  const styles = getStyles(theme)

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
    <View key={key} style={[styles.container, widthStyle]}>
      <FilledTextInput
        autoCorrect={false}
        autoFocus={autofocus}
        placeholder={label}
        ref={fieldRef}
        returnKeyType={returnKeyType}
        value={value ?? ''}
        error={error}
        onBlur={handleBlur}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onSubmitEditing={handleSubmitEditing}
        aroundRem={0.5}
        {...textInputProps}
      />
    </View>
  )
})

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flex: 1
  }
}))

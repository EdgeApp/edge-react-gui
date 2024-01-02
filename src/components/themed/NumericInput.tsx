import React, { forwardRef, useEffect } from 'react'
import { TextInput, TextInputProps } from 'react-native'
import Animated from 'react-native-reanimated'

import { useHandler } from '../../hooks/useHandler'
import { formatNumberInput, formatToNativeNumber, isValidInput } from '../../locales/intl'
import { useState } from '../../types/reactHooks'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

type Props = {
  minDecimals?: number
  maxDecimals?: number
  animated?: boolean
} & TextInputProps

export const NumericInput = forwardRef<TextInput, Props>((props: Props, ref) => {
  const { animated = false, onChangeText, minDecimals, maxDecimals, value, ...rest } = props
  const [innerValue, setInnerValue] = useState<string>(props.value ?? '')

  useEffect(() => {
    const propVal = props.value ?? ''
    const displayNum = propVal === '' ? '' : formatNumberInput(propVal, { minDecimals, maxDecimals })
    setInnerValue(displayNum)
  }, [maxDecimals, minDecimals, props.value])

  const handleChangeText = useHandler(text => {
    if (isValidInput(text)) {
      const nativeNum = text === '' ? '' : formatToNativeNumber(text)
      const displayNum = text === '' ? '' : formatNumberInput(nativeNum, { minDecimals, maxDecimals })
      if (displayNum !== innerValue) {
        if (onChangeText != null) onChangeText(nativeNum)
        setInnerValue(displayNum)
      }
    }
  })

  if (animated) return <AnimatedTextInput ref={ref} onChangeText={handleChangeText} keyboardType="decimal-pad" value={innerValue} {...rest} />
  return <TextInput ref={ref} onChangeText={handleChangeText} keyboardType="decimal-pad" value={innerValue} {...rest} />
})

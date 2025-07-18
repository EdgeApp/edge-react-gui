import * as React from 'react'

import {
  formatNumberInput,
  formatToNativeNumber,
  isValidInput
} from '../locales/intl'
import { useState } from '../types/reactHooks'
import { useHandler } from './useHandler'

/**
 * Options to be passed to `useNumericInput`.
 */
export interface NumericInputOpts {
  minDecimals?: number
  maxDecimals?: number
  value?: string
  onChangeText?: (value: string) => void
}

/**
 * Pass these props to the raw `TextInput` component.
 */
interface NumericInputProps {
  keyboardType: 'decimal-pad'
  value: string
  onChangeText: (text: string) => void
}

/**
 * Creates a set of props to be passed to a `TextInput` component.
 * These will handle edits to the text, forcing the input to be a valid number.
 */
export function useNumericInputProps(
  opts: NumericInputOpts
): NumericInputProps {
  const { minDecimals, maxDecimals, value = '', onChangeText } = opts
  const [innerValue, setInnerValue] = useState<string>(value)

  React.useEffect(() => {
    const displayNum =
      value === '' ? '' : formatNumberInput(value, { minDecimals, maxDecimals })
    setInnerValue(displayNum)
  }, [maxDecimals, minDecimals, value])

  const handleChangeText = useHandler((text: string) => {
    if (isValidInput(text)) {
      const nativeNum = text === '' ? '' : formatToNativeNumber(text)
      const displayNum =
        text === ''
          ? ''
          : formatNumberInput(nativeNum, { minDecimals, maxDecimals })
      if (displayNum !== innerValue) {
        if (onChangeText != null) onChangeText(nativeNum)
        setInnerValue(displayNum)
      }
    }
  })

  return {
    keyboardType: 'decimal-pad',
    value: innerValue,
    onChangeText: handleChangeText
  }
}

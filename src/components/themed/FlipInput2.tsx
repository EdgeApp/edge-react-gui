import { eq } from 'biggystring'
import * as React from 'react'
import { Platform, ReturnKeyType, TextInput, TouchableWithoutFeedback, View } from 'react-native'
import Animated, { AnimationCallback, Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

import { Fontello } from '../../assets/vector'
import { useHandler } from '../../hooks/useHandler'
import { formatNumberInput, isValidInput } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { useState } from '../../types/reactHooks'
import { showError } from '../services/AirshipInstance'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'
import { NumericInput } from './NumericInput'
import { ButtonBox } from './ThemedButtons'

export interface FlipInputRef {
  setAmounts: (value: string[]) => void
}

export type FieldNum = 0 | 1
export interface FlipInputFieldInfo {
  currencyName: string

  // Maximum number of decimals to allow the user to enter. FlipInput will automatically truncate use input to this
  // number of decimals as the user types.
  maxEntryDecimals: number
}

export interface Props {
  onNext?: () => void
  convertValue: (sourceFieldNum: FieldNum, value: string) => Promise<string | undefined>
  startAmounts: [string, string]
  forceFieldNum?: FieldNum
  keyboardVisible?: boolean
  inputAccessoryViewID?: string
  fieldInfos: FlipInputFieldInfo[]
  returnKeyType?: ReturnKeyType
  editable?: boolean
}

const FLIP_DURATION = 500
const flipField = (fieldNum: FieldNum): FieldNum => {
  return fieldNum === 0 ? 1 : 0
}

export const FlipInput2 = React.forwardRef<FlipInputRef, Props>((props: Props, ref) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const inputRefs = [React.useRef<TextInput>(null), React.useRef<TextInput>(null)]

  const { startAmounts, fieldInfos, keyboardVisible, returnKeyType = 'done', onNext, inputAccessoryViewID, convertValue, forceFieldNum = 0, editable } = props
  const animatedValue = useSharedValue(forceFieldNum)

  // `amounts` is always a 2-tuple
  const [amounts, setAmounts] = useState<[string, string]>(startAmounts)

  // primaryField is the index into the 2-tuple, 0 or 1
  const [primaryField, setPrimaryField] = useState<FieldNum>(forceFieldNum)

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const degrees = interpolate(animatedValue.value, [0, 0.5, 1], [0, 90, 90])
    return {
      transform: [{ rotateX: `${degrees}deg` }]
    }
  })
  const backAnimatedStyle = useAnimatedStyle(() => {
    const degrees = interpolate(animatedValue.value, [0, 0.5, 1], [90, 90, 0])
    return {
      transform: [{ rotateX: `${degrees}deg` }]
    }
  })

  const onToggleFlipInput = useHandler(() => {
    const otherField = primaryField === 1 ? 0 : 1
    inputRefs[otherField]?.current?.focus()

    const jsCallback: AnimationCallback = done => {
      'worklet'
      if (done === true) runOnJS(setPrimaryField)(otherField)
    }

    animatedValue.value = withTiming(
      otherField,
      {
        duration: FLIP_DURATION,
        easing: Easing.inOut(Easing.ease)
      },
      jsCallback
    )
  })

  const onNumericInputChange = useHandler((text: string) => {
    convertValue(primaryField, text)
      .then(amount => {
        if (amount != null) {
          const otherField = flipField(primaryField)
          const newAmounts: [string, string] = ['', '']
          newAmounts[primaryField] = text
          newAmounts[otherField] = amount
          setAmounts(newAmounts)
        }
      })
      .catch(e => showError(e.message))
  })

  const bottomRow = useHandler((fieldNum: FieldNum) => {
    const primaryAmount = amounts[fieldNum]
    const amountBlank = eq(primaryAmount, '0') ? lstrings.string_amount : ''
    const currencyNameStyle = amountBlank ? styles.bottomCurrencyMuted : styles.bottomCurrency
    const currencyName = fieldInfos[fieldNum].currencyName

    return (
      <View style={styles.bottomContainer} key="bottom">
        <View style={styles.valueContainer}>
          <NumericInput
            style={styles.bottomAmount}
            value={primaryAmount}
            maxDecimals={fieldInfos[fieldNum].maxEntryDecimals}
            // HACK: For some reason there's no way to avoid the rightmost
            // visual cutoff of the 'Amount' string in Android. Pad with an
            // extra space.
            placeholder={Platform.OS === 'android' ? amountBlank + ' ' : amountBlank}
            placeholderTextColor={theme.deactivatedText}
            onChangeText={onNumericInputChange}
            autoCorrect={false}
            editable={editable}
            returnKeyType={returnKeyType}
            autoFocus={primaryField === fieldNum && keyboardVisible}
            ref={inputRefs[fieldNum]}
            onSubmitEditing={onNext}
            inputAccessoryViewID={inputAccessoryViewID}
          />
          <EdgeText style={currencyNameStyle}>{' ' + currencyName}</EdgeText>
        </View>
      </View>
    )
  })

  const topRow = useHandler((fieldNum: FieldNum) => {
    let topText = amounts[fieldNum]
    if (isValidInput(topText)) {
      topText = formatNumberInput(topText, { minDecimals: 0, maxDecimals: fieldInfos[fieldNum].maxEntryDecimals })
    }

    const fieldInfo = fieldInfos[fieldNum]
    topText = `${topText} ${fieldInfo.currencyName}`
    return (
      <TouchableWithoutFeedback onPress={onToggleFlipInput} key="top">
        <EdgeText>{topText}</EdgeText>
      </TouchableWithoutFeedback>
    )
  })

  React.useImperativeHandle(ref, () => ({
    setAmounts: amounts => {
      setAmounts([amounts[0], amounts[1]])
    }
  }))

  return (
    <>
      <View style={styles.flipInputContainer}>
        <View style={styles.flipInput}>
          <Animated.View style={[styles.flipInputFront, frontAnimatedStyle]} pointerEvents={flipField(primaryField) ? 'auto' : 'none'}>
            {topRow(1)}
            {bottomRow(0)}
          </Animated.View>
          <Animated.View style={[styles.flipInputFront, styles.flipContainerBack, backAnimatedStyle]} pointerEvents={primaryField ? 'auto' : 'none'}>
            {topRow(0)}
            {bottomRow(1)}
          </Animated.View>
        </View>
        <ButtonBox onPress={onToggleFlipInput} paddingRem={[0.5, 0, 0.5, 1]}>
          <Fontello style={styles.flipIcon} name="exchange" color={theme.iconTappable} size={theme.rem(1.5)} />
        </ButtonBox>
      </View>
    </>
  )
})

const getStyles = cacheStyles((theme: Theme) => {
  const isIos = Platform.OS === 'ios'
  return {
    // Flip Input
    flipInputContainer: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    flipInput: {
      flex: 1,
      paddingRight: theme.rem(0.5)
    },
    flipInputFront: {
      backfaceVisibility: 'hidden'
    },
    flipContainerBack: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    },
    flipIcon: {
      marginRight: -theme.rem(0.125)
    },

    // Top Amount
    bottomContainer: {
      flexDirection: 'row',
      marginRight: theme.rem(1.5),
      minHeight: theme.rem(2)
    },
    valueContainer: {
      flexDirection: 'row',
      marginRight: theme.rem(0.5),
      marginLeft: isIos ? 0 : -6,
      marginTop: isIos ? 0 : -theme.rem(0.75),
      marginBottom: isIos ? 0 : -theme.rem(1)
    },
    bottomAmount: {
      paddingRight: isIos ? 0 : theme.rem(0.25),
      color: theme.primaryText,
      includeFontPadding: false,
      fontFamily: theme.fontFaceMedium,
      fontSize: isIos ? theme.rem(1.5) : theme.rem(1.45)
    },
    bottomCurrency: {
      paddingTop: isIos ? theme.rem(0.125) : theme.rem(1),
      marginLeft: isIos ? 0 : -theme.rem(0.25)
    },
    bottomCurrencyMuted: {
      paddingTop: isIos ? theme.rem(0.125) : theme.rem(1),
      color: theme.deactivatedText,
      marginLeft: isIos ? 0 : -theme.rem(0.25)
    }
  }
})

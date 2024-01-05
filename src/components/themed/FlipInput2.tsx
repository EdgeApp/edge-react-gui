import * as React from 'react'
import { useMemo } from 'react'
import { Platform, ReturnKeyType, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native'
import Animated, {
  AnimationCallback,
  Easing,
  interpolate,
  interpolateColor,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated'

import { useHandler } from '../../hooks/useHandler'
import { formatNumberInput, isValidInput } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { useState } from '../../types/reactHooks'
import { zeroString } from '../../util/utils'
import { styled, styledWithRef } from '../hoc/styled'
import { FlipIcon } from '../icons/ThemedIcons'
import { showError } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
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
export type FlipInputFieldInfos = [FlipInputFieldInfo, FlipInputFieldInfo]

export interface Props {
  onBlur?: () => void
  onFocus?: () => void
  onNext?: () => void
  convertValue: (sourceFieldNum: FieldNum, value: string) => Promise<string | undefined>
  startAmounts: [string, string]
  forceFieldNum?: FieldNum
  keyboardVisible?: boolean
  inputAccessoryViewID?: string
  fieldInfos: FlipInputFieldInfos
  returnKeyType?: ReturnKeyType
  editable?: boolean
}

const FLIP_DURATION = 300
const flipField = (fieldNum: FieldNum): FieldNum => {
  return fieldNum === 0 ? 1 : 0
}

export const FlipInput2 = React.forwardRef<FlipInputRef, Props>((props: Props, ref) => {
  const theme = useTheme()
  const inputRefs = [React.useRef<TextInput>(null), React.useRef<TextInput>(null)]

  const {
    startAmounts,
    fieldInfos,
    keyboardVisible,
    returnKeyType = 'done',
    onBlur,
    onFocus,
    onNext,
    inputAccessoryViewID,
    convertValue,
    forceFieldNum = 0,
    editable
  } = props
  const animatedValue = useSharedValue(forceFieldNum)

  // `amounts` is always a 2-tuple
  const [amounts, setAmounts] = useState<[string, string]>(startAmounts)

  // primaryField is the index into the 2-tuple, 0 or 1
  const [primaryField, setPrimaryField] = useState<FieldNum>(forceFieldNum)

  const [amountFocused, setAmountFocused] = useState(false)
  const focusAnimation = useSharedValue(0)

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

  const handleBottomFocus = useHandler(() => {
    setAmountFocused(true)
    focusAnimation.value = withTiming(1, { duration: 300 })
    if (onFocus != null) onFocus()
  })

  const handleBottomBlur = useHandler(() => {
    setAmountFocused(false)
    focusAnimation.value = withDelay(120, withTiming(0, { duration: 300 }))
    if (onBlur != null) onBlur()
  })

  const renderBottomRow = (fieldNum: FieldNum) => {
    const zeroAmount = zeroString(amounts[fieldNum])
    const primaryAmount = zeroAmount && !amountFocused ? '' : amounts[fieldNum]

    const placeholderOrAmount = zeroAmount && !amountFocused ? lstrings.string_tap_to_edit : primaryAmount
    const showBottomCurrency = amountFocused || !zeroAmount
    const currencyName = fieldInfos[fieldNum].currencyName

    return (
      <BottomContainerView key="bottom">
        <ValueContainerView>
          <AmountAnimatedNumericInput
            value={primaryAmount}
            focusAnimation={focusAnimation}
            maxDecimals={fieldInfos[fieldNum].maxEntryDecimals}
            // HACK: For some reason there's no way to avoid the rightmost
            // visual cutoff of the 'Amount' string in Android. Pad with an
            // extra space.
            placeholder={Platform.OS === 'android' ? placeholderOrAmount + ' ' : placeholderOrAmount}
            placeholderTextColor={theme.textInputPlaceholderColor}
            onChangeText={onNumericInputChange}
            autoCorrect={false}
            editable={editable}
            returnKeyType={returnKeyType}
            autoFocus={primaryField === fieldNum && keyboardVisible}
            ref={inputRefs[fieldNum]}
            onSubmitEditing={onNext}
            inputAccessoryViewID={inputAccessoryViewID}
            onFocus={handleBottomFocus}
            onBlur={handleBottomBlur}
          />
          {showBottomCurrency ? <CurrencySymbolAnimatedText focusAnimation={focusAnimation}>{' ' + currencyName}</CurrencySymbolAnimatedText> : null}
        </ValueContainerView>
      </BottomContainerView>
    )
  }

  const renderTopRow = (fieldNum: FieldNum) => {
    let topText = amounts[fieldNum]
    if (isValidInput(topText)) {
      topText = formatNumberInput(topText, { minDecimals: 0, maxDecimals: fieldInfos[fieldNum].maxEntryDecimals })
    }

    const fieldInfo = fieldInfos[fieldNum]
    topText = `${topText} ${fieldInfo.currencyName}`
    return (
      <TouchableWithoutFeedback onPress={onToggleFlipInput} key="top">
        <PlaceholderText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
          {topText}
        </PlaceholderText>
      </TouchableWithoutFeedback>
    )
  }

  React.useImperativeHandle(ref, () => ({
    setAmounts: amounts => {
      setAmounts([amounts[0], amounts[1]])
    }
  }))

  return (
    <>
      <ContainerView>
        <InnerView focusAnimation={focusAnimation}>
          <FrontAnimatedView animatedValue={animatedValue} pointerEvents={flipField(primaryField) ? 'auto' : 'none'}>
            {renderTopRow(1)}
            {renderBottomRow(0)}
          </FrontAnimatedView>
          <BackAnimatedView animatedValue={animatedValue} pointerEvents={primaryField ? 'auto' : 'none'}>
            {renderTopRow(0)}
            {renderBottomRow(1)}
          </BackAnimatedView>
        </InnerView>
        <ButtonBox onPress={onToggleFlipInput} paddingRem={[0.5, 0, 0.5, 0.5]}>
          <FlipIcon color={theme.iconTappable} size={theme.rem(1.5)} />
        </ButtonBox>
      </ContainerView>
    </>
  )
})

const AnimatedNumericInput = Animated.createAnimatedComponent(NumericInput)

const ContainerView = styled(View)(theme => ({
  flexDirection: 'row',
  alignItems: 'center',
  margin: theme.rem(0.5)
}))

const InnerView = styled(Animated.View)<{
  focusAnimation: SharedValue<number>
}>(theme => ({ focusAnimation }) => {
  const interpolateInputBackgroundColor = useAnimatedColorInterpolateFn(theme.textInputBackgroundColor, theme.textInputBackgroundColorFocused)
  const interpolateOutlineColor = useAnimatedColorInterpolateFn(theme.textInputBorderColor, theme.textInputBorderColorFocused)
  return [
    {
      alignItems: 'center',
      borderWidth: theme.textInputBorderWidth,
      borderRadius: theme.rem(0.5),
      flex: 1,
      flexDirection: 'row',
      overflow: 'hidden'
    },
    useAnimatedStyle(() => ({
      backgroundColor: interpolateInputBackgroundColor(focusAnimation),
      borderColor: interpolateOutlineColor(focusAnimation)
    }))
  ]
})

const FrontAnimatedView = styled(Animated.View)<{ animatedValue: SharedValue<number> }>(theme => ({ animatedValue }) => [
  {
    backfaceVisibility: 'hidden',
    paddingHorizontal: theme.rem(1),
    paddingVertical: theme.rem(0.5)
  },
  useAnimatedStyle(() => {
    const degrees = interpolate(animatedValue.value, [0, 0.5, 1], [0, 90, 90])
    return {
      transform: [{ rotateX: `${degrees}deg` }]
    }
  })
])

const BackAnimatedView = styled(Animated.View)<{ animatedValue: SharedValue<number> }>(theme => ({ animatedValue }) => [
  {
    backfaceVisibility: 'hidden',
    paddingHorizontal: theme.rem(1),
    paddingVertical: theme.rem(0.5),
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  useAnimatedStyle(() => {
    const degrees = interpolate(animatedValue.value, [0, 0.5, 1], [90, 90, 0])
    return {
      transform: [{ rotateX: `${degrees}deg` }]
    }
  })
])

const PlaceholderText = styled(Text)(theme => () => [
  {
    color: theme.textInputPlaceholderColor,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(0.8),
    includeFontPadding: false
  }
])

const AmountAnimatedNumericInput = styledWithRef(AnimatedNumericInput)<{ focusAnimation: SharedValue<number> }>(theme => ({ focusAnimation }) => {
  const isIos = Platform.OS === 'ios'
  const interpolateTextColor = useAnimatedColorInterpolateFn(theme.textInputTextColor, theme.textInputTextColorFocused)
  return [
    {
      paddingRight: isIos ? 0 : theme.rem(0.25),
      includeFontPadding: false,
      fontFamily: theme.fontFaceMedium,
      fontSize: isIos ? theme.rem(1.5) : theme.rem(1.45)
    },
    useAnimatedStyle(() => ({
      color: interpolateTextColor(focusAnimation)
    }))
  ]
})
const CurrencySymbolAnimatedText = styled(Animated.Text)<{ focusAnimation: SharedValue<number> }>(theme => ({ focusAnimation }) => {
  const isIos = Platform.OS === 'ios'
  const interpolateTextColor = useAnimatedColorInterpolateFn(theme.textInputTextColor, theme.textInputTextColorFocused)
  return [
    {
      fontFamily: theme.fontFaceDefault,
      fontSize: theme.rem(1),
      includeFontPadding: false,
      paddingTop: isIos ? theme.rem(0.125) : theme.rem(1),
      marginLeft: isIos ? 0 : -theme.rem(0.25)
    },
    useAnimatedStyle(() => ({
      color: interpolateTextColor(focusAnimation)
    }))
  ]
})

const BottomContainerView = styled(View)(theme => ({
  flexDirection: 'row',
  marginRight: theme.rem(1.5),
  minHeight: theme.rem(2)
}))

const ValueContainerView = styled(View)(theme => {
  const isIos = Platform.OS === 'ios'
  return {
    flexDirection: 'row',
    marginRight: theme.rem(0.5),
    marginLeft: isIos ? 0 : -6,
    marginTop: isIos ? 0 : -theme.rem(0.75),
    marginBottom: isIos ? 0 : -theme.rem(1)
  }
})

function useAnimatedColorInterpolateFn(fromColor: string, toColor: string) {
  const interpolateFn = useMemo(() => {
    return (focusValue: SharedValue<number>) => {
      'worklet'
      return interpolateColor(focusValue.value, [0, 1], [fromColor, toColor])
    }
  }, [fromColor, toColor])

  return interpolateFn
}

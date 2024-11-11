import * as React from 'react'
import { useMemo } from 'react'
import { Platform, ReturnKeyType, Text, TextInput, View } from 'react-native'
import Animated, {
  AnimationCallback,
  Easing,
  interpolate,
  interpolateColor,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated'

import { useHandler } from '../../hooks/useHandler'
import { formatNumberInput, isValidInput } from '../../locales/intl'
import { lstrings } from '../../locales/strings'
import { useState } from '../../types/reactHooks'
import { zeroString } from '../../util/utils'
import { EdgeTouchableOpacity } from '../common/EdgeTouchableOpacity'
import { EdgeTouchableWithoutFeedback } from '../common/EdgeTouchableWithoutFeedback'
import { styled, styledWithRef } from '../hoc/styled'
import { CloseIconAnimated, SwapVerticalIcon } from '../icons/ThemedIcons'
import { showDevError } from '../services/AirshipInstance'
import { useTheme } from '../services/ThemeContext'
import { NumericInput } from './NumericInput'
import { ButtonBox } from './ThemedButtons'

export interface FlipInputRef {
  setAmounts: (value: string[]) => void
  triggerConvertValue: () => void
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
  convertValue: (sourceFieldNum: FieldNum, value: string) => Promise<string | undefined>
  disabled?: boolean
  fieldInfos: FlipInputFieldInfos
  forceFieldNum?: FieldNum
  inputAccessoryViewID?: string
  keyboardVisible?: boolean
  placeholders?: [string, string]
  returnKeyType?: ReturnKeyType
  startAmounts: [string, string]

  // Renders:
  renderFooter?: () => React.ReactNode
  renderHeader?: () => React.ReactNode
  renderIcon?: () => React.ReactNode

  // Events:
  onBlur?: () => void
  onFocus?: () => void
  onNext?: () => void
}

const FLIP_DURATION = 300
const flipField = (fieldNum: FieldNum): FieldNum => {
  return fieldNum === 0 ? 1 : 0
}

export const FlipInput2 = React.forwardRef<FlipInputRef, Props>((props: Props, ref) => {
  const theme = useTheme()
  const themeRem = theme.rem(1)
  const inputRefs = [React.useRef<TextInput>(null), React.useRef<TextInput>(null)]

  const {
    convertValue,
    disabled = false,
    fieldInfos,
    forceFieldNum = 0,
    inputAccessoryViewID,
    keyboardVisible,
    placeholders = [lstrings.string_tap_to_edit, ''],
    returnKeyType = 'done',
    startAmounts,

    // Renders:
    renderFooter,
    renderHeader,
    renderIcon,

    // Events:
    onBlur,
    onFocus,
    onNext
  } = props
  const animatedValue = useSharedValue(forceFieldNum)

  // `amounts` is always a 2-tuple
  const [amounts, setAmounts] = useState<[string, string]>(startAmounts)

  const hasAmount = !zeroString(amounts[0])

  // primaryField is the index into the 2-tuple, 0 or 1
  const [primaryField, setPrimaryField] = useState<FieldNum>(forceFieldNum)

  // Animates between 0 and 1 based our disabled state:
  const disableAnimation = useSharedValue(0)
  React.useEffect(() => {
    disableAnimation.value = withTiming(disabled ? 1 : 0)
  }, [disableAnimation, disabled])

  const [amountFocused, setAmountFocused] = useState(false)
  const focusAnimation = useSharedValue(0)

  const interpolateIconColor = useAnimatedColorInterpolateFn(theme.textInputIconColor, theme.textInputIconColorFocused, theme.textInputIconColorDisabled)
  const clearIconColor = useDerivedValue(() => interpolateIconColor(focusAnimation, disableAnimation))
  const clearIconScale = useDerivedValue(() => (hasAmount ? 1 : focusAnimation.value))
  // We have to use a SharedValue for the icon size event though it's not animated,
  // just because that is the expected type
  const clearIconSize = useSharedValue(themeRem)

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
      .catch(e => showDevError(e.message))
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

  const handleClearPress = useHandler(() => {
    onNumericInputChange('')
  })

  const renderBottomRow = (fieldNum: FieldNum) => {
    const zeroAmount = zeroString(amounts[fieldNum])
    const primaryAmount = zeroAmount && !amountFocused ? '' : amounts[fieldNum]

    const placeholder = placeholders[0]
    const isEnterTextMode = amountFocused || !zeroAmount
    const currencyName = fieldInfos[fieldNum].currencyName

    return (
      <BottomContainerView key="bottom">
        <AmountAnimatedNumericInput
          value={primaryAmount}
          disableAnimation={disableAnimation}
          focusAnimation={focusAnimation}
          maxDecimals={fieldInfos[fieldNum].maxEntryDecimals}
          onChangeText={onNumericInputChange}
          autoCorrect={false}
          editable={!disabled}
          returnKeyType={returnKeyType}
          autoFocus={primaryField === fieldNum && keyboardVisible}
          ref={inputRefs[fieldNum]}
          onSubmitEditing={onNext}
          inputAccessoryViewID={inputAccessoryViewID}
          onFocus={handleBottomFocus}
          onBlur={handleBottomBlur}
        />
        {!isEnterTextMode && placeholder !== '' ? <PlaceholderAnimatedText>{placeholder}</PlaceholderAnimatedText> : null}
        {isEnterTextMode ? (
          <CurrencySymbolAnimatedText disableAnimation={disableAnimation} focusAnimation={focusAnimation}>
            {' ' + currencyName}
          </CurrencySymbolAnimatedText>
        ) : null}
      </BottomContainerView>
    )
  }

  const renderTopRow = (fieldNum: FieldNum) => {
    let topText = amounts[fieldNum]
    if (isValidInput(topText)) {
      topText = formatNumberInput(topText, { minDecimals: 0, maxDecimals: fieldInfos[fieldNum].maxEntryDecimals })
    }

    const placeholder = placeholders[1]
    const zeroAmount = zeroString(amounts[fieldNum])
    const isEnterTextMode = amountFocused || !zeroAmount

    const fieldInfo = fieldInfos[fieldNum]
    topText = `${topText} ${fieldInfo.currencyName}`

    return (
      <EdgeTouchableWithoutFeedback onPress={onToggleFlipInput} key="top" disabled={disabled}>
        <TopAmountText numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
          {isEnterTextMode || placeholder === '' ? topText : placeholder}
        </TopAmountText>
      </EdgeTouchableWithoutFeedback>
    )
  }

  React.useImperativeHandle(ref, () => ({
    setAmounts: amounts => {
      setAmounts([amounts[0], amounts[1]])
    },
    triggerConvertValue: () => {
      onNumericInputChange(amounts[primaryField])
    }
  }))

  return (
    <ContainerView disableAnimation={disableAnimation} focusAnimation={focusAnimation}>
      {renderHeader != null ? renderHeader() : null}

      <InputContainerView>
        <ButtonBox onPress={onToggleFlipInput} paddingRem={[1, 0.5, 1, 1]}>
          {renderIcon ? renderIcon() : <SwapVerticalIcon color={theme.iconTappable} size={theme.rem(1.5)} />}
        </ButtonBox>

        <AmountFieldContainerTouchable accessible={false} onPress={() => inputRefs[primaryField].current?.focus()}>
          <InputTextView disableAnimation={disableAnimation} focusAnimation={focusAnimation}>
            <FrontAnimatedView animatedValue={animatedValue} pointerEvents={flipField(primaryField) ? 'auto' : 'none'}>
              {renderTopRow(1)}
              {renderBottomRow(0)}
            </FrontAnimatedView>
            <BackAnimatedView animatedValue={animatedValue} pointerEvents={primaryField ? 'auto' : 'none'}>
              {renderTopRow(0)}
              {renderBottomRow(1)}
            </BackAnimatedView>
          </InputTextView>
        </AmountFieldContainerTouchable>
        <SideContainer scale={clearIconScale}>
          <EdgeTouchableOpacity accessible onPress={handleClearPress}>
            <CloseIconAnimated color={clearIconColor} size={clearIconSize} />
          </EdgeTouchableOpacity>
        </SideContainer>
      </InputContainerView>

      {renderFooter != null ? renderFooter() : null}
    </ContainerView>
  )
})

const AnimatedNumericInput = Animated.createAnimatedComponent(NumericInput)

const ContainerView = styled(Animated.View)<{
  disableAnimation: SharedValue<number>
  focusAnimation: SharedValue<number>
}>(theme => ({ disableAnimation, focusAnimation }) => {
  const interpolateInputBackgroundColor = useAnimatedColorInterpolateFn(
    theme.textInputBackgroundColor,
    theme.textInputBackgroundColorFocused,
    theme.textInputBackgroundColorDisabled
  )
  const interpolateOutlineColor = useAnimatedColorInterpolateFn(
    theme.textInputBorderColor,
    theme.textInputBorderColorFocused,
    theme.textInputBorderColorDisabled
  )

  return [
    {
      flexDirection: 'column',
      alignItems: 'stretch',
      margin: theme.rem(0.5),

      borderWidth: theme.textInputBorderWidth,
      borderRadius: theme.rem(0.5),
      overflow: 'hidden'
    },

    useAnimatedStyle(() => ({
      backgroundColor: interpolateInputBackgroundColor(focusAnimation, disableAnimation),
      borderColor: interpolateOutlineColor(focusAnimation, disableAnimation)
    }))
  ]
})

const InputContainerView = styled(View)(theme => ({
  flexDirection: 'row',
  alignItems: 'center'
}))

const InputTextView = styled(Animated.View)<{
  disableAnimation: SharedValue<number>
  focusAnimation: SharedValue<number>
}>(theme => {
  return {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden'
  }
})

const FrontAnimatedView = styled(Animated.View)<{ animatedValue: SharedValue<number> }>(theme => ({ animatedValue }) => [
  {
    backfaceVisibility: 'hidden',
    paddingRight: theme.rem(1),
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
    paddingRight: theme.rem(1),
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

const TopAmountText = styled(Text)(theme => () => [
  {
    alignSelf: 'flex-start',
    color: theme.textInputPlaceholderColor,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(0.8),
    includeFontPadding: false
  }
])

const AmountAnimatedNumericInput = styledWithRef(AnimatedNumericInput)<{
  disableAnimation: SharedValue<number>
  focusAnimation: SharedValue<number>
  value: string
}>(theme => ({ disableAnimation, focusAnimation, value }) => {
  const isAndroid = Platform.OS === 'android'
  const interpolateTextColor = useAnimatedColorInterpolateFn(theme.textInputTextColor, theme.textInputTextColorFocused, theme.textInputTextColorDisabled)
  const characterLength = value.length
  return [
    {
      includeFontPadding: false,
      fontFamily: theme.fontFaceMedium,
      fontSize: theme.rem(1.5),
      // Android has more space added to the width of the input
      // after the last character in the input. It seems to be
      // setting a min-width to the input to roughly 2 characters in size.
      // We can compensate for this with a negative margin when the character length
      // is less then 2 characters.
      marginRight: isAndroid ? -theme.rem(Math.max(0, 2 - characterLength) * 0.4) : 0,
      padding: 0
    },
    useAnimatedStyle(() => ({
      color: interpolateTextColor(focusAnimation, disableAnimation)
    }))
  ]
})

const PlaceholderAnimatedText = styled(Animated.Text)(theme => ({
  position: 'absolute',
  left: 0,
  top: 0,
  includeFontPadding: false,
  color: theme.textInputPlaceholderColor,
  fontFamily: theme.fontFaceMedium,
  fontSize: theme.rem(1.5)
}))

const CurrencySymbolAnimatedText = styled(Animated.Text)<{
  disableAnimation: SharedValue<number>
  focusAnimation: SharedValue<number>
}>(theme => ({ disableAnimation, focusAnimation }) => {
  const interpolateTextColor = useAnimatedColorInterpolateFn(theme.textInputTextColor, theme.textInputTextColorFocused, theme.textInputTextColorDisabled)
  return [
    {
      fontFamily: theme.fontFaceMedium,
      fontSize: theme.rem(1.5),
      includeFontPadding: false
    },
    useAnimatedStyle(() => ({
      color: interpolateTextColor(focusAnimation, disableAnimation)
    }))
  ]
})

const AmountFieldContainerTouchable = styled(EdgeTouchableWithoutFeedback)(theme => {
  return {
    marginRight: theme.rem(1.5),
    minHeight: theme.rem(2)
  }
})

const BottomContainerView = styled(View)({
  flexDirection: 'row',
  alignItems: 'center'
})

const SideContainer = styled(Animated.View)<{ scale: SharedValue<number> }>(theme => ({ scale }) => {
  return [
    {
      alignSelf: 'stretch',
      justifyContent: 'center',
      paddingHorizontal: theme.rem(1)
    },
    useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }]
    }))
  ]
})

function useAnimatedColorInterpolateFn(defaultColor: string, focusColor: string, disableColor: string) {
  const interpolateFn = useMemo(() => {
    return (focusValue: SharedValue<number>, disabledValue: SharedValue<number>) => {
      'worklet'
      const interFocusColor = interpolateColor(focusValue.value, [0, 1], [defaultColor, focusColor])
      return interpolateColor(disabledValue.value, [0, 1], [interFocusColor, disableColor])
    }
  }, [defaultColor, focusColor, disableColor])

  return interpolateFn
}

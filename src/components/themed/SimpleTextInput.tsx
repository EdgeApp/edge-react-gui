import * as React from 'react'
import { useMemo } from 'react'
import { Platform, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Animated, {
  interpolate,
  interpolateColor,
  SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated'

import { useHandler } from '../../hooks/useHandler'
import { MarginRemProps, useMarginRemStyle } from '../../hooks/useMarginRemStyle'
import { lstrings } from '../../locales/strings'
import { EdgeTouchableWithoutFeedback } from '../common/EdgeTouchableWithoutFeedback'
import { styled, styledWithRef } from '../hoc/styled'
import { AnimatedIconComponent, ChevronBackAnimated, CloseIconAnimated } from '../icons/ThemedIcons'
import { useTheme } from '../services/ThemeContext'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

export type SimpleTextInputReturnKeyType = 'done' | 'go' | 'next' | 'search' | 'send' // Defaults to 'done'

export interface SimpleTextInputProps extends MarginRemProps {
  // Contents:
  value: string
  placeholder?: string

  // Appearance:
  iconComponent?: AnimatedIconComponent | null
  scale?: SharedValue<number>

  // Callbacks:
  onBlur?: () => void
  onChangeText?: (text: string) => void
  onClear?: () => void
  onFocus?: () => void
  onCancel?: () => void

  // Other React Native TextInput properties:
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters' // Defaults to 'sentences'
  autoCorrect?: boolean // Defaults to 'true'
  blurOnSubmit?: boolean // Defaults to 'true'
  inputAccessoryViewID?: string
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad' // Defaults to 'default'
  maxLength?: number
  onSubmitEditing?: () => void
  returnKeyType?: SimpleTextInputReturnKeyType // Defaults to 'done'
  secureTextEntry?: boolean // Defaults to 'false'
  testID?: string

  /** Unless 'autoFocus' is passed explicitly in the props, Search Bars
  'autoFocus' and 'regular' text inputs don't. */
  autoFocus?: boolean // Defaults to 'true'

  /** Unless 'blurOnClear' is passed explicitly in the props, Search Bars calls
   * 'blur' when cleared and text inputs don't call 'blur' when cleared. */
  blurOnClear?: boolean // Defaults to 'false'

  /**
   * Manually control whether the input appears selected. This is only a
   * visual change. It's mutually exclusive with the text input's true
   * blur/focus state.
   * */
  active?: boolean

  // Whether the text input is disabled. If 'true', the component will be grayed out.
  disabled?: boolean // Defaults to 'false'
}

/**
 * Type definitions for our static methods.
 * Create a ref object using `useRef<SimpleTextInputRef>(null)` or
 * `const ref = createRef<SimpleTextInputRef>()`
 */
export interface SimpleTextInputRef {
  focus: () => void
  blur: () => void
  isFocused: () => boolean
  clear: () => void
  setNativeProps: (nativeProps: Object) => void
}

export const SimpleTextInput = React.forwardRef<SimpleTextInputRef, SimpleTextInputProps>((props: SimpleTextInputProps, ref) => {
  const {
    // Contents:
    placeholder,
    value,

    // Appearance:
    iconComponent: Icon,
    scale: scaleProp,

    // Callbacks:
    onBlur,
    onChangeText,
    onClear,
    onFocus,
    onSubmitEditing,

    // TextInput:
    autoCapitalize = props.secureTextEntry === true ? 'none' : undefined,
    autoCorrect,
    autoFocus = false,
    blurOnClear = false,
    blurOnSubmit,
    disabled = false,
    inputAccessoryViewID,
    keyboardType,
    maxLength,
    returnKeyType,
    secureTextEntry,
    active,
    testID,
    ...marginRemProps
  } = props
  const theme = useTheme()
  const themeRem = theme.rem(1)

  const hasIcon = Icon != null
  const hasValue = value !== ''
  const isIos = Platform.OS === 'ios'

  const [isFocused, setIsFocused] = React.useState(false)

  // Imperative methods:
  const inputRef = useAnimatedRef<TextInput>()
  function blur(): void {
    if (inputRef.current != null) inputRef.current.blur()
  }
  function clear(): void {
    if (inputRef.current != null) inputRef.current.clear()
    if (onChangeText != null) onChangeText('')
    if (blurOnClear) blur()
    if (onClear != null) onClear()
  }
  function focus(): void {
    if (inputRef.current != null && !disabled) inputRef.current.focus()
  }
  function checkIsFocused(): boolean {
    return inputRef.current != null ? inputRef.current.isFocused() : false
  }
  function setNativeProps(nativeProps: Object): void {
    if (inputRef.current != null) inputRef.current.setNativeProps(nativeProps)
  }

  React.useImperativeHandle(ref, () => ({ blur, clear, focus, isFocused: checkIsFocused, setNativeProps }))

  // Animates between 0 and 1 based our disabled state:
  const disableAnimation = useSharedValue(0)
  React.useEffect(() => {
    disableAnimation.value = withTiming(disabled ? 1 : 0)
  }, [disableAnimation, disabled])

  // Animates between 0 and 1 based on focus:
  const baseDuration = 300
  const focusAnimation = useSharedValue(0)

  // A delayed focus animation is required for closing the top border when
  // animating everything back to their original positions.
  const animationDelay = 0.4 * baseDuration

  const handleBlur = useHandler(() => {
    if (active == null) focusAnimation.value = withDelay(animationDelay, withTiming(0, { duration: baseDuration }))

    if (onBlur != null) onBlur()
    setIsFocused(false)
  })
  const handleClearPress = useHandler(() => {
    clear()
  })
  const handleCancelPress = useHandler(() => {
    clear()
    blur()
    if (props.onCancel != null) props.onCancel()
  })
  const handleFocus = useHandler(() => {
    if (active == null) focusAnimation.value = withTiming(1, { duration: baseDuration })
    if (onFocus != null) onFocus()
    setIsFocused(true)
  })
  const handleSubmitEditing = useHandler(() => {
    if (onSubmitEditing != null) onSubmitEditing()
  })

  const backIconSize = useDerivedValue(() => (isIos ? 0 : interpolate(focusAnimation.value, [0, 1], [0, themeRem])))
  const leftIconSize = useDerivedValue(() =>
    hasIcon ? (hasValue && (active == null || !active) ? 0 : interpolate(focusAnimation.value, [0, 1], [themeRem, 0])) : 0
  )
  const rightIconSize = useDerivedValue(() => (hasValue ? themeRem : focusAnimation.value * themeRem))

  const scale = useDerivedValue(() => scaleProp?.value ?? 1)

  const interpolateIconColor = useAnimatedColorInterpolateFn(theme.textInputIconColor, theme.textInputIconColorFocused, theme.textInputIconColorDisabled)
  const iconColor = useDerivedValue(() => interpolateIconColor(focusAnimation, disableAnimation))

  const placeholderTextColor = useMemo(() => {
    return disabled ? theme.textInputPlaceholderColorDisabled : isFocused ? theme.textInputPlaceholderColorFocused : theme.textInputPlaceholderColor
  }, [disabled, isFocused, theme.textInputPlaceholderColor, theme.textInputPlaceholderColorDisabled, theme.textInputPlaceholderColorFocused])

  React.useEffect(() => {
    if (active == null) return
    focusAnimation.value = active ? withTiming(1, { duration: baseDuration }) : withDelay(animationDelay, withTiming(0, { duration: baseDuration }))
  }, [active, focusAnimation, baseDuration, animationDelay])

  return (
    <ContainerView marginRemProps={marginRemProps}>
      <EdgeTouchableWithoutFeedback accessible={false} testID={testID} onPress={() => focus()}>
        <InputContainerView disableAnimation={disableAnimation} focusAnimation={focusAnimation} scale={scale}>
          <SideContainer size={leftIconSize}>{Icon == null ? null : <Icon color={iconColor} size={leftIconSize} />}</SideContainer>
          <TouchableOpacity hitSlop={theme.rem(0.75)} accessible onPress={handleCancelPress} testID={`${testID}.doneButton`}>
            <SideContainer size={backIconSize}>
              <ChevronBackAnimated color={iconColor} size={backIconSize} />
            </SideContainer>
          </TouchableOpacity>

          <InnerContainer>
            <InputField
              accessible
              ref={inputRef}
              keyboardType={keyboardType}
              returnKeyType={returnKeyType}
              accessibilityState={{ disabled }}
              autoFocus={autoFocus}
              disableAnimation={disableAnimation}
              focusAnimation={focusAnimation}
              placeholder={placeholder}
              placeholderTextColor={placeholderTextColor}
              selectionColor={theme.textInputTextColor}
              testID={`${testID}.textInput`}
              textAlignVertical="top"
              value={value}
              // Callbacks:
              onBlur={handleBlur}
              onChangeText={onChangeText}
              onFocus={handleFocus}
              onSubmitEditing={handleSubmitEditing}
              maxLength={maxLength}
              // Other Props:
              autoCapitalize={autoCapitalize}
              autoCorrect={autoCorrect}
              blurOnSubmit={blurOnSubmit}
              inputAccessoryViewID={inputAccessoryViewID}
              secureTextEntry={secureTextEntry}
            />
          </InnerContainer>

          <TouchContainer hitSlop={theme.rem(0.75)} accessible onPress={handleClearPress} testID={`${testID}.clearIcon`}>
            <SideContainer size={rightIconSize}>
              <CloseIconAnimated color={iconColor} size={rightIconSize} />
            </SideContainer>
          </TouchContainer>
        </InputContainerView>
      </EdgeTouchableWithoutFeedback>
      {isIos && (isFocused || active === true) && (
        <TouchableOpacity accessible onPress={handleCancelPress} testID={`${testID}.cancelButton`}>
          <CancelButton>
            <CancelText numberOfLines={1} ellipsizeMode="clip">
              {lstrings.string_cancel_cap}
            </CancelText>
          </CancelButton>
        </TouchableOpacity>
      )}
    </ContainerView>
  )
})

const ContainerView = styled(View)<{
  marginRemProps: MarginRemProps
}>(theme => ({ marginRemProps }) => {
  const marginRemStyle = useMarginRemStyle(marginRemProps)
  return [
    marginRemStyle,
    {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center'
    }
  ]
})

const InputContainerView = styled(Animated.View)<{
  disableAnimation: SharedValue<number>
  focusAnimation: SharedValue<number>
  scale: SharedValue<number>
}>(theme => ({ disableAnimation, focusAnimation, scale }) => {
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
      alignItems: 'center',
      borderWidth: theme.textInputBorderWidth,
      borderRadius: theme.rem(theme.textInputBorderRadius),
      flexDirection: 'row',
      flexGrow: 1,
      flexShrink: 1,
      paddingHorizontal: theme.rem(1),
      paddingVertical: theme.rem(0.75)
    },
    useAnimatedStyle(() => {
      'worklet'
      return {
        backgroundColor: interpolateInputBackgroundColor(focusAnimation, disableAnimation),
        borderColor: interpolateOutlineColor(focusAnimation, disableAnimation),
        opacity: interpolate(scale.value, [1, 0.5], [1, 0]),
        transform: [
          {
            scale: interpolate(scale.value, [1, 0], [1, 0.75])
          }
        ]
      }
    })
  ]
})

const SideContainer = styled(Animated.View)<{ size: SharedValue<number> }>(theme => ({ size }) => {
  return [
    {
      alignItems: 'stretch',
      aspectRatio: 1
    },
    useAnimatedStyle(() => ({
      width: size.value,
      opacity: size.value
    }))
  ]
})

const InnerContainer = styled(View)({
  flex: 1
})

const InputField = styledWithRef(AnimatedTextInput)<{
  disableAnimation: SharedValue<number>
  focusAnimation: SharedValue<number>
}>(theme => ({ disableAnimation, focusAnimation }) => {
  const interpolateTextColor = useAnimatedColorInterpolateFn(theme.textInputTextColor, theme.textInputTextColorFocused, theme.textInputTextColorDisabled)

  return [
    {
      flexGrow: 1,
      flexShrink: 1,
      fontFamily: theme.fontFaceDefault,
      paddingHorizontal: theme.rem(0.5),
      paddingVertical: 0,
      margin: 0,
      fontSize: theme.rem(1)
    },
    useAnimatedStyle(() => ({
      color: interpolateTextColor(focusAnimation, disableAnimation)
    }))
  ]
})

const TouchContainer = styled(TouchableOpacity)(theme => ({
  // Increase tappable area with padding, while net 0 with negative margin to
  // visually appear as if 0 margins/padding
  padding: theme.rem(1),
  margin: -theme.rem(1)
}))

const CancelButton = styled(View)(theme => () => {
  return {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.rem(0.5)
  }
})

const CancelText = styled(Text)(theme => {
  return {
    color: theme.textInputIconColorFocused,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    includeFontPadding: false,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    marginHorizontal: theme.rem(0.5),
    flexShrink: 0
  }
})

function useAnimatedColorInterpolateFn(fromColor: string, toColor: string, disabledColor: string) {
  const interpolateFn = useMemo(() => {
    return (focusValue: SharedValue<number>, disabledValue: SharedValue<number>) => {
      'worklet'
      const interFocusColor = interpolateColor(focusValue.value, [0, 1], [fromColor, toColor])
      return interpolateColor(disabledValue.value, [0, 1], [interFocusColor, disabledColor])
    }
  }, [fromColor, toColor, disabledColor])

  return interpolateFn
}

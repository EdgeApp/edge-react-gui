import * as React from 'react'
import { useMemo } from 'react'
import { ActivityIndicator, Platform, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
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
import { styled, styledWithRef } from '../hoc/styled'
import { AnimatedIconComponent, CloseIconAnimated, EyeIconAnimated, EyeOffIconAnimated } from '../icons/ThemedIcons'
import { useTheme } from '../services/ThemeContext'
import { EdgeText } from './EdgeText'
import { NumericInput } from './NumericInput'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

export type FilledTextInputReturnKeyType = 'done' | 'go' | 'next' | 'search' | 'send' // Defaults to 'done'

export interface FilledTextInputProps {
  // Contents:
  value: string
  error?: string
  valid?: string
  placeholder?: string
  numeric?: boolean
  minDecimals?: number
  maxDecimals?: number

  // Appearance:
  iconComponent?: AnimatedIconComponent | null
  multiline?: boolean // Defaults to 'false'
  scale?: SharedValue<number>
  showSpinner?: boolean
  prefix?: string // Text input is left-left justified with a persistent prefix
  suffix?: string // Text input is right-right justified with a persistent suffix

  // Callbacks:
  onBlur?: () => void
  onChangeText?: (text: string) => void
  onClear?: () => void
  onFocus?: () => void

  // Other React Native TextInput properties:
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters' // Defaults to 'sentences'
  autoCorrect?: boolean // Defaults to 'true'
  blurOnSubmit?: boolean // Defaults to 'true'
  inputAccessoryViewID?: string
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad' // Defaults to 'default'
  maxLength?: number
  onSubmitEditing?: () => void
  returnKeyType?: FilledTextInputReturnKeyType // Defaults to 'done'
  secureTextEntry?: boolean // Defaults to 'false'
  testID?: string

  // Unless 'autoFocus' is passed explicitly in the props, Search Bars 'autoFocus' and 'regular' text inputs don't.
  autoFocus?: boolean // Defaults to 'true'

  // Unless 'blurOnClear' is passed explicitly in the props, Search Bars calls 'blur' when cleared and text inputs don't call 'blur' when cleared.
  blurOnClear?: boolean // Defaults to 'false'

  // Whether the text input is disabled. If 'true', the component will be grayed out.
  disabled?: boolean // Defaults to 'false'
}

/**
 * Type definitions for our static methods.
 * Create a ref object using `useRef<FilledTextInputRef>(null)` or
 * `const ref = createRef<FilledTextInputRef>()`
 */
export interface FilledTextInputRef {
  focus: () => void
  blur: () => void
  isFocused: () => boolean
  clear: () => void
  setNativeProps: (nativeProps: Object) => void
}

export const FilledTextInput = React.forwardRef<FilledTextInputRef, FilledTextInputProps>((props: FilledTextInputProps, ref) => {
  const {
    // Contents:
    error,
    placeholder,
    valid,
    value,
    numeric,
    minDecimals,
    maxDecimals,

    // Appearance:
    iconComponent,
    multiline = false,
    scale: scaleProp,
    showSpinner = false,
    prefix,
    suffix,

    // Callbacks:
    onBlur,
    onChangeText,
    onClear,
    onFocus,
    onSubmitEditing,

    // TextInput:
    autoCapitalize,
    autoCorrect,
    autoFocus = false,
    blurOnClear = false,
    blurOnSubmit,
    disabled = false,
    inputAccessoryViewID,
    maxLength,
    secureTextEntry,
    testID
  } = props
  const theme = useTheme()
  const themeRem = theme.rem(1)

  const LeftIcon = iconComponent
  const hasIcon = LeftIcon != null
  const hasValue = value !== ''

  // Show/Hide password input:
  const [hidePassword, setHidePassword] = React.useState(secureTextEntry ?? false)
  const handleHidePassword = () => setHidePassword(!hidePassword)

  // Imperative methods:
  const inputRef = useAnimatedRef<TextInput>()
  function blur(): void {
    if (inputRef.current != null) inputRef.current.blur()
  }
  function clear(): void {
    if (inputRef.current != null) inputRef.current.clear()
    if (onChangeText != null) onChangeText('')
    if (blurOnClear || !hasValue) blur()
    if (onClear != null) onClear()
  }
  function focus(): void {
    if (inputRef.current != null && !disabled) inputRef.current.focus()
  }
  function isFocused(): boolean {
    return inputRef.current != null ? inputRef.current.isFocused() : false
  }
  function setNativeProps(nativeProps: Object): void {
    if (inputRef.current != null) inputRef.current.setNativeProps(nativeProps)
  }

  React.useImperativeHandle(ref, () => ({ blur, clear, focus, isFocused, setNativeProps }))

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
    focusAnimation.value = withDelay(animationDelay, withTiming(0, { duration: baseDuration }))
    if (onBlur != null) onBlur()
  })
  const handleChangeText = useHandler((value: string) => {
    if (props.onChangeText != null) props.onChangeText(value)
  })
  const handleClearPress = useHandler(() => {
    clear()
  })
  const handleFocus = useHandler(() => {
    focusAnimation.value = withTiming(1, { duration: baseDuration })
    if (onFocus != null) onFocus()
  })
  const handleSubmitEditing = useHandler(() => {
    if (onSubmitEditing != null) onSubmitEditing()
  })

  const leftIconSize = useDerivedValue(() => (hasIcon ? (hasValue ? 0 : interpolate(focusAnimation.value, [0, 1], [themeRem, 0])) : 0), [hasIcon, hasValue])
  const rightIconSize = useDerivedValue(() => (hasValue ? themeRem : focusAnimation.value * themeRem), [hasValue])

  const scale = useDerivedValue(() => scaleProp?.value ?? 1)

  const interpolateIconColor = useAnimatedColorInterpolateFn(theme.textInputIconColor, theme.textInputIconColorFocused, theme.textInputIconColorDisabled)
  const iconColor = useDerivedValue(() => interpolateIconColor(focusAnimation, disableAnimation))

  const focusValue = useDerivedValue(() => (hasValue ? 1 : focusAnimation.value), [hasValue])

  // Character Limit:
  const charactersLeft = maxLength === undefined ? '' : `${maxLength - value.length}`

  const InputComponent = numeric ? StyledNumericInput : StyledAnimatedTextInput

  return (
    <>
      <TouchableWithoutFeedback accessible={false} testID={testID} onPress={() => focus()}>
        <Container disableAnimation={disableAnimation} focusAnimation={focusAnimation} multiline={multiline} scale={scale}>
          <SideContainer scale={leftIconSize}>{LeftIcon == null ? null : <LeftIcon color={iconColor} size={leftIconSize} />}</SideContainer>

          <InnerContainer focusValue={focusValue} hasPlaceholder={placeholder != null}>
            {placeholder == null ? null : (
              <Placeholder shift={focusValue}>
                <PlaceholderText disableAnimation={disableAnimation} focusAnimation={focusAnimation} scale={scale} shift={focusValue}>
                  {placeholder}
                </PlaceholderText>
              </Placeholder>
            )}

            {prefix == null ? null : <PrefixAnimatedText visibility={focusValue}>{prefix}</PrefixAnimatedText>}
            <InputComponent
              accessible
              animated
              ref={inputRef}
              keyboardType={props.keyboardType}
              returnKeyType={props.returnKeyType}
              accessibilityState={{ disabled }}
              autoFocus={autoFocus}
              disableAnimation={disableAnimation}
              focusAnimation={focusAnimation}
              minDecimals={minDecimals}
              maxDecimals={maxDecimals}
              multiline={multiline}
              selectionColor={theme.textInputTextColor}
              testID={`${testID}.textInput`}
              textAlignVertical="top"
              scale={scale}
              value={value}
              // Callbacks:
              onBlur={handleBlur}
              onChangeText={handleChangeText}
              onFocus={handleFocus}
              onSubmitEditing={handleSubmitEditing}
              maxLength={maxLength}
              // Other Props:
              autoCapitalize={autoCapitalize}
              autoCorrect={autoCorrect}
              blurOnSubmit={blurOnSubmit}
              inputAccessoryViewID={inputAccessoryViewID}
              secureTextEntry={hidePassword}
            />
            {suffix == null ? null : <SuffixText>{suffix}</SuffixText>}
          </InnerContainer>

          {showSpinner ? <ActivityIndicator /> : null}
          {secureTextEntry ? (
            <TouchableWithoutFeedback testID={`${testID}.eyeIcon`} onPress={handleHidePassword}>
              <IconContainer>
                {hidePassword ? <EyeOffIconAnimated accessible color={iconColor} /> : <EyeIconAnimated accessible color={iconColor} />}
              </IconContainer>
            </TouchableWithoutFeedback>
          ) : null}

          <TouchableOpacity accessible onPress={handleClearPress} testID={`${testID}.clearIcon`}>
            <SideContainer scale={rightIconSize}>
              <CloseIconAnimated color={iconColor} size={rightIconSize} />
            </SideContainer>
          </TouchableOpacity>
        </Container>
      </TouchableWithoutFeedback>
      <MessagesContainer>
        {valid ? <Message>{valid}</Message> : null}
        {error ? <Message danger>{error}</Message> : null}
        <Message>{charactersLeft}</Message>
      </MessagesContainer>
    </>
  )
})

const Container = styled(Animated.View)<{
  disableAnimation: SharedValue<number>
  focusAnimation: SharedValue<number>
  multiline: boolean
  scale: SharedValue<number>
}>(theme => ({ disableAnimation, focusAnimation, multiline, scale }) => {
  const rem = theme.rem(1)
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
      flex: multiline ? 1 : undefined,
      alignItems: multiline ? 'stretch' : 'center',
      borderWidth: theme.textInputBorderWidth,
      borderRadius: theme.rem(0.5),
      flexDirection: 'row',
      paddingHorizontal: theme.rem(1)
    },
    useAnimatedStyle(() => ({
      backgroundColor: interpolateInputBackgroundColor(focusAnimation, disableAnimation),
      borderColor: interpolateOutlineColor(focusAnimation, disableAnimation),
      opacity: interpolate(scale.value, [1, 0.5], [1, 0]),
      marginHorizontal: interpolate(scale.value, [1, 0], [0, 2 * rem]),
      paddingVertical: scale.value * 0.8 * rem
    }))
  ]
})

const IconContainer = styled(View)(theme => ({
  paddingHorizontal: theme.rem(0.25)
}))

const SideContainer = styled(Animated.View)<{ scale: SharedValue<number> }>(theme => ({ scale }) => {
  return [
    {
      alignItems: 'stretch',
      aspectRatio: 1
    },
    useAnimatedStyle(() => ({
      width: scale.value,
      opacity: scale.value
    }))
  ]
})

const InnerContainer = styled(Animated.View)<{
  focusValue: SharedValue<number>
  hasPlaceholder: boolean
}>(theme => ({ hasPlaceholder, focusValue }) => {
  const rem = theme.rem(1)
  return [
    {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      alignSelf: 'flex-start'
    },
    useAnimatedStyle(() => {
      const shiftValue = interpolate(focusValue.value, [0, 1], [0, rem * 0.4])
      return {
        marginTop: hasPlaceholder ? shiftValue : undefined,
        marginBottom: hasPlaceholder ? -shiftValue : undefined
      }
    })
  ]
})

const PrefixAnimatedText = styled(Animated.Text)<{ visibility: SharedValue<number> }>(theme => ({ visibility }) => {
  const rem = theme.rem(1)
  const isAndroid = Platform.OS === 'android'
  return [
    {
      color: theme.secondaryText,
      fontFamily: theme.fontFaceDefault,
      includeFontPadding: false
    },
    useAnimatedStyle(() => {
      return {
        opacity: visibility.value,
        top: isAndroid ? -1 : 0,
        transform: [{ translateY: (1 - visibility.value) * rem }, { scale: visibility.value }]
      }
    })
  ]
})

const SuffixText = styled(EdgeText)(theme => ({
  color: theme.secondaryText,
  fontFamily: theme.fontFaceDefault,
  includeFontPadding: false,
  marginRight: theme.rem(1)
}))

const Placeholder = styled(Animated.View)<{ shift: SharedValue<number> }>(theme => ({ shift }) => {
  const rem = theme.rem(1)
  return [
    {
      position: 'absolute',
      top: 0,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.rem(0.5),
      paddingVertical: 0,
      margin: 0
    },
    useAnimatedStyle(() => ({
      transform: [{ translateY: interpolate(shift.value, [0, 1], [0, -1.2 * rem]) }]
    }))
  ]
})

const PlaceholderText = styled(Animated.Text)<{
  disableAnimation: SharedValue<number>
  focusAnimation: SharedValue<number>
  scale: SharedValue<number>
  shift: SharedValue<number>
}>(theme => ({ disableAnimation, focusAnimation, scale, shift }) => {
  const fontSizeBase = theme.rem(scale.value)
  const interpolatePlaceholderTextColor = useAnimatedColorInterpolateFn(
    theme.textInputPlaceholderColor,
    theme.textInputPlaceholderColorFocused,
    theme.textInputPlaceholderColorDisabled
  )

  return [
    {
      color: theme.primaryText,
      fontFamily: theme.fontFaceDefault,
      fontSize: theme.rem(1),
      includeFontPadding: false
    },
    useAnimatedStyle(() => {
      return {
        color: interpolatePlaceholderTextColor(focusAnimation, disableAnimation),
        fontSize: interpolate(shift.value, [0, 1], [fontSizeBase, 0.8 * fontSizeBase])
      }
    })
  ]
})

const StyledAnimatedTextInput = styledWithRef(AnimatedTextInput)<{
  disableAnimation: SharedValue<number>
  focusAnimation: SharedValue<number>
  scale: SharedValue<number>
}>(theme => ({ disableAnimation, focusAnimation, scale }) => {
  const rem = theme.rem(1)
  const interpolateTextColor = useAnimatedColorInterpolateFn(theme.textInputTextColor, theme.textInputTextColorFocused, theme.textInputTextColorDisabled)

  return [
    {
      color: theme.textInputBackgroundColor,
      flexGrow: 1,
      flexShrink: 1,
      fontFamily: theme.fontFaceDefault,
      paddingHorizontal: theme.rem(0.5),
      paddingVertical: 0,
      margin: 0
    },
    useAnimatedStyle(() => ({
      color: interpolateTextColor(focusAnimation, disableAnimation),
      fontSize: scale.value * rem
    }))
  ]
})

const StyledNumericInput = styledWithRef(NumericInput)<{
  disableAnimation: SharedValue<number>
  focusAnimation: SharedValue<number>
  scale: SharedValue<number>
}>(theme => ({ disableAnimation, focusAnimation, scale }) => {
  const rem = theme.rem(1)
  const interpolateTextColor = useAnimatedColorInterpolateFn(theme.textInputTextColor, theme.textInputTextColorFocused, theme.textInputTextColorDisabled)

  return [
    {
      color: theme.textInputBackgroundColor,
      flexGrow: 1,
      flexShrink: 1,
      fontFamily: theme.fontFaceDefault,
      paddingHorizontal: theme.rem(0.5),
      paddingVertical: 0,
      margin: 0
    },
    useAnimatedStyle(() => ({
      color: interpolateTextColor(focusAnimation, disableAnimation),
      fontSize: scale.value * rem
    }))
  ]
})

const MessagesContainer = styled(Animated.View)(theme => ({
  flexDirection: 'row',
  justifyContent: 'space-between',
  paddingHorizontal: theme.rem(0.5),
  marginBottom: theme.rem(1)
}))

const Message = styled(EdgeText)<{ danger?: boolean }>(theme => props => [
  {
    color: props.danger === true ? theme.dangerText : theme.secondaryText,
    fontSize: theme.rem(0.8)
  }
])

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

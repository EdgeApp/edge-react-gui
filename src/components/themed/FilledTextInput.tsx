/**
 * IMPORTANT: Changes in this file MUST be synced between edge-react-gui and
 * edge-login-ui-rn!
 */

import * as React from 'react'
import { useMemo } from 'react'
import { ActivityIndicator, Platform, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native'
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
import { MarginRemProps, MarginRemStyle, useMarginRemStyle } from '../../hooks/useMarginRemStyle'
import { EdgeTouchableWithoutFeedback } from '../common/EdgeTouchableWithoutFeedback'
import { styled, styledWithRef } from '../hoc/styled'
import { AnimatedIconComponent, CloseIconAnimated, EyeIconAnimated } from '../icons/ThemedIcons'
import { useTheme } from '../services/ThemeContext'
import { NumericInput } from './NumericInput'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)
const isAndroid = Platform.OS === 'android'

export type FilledTextInputReturnKeyType = 'done' | 'go' | 'next' | 'search' | 'send' | 'none' // Defaults to 'done'

export interface FilledTextInputBaseProps extends MarginRemProps {
  // Contents:
  value: string
  error?: string
  valid?: string
  placeholder?: string
  numeric?: boolean
  minDecimals?: number
  maxDecimals?: number

  // Appearance:
  clearIcon?: boolean
  iconComponent?: AnimatedIconComponent | null
  multiline?: boolean // Defaults to 'false'
  scale?: SharedValue<number>
  showSpinner?: boolean
  prefix?: string // Text input is left-left justified with a persistent prefix
  suffix?: string // Text input is right-right justified with a persistent suffix
  textsizeRem?: number

  // Callbacks:
  onBlur?: () => void
  onChangeText?: (text: string) => void
  onClear?: () => void
  onFocus?: () => void

  // Other React Native TextInput properties:
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters' // Defaults to 'sentences'
  autoComplete?: TextInputProps['autoComplete']
  autoCorrect?: boolean // Defaults to 'true'
  blurOnSubmit?: boolean // Defaults to 'true'
  inputAccessoryViewID?: string
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad' | 'visible-password' // Defaults to 'default'
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

export type ModalFilledTextInputProps = Omit<FilledTextInputBaseProps, keyof MarginRemStyle>

/**
 * FilledTextInput with standard `around=0.5` UI4 margins, for use in modals
 */
export const ModalFilledTextInput = React.forwardRef<FilledTextInputRef, ModalFilledTextInputProps>((props, ref) => (
  <FilledTextInput ref={ref} {...props} aroundRem={0.5} />
))

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

/**
 * Raw FilledTextInput that includes no built-in margins. Not meant to be used
 * by top-level parents, but rather as a raw building block to build a child
 * component with some fixed margins according to the child use case.
 */
export const FilledTextInput = React.forwardRef<FilledTextInputRef, FilledTextInputBaseProps>((props: FilledTextInputBaseProps, ref) => {
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
    clearIcon = true,
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
    autoCapitalize = props.secureTextEntry === true ? 'none' : undefined,
    autoComplete,
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
    testID,
    textsizeRem,
    ...marginRemProps
  } = props
  const theme = useTheme()
  const themeRem = theme.rem(1)

  const LeftIcon = iconComponent
  const hasIcon = LeftIcon != null
  const hasValue = value !== ''

  const marginRemStyle = useMarginRemStyle(marginRemProps)

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

  const leftIconSize = useDerivedValue(() => (hasIcon ? (hasValue ? 0 : interpolate(focusAnimation.value, [0, 1], [themeRem, 0])) : 0))
  const rightIconSize = useDerivedValue(() => (clearIcon ? (hasValue ? themeRem : focusAnimation.value * themeRem) : 0))

  const scale = useDerivedValue(() => scaleProp?.value ?? 1)

  const interpolateIconColor = useAnimatedColorInterpolateFn(theme.textInputIconColor, theme.textInputIconColorFocused, theme.textInputIconColorDisabled)
  const iconColor = useDerivedValue(() => interpolateIconColor(focusAnimation, disableAnimation))

  const focusValue = useDerivedValue(() => (hasValue ? 1 : focusAnimation.value))

  // Character Limit:
  const charactersLeft = maxLength === undefined ? '' : `${maxLength - value.length}`

  const InputComponent = numeric ? StyledNumericInput : StyledAnimatedTextInput

  // HACK: Some Android devices/versions, mostly Samsung, have a bug where the
  // text input always blurs immediately after focusing.
  const hackKeyboardType =
    isAndroid &&
    !secureTextEntry && // Don't apply this hack if we are intentionally doing a secure text entry
    !hidePassword &&
    (keyboardType == null || keyboardType === 'default')
      ? 'visible-password'
      : keyboardType

  return (
    <OuterContainer multiline={multiline} marginRemStyle={marginRemStyle}>
      <EdgeTouchableWithoutFeedback accessible={false} testID={testID} onPress={() => focus()}>
        <Container disableAnimation={disableAnimation} focusAnimation={focusAnimation} multiline={multiline} scale={scale}>
          <SideContainer scale={leftIconSize}>{LeftIcon == null ? null : <LeftIcon color={iconColor} size={leftIconSize} />}</SideContainer>

          <InnerContainer focusValue={focusValue} hasPlaceholder={placeholder != null}>
            {placeholder == null ? null : (
              <Placeholder shift={focusValue}>
                <PlaceholderText disableAnimation={disableAnimation} focusAnimation={focusAnimation} scale={scale} shift={focusValue} textsizeRem={textsizeRem}>
                  {placeholder}
                </PlaceholderText>
              </Placeholder>
            )}

            {prefix == null ? null : <PrefixAnimatedText visibility={focusValue}>{prefix}</PrefixAnimatedText>}
            <InputComponent
              accessible
              animated
              editable={!disabled}
              ref={inputRef}
              keyboardType={hackKeyboardType}
              returnKeyType={returnKeyType}
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
              textsizeRem={textsizeRem}
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
              autoComplete={autoComplete}
              blurOnSubmit={multiline ? false : blurOnSubmit}
              inputAccessoryViewID={inputAccessoryViewID}
              secureTextEntry={hidePassword}
              numberOfLines={multiline ? 20 : undefined}
            />
            {suffix == null ? null : <SuffixText>{suffix}</SuffixText>}
          </InnerContainer>

          {showSpinner ? <ActivityIndicator /> : null}
          {secureTextEntry ? (
            <TouchContainer extendTappable="leftOnly" testID={`${testID}.eyeIcon`} onPress={handleHidePassword}>
              <IconContainer>
                <EyeIconAnimated accessible color={iconColor} off={!hidePassword} />
              </IconContainer>
            </TouchContainer>
          ) : null}

          <TouchContainer extendTappable={secureTextEntry ? 'rightOnly' : 'full'} accessible onPress={handleClearPress} testID={`${testID}.clearIcon`}>
            <SideContainer scale={rightIconSize}>
              <CloseIconAnimated color={iconColor} size={rightIconSize} />
            </SideContainer>
          </TouchContainer>
        </Container>
      </EdgeTouchableWithoutFeedback>
      {valid != null || error != null || charactersLeft !== '' ? (
        <MessagesContainer noLayoutFlow={charactersLeft === ''}>
          <Message danger={error != null}>{valid ?? error ?? null}</Message>
          <Message>{charactersLeft}</Message>
        </MessagesContainer>
      ) : null}
    </OuterContainer>
  )
})

const OuterContainer = styled(View)<{ multiline: boolean; marginRemStyle: MarginRemStyle }>(theme => ({ multiline, marginRemStyle }) => ({
  ...marginRemStyle,
  flexGrow: multiline ? 1 : undefined,
  flexShrink: multiline ? 1 : undefined
}))

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
      flexGrow: multiline ? 1 : undefined,
      flexShrink: multiline ? 1 : undefined,
      alignItems: multiline ? 'stretch' : 'center',
      borderWidth: theme.textInputBorderWidth,
      borderRadius: theme.rem(0.5),
      flexDirection: 'row',
      paddingHorizontal: theme.rem(0.75)
    },
    useAnimatedStyle(() => ({
      backgroundColor: interpolateInputBackgroundColor(focusAnimation, disableAnimation),
      borderColor: interpolateOutlineColor(focusAnimation, disableAnimation),
      opacity: interpolate(scale.value, [1, 0.5], [1, 0]),
      marginHorizontal: interpolate(scale.value, [1, 0], [0, 2 * rem]),
      paddingVertical: scale.value * rem
    }))
  ]
})

/**
 * extendTappable: Which horizontal side of the icon do we want to increase
 * tappable area? 'full' means both left and right sides.
 */
const TouchContainer = styled(TouchableOpacity)<{ extendTappable: 'leftOnly' | 'rightOnly' | 'full' }>(theme => ({ extendTappable }) => {
  // Increase tappable area with padding, while net 0 with negative margin to
  // visually appear as if 0 margins/padding
  const tapArea =
    extendTappable === 'leftOnly'
      ? {
          paddingLeft: theme.rem(1),
          marginLeft: -theme.rem(1)
        }
      : extendTappable === 'rightOnly'
      ? {
          paddingRight: theme.rem(1),
          marginRight: -theme.rem(1)
        }
      : // extendTappable === 'full'
        {
          marginHorizontal: -theme.rem(1),
          paddingHorizontal: theme.rem(1)
        }

  return {
    paddingVertical: theme.rem(1.25),
    marginVertical: -theme.rem(1.25),
    ...tapArea
  }
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

  // Need 2 pixels of shift given a 16 point rem settings
  const androidHShift = isAndroid ? rem / 8 : 0

  return [
    {
      left: androidHShift,
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      alignSelf: 'flex-start'
    },
    useAnimatedStyle(() => {
      const shiftValue = interpolate(focusValue.value, [0, 1], [0, rem * 0.5])
      return {
        marginTop: hasPlaceholder ? shiftValue : undefined,
        marginBottom: hasPlaceholder ? -shiftValue : undefined
      }
    })
  ]
})

const PrefixAnimatedText = styled(Animated.Text)<{ visibility: SharedValue<number> }>(theme => ({ visibility }) => {
  const rem = theme.rem(1)

  return [
    {
      color: theme.secondaryText,
      fontFamily: theme.fontFaceDefault,
      fontSize: theme.rem(1),
      includeFontPadding: false
    },
    useAnimatedStyle(() => {
      return {
        opacity: visibility.value,
        transform: [{ translateY: (1 - visibility.value) * rem }, { scale: visibility.value }]
      }
    })
  ]
})

const SuffixText = styled(Text)(theme => {
  return {
    color: theme.secondaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    includeFontPadding: false,
    marginRight: theme.rem(0.5)
  }
})

const Placeholder = styled(Animated.View)<{ shift: SharedValue<number> }>(theme => ({ shift }) => {
  const rem = theme.rem(1)
  const androidVShift = isAndroid ? rem / 16 : 0
  return [
    {
      position: 'absolute',
      top: androidVShift,
      left: rem * 0.4,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.rem(0),
      paddingVertical: 0,
      margin: 0
    },
    useAnimatedStyle(() => ({
      transform: [
        {
          translateY: interpolate(shift.value, [0, 1], [0, -1 * rem])
        },
        {
          translateX: interpolate(shift.value, [0, 1], [0, -0.4 * rem])
        }
      ]
    }))
  ]
})

const PlaceholderText = styled(Animated.Text)<{
  disableAnimation: SharedValue<number>
  focusAnimation: SharedValue<number>
  scale: SharedValue<number>
  shift: SharedValue<number>
  textsizeRem?: number
}>(theme => ({ disableAnimation, focusAnimation, scale, shift, textsizeRem }) => {
  const fontSizeBase = theme.rem(textsizeRem ?? scale.value)
  const fontSizeScaled = theme.rem(scale.value) * 0.75
  const interpolatePlaceholderTextColor = useAnimatedColorInterpolateFn(
    theme.textInputPlaceholderColor,
    theme.textInputPlaceholderColorFocused,
    theme.textInputPlaceholderColorDisabled
  )

  return [
    {
      fontFamily: theme.fontFaceDefault,
      fontSize: theme.rem(1),
      includeFontPadding: false
    },
    useAnimatedStyle(() => {
      return {
        color: interpolatePlaceholderTextColor(focusAnimation, disableAnimation),
        fontSize: interpolate(shift.value, [0, 1], [fontSizeBase, fontSizeScaled])
      }
    })
  ]
})

const StyledAnimatedTextInput = styledWithRef(AnimatedTextInput)<{
  disableAnimation: SharedValue<number>
  focusAnimation: SharedValue<number>
  scale: SharedValue<number>
  textsizeRem?: number
}>(theme => ({ disableAnimation, focusAnimation, scale, textsizeRem }) => {
  const rem = theme.rem(textsizeRem ?? 1)
  const interpolateTextColor = useAnimatedColorInterpolateFn(theme.textInputTextColor, theme.textInputTextColorFocused, theme.textInputTextColorDisabled)
  // Need 2 pixels of shift given a 16 point rem settings
  // This is due to Android rendering a text input vertically lower
  // than a Text field by ~2 pixels
  const androidVShift = isAndroid ? rem / 8 : 0

  return [
    {
      color: theme.textInputBackgroundColor,
      flexGrow: 1,
      flexShrink: 1,
      fontFamily: theme.fontFaceDefault,
      paddingHorizontal: 0,
      paddingVertical: 0,
      transform: [{ translateY: -androidVShift }],
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
  textsizeRem?: number
}>(theme => ({ disableAnimation, focusAnimation, textsizeRem, scale }) => {
  const rem = theme.rem(textsizeRem ?? 1)
  const interpolateTextColor = useAnimatedColorInterpolateFn(theme.textInputTextColor, theme.textInputTextColorFocused, theme.textInputTextColorDisabled)
  // Need 2 pixels of shift given a 16 point rem settings
  // This is due to Android rendering a text input vertically lower
  // than a Text field by ~2 pixels
  const androidVShift = isAndroid ? rem / 8 : 0

  return [
    {
      color: theme.textInputBackgroundColor,
      flexGrow: 1,
      flexShrink: 1,
      fontFamily: theme.fontFaceDefault,
      paddingHorizontal: 0,
      paddingVertical: 0,
      transform: [{ translateY: -androidVShift }],
      margin: 0
    },
    useAnimatedStyle(() => ({
      color: interpolateTextColor(focusAnimation, disableAnimation),
      fontSize: scale.value * rem
    }))
  ]
})

const MessagesContainer = styled(Animated.View)<{ noLayoutFlow?: boolean }>(theme => props => [
  {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.rem(0.5),
    height: theme.rem(1)
  },
  props.noLayoutFlow
    ? {
        // HACK: If this field has a potential error message, counter-act the
        // layout flow to avoid the effect of the error message's appearance
        // pushing components below the this text field down.
        // If there's a counter, this field is already taking up the maximum
        // amount of vertical space, so the above is not an issue.
        marginBottom: -theme.rem(1)
      }
    : {}
])

const Message = styled(Text)<{ danger?: boolean }>(theme => props => [
  {
    color: props.danger === true ? theme.dangerText : theme.secondaryText,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(0.75),
    includeFontPadding: false
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

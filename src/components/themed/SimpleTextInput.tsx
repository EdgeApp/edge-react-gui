import * as React from 'react'
import { useMemo } from 'react'
import { TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
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
import { SpaceProps, useSpaceStyle } from '../../hooks/useSpaceStyle'
import { styled, styledWithRef } from '../hoc/styled'
import { AnimatedIconComponent, CloseIconAnimated } from '../icons/ThemedIcons'
import { useTheme } from '../services/ThemeContext'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

export type SimpleTextInputReturnKeyType = 'done' | 'go' | 'next' | 'search' | 'send' // Defaults to 'done'

export interface SimpleTextInputProps extends SpaceProps {
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

  // Unless 'autoFocus' is passed explicitly in the props, Search Bars 'autoFocus' and 'regular' text inputs don't.
  autoFocus?: boolean // Defaults to 'true'

  // Unless 'blurOnClear' is passed explicitly in the props, Search Bars calls 'blur' when cleared and text inputs don't call 'blur' when cleared.
  blurOnClear?: boolean // Defaults to 'false'

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
    autoCapitalize,
    autoCorrect,
    autoFocus = false,
    blurOnClear = false,
    blurOnSubmit,
    disabled = false,
    inputAccessoryViewID,
    maxLength,
    secureTextEntry,
    testID,
    ...spaceProps
  } = props
  const theme = useTheme()
  const themeRem = theme.rem(1)

  const hasIcon = Icon != null
  const hasValue = value !== ''

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

  return (
    <TouchableWithoutFeedback accessible={false} testID={testID} onPress={() => focus()}>
      <Container disableAnimation={disableAnimation} focusAnimation={focusAnimation} scale={scale} spaceProps={spaceProps}>
        <SideContainer size={leftIconSize}>{Icon == null ? null : <Icon color={iconColor} size={leftIconSize} />}</SideContainer>

        <InnerContainer>
          {placeholder == null ? null : (
            <PlaceholderText disableAnimation={disableAnimation} focusAnimation={focusAnimation} scale={scale}>
              {placeholder}
            </PlaceholderText>
          )}
          <InputField
            accessible
            ref={inputRef}
            keyboardType={props.keyboardType}
            returnKeyType={props.returnKeyType}
            accessibilityState={{ disabled }}
            autoFocus={autoFocus}
            disableAnimation={disableAnimation}
            focusAnimation={focusAnimation}
            selectionColor={theme.textInputTextColor}
            testID={`${testID}.textInput`}
            textAlignVertical="top"
            scale={scale}
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

        <TouchableOpacity accessible onPress={handleClearPress} testID={`${testID}.clearIcon`}>
          <SideContainer size={rightIconSize}>
            <CloseIconAnimated color={iconColor} size={rightIconSize} />
          </SideContainer>
        </TouchableOpacity>
      </Container>
    </TouchableWithoutFeedback>
  )
})

const Container = styled(Animated.View)<{
  disableAnimation: SharedValue<number>
  focusAnimation: SharedValue<number>
  scale: SharedValue<number>
  spaceProps: SpaceProps
}>(theme => ({ disableAnimation, focusAnimation, scale, spaceProps }) => {
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
  const spaceStyle = useSpaceStyle(spaceProps)

  return [
    spaceStyle,
    {
      alignItems: 'center',
      borderWidth: theme.textInputBorderWidth,
      borderRadius: theme.rem(theme.textInputBorderRadius),
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

const PlaceholderText = styled(Animated.Text)<{
  disableAnimation: SharedValue<number>
  focusAnimation: SharedValue<number>
  scale: SharedValue<number>
}>(theme => ({ disableAnimation, focusAnimation, scale }) => {
  const rem = theme.rem(1)
  const interpolatePlaceholderTextColor = useAnimatedColorInterpolateFn(
    theme.textInputPlaceholderColor,
    theme.textInputPlaceholderColorFocused,
    theme.textInputPlaceholderColorDisabled
  )

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
    {
      fontFamily: theme.fontFaceDefault,
      fontSize: theme.rem(1),
      includeFontPadding: false
    },
    useAnimatedStyle(() => {
      return {
        color: interpolatePlaceholderTextColor(focusAnimation, disableAnimation),
        fontSize: scale.value * rem
      }
    })
  ]
})

const InputField = styledWithRef(AnimatedTextInput)<{
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

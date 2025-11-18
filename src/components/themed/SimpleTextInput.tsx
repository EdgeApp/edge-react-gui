import * as React from 'react'
import { useMemo } from 'react'
import { Platform, TextInput, TouchableOpacity, View } from 'react-native'
import Animated, {
  interpolate,
  interpolateColor,
  type SharedValue,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated'

import { useHandler } from '../../hooks/useHandler'
import {
  type LayoutStyleProps,
  useLayoutStyle
} from '../../hooks/useLayoutStyle'
import { lstrings } from '../../locales/strings'
import { EdgeTouchableWithoutFeedback } from '../common/EdgeTouchableWithoutFeedback'
import {
  type AnimatedIconComponent,
  ChevronLeftAnimated,
  CloseIconAnimated
} from '../icons/ThemedIcons'
import { cacheStyles, type Theme, useTheme } from '../services/ThemeContext'
import { UnscaledText } from '../text/UnscaledText'

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput)

export type SimpleTextInputReturnKeyType =
  | 'done'
  | 'go'
  | 'next'
  | 'search'
  | 'send' // Defaults to 'done'

export interface SimpleTextInputProps extends LayoutStyleProps {
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
  onSubmitEditing?: () => void

  // Other React Native TextInput properties:
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters' // Defaults to 'sentences'
  autoCorrect?: boolean // Defaults to 'true'
  blurOnSubmit?: boolean // Defaults to 'true'
  keyboardType?:
    | 'default'
    | 'number-pad'
    | 'decimal-pad'
    | 'numeric'
    | 'email-address'
    | 'phone-pad' // Defaults to 'default'
  maxLength?: number
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
  setNativeProps: (nativeProps: object) => void
}

export const SimpleTextInput = React.forwardRef<
  SimpleTextInputRef,
  SimpleTextInputProps
>((props: SimpleTextInputProps, ref) => {
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
    blurOnSubmit = false,
    disabled = false,
    keyboardType,
    maxLength,
    returnKeyType,
    secureTextEntry,
    active,
    testID,
    ...layoutProps
  } = props
  const theme = useTheme()
  const styles = getStyles(theme)
  const themeRem = theme.rem(1)

  // TODO: Remove aroundRem=0 prop once this component's design consideration
  // has changed to expecting 0.5rem default margins.
  const layoutStyle = useLayoutStyle({ aroundRem: 0, ...layoutProps })

  const hasIcon = Icon != null
  const isIos = Platform.OS === 'ios'

  const [isFocused, setIsFocused] = React.useState(false)

  const valueRef = useSharedValue(value)
  const handleChangeText = (value: string): void => {
    valueRef.value = value
    if (onChangeText != null) onChangeText(value)
  }

  // Imperative methods:
  const inputRef = useAnimatedRef<TextInput>()
  function blur(): void {
    if (inputRef.current != null) inputRef.current.blur()
  }
  function clear(): void {
    if (inputRef.current != null) inputRef.current.clear()
    handleChangeText('')
    if (blurOnClear) blur()
    if (onClear != null) onClear()
  }
  function focus(): void {
    if (inputRef.current != null && !disabled) inputRef.current.focus()
  }
  function checkIsFocused(): boolean {
    return inputRef.current != null ? inputRef.current.isFocused() : false
  }
  function setNativeProps(nativeProps: object): void {
    if (inputRef.current != null) inputRef.current.setNativeProps(nativeProps)
  }

  // This fixes RN bugs with controlled TextInput components.
  // By avoiding the `value` prop for the TextInput, we can avoid the bugs.
  // So an alternative to using the `value` prop, is to imperatively set the,
  // TextInput's text value using `setNativeProps({ text: value })`.
  // We do this only if the `value` prop from this component has changed.
  React.useEffect(() => {
    if (inputRef.current != null && value !== valueRef.value) {
      valueRef.value = value
      inputRef.current.setNativeProps({ text: value })
    }
  }, [inputRef, value, valueRef])

  React.useImperativeHandle(ref, () => ({
    blur,
    clear,
    focus,
    isFocused: checkIsFocused,
    setNativeProps
  }))

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
    if (active == null)
      focusAnimation.value = withDelay(
        animationDelay,
        withTiming(0, { duration: baseDuration })
      )

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
    if (active == null)
      focusAnimation.value = withTiming(1, { duration: baseDuration })
    if (onFocus != null) onFocus()
    setIsFocused(true)
  })
  const handleSubmitEditing = useHandler(() => {
    if (onSubmitEditing != null) onSubmitEditing()
  })

  React.useEffect(() => {
    if (active == null) return
    focusAnimation.value = active
      ? withTiming(1, { duration: baseDuration })
      : withDelay(animationDelay, withTiming(0, { duration: baseDuration }))
  }, [active, focusAnimation, baseDuration, animationDelay])

  // --------------------------------------------------------------------
  // Colors
  // --------------------------------------------------------------------

  const placeholderTextColor = useMemo(() => {
    return disabled
      ? theme.textInputPlaceholderColorDisabled
      : isFocused
      ? theme.textInputPlaceholderColorFocused
      : theme.textInputPlaceholderColor
  }, [
    disabled,
    isFocused,
    theme.textInputPlaceholderColor,
    theme.textInputPlaceholderColorDisabled,
    theme.textInputPlaceholderColorFocused
  ])
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
  const interpolateTextColor = useAnimatedColorInterpolateFn(
    theme.textInputTextColor,
    theme.textInputTextColorFocused,
    theme.textInputTextColorDisabled
  )
  const interpolateIconColor = useAnimatedColorInterpolateFn(
    theme.textInputIconColor,
    theme.textInputIconColorFocused,
    theme.textInputIconColorDisabled
  )
  const iconColor = useDerivedValue(() =>
    interpolateIconColor(focusAnimation, disableAnimation)
  )

  // --------------------------------------------------------------------
  // Styles
  // --------------------------------------------------------------------

  const backIconStyle = useAnimatedStyle(() => {
    const scale = isIos ? 0 : focusAnimation.value
    return {
      transform: [{ scale }],
      marginRight: (scale - 1) * themeRem
    }
  })

  const leftIconStyle = useAnimatedStyle(() => {
    const scale = !hasIcon
      ? 0
      : valueRef.value !== '' && active !== true
      ? 0
      : 1 - focusAnimation.value
    return {
      transform: [{ scale }],
      marginRight: (scale - 1) * themeRem
    }
  })

  const clearIconStyle = useAnimatedStyle(() => {
    const scale = valueRef.value !== '' ? 1 : focusAnimation.value
    return {
      transform: [{ scale }],
      marginLeft: (scale - 1) * themeRem
    }
  })

  const inputContainerStyle = useAnimatedStyle(() => {
    'worklet'
    const scale = scaleProp?.value ?? 1
    return {
      backgroundColor: interpolateInputBackgroundColor(
        focusAnimation,
        disableAnimation
      ),
      borderColor: interpolateOutlineColor(focusAnimation, disableAnimation),
      opacity: interpolate(scale, [1, 0.5], [1, 0]),
      transform: [
        {
          scale: interpolate(scale, [1, 0], [1, 0.75])
        }
      ]
    }
  })

  const textInputStyle = useAnimatedStyle(() => ({
    color: interpolateTextColor(focusAnimation, disableAnimation)
  }))

  return (
    <View style={[styles.container, layoutStyle]}>
      <EdgeTouchableWithoutFeedback
        accessible={false}
        testID={testID}
        onPress={() => {
          focus()
        }}
      >
        <Animated.View style={[styles.inputContainer, inputContainerStyle]}>
          {Icon == null ? null : (
            <Animated.View style={[styles.iconContainer, leftIconStyle]}>
              <Icon color={iconColor} />
            </Animated.View>
          )}
          <TouchableOpacity
            accessible
            hitSlop={theme.rem(0.75)}
            testID={`${testID}.doneButton`}
            onPress={handleCancelPress}
          >
            <Animated.View style={[styles.iconContainer, backIconStyle]}>
              <ChevronLeftAnimated color={iconColor} />
            </Animated.View>
          </TouchableOpacity>

          <AnimatedTextInput
            allowFontScaling={false}
            accessible
            ref={inputRef}
            keyboardType={keyboardType}
            returnKeyType={returnKeyType}
            accessibilityState={{ disabled }}
            autoFocus={autoFocus}
            defaultValue={value}
            placeholder={placeholder}
            placeholderTextColor={placeholderTextColor}
            selectionColor={theme.textInputSelectionColor}
            style={[styles.textInput, textInputStyle]}
            testID={`${testID}.textInput`}
            textAlignVertical="top"
            // Callbacks:
            onBlur={handleBlur}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onSubmitEditing={handleSubmitEditing}
            maxLength={maxLength}
            // Other Props:
            autoCapitalize={autoCapitalize}
            autoCorrect={autoCorrect}
            submitBehavior={blurOnSubmit ? 'blurAndSubmit' : 'submit'}
            secureTextEntry={secureTextEntry}
          />

          <TouchableOpacity
            accessible
            hitSlop={theme.rem(1)}
            testID={`${testID}.clearIcon`}
            onPress={handleClearPress}
          >
            <Animated.View style={[styles.iconContainer, clearIconStyle]}>
              <CloseIconAnimated color={iconColor} />
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </EdgeTouchableWithoutFeedback>
      {isIos && (isFocused || active === true) ? (
        <TouchableOpacity
          accessible
          onPress={handleCancelPress}
          testID={`${testID}.cancelButton`}
          style={styles.cancelButton}
        >
          <UnscaledText
            ellipsizeMode="clip"
            numberOfLines={1}
            style={styles.cancelText}
          >
            {lstrings.string_cancel_cap}
          </UnscaledText>
        </TouchableOpacity>
      ) : null}
    </View>
  )
})

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  inputContainer: {
    alignItems: 'center',
    borderWidth: theme.textInputBorderWidth,
    borderRadius: theme.rem(theme.textInputBorderRadius),
    flexDirection: 'row',
    flexGrow: 1,
    flexShrink: 1,
    paddingHorizontal: theme.rem(1),
    paddingVertical: theme.rem(0.75)
  },
  iconContainer: {
    width: theme.rem(1),
    height: theme.rem(1)
  },
  textInput: {
    flex: 1,
    fontFamily: theme.fontFaceDefault,
    paddingHorizontal: theme.rem(0.5),
    paddingVertical: 0,
    margin: 0,
    fontSize: theme.rem(1)
  },

  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.rem(0.5)
  },
  cancelText: {
    color: theme.textInputIconColorFocused,
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(1),
    includeFontPadding: false,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    marginHorizontal: theme.rem(0.5),
    flexShrink: 0
  }
}))

type ColorInterpolateFn = (
  focusValue: SharedValue<number>,
  disabledValue: SharedValue<number>
) => string

function useAnimatedColorInterpolateFn(
  fromColor: string,
  toColor: string,
  disabledColor: string
): ColorInterpolateFn {
  const interpolateFn = useMemo(() => {
    return (
      focusValue: SharedValue<number>,
      disabledValue: SharedValue<number>
    ) => {
      'worklet'
      const interFocusColor = interpolateColor(
        focusValue.value,
        [0, 1],
        [fromColor, toColor]
      )
      return interpolateColor(
        disabledValue.value,
        [0, 1],
        [interFocusColor, disabledColor]
      )
    }
  }, [fromColor, toColor, disabledColor])

  return interpolateFn
}

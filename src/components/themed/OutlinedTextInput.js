// @flow

import * as React from 'react'
import { ActivityIndicator, Platform, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'
import IonIcon from 'react-native-vector-icons/Ionicons'

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from '../../types/reactHooks.js'
import { fixSides, mapSides, sidesToMargin } from '../../util/sides.js'
import { cacheStyles, useTheme } from '../services/ThemeContext.js'

type Props = {|
  // Contents:
  value: string,
  error?: string,
  label?: string,

  // Appearance:
  clearIcon?: boolean, // Defaults to 'true'
  marginRem?: number | number[], // Defaults to 0.5
  multiline?: boolean, // Defaults to 'false'
  searchIcon?: boolean, // Defaults to 'false'
  showSpinner?: boolean, // Defaults to 'false'

  // Callbacks:
  onBlur?: () => void,
  onChangeText?: (text: string) => void,
  onClear?: () => void,
  onFocus?: () => void,

  // Other React Native TextInput properties:
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters', // Defaults to 'sentences'
  autoCorrect?: boolean, // Defaults to 'true'
  blurOnSubmit?: boolean, // Defaults to 'true'
  inputAccessoryViewID?: string,
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad', // Defaults to 'default'
  maxLength?: number,
  onSubmitEditing?: () => void,
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send', // Defaults to 'done'
  secureTextEntry?: boolean, // Defaults to 'false'
  testID?: string,

  // Unless 'autoFocus' is passed explicitly in the props, Search Bars 'autoFocus' and 'regular' text inputs don't.
  autoFocus?: boolean, // Defaults to 'true'

  // Unless 'blurOnClear' is passed explicitly in the props, Search Bars calls 'blur' when cleared and text inputs don't call 'blur' when cleared.
  blurOnClear?: boolean // Defaults to 'false'
|}

/**
 * Type definitions for our static methods.
 * Create a ref object using `useRef<OutlinedTextInputRef>(null)` or
 * `const ref: { current: OutlinedTextInputRef | null } = createRef()`
 */
declare export class OutlinedTextInputRef extends React.Component<Props> {
  focus: () => void;
  blur: () => void;
  isFocused: () => boolean;
  clear: () => void;
}

export const OutlinedTextInput: Class<OutlinedTextInputRef> = forwardRef((props: Props, ref) => {
  const {
    // Contents:
    error,
    label,
    value,

    // Appearance:
    clearIcon = true,
    marginRem,
    multiline = false,
    searchIcon = false,
    showSpinner = false,

    // Callbacks:
    onBlur,
    onChangeText,
    onClear,
    onFocus,

    // TextInput:
    autoFocus = !searchIcon,
    blurOnClear = searchIcon,
    maxLength,
    secureTextEntry,
    ...inputProps
  } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const hasError = error != null
  const hasLabel = label != null
  const hasValue = value !== ''

  // Show/Hide password input:
  const [hidePassword, setHidePassword] = useState(secureTextEntry ?? false)
  const handleHidePassword = () => setHidePassword(!hidePassword)

  // Imperative methods:
  const inputRef = useRef<TextInput>(null)
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
    if (inputRef.current != null) inputRef.current.focus()
  }
  function isFocused(): boolean {
    return inputRef.current != null ? inputRef.current.isFocused() : false
  }
  useImperativeHandle(ref, () => ({ blur, clear, focus, isFocused }))

  // Captures the width of the placeholder label:
  const [labelWidth, setLabelWidth] = useState(0)
  const handleLabelLayout = event => setLabelWidth(event.nativeEvent.layout.width)

  // Captures the width of the counter label:
  const [counterWidth, setCounterWidth] = useState(0)
  const handleCounterLayout = event => setCounterWidth(event.nativeEvent.layout.width)

  // Animates between 0 and 1 based our error state:
  const errorAnimation = useSharedValue(0)
  useEffect(() => {
    errorAnimation.value = withTiming(hasError ? 1 : 0)
  }, [errorAnimation, hasError])

  // Animates between 0 and 1 based on focus:
  const baseDuration = 300
  const focusAnimation = useSharedValue(0)

  // A delayed focus animation for translating the label up is required to
  // avoid overlapping into the opening animation of the top border.
  // A delayed focus animation is required for closing the top border when
  // animating everything back to their original positions.
  const animationDelay = 0.4 * baseDuration
  const focusAnimationAlt = useSharedValue(0)

  const handleBlur = () => {
    focusAnimation.value = withDelay(animationDelay, withTiming(0, { duration: baseDuration }))
    focusAnimationAlt.value = withTiming(0, { duration: baseDuration })
    if (onBlur != null) onBlur()
  }
  const handleFocus = () => {
    focusAnimation.value = withTiming(1, { duration: baseDuration })
    focusAnimationAlt.value = withDelay(animationDelay, withTiming(1, { duration: baseDuration }))
    if (onFocus != null) onFocus()
  }

  // Label dimensions:
  const labelLeft = theme.rem(1)
  const labelPadding = theme.rem(0.25) // Gap in the top line
  const labelShrink = 0.25 // How much to shrink the text
  const labelTranslateX =
    (searchIcon ? theme.rem(-1.875) : 0) +
    labelPadding +
    // Compensate for the scaling origin being in the center:
    -0.5 * labelShrink * labelWidth
  const labelTranslateY = theme.rem(-1.5)

  // Counter dimensions
  const counterRight = theme.rem(1)
  const counterPadding = theme.rem(0.25) // Gap in the bottom line
  const counterTranslateX =
    counterPadding +
    // Compensate for the scaling origin being in the center:
    0.5 * counterWidth

  // Pad right side of the bottom line when no counter is present,
  // to account for rounded corner.
  const cornerPadding = theme.rem(0.5)

  // React-controlled styles:
  const containerPadding = {
    paddingLeft: searchIcon ? theme.rem(2.875) : theme.rem(1),
    paddingRight: clearIcon ? theme.rem(2.875) : theme.rem(1)
  }
  const containerStyle = {
    ...containerPadding,
    ...sidesToMargin(mapSides(fixSides(marginRem, 0.5), theme.rem)),
    flexGrow: multiline ? 1 : 0,
    paddingVertical: multiline
      ? // Tweaked to align the first input line with the label text:
        Platform.OS === 'android'
        ? theme.rem(0.75)
        : theme.rem(0.625)
      : 0
  }
  const textInputStyle = {
    flexGrow: multiline ? 1 : 0
  }

  // Animated styles:
  const getBorderColor = useMemo(
    () => getIterpolatedColor(theme.outlineTextInputBorderColor, theme.outlineTextInputBorderColorFocused, theme.dangerText),
    [theme]
  )

  const getLabelColor = useMemo(() => getIterpolatedColor(theme.outlineTextInputLabelColor, theme.outlineTextInputLabelColorFocused, theme.dangerText), [theme])

  const bottomStyle = useAnimatedStyle(() => {
    const counterProgress = hasValue ? 1 : focusAnimation.value
    return {
      borderColor: getBorderColor(errorAnimation.value, focusAnimation.value),
      right: maxLength !== undefined ? counterRight + counterProgress * (2 * counterPadding + counterWidth) : cornerPadding
    }
  })
  const leftStyle = useAnimatedStyle(() => ({
    borderColor: getBorderColor(errorAnimation.value, focusAnimation.value)
  }))
  const rightStyle = useAnimatedStyle(() => ({
    borderColor: getBorderColor(errorAnimation.value, focusAnimation.value)
  }))
  const topStyle = useAnimatedStyle(() => {
    const counterProgress = hasLabel ? (hasValue ? 1 : focusAnimation.value) : 0
    return {
      borderColor: getBorderColor(errorAnimation.value, focusAnimation.value),
      left: labelLeft + counterProgress * (2 * labelPadding + labelWidth * (1 - labelShrink))
    }
  })
  const labelStyle = useAnimatedStyle(() => {
    const labelProgressAlt = hasValue ? 1 : focusAnimationAlt.value
    return {
      color: getLabelColor(errorAnimation.value, focusAnimation.value),
      transform: [
        { translateX: labelProgressAlt * labelTranslateX },
        { translateY: labelProgressAlt * labelTranslateY },
        { scale: 1 - labelProgressAlt * labelShrink }
      ]
    }
  })
  const counterStyle = useAnimatedStyle(() => {
    const counterProgress = hasValue ? 1 : focusAnimation.value
    return {
      color: interpolateColor(errorAnimation.value, [0, 1], [theme.secondaryText, theme.dangerText]),
      opacity: counterProgress,
      transform: [{ translateX: (1 - counterProgress) * counterTranslateX }, { scale: counterProgress }]
    }
  })
  const errorStyle = useAnimatedStyle(() => ({
    opacity: errorAnimation.value
  }))
  const showPasswordLineStyle = useAnimatedStyle(() => ({
    backgroundColor: getBorderColor(errorAnimation.value, focusAnimation.value),
    transform: [
      { rotateZ: '45deg' },
      {
        scaleX: withTiming(hidePassword ? 1 : 0, { duration: baseDuration })
      }
    ]
  }))
  // Character limit
  const charLimitLabel = maxLength === undefined ? '' : `${maxLength - value.length}`

  const numpad = props.keyboardType === 'decimal-pad' || props.keyboardType === 'decimal'
  const textStyle = numpad ? styles.numberInput : styles.textInput

  return (
    <TouchableWithoutFeedback onPress={() => focus()}>
      <View style={[styles.container, containerStyle]}>
        <Animated.View style={[styles.bottomLine, bottomStyle]} />
        <Animated.View style={[styles.leftCap, leftStyle]} />
        <Animated.View style={[styles.rightCap, rightStyle]} />
        <Animated.View style={[styles.topLine, topStyle]} />
        <View style={[styles.labelContainer, containerPadding]}>
          <Animated.Text numberOfLines={1} style={[styles.labelText, labelStyle]} onLayout={handleLabelLayout}>
            {label}
          </Animated.Text>
        </View>
        <Animated.Text numberOfLines={1} style={[styles.errorText, errorStyle]}>
          {error}
        </Animated.Text>
        <Animated.Text numberOfLines={1} style={[styles.counterText, counterStyle]} onLayout={handleCounterLayout}>
          {charLimitLabel}
        </Animated.Text>
        {searchIcon ? <AntDesignIcon name="search1" style={styles.searchIcon} /> : null}
        {clearIcon && hasValue && !showSpinner && !secureTextEntry ? (
          <TouchableOpacity style={styles.clearTapArea} onPress={() => clear()}>
            <AntDesignIcon name="close" style={styles.clearIcon} />
          </TouchableOpacity>
        ) : null}
        {showSpinner && !secureTextEntry ? (
          <View style={styles.clearTapArea}>
            <ActivityIndicator style={styles.spinnerIcon} />
          </View>
        ) : null}

        {secureTextEntry ? (
          <TouchableWithoutFeedback onPress={handleHidePassword}>
            <View style={styles.clearTapArea}>
              <Animated.View style={[styles.eyeIconHideLine, showPasswordLineStyle]} />
              <IonIcon name="eye-outline" style={styles.eyeIcon} />
            </View>
          </TouchableWithoutFeedback>
        ) : null}
        <TextInput
          ref={inputRef}
          {...inputProps}
          autoFocus={autoFocus}
          multiline={multiline}
          selectionColor={hasError ? theme.dangerText : theme.outlineTextInputTextColor}
          style={[textStyle, textInputStyle]}
          textAlignVertical="top"
          value={value}
          secureTextEntry={hidePassword}
          // Callbacks:
          onBlur={handleBlur}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          maxLength={maxLength}
        />
      </View>
    </TouchableWithoutFeedback>
  )
})

const getStyles = cacheStyles(theme => {
  // A top or bottom line in the border puzzle:
  const commonLine = {
    borderTopWidth: theme.outlineTextInputBorderWidth,
    position: 'absolute',
    left: theme.rem(1),
    right: theme.rem(1)
  }

  // A left or right C-shape in the border puzzle:
  const commonCap = {
    borderBottomWidth: theme.outlineTextInputBorderWidth,
    borderTopWidth: theme.outlineTextInputBorderWidth,
    position: 'absolute',
    bottom: 0,
    top: 0,
    width: theme.rem(1)
  }

  // Common footer attributes, applies to the counter and the error text
  const footerCommon = {
    fontFamily: theme.fontFaceDefault,
    fontSize: theme.rem(0.75),
    position: 'absolute'
  }

  return {
    // Provides a layout container for the text input:
    container: {
      backgroundColor: theme.outlineTextInputColor,
      borderRadius: theme.rem(0.5),
      justifyContent: 'center',
      minHeight: theme.rem(3),
      paddingHorizontal: theme.rem(1)
    },

    // Provides a layout container for the placeholder label:
    labelContainer: {
      height: theme.rem(3),
      justifyContent: 'center',
      paddingHorizontal: theme.rem(1),
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0
    },

    // The text input and placeholder label both float
    // in their respective containers, allowing React to center them:
    labelText: {
      alignSelf: 'flex-start',
      fontFamily: theme.fontFaceDefault,
      fontSize: theme.rem(1),
      padding: 0
    },
    textInput: {
      alignSelf: 'stretch',
      color: theme.outlineTextInputTextColor,
      fontFamily: theme.fontFaceDefault,
      fontSize: theme.rem(1),
      padding: 0
    },
    numberInput: {
      alignSelf: 'stretch',
      color: theme.outlineTextInputTextColor,
      fontFamily: theme.fontFaceDefault,
      fontSize: theme.rem(1.5),
      padding: 0
    },

    // We render our border in four pieces, so we can animate the top gap:
    bottomLine: {
      ...commonLine,
      bottom: 0
    },
    topLine: {
      ...commonLine,
      top: 0
    },
    leftCap: {
      ...commonCap,
      borderLeftWidth: theme.outlineTextInputBorderWidth,
      borderRightWidth: 0,
      borderBottomLeftRadius: theme.rem(0.5),
      borderTopLeftRadius: theme.rem(0.5),
      left: 0
    },
    rightCap: {
      ...commonCap,
      borderLeftWidth: 0,
      borderRightWidth: theme.outlineTextInputBorderWidth,
      borderBottomRightRadius: theme.rem(0.5),
      borderTopRightRadius: theme.rem(0.5),
      right: 0
    },

    // Icons:
    searchIcon: {
      color: theme.iconDeactivated,
      fontSize: theme.rem(1),
      padding: theme.rem(1),
      position: 'absolute',
      left: 0,
      top: 0
    },
    clearTapArea: {
      position: 'absolute',
      right: 0,
      top: 0
    },
    clearIcon: {
      color: theme.iconDeactivated,
      fontSize: theme.rem(1),
      padding: theme.rem(1)
    },
    spinnerIcon: {
      color: theme.icon,
      padding: theme.rem(1)
    },
    eyeIcon: {
      zIndex: 0,
      color: theme.iconTappable,
      fontSize: theme.rem(1),
      padding: theme.rem(1)
    },
    eyeIconHideLine: {
      borderTopWidth: theme.thinLineWidth,
      borderTopColor: theme.modal,
      borderBottomColor: theme.modal,
      borderBottomWidth: theme.thinLineWidth,
      top: theme.rem(1.5) - theme.thinLineWidth,
      position: 'absolute',
      alignSelf: 'center',
      zIndex: 2,
      width: '40%',
      height: theme.thinLineWidth * 3
    },

    // The error text hangs out in the margin area below the main box:
    errorText: {
      ...footerCommon,
      color: theme.dangerText,
      left: theme.rem(1.25),
      bottom: -theme.rem(1.25)
    },

    // The counter text splits the bottom right border line:
    counterText: {
      ...footerCommon,
      right: theme.rem(1.25),
      bottom: -theme.rem(0.45)
    }
  }
})

const getIterpolatedColor = (fromColor, toColor, errorColor) => (errorValue, focusValue) => {
  'worklet'
  const interFocusColor = interpolateColor(focusValue, [0, 1], [fromColor, toColor])
  return interpolateColor(errorValue, [0, 1], [interFocusColor, errorColor])
}

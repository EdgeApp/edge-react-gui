// @flow

// $FlowFixMe = forwardRef is not recognize by flow?
import React, { forwardRef, useRef } from 'react'
import { Platform, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import Animated, { Extrapolate, interpolate, interpolateColor, SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { unpackEdges } from '../../util/edges'
import { useCallback, useEffect, useImperativeHandle, useMemo, useState } from '../../util/hooks'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext'

const HINT_Y_PLATFORM_ADJUST = Platform.OS === 'android' ? -2 : 0
const PADDING_VERTICAL = 1
const PADDING_VERTICAL_SMALL = 0.65
const FONT_SIZE = 1
const FONT_SIZE_SMALL = 0.875

const ANIMATION_STATES = {
  INIT: 0,
  FOCUSED: 1,
  ERROR: 2
}

type Props = {|
  // Content options:
  label?: string,
  error?: string,

  // Appearance:
  isClearable?: boolean,
  marginRem?: number | number[],
  showSearchIcon?: boolean,
  size?: 'big' | 'small',

  // Callbacks:
  onBlur?: () => void,
  onChangeText?: (text: string) => void,
  onClear?: () => void,
  onFocus?: () => void,

  // Other React Native TextInput properties:
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters',
  autoCorrect?: boolean,
  autoFocus?: boolean,
  inputAccessoryViewID?: string,
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad',
  maxLength?: number,
  onSubmitEditing?: () => void,
  returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send',
  secureTextEntry?: boolean,
  testID?: string,
  value?: string
|}

type CornerBorderProps = {
  theme: Theme,
  corner: 'left' | 'right',
  cornerHeight: { height: number },
  placeholderSize: SharedValue,
  colorMap: SharedValue
}

const getColor = (
  placeholderSizeValue: number,
  colorMapValue: number,
  colors: { inactiveColor: string, activeColor: string, errorColor: string },
  doNotCheckPlaceholder: boolean = false
) => {
  'worklet'
  const { inactiveColor, activeColor, errorColor } = colors
  return doNotCheckPlaceholder || placeholderSizeValue > 0
    ? interpolateColor(colorMapValue, [ANIMATION_STATES.INIT, ANIMATION_STATES.FOCUSED, ANIMATION_STATES.ERROR], [inactiveColor, activeColor, errorColor])
    : inactiveColor
}

const CornerBorder = ({ theme, corner, cornerHeight, placeholderSize, colorMap }: CornerBorderProps) => {
  const styles = getStyles(theme)
  const { inactiveColor, activeColor, errorColor } = getSizeStyles(theme)

  const animatedContainerStyles = useAnimatedStyle(() => {
    const color = getColor(placeholderSize.value, colorMap.value, { inactiveColor, activeColor, errorColor })
    return {
      borderTopColor: color,
      borderBottomColor: color,
      borderLeftColor: color,
      borderRightColor: color
    }
  })
  return <Animated.View style={[corner === 'left' ? styles.cornerLeft : styles.cornerRight, cornerHeight, animatedContainerStyles]} />
}

const EdgeTextFieldOutlinedComponent = forwardRef((props: Props, ref) => {
  const {
    // Content options:
    error,
    label: placeholder = '',

    // Appearance:
    isClearable = false,
    marginRem = 0.5,
    size = 'big',
    showSearchIcon = true,

    // Callbacks:
    onBlur,
    onChangeText,
    onClear,
    onFocus,

    // Other React Native TextInput properties:
    value = '',
    ...inputProps
  } = props

  const [containerHeight, setContainerHeight] = useState(0)

  // animation
  const inputRef = useRef<TextInput>(null)
  const placeholderMap = useSharedValue(value ? ANIMATION_STATES.FOCUSED : ANIMATION_STATES.INIT)
  const placeholderSize = useSharedValue(ANIMATION_STATES.INIT)
  const containerWidth = useSharedValue(ANIMATION_STATES.INIT)
  const colorMap = useSharedValue(ANIMATION_STATES.INIT)

  // input methods
  const focus = () => inputRef.current && inputRef.current.focus()
  const blur = () => inputRef.current && inputRef.current.blur()
  const isFocused = () => Boolean(inputRef.current && inputRef.current.isFocused())
  const clear = () => {
    Boolean(inputRef.current && inputRef.current.clear())
    if (onChangeText != null) onChangeText('')
  }

  // styles
  const theme = useTheme()
  const styles = getStyles(theme)
  const spacings = spacingStyles(marginRem, useTheme())
  const placeholderSpacerWidthAdjust = theme.rem(1)
  const {
    inactiveColor,
    activeColor,
    errorColor,
    fontSize,
    placeholderSpacerAdjust,
    placeholderScale,
    placeholderSizeScale,
    paddingVertical,
    inputStyles,
    placeholderTextStyles,
    placeholderPaddingStyles,
    placeholderSpacerPaddingStyles,
    inputContainerStyles,
    prefixStyles,
    suffixStyles,
    hintLeftMargin
  } = getSizeStyles(theme, size, showSearchIcon)

  const errorState = useCallback(() => error != null && error !== '', [error])

  const handleFocus = () => {
    placeholderMap.value = withTiming(ANIMATION_STATES.FOCUSED)
    if (!errorState()) colorMap.value = withTiming(ANIMATION_STATES.FOCUSED)
    focus()
    if (onFocus != null) onFocus()
  }

  const handleBlur = () => {
    if (!value) placeholderMap.value = withTiming(ANIMATION_STATES.INIT) // blur
    if (!errorState()) colorMap.value = withTiming(ANIMATION_STATES.INIT) // inactive
    blur()
    if (onBlur != null) onBlur()
  }

  const handleChangeText = (text: string) => {
    if (onChangeText != null) onChangeText(text)
  }

  const clearText = () => {
    clear()
    if (onClear != null) onClear()
  }

  const handlePlaceholderLayout = useCallback(
    ({ nativeEvent }) => {
      const { width } = nativeEvent.layout
      placeholderSize.value = width
    },
    [placeholderSize]
  )

  const handleContainerLayout = ({ nativeEvent }) => {
    const { width, height } = nativeEvent.layout
    containerWidth.value = width
    setContainerHeight(height)
  }

  // error handling
  useEffect(() => {
    if (errorState()) {
      colorMap.value = ANIMATION_STATES.ERROR
    } else {
      colorMap.value = isFocused() ? ANIMATION_STATES.FOCUSED : ANIMATION_STATES.INIT
    }
  }, [error, colorMap, errorState])

  const animatedPlaceholderStyles = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          placeholderMap.value,
          [ANIMATION_STATES.INIT, ANIMATION_STATES.FOCUSED],
          [0, -(paddingVertical + fontSize * placeholderScale) + HINT_Y_PLATFORM_ADJUST]
        )
      },
      {
        scale: interpolate(placeholderMap.value, [ANIMATION_STATES.INIT, ANIMATION_STATES.FOCUSED], [1, placeholderScale])
      },
      {
        translateX: interpolate(
          placeholderMap.value,
          [ANIMATION_STATES.INIT, ANIMATION_STATES.FOCUSED],
          [0, -placeholderSize.value * placeholderSizeScale - hintLeftMargin]
        )
      }
    ]
  }))

  const animatedPlaceholderTextStyles = useAnimatedStyle(() => ({
    color: getColor(placeholderSize.value, colorMap.value, { inactiveColor, activeColor, errorColor }, true)
  }))

  const animatedPlaceholderSpacerStyles = useAnimatedStyle(() => ({
    width: interpolate(
      placeholderMap.value,
      [ANIMATION_STATES.INIT, ANIMATION_STATES.FOCUSED],
      [containerWidth.value - placeholderSpacerWidthAdjust, containerWidth.value - placeholderSize.value * placeholderScale - placeholderSpacerAdjust],
      Extrapolate.CLAMP
    ),
    backgroundColor: getColor(placeholderSize.value, colorMap.value, { inactiveColor, activeColor, errorColor })
  }))
  const cornerHeight = { height: containerHeight }
  const animatedContainerStyle = useAnimatedStyle(() => {
    const color = getColor(placeholderSize.value, colorMap.value, { inactiveColor, activeColor, errorColor })
    return {
      borderBottomColor: color,
      borderLeftColor: color,
      borderRightColor: color
    }
  })

  useImperativeHandle(ref, () => ({
    focus: handleFocus,
    blur: handleBlur,
    isFocused: isFocused(),
    clear: clear
  }))

  const placeholderStyle = useMemo(() => {
    return [...placeholderPaddingStyles, animatedPlaceholderStyles]
  }, [...placeholderPaddingStyles, animatedPlaceholderStyles])

  return (
    <Animated.View style={[styles.container, animatedContainerStyle, spacings]} onLayout={handleContainerLayout}>
      <CornerBorder theme={theme} corner="left" cornerHeight={cornerHeight} placeholderSize={placeholderSize} colorMap={colorMap} />
      <CornerBorder theme={theme} corner="right" cornerHeight={cornerHeight} placeholderSize={placeholderSize} colorMap={colorMap} />
      <TouchableWithoutFeedback onPress={handleFocus}>
        <View style={inputContainerStyles}>
          {showSearchIcon ? (
            <View style={prefixStyles}>
              <AntDesignIcon name="search1" color={theme.iconDeactivated} size={theme.rem(1)} />
            </View>
          ) : null}
          <TextInput
            {...inputProps}
            ref={inputRef}
            style={inputStyles}
            pointerEvents="auto"
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChangeText={handleChangeText}
            selectionColor={errorState() ? errorColor : activeColor}
            placeholder=""
            value={value}
          />
          {isClearable && isFocused() && (
            <View style={suffixStyles}>
              <TouchableOpacity onPress={clearText} style={styles.clearContainer}>
                <AntDesignIcon name="close" color={theme.icon} size={theme.rem(1)} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>

      <Animated.View style={[...placeholderSpacerPaddingStyles, animatedPlaceholderSpacerStyles]} />
      <Animated.View style={placeholderStyle} onLayout={handlePlaceholderLayout} pointerEvents="none">
        <Animated.Text style={[...placeholderTextStyles, animatedPlaceholderTextStyles]}>{placeholder}</Animated.Text>
      </Animated.View>
      {errorState() ? <Text style={styles.errorText}>{error}</Text> : null}
    </Animated.View>
  )
})

function spacingStyles(margin: number | number[], theme: Theme) {
  const marginRem = unpackEdges(margin)

  return {
    marginBottom: theme.rem(marginRem.bottom),
    marginLeft: theme.rem(marginRem.left),
    marginRight: theme.rem(marginRem.right),
    marginTop: theme.rem(marginRem.top)
  }
}

// return depended on size styles and values
const getSizeStyles = (theme: Theme, size: 'big' | 'small' = 'big', showSearchIcon: boolean = true) => {
  const styles = getStyles(theme)
  const inactiveColor = theme.secondaryText
  const activeColor = theme.iconTappable
  const errorColor = theme.dangerText
  let fontSize = theme.rem(FONT_SIZE)
  let placeholderSpacerAdjust = theme.rem(2.25) - 1
  const placeholderScale = 0.7
  const placeholderSizeScale = 0.2
  let paddingVertical = theme.rem(PADDING_VERTICAL)
  let hintLeftMargin = -theme.rem(0.25)
  const inputStyles = [styles.input]
  const placeholderTextStyles = [styles.placeholderText]
  const placeholderPaddingStyles = [styles.placeholder]
  const placeholderSpacerPaddingStyles = [styles.placeholderSpacer]
  const inputContainerStyles = [styles.inputContainer]
  const prefixStyles = [styles.prefix]
  const suffixStyles = [styles.suffix]
  if (showSearchIcon) {
    placeholderPaddingStyles.push(styles.placeholderWithPrefix)
    hintLeftMargin = theme.rem(2.25)
  }
  if (size === 'small') {
    fontSize = theme.rem(FONT_SIZE_SMALL)
    paddingVertical = theme.rem(PADDING_VERTICAL_SMALL)
    placeholderSpacerAdjust = theme.rem(2)
    inputStyles.push(styles.inputSmall)
    placeholderTextStyles.push(styles.placeholderTextSmall)
    placeholderPaddingStyles.push(styles.placeholderSmall)
    placeholderSpacerPaddingStyles.push(styles.placeholderSpacerSmall)
    inputContainerStyles.push(styles.inputContainerSmall)
    prefixStyles.push(styles.prefixSmall)
    suffixStyles.push(styles.suffixSmall)
    hintLeftMargin = -theme.rem(0.5) + 1

    if (showSearchIcon) {
      placeholderPaddingStyles.push(styles.placeholderSmallWithPrefix)
      hintLeftMargin = theme.rem(1.75) - 1
    }
  }

  return {
    inactiveColor,
    activeColor,
    errorColor,
    fontSize,
    placeholderSpacerAdjust,
    placeholderScale,
    placeholderSizeScale,
    paddingVertical,
    inputStyles,
    placeholderTextStyles,
    placeholderPaddingStyles,
    placeholderSpacerPaddingStyles,
    inputContainerStyles,
    prefixStyles,
    suffixStyles,
    hintLeftMargin
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    borderBottomWidth: theme.thinLineWidth,
    borderLeftWidth: theme.thinLineWidth,
    borderRightWidth: theme.thinLineWidth,
    borderRadius: theme.rem(0.5),
    alignSelf: 'stretch',
    flexDirection: 'row',
    backgroundColor: 'transparent'
  },
  cornerLeft: {
    borderTopWidth: theme.thinLineWidth,
    borderLeftWidth: theme.thinLineWidth,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: theme.rem(0.5),
    borderBottomLeftRadius: theme.rem(0.5),
    position: 'absolute',
    left: -theme.thinLineWidth,
    top: -theme.thinLineWidth,
    width: theme.rem(1),
    height: '100%'
  },
  cornerRight: {
    borderTopWidth: theme.thinLineWidth,
    borderRightWidth: theme.thinLineWidth,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: theme.rem(0.5),
    borderBottomRightRadius: theme.rem(0.5),
    position: 'absolute',
    right: -theme.thinLineWidth,
    top: -theme.thinLineWidth,
    width: theme.rem(1),
    height: '100%'
  },
  inputContainer: {
    flex: 1,
    paddingVertical: theme.rem(PADDING_VERTICAL),
    paddingHorizontal: theme.rem(1),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  inputContainerSmall: {
    paddingVertical: theme.rem(PADDING_VERTICAL_SMALL),
    paddingHorizontal: theme.rem(0.75)
  },
  prefixPadding: {
    paddingLeft: theme.rem(2)
  },
  suffixPadding: {
    paddingRight: theme.rem(2)
  },
  input: {
    flex: 1,
    fontSize: theme.rem(FONT_SIZE),
    fontFamily: theme.fontFaceDefault,
    paddingVertical: 0,
    color: theme.primaryText
  },
  inputSmall: {
    fontSize: theme.rem(FONT_SIZE_SMALL)
  },
  prefixSmall: {
    marginRight: theme.rem(0.5)
  },
  suffixSmall: {
    marginLeft: theme.rem(0.5)
  },
  prefix: {
    marginRight: theme.rem(0.75)
  },
  suffix: {
    marginLeft: theme.rem(0.75)
  },
  placeholder: {
    position: 'absolute',
    top: theme.rem(PADDING_VERTICAL),
    left: theme.rem(1)
  },
  placeholderWithPrefix: {
    left: theme.rem(2.75)
  },
  placeholderSmall: {
    top: theme.rem(PADDING_VERTICAL_SMALL),
    left: theme.rem(0.75)
  },
  placeholderSmallWithPrefix: {
    left: theme.rem(2.25)
  },
  placeholderText: {
    fontSize: theme.rem(FONT_SIZE),
    fontFamily: theme.fontFaceDefault
  },
  placeholderTextSmall: {
    fontSize: theme.rem(FONT_SIZE_SMALL)
  },
  placeholderSpacer: {
    position: 'absolute',
    top: -theme.thinLineWidth,
    right: theme.rem(0.5),
    height: theme.thinLineWidth,
    width: '85%'
  },
  placeholderSpacerSmall: {
    right: theme.rem(0.625)
  },
  errorText: {
    position: 'absolute',
    color: theme.dangerText,
    fontSize: theme.rem(0.5),
    fontFamily: theme.fontFaceDefault,
    bottom: -theme.rem(0.5) - theme.rem(0.25),
    left: theme.rem(0.75)
  },
  clearContainer: {
    paddingTop: theme.rem(0.125)
  }
}))

const EdgeTextFieldOutlined = EdgeTextFieldOutlinedComponent
export { EdgeTextFieldOutlined }

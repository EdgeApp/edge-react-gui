// @flow

// $FlowFixMe = forwardRef is not recognize by flow?
import React, { forwardRef } from 'react'
import { Text, TextInput, TextInputProps, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native'
import Animated, { Extrapolate, interpolate, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import AntDesignIcon from 'react-native-vector-icons/AntDesign'

import { unpackEdges } from '../../util/edges'
import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from '../../util/hooks'
import { type Theme, cacheStyles, useTheme } from '../services/ThemeContext'

type InputOutlineProps = {
  label?: string,
  error?: string,

  marginRem?: number | number[],
  isClearable: boolean,
  small?: boolean,
  hideSearchIcon?: boolean,
  onClear: () => void,

  ...TextInputProps
}

type InputOutline = {
  focus: () => void,
  blur: () => void,
  isFocused: () => boolean,
  clear: () => void
}

const EdgeTextFieldOutlinedComponent = forwardRef((props: InputOutlineProps, ref) => {
  const {
    error,
    label: placeholder = '',
    isClearable,
    marginRem = 0.5,
    small,
    hideSearchIcon,
    onClear,
    onFocus,
    onBlur,

    value: _providedValue = '',
    onChangeText,
    ...inputProps
  } = props

  const [value, setValue] = useState(_providedValue)
  const [containerHeight, setContainerHeight] = useState(0)

  // animation
  const inputRef: { current: InputOutline } = useRef<TextInput>(null)
  const placeholderMap = useSharedValue(_providedValue ? 1 : 0)
  const placeholderSize = useSharedValue(0)
  const containerWidth = useSharedValue(0)
  const colorMap = useSharedValue(0)

  // input methods
  const focus = () => inputRef.current && inputRef.current.focus()
  const blur = () => inputRef.current && inputRef.current.blur()
  const isFocused = () => Boolean(inputRef.current && inputRef.current.isFocused())
  const clear = () => {
    Boolean(inputRef.current && inputRef.current.clear())
    setValue('')
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
    placeholderPaddingStyles,
    placeholderSpacerPaddingStyles,
    inputContainerStyles,
    prefixStyles,
    suffixStyles,
    hintLeftMargin
  } = getSizeStyles(theme, small, hideSearchIcon)

  const errorState = useCallback(() => error !== null && error !== undefined, [error])

  const handleFocus = () => {
    placeholderMap.value = withTiming(1) // focused
    if (!errorState()) colorMap.value = withTiming(1) // active
    focus()
    if (onFocus) onFocus()
  }

  const handleBlur = () => {
    if (!value) placeholderMap.value = withTiming(0) // blur
    if (!errorState()) colorMap.value = withTiming(0) // inactive
    blur()
    if (onBlur) onBlur()
  }

  const handleChangeText = (text: string) => {
    onChangeText && onChangeText(text)
    setValue(text)
  }

  const clearText = () => {
    clear()
    onClear()
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

  // handle value update
  useEffect(() => {
    if (_providedValue.length) placeholderMap.value = withTiming(1) // focused;
    setValue(_providedValue)
  }, [_providedValue, placeholderMap])
  // error handling
  useEffect(() => {
    if (errorState()) {
      colorMap.value = 2 // error -- no animation here, snap to color immediately
    } else {
      colorMap.value = isFocused() ? 1 : 0 // to active or inactive color if focused
    }
  }, [error, colorMap, errorState])

  const animatedPlaceholderStyles = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(placeholderMap.value, [0, 1], [0, -(paddingVertical + fontSize * placeholderScale)])
      },
      {
        scale: interpolate(placeholderMap.value, [0, 1], [1, placeholderScale])
      },
      {
        translateX: interpolate(placeholderMap.value, [0, 1], [0, -placeholderSize.value * placeholderSizeScale - hintLeftMargin])
      }
    ]
  }))

  const animatedPlaceholderTextStyles = useAnimatedStyle(() => ({
    color: interpolateColor(colorMap.value, [0, 1, 2], [inactiveColor, activeColor, errorColor])
  }))

  const animatedPlaceholderSpacerStyles = useAnimatedStyle(() => ({
    width: interpolate(
      placeholderMap.value,
      [0, 1],
      [containerWidth.value - placeholderSpacerWidthAdjust, containerWidth.value - placeholderSize.value * placeholderScale - placeholderSpacerAdjust],
      Extrapolate.CLAMP
    ),
    backgroundColor: placeholderSize.value > 0 ? interpolateColor(colorMap.value, [0, 1, 2], [inactiveColor, activeColor, errorColor]) : inactiveColor
  }))
  const cornerHeight = { height: containerHeight }

  const animatedContainerStyle = useAnimatedStyle(() => {
    const color = placeholderSize.value > 0 ? interpolateColor(colorMap.value, [0, 1, 2], [inactiveColor, activeColor, errorColor]) : inactiveColor
    return {
      borderBottomColor: color,
      borderLeftColor: color,
      borderRightColor: color
    }
  })
  const animatedLeftCornerStyle = useAnimatedStyle(() => {
    const color = placeholderSize.value > 0 ? interpolateColor(colorMap.value, [0, 1, 2], [inactiveColor, activeColor, errorColor]) : inactiveColor
    return {
      borderTopColor: color,
      borderLeftColor: color
    }
  })
  const animatedRightCornerStyle = useAnimatedStyle(() => {
    const color = placeholderSize.value > 0 ? interpolateColor(colorMap.value, [0, 1, 2], [inactiveColor, activeColor, errorColor]) : inactiveColor
    return {
      borderTopColor: color,
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
      <Animated.View style={[styles.cornerLeft, cornerHeight, animatedLeftCornerStyle]} />
      <Animated.View style={[styles.cornerRight, cornerHeight, animatedRightCornerStyle]} />
      <TouchableWithoutFeedback onPress={handleFocus}>
        <View style={inputContainerStyles}>
          {hideSearchIcon ? null : (
            <View style={prefixStyles}>
              <AntDesignIcon name="search1" color={theme.iconDeactivated} size={theme.rem(1)} />
            </View>
          )}
          <TextInput
            {...inputProps}
            ref={inputRef}
            style={styles.input}
            pointerEvents="none"
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
        <Animated.Text style={[styles.placeholderText, animatedPlaceholderTextStyles]}>{placeholder}</Animated.Text>
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
const getSizeStyles = (theme: Theme, small: boolean = false, hideSearchIcon: boolean = false) => {
  const styles = getStyles(theme)
  const inactiveColor = theme.secondaryText
  const activeColor = theme.iconTappable
  const errorColor = theme.dangerText
  const fontSize = theme.rem(1)
  let placeholderSpacerAdjust = theme.rem(2.25) - 1
  const placeholderScale = 0.7
  const placeholderSizeScale = 0.2
  let paddingVertical = theme.rem(1)
  let hintLeftMargin = -theme.rem(0.25)
  const placeholderPaddingStyles = [styles.placeholder]
  const placeholderSpacerPaddingStyles = [styles.placeholderSpacer]
  const inputContainerStyles = [styles.inputContainer]
  const prefixStyles = [styles.prefix]
  const suffixStyles = [styles.suffix]
  if (!hideSearchIcon) {
    placeholderPaddingStyles.push(styles.placeholderWithPrefix)
    hintLeftMargin = theme.rem(2.25)
  }
  if (small) {
    paddingVertical = theme.rem(0.5)
    placeholderSpacerAdjust = theme.rem(2)
    placeholderPaddingStyles.push(styles.placeholderSmall)
    placeholderSpacerPaddingStyles.push(styles.placeholderSpacerSmall)
    inputContainerStyles.push(styles.inputContainerSmall)
    prefixStyles.push(styles.prefixSmall)
    suffixStyles.push(styles.suffixSmall)
    hintLeftMargin = -theme.rem(0.5) + 1

    if (!hideSearchIcon) {
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
    borderTopLeftRadius: theme.rem(0.5),
    borderBottomLeftRadius: theme.rem(0.5),
    position: 'absolute',
    left: -1,
    top: -1,
    width: theme.rem(1),
    height: '100%'
  },
  cornerRight: {
    borderTopWidth: theme.thinLineWidth,
    borderRightWidth: theme.thinLineWidth,
    borderTopRightRadius: theme.rem(0.5),
    borderBottomRightRadius: theme.rem(0.5),
    position: 'absolute',
    right: -1,
    top: -1,
    width: theme.rem(1),
    height: '100%'
  },
  inputContainer: {
    flex: 1,
    paddingVertical: theme.rem(1),
    paddingHorizontal: theme.rem(1),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  inputContainerSmall: {
    paddingVertical: theme.rem(0.5),
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
    fontSize: theme.rem(1),
    fontFamily: theme.fontFaceDefault,
    color: theme.primaryText
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
    top: theme.rem(1),
    left: theme.rem(1)
  },
  placeholderWithPrefix: {
    left: theme.rem(2.75)
  },
  placeholderSmall: {
    top: theme.rem(0.5),
    left: theme.rem(0.75)
  },
  placeholderSmallWithPrefix: {
    left: theme.rem(2.25)
  },
  placeholderText: {
    fontSize: theme.rem(1),
    fontFamily: theme.fontFaceDefault
  },
  placeholderSpacer: {
    position: 'absolute',
    top: -1,
    right: theme.rem(0.5),
    backgroundColor: 'red',
    height: theme.thinLineWidth,
    width: '85%'
  },
  placeholderSpacerSmall: {
    right: theme.rem(0.5)
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

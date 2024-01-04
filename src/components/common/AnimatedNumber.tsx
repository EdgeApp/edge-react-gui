import React from 'react'
import { LayoutChangeEvent, Text, TextStyle, View, ViewStyle } from 'react-native'
import Animated, { Easing, EasingFunction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'

import { useHandler } from '../../hooks/useHandler'

const ANIMATION_DURATION_DEFAULT = 1000
const NUMBERS = Array(10)
  .fill(0)
  .map((_, i) => i)

export interface AnimatedNumberProps {
  numberString: string
  animationDuration?: number
  textStyle?: TextStyle
  easing?: EasingFunction
  style?: ViewStyle
}

export const AnimatedNumber = (props: AnimatedNumberProps): JSX.Element => {
  const { numberString, textStyle, animationDuration = ANIMATION_DURATION_DEFAULT, easing = Easing.inOut(Easing.quad), style } = props
  const animateToNumbersArr: string[] = Array.from(numberString, String)
  const [digitHeight, setDigitHeight] = React.useState(0)

  const handleDigitLayout = useHandler((event: LayoutChangeEvent) => {
    setDigitHeight(event.nativeEvent.layout.height)
  })

  return (
    <>
      {digitHeight !== 0 ? (
        <View style={[style, { flexDirection: 'row' }]}>
          {animateToNumbersArr.map((n, index) => {
            return (
              <AnimatedDigit
                animationDuration={animationDuration}
                key={index}
                index={index}
                easing={easing}
                textStyle={textStyle}
                digit={n}
                numberHeight={digitHeight}
              />
            )
          })}
        </View>
      ) : (
        <Text style={[textStyle, { position: 'absolute', top: -999999 }]} onLayout={handleDigitLayout}>
          0
        </Text>
      )}
    </>
  )
}

function isIntegerDigit(str: string) {
  // Use parseInt with radix 10 to convert the string to an integer.
  // If it's a valid integer, the result will not be NaN.
  if (str.length !== 1) throw new Error('isIntegerDigit requires string length=1')
  return !isNaN(parseInt(str, 10))
}

interface AnimatedDigitProps {
  index: number
  digit: string
  animationDuration: number
  easing: EasingFunction
  textStyle?: TextStyle
  numberHeight: number
}

const AnimatedDigit = (props: AnimatedDigitProps): JSX.Element => {
  const { animationDuration, digit, easing, textStyle, index, numberHeight } = props
  const animY = useSharedValue(0)

  if (!isIntegerDigit(digit)) {
    animY.value = withTiming(0, { duration: animationDuration, easing })
  } else {
    const height = -1 * (numberHeight * Number(digit))
    animY.value = withTiming(height, { duration: animationDuration, easing })
  }

  const animStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: animY.value
        }
      ]
    }
  })
  if (!isIntegerDigit(digit)) {
    return (
      <Text key={index} style={[textStyle, { height: numberHeight }]}>
        {digit}
      </Text>
    )
  }

  return (
    <View key={index} style={{ height: numberHeight, overflow: 'hidden' }}>
      <Animated.View style={animStyle}>
        {NUMBERS.map(number => (
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }} key={number}>
            <Text style={[textStyle, { height: numberHeight }]}>{number}</Text>
          </View>
        ))}
      </Animated.View>
    </View>
  )
}

/* eslint-disable no-new */
/* eslint-disable react-native/no-color-literals */
// @flow

import * as React from 'react'
import { View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Animated, {
  createAnimatedPropAdapter,
  Easing,
  measure,
  useAnimatedProps,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  useValue,
  withTiming
} from 'react-native-reanimated'
import Svg, { Circle, ClipPath, Defs, G, Rect, Use } from 'react-native-svg'

import { useLayout } from '../../hooks/useLayout'
import { styles } from '../../modules/UI/components/Buttons/style'
import { memo, useEffect, useMemo, useRef, useState } from '../../types/reactHooks'
import { type TempActionDisplayInfo } from '../../types/types'
import { type Theme, type ThemeProps, cacheStyles, useTheme, withTheme } from '../services/ThemeContext'
import { EdgeText } from '../themed/EdgeText'

const AnimatedRect = Animated.createAnimatedComponent(Rect)
const AnimatedNode = (props: { size: number, status: 'pending' | 'active' | 'complete' }) => {
  const { size, status } = props
  const theme = useTheme()

  // Calculate circle params based on size
  const radius = Math.floor(size / 2)
  const svgSize = size
  const viewBox = `0 0 ${svgSize} ${svgSize}`
  const center = size / 2

  const sAnimationMult = useValue(0)
  useEffect(() => {
    sAnimationMult.value = withTiming(status === 'pending' ? 0 : status === 'active' ? 0.5 : 1, {
      duration: 1000,
      easing: Easing.inOut(Easing.circle)
    })
  }, [sAnimationMult, status])

  useEffect(() => {
    console.log('\x1b[34m\x1b[43m' + `sAnimationMult.value: ${JSON.stringify(sAnimationMult.value, null, 2)}` + '\x1b[0m')
  }, [sAnimationMult])

  const fillStyle = useAnimatedStyle(() => ({
    height: sAnimationMult.value * svgSize
  }))

  // useEffect(() => {
  //   'worklet'
  //   setTest(aRef.current?.height)
  //   // console.log('\x1b[34m\x1b[43m' + `aRef.current: ${JSON.stringify(aRef.current.props, null, 2)}` + '\x1b[0m')
  // }, [])

  const aref = useAnimatedRef()
  const [test, setTest] = useState()
  useDerivedValue(() => {
    'worklet'
    try {
      if (aref && aref.current) {
        aref.current.measure((x, y, width, height, pageX, pageY) => {
          if (height) setTest(height)
        })
      }
    } catch (_) {}
    // ...
  }, [aref])

  useEffect(() => {
    console.log('\x1b[34m\x1b[43m' + `test: ${JSON.stringify(test, null, 2)}` + '\x1b[0m')
  }, [test])

  // const test = new Promise((resolve, reject) => {
  //   if (aref && aref.current) {
  //     aref.current.measure((x, y, width, height, pageX, pageY) => {
  //       resolve({ x, y, width, height, pageX, pageY })
  //     })
  //   } else {
  //     reject(new Error('measure: animated ref not ready'))
  //   }
  // })

  return (
    <View style={{ backgroundColor: test === 1 ? 'red' : undefined }}>
      <Svg width={svgSize} height={svgSize} viewBox={viewBox} preserveAspectRatio="false" zIndex={3}>
        <Circle id="circle" cx={center} cy={center} r={radius} strokeWidth="0" fill={theme.deactivatedText} />
        <Circle
          id="circle"
          cx={center}
          cy={center}
          r={radius}
          strokeWidth="0"
          strokeColor={theme.iconTappable}
          fill={theme.iconTappable}
          clipPath="url(#clip)"
        />

        <Defs>
          <ClipPath id="clip">
            <AnimatedRect id="rect" cx={center} cy={center} x="0" y="0" width={svgSize} height={0} animatedProps={fillStyle} ref={aref} />
          </ClipPath>
        </Defs>
      </Svg>
    </View>
  )
}

// -----------------------------------------------------------------------------
// A StepProgressRow consists of a left node + segment, right title text, and
// right body text.
// A collection of StepProgressRows makes up a StepProgressBar component.
// -----------------------------------------------------------------------------
const StepProgressRowComponent = ({
  isLast,
  status,
  stepText
}: {
  isLast: boolean,
  status: 'pending' | 'active' | 'complete',
  stepText: { title: string, message: string }
}) => {
  const theme = useTheme()
  const styles = getStyles(theme)
  const isComplete = status === 'complete'
  const isActive = status === 'active'

  const [segmentLayout, handleSegmentLayout] = useLayout()
  const maxSegmentHeight = useSharedValue(0)
  useEffect(() => {
    if (segmentLayout.height > 0) maxSegmentHeight.value = segmentLayout.height
  }, [maxSegmentHeight, segmentLayout.height])

  const aLineFill = useAnimatedStyle(() => ({
    height: withTiming(isComplete ? maxSegmentHeight.value + 10 : 0, {
      duration: 500,
      easing: Easing.inOut(Easing.circle)
    })
  }))

  // Render connecting segment lines between the bottom of this node and the
  // top of the next node (omitting if this is the last node).

  // Segment line animation
  const pendingSegment = <View style={styles.lineQueued} onLayout={handleSegmentLayout} />
  const fillSegment = <Animated.View style={[styles.lineCompleted, aLineFill]} />
  // #endregion

  // Combine the node+segment on the left with the text elements on the right
  // into a completed StepProgressRow
  const titleStyle = isComplete || isActive ? styles.textTitleActive : styles.textTitleDisabled
  const bodyStyle = isComplete || isActive ? styles.textBodyActive : styles.textBodyDisabled

  return (
    <View style={styles.actionRow}>
      <View style={styles.columnContainer}>
        <AnimatedNode size={theme.rem(1)} status={status} />
        {pendingSegment}
        {fillSegment}
      </View>
      <View style={styles.childContainer}>
        <EdgeText style={titleStyle} numberOfLines={3}>
          {stepText.title}
        </EdgeText>

        <EdgeText style={bodyStyle} numberOfLines={100}>
          {stepText.message}
        </EdgeText>
      </View>
    </View>
  )
}

const StepProgressRow = memo(StepProgressRowComponent)

// -----------------------------------------------------------------------------
// StepProgressBar visualizes the completed, active, and pending steps with a
// variably shaded/highlighted vertical step progress bar column on the left,
// accompanied by messages describing the steps are drawn on the right.
//
// StepProgressBar is a collection of StepProgressRows.
// -----------------------------------------------------------------------------
const StepProgressBarComponent = (props: { actionDisplayInfos: TempActionDisplayInfo[] }) => {
  // completedSteps of -1 will gray out all steps, while 0 will highlight the
  // first step
  const { actionDisplayInfos, ...containerProps } = props
  const totalSteps = actionDisplayInfos.length

  const theme = useTheme()
  const styles = getStyles(theme)

  // Render nodes and their connecting segments, starting from the top
  const actionRows = []
  for (let i = 0; i < totalSteps; i++) {
    // Render a completed, active/in-progress, or queued node.
    // Active/in-progress nodes are partially filled while queued or completed
    // nodes are solid filled.
    const isLast = totalSteps <= 1 || i >= totalSteps - 1

    actionRows.push(
      <StepProgressRow
        status={actionDisplayInfos[i].status}
        isLast={isLast}
        stepText={{ title: actionDisplayInfos[i].title, message: actionDisplayInfos[i].message }}
        key={i}
      />
    )
  }

  return <View {...containerProps}>{actionRows}</View>
}

const getStyles = cacheStyles((theme: Theme) => {
  const circleCommon = {
    width: theme.rem(1),
    height: theme.rem(1),
    zIndex: 2,
    position: 'absolute'
  }

  // Lines are rendered underneath the circles' layer, to hide the y overlap
  // (negative margin) necessary in the styling.
  const lineCommon = {
    width: theme.rem(0.25)
    // width: theme.rem(1)
  }

  return {
    childContainer: {
      flexDirection: 'column',
      marginBottom: theme.rem(1.5),
      flexShrink: 1
    },
    columnContainer: {
      alignItems: 'center',
      flexDirection: 'column',
      marginRight: theme.rem(1.5)
    },
    actionRow: {
      alignItems: 'flex-start',
      flexDirection: 'row'
    },
    circleCommon: {
      ...circleCommon
    },
    circleQueued: {
      ...circleCommon,
      backgroundColor: theme.deactivatedText
    },
    circleCompleted: {
      ...circleCommon,
      backgroundColor: theme.iconTappable
    },
    lineQueued: {
      ...lineCommon,
      backgroundColor: theme.deactivatedText,
      zIndex: 1,
      position: 'absolute',
      height: '100%',
      marginTop: theme.rem(0.5)
    },
    lineCompleted: {
      ...lineCommon,
      backgroundColor: theme.iconTappable,
      zIndex: 5,
      marginTop: theme.rem(0.5),
      position: 'absolute'
      // borderColor: 'red',
      // borderWidth: 1
    },
    textBodyActive: {
      fontSize: theme.rem(0.75)
    },
    textTitleActive: {
      fontFamily: theme.fontFaceBold,
      marginBottom: theme.rem(0.5)
    },
    textBodyDisabled: {
      color: theme.deactivatedText,
      fontSize: theme.rem(0.75)
    },
    textTitleDisabled: {
      color: theme.deactivatedText,
      fontFamily: theme.fontFaceBold,
      marginBottom: theme.rem(0.5)
    }
  }
})

export const StepProgressBar = memo(StepProgressBarComponent)

import * as React from 'react'
import { type DimensionValue, View } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from 'react-native-reanimated'

import { useHandler } from '../../hooks/useHandler'
import { useLayout } from '../../hooks/useLayout'
import { styled } from '../hoc/styled'
import { useTheme } from '../services/ThemeContext'

interface Props {
  /** Whether the component is shown (rendered). Default: true */
  isShown?: boolean

  /** Number of characters to represent in size for the shimmer. */
  characters?: number

  /** Number of lines to represent in size for the shimmer. */
  lines?: number
}

export const ShimmerText: React.FC<Props> = (props: Props) => {
  const { isShown = true, characters, lines = 1 } = props
  const theme = useTheme()

  const containerHeight: DimensionValue = React.useMemo(
    () => theme.rem(lines * 1.5),
    [lines, theme]
  )
  const containerWidth: DimensionValue = React.useMemo(
    () =>
      characters != null
        ? characters * theme.rem(0.75)
        : ((Math.floor(Math.random() * 80) + 20 + '%') as DimensionValue),
    [characters, theme]
  )

  const [containerLayout, handleContainerLayout] = useLayout()
  const containerLayoutWidth = containerLayout.width
  const gradientWidth = containerLayoutWidth * 6

  const offset = useSharedValue(0)

  const startAnimation = useHandler(() => {
    const duration = 2000
    const startPosition = -gradientWidth
    const endPosition = containerLayoutWidth
    offset.value = startPosition
    offset.value = withRepeat(
      withSequence(
        withTiming(startPosition, { duration: duration / 2 }),
        withTiming(endPosition, { duration })
      ),
      -1,
      false
    )
  })

  React.useEffect(() => {
    if (gradientWidth > 0) startAnimation()
  }, [startAnimation, gradientWidth])

  return isShown ? (
    <ContainerView
      width={containerWidth}
      height={containerHeight}
      onLayout={handleContainerLayout}
    >
      <Shimmer width={gradientWidth} offset={offset}>
        <Gradient
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          colors={['rgba(0,0,0,0)', theme.shimmerBackgroundHighlight]}
        />
        <Gradient
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          colors={['rgba(0,0,0,0)', theme.shimmerBackgroundHighlight]}
        />
      </Shimmer>
    </ContainerView>
  ) : null
}

/**
 * This is the track of the component that contains a gradient that overflows
 * in width.
 */
const ContainerView = styled(View)<{
  width: DimensionValue
  height: DimensionValue
}>(theme => props => ({
  width: props.width,
  maxWidth: '100%',
  height: props.height,
  borderRadius: theme.rem(0.25),
  backgroundColor: theme.shimmerBackgroundColor,
  overflow: 'hidden'
}))

/**
 * This is the animated view that within the {@link ContainerView}. It animates
 * by an offset value which represents the horizontal position of the shimmer.
 */
const Shimmer = styled(Animated.View)<{
  width: DimensionValue
  offset: SharedValue<number>
}>(_ => props => [
  {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'row',
    width: props.width
  },
  useAnimatedStyle(() => ({
    transform: [{ translateX: props.offset.value }]
  }))
])

/**
 * This is gradient nested within the {@link Shimmer}.
 */
const Gradient = styled(LinearGradient)({
  flex: 1,
  width: '100%',
  height: '100%'
})

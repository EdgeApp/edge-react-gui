import React, { useState } from 'react'
import { View } from 'react-native'
import Carousel, { Pagination } from 'react-native-snap-carousel'

import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

interface Props {
  children: React.ReactNode
  height: number
  width: number
}

const DOT_SIZE_REM = 0.5

/**
 * A horizontal carousel with pagination dots
 */
export const CarouselUi4 = (props: Props) => {
  const { children, height, width } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const nonNullChildren = React.Children.toArray(children).filter(child => child != null && React.isValidElement(child))
  const numChildren = nonNullChildren.length

  const [activeIndex, setActiveIndex] = useState(0)

  const renderItem = ({ item }: { item: React.ReactNode }) => <View style={[styles.childContainer, { width: width * 0.9, height }]}>{item}</View>

  if (children == null || numChildren === 0) return null

  return (
    <>
      <Carousel
        data={nonNullChildren}
        renderItem={renderItem}
        sliderWidth={width}
        itemWidth={width * 0.84}
        onSnapToItem={(index: React.SetStateAction<number>) => {
          setActiveIndex(index)
        }}
        enableSnap
        activeSlideAlignment="center"
        inactiveSlideScale={0.9}
        inactiveSlideOpacity={0.7}
        lockScrollWhileSnapping
      />
      <Pagination
        dotContainerStyle={{ marginTop: -theme.rem(2) }}
        dotsLength={numChildren}
        activeDotIndex={activeIndex}
        tappableDots
        dotStyle={styles.dotStyle}
        inactiveDotOpacity={0.4}
        inactiveDotScale={0.7}
      />
    </>
  )
}

const getStyles = cacheStyles((theme: Theme) => ({
  childContainer: {
    alignSelf: 'center'
  },
  dotStyle: {
    width: theme.rem(DOT_SIZE_REM),
    height: theme.rem(DOT_SIZE_REM),
    borderRadius: theme.rem(DOT_SIZE_REM) / 2,
    backgroundColor: theme.primaryText
  }
}))

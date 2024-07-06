import React, { useState } from 'react'
import { ListRenderItem, View } from 'react-native'
import Carousel, { Pagination } from 'react-native-snap-carousel'

import { useHandler } from '../../hooks/useHandler'
import { cacheStyles, Theme, useTheme } from '../services/ThemeContext'

interface Props<T> {
  data: T[]
  keyExtractor?: (item: T) => string
  renderItem: ListRenderItem<T>

  height: number
  width: number
}

const DOT_SIZE_REM = 0.5

/**
 * A horizontal carousel with pagination dots
 */
export function EdgeCarousel<T>(props: Props<T>): JSX.Element {
  const { data, keyExtractor, height, width } = props
  const theme = useTheme()
  const styles = getStyles(theme)

  const carouselRef = React.useRef(null)

  const [activeIndex, setActiveIndex] = useState(0)

  const renderItem = useHandler<ListRenderItem<T>>(info => (
    <View style={[styles.childContainer, { width: width * 0.9, height }]}>{props.renderItem(info)}</View>
  ))

  return (
    <View style={styles.carouselContainer}>
      <Carousel
        ref={carouselRef}
        data={data}
        keyExtractor={keyExtractor}
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
        carouselRef={carouselRef.current ?? undefined}
        containerStyle={{
          marginTop: -theme.rem(1),
          marginBottom: -theme.rem(1)
        }}
        dotsLength={data.length}
        activeDotIndex={activeIndex}
        tappableDots={carouselRef.current != null}
        dotStyle={styles.dotStyle}
        inactiveDotOpacity={0.4}
        inactiveDotScale={0.7}
      />
    </View>
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
  },
  carouselContainer: {
    left: theme.rem(-0.5) // Need to fudge this to cancel out the scene's padding
  }
}))

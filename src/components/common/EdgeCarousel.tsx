import React, { useState } from 'react'
import { InteractionManager, ListRenderItem, Platform, View } from 'react-native'
import Carousel, { Pagination } from 'react-native-snap-carousel'

import { useAsyncEffect } from '../../hooks/useAsyncEffect'
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

  const carouselRef = React.useRef<Carousel<any>>(null)

  const [activeIndex, setActiveIndex] = useState(0)
  const [dataLocal, setDataLocal] = useState(data)

  const renderItem = useHandler<ListRenderItem<T>>(info => (
    <View style={[styles.childContainer, { width: width * 0.9, height }]}>{props.renderItem(info)}</View>
  ))

  /**
   * Carousel's FlatList bug workaround. Fixes the issue where items are
   * hidden until scroll actions are performed either in the carousel or on the
   * scene itself.
   */
  useAsyncEffect(
    async () => {
      // HACK: With 1 item, this is the only way to force a render in iOS
      if (Platform.OS === 'ios' && data.length === 1) {
        setDataLocal([])
        setTimeout(() => {
          setDataLocal(data)
        }, 500)
      }
      // The built-in hack fn works for all other cases
      else if (carouselRef.current != null) {
        await InteractionManager.runAfterInteractions(() => {
          carouselRef.current?.triggerRenderingHack()
        })
      }
    },
    [],
    'triggerRenderingHack'
  )

  return (
    <View style={styles.carouselContainer}>
      <Carousel
        ref={carouselRef}
        data={dataLocal}
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
        dotsLength={dataLocal.length}
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

import type { ContentPost } from 'edge-info-server'
import React from 'react'
import { useSafeAreaFrame } from 'react-native-safe-area-context'

import { useHandler } from '../../hooks/useHandler'
import { type CarouselRenderItem, EdgeCarousel } from '../common/EdgeCarousel'
import { useTheme } from '../services/ThemeContext'
import { ContentPostCard } from './ContentPostCard'

export interface Props {
  contentPosts: ContentPost[]
}

/**
 * Renders a carousel of ContentPosts using the info server data.
 */
export const ContentPostCarousel: React.FC<Props> = props => {
  const { contentPosts } = props
  const theme = useTheme()
  const { width } = useSafeAreaFrame()

  const keyExtractor = useHandler((_, index: number) => String(index))

  const renderItem: CarouselRenderItem<ContentPost> = useHandler(item => (
    <ContentPostCard contentPost={item} />
  ))

  return (
    <EdgeCarousel
      data={contentPosts}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      itemHeight={theme.rem(13)}
      itemWidth={width - theme.rem(2)}
    />
  )
}

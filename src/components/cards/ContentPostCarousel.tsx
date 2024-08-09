import { ContentPost } from 'edge-info-server'
import React from 'react'
import { ListRenderItem } from 'react-native'
import { useSafeAreaFrame } from 'react-native-safe-area-context'

import { useHandler } from '../../hooks/useHandler'
import { EdgeCarousel } from '../common/EdgeCarousel'
import { useTheme } from '../services/ThemeContext'
import { ContentPostCard } from './ContentPostCard'

export interface Props {
  contentPosts: ContentPost[]
}

/**
 * Renders a carousel of ContentPosts using the info server data.
 */
export const ContentPostCarousel = (props: Props) => {
  const { contentPosts } = props
  const { width } = useSafeAreaFrame()
  const theme = useTheme()

  const renderContentPost: ListRenderItem<ContentPost> = useHandler(({ item }) => <ContentPostCard contentPost={item} />)

  return <EdgeCarousel data={contentPosts} renderItem={renderContentPost} height={theme.rem(13)} width={width} />
}

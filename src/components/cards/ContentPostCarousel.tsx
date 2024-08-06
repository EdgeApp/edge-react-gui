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
  countryCode?: string
}

/**
 * Filters a list of ContentPosts based on the provided country code.
 *
 * @param contentPosts - An array of `ContentPost` objects representing the
 * content posts to filter.
 * @param countryCode - An optional string representing the country code to filter by. If `null`, an empty array is returned.
 * @returns An array of `ContentPost` objects that match the provided country code.
 */
export const filterContentPosts = (contentPosts: ContentPost[], countryCode?: string) => {
  return contentPosts.filter((contentPost: ContentPost) => {
    const { countryCodes: includeCountryCodes = [], excludeCountryCodes = [] } = contentPost

    const isCountryInclude =
      includeCountryCodes.length === 0 ||
      (countryCode != null && includeCountryCodes.some(includeCountryCode => includeCountryCode.toUpperCase() === countryCode.toUpperCase()))
    const isCountryExclude =
      excludeCountryCodes.length > 0 &&
      (countryCode == null || excludeCountryCodes.some(excludeCountryCode => excludeCountryCode.toUpperCase() === countryCode.toUpperCase()))

    return isCountryInclude && !isCountryExclude
  })
}

/**
 * Renders a carousel of ContentPosts using the info server data.
 */
export const ContentPostCarousel = (props: Props) => {
  const { contentPosts, countryCode } = props
  const { width } = useSafeAreaFrame()
  const theme = useTheme()

  const filteredContentPosts = filterContentPosts(contentPosts, countryCode)

  const renderContentPost: ListRenderItem<ContentPost> = useHandler(({ item }) => <ContentPostCard contentPost={item} />)

  return <EdgeCarousel data={filteredContentPosts} renderItem={renderContentPost} height={theme.rem(13)} width={width} />
}

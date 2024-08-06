import { ContentPost } from 'edge-info-server'
import React from 'react'
import { ListRenderItem } from 'react-native'
import { useSafeAreaFrame } from 'react-native-safe-area-context'

import { useHandler } from '../../hooks/useHandler'
import { infoServerData } from '../../util/network'
import { EdgeCarousel } from '../common/EdgeCarousel'
import { useTheme } from '../services/ThemeContext'
import { ContentPostCard } from './ContentPostCard'

export interface Props {
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
  const { countryCode } = props
  const { width } = useSafeAreaFrame()
  const theme = useTheme()

  const [contentPosts, setContentPosts] = React.useState<ContentPost[]>([])

  const renderContentPost: ListRenderItem<ContentPost> = useHandler(({ item }) => <ContentPostCard contentPost={item} />)

  // Check for BlogCards from info server:
  React.useEffect(() => {
    const filteredBlogPostsGeo = filterContentPosts(infoServerData.rollup?.blogPostsGeo ?? [], countryCode)

    // Legacy non-geographic-specific blog posts:
    const nonGeoPosts = (infoServerData.rollup?.blogPosts ?? []).map(legacyBlogPost => ({
      countryCodes: [],
      excludeCountryCodes: [],
      ...legacyBlogPost
    }))

    setContentPosts([...nonGeoPosts, ...filteredBlogPostsGeo])
  }, [countryCode])

  return <EdgeCarousel data={contentPosts} renderItem={renderContentPost} height={theme.rem(13)} width={width} />
}

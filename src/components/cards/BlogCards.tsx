import { BlogPost, BlogPostGeo } from 'edge-info-server'
import React from 'react'
import { ListRenderItem } from 'react-native'
import { useSafeAreaFrame } from 'react-native-safe-area-context'

import { useHandler } from '../../hooks/useHandler'
import { infoServerData } from '../../util/network'
import { EdgeCarousel } from '../common/EdgeCarousel'
import { useTheme } from '../services/ThemeContext'
import { BlogCard } from './BlogCard'

export interface Props {
  countryCode?: string
}

/**
 * Filters a list of blog posts based on the provided country code.
 *
 * @param cards - An array of `BlogPostGeo` objects representing the blog posts to filter.
 * @param countryCode - An optional string representing the country code to filter by. If `null`, an empty array is returned.
 * @returns An array of `BlogPostGeo` objects that match the provided country code.
 */
export const filterBlogCards = (cards: BlogPostGeo[], countryCode?: string) => {
  return cards.filter((blog: BlogPostGeo) => {
    const { countryCodes: includeCountryCodes = [], excludeCountryCodes = [] } = blog

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
 * Renders a carousel of blog cards using the provided blog post data.
 *
 * @param props - The component props, including the country code to filter blog posts.
 * @returns A React element representing the blog cards carousel.
 */
export const BlogCards = (props: Props) => {
  const { countryCode } = props
  const { width } = useSafeAreaFrame()
  const theme = useTheme()

  const [blogCards, setBlogCards] = React.useState<BlogPost[]>([])

  const renderBlog: ListRenderItem<BlogPost> = useHandler(({ item }) => <BlogCard blogPost={item} />)

  // Check for BlogCards from info server:
  React.useEffect(() => {
    const filteredBlogPostsGeo = filterBlogCards(infoServerData.rollup?.blogPostsGeo ?? [], countryCode)

    setBlogCards([...(infoServerData.rollup?.blogPosts ?? []), ...filteredBlogPostsGeo])
  }, [countryCode])

  return <EdgeCarousel data={blogCards} renderItem={renderBlog} height={theme.rem(13)} width={width} />
}

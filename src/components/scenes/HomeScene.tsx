import { ContentPost } from 'edge-info-server'

import { EdgeSceneProps } from '../../types/routerTypes'

interface Props extends EdgeTabsSceneProps<'home'> {}

/**
 * Filters a list of ContentPosts based on the provided country code.
 *
 * @param contentPosts - An array of `ContentPost` objects representing the
 * content posts to filter.
 * @param countryCode - An optional string representing the country code to filter by. If `null`, an empty array is returned.
 * @returns An array of `ContentPost` objects that match the provided country code.
 */
export const filterContentPosts = (contentPosts?: ContentPost[], countryCode?: string): ContentPost[] => {
  if (contentPosts == null) return []
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

export const HomeScene = (props: Props) => {
  return null
}

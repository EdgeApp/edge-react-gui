import { describe, expect, it } from '@jest/globals'
import { asBlogPostsGeo, BlogPostGeo } from 'edge-info-server'

import { filterBlogCards } from '../../../components/cards/BlogCards'

describe('filterBlogCards', () => {
  const dummyData: BlogPostGeo = {
    localeTitle: {
      en: 'Title'
    },
    localeBody: {
      en: 'My blog body text'
    },
    localeBlogUrl: {
      en: 'https://edge.app/whatisthorchain'
    },
    lightImageUrl: 'https://edge.app/images/tc-dark.png',
    darkImageUrl: 'https://edge.app/images/tc-light.png',
    countryCodes: [],
    excludeCountryCodes: []
  }

  it('should return all cards if no countryCode provided in the data', () => {
    expect(filterBlogCards(asBlogPostsGeo([dummyData, dummyData]), 'US').length).toBe(2)
  })

  it('should return all cards if no countryCode provided in the data and device country', () => {
    expect(filterBlogCards(asBlogPostsGeo([dummyData, dummyData])).length).toBe(2)
  })

  it('should return all cards if countryCodes/excludeCountryCodes not defined in data', () => {
    const cards = asBlogPostsGeo([dummyData, dummyData])
    const filtered = filterBlogCards(cards, 'US')
    expect(filtered.length).toBe(2)
  })

  it('should filter cards by countryCode match on includeCountryCodes', () => {
    const cards = asBlogPostsGeo([
      { ...dummyData, countryCodes: ['US'] },
      { ...dummyData, countryCodes: ['CA'] }
    ])
    const filtered = filterBlogCards(cards, 'US')
    expect(filtered.length).toBe(1)
    expect(filtered[0].countryCodes).toEqual(['US'])
  })

  it('should exclude cards matching countryCode in excludeCountryCodes', () => {
    const cards = asBlogPostsGeo([
      { ...dummyData, excludeCountryCodes: ['US'] },
      { ...dummyData, countryCodes: ['CA'] }
    ])
    const filtered = filterBlogCards(cards, 'US')
    expect(filtered.length).toBe(0)

    // Excluding countries without specifying explicit include countries means
    // any country not excluded will match
    const filtered1 = filterBlogCards(cards, 'IT')
    expect(filtered1.length).toBe(1)
    expect(filtered1[0].excludeCountryCodes).toEqual(['US'])
  })

  it('should handle case insensitive country code matching', () => {
    const cards = asBlogPostsGeo([{ ...dummyData, countryCodes: ['us'] }])
    const filtered = filterBlogCards(cards, 'US')
    expect(filtered.length).toBe(1)
    expect(filtered[0].countryCodes).toContain('us')
  })

  it('should return an empty array if all countries are excluded', () => {
    const cards = asBlogPostsGeo([
      { ...dummyData, excludeCountryCodes: ['US', 'CA'] },
      { ...dummyData, excludeCountryCodes: ['CA', 'IT'] }
    ])
    const filtered = filterBlogCards(cards, 'CA')
    expect(filtered).toEqual([])
  })

  it('should return all cards if they include the countryCode and none are excluded', () => {
    const cards = asBlogPostsGeo([
      { ...dummyData, countryCodes: ['US', 'CA'] },
      { ...dummyData, countryCodes: ['CA', 'MX'] }
    ])
    const filtered = filterBlogCards(cards, 'CA')
    expect(filtered.length).toBe(2)
  })
})

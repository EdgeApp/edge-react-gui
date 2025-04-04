import { describe, expect, test } from '@jest/globals'
import { InfoCard } from 'edge-info-server'

import { getDisplayInfoCards } from '../../util/infoUtils'

const dummyCard: InfoCard = {
  localeMessages: { en: 'hello' },
  background: { darkMode: '', lightMode: '' },
  ctaButton: undefined,
  countryCodes: undefined,
  excludeCountryCodes: undefined,
  hasLinkedBankMap: undefined,
  exactBuildNum: undefined,
  minBuildNum: undefined,
  maxBuildNum: undefined,
  osTypes: undefined,
  osVersions: undefined,
  startIsoDate: undefined,
  endIsoDate: undefined,
  appVersion: undefined,
  noBalance: false,
  dismissable: false,
  pluginPromotions: undefined,
  promoId: undefined
}

const buildNumber = '999'
const osType = 'ios'
const version = '9.9.9'
const osVersion = '17.17.17'
const currentDate = new Date('2024-06-13T20:53:33.013Z')

describe('filterPromoCards', () => {
  test('No cards', () => {
    const cards: InfoCard[] = []
    const result = getDisplayInfoCards({
      cards,
      countryCode: 'US',
      buildNumber,
      osType,
      version,
      osVersion,
      currentDate
    })
    expect(result.length).toBe(0)
  })
  test('Card no filters', () => {
    const cards: InfoCard[] = [{ ...dummyCard }]
    const result = getDisplayInfoCards({
      cards,
      countryCode: 'US',
      buildNumber,
      osType,
      version,
      osVersion,
      currentDate
    })
    expect(result.length).toBe(1)
    expect(result[0].localeMessages.en).toBe('hello')
  })
  test('Cards for iOS', () => {
    const cards: InfoCard[] = [
      {
        ...dummyCard,
        osTypes: ['android'],
        localeMessages: { en: 'Android message' }
      },
      { ...dummyCard, osTypes: ['ios'], localeMessages: { en: 'iOS Message' } },
      { ...dummyCard, osTypes: ['web'], localeMessages: { en: 'Web Message' } },
      {
        ...dummyCard,
        osTypes: ['ios'],
        localeMessages: { en: 'Another iOS Message' }
      }
    ]
    const result = getDisplayInfoCards({
      cards,
      countryCode: 'US',
      buildNumber,
      osType: 'ios',
      version,
      osVersion,
      currentDate
    })
    expect(result.length).toBe(2)
    expect(result[0].localeMessages.en).toBe('iOS Message')
    expect(result[1].localeMessages.en).toBe('Another iOS Message')
  })
  test('Cards for Android, exactBuildNum', () => {
    const cards: InfoCard[] = [
      {
        ...dummyCard,
        exactBuildNum: '123',
        osTypes: ['android'],
        localeMessages: { en: 'Android message' }
      },
      {
        ...dummyCard,
        exactBuildNum: '432',
        osTypes: ['ios'],
        localeMessages: { en: 'iOS Message' }
      },
      {
        ...dummyCard,
        exactBuildNum: '432',
        osTypes: ['web'],
        localeMessages: { en: 'Web Message' }
      },
      {
        ...dummyCard,
        exactBuildNum: '432',
        osTypes: ['android'],
        localeMessages: { en: 'Another Android Message' }
      }
    ]
    const result = getDisplayInfoCards({
      cards,
      countryCode: 'US',
      buildNumber: '432',
      osType: 'android',
      version,
      osVersion,
      currentDate
    })
    expect(result.length).toBe(1)
    expect(result[0].localeMessages.en).toBe('Another Android Message')
  })
  test('Cards for Android, version', () => {
    const cards: InfoCard[] = [
      {
        ...dummyCard,
        osTypes: ['android'],
        localeMessages: { en: 'Android message' },
        appVersion: '1.2.3'
      },
      { ...dummyCard, osTypes: ['ios'], localeMessages: { en: 'iOS Message' } },
      { ...dummyCard, osTypes: ['web'], localeMessages: { en: 'Web Message' } },
      {
        ...dummyCard,
        osTypes: ['android'],
        localeMessages: { en: 'Another Android Message' },
        appVersion: '1.2.4'
      }
    ]
    const result = getDisplayInfoCards({
      cards,
      countryCode: 'US',
      buildNumber: '432',
      osType: 'android',
      version: '1.2.3',
      osVersion,
      currentDate
    })
    expect(result.length).toBe(1)
    expect(result[0].localeMessages.en).toBe('Android message')
  })
  test('Cards with min/max build number', () => {
    const cards = [
      {
        ...dummyCard,
        minBuildNum: '3',
        maxBuildNum: '5',
        localeMessages: { en: '3-5' }
      },
      {
        ...dummyCard,
        minBuildNum: '1',
        maxBuildNum: '3',
        localeMessages: { en: '1-3' }
      },
      {
        ...dummyCard,
        minBuildNum: '4',
        maxBuildNum: '5',
        localeMessages: { en: '4-5' }
      },
      {
        ...dummyCard,
        minBuildNum: '1',
        maxBuildNum: '4',
        localeMessages: { en: '1-4' }
      }
    ]
    const result = getDisplayInfoCards({
      cards,
      countryCode: 'US',
      buildNumber: '4',
      osType,
      version,
      osVersion,
      currentDate
    })
    expect(result.length).toBe(3)
    expect(result[0].localeMessages.en).toBe('3-5')
    expect(result[1].localeMessages.en).toBe('4-5')
    expect(result[2].localeMessages.en).toBe('1-4')
  })
  test('No system countryCode', () => {
    const cards = [
      { ...dummyCard, localeMessages: { en: 'no country' } },
      {
        ...dummyCard,
        excludeCountryCodes: ['us'],
        localeMessages: { en: 'US 1 message' }
      },
      {
        ...dummyCard,
        excludeCountryCodes: ['us'],
        localeMessages: { en: 'US 2 message' }
      },
      {
        ...dummyCard,
        countryCodes: ['uk'],
        localeMessages: { en: 'UK message' }
      },
      {
        ...dummyCard,
        countryCodes: ['es'],
        localeMessages: { en: 'ES message' }
      }
    ]
    const result = getDisplayInfoCards({
      cards,
      buildNumber,
      osType,
      version,
      osVersion,
      currentDate
    })
    expect(result.length).toBe(1)
    expect(result[0].localeMessages.en).toBe('no country')
  })
  test('Cards for not in US', () => {
    const cards = [
      {
        ...dummyCard,
        excludeCountryCodes: ['us'],
        localeMessages: { en: 'US 1 message' }
      },
      {
        ...dummyCard,
        excludeCountryCodes: ['us'],
        localeMessages: { en: 'US 2 message' }
      },
      {
        ...dummyCard,
        excludeCountryCodes: ['uk'],
        localeMessages: { en: 'UK message' }
      },
      {
        ...dummyCard,
        excludeCountryCodes: ['es'],
        localeMessages: { en: 'ES message' }
      }
    ]
    const result = getDisplayInfoCards({
      cards,
      countryCode: 'us',
      buildNumber: '4',
      osType,
      version,
      osVersion,
      currentDate
    })
    expect(result.length).toBe(2)
    expect(result[0].localeMessages.en).toBe('UK message')
    expect(result[1].localeMessages.en).toBe('ES message')
  })
  test('With installerId', () => {
    const cards: InfoCard[] = [
      { ...dummyCard, promoId: 'bob1', localeMessages: { en: 'Bob1 message' } },
      { ...dummyCard, promoId: 'bob2', localeMessages: { en: 'Bob2 Message' } },
      { ...dummyCard, promoId: 'bob3', localeMessages: { en: 'Bob3 Message' } },
      { ...dummyCard, promoId: 'bob4', localeMessages: { en: 'Bob4 Message' } }
    ]
    const result = getDisplayInfoCards({
      cards,
      countryCode: 'US',
      buildNumber,
      osType,
      version,
      osVersion,
      currentDate,
      promoIds: ['bob2']
    })
    expect(result.length).toBe(1)
    expect(result[0].localeMessages.en).toBe('Bob2 Message')
  })
  test('With promotions.installerId', () => {
    const cards: InfoCard[] = [
      { ...dummyCard, promoId: 'bob1', localeMessages: { en: 'Bob1 message' } },
      { ...dummyCard, promoId: 'bob2', localeMessages: { en: 'Bob2 Message' } },
      { ...dummyCard, promoId: 'bob3', localeMessages: { en: 'Bob3 Message' } },
      { ...dummyCard, promoId: 'bob4', localeMessages: { en: 'Bob4 Message' } }
    ]
    const result = getDisplayInfoCards({
      cards,
      countryCode: 'US',
      buildNumber,
      osType,
      version,
      osVersion,
      currentDate,
      promoIds: ['bob2']
    })
    expect(result.length).toBe(1)
    expect(result[0].localeMessages.en).toBe('Bob2 Message')
  })
})

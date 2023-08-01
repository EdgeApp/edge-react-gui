import { beforeAll, describe, expect, jest, test } from '@jest/globals'
import { EdgeDataStore } from 'edge-core-js'

import { ValidateFuncs, validatePromoCardsInner } from '../../actions/AccountReferralActions'
import { MessageTweak } from '../../types/TweakTypes'

beforeAll(() => {
  jest.useRealTimers()
})

const dummyDataStore: EdgeDataStore = {
  deleteItem: async (storeId: string, itemId: string): Promise<void> => undefined,
  deleteStore: async (storeId: string): Promise<void> => undefined,
  listItemIds: async (storeId: string): Promise<string[]> => [],
  listStoreIds: async (): Promise<string[]> => [],
  getItem: async (storeId: string, itemId: string): Promise<string> => '',
  setItem: async (storeId: string, itemId: string, value: string): Promise<void> => undefined
}

const dummyCard: MessageTweak = {
  message: '',
  localeMessages: undefined,
  uri: undefined,
  iconUri: undefined,
  countryCodes: undefined,
  hasLinkedBankMap: undefined,
  exactBuildNum: undefined,
  minBuildNum: undefined,
  maxBuildNum: undefined,
  osTypes: undefined,
  startDate: undefined,
  durationDays: 0
}

const getPassFuncs = (countryCode: string, wyreHasLinked: boolean, buildNumber: string, languageTag: string, os: string, version: string): ValidateFuncs => ({
  getCountryCodeByIp: async () => countryCode,
  checkWyreHasLinkedBank: async () => wyreHasLinked,
  getBuildNumber: () => buildNumber,
  getLanguageTag: () => languageTag,
  getOs: () => os,
  getVersion: () => version
})

describe('validatePromoCardsInner', () => {
  test('No cards', async () => {
    const cards: MessageTweak[] = []
    const result = await validatePromoCardsInner(dummyDataStore, cards, getPassFuncs('US', true, '', '', '', '1.2.3'))
    expect(result.length).toBe(0)
  })
  test('Card no filters', async () => {
    const cards = [{ ...dummyCard, message: 'Just a message' }]
    const result = await validatePromoCardsInner(dummyDataStore, cards, getPassFuncs('US', true, '', '', '', '1.2.3'))
    expect(result.length).toBe(1)
    expect(result[0].message).toBe('Just a message')
  })
  test('Cards for iOS', async () => {
    const cards: MessageTweak[] = [
      { ...dummyCard, osTypes: ['android'], message: 'Android message' },
      { ...dummyCard, osTypes: ['ios'], message: 'iOS Message' },
      { ...dummyCard, osTypes: ['web'], message: 'Web Message' },
      { ...dummyCard, osTypes: ['ios'], message: 'Another iOS Message' }
    ]
    const result = await validatePromoCardsInner(dummyDataStore, cards, getPassFuncs('US', true, '', '', 'ios', '1.2.3'))
    expect(result.length).toBe(2)
    expect(result[0].message).toBe('iOS Message')
    expect(result[1].message).toBe('Another iOS Message')
  })
  test('Cards for Android, exactBuildNum', async () => {
    const cards: MessageTweak[] = [
      { ...dummyCard, exactBuildNum: '123', osTypes: ['android'], message: 'Android message' },
      { ...dummyCard, exactBuildNum: '432', osTypes: ['ios'], message: 'iOS Message' },
      { ...dummyCard, exactBuildNum: '432', osTypes: ['web'], message: 'Web Message' },
      { ...dummyCard, exactBuildNum: '432', osTypes: ['android'], message: 'Another Android Message' }
    ]
    const result = await validatePromoCardsInner(dummyDataStore, cards, getPassFuncs('US', true, '432', '', 'android', '1.2.3'))
    expect(result.length).toBe(1)
    expect(result[0].message).toBe('Another Android Message')
  })
  test('Cards for Android, version', async () => {
    const cards: MessageTweak[] = [
      { ...dummyCard, osTypes: ['android'], message: 'Android message', version: '1.2.3' },
      { ...dummyCard, osTypes: ['ios'], message: 'iOS Message' },
      { ...dummyCard, osTypes: ['web'], message: 'Web Message' },
      { ...dummyCard, osTypes: ['android'], message: 'Another Android Message', version: '1.2.4' }
    ]
    const result = await validatePromoCardsInner(dummyDataStore, cards, getPassFuncs('US', true, '432', '', 'android', '1.2.3'))
    expect(result.length).toBe(1)
    expect(result[0].message).toBe('Android message')
  })
  test('Cards with min/max build number', async () => {
    const cards = [
      { ...dummyCard, minBuildNum: '3', maxBuildNum: '5', message: '3-5' },
      { ...dummyCard, minBuildNum: '1', maxBuildNum: '3', message: '1-3' },
      { ...dummyCard, minBuildNum: '4', maxBuildNum: '5', message: '4-5' },
      { ...dummyCard, minBuildNum: '1', maxBuildNum: '4', message: '1-4' }
    ]
    const result = await validatePromoCardsInner(dummyDataStore, cards, getPassFuncs('US', true, '4', '', '', '1.2.3'))
    expect(result.length).toBe(3)
    expect(result[0].message).toBe('3-5')
    expect(result[1].message).toBe('4-5')
    expect(result[2].message).toBe('1-4')
  })
  test('Cards with min/max buildnum and has no linked bank', async () => {
    const cards = [
      { ...dummyCard, hasLinkedBankMap: { 'co.edgesecure.wyre': true }, minBuildNum: '3', maxBuildNum: '5', message: 'link 3-5' },
      { ...dummyCard, hasLinkedBankMap: { 'co.edgesecure.wyre': false }, minBuildNum: '1', maxBuildNum: '3', message: 'not linked 1-3' },
      { ...dummyCard, hasLinkedBankMap: { 'co.edgesecure.wyre': false }, minBuildNum: '4', maxBuildNum: '5', message: 'not linked 4-5' },
      { ...dummyCard, hasLinkedBankMap: { 'co.edgesecure.wyre': true }, minBuildNum: '1', maxBuildNum: '4', message: 'link 1-4' }
    ]
    const result = await validatePromoCardsInner(dummyDataStore, cards, getPassFuncs('US', false, '4', '', '', '1.2.3'))
    expect(result.length).toBe(1)
    expect(result[0].message).toBe('not linked 4-5')
  })
  test('Cards with linked bank in US', async () => {
    const cards = [
      { ...dummyCard, hasLinkedBankMap: { 'co.edgesecure.wyre': true }, countryCodes: ['US'], message: 'link US' },
      { ...dummyCard, hasLinkedBankMap: { 'co.edgesecure.wyre': false }, countryCodes: ['US'], message: 'not linked US' },
      { ...dummyCard, hasLinkedBankMap: { 'co.edgesecure.wyre': false }, countryCodes: ['UK'], message: 'not linked UK' },
      { ...dummyCard, hasLinkedBankMap: { 'co.edgesecure.wyre': true }, countryCodes: ['UK'], message: 'link UK' }
    ]
    const result = await validatePromoCardsInner(dummyDataStore, cards, getPassFuncs('US', false, '4', '', '', '1.2.3'))
    expect(result.length).toBe(1)
    expect(result[0].message).toBe('not linked US')
  })
  test('Cards for not in US', async () => {
    const cards = [
      { ...dummyCard, excludeCountryCodes: ['US'], message: 'US 1 message' },
      { ...dummyCard, excludeCountryCodes: ['US'], message: 'US 2 message' },
      { ...dummyCard, excludeCountryCodes: ['UK'], message: 'UK message' },
      { ...dummyCard, excludeCountryCodes: ['ES'], message: 'ES message' }
    ]
    const result = await validatePromoCardsInner(dummyDataStore, cards, getPassFuncs('US', false, '4', '', '', '1.2.3'))
    expect(result.length).toBe(2)
    expect(result[0].message).toBe('UK message')
  })
  test('Localized message no match', async () => {
    const cards: MessageTweak[] = [
      { ...dummyCard, message: '0: plain english', localeMessages: { es_MX: 'Mex Spanish' } },
      { ...dummyCard, message: '1: plain english', localeMessages: { en_US: 'US English' } },
      { ...dummyCard, message: '2: plain english', localeMessages: { it_IT: 'Italy Italian' } },
      { ...dummyCard, message: '3: plain english', localeMessages: { es_SP: 'Spain Spanish' } }
    ]
    const result = await validatePromoCardsInner(dummyDataStore, cards, getPassFuncs('US', false, '4', 'ru', '', '1.2.3'))
    expect(result.length).toBe(4)
    expect(result[0].message).toBe('0: plain english')
    expect(result[3].message).toBe('3: plain english')
  })
  test('Localized message es match', async () => {
    const cards: MessageTweak[] = [
      { ...dummyCard, message: '0: plain english', localeMessages: { es_MX: 'Mex Spanish' } },
      { ...dummyCard, message: '1: plain english', localeMessages: { en_US: 'US English' } },
      { ...dummyCard, message: '2: plain english', localeMessages: { it_IT: 'Italy Italian' } },
      { ...dummyCard, message: '3: plain english', localeMessages: { es_SP: 'Spain Spanish' } }
    ]
    const result = await validatePromoCardsInner(dummyDataStore, cards, getPassFuncs('US', false, '4', 'es', '', '1.2.3'))
    expect(result.length).toBe(4)
    expect(result[0].message).toBe('Mex Spanish')
    expect(result[1].message).toBe('1: plain english')
    expect(result[2].message).toBe('2: plain english')
    expect(result[3].message).toBe('Spain Spanish')
  })
})

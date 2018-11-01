/* globals jest describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { SendConfirmation } from '../components/scenes/SendConfirmationScene.js'

describe('SendConfirmation', () => {
  it('should render with standard props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      fiatCurrencyCode: 'USD',
      currencyCode: 'BTC',
      nativeAmount: '0',
      parentNetworkFee: '0',
      networkFee: '0',
      pending: false,
      keyboardIsVisible: true,
      balanceInCrypto: '0',
      balanceInFiat: '0',
      parentDisplayDenomination: {
        name: 'BTC',
        multiplier: '100000000',
        symbol: '₿'
      },
      parentExchangeDenomination: {
        name: 'BTC',
        multiplier: '100000000',
        symbol: '₿'
      },
      primaryDisplayDenomination: {
        name: 'BTC',
        multiplier: '100000000',
        symbol: '₿'
      },
      primaryExchangeDenomination: {
        name: 'BTC',
        multiplier: '100000000',
        symbol: '₿'
      },
      secondaryExchangeCurrencyCode: 'iso:USD',
      errorMsg: null,
      fiatPerCrypto: 8000,
      sliderDisabled: true,
      resetSlider: false,
      forceUpdateGuiCounter: 0,
      currencyConverter: { convertCurrency: jest.fn },
      transactionMetadata: null,
      isEditable: true,
      authRequired: 'none',
      pin: '',
      address: '123123123'
    }
    const actual = renderer.render(<SendConfirmation {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('should render with destination', () => {
    const renderer = new ShallowRenderer()

    const props = {
      fiatCurrencyCode: 'USD',
      currencyCode: 'BTC',
      nativeAmount: '0',
      parentNetworkFee: '0',
      networkFee: '0',
      pending: false,
      keyboardIsVisible: true,
      balanceInCrypto: '0',
      balanceInFiat: '0',
      parentDisplayDenomination: {
        name: 'BTC',
        multiplier: '100000000',
        symbol: '₿'
      },
      parentExchangeDenomination: {
        name: 'BTC',
        multiplier: '100000000',
        symbol: '₿'
      },
      primaryDisplayDenomination: {
        name: 'BTC',
        multiplier: '100000000',
        symbol: '₿'
      },
      primaryExchangeDenomination: {
        name: 'BTC',
        multiplier: '100000000',
        symbol: '₿'
      },
      secondaryExchangeCurrencyCode: 'iso:USD',
      errorMsg: null,
      fiatPerCrypto: 8000,
      sliderDisabled: true,
      resetSlider: false,
      forceUpdateGuiCounter: 0,
      currencyConverter: { convertCurrency: jest.fn },
      transactionMetadata: { name: 'airbitz' },
      isEditable: true,
      authRequired: 'none',
      pin: '',
      address: '123123123'
    }
    const actual = renderer.render(<SendConfirmation {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('should render with unique identifier button with "ADD" text (XRP)', () => {
    const renderer = new ShallowRenderer()

    const props = {
      fiatCurrencyCode: 'USD',
      currencyCode: 'XRP',
      nativeAmount: '0',
      parentNetworkFee: '0',
      networkFee: '0',
      pending: false,
      keyboardIsVisible: true,
      balanceInCrypto: '0',
      balanceInFiat: '0',
      parentDisplayDenomination: {
        name: 'XRP',
        multiplier: '1000000',
        symbol: 'X'
      },
      parentExchangeDenomination: {
        name: 'XRP',
        multiplier: '1000000',
        symbol: 'X'
      },
      primaryDisplayDenomination: {
        name: 'XRP',
        multiplier: '1000000',
        symbol: 'X'
      },
      primaryExchangeDenomination: {
        name: 'XRP',
        multiplier: '1000000',
        symbol: 'X'
      },
      secondaryExchangeCurrencyCode: 'iso:USD',
      errorMsg: null,
      fiatPerCrypto: 8000,
      sliderDisabled: true,
      resetSlider: false,
      forceUpdateGuiCounter: 0,
      currencyConverter: { convertCurrency: jest.fn },
      transactionMetadata: null,
      isEditable: true,
      authRequired: 'none',
      pin: ''
    }
    const actual = renderer.render(<SendConfirmation {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('should render with unique identifier button with "ADD" text (XMR)', () => {
    const renderer = new ShallowRenderer()

    const props = {
      fiatCurrencyCode: 'USD',
      currencyCode: 'XMR',
      nativeAmount: '0',
      parentNetworkFee: '0',
      networkFee: '0',
      pending: false,
      keyboardIsVisible: true,
      balanceInCrypto: '0',
      balanceInFiat: '0',
      parentDisplayDenomination: {
        name: 'XMR',
        multiplier: '1000000000000',
        symbol: 'ɱ'
      },
      parentExchangeDenomination: {
        name: 'XMR',
        multiplier: '1000000000000',
        symbol: 'ɱ'
      },
      primaryDisplayDenomination: {
        name: 'XMR',
        multiplier: '1000000000000',
        symbol: 'ɱ'
      },
      primaryExchangeDenomination: {
        name: 'XMR',
        multiplier: '1000000000000',
        symbol: 'ɱ'
      },
      secondaryExchangeCurrencyCode: 'iso:USD',
      errorMsg: null,
      fiatPerCrypto: 8000,
      sliderDisabled: true,
      resetSlider: false,
      forceUpdateGuiCounter: 0,
      currencyConverter: { convertCurrency: jest.fn },
      transactionMetadata: null,
      isEditable: true,
      authRequired: 'none',
      pin: ''
    }
    const actual = renderer.render(<SendConfirmation {...props} />)

    expect(actual).toMatchSnapshot()
  })
})

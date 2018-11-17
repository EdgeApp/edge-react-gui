/* globals jest describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import SendConfirmationOptions from '../components/common/SendConfirmationOptions.js'

describe('SendConfirmation', () => {
  it('should render with standard props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      changeMiningFee: jest.fn,
      openHelpModal: jest.fn,
      sendMaxSpend: jest.fn,
      uniqueIdentifierModalActivated: jest.fn,
      sourceWallet: {},
      currencyCode: 'BTC',
      isEditable: true
    }
    const actual = renderer.render(<SendConfirmationOptions {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('not editable', () => {
    const renderer = new ShallowRenderer()

    const props = {
      changeMiningFee: jest.fn,
      openHelpModal: jest.fn,
      sendMaxSpend: jest.fn,
      uniqueIdentifierModalActivated: jest.fn,
      sourceWallet: {},
      currencyCode: 'BTC',
      isEditable: false
    }
    const actual = renderer.render(<SendConfirmationOptions {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('XMR', () => {
    const renderer = new ShallowRenderer()

    const props = {
      changeMiningFee: jest.fn,
      openHelpModal: jest.fn,
      sendMaxSpend: jest.fn,
      uniqueIdentifierModalActivated: jest.fn,
      sourceWallet: {},
      currencyCode: 'XMR',
      isEditable: true
    }
    const actual = renderer.render(<SendConfirmationOptions {...props} />)

    expect(actual).toMatchSnapshot()
  })

  it('XRP', () => {
    const renderer = new ShallowRenderer()

    const props = {
      changeMiningFee: jest.fn,
      openHelpModal: jest.fn,
      sendMaxSpend: jest.fn,
      uniqueIdentifierModalActivated: jest.fn,
      sourceWallet: {},
      currencyCode: 'XRP',
      isEditable: true
    }
    const actual = renderer.render(<SendConfirmationOptions {...props} />)

    expect(actual).toMatchSnapshot()
  })
})

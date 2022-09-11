/* globals describe it expect */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { FioDomainRegister } from '../../components/scenes/FioDomainRegisterScene'
import { getTheme } from '../../components/services/ThemeContext'

describe('FioDomainRegister', () => {
  it('should render with loading props', () => {
    // @ts-expect-error
    const renderer = new ShallowRenderer()

    const props = {
      navigation: undefined,
      fioWallets: [
        {
          fiatCurrencyCode: 'iso:USD',
          addCustomToken: 'shib',
          currencyInfo: {
            currencyCode: 'SHIB'
          }
        }
      ],
      fioPlugin: {
        currencyInfo: 'FIO plugin'
      },
      isConnected: true,
      createFioWallet: async () => ({
        fiatCurrencyCode: 'iso:USD',
        addCustomToken: 'shib',
        currencyInfo: {
          currencyCode: 'SHIB'
        }
      }),
      theme: getTheme()
    }
    // @ts-expect-error
    const actual = renderer.render(<FioDomainRegister {...props} />)

    expect(actual).toMatchSnapshot()
  })
})

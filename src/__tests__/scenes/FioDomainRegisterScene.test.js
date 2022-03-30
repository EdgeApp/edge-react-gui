/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { FioDomainRegister } from '../../components/scenes/FioDomainRegisterScene'
import { getTheme } from '../../components/services/ThemeContext.js'

describe('FioDomainRegister', () => {
  it('should render with loading props', () => {
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
    const actual = renderer.render(<FioDomainRegister {...props} />)

    expect(actual).toMatchSnapshot()
  })
})

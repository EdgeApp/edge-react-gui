import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { FioDomainRegister } from '../../components/scenes/Fio/FioDomainRegisterScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

describe('FioDomainRegister', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const fakeWallet: any = {
      fiatCurrencyCode: 'iso:USD',
      addCustomToken: 'shib',
      currencyInfo: {
        currencyCode: 'SHIB'
      }
    }

    const actual = renderer.render(
      <FioDomainRegister
        {...fakeSceneProps('fioDomainRegister', {})}
        fioWallets={[fakeWallet]}
        fioPlugin={
          {
            currencyInfo: 'FIO plugin'
          } as any
        }
        isConnected
        createFioWallet={async () => fakeWallet}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})

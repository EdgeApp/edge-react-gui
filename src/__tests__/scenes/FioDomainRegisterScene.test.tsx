import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { FioDomainRegister } from '../../components/scenes/Fio/FioDomainRegisterScene'
import { getTheme } from '../../components/services/ThemeContext'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

describe('FioDomainRegister', () => {
  it('should render with loading props', () => {
    const fakeWallet: any = {
      fiatCurrencyCode: 'iso:USD',
      addCustomToken: 'shib',
      currencyInfo: {
        currencyCode: 'SHIB'
      }
    }

    const rendered = render(
      <FakeProviders>
        <FioDomainRegister
          {...fakeEdgeAppSceneProps('fioDomainRegister', undefined)}
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
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})

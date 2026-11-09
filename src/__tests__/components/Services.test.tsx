import { describe, expect, it, jest } from '@jest/globals'
import { act, render } from '@testing-library/react-native'
import * as React from 'react'
import { Text } from 'react-native'

import { Services } from '../../components/services/Services'
import { useSelector } from '../../types/reactRedux'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'
import { infoServerData, notifyInfoRollup } from '../../util/network'

jest.mock('react-native-device-info', () => ({
  getVersion: () => '1.0.0',
  usePowerState: () => ({})
}))

// Only the rollup wiring is under test, so the child services render nothing:
jest.mock('../../components/services/AccountCallbackManager', () => ({
  AccountCallbackManager: () => null
}))
jest.mock('../../components/services/ActionQueueService', () => ({
  ActionQueueService: () => null
}))
jest.mock('../../components/services/AutoLogout', () => ({
  AutoLogout: () => null
}))
jest.mock('../../components/services/FioService', () => ({
  FioService: () => null
}))
jest.mock('../../components/services/LoanManagerService', () => ({
  LoanManagerService: () => null
}))
jest.mock('../../components/services/NotificationService', () => ({
  NotificationService: () => null
}))
jest.mock('../../components/services/SortedWalletList', () => ({
  SortedWalletList: () => null
}))
jest.mock('../../components/services/WalletConnectService', () => ({
  WalletConnectService: () => null
}))
jest.mock('../../components/services/ContactsLoader', () => ({
  ContactsLoader: () => null
}))
jest.mock('../../components/services/EdgeContextCallbackManager', () => ({
  EdgeContextCallbackManager: () => null
}))
jest.mock('../../components/services/NetworkActivity', () => ({
  NetworkActivity: () => null
}))
jest.mock('../../components/services/PasswordReminderService', () => ({
  PasswordReminderService: () => null
}))
jest.mock('../../components/services/PermissionsManager', () => ({
  PermissionsManager: () => null
}))
jest.mock('../../components/services/WalletLifecycle', () => ({
  WalletLifecycle: () => null
}))
jest.mock('../../components/services/WipeLogsService', () => ({
  WipeLogsService: () => null
}))

const NewPaymentTypes: React.FC = () => {
  const types = useSelector(state => state.ui.exchangeInfo.buy.newPaymentTypes)
  return <Text>{Object.keys(types).join(',')}</Text>
}

describe('Services', () => {
  it('loads exchange info from a rollup that lands after mount', async () => {
    infoServerData.rollupRaw = undefined
    const rendered = render(
      <FakeProviders>
        <Services navigation={fakeNavigation as any} />
        <NewPaymentTypes />
      </FakeProviders>
    )
    expect(rendered.queryByText('applepay')).toBeNull()

    infoServerData.rollupRaw = {
      exchangeInfo: {
        buy: {
          disablePlugins: {},
          newPaymentTypes: {
            applepay: { endIsoDate: '2030-01-01T00:00:00.000Z' }
          }
        }
      }
    }
    await act(async () => {
      notifyInfoRollup()
      await Promise.resolve()
    })

    expect(rendered.getByText('applepay')).toBeTruthy()
    rendered.unmount()
  })
})

import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  jest
} from '@jest/globals'
import { act, fireEvent, render } from '@testing-library/react-native'
import { asDate, asObject, asOptional, asString, asUnknown } from 'cleaners'
import {
  addEdgeCorePlugins,
  type EdgeAccount,
  type EdgeContext,
  type EdgeCurrencyWallet,
  lockEdgeCorePlugins,
  makeFakeEdgeWorld
} from 'edge-core-js'
import * as React from 'react'

import type { SwapConfirmationParams } from '../../components/scenes/SwapConfirmationScene'
import { SwapCreateScene } from '../../components/scenes/SwapCreateScene'
import type { SwapProcessingParams } from '../../components/scenes/SwapProcessingScene'
import { lstrings } from '../../locales/strings'
import { btcCurrencyInfo } from '../../util/fake/fakeBtcInfo'
import { makeFakePlugin } from '../../util/fake/fakeCurrencyPlugin'
import { ethCurrencyInfo } from '../../util/fake/fakeEthInfo'
import { FakeProviders, type FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import {
  fakeNavigation,
  fakeSwapTabSceneProps
} from '../../util/fake/fakeSceneProps'
import fakeUser from '../../util/fake/fakeUserDump.json'

jest.useRealTimers()

let context: EdgeContext | undefined
let account: EdgeAccount | undefined
let btcWallet: EdgeCurrencyWallet | undefined
let ethWallet: EdgeCurrencyWallet | undefined

const asUserDump = asObject({
  loginKey: asString,
  data: asObject({
    username: asString,
    lastLogin: asOptional(asDate),
    loginId: asString,
    loginKey: asString,
    repos: asObject(asObject(asUnknown)),
    server: asUnknown
  })
})

beforeAll(async () => {
  const dump = asUserDump(fakeUser)
  addEdgeCorePlugins({
    bitcoin: makeFakePlugin(btcCurrencyInfo),
    ethereum: makeFakePlugin(ethCurrencyInfo)
  })
  lockEdgeCorePlugins()

  const world = await makeFakeEdgeWorld([dump.data], {})
  context = await world.makeEdgeContext({
    apiKey: '',
    appId: '',
    plugins: { bitcoin: true, ethereum: true }
  })
  account = await context.loginWithKey('bob', dump.loginKey)
  const btcInfo = account.getFirstWalletInfo('wallet:bitcoin')
  const ethInfo = account.getFirstWalletInfo('wallet:ethereum')
  if (btcInfo == null || ethInfo == null) {
    throw new Error('Unable to get wallet infos')
  }
  btcWallet = await account.waitForCurrencyWallet(btcInfo.id)
  ethWallet = await account.waitForCurrencyWallet(ethInfo.id)
})

afterAll(async () => {
  await context?.close()
})

describe('SwapCreateScene', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should render with loading props', () => {
    const rootState: FakeState = { ...fakeRootState }

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SwapCreateScene {...fakeSwapTabSceneProps('swapCreate', {})} />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('asks for an ordinary swap after the Stealth terms are declined', async () => {
    if (btcWallet == null || ethWallet == null) throw new Error('No wallets')
    const rootState: FakeState = { ...fakeRootState, core: { account } }
    const navigate = jest
      .spyOn(fakeNavigation, 'navigate')
      .mockImplementation(() => undefined)
    const replace = jest
      .spyOn(fakeNavigation, 'replace')
      .mockImplementation(() => undefined)

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SwapCreateScene
          {...fakeSwapTabSceneProps('swapCreate', {
            fromWalletId: btcWallet.id,
            fromTokenId: null,
            toWalletId: ethWallet.id,
            toTokenId: null
          })}
        />
      </FakeProviders>
    )

    // The scene's last quote request, as handed to the processing scene:
    const lastProcessingParams = (): SwapProcessingParams => {
      // The spy types its calls after navigate's last overload, an options
      // object, while the scene calls the (name, params) overload:
      const calls = navigate.mock.calls as unknown as Array<[string, unknown]>
      const processingCalls = calls.filter(call => call[0] === 'swapProcessing')
      return processingCalls[
        processingCalls.length - 1
      ][1] as SwapProcessingParams
    }

    fireEvent.press(rendered.getByText(lstrings.stealth_swap_toggle))
    fireEvent.press(rendered.getByText(lstrings.string_max_cap))
    const stealthParams = lastProcessingParams()
    expect(stealthParams.swapRequest.privacy).toBe('required')

    // The quotes arrive, and the confirmation scene's terms decline calls back.
    // The create scene only forwards the quotes, so none are needed:
    await act(async () => {
      stealthParams.onDone([])
    })
    const confirmationCall = replace.mock.calls.find(
      call => call[0] === 'swapConfirmation'
    )
    const confirmationParams = confirmationCall?.[1] as SwapConfirmationParams
    await act(async () => {
      confirmationParams.onStealthTermsDeclined?.()
    })

    fireEvent.press(rendered.getByText(lstrings.string_max_cap))
    const nextParams = lastProcessingParams()
    expect(nextParams).not.toBe(stealthParams)
    expect(nextParams.swapRequest.privacy).toBeUndefined()
    expect(nextParams.swapRequestOptions.forceEnabled).toBeUndefined()
    rendered.unmount()
  })

  it('offers the Stealth Swap toggle before any wallet is picked', () => {
    const rootState: FakeState = { ...fakeRootState }

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SwapCreateScene {...fakeSwapTabSceneProps('swapCreate', {})} />
      </FakeProviders>
    )

    expect(rendered.getByText(lstrings.stealth_swap_toggle)).toBeTruthy()
    expect(
      rendered.queryByText(lstrings.stealth_swap_info, { exact: false })
    ).toBeNull()
    rendered.unmount()
  })

  it('turns Stealth Swap on from the stealth param', () => {
    const rootState: FakeState = { ...fakeRootState }
    const sceneProps = fakeSwapTabSceneProps('swapCreate', { stealth: true })
    const setParams = jest.spyOn(sceneProps.navigation, 'setParams')

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <SwapCreateScene {...sceneProps} />
      </FakeProviders>
    )

    expect(
      rendered.getByText(lstrings.stealth_swap_info, { exact: false })
    ).toBeTruthy()
    // The param is consumed, so later param merges cannot re-apply it:
    expect(setParams).toHaveBeenCalledWith({ stealth: undefined })
    rendered.unmount()
    // The fake navigation is shared by every test in the file:
    setParams.mockRestore()
  })
})

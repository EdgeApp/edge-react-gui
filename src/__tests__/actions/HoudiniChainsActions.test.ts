import { describe, expect, jest, test } from '@jest/globals'

import { updateHoudiniChains } from '../../actions/HoudiniChainsActions'
import type { Dispatch, RootState } from '../../types/reduxTypes'
import { asHoudiniChains, type HoudiniChains } from '../../util/houdiniChains'
import { infoServerData } from '../../util/network'

const ETHEREUM = {
  memoNeeded: false,
  addressValidation: '^(0x)[0-9A-Za-z]{40}$',
  coin: { hasSelfPrivate: true },
  tokens: {}
}

const loaded = asHoudiniChains({ ethereum: ETHEREUM })

const run = async (
  houdiniChains: HoudiniChains
): Promise<HoudiniChains | undefined> => {
  const dispatch = jest.fn()
  const getState = (): RootState =>
    ({ ui: { houdiniChains } } as unknown as RootState)
  await updateHoudiniChains()(dispatch as unknown as Dispatch, getState)
  if (dispatch.mock.calls.length === 0) return
  const action = dispatch.mock.calls[0][0] as { data: HoudiniChains }
  return action.data
}

describe('updateHoudiniChains', () => {
  test('loads the served list', async () => {
    infoServerData.rollupRaw = { houdiniAssets: { ethereum: ETHEREUM } }
    const data = await run(new Map())
    expect([...(data ?? new Map()).keys()]).toEqual(['ethereum'])
  })

  test('a rollup without the field keeps a loaded list', async () => {
    infoServerData.rollupRaw = {}
    expect(await run(loaded)).toBeUndefined()
  })

  test('a rollup without the field loads no chains before any list', async () => {
    infoServerData.rollupRaw = {}
    const data = await run(new Map())
    expect(data?.size).toEqual(0)
  })
})

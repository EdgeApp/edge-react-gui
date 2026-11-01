import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, render } from '@testing-library/react-native'
import type { EdgeContext, EdgeUserInfo } from 'edge-core-js'
import * as React from 'react'

import { syncPushLoginIds } from '../../actions/NotificationActions'
import { PushLoginIdsService } from '../../components/services/PushLoginIdsService'

jest.mock('../../actions/NotificationActions', () => ({
  syncPushLoginIds: jest.fn()
}))

const mockSync = jest.mocked(syncPushLoginIds)

const makeUser = (loginId: string, voucherId?: string): EdgeUserInfo => ({
  keyLoginEnabled: true,
  lastLogin: undefined,
  loginId,
  pinLoginEnabled: true,
  recovery2Key: undefined,
  username: undefined,
  voucherId
})

/** A context whose `localUsers` can change the way core changes it. */
const makeFakeContext = (
  initial: EdgeUserInfo[]
): {
  context: EdgeContext
  setLocalUsers: (users: EdgeUserInfo[]) => Promise<void>
} => {
  let callback: ((users: EdgeUserInfo[]) => void) | undefined
  const partial = {
    localUsers: initial,
    watch: (_name: string, onChange: (users: EdgeUserInfo[]) => void) => {
      callback = onChange
      return () => {
        callback = undefined
      }
    }
  }
  return {
    context: partial as unknown as EdgeContext,
    setLocalUsers: async users => {
      await act(async () => {
        partial.localUsers = users
        callback?.(users)
        await Promise.resolve()
      })
    }
  }
}

const mountService = async (context: EdgeContext): Promise<void> => {
  render(<PushLoginIdsService context={context} />)
  await act(async () => {
    await Promise.resolve()
  })
}

describe('PushLoginIdsService', () => {
  beforeEach(() => {
    mockSync.mockReset()
    mockSync.mockResolvedValue(undefined)
  })

  it('syncs on mount', async () => {
    const { context } = makeFakeContext([makeUser('a')])
    await mountService(context)

    expect(mockSync).toHaveBeenCalledTimes(1)
  })

  it('syncs again when an account is forgotten', async () => {
    const { context, setLocalUsers } = makeFakeContext([
      makeUser('a'),
      makeUser('b')
    ])
    await mountService(context)
    mockSync.mockClear()

    await setLocalUsers([makeUser('a')])

    expect(mockSync).toHaveBeenCalledTimes(1)
  })

  it('ignores stash updates that keep the same logins', async () => {
    const { context, setLocalUsers } = makeFakeContext([makeUser('a')])
    await mountService(context)
    mockSync.mockClear()

    await setLocalUsers([makeUser('a', 'new-voucher')])

    expect(mockSync).not.toHaveBeenCalled()
  })

  it('does not surface a failed sync', async () => {
    mockSync.mockRejectedValue(new Error('offline'))
    const { context } = makeFakeContext([makeUser('a')])

    await mountService(context)

    expect(mockSync).toHaveBeenCalledTimes(1)
    expect(console.warn).toHaveBeenCalled()
  })
})

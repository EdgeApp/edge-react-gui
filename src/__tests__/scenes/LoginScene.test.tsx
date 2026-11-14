import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import { act, render } from '@testing-library/react-native'
import type { ContactSupportInfo } from 'edge-login-ui-rn'
import * as React from 'react'

import {
  type IntercomChatOptions,
  showIntercomChatModal
} from '../../components/modals/IntercomChatModal'
import { LoginScene } from '../../components/scenes/LoginScene'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeRootSceneProps } from '../../util/fake/fakeSceneProps'

// Captures the props the scene hands to Login UI:
const mockLoginScreen: {
  onContactSupport?: (info: ContactSupportInfo) => Promise<void>
} = {}
jest.mock('edge-login-ui-rn', () => ({
  LoginScreen: (props: typeof mockLoginScreen) => {
    mockLoginScreen.onContactSupport = props.onContactSupport
    return null
  }
}))

jest.mock('../../components/modals/IntercomChatModal', () => ({
  showIntercomChatModal: jest.fn(async () => {})
}))

const showChat = jest.mocked(showIntercomChatModal)

describe('LoginScene', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function renderScene(): void {
    render(
      <FakeProviders>
        <LoginScene
          {...fakeRootSceneProps('login', {
            experimentConfig: {} as any
          })}
        />
      </FakeProviders>
    )
  }

  async function contactSupport(): Promise<IntercomChatOptions> {
    const { onContactSupport } = mockLoginScreen
    if (onContactSupport == null) throw new Error('No onContactSupport')
    await act(async () => {
      await onContactSupport({ lockId: '1a2b3c4d' })
    })
    const options = showChat.mock.calls.at(-1)?.[0]
    if (options == null) throw new Error('No chat opened')
    return options
  }

  it('sends the message again until a chat has sent it', async () => {
    renderScene()

    const first = await contactSupport()
    const second = await contactSupport()

    expect(first.lockId).toBe('1a2b3c4d')
    expect(first.message).toContain('1a2b3c4d')
    expect(second.message).toBe(first.message)
  })

  it('sends the message only once after a chat has sent it', async () => {
    renderScene()

    const first = await contactSupport()
    act(() => {
      first.onMessageSent?.()
    })
    const second = await contactSupport()

    expect(first.message).toContain('1a2b3c4d')
    expect(second.message).toBeUndefined()
  })
})

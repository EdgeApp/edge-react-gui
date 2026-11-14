import { describe, expect, it, jest } from '@jest/globals'
import {
  act,
  fireEvent,
  render,
  type RenderResult
} from '@testing-library/react-native'
import type { EdgeAccount, EdgeLobby } from 'edge-core-js'
import * as React from 'react'
import { ScrollView } from 'react-native'

import { EdgeLoginScene } from '../../components/scenes/EdgeLoginScene'
import { lstrings } from '../../locales/strings'
import { FakeProviders, type FakeState } from '../../util/fake/FakeProviders'
import { fakeRootState } from '../../util/fake/fakeRootState'
import {
  fakeEdgeAppSceneProps,
  fakeNavigation
} from '../../util/fake/fakeSceneProps'

let account: EdgeAccount | undefined

/** Lets pending promises finish while the global fake timers stay stopped. */
const flush = async (): Promise<void> => {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(0)
  })
}

/** Steps one second at a time, since each tick schedules the next one. */
const advanceSeconds = async (seconds: number): Promise<void> => {
  for (let i = 0; i < seconds; ++i) {
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1000)
    })
  }
}

const fakeLobby = (approve: () => Promise<void>): EdgeLobby =>
  ({
    loginRequest: { approve, displayName: 'Fake App' }
  } as unknown as EdgeLobby)

/** Lays out a 500-point scroll area with the warning ending at `bottom`. */
const layOutWarning = (rendered: RenderResult, bottom: number): void => {
  fireEvent(rendered.UNSAFE_getByType(ScrollView), 'layout', {
    nativeEvent: { layout: { height: 500, width: 320, x: 0, y: 0 } }
  })
  fireEvent(rendered.getByTestId('edgeLoginWarning'), 'layout', {
    nativeEvent: { layout: { height: 200, width: 320, x: 0, y: bottom - 200 } }
  })
}

const scrollTo = (rendered: RenderResult, offset: number): void => {
  fireEvent.scroll(rendered.UNSAFE_getByType(ScrollView), {
    nativeEvent: { contentOffset: { x: 0, y: offset } }
  })
}

const renderScene = async (
  fetchLobby: () => Promise<EdgeLobby>
): Promise<RenderResult> => {
  const fakeAccount = { fetchLobby } as unknown as EdgeAccount
  const rootState: FakeState = {
    ...fakeRootState,
    core: { account: fakeAccount }
  }
  const props = fakeEdgeAppSceneProps('edgeLogin', {
    lobbyId: 'AmNsSBDVeF2837'
  })
  const rendered = render(
    <FakeProviders initialState={rootState}>
      <EdgeLoginScene {...props} />
    </FakeProviders>
  )
  await flush()
  return rendered
}

/** Renders the scene with a warning that fits above the buttons. */
const renderLoadedScene = async (
  approve: () => Promise<void>
): Promise<RenderResult> => {
  const rendered = await renderScene(async () => fakeLobby(approve))
  layOutWarning(rendered, 400)
  return rendered
}

describe('EdgeLoginScene', () => {
  it('should render with loading props', () => {
    const rootState: FakeState = { ...fakeRootState, core: { account } }

    const rendered = render(
      <FakeProviders initialState={rootState}>
        <EdgeLoginScene
          {...fakeEdgeAppSceneProps('edgeLogin', {
            lobbyId: 'AmNsSBDVeF2837'
          })}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('shows the warning and both actions once the request loads', async () => {
    const rendered = await renderLoadedScene(async () => {})

    rendered.getByText('Fake App')
    rendered.getByText(lstrings.edge_login_warning_title)
    rendered.getByText(lstrings.edge_login_warning_irreversible)
    rendered.getByText(lstrings.edge_login_warning_do_not_approve)
    rendered.getByText('Grant Full Access (5)')
    rendered.getByText(lstrings.string_deny)
    rendered.unmount()
  })

  it('blocks Grant Full Access during the countdown', async () => {
    const approve = jest.fn(async () => {})
    const rendered = await renderLoadedScene(approve)

    await advanceSeconds(4)
    fireEvent.press(rendered.getByText('Grant Full Access (1)'))
    await flush()

    expect(approve).not.toHaveBeenCalled()
    rendered.unmount()
  })

  it('approves the login once the countdown ends', async () => {
    const approve = jest.fn(async () => {})
    const rendered = await renderLoadedScene(approve)

    await advanceSeconds(5)
    fireEvent.press(rendered.getByText(lstrings.edge_login_grant_access_button))
    await flush()

    expect(approve).toHaveBeenCalledTimes(1)
    rendered.unmount()
  })

  it('counts whole seconds from when the request loads', async () => {
    let resolveLobby = (lobby: EdgeLobby): void => {}
    const rendered = await renderScene(
      async () =>
        await new Promise<EdgeLobby>(resolve => {
          resolveLobby = resolve
        })
    )

    await advanceSeconds(3)
    resolveLobby(fakeLobby(async () => {}))
    await flush()
    layOutWarning(rendered, 400)
    rendered.getByText('Grant Full Access (5)')

    await act(async () => {
      await jest.advanceTimersByTimeAsync(999)
    })
    rendered.getByText('Grant Full Access (5)')
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1)
    })
    rendered.getByText('Grant Full Access (4)')
    rendered.unmount()
  })

  it('waits for the end of a tall warning to scroll into view', async () => {
    const rendered = await renderScene(async () => fakeLobby(async () => {}))
    layOutWarning(rendered, 800)

    await advanceSeconds(5)
    rendered.getByText('Grant Full Access (5)')

    scrollTo(rendered, 200)
    await advanceSeconds(1)
    rendered.getByText('Grant Full Access (5)')

    scrollTo(rendered, 300)
    await advanceSeconds(1)
    rendered.getByText('Grant Full Access (4)')
    rendered.unmount()
  })

  it('allows Deny during the countdown without approving', async () => {
    const approve = jest.fn(async () => {})
    const goBack = jest.spyOn(fakeNavigation, 'goBack')
    goBack.mockClear()
    const rendered = await renderLoadedScene(approve)

    fireEvent.press(rendered.getByText(lstrings.string_deny))
    await flush()

    expect(goBack).toHaveBeenCalledTimes(1)
    expect(approve).not.toHaveBeenCalled()
    rendered.unmount()
  })
})

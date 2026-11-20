import { beforeEach, describe, expect, it, jest } from '@jest/globals'
import {
  act,
  fireEvent,
  render,
  type RenderResult
} from '@testing-library/react-native'
import * as React from 'react'
import { check, type PermissionStatus, request } from 'react-native-permissions'
import { useStore } from 'react-redux'
import type { Store } from 'redux'

import { writeContactsPermissionShown } from '../../actions/LocalSettingsActions'
import { ContactListModal } from '../../components/modals/ContactListModal'
import type { RootState } from '../../reducers/RootReducer'
import type { GuiContact } from '../../types/types'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders, type FakeState } from '../../util/fake/FakeProviders'

jest.mock('../../actions/LocalSettingsActions', () => ({
  ...jest.requireActual<object>('../../actions/LocalSettingsActions'),
  writeContactsPermissionShown: jest.fn(async () => ({}))
}))

const mockCheck = check as jest.MockedFunction<typeof check>
const mockRequest = request as jest.MockedFunction<typeof request>
const mockWriteShown = writeContactsPermissionShown as jest.MockedFunction<
  typeof writeContactsPermissionShown
>

const CARD_TITLE = 'Access to Contacts'
const GRANT_ROW = 'Grant Contacts Access'
const INPUT_ID = 'Enter a Payee.textInput'

const kate: GuiContact = {
  givenName: 'Kate',
  familyName: 'Bell',
  hasThumbnail: false,
  thumbnailPath: '',
  company: null,
  displayName: null
}

interface Rendered {
  rendered: RenderResult
  store: () => Store<RootState>
}

function renderModal(
  contacts: PermissionStatus,
  contactsPermissionShown: boolean
): Rendered {
  const fakeAccount: any = { disklet: { getText: async () => '' } }
  const initialState: FakeState = {
    core: { account: fakeAccount },
    permissions: { contacts },
    ui: { settings: { contactsPermissionShown } }
  }

  let store: Store<RootState> | undefined
  const StoreSpy: React.FC = () => {
    store = useStore<RootState>()
    return null
  }

  const rendered = render(
    <FakeProviders initialState={initialState}>
      <StoreSpy />
      <ContactListModal
        bridge={fakeAirshipBridge}
        contactType="Payee"
        contactName=""
      />
    </FakeProviders>
  )

  return {
    rendered,
    store: () => {
      if (store == null) throw new Error('Store not captured')
      return store
    }
  }
}

describe('ContactListModal', () => {
  beforeEach(() => {
    mockCheck.mockReset()
    mockRequest.mockReset()
    mockWriteShown.mockClear()
  })

  it('shows no permission header with granted access', () => {
    const { rendered } = renderModal('granted', false)

    expect(rendered.queryByText(CARD_TITLE)).toBeNull()
    expect(rendered.queryByText(GRANT_ROW)).toBeNull()
    expect(rendered.getByTestId(INPUT_ID).props.autoFocus).toBe(true)
    rendered.unmount()
  })

  it('shows no permission header with limited access', () => {
    const { rendered } = renderModal('limited', false)

    expect(rendered.queryByText(CARD_TITLE)).toBeNull()
    expect(rendered.queryByText(GRANT_ROW)).toBeNull()
    rendered.unmount()
  })

  it('shows the card without focusing the field before an answer', () => {
    const { rendered } = renderModal('denied', false)

    expect(rendered.getByText(CARD_TITLE)).toBeTruthy()
    expect(rendered.queryByText(GRANT_ROW)).toBeNull()
    expect(rendered.getByTestId(INPUT_ID).props.autoFocus).toBe(false)
    rendered.unmount()
  })

  it('shows the compact row once the user has answered', () => {
    const { rendered } = renderModal('blocked', true)

    expect(rendered.queryByText(CARD_TITLE)).toBeNull()
    expect(rendered.getByText(GRANT_ROW)).toBeTruthy()
    expect(rendered.getByTestId(INPUT_ID).props.autoFocus).toBe(true)
    rendered.unmount()
  })

  it('swaps the card for the row and saves the answer on Deny', async () => {
    const { rendered, store } = renderModal('denied', false)

    await act(async () => {
      fireEvent.press(rendered.getByText('Deny'))
    })

    expect(rendered.queryByText(CARD_TITLE)).toBeNull()
    expect(rendered.getByText(GRANT_ROW)).toBeTruthy()
    expect(mockWriteShown).toHaveBeenCalledWith(expect.anything(), true)
    expect(store().getState().ui.settings.contactsPermissionShown).toBe(true)
    expect(mockRequest).not.toHaveBeenCalled()
    rendered.unmount()
  })

  it('lists contacts that load after Allow without typing', async () => {
    let answered = false
    mockCheck.mockImplementation(async () => (answered ? 'granted' : 'denied'))
    mockRequest.mockImplementation(async () => {
      answered = true
      return 'granted'
    })
    const { rendered, store } = renderModal('denied', false)

    await act(async () => {
      fireEvent.press(rendered.getByText('Allow'))
    })

    expect(store().getState().permissions.contacts).toBe('granted')
    expect(rendered.queryByText(CARD_TITLE)).toBeNull()
    expect(rendered.queryByText(GRANT_ROW)).toBeNull()

    // The contacts loader fills the list once access is granted:
    act(() => {
      store().dispatch({
        type: 'CONTACTS/LOAD_CONTACTS_SUCCESS',
        data: { contacts: [kate] }
      })
    })

    expect(rendered.getByText('Kate Bell')).toBeTruthy()
    rendered.unmount()
  })
})

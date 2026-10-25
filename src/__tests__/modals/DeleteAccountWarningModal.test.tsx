import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
import * as React from 'react'

import { DeleteAccountWarningModal } from '../../components/modals/DeleteAccountWarningModal'
import { lstrings } from '../../locales/strings'
import { config } from '../../theme/appConfig'
import { fakeAirshipBridge } from '../../util/fake/fakeAirshipBridge'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { openBrowserUri } from '../../util/WebUtils'

jest.mock('../../util/WebUtils', () => ({
  openBrowserUri: jest.fn(async () => {})
}))

describe('DeleteAccountWarningModal', () => {
  it('should render the warning copy', () => {
    const rendered = render(
      <FakeProviders>
        <DeleteAccountWarningModal bridge={fakeAirshipBridge} />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    expect(
      rendered.getByText(lstrings.delete_account_move_funds_warning)
    ).toBeTruthy()
    expect(
      rendered.getByText(lstrings.delete_account_understand_impact)
    ).toBeTruthy()
    expect(rendered.queryByText(lstrings.string_continue)).toBeNull()
    rendered.unmount()
  })

  it('should open the support article from the link', () => {
    const rendered = render(
      <FakeProviders>
        <DeleteAccountWarningModal bridge={fakeAirshipBridge} />
      </FakeProviders>
    )

    fireEvent.press(rendered.getByText('https://support.edge.app'))
    expect(openBrowserUri).toHaveBeenCalledWith(
      config.deleteAccountSupportUrl ?? config.supportSite
    )
    rendered.unmount()
  })

  it('should continue once the impact is acknowledged', async () => {
    const resolve = jest.fn()
    const bridge = { ...fakeAirshipBridge, resolve }
    const rendered = render(
      <FakeProviders>
        <DeleteAccountWarningModal bridge={bridge} />
      </FakeProviders>
    )

    fireEvent.press(
      rendered.getByText(lstrings.delete_account_understand_impact)
    )
    fireEvent.press(rendered.getByText(lstrings.string_continue))
    await waitFor(() => {
      expect(resolve).toHaveBeenCalledWith(true)
    })
    rendered.unmount()
  })
})

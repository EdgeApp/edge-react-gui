import { describe, expect, it, jest } from '@jest/globals'
import { act, fireEvent, render } from '@testing-library/react-native'
import * as React from 'react'

import { BalanceCard } from '../../components/cards/BalanceCard'
import { Airship } from '../../components/services/AirshipInstance'
import { lstrings } from '../../locales/strings'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeNavigation } from '../../util/fake/fakeSceneProps'

describe('BalanceCard', () => {
  it('should render with loading props', () => {
    const rendered = render(
      <FakeProviders>
        <BalanceCard navigation={fakeNavigation} />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it.each([lstrings.fragment_send_subtitle, lstrings.loan_fragment_deposit])(
    'opens one modal when %s is tapped repeatedly',
    async label => {
      let closeModal: (result: undefined) => void = () => {}
      const showSpy = jest.spyOn(Airship, 'show').mockImplementation(
        async () =>
          await new Promise(resolve => {
            closeModal = resolve
          })
      )
      const rendered = render(
        <FakeProviders>
          <BalanceCard navigation={fakeNavigation} />
        </FakeProviders>
      )

      fireEvent.press(rendered.getByText(label))
      await act(async () => {
        await Promise.resolve()
      })
      fireEvent.press(rendered.getByText(label))
      expect(showSpy).toHaveBeenCalledTimes(1)

      await act(async () => {
        closeModal(undefined)
        await Promise.resolve()
      })
      showSpy.mockRestore()
      rendered.unmount()
    }
  )
})

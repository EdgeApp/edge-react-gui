import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { RecoveryDetailsText } from '../../components/text/RecoveryDetailsText'
import { FakeProviders } from '../../util/fake/FakeProviders'

describe('RecoveryDetailsText', () => {
  it('should bold the labels of a labelled seed and key', () => {
    const rendered = render(
      <FakeProviders>
        <RecoveryDetailsText
          text={'Seed Phrase:\nlaugh smart size\n\nPrivate Key:\na9f2ca700c6e'}
        />
      </FakeProviders>
    )

    expect(rendered.getByText('Seed Phrase:')).toBeTruthy()
    expect(rendered.getByText('Private Key:')).toBeTruthy()
    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })

  it('should render an unlabelled key as plain text', () => {
    const rendered = render(
      <FakeProviders>
        <RecoveryDetailsText text="gym small island finger talent appear" />
      </FakeProviders>
    )

    expect(
      rendered.getByText('gym small island finger talent appear')
    ).toBeTruthy()
    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})

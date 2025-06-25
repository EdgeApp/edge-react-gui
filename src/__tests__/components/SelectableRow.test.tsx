import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { SelectableRow } from '../../components/themed/SelectableRow'
import { FakeProviders } from '../../util/fake/FakeProviders'

describe('SelectableRow', () => {
  it('should render with loading props', () => {
    const rendered = render(
      <FakeProviders>
        <SelectableRow onPress={() => undefined} title="title" />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})

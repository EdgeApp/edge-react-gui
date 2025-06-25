import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render } from '@testing-library/react-native'
import { Mock } from 'jest-mock' // Import Mock type from jest-mock if needed
import * as React from 'react'
import { View } from 'react-native'

import { EdgeCard } from '../../components/cards/EdgeCard'
import { EdgeRow } from '../../components/rows/EdgeRow'
import { FakeProviders } from '../../util/fake/FakeProviders'

const testIconUri = 'https://content.edge.app/currencyIconsV3/bitcoin/bitcoin.png'
const testColor = '#FF0000'

describe('RowUi4', () => {
  it('should render a basic row', () => {
    const rendered = render(
      <FakeProviders>
        <EdgeRow title="title" body="body" />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('should render a row with a right button', () => {
    const rendered = render(
      <FakeProviders>
        <EdgeRow title="Row (editable)" body="body" rightButtonType="editable" />
        <EdgeRow title="Row (questionable)" body="body" rightButtonType="questionable" />
        <EdgeRow title="Row (touchable)" body="body" rightButtonType="touchable" />
        <EdgeRow title="Row (delete)" body="body" rightButtonType="delete" />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('should render a row in a card', () => {
    const rendered = render(
      <FakeProviders>
        <EdgeCard>
          <EdgeRow title="title" body="body" />
        </EdgeCard>
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('should handle press events', async () => {
    const mockOnPress: Mock<() => void | Promise<void>> = jest.fn()

    const rendered = render(
      <FakeProviders>
        <EdgeRow body="This row is clickable" rightButtonType="touchable" testID="row" title="Clickable Row" onPress={mockOnPress} />
      </FakeProviders>
    )

    const node = await rendered.findByTestId('row')
    fireEvent.press(node)
    expect(mockOnPress).toHaveBeenCalled()

    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('renders correctly with an icon', () => {
    const rendered = render(
      <FakeProviders>
        <EdgeRow title="Row with Icon" body="This row has an icon" icon={testIconUri} />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('renders correctly with an icon in a flex view', () => {
    const rendered = render(
      <FakeProviders>
        <View style={{ flex: 1 }}>
          <EdgeRow title="Row with Icon" body="This row has an icon" icon={testIconUri} />
        </View>
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('renders correctly with multiple rows in a flex: 1 View', () => {
    const rendered = render(
      <FakeProviders>
        <View style={{ flex: 1 }}>
          <EdgeRow title="title" body="body" />
          <EdgeRow title="Row with Icon" body="This row has an icon" icon={testIconUri} />
          <EdgeRow title="Row with Icon (editable)" body="This row has an icon" icon={testIconUri} rightButtonType="editable" />
          <EdgeRow title="Row with Icon (questionable)" body="This row has an icon" icon={testIconUri} rightButtonType="questionable" />
          <EdgeRow title="Row with Icon (touchable)" body="This row has an icon" icon={testIconUri} rightButtonType="touchable" />
          <EdgeRow title="Row with Icon (delete)" body="This row has an icon" icon={testIconUri} rightButtonType="delete" />
        </View>
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('renders correctly with flex: 1 children', () => {
    const rendered = render(
      <FakeProviders>
        <EdgeRow title="Flex Children">
          <View style={{ flex: 1, backgroundColor: testColor }} />
        </EdgeRow>
        <EdgeRow title="Icon w/ Flex Children" icon={testIconUri}>
          <View style={{ flex: 1, backgroundColor: testColor }} />
        </EdgeRow>
        <EdgeRow title="Copy w/ Flex Children" icon={testIconUri} rightButtonType="copy">
          <View style={{ flex: 1, backgroundColor: testColor }} />
        </EdgeRow>
        <EdgeRow title="Delete w/ Flex Children" icon={testIconUri} rightButtonType="delete">
          <View style={{ flex: 1, backgroundColor: testColor }} />
        </EdgeRow>
        <EdgeRow title="Questionable w/ Flex Children" icon={testIconUri} rightButtonType="questionable">
          <View style={{ flex: 1, backgroundColor: testColor }} />
        </EdgeRow>
        <EdgeRow title="Editable w/ Flex Children" icon={testIconUri} rightButtonType="editable">
          <View style={{ flex: 1, backgroundColor: testColor }} />
        </EdgeRow>
        <EdgeRow title="Touchable w/ Flex Children" icon={testIconUri} rightButtonType="touchable">
          <View style={{ flex: 1, backgroundColor: testColor }} />
        </EdgeRow>
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })
})

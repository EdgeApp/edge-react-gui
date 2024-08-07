import { describe, expect, it, jest } from '@jest/globals'
import { Mock } from 'jest-mock' // Import Mock type from jest-mock if needed
import * as React from 'react'
import { View } from 'react-native'
import TestRenderer from 'react-test-renderer'

import { EdgeCard } from '../../components/cards/EdgeCard'
import { EdgeTouchableOpacity } from '../../components/common/EdgeTouchableOpacity'
import { EdgeRow } from '../../components/rows/EdgeRow'
import { FakeProviders } from '../../util/fake/FakeProviders'

const testIconUri = 'https://content.edge.app/currencyIconsV3/bitcoin/bitcoin.png'
const testColor = '#FF0000'

describe('RowUi4', () => {
  it('should render a basic row', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <EdgeRow title="title" body="body" />
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('should render a row with a right button', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <EdgeRow title="Row (editable)" body="body" rightButtonType="editable" />
        <EdgeRow title="Row (questionable)" body="body" rightButtonType="questionable" />
        <EdgeRow title="Row (touchable)" body="body" rightButtonType="touchable" />
        <EdgeRow title="Row (delete)" body="body" rightButtonType="delete" />
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('should render a row in a card', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <EdgeCard>
          <EdgeRow title="title" body="body" />
        </EdgeCard>
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('triggers onPress/onLongPress event when clicked', () => {
    const mockOnPress: Mock<() => void | Promise<void>> = jest.fn()
    const mockOnLongPress: Mock<() => void | Promise<void>> = jest.fn()

    const renderer = TestRenderer.create(
      <FakeProviders>
        <EdgeRow title="Clickable Row" body="This row is clickable" onPress={mockOnPress} onLongPress={mockOnLongPress} rightButtonType="touchable" />
      </FakeProviders>
    )

    renderer.root.findByType(EdgeTouchableOpacity).props.onPress()
    expect(mockOnPress).toHaveBeenCalled()

    renderer.root.findByType(EdgeTouchableOpacity).props.onLongPress()
    expect(mockOnLongPress).toHaveBeenCalled()

    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('renders correctly with an icon', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <EdgeRow title="Row with Icon" body="This row has an icon" icon={testIconUri} />
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('renders correctly with an icon in a flex view', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <View style={{ flex: 1 }}>
          <EdgeRow title="Row with Icon" body="This row has an icon" icon={testIconUri} />
        </View>
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('renders correctly with multiple rows in a flex: 1 View', () => {
    const renderer = TestRenderer.create(
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
    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('renders correctly with flex: 1 children', () => {
    const renderer = TestRenderer.create(
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
    expect(renderer.toJSON()).toMatchSnapshot()
  })
})

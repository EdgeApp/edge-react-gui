import { describe, expect, it, jest } from '@jest/globals'
import { Mock } from 'jest-mock' // Import Mock type from jest-mock if needed
import * as React from 'react'
import { View } from 'react-native'
import TestRenderer from 'react-test-renderer'

import { EdgeCard } from '../../components/cards/EdgeCard'
import { EdgeTouchableOpacity } from '../../components/common/EdgeTouchableOpacity'
import { RowUi4 } from '../../components/ui4/RowUi4'
import { FakeProviders } from '../../util/fake/FakeProviders'

const testIconUri = 'https://content.edge.app/currencyIconsV3/bitcoin/bitcoin.png'
const testColor = '#FF0000'

describe('RowUi4', () => {
  it('should render a basic row', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <RowUi4 title="title" body="body" />
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('should render a row with a right button', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <RowUi4 title="Row (editable)" body="body" rightButtonType="editable" />
        <RowUi4 title="Row (questionable)" body="body" rightButtonType="questionable" />
        <RowUi4 title="Row (touchable)" body="body" rightButtonType="touchable" />
        <RowUi4 title="Row (delete)" body="body" rightButtonType="delete" />
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('should render a row in a card', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <EdgeCard>
          <RowUi4 title="title" body="body" />
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
        <RowUi4 title="Clickable Row" body="This row is clickable" onPress={mockOnPress} onLongPress={mockOnLongPress} rightButtonType="touchable" />
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
        <RowUi4 title="Row with Icon" body="This row has an icon" icon={testIconUri} />
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('renders correctly with an icon in a flex view', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <View style={{ flex: 1 }}>
          <RowUi4 title="Row with Icon" body="This row has an icon" icon={testIconUri} />
        </View>
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('renders correctly with multiple rows in a flex: 1 View', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <View style={{ flex: 1 }}>
          <RowUi4 title="title" body="body" />
          <RowUi4 title="Row with Icon" body="This row has an icon" icon={testIconUri} />
          <RowUi4 title="Row with Icon (editable)" body="This row has an icon" icon={testIconUri} rightButtonType="editable" />
          <RowUi4 title="Row with Icon (questionable)" body="This row has an icon" icon={testIconUri} rightButtonType="questionable" />
          <RowUi4 title="Row with Icon (touchable)" body="This row has an icon" icon={testIconUri} rightButtonType="touchable" />
          <RowUi4 title="Row with Icon (delete)" body="This row has an icon" icon={testIconUri} rightButtonType="delete" />
        </View>
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('renders correctly with flex: 1 children', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <RowUi4 title="Flex Children">
          <View style={{ flex: 1, backgroundColor: testColor }} />
        </RowUi4>
        <RowUi4 title="Icon w/ Flex Children" icon={testIconUri}>
          <View style={{ flex: 1, backgroundColor: testColor }} />
        </RowUi4>
        <RowUi4 title="Copy w/ Flex Children" icon={testIconUri} rightButtonType="copy">
          <View style={{ flex: 1, backgroundColor: testColor }} />
        </RowUi4>
        <RowUi4 title="Delete w/ Flex Children" icon={testIconUri} rightButtonType="delete">
          <View style={{ flex: 1, backgroundColor: testColor }} />
        </RowUi4>
        <RowUi4 title="Questionable w/ Flex Children" icon={testIconUri} rightButtonType="questionable">
          <View style={{ flex: 1, backgroundColor: testColor }} />
        </RowUi4>
        <RowUi4 title="Editable w/ Flex Children" icon={testIconUri} rightButtonType="editable">
          <View style={{ flex: 1, backgroundColor: testColor }} />
        </RowUi4>
        <RowUi4 title="Touchable w/ Flex Children" icon={testIconUri} rightButtonType="touchable">
          <View style={{ flex: 1, backgroundColor: testColor }} />
        </RowUi4>
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })
})

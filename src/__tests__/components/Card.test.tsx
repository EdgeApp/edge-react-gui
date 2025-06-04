import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render } from '@testing-library/react-native'
import { Mock } from 'jest-mock' // Import Mock type from jest-mock if needed
import * as React from 'react'
import { View } from 'react-native'

import { EdgeCard } from '../../components/cards/EdgeCard'
import { EdgeText } from '../../components/themed/EdgeText'
import { FakeProviders } from '../../util/fake/FakeProviders'

const testColors = ['#4c669f', '#3b5998', '#192f6a']
const testIconUri = 'https://content.edge.app/currencyIconsV3/bitcoin/bitcoin.png'

describe('Card', () => {
  it('should render with gradient background', () => {
    const gradientProps = {
      colors: testColors,
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 }
    }
    const rendered = render(
      <FakeProviders>
        <EdgeCard gradientBackground={gradientProps}>
          <EdgeText>Gradient Background</EdgeText>
        </EdgeCard>
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('should render with node background', () => {
    const nodeBackground = <View style={{ height: 100, width: 100, backgroundColor: testColors[0] }} />
    const rendered = render(
      <FakeProviders>
        <EdgeCard nodeBackground={nodeBackground}>
          <EdgeText>Node Background</EdgeText>
        </EdgeCard>
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('should render with icon URI', () => {
    const rendered = render(
      <FakeProviders>
        <EdgeCard icon={testIconUri}>
          <EdgeText>Icon</EdgeText>
        </EdgeCard>
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('should render sections correctly with multiple children', () => {
    const rendered = render(
      <FakeProviders>
        <EdgeCard sections>
          <EdgeText>Section 1</EdgeText>
          <EdgeText>Section 2</EdgeText>
        </EdgeCard>
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('should handle press events', async () => {
    const mockOnPress: Mock<() => void | Promise<void>> = jest.fn()
    const mockOnLongPress: Mock<() => void | Promise<void>> = jest.fn()

    const rendered = render(
      <FakeProviders>
        <EdgeCard onPress={mockOnPress} onLongPress={mockOnLongPress} testID="card">
          <EdgeText>Press Me</EdgeText>
        </EdgeCard>
      </FakeProviders>
    )

    const node = await rendered.findByTestId('card')
    fireEvent.press(node)
    expect(mockOnPress).toHaveBeenCalled()

    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('should expand to fill its parent container', () => {
    const rendered = render(
      <FakeProviders>
        <View style={{ flex: 1 }}>
          <EdgeCard>
            <EdgeText>Child Content</EdgeText>
          </EdgeCard>
        </View>
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('should allow child elements to expand within the card', () => {
    const rendered = render(
      <FakeProviders>
        <EdgeCard>
          <View style={{ flex: 1, backgroundColor: testColors[0] }}>
            <EdgeText>Expanding Child</EdgeText>
          </View>
        </EdgeCard>
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('should expand both the card and its children to fill available space', () => {
    const rendered = render(
      <FakeProviders>
        <View style={{ flex: 1 }}>
          <EdgeCard fill>
            <View style={{ flex: 1, backgroundColor: testColors[0] }}>
              <EdgeText>Expanding Child in Expanding Card</EdgeText>
            </View>
          </EdgeCard>
        </View>
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })
})

import { describe, expect, it, jest } from '@jest/globals'
import { Mock } from 'jest-mock' // Import Mock type from jest-mock if needed
import * as React from 'react'
import { TouchableOpacity, View } from 'react-native'
import FastImage from 'react-native-fast-image'
import TestRenderer from 'react-test-renderer'

import { EdgeText } from '../../components/themed/EdgeText'
import { ButtonsViewUi4 } from '../../components/ui4/ButtonsViewUi4'
import { ButtonUi4 } from '../../components/ui4/ButtonUi4'
import { FakeProviders } from '../../util/fake/FakeProviders'

const testIconUri = 'https://content.edge.app/currencyIconsV3/bitcoin/bitcoin.png'

describe('Buttons', () => {
  it('should render simple loose buttons', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <ButtonUi4 label="Primary" type="primary" />
        <ButtonUi4 label="Secondary" type="secondary" />
        <ButtonUi4 label="Tertiary" type="tertiary" />
        <ButtonUi4 label="Primary (mini)" type="primary" mini />
        <ButtonUi4 label="Secondary (mini)" type="secondary" mini />
        <ButtonUi4 label="Tertiary (mini)" type="tertiary" mini />
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('should render spinning buttons', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <ButtonUi4 label="Primary" type="primary" spinner />
        <ButtonUi4 label="Secondary" type="secondary" spinner />
        <ButtonUi4 label="Tertiary" type="tertiary" spinner />
        <ButtonUi4 label="Primary (mini)" type="primary" mini spinner />
        <ButtonUi4 label="Secondary (mini)" type="secondary" mini spinner />
        <ButtonUi4 label="Tertiary (mini)" type="tertiary" mini spinner />
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('should render with child icons', () => {
    const icon = <FastImage source={{ uri: testIconUri }} />

    const renderer = TestRenderer.create(
      <FakeProviders>
        <ButtonUi4 label="Primary" type="primary">
          {icon}
        </ButtonUi4>
        <ButtonUi4 label="Secondary" type="secondary">
          {icon}
        </ButtonUi4>
        <ButtonUi4 label="Tertiary" type="tertiary">
          {icon}
        </ButtonUi4>
        <ButtonUi4 label="Primary (mini)" type="primary" mini>
          {icon}
        </ButtonUi4>
        <ButtonUi4 label="Secondary (mini)" type="secondary" mini>
          {icon}
        </ButtonUi4>
        <ButtonUi4 label="Tertiary (mini)" type="tertiary" mini>
          {icon}
        </ButtonUi4>

        <ButtonUi4 label="Primary" type="primary" spinner>
          {icon}
        </ButtonUi4>
        <ButtonUi4 label="Secondary" type="secondary" spinner>
          {icon}
        </ButtonUi4>
        <ButtonUi4 label="Tertiary" type="tertiary" spinner>
          {icon}
        </ButtonUi4>
        <ButtonUi4 label="Primary (mini)" type="primary" mini spinner>
          {icon}
        </ButtonUi4>
        <ButtonUi4 label="Secondary (mini)" type="secondary" mini spinner>
          {icon}
        </ButtonUi4>
        <ButtonUi4 label="Tertiary (mini)" type="tertiary" mini spinner>
          {icon}
        </ButtonUi4>
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('should handle onPress events', () => {
    const mockOnPress: Mock<() => void | Promise<void>> = jest.fn()

    // Press enabled
    const testRenderer = TestRenderer.create(
      <FakeProviders>
        <ButtonUi4 onPress={mockOnPress}>
          <EdgeText>Press Me</EdgeText>
        </ButtonUi4>
      </FakeProviders>
    )

    testRenderer.root.findByType(TouchableOpacity).props.onPress()
    expect(mockOnPress).toHaveBeenCalled()

    // TODO: Use @testing-library to simulate a real press event to test
    // disabled states
  })

  it('should render in a ButtonsView in a column layout with 1 buttons', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <ButtonsViewUi4 primary={{ label: 'Primary', onPress: () => {} }} secondary={{ label: 'Secondary', onPress: () => {} }} />
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('should render in a ButtonsView in a column layout with 2 buttons', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <ButtonsViewUi4 primary={{ label: 'Primary', onPress: () => {} }} secondary={{ label: 'Secondary', onPress: () => {} }} />
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('should render in a ButtonsView in a column layout with 3 buttons', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <ButtonsViewUi4
          primary={{ label: 'Primary', onPress: () => {} }}
          secondary={{ label: 'Secondary', onPress: () => {} }}
          tertiary={{ label: 'Tertiary', onPress: () => {} }}
        />
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('should render in a ButtonsView in a row layout with 1 buttons', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <ButtonsViewUi4 primary={{ label: 'Primary', onPress: () => {} }} secondary={{ label: 'Secondary', onPress: () => {} }} layout="row" />
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('should render in a ButtonsView in a row layout with 2 buttons', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <ButtonsViewUi4 primary={{ label: 'Primary', onPress: () => {} }} secondary={{ label: 'Secondary', onPress: () => {} }} layout="row" />
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('should render in a ButtonsView in a row layout with 3 buttons', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <ButtonsViewUi4
          primary={{ label: 'Primary', onPress: () => {} }}
          secondary={{ label: 'Secondary', onPress: () => {} }}
          tertiary={{ label: 'Tertiary', onPress: () => {} }}
          layout="row"
        />
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('should render in a ButtonsView in a column layout in a flex:1 View', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <View style={{ flex: 1 }}>
          <ButtonsViewUi4
            primary={{ label: 'Primary', onPress: () => {} }}
            secondary={{ label: 'Secondary', onPress: () => {} }}
            tertiary={{ label: 'Tertiary', onPress: () => {} }}
            layout="column"
          />
          <ButtonsViewUi4 primary={{ label: 'Primary', onPress: () => {} }} layout="column" />
        </View>
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })

  it('should render in a ButtonsView in a row layout in a flex:1 View', () => {
    const renderer = TestRenderer.create(
      <FakeProviders>
        <View style={{ flex: 1 }}>
          <ButtonsViewUi4
            primary={{ label: 'Primary', onPress: () => {} }}
            secondary={{ label: 'Secondary', onPress: () => {} }}
            tertiary={{ label: 'Tertiary', onPress: () => {} }}
            layout="row"
          />
          <ButtonsViewUi4 primary={{ label: 'Primary', onPress: () => {} }} layout="row" />
        </View>
      </FakeProviders>
    )
    expect(renderer.toJSON()).toMatchSnapshot()
  })
})

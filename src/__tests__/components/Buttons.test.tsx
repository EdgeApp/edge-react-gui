import { describe, expect, it, jest } from '@jest/globals'
import { fireEvent, render } from '@testing-library/react-native'
import { Mock } from 'jest-mock' // Import Mock type from jest-mock if needed
import * as React from 'react'
import { View } from 'react-native'
import FastImage from 'react-native-fast-image'

import { ButtonsView } from '../../components/buttons/ButtonsView'
import { EdgeButton } from '../../components/buttons/EdgeButton'
import { EdgeText } from '../../components/themed/EdgeText'
import { FakeProviders } from '../../util/fake/FakeProviders'

const testIconUri = 'https://content.edge.app/currencyIconsV3/bitcoin/bitcoin.png'

describe('Buttons', () => {
  it('should render simple loose buttons', () => {
    const rendered = render(
      <FakeProviders>
        <EdgeButton label="Primary" type="primary" />
        <EdgeButton label="Secondary" type="secondary" />
        <EdgeButton label="Tertiary" type="tertiary" />
        <EdgeButton label="Primary (mini)" type="primary" mini />
        <EdgeButton label="Secondary (mini)" type="secondary" mini />
        <EdgeButton label="Tertiary (mini)" type="tertiary" mini />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('should render spinning buttons', () => {
    const rendered = render(
      <FakeProviders>
        <EdgeButton label="Primary" type="primary" spinner />
        <EdgeButton label="Secondary" type="secondary" spinner />
        <EdgeButton label="Tertiary" type="tertiary" spinner />
        <EdgeButton label="Primary (mini)" type="primary" mini spinner />
        <EdgeButton label="Secondary (mini)" type="secondary" mini spinner />
        <EdgeButton label="Tertiary (mini)" type="tertiary" mini spinner />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('should render with child icons', () => {
    const icon = <FastImage source={{ uri: testIconUri }} />

    const rendered = render(
      <FakeProviders>
        <EdgeButton label="Primary" type="primary">
          {icon}
        </EdgeButton>
        <EdgeButton label="Secondary" type="secondary">
          {icon}
        </EdgeButton>
        <EdgeButton label="Tertiary" type="tertiary">
          {icon}
        </EdgeButton>
        <EdgeButton label="Primary (mini)" type="primary" mini>
          {icon}
        </EdgeButton>
        <EdgeButton label="Secondary (mini)" type="secondary" mini>
          {icon}
        </EdgeButton>
        <EdgeButton label="Tertiary (mini)" type="tertiary" mini>
          {icon}
        </EdgeButton>

        <EdgeButton label="Primary" type="primary" spinner>
          {icon}
        </EdgeButton>
        <EdgeButton label="Secondary" type="secondary" spinner>
          {icon}
        </EdgeButton>
        <EdgeButton label="Tertiary" type="tertiary" spinner>
          {icon}
        </EdgeButton>
        <EdgeButton label="Primary (mini)" type="primary" mini spinner>
          {icon}
        </EdgeButton>
        <EdgeButton label="Secondary (mini)" type="secondary" mini spinner>
          {icon}
        </EdgeButton>
        <EdgeButton label="Tertiary (mini)" type="tertiary" mini spinner>
          {icon}
        </EdgeButton>
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('should handle press events', async () => {
    const mockOnPress: Mock<() => void | Promise<void>> = jest.fn()

    // Press enabled
    const rendered = render(
      <FakeProviders>
        <EdgeButton testID="button" onPress={mockOnPress}>
          <EdgeText>Press Me</EdgeText>
        </EdgeButton>
      </FakeProviders>
    )

    const node = await rendered.getByTestId('button')
    fireEvent.press(node)
    expect(mockOnPress).toHaveBeenCalled()

    // TODO: test disabled states
  })

  it('should render in a ButtonsView in a column layout with 1 buttons', () => {
    const rendered = render(
      <FakeProviders>
        <ButtonsView primary={{ label: 'Primary', onPress: () => {} }} secondary={{ label: 'Secondary', onPress: () => {} }} />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('should render in a ButtonsView in a column layout with 2 buttons', () => {
    const rendered = render(
      <FakeProviders>
        <ButtonsView primary={{ label: 'Primary', onPress: () => {} }} secondary={{ label: 'Secondary', onPress: () => {} }} />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('should render in a ButtonsView in a column layout with 3 buttons', () => {
    const rendered = render(
      <FakeProviders>
        <ButtonsView
          primary={{ label: 'Primary', onPress: () => {} }}
          secondary={{ label: 'Secondary', onPress: () => {} }}
          tertiary={{ label: 'Tertiary', onPress: () => {} }}
        />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('should render in a ButtonsView in a row layout with 1 buttons', () => {
    const rendered = render(
      <FakeProviders>
        <ButtonsView primary={{ label: 'Primary', onPress: () => {} }} secondary={{ label: 'Secondary', onPress: () => {} }} layout="row" />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('should render in a ButtonsView in a row layout with 2 buttons', () => {
    const rendered = render(
      <FakeProviders>
        <ButtonsView primary={{ label: 'Primary', onPress: () => {} }} secondary={{ label: 'Secondary', onPress: () => {} }} layout="row" />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('should render in a ButtonsView in a row layout with 3 buttons', () => {
    const rendered = render(
      <FakeProviders>
        <ButtonsView
          primary={{ label: 'Primary', onPress: () => {} }}
          secondary={{ label: 'Secondary', onPress: () => {} }}
          tertiary={{ label: 'Tertiary', onPress: () => {} }}
          layout="row"
        />
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('should render in a ButtonsView in a column layout in a flex:1 View', () => {
    const rendered = render(
      <FakeProviders>
        <View style={{ flex: 1 }}>
          <ButtonsView
            primary={{ label: 'Primary', onPress: () => {} }}
            secondary={{ label: 'Secondary', onPress: () => {} }}
            tertiary={{ label: 'Tertiary', onPress: () => {} }}
            layout="column"
          />
          <ButtonsView primary={{ label: 'Primary', onPress: () => {} }} layout="column" />
        </View>
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })

  it('should render in a ButtonsView in a row layout in a flex:1 View', () => {
    const rendered = render(
      <FakeProviders>
        <View style={{ flex: 1 }}>
          <ButtonsView
            primary={{ label: 'Primary', onPress: () => {} }}
            secondary={{ label: 'Secondary', onPress: () => {} }}
            tertiary={{ label: 'Tertiary', onPress: () => {} }}
            layout="row"
          />
          <ButtonsView primary={{ label: 'Primary', onPress: () => {} }} layout="row" />
        </View>
      </FakeProviders>
    )
    expect(rendered.toJSON()).toMatchSnapshot()
  })
})

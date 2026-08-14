import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { PredictionMarketListScene } from '../../components/scenes/PredictionMarketListScene'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

describe('PredictionMarketListScene', () => {
  it('should render', () => {
    const rendered = render(
      <FakeProviders>
        <PredictionMarketListScene
          {...fakeEdgeAppSceneProps('predictionMarkets', undefined)}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})

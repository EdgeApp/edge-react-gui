import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { PredictionMarketDetailsScene } from '../../components/scenes/PredictionMarketDetailsScene'
import { predictionMarketSampleData } from '../../plugins/prediction-markets/slipstreamSampleData'
import { FakeProviders } from '../../util/fake/FakeProviders'
import { fakeEdgeAppSceneProps } from '../../util/fake/fakeSceneProps'

describe('PredictionMarketDetailsScene', () => {
  it('should render', () => {
    const rendered = render(
      <FakeProviders>
        <PredictionMarketDetailsScene
          {...fakeEdgeAppSceneProps('predictionMarketDetails', {
            market: predictionMarketSampleData.sports[0]
          })}
        />
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})

import { describe, expect, it, jest } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { ChangeMiningFeeComponent } from '../../components/scenes/ChangeMiningFeeScene'
import { getTheme } from '../../components/services/ThemeContext'
import { fakeSceneProps } from '../../util/fake/fakeSceneProps'

describe('Change Mining Fees', () => {
  const onSubmit = jest.fn()
  const wallet: any = {
    currencyInfo: {
      defaultSettings: {
        customFeeSettings: ['satPerByte']
      }
    }
  }
  const guiMakeSpendInfo = {
    publicAddress: 'bitcoincash:qpltjkre069mp80ylcj87832ju3zt2gr6gercn9j2z',
    legacyAddress: '123412341234',
    nativeAmount: '100000',
    currencyCode: 'BCH',
    metadata: {}
  }

  it('should render with standard props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <ChangeMiningFeeComponent
        {...fakeSceneProps('changeMiningFee', {
          wallet,
          guiMakeSpendInfo,
          maxSpendSet: false,
          onSubmit
        })}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})

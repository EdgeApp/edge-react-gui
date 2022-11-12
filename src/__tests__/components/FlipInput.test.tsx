import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { getTheme } from '../../components/services/ThemeContext'
import { FlipInputComponent } from '../../components/themed/FlipInput'

describe('FlipInputComponent', () => {
  it('should render with loading props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <FlipInputComponent
        overridePrimaryDecimalAmount="string"
        // Exchange rate
        exchangeSecondaryToPrimaryRatio="string"
        // Information regarding the primary and secondary field. Mostly related to currency name, code, and denominations
        primaryInfo={'FlipInputFieldInfo' as any}
        secondaryInfo={'FlipInputFieldInfo' as any}
        onNext={() => undefined}
        onFocus={() => undefined}
        onBlur={() => undefined}
        forceUpdateGuiCounter={0}
        // Callback when primaryDecimalAmount changes. **This is only called when the user types into a field or if
        // exchangeSecondaryToPrimaryRatio changes. This does NOT get called when overridePrimaryDecimalAmount is changed by the parent
        onAmountChanged={decimalAmount => undefined}
        isEditable
        isFiatOnTop
        isFocus
        topReturnKeyType="done"
        inputAccessoryViewID="string"
        headerText="string"
        headerCallback={() => undefined}
        keyboardVisible
        flipInputRef={() => undefined}
        theme={getTheme()}
      />
    )

    expect(actual).toMatchSnapshot()
  })
})

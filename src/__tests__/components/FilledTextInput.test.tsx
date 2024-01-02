import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { SearchIconAnimated } from '../../components/icons/ThemedIcons'
import { FilledTextInput } from '../../components/themed/FilledTextInput'

describe('FilledTextInput', () => {
  it('should render with some props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <FilledTextInput
        value="string"
        error="string"
        placeholder="string"
        clearIcon
        multiline
        iconComponent={SearchIconAnimated}
        onBlur={() => undefined}
        onChangeText={() => undefined}
        onClear={() => undefined}
        onFocus={() => undefined}
        // Other React Native TextInput properties:
        autoCapitalize="none"
        autoCorrect
        blurOnSubmit
        inputAccessoryViewID="string"
        keyboardType="default"
        maxLength={11}
        onSubmitEditing={() => undefined}
        returnKeyType="done"
        secureTextEntry={false}
        testID="string"
        autoFocus
        blurOnClear
      />
    )

    expect(actual).toMatchSnapshot()
  })
})

import { describe, expect, it } from '@jest/globals'
import * as React from 'react'
import { createRenderer } from 'react-test-renderer/shallow'

import { OutlinedTextInput } from '../../components/themed/OutlinedTextInput'

describe('OutlinedTextInput', () => {
  it('should render with some props', () => {
    const renderer = createRenderer()

    const actual = renderer.render(
      <OutlinedTextInput
        value="string"
        error="string"
        label="string"
        clearIcon // Defaults to 'true'
        marginRem={0.5} // Defaults to 0.5
        multiline // Defaults to 'false'
        searchIcon // Defaults to 'false'
        onBlur={() => undefined}
        onChangeText={() => undefined}
        onClear={() => undefined}
        onFocus={() => undefined}
        // Other React Native TextInput properties:
        autoCapitalize="none" // Defaults to 'sentences'
        autoCorrect // Defaults to 'true'
        blurOnSubmit // Defaults to 'true'
        inputAccessoryViewID="string"
        keyboardType="default" // Defaults to 'default'
        maxLength={11}
        onSubmitEditing={() => undefined}
        returnKeyType="done" // Defaults to 'done'
        secureTextEntry={false} // Defaults to 'false'
        testID="string"
        autoFocus
        blurOnClear
      />
    )

    expect(actual).toMatchSnapshot()
  })
})

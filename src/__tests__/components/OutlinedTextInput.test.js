/* globals describe it expect */
/* eslint-disable flowtype/require-valid-file-annotation */

import * as React from 'react'
import ShallowRenderer from 'react-test-renderer/shallow'

import { OutlinedTextInput } from '../../components/themed/OutlinedTextInput.js'

describe('OutlinedTextInput', () => {
  it('should render with some props', () => {
    const renderer = new ShallowRenderer()

    const props = {
      value: 'string',
      error: 'string',
      label: 'string',
      clearIcon: true, // Defaults to 'true'
      marginRem: 0.5, // Defaults to 0.5
      multiline: true, // Defaults to 'false'
      searchIcon: true, // Defaults to 'false'

      onBlur: () => undefined,
      onChangeText: () => undefined,
      onClear: () => undefined,
      onFocus: () => undefined,

      // Other React Native TextInput properties:
      autoCapitalize: 'none', // Defaults to 'sentences'
      autoCorrect: true, // Defaults to 'true'
      blurOnSubmit: true, // Defaults to 'true'
      inputAccessoryViewID: 'string',
      keyboardType: 'default', // Defaults to 'default'
      maxLength: 11,
      onSubmitEditing: () => undefined,
      returnKeyType: 'done', // Defaults to 'done'
      secureTextEntry: false, // Defaults to 'false'
      testID: 'string',
      autoFocus: true,
      blurOnClear: true
    }
    const actual = renderer.render(<OutlinedTextInput {...props} />)

    expect(actual).toMatchSnapshot()
  })
})

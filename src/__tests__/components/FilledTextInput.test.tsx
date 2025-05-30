import { describe, expect, it } from '@jest/globals'
import { render } from '@testing-library/react-native'
import * as React from 'react'

import { SearchIconAnimated } from '../../components/icons/ThemedIcons'
import { FilledTextInput } from '../../components/themed/FilledTextInput'
import { FakeProviders } from '../../util/fake/FakeProviders'

describe('FilledTextInput', () => {
  it('should render with some props', () => {
    const rendered = render(
      <FakeProviders>
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
      </FakeProviders>
    )

    expect(rendered.toJSON()).toMatchSnapshot()
    rendered.unmount()
  })
})

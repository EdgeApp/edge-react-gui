// @flow

import React from 'react'
import {Text} from 'react-native'
import {FormattedNumber as FNIntel} from 'react-intl'


class FormattedNumber extends React.Component {

  render () {
    return (
      <FNIntel value={this.props.value}>
        {(number) => (
          <Text>{number}</Text>
        )}
      </FNIntel>
    )
  }
}
export default FormattedNumber

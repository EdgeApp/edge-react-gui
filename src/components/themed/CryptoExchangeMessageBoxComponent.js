// @flow

import * as React from 'react'
import { View } from 'react-native'
import { connect } from 'react-redux'

import s from '../../locales/strings'
import { type Dispatch, type RootState } from '../../types/reduxTypes.js'
import { type Theme, type ThemeProps, cacheStyles, withTheme } from '../services/ThemeContext.js'
import { EdgeText } from './EdgeText'

type StateProps = {
  message: string
}
type Props = StateProps

export class CryptoExchangeMessageBoxComponent extends React.PureComponent<Props & ThemeProps> {
  render() {
    if (!this.props.message) return null
    const styles = getStyles(this.props.theme)

    return (
      <View style={styles.container}>
        <EdgeText style={styles.text} numberOfLines={3}>
          {this.props.message}
        </EdgeText>
      </View>
    )
  }
}

const getStyles = cacheStyles((theme: Theme) => ({
  container: {
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: theme.rem(1),
    paddingHorizontal: theme.rem(1)
  },
  text: {
    color: theme.dangerText,
    textAlign: 'center',
    fontSize: theme.rem(0.75)
  }
}))

export const CryptoExchangeMessageBox = connect(
  (state: RootState): StateProps => {
    const insufficient = state.cryptoExchange.insufficientError
    const genericError = state.cryptoExchange.genericShapeShiftError

    let message = ''

    if (genericError) {
      message = genericError
    } else if (insufficient) {
      message = s.strings.fragment_insufficient_funds
    }

    return {
      message
    }
  },
  (dispatch: Dispatch) => ({})
)(withTheme(CryptoExchangeMessageBoxComponent))

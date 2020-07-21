// @flow

import * as React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import slowlog from 'react-native-slowlog'

import { THEME } from '../../../../theme/variables/airbitz.js'
import { scale } from '../../../../util/scaling.js'

export type Props = {
  message: string,
  useErrorStyle: boolean
}

export class CryptoExchangeMessageBoxComponent extends React.Component<Props> {
  constructor(props: Props) {
    super(props)
    slowlog(this, /.*/, global.slowlogOptions)
  }

  render() {
    const viewStyle = [styles.container, this.props.useErrorStyle ? styles.containerError : null]
    const textStyle = [styles.text, this.props.useErrorStyle ? styles.textError : null]

    return (
      <View style={viewStyle}>
        <Text style={textStyle}>{this.props.message}</Text>
      </View>
    )
  }
}

const rawStyles = {
  container: {
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: scale(26),
    backgroundColor: THEME.COLORS.PRIMARY
  },
  containerError: {
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: scale(26),
    backgroundColor: THEME.COLORS.GRAY_4
  },
  text: {
    color: THEME.COLORS.ACCENT_MINT,
    textAlign: 'center',
    marginRight: '2%',
    marginLeft: '2%'
  },
  textError: {
    color: THEME.COLORS.PRIMARY,
    backgroundColor: THEME.COLORS.TRANSPARENT,
    fontSize: scale(10)
  }
}
const styles: typeof rawStyles = StyleSheet.create(rawStyles)

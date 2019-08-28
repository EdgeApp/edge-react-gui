// @flow

import React from 'react'
import { Text, View } from 'react-native'

import { B } from '../../../../../styles/common/textStyles.js'
import { getObjectDiff } from '../../../../../util/utils'
import style from '../style'

type Props = {
  styles: {
    textStyles: Array<{}>
  },
  name: string,
  denomination: string
}

class WalletNameHeader extends React.Component<Props> {
  shouldComponentUpdate (nextProps: Props) {
    const diffElement = getObjectDiff(this.props, nextProps, { styles: true })
    return !!diffElement
  }

  render () {
    const { styles = {} } = this.props
    const textStyles = styles.textStyles || []
    const name = this.props.name
    const denomination = this.props.denomination

    return (
      <View style={style.headerNameContainer}>
        <Text style={textStyles} ellipsizeMode={'middle'} numberOfLines={1}>
          {name}:<B>{denomination}</B>
        </Text>
      </View>
    )
  }
}
export { WalletNameHeader }

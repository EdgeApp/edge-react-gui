// @flow
import React, {Component} from 'react'
import { View } from 'react-native'
import Gradient from '../../components/Gradient/Gradient.ui.js'
import {RecoverPasswordSceneStyles} from '../../../../styles/indexStyles.js'
type Props = {

}
export default class PasswordRecovery extends Component<Props> {
  render () {
    const styles = RecoverPasswordSceneStyles
    return (
      <View >
        <Gradient style={styles.gradient} />
      </View>
    )
  }
}

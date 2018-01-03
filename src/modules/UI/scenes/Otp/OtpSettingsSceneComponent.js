// @flow
import React, {Component} from 'react'
import { View } from 'react-native'
import {OtpSettingsScreenStyles} from '../../../../styles/indexStyles.js'
import Gradient from '../../components/Gradient/Gradient.ui.js'
type Props = {

}

export default class OtpSettingsSceneComponent extends Component<Props> {
  render () {
    const styles = OtpSettingsScreenStyles
    return (
      <View >
        <Gradient style={styles.gradient} />
      </View>
    )
  }
}

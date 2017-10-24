// @flow
import React, {Component} from 'react'
import {View, Button} from 'react-native'
import StylizedModal from '../../components/Modal/Modal.ui'
import {Icon} from '../../components/Icon/Icon.ui'
import * as Constants from '../../../../constants/indexConstants'
type Props = {
  style: any,
  closeFunction: Function,
  confirmFunction: Function
}
export default class CryptoExchangeConfirmTransactionModalComponent extends Component<Props> {
  renderBottom = (style: any) => {
    return <View style={style.bottom}>
    <Button title={'Confirm'} onPress={this.props.confirmFunction}/>
     </View>
  }
  renderMiddle = (style: any) => {
    return <View style={style.middle}/>
  }
  render () {
    const style = this.props.style
    const icon = <Icon
      style={style.icon}
      name={Constants.THREE_DOT_MENU}
      size={style.iconSize}
      type={Constants.ENTYPO}/>
    return <StylizedModal
      visibilityBoolean={true}
      featuredIcon={icon}
      headerText={'Select time before auto logout'}
      headerSubtext={'Select time before auto logout'}
      modalMiddle={this.renderMiddle(style)}
      modalBottom={this.renderBottom(style)}
      onExitButtonFxn={this.props.closeFunction} />
  }
}

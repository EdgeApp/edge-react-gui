// @flow
import React, {Component} from 'react'
import {View, Text} from 'react-native'
// import {sprintf} from 'sprintf-js'
import StylizedModal from '../../modules/UI/components/Modal/Modal.ui'
import {Icon} from '../../modules/UI/components/Icon/Icon.ui'
// import strings from '../../../../../locales/default'
import THEME from '../../theme/variables/airbitz'
import TwoButtonsComponent from './TwoButtonsComponent.js'

type Props = {
  style: any,
  headerText: string,
  showModal: boolean,
  middleText: string,
  icon: string,
  iconType: string,
  cancelText: string,
  doneText: string,
  onCancel(): void,
  onDone(): void,
  onExitButtonFxn(): void
}

type State = {
}
class TwoButtonTextModalComponent extends Component<Props, State> {
  onDone = () => {
    this.props.onDone()
  }
  renderMiddle = (style: any) => {
    return <View style={style.middle.container} >
      <Text style={style.middle.text}>{this.props.middleText}</Text>
    </View>
  }
  render () {
    const modalBottom = <TwoButtonsComponent
      cancelText={this.props.cancelText}
      doneText={this.props.doneText}
      onDone={this.onDone}
      onCancel={this.props.onCancel} />

    const style = this.props.style
    const icon = <Icon
      style={style.icon}
      name={this.props.icon}
      size={40}
      type={this.props.iconType}/>

    return <StylizedModal
      visibilityBoolean={this.props.showModal}
      featuredIcon={icon}
      headerText={this.props.headerText}
      headerTextStyle={{color: THEME.COLORS.PRIMARY, marginTop: -10, marginBottom: 10}}
      modalMiddle={this.renderMiddle(style)}
      modalBottom={modalBottom}
      onExitButtonFxn={this.props.onCancel} />
  }
}

export { TwoButtonTextModalComponent }

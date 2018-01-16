// @flow

import React, {Component} from 'react'
import {View} from 'react-native'
import s from '../../../../../locales/strings.js'

import StylizedModal from '../../../components/Modal/Modal.ui'
import {Icon} from '../../../components/Icon/Icon.ui'
import * as Constants from '../../../../../constants/indexConstants'
import THEME from '../../../../../theme/variables/airbitz'
import ModalButtons from './ModalButtons.ui'
import {FormField} from '../../../../../components/indexComponents'
import {MaterialInputOnWhite} from '../../../../../styles/indexStyles'

type Props = {
  style: any,
  headerText: string,
  showModal: boolean,
  onCancel(): void,
  onDone(string): void
}

type State = {
  confimPassword: string
}
export default class CryptoExchangeConfirmTransactionModalComponent extends Component<Props, State> {
  componentWillMount () {
    this.setState({
      confimPassword: ''
    })
  }
  textChange = (value: string) => {
    this.setState({
      confimPassword: value
    })
  }
  onDone = () => {
    this.props.onDone(this.state.confimPassword)
  }
  renderMiddle = (style: any) => {
    const formStyle = {...MaterialInputOnWhite,
      container: {...MaterialInputOnWhite.container, width: 244}
    }
    return <View style={style.middle.container} >
      <FormField onChangeText={this.textChange}
        style={formStyle}
        label={s.strings.confirm_password_text}
        value={this.state.confimPassword}
        secureTextEntry
        returnKeyType={'done'}
        onSubmitEditing={this.onDone}
        autoFocus/>
    </View>
  }
  render () {
    const modalBottom = <ModalButtons
      onDone={this.onDone}
      onCancel={this.props.onCancel} />

    const style = this.props.style
    const icon = <Icon
      style={style.icon}
      name={Constants.LOCKED_ICON}
      size={40}
      type={Constants.ION_ICONS}/>

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

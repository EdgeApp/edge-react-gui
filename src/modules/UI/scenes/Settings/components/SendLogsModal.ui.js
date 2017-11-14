import React, {Component} from 'react'

import IonIcon from 'react-native-vector-icons/Ionicons'
import {FormField} from '../../../../../components/FormField.js'
import ModalButtons from './ModalButtons.ui'
import StylizedModal from '../../../components/Modal/Modal.ui'
import styles from './styles'
import THEME from '../../../../../theme/variables/airbitz'

export default class SendLogsModal extends Component {
  state = {
    text: ''
  };

  onDone = () => {
    this.props.onDone(this.state.text)
    this.setState({text: ''})
  }

  onCancel = () => {
    this.props.onCancel()
    this.setState({text: ''})
  }

  onChangeText = (text) => {
    this.setState({text})
  }

  render () {
    const input = <FormField
      style={styles.sendLogsModalInput}
      label='Type some text'
      value={this.state.text}
      onChangeText={this.onChangeText}
      returnKeyType='done'
    />

    const modalBottom = <ModalButtons
      onDone={this.onDone}
      onCancel={this.onCancel} />

    const icon = <IonIcon name='ios-paper-plane-outline' size={24} color='#2A5799'
      style={[{
        position: 'relative',
        top: 12,
        left: 13,
        height: 24,
        width: 24,
        backgroundColor: THEME.COLORS.TRANSPARENT,
        zIndex: 1015,
        elevation: 1015}]} />

    return <StylizedModal visibilityBoolean={this.props.showModal}
      featuredIcon={icon}
      headerText={'settings_modal_send_logs_title'}
      modalMiddle={input}
      modalBottom={modalBottom}
      onExitButtonFxn={this.onCancel}
    />
  }
}

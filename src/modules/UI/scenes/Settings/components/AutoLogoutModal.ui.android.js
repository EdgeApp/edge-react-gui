import React, {Component} from 'react'
import {TextInput} from 'react-native'

import IonIcon from 'react-native-vector-icons/Ionicons'

import ModalButtons from './ModalButtons.ui'
import StylizedModal from '../../../components/Modal/Modal.ui'

import styles from './styles'

export default class AutoLogoutModal extends Component {
  constructor (props) {
    super(props)
    this.state = {
      showModal: props.showModal,
      autoLogoutTimeInMinutes: props.autoLogoutTimeInMinutes
    }
  }

  render () {
    const modalBottom = <ModalButtons
      onDone={() => this.onDone(this.state.autoLogoutTimeInMinutes)}
      onCancel={this.onCancel} />

    const icon = <IonIcon name='ios-time-outline' size={24}
      style={styles.icon} />

    return <StylizedModal visibilityBoolean={this.props.showModal}
      featuredIcon={icon}
      headerText={'Select time before auto logout'}
      headerSubtext={'Select time before auto logout'}
      modalMiddle={<TextInput onSubmitEditing={this.onDone}
        onChangeText={(autoLogoutTimeInMinutes) => this.setState({autoLogoutTimeInMinutes})} />}
      modalBottom={modalBottom} />
  }

  onDone = () => {
    this.setState({showModal: false})
    this.props.onDone(this.state.autoLogoutTimeInMinutes)
  }

  onCancel = () => {
    this.setState({showModal: false})
    this.props.onCancel()
  }
}

import React, {Component} from 'react'
import {Picker} from 'react-native'

import IonIcon from 'react-native-vector-icons/Ionicons'

import strings from '../../../../../locales/default'
import ModalButtons from './ModalButtons.ui'
import StylizedModal from '../../../components/Modal/Modal.ui'

import styles from './styles'

const DISABLE_TEXT = strings.enUS['string_disable']

export default class AutoLogoutModal extends Component {
  constructor (props) {
    super(props)
    this.state = {
      showModal: props.showModal,
      autoLogoutTimeInMinutes: props.autoLogoutTimeInMinutes
    }
  }

  onDone = () => {
    this.setState({showModal: false})
    this.props.onDone(this.state.autoLogoutTimeInMinutes)
  }

  onCancel = () => {
    this.setState({showModal: false})
    this.props.onCancel()
  }

  render () {
    const logoutOptions = [
      {label: DISABLE_TEXT, value: null},
      {label: '1', value: 1},
      {label: '15', value: 15},
      {label: '30', value: 30},
      {label: '45', value: 45},
      {label: '60', value: 60},
      {label: '120', value: 120}
    ]
    const pickerOptions = logoutOptions.map((option) =>
      <Picker.Item label={option.label} value={option.value} key={option.label} />)

    const picker = <Picker
      selectedValue={this.state.autoLogoutTimeInMinutes}
      onValueChange={(autoLogoutTimeInMinutes) => this.setState({autoLogoutTimeInMinutes})}>
      {pickerOptions}
    </Picker>

    const modalBottom = <ModalButtons
      onDone={() => this.onDone(this.state.autoLogoutTimeInMinutes)}
      onCancel={this.onCancel} />

    const icon = <IonIcon name='ios-time-outline' size={24}
      style={styles.icon} />

    return <StylizedModal visibilityBoolean={this.props.showModal}
      featuredIcon={icon}
      headerText={'Select time before auto logout'}
      headerSubtext={'Select time before auto logout'}
      modalMiddle={picker}
      modalBottom={modalBottom}/>
  }
}

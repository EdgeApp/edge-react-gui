import React, {Component} from 'react'
import {Picker} from 'react-native'

import {sprintf} from 'sprintf-js'
import IonIcon from 'react-native-vector-icons/Ionicons'

import strings from '../../../../../locales/default'
import ModalButtons from './ModalButtons.ui'
import StylizedModal from '../../../components/Modal/Modal.ui'

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
    const disabled = sprintf(strings.enUS['string_disable'])
    const logoutOptions = [
      {label: disabled, value: null},
      {label: '1', value: 1},
      {label: '15', value: 15},
      {label: '30', value: 30},
      {label: '45', value: 45},
      {label: '60', value: 60},
      {label: '120', value: 120}
    ]
    const pickerOptions = logoutOptions.map(option => <Picker.Item label={option.label} value={option.value} key={option.label} />)

    const picker = <Picker
      selectedValue={this.state.autoLogoutTimeInMinutes}
      onValueChange={(autoLogoutTimeInMinutes) => this.setState({autoLogoutTimeInMinutes})}>
      {pickerOptions}
    </Picker>

    const modalBottom = <ModalButtons
      onDone={() => this.onDone(this.state.autoLogoutTimeInMinutes)}
      onCancel={this.onCancel} />

    const icon = <IonIcon name='ios-time-outline' size={24} color='#2A5799'
      style={[{
        position: 'relative',
        top: 12,
        left: 13,
        height: 24,
        width: 24,
        backgroundColor: 'transparent',
        zIndex: 1015,
        elevation: 1015}]} />

    return <StylizedModal visibilityBoolean={this.props.showModal}
      featuredIcon={icon}
      headerText={'Select time before auto logout'}
      headerSubtext={'Select time before auto logout'}
      modalMiddle={picker}
      modalBottom={modalBottom}/>
  }
}

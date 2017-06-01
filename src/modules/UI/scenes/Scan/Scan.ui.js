import React, { Component } from 'react'
import { Text, View, TouchableHighlight, TextInput} from 'react-native'
import FormattedText from '../../components/FormattedText'
import LinearGradient from 'react-native-linear-gradient'
import { connect } from 'react-redux'
import FAIcon from 'react-native-vector-icons/FontAwesome'
import MAIcon from 'react-native-vector-icons/MaterialIcons'
import Ionicon from 'react-native-vector-icons/Ionicons'
import ImagePicker from 'react-native-image-picker'
import Modal from 'react-native-modal'
import { Actions } from 'react-native-router-flux'
import Camera from 'react-native-camera'
import WalletTransferList from '../WalletTransferList/WalletTransferList.ui'
import styles from './style'
import { WalletListModalConnect } from '../../components/WalletListModal/WalletListModal.ui'
import { toggleScanToWalletListModal } from '../../components/WalletListModal/action'
import { toggleEnableTorch, toggleAddressModal, updateRecipientAddress, updateUri  } from './action'
import { toggleWalletListModal } from '../WalletTransferList/action'
import { getWalletTransferList } from '../WalletTransferList/middleware'
import StylizedModal from '../../components/Modal/Modal.ui'
import ModalStyle from '../../components/Modal/style'


class Scan extends Component {
  _onToggleTorch () {
    this.props.dispatch(toggleEnableTorch())
  }

  _onToggleAddressModal = () => {
    this.props.dispatch(toggleAddressModal())
  }

  _onToggleWalletListModal () {
    this.props.dispatch(toggleScanToWalletListModal())
  }

  onBarCodeRead = (data) => {
    console.log('onBarCodeRead', data)
    this.props.dispatch(updateUri(data))
    Actions.sendConfirmation()
  }

  selectPhotoTapped = () => {
    const options = { takePhotoButtonTitle: null }

    ImagePicker.showImagePicker(options, (response) => {
      console.log('Response = ', response)

      if (response.didCancel) {
        console.log('User cancelled photo picker')
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error)
      } else if (response.customButton) {
        console.log('User tapped custom button: ', response.customButton)
      } else {
        let source = { uri: response.uri }
        // this.refs.cameraCapture.capture({})
        // You can also display the image using data:
        // let source = { uri: 'data:image/jpeg;base64,' + response.data };

        console.log('response is: ', response)
      }
    })
  }

  render () {
    return (
      <View style={styles.container}>
        <Camera
          style={styles.preview}
          barCodeTypes={['qr']}
          onBarCodeRead={this.onBarCodeRead}
          ref='cameraCapture'
        />      
        <View style={[styles.overlay, this.border('red')]}>
                 
          <WalletAddressModalConnect />

          <View style={[styles.overlayTop, this.border('yellow')]}>
            <FormattedText style={[styles.overlayTopText, this.border('green')]}>Scan, to Send, import, or Edge Login</FormattedText>
          </View>
          <View style={[styles.overlayBlank]} />
          <LinearGradient start={{x: 0, y: 0}} end={{x: 1, y: 0}} colors={['#3B7ADA', '#2B5698']} style={[styles.overlayButtonAreaWrap, this.border('red')]}>
            <TouchableHighlight style={[styles.transferButtonWrap, styles.bottomButton]} onPress={this._onToggleWalletListModal.bind(this)} activeOpacity={0.3} underlayColor={'#FFFFFF'}>
              <View style={styles.bottomButtonTextWrap}>
                <Ionicon name='ios-arrow-round-forward' size={24} style={[styles.transferArrowIcon, this.border('green')]} />
                <FormattedText style={[styles.transferButtonText, styles.bottomButtonText]}>Transfer</FormattedText>
              </View>
            </TouchableHighlight>
            <TouchableHighlight style={[styles.addressButtonWrap, styles.bottomButton, this.border('yellow')]} onPress={this._onToggleAddressModal.bind(this)} activeOpacity={0.3} underlayColor={'#FFFFFF'}>
              <View style={styles.bottomButtonTextWrap}>
                <FAIcon name='address-book-o' size={18} style={[styles.addressBookIcon, this.border('green')]} />
                <FormattedText style={[styles.addressButtonText, styles.bottomButtonText, this.border('purple')]}>Address</FormattedText>
              </View>
            </TouchableHighlight>
            <TouchableHighlight style={[styles.photosButtonWrap, styles.bottomButton]} onPress={this.selectPhotoTapped.bind(this)} activeOpacity={0.3} underlayColor={'#FFFFFF'}>
              <View style={styles.bottomButtonTextWrap}>
                <Ionicon name='ios-camera-outline' size={24} style={[styles.cameraIcon, this.border('green')]} />
                <FormattedText style={[styles.bottomButtonText]}>Photos</FormattedText>
              </View>
            </TouchableHighlight>
            <TouchableHighlight style={[styles.flashButtonWrap, styles.bottomButton]} onPress={this._onToggleTorch.bind(this)} activeOpacity={0.3} underlayColor={'#FFFFFF'}>
              <View style={styles.bottomButtonTextWrap}>
                <Ionicon name='ios-flash-outline' size={24} style={[styles.flashIcon, this.border('green')]} />
                <FormattedText style={[styles.flashButtonText, styles.bottomButtonText]}>Flash</FormattedText>
              </View>
            </TouchableHighlight>
          </LinearGradient>
        </View>
      </View>
    )
  }

  border (color) {
    return {
      borderColor: color,
      borderWidth: 0
    }
  }
}

export default connect(state => ({
  torchEnabled: state.ui.scan.torchEnabled,
  walletListModalVisible: state.ui.walletTransferList.walletListModalVisible,
  scanFromWalletListModalVisibility: state.ui.scan.scanFromWalletListModalVisibility,
  scanToWalletListModalVisibility: state.ui.scan.scanToWalletListModalVisibility
})
)(Scan)

class WalletAddressModal extends Component {
  render() {
    return(
      <StylizedModal 
        featuredIcon={<FAIcon name='address-book-o'size={24} color="#2A5799" style={[{position: 'relative', top:12, left:12, height: 24, width: 24, backgroundColor: 'transparent', zIndex: 1015, elevation: 1015}]} />} 
        headerText='Send to Bitcoin Address or Import Private Key:'
        headerSubtext='' 
        modalMiddle={<AddressInputRecipientConnect />}
        modalBottom={<SendAddressButtonsConnect />}
        visibilityBoolean={this.props.addressModalVisible}
      />         
    )
  }
  border (color) {
    return {
      borderColor: color,
      borderWidth: 0
    }
  }  
}

export const WalletAddressModalConnect = connect( state => ({
  addressModalVisible: state.ui.scan.addressModalVisible,
}))(WalletAddressModal)

class AddressInputRecipient extends Component { // this component is for the input area of the Recipient Address Modal

  _onModalDone = () => {
    this._onToggleAddressModal()
    Actions.sendConfirmation(this.props.receipientAddress)
  }

  _onRecipientAddressChange = (input) => {
    this.props.dispatch(updateRecipientAddress(input))
  }

  render() {
  
    return(
      <View style={[styles.addressInputWrap, this.border('orange')]}>
          <TextInput style={[styles.addressInput, this.border('red')]} onChangeText={(input) => this._onRecipientAddressChange(input)} />
      </View>      
    )
  }

  border (color) {
    return {
      borderColor: color,
      borderWidth: 0
    }
  }  
}

export const AddressInputRecipientConnect = connect( state => ({

}))(AddressInputRecipient)



class SendAddressButtons extends Component { // this component is for the button area of the Recipient Address Modal
  _onModalDone = () => {
    this._onToggleAddressModal()
    Actions.sendConfirmation(this.props.receipientAddress)
  }
  _onToggleAddressModal = () => {
    this.props.dispatch(toggleAddressModal())
  }

  render( ) {
    return(
      <View style={[ModalStyle.buttonsWrap, this.border('gray')]}>
          <TouchableHighlight onPress={this._onToggleAddressModal} style={[ModalStyle.cancelButtonWrap, ModalStyle.stylizedButton]}>
            <View style={ModalStyle.stylizedButtonTextWrap}>
                <FormattedText style={[ModalStyle.cancelButton, ModalStyle.stylizedButtonText]}>Cancel</FormattedText>
            </View>
          </TouchableHighlight>
          <TouchableHighlight onPress={this._onModalDone} style={[ModalStyle.doneButtonWrap, ModalStyle.stylizedButton]}>
            <View style={ModalStyle.stylizedButtonTextWrap}>            
              <FormattedText style={[ModalStyle.doneButton, ModalStyle.stylizedButtonText]}>Done</FormattedText>
            </View>
          </TouchableHighlight>
      </View>       
    )
  }
  border (color) {
    return {
      borderColor: color,
      borderWidth: 0
    }
  }
}

const SendAddressButtonsConnect = connect(state => ({
  receipientAddress: state.ui.scan.recipientAddress,
}))(SendAddressButtons)
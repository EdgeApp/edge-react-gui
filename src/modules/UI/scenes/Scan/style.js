import {
  Dimensions,
  StyleSheet,
  Platform
} from 'react-native'

module.exports = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row'
  },
  preview: {
    flex: 1,
    alignItems: 'center'
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  },
  overlayTop: {
    height: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#58595C',
    opacity: 0.95
  },
  overlayTopText: {
    color: 'white',
    fontSize: 14
  },
  overlayBlank: {
    flex: 10
  },
  overlayButtonAreaWrap: {
    height: 72,
    flexDirection: 'row',
    paddingTop: 11,
    paddingBottom: 11,
    paddingRight: 8,
    paddingLeft: 8
  },
  overLayButtonArea: {
    flex: 1,
    justifyContent: 'center',
    color: 'white',
    flexDirection: 'row',
    alignItems: 'center'
  },
  bottomButton: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 3,
    height: 50,
    marginLeft: 1,
    marginRight: 1
  },
  bottomButtonTextWrap: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  bottomButtonText: {
    opacity: 1,
    color: 'white',
    fontSize: 14,
    backgroundColor: 'transparent'
  },
  transferButtonWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  transferArrowIcon: {
    color: 'white',
    fontSize: 22,
    height: 18,
    transform: [{scaleX: 1.2}]
  },
  addressButtonWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  addressBookIcon: {
    color: 'white',
    fontSize: 16,
    height: 16,
    transform: [{scaleX: -1.0}]
  },
  photosButtonWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  cameraIcon: {
    color: 'white',
    fontSize: 22,
    height: 18
  },
  flashButtonWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  flashIcon: {
    color: 'white',
    fontSize: 22,
    height: 18
  },
  modalContainer: {
    flex: 1,
    alignItems: 'center'
  },
  modalOverlay: {
    flex: 1,
    padding: 10
  },
  modalBox: {
    top: Dimensions.get('window').height / 5,
    borderRadius: 3,
    alignItems: 'stretch',
    height: (Dimensions.get('window').height) / 4,
    backgroundColor: 'white',
    padding: 15,
    flexDirection: 'column',
    justifyContent: 'flex-start'
  },
  modalTopTextWrap: {
    flex: 1
  },
  modalTopText: {
    textAlign: 'center',
    color: '#3c76cd',
    fontWeight: '500'
  },
  modalMiddle: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'center'
  },
  addressInputWrap: {
    marginTop: 8,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    borderBottomColor: '#dddddd',
    borderBottomWidth: (Platform.OS === 'ios') ? 1 : 0
  },
  addressInput: {
    height: 26,
    textAlign: 'center',
    fontSize: 20
  },
  pasteButtonRow: {
    paddingTop: 12
  },
  modalBottom: {
    flex: 1,
    flexDirection: 'row'
  },
  emptyBottom: {
    flex: 1
  },
  buttonsWrap: {
    flex: 1,
    flexDirection: 'row'
  },
  cancelButtonWrap: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-end'
  },
  cancelButton: {
    fontSize: 12,
    color: '#3c76cd'
  },
  doneButtonWrap: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'flex-end'
  },
  doneButton: {
    fontSize: 28,
    color: '#3c76cd'
  }
})

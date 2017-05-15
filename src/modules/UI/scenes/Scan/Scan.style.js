import React from 'react-native'
import {Dimensions, StyleSheet} from 'react-native';

module.exports = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
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
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'transparent'
  },
  overlayTopText: {
    color: 'white'
  },
  overlayBlank: {
    flex: 10
  },
  overlayButtonAreaWrap: {
    flex: 1,
    flexDirection: 'row',
    borderTopColor: '#aaaaaa',
    borderTopWidth: 1
  },
  overLayButtonArea: {
    flex: 1,
    justifyContent: 'center',
    color: 'white',
    flexDirection: 'row',
    alignItems: 'center'
  },
  transferButtonWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightColor: "#aaaaaa",
    borderRightWidth: 1
  },
  addressButtonWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightColor: "#aaaaaa",
    borderRightWidth: 1
  },
  photosButtonWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightColor: "#aaaaaa",
    borderRightWidth: 1
  },
  flashButtonWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  transferButtonText: {
    color: 'white'
  },
  addressButtonText: {
    color: 'white'
  },
  photosButtonText: {
    color: 'white'
  },
  flashButtonText: {
    color: 'white'
  },
  modalElement: {

  },
  modalContainer: {
    flex: 1 ,
    alignItems: 'center'
  },
  modalOverlay: {
    flex: 1,
    padding: 10
  },
  modalBox: {
    top: Dimensions.get('window').height /5,
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

    borderBottomColor: '#dddddd',
    borderBottomWidth: 1,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    flex: 1,

  },
  addressInput: {
    flex: 1,
    textAlign: 'center',
    alignItems: 'center'
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
    fontSize: 12,
    color: '#3c76cd'
  }
})

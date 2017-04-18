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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    borderRadius: 5,
    alignItems: 'stretch',
    height: (Dimensions.get('window').height) / 3,
    backgroundColor: 'white',
    padding: 15,
    flexDirection: 'column',
    justifyContent: 'flex-start'
  },
  modalTopTextWrap: {
    flex: 2
  },
  modalTopText: {
    textAlign: 'center',
    color: 'blue',
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
    flex: 2
  }
})

import React from 'react-native'
import {StyleSheet} from 'react-native';

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
    alignItems: 'center'
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
  }
})

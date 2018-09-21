// @flow

import { StyleSheet } from 'react-native'

import { isIphoneX } from '../../../../lib/isIphoneX.js'
import THEME from '../../../../theme/variables/airbitz.js'

export default StyleSheet.create({
  stylizedModal: {
    top: isIphoneX ? 30 : 0,
    left: 0,
    right: 0
  },
  webView: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1
  },
  modalBottomContainer: {
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center'
  },
  modalBottomText: {
    fontSize: 14,
    color: THEME.COLORS.GRAY_1,
    padding: 4
  },
  modalMiddleWebView: {
    flex: 1
  },
  modalHeaderIcon: {
    top: 0
  },
  modalVisibleStyle: {
    flex: 1,
    top: -27
  },
  modalBoxStyle: {
    flex: 1
  },
  modalContentStyle: {
    flex: 1
  },
  modalBodyStyle: {
    flex: 1
  },
  closeButtonWrap: {
    marginTop: 12,
    width: 100,
    height: 44
  },
  closeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  }
})

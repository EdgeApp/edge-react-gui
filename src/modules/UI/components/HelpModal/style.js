import {StyleSheet} from 'react-native'
import THEME from '../../../../theme/variables/airbitz.js'
import PLATFORM from '../../../../theme/variables/platform.js'

export default StyleSheet.create({
  stylizedModal: {
    height: (PLATFORM.deviceHeight * 2 / 3)
  },
  webView: {
    justifyContent: 'center',
    alignItems:'center',
    height: 240,
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

  },
  modalFeaturedIcon: {
    top: 12,
    left: 12
  },
  closeButtonWrap: {
    marginTop: 12,
    width: 100,
    height: 44,
  },
  closeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  }
})
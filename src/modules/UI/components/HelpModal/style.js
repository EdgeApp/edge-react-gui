import {StyleSheet} from 'react-native'
import THEME from '../../../../theme/variables/airbitz.js'
import PLATFORM from '../../../../theme/variables/platform.js'

export default StyleSheet.create({
  stylizedModal: {
    height: (PLATFORM.deviceHeight * 2 / 3)
  },
  modalBottomContainer: {
    justifyContent: 'center',
    width: '100%',
    height: 90,
    alignItems: 'center'
  },
  modalBottomText: {
    fontSize: 12,
    color: THEME.COLORS.GRAY_1,
    marginBottom: 14
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

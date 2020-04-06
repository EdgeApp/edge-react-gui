// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz'
import { PLATFORM } from '../../theme/variables/platform'
import { scale } from '../../util/scaling.js'

const deviceWidth = PLATFORM.deviceWidth

export const styles = StyleSheet.create({
  image: {
    alignSelf: 'center',
    marginTop: scale(24),
    height: scale(50),
    width: scale(55)
  },
  title: {
    paddingTop: scale(24)
  },
  paddings: {
    paddingVertical: scale(8)
  },
  inputContainer: {
    width: deviceWidth - scale(30) - scale(40),
    marginTop: scale(14),
    marginBottom: scale(8)
  },
  statusIconError: {
    color: THEME.COLORS.ACCENT_RED
  },
  statusIconOk: {
    color: THEME.COLORS.ACCENT_MINT
  },
  formFieldView: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  statusIcon: {
    width: scale(25),
    height: scale(25)
  },
  bottomSpace: {
    paddingBottom: scale(400)
  },
  selectWalletBlock: {
    marginTop: scale(48),
    paddingHorizontal: scale(18),
    paddingBottom: scale(10),
    backgroundColor: THEME.COLORS.GRAY_3
  }
})

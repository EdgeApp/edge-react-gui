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
    width: 'auto',
    marginTop: 0,
    marginBottom: 0
  },
  statusIconError: {
    color: THEME.COLORS.ACCENT_RED
  },
  statusIconOk: {
    color: THEME.COLORS.ACCENT_MINT
  },
  formFieldView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scale(14),
    marginBottom: scale(12)
  },
  formFieldViewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: deviceWidth - scale(30) - scale(40)
  },
  statusIconContainer: {
    width: scale(25),
    height: scale(25)
  },
  statusIcon: {
    alignSelf: 'flex-end',
    marginTop: scale(29),
    width: scale(25),
    height: scale(25)
  },
  bottomSpace: {
    paddingBottom: scale(500)
  },
  selectWalletBlock: {
    marginTop: scale(48),
    paddingHorizontal: scale(18),
    paddingBottom: scale(10),
    backgroundColor: THEME.COLORS.GRAY_3
  },
  selectWalletBtn: {
    marginTop: scale(15),
    paddingVertical: scale(10),
    paddingHorizontal: scale(5),
    backgroundColor: THEME.COLORS.BLUE_3
  },
  domain: {
    marginTop: scale(24),
    marginLeft: scale(5),
    paddingHorizontal: scale(10),
    paddingVertical: scale(4),
    borderRadius: scale(5),
    borderColor: THEME.COLORS.BLUE_3,
    borderWidth: scale(2)
  },
  domainText: {
    color: THEME.COLORS.BLUE_3,
    fontSize: scale(16)
  },
  domainListRowName: {
    flex: 1,
    fontSize: THEME.rem(1.25),
    color: THEME.COLORS.SECONDARY
  },
  domainListRowContainerTop: {
    height: 'auto',
    paddingLeft: THEME.rem(0.75),
    paddingRight: THEME.rem(0.75),
    paddingVertical: THEME.rem(0.75)
  }
})

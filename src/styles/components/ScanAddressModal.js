// @flow

import { MaterialInputStyle } from 'edge-components'
import { StyleSheet } from 'react-native'

import THEME from '../../theme/variables/airbitz.js'
const { rem } = THEME

const tileStyles = {
  width: '100%',
  backgroundColor: THEME.COLORS.WHITE,
  borderBottomWidth: 1,
  borderBottomColor: THEME.COLORS.GRAY_3,
  padding: rem(0.5)
}

export const styles = {
  container: {
    flex: 1,
    width: '100%',
    flexDirection: 'column'
  },
  tileContainerHeader: {
    ...tileStyles
  },
  tileContainerButtons: {
    ...tileStyles,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  tileContainerInput: {
    ...tileStyles,
    paddingTop: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  tileContainer: {
    ...tileStyles,
    flexDirection: 'row',
    alignItems: 'center'
  },
  fioAddressAvatarContainer: {
    width: rem(2.2),
    height: rem(2.2),
    borderRadius: rem(1.1),
    justifyContent: 'center',
    alignItems: 'center'
  },
  fioAddressText: {
    fontSize: rem(1.2),
    paddingLeft: rem(0.8)
  },
  addressModalButton: {
    width: '100%'
  },

  // Accessory Input View
  accessoryView: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: THEME.COLORS.WHITE
  },
  accessoryBtn: {
    padding: rem(0.5)
  },
  accessoryText: {
    color: THEME.COLORS.ACCENT_BLUE,
    fontSize: rem(1)
  }
}

export const addressInputStyles = {
  ...MaterialInputStyle,
  container: {
    ...MaterialInputStyle.container,
    paddingTop: 0
  }
}

export const iconStyles = {
  size: rem(2),
  color: THEME.COLORS.SECONDARY
}

export default StyleSheet.create(styles)

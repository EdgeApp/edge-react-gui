// @flow

import { StyleSheet } from 'react-native'

import THEME from '../../../../../theme/variables/airbitz.js'

export const styles = {
  modal: {
    flex: 1
  },
  container: {
    backgroundColor: THEME.COLORS.WHITE,
    padding: 24,
    borderRadius: 4
  },
  featuredIconContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  },
  featuredIcon: {
    height: 65,
    width: 65,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: THEME.COLORS.SECONDARY,
    backgroundColor: THEME.COLORS.WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -58
  },
  featuredIconTop: {
    height: 28,
    width: '100%',
    backgroundColor: 'transparent'
  },
  featuredIconBottom: {
    height: 28,
    width: '100%',
    backgroundColor: THEME.COLORS.WHITE
  },
  header: {
    height: 50,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.WHITE
  },
  title: {
    fontSize: 20,
    color: THEME.COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center'
  },
  body: {
    backgroundColor: THEME.COLORS.WHITE
  },
  description: {
    fontSize: 16,
    alignSelf: 'center',
    color: THEME.COLORS.GRAY_1
  },
  item: {},
  footer: {
    backgroundColor: THEME.COLORS.WHITE
  },

  exitRow: {
    alignItems: 'flex-end',
    position: 'relative',
    justifyContent: 'center',
    zIndex: 200
  },
  exitRowEmpty: {
    height: 30
  },
  exitButton: {
    backgroundColor: 'transparent',
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center'
  },
  exitText: {
    fontSize: 18,
    backgroundColor: 'transparent',
    color: THEME.COLORS.GRAY_1
  }
}

export const exitColor = THEME.COLORS.GRAY_1

export default StyleSheet.create(styles)

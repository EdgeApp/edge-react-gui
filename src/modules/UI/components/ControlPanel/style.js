// @flow

import THEME from '../../../../theme/variables/airbitz'

export default {
  header: {
    backgroundColor: THEME.COLORS.ACCENT_BLUE,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 12
  },
  logoIcon: {
    width: 25,
    height: 25
  },
  exchangeContainer: {
    paddingHorizontal: 20
  },
  toggleIcon: {
    fontSize: 18,
    color: THEME.COLORS.GRAY_4
  },
  toggleButton: {
    backgroundColor: THEME.COLORS.PRIMARY,
    height: 58,
    justifyContent: 'flex-start',
    alignItems: 'center'
  },

  container: {
    flex: 1,
    alignItems: 'stretch'
  },
  iconImage: {
    width: 22,
    height: 22
  },

  /// ///////////////////////////////////////////////////

  userList: {
    container: {
      backgroundColor: THEME.COLORS.WHITE,
      flex: 1
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      borderStyle: 'solid',
      borderColor: THEME.COLORS.GRAY_4,
      borderBottomWidth: 0.5
    },
    textContainer: {
      flex: 1,
      paddingVertical: 13,
      marginLeft: 20
    },
    text: {
      fontSize: 16
    },
    icon: {
      padding: 13
    }
  },
  underlay: {
    color: `${THEME.COLORS.PRIMARY}${THEME.ALPHA.LOW}`
  },
  debug: {
    borderColor: 'red',
    borderWidth: 1
  }
}

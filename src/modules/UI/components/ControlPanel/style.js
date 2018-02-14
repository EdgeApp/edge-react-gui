import { Platform } from 'react-native'

import THEME from '../../../../theme/variables/airbitz'

const platform = Platform.OS

export default {
  iconImageContainer: {
    paddingHorizontal: 23
  },
  iconImage: {
    width: 25,
    height: 25
  },
  icon: {
    fontSize: 25,
    color: THEME.COLORS.GRAY_4,
    paddingHorizontal: 23
  },
  container: {
    flex: 1,
    alignItems: 'stretch'
  },
  bitcoin: {
    container: {
      backgroundColor: THEME.COLORS.ACCENT_GREEN,
      height: 48,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center'
    },
    icon: {
      color: THEME.COLORS.GRAY_4,
      paddingHorizontal: 23,
      fontSize: 26
    },
    value: {
      flex: 1,
      fontSize: 16,
      color: THEME.COLORS.WHITE,
      justifyContent: 'center',
      alignItems: 'center'
    }
  },
  user: {
    container: {
      backgroundColor: `${THEME.COLORS.WHITE}${THEME.ALPHA.LOW}`,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      height: 58
    },
    name: {
      flex: 1,
      color: THEME.COLORS.WHITE,
      fontSize: 16
    }
  },
  main: {
    container: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'flex-start'
    },
    link: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 10,
      height: 56
    },
    iosTouchableHighlight: {
      flexDirection: 'row'
    },
    iosTouchableHighlightUnderlayColor: 'rgba(255,255,255,0.1)',
    borderVertical: {
      borderStyle: 'solid',
      borderColor: 'rgba(255,255,255,0.2)',
      borderTopWidth: 1,
      borderBottomWidth: 1
    },
    borderBottom: {
      borderStyle: 'solid',
      borderColor: 'rgba(255,255,255,0.2)',
      borderBottomWidth: 1
    },
    icon: {
      flex: 1,
      fontSize: platform !== 'ios' ? 26 : 32,
      paddingHorizontal: 23,
      backgroundColor: THEME.COLORS.TRANSPARENT,
      color: '#FFF'
    },
    textContainer: {
      flex: 8,
      backgroundColor: THEME.COLORS.TRANSPARENT
    },
    text: {
      fontSize: 15,
      color: THEME.COLORS.WHITE
    },
    textItalic: {
      marginTop: 3,
      fontFamily: THEME.FONTS.DEFAULT,
      fontSize: 13,
      color: THEME.COLORS.WHITE
    }
  },
  others: {
    container: {
      flexDirection: 'column',
      alignItems: 'flex-start'
    },
    link: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 10,
      height: 56
    },
    iosTouchableHighlight: {
      flexDirection: 'row'
    },
    iosTouchableHighlightUnderlayColor: 'rgba(255,255,255,0.1)',
    borderVertical: {
      borderStyle: 'solid',
      borderColor: 'rgba(255,255,255,0.2)',
      borderTopWidth: 1,
      borderBottomWidth: 1
    },
    borderBottom: {
      borderStyle: 'solid',
      borderColor: 'rgba(255,255,255,0.2)',
      borderBottomWidth: 1
    },
    icon: {
      flex: 1,
      fontSize: platform !== 'ios' ? 26 : 32,
      paddingHorizontal: 23,
      backgroundColor: THEME.COLORS.TRANSPARENT,
      color: THEME.COLORS.WHITE
    },
    textContainer: {
      flex: 8,
      backgroundColor: THEME.COLORS.TRANSPARENT
    },
    text: {
      fontSize: 15,
      color: THEME.COLORS.WHITE
    },
    textItalic: {
      marginTop: 3,
      fontStyle: 'italic',
      fontSize: 13,
      color: THEME.COLORS.WHITE
    }
  },
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
    text: {
      padding: 13,
      flex: 1
    },
    icon: {
      padding: 13
    }
  },
  underlay: {
    color: `${THEME.COLORS.PRIMARY}${THEME.ALPHA.LOW}`
  }
}

import { Platform } from 'react-native'
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
    color: '#FFF',
    paddingHorizontal: 23
  },
  container: {
    flex: 1,
    alignItems: 'stretch'
  },
  bitcoin: {
    container: {
      backgroundColor: '#7FC343',
      height: 48,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center'
    },
    icon: {
      color: '#FFF',
      paddingHorizontal: 23,
      fontSize: 26
    },
    value: {
      flex: 1,
      fontSize: 16,
      color: '#FFF',
      justifyContent: 'center',
      alignItems: 'center'
    }
  },
  user: {
    container: {
      backgroundColor: '#2B5698',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      height: 58
    },
    name: {
      flex: 1,
      color: '#FFF',
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
      fontSize: (platform !== 'ios') ? 26 : 32,
      paddingHorizontal: 23,
      backgroundColor: 'transparent',
      color: '#FFF'
    },
    textContainer: {
      flex: 8,
      backgroundColor: 'transparent'
    },
    text: {
      fontSize: 15,
      color: '#FFF'
    },
    textItalic: {
      marginTop: 3,
      fontFamily: 'SourceSansPro-Bold',
      fontSize: 13,
      color: '#FFF'
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
      fontSize: (platform !== 'ios') ? 26 : 32,
      paddingHorizontal: 23,
      backgroundColor: 'transparent',
      color: '#FFF'
    },
    textContainer: {
      flex: 8,
      backgroundColor: 'transparent'
    },
    text: {
      fontSize: 15,
      color: '#FFF'
    },
    textItalic: {
      marginTop: 3,
      fontStyle: 'italic',
      fontSize: 13,
      color: '#FFF'
    }
  },
  userList: {
    container: {
      backgroundColor: '#FFF',
      flex: 1
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      borderStyle: 'solid',
      borderColor: '#efefef',
      borderBottomWidth: 0.5
    },
    text: {
      padding: 13,
      flex: 1
    },
    icon: {
      padding: 13
    }
  }
}

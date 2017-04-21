import variables from '../../../native-base-theme/variables/platform'
export default {

  container: {
    flex: 1,
    alignItems: 'stretch',
    backgroundColor: '#FFF'
  },

  bitcoin: {
    container:{
      backgroundColor: '#3A73C8',
      height: variables.toolbarHeight,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20
    },

    value: {
      flex: 1,
      fontSize: 17,
      color: '#FFF',
    }
  },

  user: {
    container: {
      backgroundColor: variables.tabBgColor,
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12
    },

    icon: {
      fontSize: 35,
      marginHorizontal: 15
    },

    name:{
      flex: 1,
      fontSize: 15
    }

  },

  main:{
    container: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'flex-start',
    },

    link: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      // backgroundColor: 'yellow',
      // borderStyle: 'solid',
      // borderColor: '#e3e3e3',
      // borderWidth: 1
    },


    icon: {
      fontSize: 35,
      paddingHorizontal: 15
    },

    text: {
      flex: 1,
      fontSize: 14
    }

  },

  others: {
    container: {
      flexDirection: 'column',
      alignItems: 'flex-start'
    },

    link: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      // borderStyle: 'solid',
      // borderColor: '#e3e3e3',
      // borderWidth: 1
    },

    icon: {
      fontSize: 35,
      paddingHorizontal: 15
    },

    icon_settings: {
      paddingHorizontal: 15
    },

    text: {
      flex: 1,
      fontSize: 14
    }

  },

}

import variables from '../../../../theme/variables/platform'
export default {

  container: {
    flex: 1,
    alignItems: 'stretch',
    marginTop: 20,
  },

  bitcoin: {
    container:{
      backgroundColor: '#7FC343',
      height: 36,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 25
    },

    value: {
      flex: 1,
      fontSize: 15,
      color: '#FFF',
    }
  },

  user: {
    container: {
      backgroundColor: '#2B5698',
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12
    },

    icon: {
      fontSize: 35,
      color: '#FFF',
      marginHorizontal: 15
    },

    name:{
      flex: 1,
      color: '#FFF',
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
      borderStyle: 'solid',
      borderColor: '#efefef',
      borderTopWidth: 0.5,
      borderBottomWidth: 0.5
    },


    icon: {
      flex:1,
      fontSize: 35,
      marginHorizontal: 15
    },

    text: {
      flex: 8,
      fontSize: 13,
      color: "#000"
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
      borderStyle: 'solid',
      borderColor: '#efefef',
      borderTopWidth: 0.5,
      borderBottomWidth: 0.5
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

  userList : {
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      borderStyle: 'solid',
      borderColor: '#efefef',
      borderBottomWidth: 0.5
    },
    text:{
      padding: 13,
      flex: 1
    },
    icon:{
      padding: 13
    }
  }

}

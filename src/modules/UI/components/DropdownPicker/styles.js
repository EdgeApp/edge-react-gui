import {Platform, StyleSheet} from 'react-native'

const styles = StyleSheet.create({
  view: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F6F6F6'
  },
  walletNameInputView: {
    height: 50,
    marginBottom: 10
  },
  walletNameInput: {
    flex: 1,
    padding: 5
  },
  pickerView: {
    marginBottom: 15,
    borderBottomWidth: (Platform.OS === 'ios') ? 1 : 0,
    borderColor: '#CCCCCC'
  },
  picker: {
    height: 50,
    padding: 5
  },
  listView: {
    maxHeight: 200
  },
  listItem: {
    margin: 0,
    padding: 5,
    borderColor: 'grey',
    borderBottomWidth: 1,
    fontSize: 20
  },
  listStyle: {
    position: 'absolute',
    marginBottom: 100,
    paddingBottom: 100
  },
  textInput: {
    flex: 1
  },
  text: {
    color: 'white'
  },
  buttons: {
    marginTop: 24,
    height: 44,
    flexDirection: 'row'
  },
  submit: {
    flex: 1,
    marginLeft: 2,
    backgroundColor: '#4977BB',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  },
  buttonText: {
    color: 'white',
    fontSize: 18
  },
  cancel: {
    flex: 1,
    marginRight: 2,
    backgroundColor: '#909091',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  }
})

export default styles

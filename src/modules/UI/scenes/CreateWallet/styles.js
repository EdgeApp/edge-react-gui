import { StyleSheet} from 'react-native'
import THEME from '../../../../theme/variables/airbitz'

const styles = StyleSheet.create({
  scene: {
    flex: 1,
    backgroundColor: THEME.COLORS.GRAY_4
  },
  gradient: {
    height: 66,
    width: '100%',
    position: 'absolute'
  },
  view: {
    position: 'relative',
    top: 66,
    paddingHorizontal: 20,
    paddingVertical: 5
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
  },
  picker: {
    fontFamily: THEME.FONTS.DEFAULT,
    height: 50,
    padding: 5
  },
  fiatPicker: {
    height: 100
  },
  listView: {
    maxHeight: 100
  },
  listItem: {
    margin: 0,
    padding: 5,
    borderColor: THEME.COLORS.GRAY_3,
    borderBottomWidth: 1,
    fontSize: 20
  },
  textInput: {
    flex: 1
  },
  text: {
    color: THEME.COLORS.WHITE
  },
  buttons: {
    marginTop: 24,
    height: 44,
    flexDirection: 'row'
  },
  submit: {
    flex: 1,
    marginLeft: 2,
    backgroundColor: THEME.COLORS.SECONDARY,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  },
  buttonText: {
    color: THEME.COLORS.WHITE,
    fontSize: 18
  },
  cancel: {
    flex: 1,
    marginRight: 2,
    backgroundColor: THEME.COLORS.GRAY_2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 3
  }
})

export default styles

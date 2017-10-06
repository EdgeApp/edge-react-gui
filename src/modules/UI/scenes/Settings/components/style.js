import {StyleSheet} from 'react-native'
import {colors as c} from '../../../../../theme/variables/airbitz'

export default StyleSheet.create({
  stylizedButtonText: {
    color: 'white',
    fontSize: 16
  },
  cancelButtonWrap: {
    backgroundColor: c.gray2,
    alignSelf: 'flex-start'
  },
  cancelButton: {
    color: '#3c76cd'
  },
  doneButtonWrap: {
    backgroundColor: '#4977BB',
    alignSelf: 'flex-end',
    marginLeft: 4
  },
  doneButton: {
    color: '#3c76cd'
  },
  rowContainer: {
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 15,
    paddingBottom: 15,
    justifyContent: 'space-around'
  },
  rowTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  rowLeftContainer: {
    justifyContent: 'center'
  },
  rowLeftText: {
    color: '#58595C',
    fontSize: 16
  },
  radioButton: {
    height: 24
  },
  sendLogsModalInput: {
    marginBottom:15,
    borderBottomWidth:1,
    borderColor:'#CCCCCC',
    color: '#58595C',
    height: 50,
    padding: 5,
  },
})

import {Component} from 'react'
import {Alert} from 'react-native'
import {connect} from 'react-redux'
import {closeABAlert} from './action.js'

class ABAlert extends Component {
  componentWillReceiveProps (nextProps) {
    if (nextProps.view) {
      return this._openAlert(nextProps)
    }
    if (!nextProps.view) {
      return this._closeAlert()
    }
  }

  _openAlert = (props) => {
    console.log('opening alert, props is: ', props)
    if (!props.buttons) {
      props.buttons = [
        {
          text: 'OK',
          onPress: () => this._closeAlert(),
          style: 'cancel'
        }
      ]
    }
    return Alert.alert(props.title, props.message, props.buttons, {
      onDismiss: () => {
        this._closeAlert()
      }
    })
  }

  _closeAlert = () => {
    return this.props.dispatch(closeABAlert())
  }

  _onPress = (props) => {
    return this._closeAlert()
  }

  render () {
    return null
  }
}
const mapStateToProps = (state) => ({
  view: state.ui.scenes.ABAlert.view,
  message: state.ui.scenes.ABAlert.syntax.message,
  title: state.ui.scenes.ABAlert.syntax.title,
  route: state.ui.scenes.ABAlert.route
})
export default connect(mapStateToProps)(ABAlert)

import React, { Component } from 'react'
import AutoComplete from 'material-ui/AutoComplete'

export default class AutoCompleteInput extends Component {
  componentWillMount () {
    this.setState({
      username: '',
      password: '',
      loggingIn: false,
      focusFirst: true,
      focusSecond: false
      // offset: Offsets.USERNAME_OFFSET_LOGIN_SCREEN
    })
  }
  render () {
    return (
      <div>
        <AutoComplete
          hintText='Type anything'
          dataSource={this.state.dataSource}
          onUpdateInput={this.handleUpdateInput}
          floatingLabelText='Full width'
          fullWidth
        />
      </div>
    )
  }
}

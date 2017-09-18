import React, {Component} from 'react'
import {
  TextInput,
  Text,
  View,
  TouchableHighlight,
  Animated
} from 'react-native'
import strings from '../../../../../locales/default'
import {sprintf} from 'sprintf-js'
import EvilIcons from 'react-native-vector-icons/EvilIcons'
import styles from '../style'
import * as UTILS from '../../../../utils'

export default class SearchBar extends Component {
  constructor (props) {
    super(props)
    this.state = this.props.state
  }

  render () {
    return (
      <View style={[styles.searchContainer, UTILS.border()]}>
        <View style={[styles.innerSearch, UTILS.border()]}>
          <EvilIcons name='search' style={[styles.searchIcon, UTILS.border()]} color='#9C9C9D' size={20} />
          <TextInput style={[styles.searchInput, UTILS.border()]}
            onChangeText={this.props.onSearchChange}
            onBlur={this.props.onBlur}
            onFocus={this.props.onFocus}
            placeholder={sprintf(strings.enUS['string_search'])} />
        </View>

        <Animated.View style={{width: this.state.animation, opacity: this.state.op}}>
          <TouchableHighlight style={[UTILS.border(), styles.cancelButton]}
            onPress={this.props.onPress}>
            <Text style={{color: 'white', backgroundColor: 'transparent'}}>
              {sprintf(strings.enUS['string_cancel_cap'])}
            </Text>
          </TouchableHighlight>
        </Animated.View>
      </View>
    )
  }
}
